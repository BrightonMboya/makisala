import 'server-only';
import { env } from '@/lib/env';
import { renderProposalPdfViaCloudflare } from './cloudflare-render';
import { getPdfObject, putPdfObject } from '@/lib/storage';

/** Turn a proposal title into a safe, readable PDF filename. */
export function proposalPdfFilename(title: string): string {
  const base =
    title
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 80) || 'proposal';
  return `${base}.pdf`;
}

type ProposalPrintTarget = {
  id: string;
  /** Proposal display language; anything other than `en` is passed to the print route. */
  language?: string | null;
  /** Used as a cache-buster so an edited proposal re-renders instead of reusing Cloudflare's cache. */
  updatedAt?: Date | string | null;
};

/**
 * Build the publicly-reachable print URL Cloudflare renders into a PDF.
 *
 * Cloudflare caches the rendered PDF by full URL, so we key it on the proposal's
 * updatedAt: an unchanged proposal reuses the cache (near-instant), an edited one
 * gets a fresh URL and re-renders. Without this a re-render after an edit could
 * serve a stale PDF.
 */
export function buildProposalPrintUrl({ id, language, updatedAt }: ProposalPrintTarget): string {
  const params = new URLSearchParams();
  if (language && language !== 'en') params.set('lang', language);
  if (updatedAt) params.set('v', String(new Date(updatedAt).getTime()));
  const qs = params.toString();
  return `${env.NEXT_PUBLIC_APP_URL}/proposal/${id}/print${qs ? `?${qs}` : ''}`;
}

/**
 * Render a proposal to a PDF via Cloudflare Browser Rendering, returning the bytes
 * plus a client-facing filename. Throws if the render fails (callers decide whether
 * that's fatal, e.g. the email send treats it as best-effort).
 */
export async function renderProposalPdf(
  target: ProposalPrintTarget & { title: string },
): Promise<{ filename: string; pdf: Uint8Array }> {
  const printUrl = buildProposalPrintUrl(target);
  const { pdf } = await renderProposalPdfViaCloudflare(printUrl);
  return { filename: proposalPdfFilename(target.title), pdf };
}

// --- Cached render (Option B) -------------------------------------------------
// A rendered PDF is ~15s of Cloudflare work, so we cache it in R2 and reuse it.
// Key is stable per (proposal, language) — one object, overwritten in place, so
// edits never accumulate stale copies. The proposal's updatedAt is stored as a
// `version` metadata tag; a stored object whose version differs from the current
// proposal is stale and gets re-rendered. Language lives in the key (not the
// version) so switching languages doesn't discard the other language's PDF.

/** Content version tag for a proposal: its updatedAt in epoch ms, or '0'. */
function proposalVersion(updatedAt: ProposalPrintTarget['updatedAt']): string {
  return updatedAt ? String(new Date(updatedAt).getTime()) : '0';
}

/** Stable R2 key for a proposal's PDF in a given language. */
function proposalPdfKey(id: string, language?: string | null): string {
  return `proposals/${id}/${language || 'en'}.pdf`;
}

export type ProposalPdfResult = {
  filename: string;
  pdf: Uint8Array;
  /** Where the bytes came from: an R2 cache hit, or a fresh Cloudflare render. */
  source: 'r2' | 'rendered';
  /** Render wall-clock in ms (0 on an R2 hit). */
  renderMs: number;
};

/**
 * Return the proposal PDF, serving a fresh R2 copy when one exists for the current
 * version and re-rendering (then caching) otherwise. R2 read/write failures never
 * block the result: a read error falls through to a render, a write error is
 * swallowed after the bytes are already in hand.
 */
export async function getOrRenderProposalPdf(
  target: ProposalPrintTarget & { title: string },
): Promise<ProposalPdfResult> {
  const version = proposalVersion(target.updatedAt);
  const key = proposalPdfKey(target.id, target.language);

  try {
    const stored = await getPdfObject(key);
    if (stored && stored.metadata.version === version) {
      return {
        filename: stored.metadata.filename || proposalPdfFilename(target.title),
        pdf: stored.body,
        source: 'r2',
        renderMs: 0,
      };
    }
  } catch {
    // R2 read hiccup — treat as a miss and render fresh.
  }

  const started = performance.now();
  const { filename, pdf } = await renderProposalPdf(target);
  const renderMs = Math.round(performance.now() - started);

  // Cache for next time. Best-effort: never fail the response over a write error.
  try {
    await putPdfObject({ key, file: pdf, metadata: { version, filename } });
  } catch {
    // ignore
  }

  return { filename, pdf, source: 'rendered', renderMs };
}
