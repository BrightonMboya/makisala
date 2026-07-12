import 'server-only';
import { env } from '@/lib/env';
import { renderProposalPdfViaCloudflare } from './cloudflare-render';

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
