'use client';

// Plain, component-scoped CSS ([data-re-*] / .tiptap / .ProseMirror + --re-*
// variables) — no Tailwind preflight, safe to load globally. This is the whole
// reason we can drop the old vendored/scoped-CSS machinery.
import '@react-email/editor/themes/default.css';
// Editor-only chrome (variable pill, min-height) — colocated so it ships with
// the editor chunk rather than going through the Tailwind globals pipeline.
import './email-body-editor.css';

import { EmailEditor, type EmailEditorRef } from '@react-email/editor';
import { StarterKit } from '@react-email/editor/extensions';
import { EmailTheming, extendTheme } from '@react-email/editor/plugins';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Variable } from './variable-node';
import {
  PROPOSAL_EMAIL_VARIABLES,
  defaultProposalEmailBody,
  type EditorNode,
} from '@/lib/email/proposal-email-body';

const VARIABLE_LABELS: Record<string, string> = Object.fromEntries(
  PROPOSAL_EMAIL_VARIABLES.map((v) => [v.name, v.label]),
);

// Brand the serialized email on top of the built-in "basic" theme: green CTA
// button + green links, matching the app's accent. Everything else inherits
// basic's email-safe defaults.
const brandTheme = extendTheme('basic', {
  button: {
    backgroundColor: '#15803d',
    color: '#ffffff',
    borderRadius: '8px',
    padding: '12px 32px',
    fontWeight: '600',
  },
  link: { color: '#15803d' },
});

export interface EmailBodyEditorHandle {
  /** Rendered email HTML (with `{{variable}}` tokens) for preview + send. */
  getHtml: () => Promise<string>;
}

export interface EmailBodyEditorProps {
  /** Initial editor content (Tiptap JSON), or null to seed the default. */
  value: EditorNode | null;
  /**
   * Resolved values shown in place of variable pills (e.g. the real client
   * name). Read once at mount, so the parent should hold rendering until these
   * are ready.
   */
  variableValues: Record<string, string>;
  /** Fires on every edit with the full document JSON (for autosave). */
  onChange: (json: EditorNode) => void;
}

/**
 * Rich WYSIWYG composer for the share email, built on `@react-email/editor`.
 * Personalization fields ({{clientName}}, {{proposalUrl}}, …) are inserted as
 * pills via the toolbar and resolved to real values server-side, so what's
 * composed here is what the client receives.
 */
export const EmailBodyEditor = forwardRef<EmailBodyEditorHandle, EmailBodyEditorProps>(
  function EmailBodyEditor({ value, variableValues, onChange }, ref) {
    const editorRef = useRef<EmailEditorRef | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        async getHtml() {
          const r = editorRef.current;
          if (!r) return '';
          // getEmail() returns { html, text, unformattedHtml }; unformattedHtml
          // is smaller (no Prettier indentation) and better for sending.
          const res = (await (
            r as unknown as { getEmail: () => Promise<{ unformattedHtml?: string }> }
          ).getEmail()) as { unformattedHtml?: string };
          return res.unformattedHtml ?? (await r.getEmailHTML());
        },
      }),
      [],
    );

    return (
      <EmailEditor
        ref={editorRef}
        theme={brandTheme}
        content={(value ?? defaultProposalEmailBody()) as unknown as never}
        extensions={[
          StarterKit.configure(),
          EmailTheming.configure({ theme: brandTheme }),
          Variable.configure({ values: variableValues, labels: VARIABLE_LABELS }),
        ]}
        onUpdate={(r) => onChange(r.getJSON() as EditorNode)}
        className="re-email-editor"
      />
    );
  },
);
