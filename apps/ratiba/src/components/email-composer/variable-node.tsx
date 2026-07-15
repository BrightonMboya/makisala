import { EmailNode } from '@react-email/editor/core';
import { variableToken } from '@/lib/email/proposal-email-body';

export interface VariableOptions {
  /** Resolved display values by variable name (e.g. { clientName: 'Brighton Mboya' }). */
  values: Record<string, string>;
  /** Human labels by variable name, shown when a value isn't available yet. */
  labels: Record<string, string>;
}

/**
 * Inline `variable` node for the share-email composer.
 *
 * In the editor it renders the RESOLVED value as a green pill (e.g. the real
 * client name) so non-technical operators read a finished email, not template
 * syntax. When the email is rendered (`ref.getEmail()` -> `composeReactEmail`),
 * `renderToReactEmail` emits the literal `{{name}}` token instead, which the
 * server swaps for the authoritative value at send time — keeping one source of
 * truth for the values actually sent.
 *
 * It must be built with `EmailNode` (not a plain Tiptap node) or the serializer
 * silently drops it from the email HTML.
 */
export const Variable = EmailNode.create<VariableOptions>({
  name: 'variable',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,

  addOptions() {
    return { values: {}, labels: {} };
  },

  addAttributes() {
    return {
      name: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-variable]' }];
  },

  renderHTML({ node }) {
    const name = String(node.attrs.name ?? '');
    // Prefer the resolved value; fall back to the human label, then the raw name.
    const display = this.options.values[name] || this.options.labels[name] || name;
    return ['span', { 'data-variable': name, class: 're-variable-pill' }, display];
  },

  renderToReactEmail: ({ node }) => variableToken(String(node.attrs?.name ?? '')),
});
