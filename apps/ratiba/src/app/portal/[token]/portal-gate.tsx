'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MailCheck, ShieldCheck } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import { useToast } from '@repo/ui/use-toast';

interface PortalGateProps {
  token: string;
  tripName: string;
  orgName: string;
  orgLogo: string | null;
  emailHint: string | null;
  hasLeadEmail: boolean;
  linkError?: boolean;
}

export function PortalGate({
  token,
  tripName,
  orgName,
  orgLogo,
  emailHint,
  hasLeadEmail,
  linkError,
}: PortalGateProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/portal/${token}/request-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error ?? 'Something went wrong', variant: 'destructive' });
        return;
      }
      setStep('code');
      toast({ title: 'Check your email for a link and a code.' });
    } catch {
      toast({ title: 'Network error. Try again.', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/portal/${token}/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error ?? 'Incorrect code', variant: 'destructive' });
        return;
      }
      router.refresh();
    } catch {
      toast({ title: 'Network error. Try again.', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          {orgLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={orgLogo}
              alt={orgName}
              className="mb-3 h-14 w-14 rounded-full border border-stone-200 object-cover"
            />
          ) : (
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <span className="font-serif text-xl font-bold text-green-800">
                {orgName[0]?.toUpperCase()}
              </span>
            </div>
          )}
          <p className="text-sm text-stone-500">{orgName}</p>
          <h1 className="font-serif text-2xl font-bold text-stone-900">{tripName}</h1>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          {linkError ? (
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              That link has expired or was already used. Request a new one below.
            </div>
          ) : null}

          {!hasLeadEmail ? (
            <div className="text-center">
              <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-stone-400" />
              <p className="text-sm text-stone-600">
                This portal isn&apos;t ready for access yet. Please contact {orgName} for your link.
              </p>
            </div>
          ) : step === 'email' ? (
            <form onSubmit={requestCode}>
              <div className="mb-4 flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
                <p className="text-sm text-stone-600">
                  To protect your passport details, verify your email to continue. Enter the email{' '}
                  {orgName} has on file
                  {emailHint ? (
                    <>
                      {' '}
                      (<span className="font-medium text-stone-800">{emailHint}</span>)
                    </>
                  ) : null}
                  .
                </p>
              </div>
              <Label className="mb-1.5 block">Your email</Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
              />
              <Button
                type="submit"
                disabled={busy}
                className="mt-4 w-full bg-green-700 hover:bg-green-800"
              >
                {busy ? 'Sending...' : 'Send me a secure link'}
              </Button>
            </form>
          ) : (
            <form onSubmit={verifyCode}>
              <div className="mb-4 flex items-start gap-3">
                <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
                <p className="text-sm text-stone-600">
                  We emailed a secure link and a 6-digit code to{' '}
                  <span className="font-medium text-stone-800">{email}</span>. Click the link, or
                  enter the code here.
                </p>
              </div>
              <Label className="mb-1.5 block">6-digit code</Label>
              <Input
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                autoFocus
                className="text-center text-lg tracking-[0.4em]"
              />
              <Button
                type="submit"
                disabled={busy || code.length !== 6}
                className="mt-4 w-full bg-green-700 hover:bg-green-800"
              >
                {busy ? 'Verifying...' : 'Unlock my trip details'}
              </Button>
              <button
                type="button"
                onClick={() => setStep('email')}
                className="mt-3 w-full text-center text-xs text-stone-500 hover:text-stone-800"
              >
                Use a different email
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-stone-400">
          Your details are encrypted and shared only with {orgName}.
        </p>
      </div>
    </div>
  );
}
