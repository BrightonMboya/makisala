'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  FileText,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { Button } from '@repo/ui/button';
import { Badge } from '@repo/ui/badge';
import { Input } from '@repo/ui/input';
import { Textarea } from '@repo/ui/textarea';
import { Label } from '@repo/ui/label';
import { useToast } from '@repo/ui/use-toast';
import { TRPCClientError } from '@trpc/client';
import { trpc } from '@/lib/trpc';
import type { RouterOutputs } from '@/lib/trpc';

type Portal = RouterOutputs['portals']['getById'];
type Traveler = Portal['travelers'][number];

function fmt(value: string | null | undefined) {
  if (!value) return null;
  // Date-like strings render as dates; everything else passes through.
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    try {
      return format(new Date(value), 'd MMM yyyy');
    } catch {
      return value;
    }
  }
  return value;
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs tracking-wide text-stone-400 uppercase">{label}</p>
      <p className="text-sm text-stone-800">{fmt(value) || <span className="text-stone-300">—</span>}</p>
    </div>
  );
}

function TravelerCard({ t }: { t: Traveler }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <h3 className="text-base font-semibold text-stone-900">{t.fullName}</h3>
        {t.isLead ? <Badge variant="secondary">Lead</Badge> : null}
      </div>

      <p className="mb-2 text-xs font-semibold tracking-wide text-stone-500 uppercase">Passport</p>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Field label="Nationality" value={t.nationality} />
        <Field label="Date of birth" value={t.dateOfBirth} />
        <Field label="Gender" value={t.gender} />
        <Field label="Passport no." value={t.passportNumber} />
        <Field label="Issuing country" value={t.passportIssuingCountry} />
        <Field label="Expiry" value={t.passportExpiry} />
      </div>

      <p className="mb-2 text-xs font-semibold tracking-wide text-stone-500 uppercase">
        Preferences & health
      </p>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Dietary" value={t.dietaryPreferences} />
        <Field label="Allergies" value={t.allergies} />
        <Field label="Medical notes" value={t.medicalNotes} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field
          label="Emergency contact"
          value={
            [t.emergencyContactName, t.emergencyContactPhone].filter(Boolean).join(' · ') || null
          }
        />
        <Field label="Arrival" value={t.arrivalDetails} />
        <Field label="Special requests" value={t.specialRequests} />
      </div>

      {t.hasScan ? (
        <a
          href={`/api/portal/scan/${t.id}`}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-stone-200 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          <FileText className="h-4 w-4" /> View passport scan
        </a>
      ) : null}
    </div>
  );
}

