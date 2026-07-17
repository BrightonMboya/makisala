import 'server-only';
import { env } from '@/lib/env';
import { getPdfObject, putPdfObject } from '@/lib/storage';
import { createServerCaller } from '@/server/trpc/caller';
import { transformProposalToItineraryData } from '@/lib/proposal-transform';
import { renderProposalPdf as renderProposalDocument } from './proposal/render';

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
  language?: string | null;
  updatedAt?: Date | string | null;
};

/**
 * Render a proposal to a PDF, returning the bytes plus a client-facing filename.
 * Throws if the render fails; callers decide whether that's fatal (the email send
 * treats it as best-effort).
 */
export async function renderProposalPdf(
  target: ProposalPrintTarget & { title: string },
): Promise<{ filename: string; pdf: Uint8Array }> {
  const trpc = await createServerCaller();
  const proposal = await trpc.proposals.getById({ id: target.id });
  if (!proposal) throw new Error(`Proposal ${target.id} not found`);

  const language = target.language || 'en';
  const translation =
    language === 'en'
      ? null
      : await trpc.translations.getTranslation({ proposalId: target.id, language });

  const data = transformProposalToItineraryData(proposal, translation);
  const pdf = await renderProposalDocument(data);

  return { filename: proposalPdfFilename(target.title), pdf };
}

// --- Cached render -------------------------------------------------------------
// A render is a few seconds of CPU plus every image fetch, so it's worth caching.
// The key is stable per (proposal, language): one object, overwritten in place, so
// edits never accumulate stale copies. Language lives in the key rather than the
// version so switching languages doesn't discard the other language's PDF.

/**
 * Bump whenever the PDF layer changes in a way that should invalidate cached copies.
 * updatedAt alone describes the proposal's content, not the code that rendered it,
 * so without this a shipped change keeps serving old PDFs for every proposal that
 * hasn't been edited since.
 */
const RENDERER_VERSION = 3;

/** Content version tag: the proposal's updatedAt in epoch ms, plus the renderer. */
function proposalVersion(updatedAt: ProposalPrintTarget['updatedAt']): string {
  const stamp = updatedAt ? String(new Date(updatedAt).getTime()) : '0';
  return `${stamp}-r${RENDERER_VERSION}`;
}

/** Stable R2 key for a proposal's PDF in a given language. */
function proposalPdfKey(id: string, language?: string | null): string {
  return `proposals/${id}/${language || 'en'}.pdf`;
}

export type ProposalPdfResult = {
  filename: string;
  pdf: Uint8Array;
  /** Where the bytes came from: an R2 cache hit, or a fresh render. */
  source: 'r2' | 'rendered';
  /** Render wall-clock in ms (0 on an R2 hit). */
  renderMs: number;
};

/**
 * Serves a fresh R2 copy when one exists for the current version, re-rendering and
 * caching otherwise. R2 failures never block the result.
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
