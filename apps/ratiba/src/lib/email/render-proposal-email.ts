import { PROPOSAL_EMAIL_VARIABLES } from './proposal-email-body';

export interface ProposalEmailVariables {
  clientName: string;
  agencyName: string;
  proposalTitle: string;
  proposalUrl: string;
  startDate?: string;
  duration?: string;
}

const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;',
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch] ?? ch);
}

/**
 * Substitute the `{{variable}}` tokens in the operator-composed email HTML
 * (produced client-side by `@react-email/editor`) with this proposal's real
 * values. Shared by the live preview endpoint and the actual send, so what the
 * operator previews is exactly what the client receives.
 *
 * Values are HTML-escaped, which is also correct inside the CTA anchor's `href`
 * (the token sits in an attribute context). Unknown tokens are left untouched.
 */
export function substituteProposalEmailHtml(
  html: string,
  variables: ProposalEmailVariables,
): string {
  const values: Record<string, string> = {
    clientName: variables.clientName,
    agencyName: variables.agencyName,
    proposalTitle: variables.proposalTitle,
    proposalUrl: variables.proposalUrl,
    startDate: variables.startDate ?? '',
    duration: variables.duration ?? '',
  };
  const known = new Set(PROPOSAL_EMAIL_VARIABLES.map((v) => v.name));

  return html.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    known.has(name) ? escapeHtml(values[name] ?? '') : match,
  );
}