export function PortalDetail({
  initial,
  baseUrl,
}: {
  initial: Portal;
  baseUrl: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const { data } = trpc.portals.getById.useQuery({ id: initial.id }, { initialData: initial });
  const portal = data ?? initial;

  const [copied, setCopied] = useState(false);
  const [tripName, setTripName] = useState(portal.tripName);
  const [leadEmail, setLeadEmail] = useState(portal.leadEmail ?? '');
  const [welcomeMessage, setWelcomeMessage] = useState(portal.welcomeMessage ?? '');
  const [dueDate, setDueDate] = useState(portal.dueDate ? portal.dueDate.slice(0, 10) : '');
  const [expiresAt, setExpiresAt] = useState(
    portal.expiresAt ? portal.expiresAt.slice(0, 10) : '',
  );

  const updateMutation = trpc.portals.updateSettings.useMutation();
  const deleteMutation = trpc.portals.delete.useMutation();
  const regenMutation = trpc.portals.regenerateLink.useMutation();

  const shareUrl = `${baseUrl}/portal/${portal.shareToken}`;

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast({ title: 'Link copied' });
  }

  async function saveSettings() {
    try {
      await updateMutation.mutateAsync({
        id: portal.id,
        tripName: tripName.trim() || undefined,
        leadEmail: leadEmail.trim() ? leadEmail.trim() : null,
        welcomeMessage: welcomeMessage.trim() ? welcomeMessage.trim() : null,
        dueDate: dueDate || null,
        // Store end-of-day so the chosen date stays valid through that day.
        expiresAt: expiresAt ? `${expiresAt}T23:59:59.000Z` : null,
      });
      await utils.portals.getById.invalidate({ id: portal.id });
      toast({ title: 'Saved' });
    } catch (error) {
      const message = error instanceof TRPCClientError ? error.message : 'Failed to save';
      toast({ title: message, variant: 'destructive' });
    }
  }

  async function regenerate() {
    if (!confirm('Generate a new link? The old link will stop working.')) return;
    try {
      await regenMutation.mutateAsync({ id: portal.id });
      await utils.portals.getById.invalidate({ id: portal.id });
      toast({ title: 'New link generated' });
    } catch {
      toast({ title: 'Failed to regenerate link', variant: 'destructive' });
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this portal and all traveler details? This cannot be undone.')) return;
    try {
      await deleteMutation.mutateAsync({ id: portal.id });
      toast({ title: 'Portal deleted' });
      router.push('/portals');
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  }

  const statusBadge =
    portal.status === 'submitted' ? (
      <Badge className="bg-green-100 text-green-800">Submitted</Badge>
    ) : portal.status === 'in_progress' ? (
      <Badge className="bg-amber-100 text-amber-800">In progress</Badge>
    ) : (
      <Badge variant="secondary">Not started</Badge>
    );

  return (
    <div className="p-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/portals"
          className="mb-4 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800"
        >
          <ArrowLeft className="h-4 w-4" /> Client Portals
        </Link>

        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-stone-900">{portal.tripName}</h1>
              {statusBadge}
            </div>
            <p className="mt-1 text-stone-600">
              {portal.client?.name ? `Lead client: ${portal.client.name}` : 'No client linked'}
              {portal.submittedAt
                ? ` · Submitted ${format(new Date(portal.submittedAt), 'd MMM yyyy')}`
                : ''}
            </p>
          </div>
          <Button variant="ghost" className="text-red-600 hover:text-red-700" onClick={handleDelete}>
            <Trash2 className="mr-1 h-4 w-4" /> Delete
          </Button>
        </div>

        {/* Share link */}
        <div className="mb-6 rounded-xl border border-stone-200 bg-white p-5">
          <Label className="mb-2 block">Share this link with your client</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input readOnly value={shareUrl} className="font-mono text-xs" />
            <div className="flex gap-2">
              <Button variant="outline" onClick={copyLink}>
                {copied ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <a href={shareUrl} target="_blank" rel="noreferrer">
                <Button variant="outline">
                  <ExternalLink className="mr-1 h-4 w-4" /> Open
                </Button>
              </a>
            </div>
          </div>
          <p className="mt-3 flex items-start gap-1.5 text-xs text-stone-500">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
            {portal.leadEmail ? (
              <span>
                Only <span className="font-medium text-stone-700">{portal.leadEmail}</span> can
                unlock this, after verifying by email. Passport details are encrypted at rest.
              </span>
            ) : (
              <span className="text-amber-600">
                No lead email set. Add one in Settings below so your client can access the portal.
              </span>
            )}
          </p>
          <button
            onClick={regenerate}
            className="mt-3 inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800"
          >
            <RefreshCw className="h-3 w-3" /> Generate a new link
          </button>
        </div>

        {/* Travelers */}
        <h2 className="mb-3 text-lg font-semibold text-stone-900">
          Travelers ({portal.travelers.length})
        </h2>
        {portal.travelers.length === 0 ? (
          <div className="mb-6 rounded-xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center text-sm text-stone-500">
            No details submitted yet. Once your client fills in the portal, everyone shows up here.
          </div>
        ) : (
          <div className="mb-8 space-y-3">
            {portal.travelers.map((t) => (
              <TravelerCard key={t.id} t={t} />
            ))}
          </div>
        )}

        {/* Access log */}
        {portal.events.length > 0 ? (
          <>
            <h2 className="mb-3 text-lg font-semibold text-stone-900">Access log</h2>
            <div className="mb-8 overflow-hidden rounded-xl border border-stone-200 bg-white">
              {portal.events.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between border-b border-stone-100 px-4 py-2 text-sm last:border-0"
                >
                  <span className="font-medium text-stone-700">{EVENT_LABEL[ev.event] ?? ev.event}</span>
                  <span className="text-stone-500">
                    {ev.email ? `${ev.email} · ` : ''}
                    {ev.createdAt ? format(new Date(ev.createdAt), 'd MMM, HH:mm') : ''}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : null}

        {/* Settings */}
        <h2 className="mb-3 text-lg font-semibold text-stone-900">Settings</h2>
        <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-5">
          <div>
            <Label className="mb-1.5 block">Trip name</Label>
            <Input value={tripName} onChange={(e) => setTripName(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block">Lead traveler email</Label>
            <Input
              type="email"
              value={leadEmail}
              onChange={(e) => setLeadEmail(e.target.value)}
              placeholder="lead@example.com"
            />
            <p className="mt-1 text-xs text-stone-500">
              The only address allowed to unlock this portal. They verify by email to access it.
            </p>
          </div>
          <div>
            <Label className="mb-1.5 block">Welcome message</Label>
            <Textarea
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              rows={3}
              placeholder="Shown to your client at the top of the portal."
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block">Complete by</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block">Link expires</Label>
              <Input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              className="bg-green-700 hover:bg-green-800"
              onClick={saveSettings}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save settings'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const EVENT_LABEL: Record<string, string> = {
  code_requested: 'Access code requested',
  verified: 'Verified & unlocked',
  submitted: 'Details submitted',
  scan_uploaded: 'Passport scan uploaded',
  failed: 'Failed attempt',
  rate_limited: 'Rate limited',
};
