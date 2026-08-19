'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@repo/ui/button';
import { useToast } from '@repo/ui/use-toast';
import { authClient } from '@/lib/auth-client';

type PublicClient = {
  client_id?: string;
  client_name?: string;
  client_uri?: string;
  logo_uri?: string;
  name?: string;
  uri?: string;
  icon?: string;
};

function formatScope(scope: string): string {
  return scope.replace(/[-_]/g, ' ').replace(/^./, (c) => c.toUpperCase());
}

export default function ConsentPage() {
  return (
    <Suspense fallback={<ConsentSkeleton />}>
      <ConsentForm />
    </Suspense>
  );
}

function ConsentSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-2/3 rounded bg-stone-200" />
          <div className="h-4 w-full rounded bg-stone-200" />
          <div className="h-10 rounded bg-stone-200" />
        </div>
      </div>
    </div>
  );
}

function ConsentForm() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('client_id');
  const scopeParam = searchParams.get('scope') ?? '';
  const claimsParam = searchParams.get('claims');
  const requestedScopes = scopeParam.split(' ').filter(Boolean);

  const [client, setClient] = useState<PublicClient | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingClient, setLoadingClient] = useState(true);
  const [submitting, setSubmitting] = useState<'accept' | 'deny' | null>(null);

  useEffect(() => {
    if (!clientId) {
      setLoadError('This link is missing required information. Please restart the connection from your MCP client.');
      setLoadingClient(false);
      return;
    }
    authClient.oauth2
      .publicClient({ query: { client_id: clientId } })
      .then((res) => {
        if (res.error) {
          setLoadError(res.error.message ?? 'Could not load the app requesting access.');
        } else {
          setClient(res.data as PublicClient);
        }
      })
      .catch(() => setLoadError('Could not load the app requesting access.'))
      .finally(() => setLoadingClient(false));
  }, [clientId]);

  async function respond(accept: boolean) {
    setSubmitting(accept ? 'accept' : 'deny');
    try {
      const res = await authClient.oauth2.consent({
        accept,
        scope: requestedScopes.length ? requestedScopes.join(' ') : undefined,
        claims: claimsParam ?? undefined,
      });
      // The endpoint's documented response field is `redirect_uri`, but the
      // shipped implementation actually returns `{ redirect, url }` (see
      // better-auth/better-auth#10880). Handle both shapes defensively.
      const data = res.data as { redirect_uri?: string; url?: string } | undefined;
      const redirectUrl = data?.url ?? data?.redirect_uri;
      if (res.error || !redirectUrl) {
        toast({
          title: 'Something went wrong',
          description: res.error?.message ?? 'Could not complete the request. Please try again.',
          variant: 'destructive',
        });
        setSubmitting(null);
        return;
      }
      window.location.href = redirectUrl;
    } catch {
      toast({
        title: 'Something went wrong',
        description: 'Could not complete the request. Please try again.',
        variant: 'destructive',
      });
      setSubmitting(null);
    }
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 p-4">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <h1 className="font-serif text-2xl font-bold text-green-800">Ratiba</h1>
          <p className="text-stone-600">{loadError}</p>
        </div>
      </div>
    );
  }

  const displayName = client?.client_name ?? client?.name ?? clientId ?? 'An app';

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="font-serif text-2xl font-bold text-green-800">Ratiba</h1>
        </div>

        {loadingClient ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-full rounded bg-stone-200" />
            <div className="h-4 w-2/3 rounded bg-stone-200" />
          </div>
        ) : (
          <>
            <p className="text-center text-stone-700">
              <span className="font-semibold">{displayName}</span> wants to access your Ratiba
              account.
            </p>

            {requestedScopes.length > 0 && (
              <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                <p className="mb-2 text-sm font-medium text-stone-700">This will allow it to:</p>
                <ul className="space-y-1 text-sm text-stone-600">
                  {requestedScopes.map((scope) => (
                    <li key={scope} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-stone-400" />
                      {formatScope(scope)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                disabled={submitting !== null}
                onClick={() => respond(false)}
              >
                {submitting === 'deny' ? 'Denying…' : 'Deny'}
              </Button>
              <Button className="flex-1" disabled={submitting !== null} onClick={() => respond(true)}>
                {submitting === 'accept' ? 'Approving…' : 'Approve'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
