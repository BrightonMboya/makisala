'use client';

import { useRef, useState } from 'react';
import { FileCheck2, Upload } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { useToast } from '@repo/ui/use-toast';
import { trpc } from '@/lib/trpc';

export const SCAN_ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf';
export const SCAN_MAX_BYTES = 10 * 1024 * 1024; // keep in sync with the upload route

/**
 * Post a passport scan to the session-gated upload route, which encrypts it at
 * rest. Throws with a human-readable message on failure. Shared by the inline
 * card button and the traveler dialog's save flow.
 */
export async function uploadPassportScan(token: string, travelerId: string, file: File) {
  const body = new FormData();
  body.append('file', file);
  body.append('travelerId', travelerId);
  const res = await fetch(`/api/portal/${token}/upload`, { method: 'POST', body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.error === 'string' ? data.error : 'Upload failed');
  }
}

interface ScanUploadProps {
  token: string;
  travelerId: string;
  hasScan: boolean;
  scanName?: string | null;
  /** Compact variant for inline use on a traveler card. */
  compact?: boolean;
}

/**
 * Client-facing passport scan uploader. Posts to the session-gated upload route,
 * which encrypts the bytes at rest. Used both in the traveler dialog and inline
 * on each traveler card so a scan can be attached without reopening the editor.
 */
export function ScanUpload({ token, travelerId, hasScan, scanName, compact }: ScanUploadProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset the input up front so re-selecting the same file still fires onChange.
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;

    if (file.size > SCAN_MAX_BYTES) {
      toast({ title: 'File must be under 10MB.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      await uploadPassportScan(token, travelerId, file);
      await utils.portals.getByToken.invalidate({ token });
      toast({ title: 'Passport scan uploaded' });
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : 'Upload failed',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  }

  const input = (
    <input
      ref={fileRef}
      type="file"
      accept={SCAN_ACCEPT}
      className="hidden"
      onChange={handleUpload}
    />
  );

  if (compact) {
    return (
      <div className="mt-3">
        {input}
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-green-700 disabled:opacity-60"
        >
          {hasScan ? (
            <FileCheck2 className="h-3.5 w-3.5 text-green-700" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          {uploading
            ? 'Uploading...'
            : hasScan
              ? 'Replace passport scan'
              : 'Upload passport scan'}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-stone-300 p-3">
      {hasScan ? (
        <p className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-green-700">
          <FileCheck2 className="h-4 w-4" />
          {scanName || 'Scan uploaded'}
        </p>
      ) : (
        <p className="mb-2 text-sm text-stone-500">
          Optional. Upload a photo or PDF of the passport photo page.
        </p>
      )}
      {input}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="mr-1 h-4 w-4" />
        {uploading ? 'Uploading...' : hasScan ? 'Replace scan' : 'Upload scan'}
      </Button>
    </div>
  );
}
