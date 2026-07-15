'use client';

import { useRef, useState } from 'react';
import { Paperclip, X, Loader2, FileText, Image as ImageIcon } from 'lucide-react';
import { toast } from '@repo/ui/toast';
import type { EmailAttachment } from '@repo/db/schema';

const ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp,.gif,.docx,.xlsx,.pptx';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(contentType: string): boolean {
  return contentType.startsWith('image/');
}

export interface EmailAttachmentsProps {
  proposalId: string;
  value: EmailAttachment[];
  onChange: (attachments: EmailAttachment[]) => void;
}

/**
 * Lets the operator attach additional files (visas, invoices, photos) to the
 * share email. Uploads straight to R2 via the proposal attachments route; the
 * proposal PDF is attached automatically at send time and is not listed here.
 */
export function EmailAttachments({ proposalId, value, onChange }: EmailAttachmentsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removingKey, setRemovingKey] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const added: EmailAttachment[] = [];
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append('file', file);
        const res = await fetch(`/api/proposal/${proposalId}/attachments`, {
          method: 'POST',
          body: form,
        });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          error?: string;
          attachment?: EmailAttachment;
        };
        if (!res.ok || !data.ok || !data.attachment) {
          toast({
            title: `Couldn't attach ${file.name}`,
            description: data.error || 'Upload failed.',
            variant: 'destructive',
          });
          continue;
        }
        added.push(data.attachment);
      }
      if (added.length > 0) {
        onChange([...value, ...added]);
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = async (attachment: EmailAttachment) => {
    setRemovingKey(attachment.key);
    try {
      // Best-effort R2 cleanup; drop from the list regardless so the UI stays
      // responsive even if the delete call fails (the object is namespaced and
      // simply won't be attached anymore).
      await fetch(`/api/proposal/${proposalId}/attachments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: attachment.key }),
      }).catch(() => {});
      onChange(value.filter((a) => a.key !== attachment.key));
    } finally {
      setRemovingKey(null);
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {value.length > 0 && (
        <ul className="mb-3 space-y-2">
          {value.map((a) => (
            <li
              key={a.key}
              className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                {isImage(a.contentType) ? (
                  <ImageIcon className="h-4 w-4 shrink-0 text-stone-400" />
                ) : (
                  <FileText className="h-4 w-4 shrink-0 text-stone-400" />
                )}
                <span className="truncate text-sm text-stone-700">{a.filename}</span>
                <span className="shrink-0 text-xs text-stone-400">{formatSize(a.size)}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(a)}
                disabled={removingKey === a.key}
                className="shrink-0 rounded-md p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
                aria-label={`Remove ${a.filename}`}
              >
                {removingKey === a.key ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 rounded-lg border border-dashed border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-600 hover:border-stone-400 hover:bg-stone-50 disabled:opacity-60"
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Paperclip className="h-4 w-4" />
        )}
        {uploading ? 'Uploading…' : 'Add attachment'}
      </button>
      <p className="mt-2 text-xs text-stone-400">
        PDF, images, or Office docs up to 15MB each. The proposal PDF is attached
        automatically.
      </p>
    </div>
  );
}
