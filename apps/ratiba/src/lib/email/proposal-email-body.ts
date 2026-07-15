/**
 * Shared definition of the share-email body composed in the react-email editor.
 *
 * Framework-agnostic (no React, no editor runtime) so it can be imported both on
 * the client (to seed a fresh editor) and on the server (to substitute variable
 * tokens at send time).
 *
 * The body is composed in `@react-email/editor` (Tiptap v3) and rendered to
 * email-safe HTML on the client via `ref.getEmail()`. Personalization fields
 * appear as an inline `variable` node that serializes to a literal `{{name}}`
 * token in that HTML; the server swaps each token for the real value at send +
 * preview time (see `render-proposal-email.ts`). Keep this variable list in sync
 * with the values the send/preview routes provide.
 */

// Minimal structural type for a Tiptap document node. We avoid importing
// `@tiptap/core`'s `JSONContent` (not directly resolvable under the app's
// isolated install) so this stays a zero-runtime-dep module.
export interface EditorNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: EditorNode[];
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
}

export interface EmailVariable {
  /** Token id used in the document and by the server substitution. */
  name: string;
  /** Human-facing label shown on the insert chip / pill. */
  label: string;
}

/**
 * Variables the operator can insert and that the server resolves at send time.
 * Their values come from the proposal + client + organization.
 */
export const PROPOSAL_EMAIL_VARIABLES: EmailVariable[] = [
  { name: 'clientName', label: 'Client name' },
  { name: 'agencyName', label: 'Agency name' },
  { name: 'proposalTitle', label: 'Proposal title' },
  { name: 'proposalUrl', label: 'Proposal link' },
  { name: 'startDate', label: 'Start date' },
  { name: 'duration', label: 'Duration' },
];

/** The literal token a `variable` node serializes to in the email HTML. */
export function variableToken(name: string): string {
  return `{{${name}}}`;
}

/**
 * Whether a saved body is in the current `@react-email/editor` format. Older
 * drafts composed in the previous Maily editor use node types we no longer
 * support (e.g. `spacer`) and a different `variable` attr shape; those are
 * rejected so the editor seeds the current default instead of a broken doc.
 */
export function isSupportedEmailBody(node: unknown): node is EditorNode {
  if (!node || typeof node !== 'object') return false;
  const doc = node as EditorNode;
  if (doc.type !== 'doc' || !Array.isArray(doc.content)) return false;
  const hasLegacyNode = (n: EditorNode): boolean => {
    if (n.type === 'spacer') return true;
    if (n.type === 'variable' && n.attrs && 'id' in n.attrs && !('name' in n.attrs)) return true;
    return Array.isArray(n.content) ? n.content.some(hasLegacyNode) : false;
  };
  return !doc.content.some(hasLegacyNode);
}

function variable(name: string): EditorNode {
  return { type: 'variable', attrs: { name } };
}

function text(value: string): EditorNode {
  return { type: 'text', text: value };
}

function paragraph(content: EditorNode[]): EditorNode {
  return { type: 'paragraph', content };
}

// Default intro copy, mirroring the prior default so existing sends read the same.
const DEFAULT_INTRO_PARAGRAPHS = [
  "Thank you for choosing us to plan your unforgettable journey! We've carefully crafted this personalized travel proposal based on your preferences and dreams.",
  "Inside, you'll find a detailed day-by-day itinerary, handpicked accommodations, exciting activities, and transparent pricing.",
  'Please take your time to review the proposal. If you have any questions or would like to make adjustments, simply reply to this email. We are here to make your trip absolutely perfect.',
];

/**
 * Seed document for a fresh share email: greeting, intro, the proposal title +
 * dates, the primary CTA button (its href is the `proposalUrl` token, swapped
 * server-side), and a sign-off.
 */
export function defaultProposalEmailBody(): EditorNode {
  return {
    type: 'doc',
    content: [
      paragraph([text('Dear '), variable('clientName'), text(',')]),
      ...DEFAULT_INTRO_PARAGRAPHS.map((p) => paragraph([text(p)])),
      { type: 'heading', attrs: { level: 2 }, content: [variable('proposalTitle')] },
      paragraph([variable('startDate'), text('  ·  '), variable('duration')]),
      {
        type: 'button',
        attrs: { href: variableToken('proposalUrl'), alignment: 'center', class: 'button' },
        content: [text('View Your Proposal')],
      },
      paragraph([
        text(
          'Have questions? Simply reply to this email or leave a comment directly on your proposal.',
        ),
      ]),
      paragraph([text('Warm regards,')]),
      paragraph([variable('agencyName')]),
    ],
  };
}
