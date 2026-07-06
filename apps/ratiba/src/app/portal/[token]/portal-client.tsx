'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { CheckCircle2, FileCheck2, LogOut, Pencil, Plus, Trash2, UserPlus } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { Badge } from '@repo/ui/badge';
import { useToast } from '@repo/ui/use-toast';
import { TRPCClientError } from '@trpc/client';
import { trpc } from '@/lib/trpc';
import type { RouterOutputs } from '@/lib/trpc';
import { TravelerDialog } from './traveler-dialog';

type Portal = RouterOutputs['portals']['getByToken'];
type Traveler = Portal['travelers'][number];

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-sm">
      <span className="w-32 shrink-0 text-stone-500">{label}</span>
      <span className="text-stone-800">{value}</span>
    </div>
  );
}

function fmtDate(value: string | null | undefined) {
  if (!value) return null;
  try {
    return format(new Date(value), 'd MMM yyyy');
  } catch {
    return value;
  }
}

export function PortalClient({ token, initial }: { token: string; initial: Portal }) {
  const router = useRouter();
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const { data } = trpc.portals.getByToken.useQuery({ token }, { initialData: initial });
  const removeMutation = trpc.portals.removeTraveler.useMutation();
  const submitMutation = trpc.portals.submit.useMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Traveler | null>(null);

  const portal = data ?? initial;
  const travelers = portal.travelers;
  const isSubmitted = portal.status === 'submitted';

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(t: Traveler) {
    setEditing(t);
    setDialogOpen(true);
  }

  async function handleRemove(t: Traveler) {
    if (!confirm(`Remove ${t.fullName} from this trip?`)) return;
    try {
      await removeMutation.mutateAsync({ token, travelerId: t.id });
      await utils.portals.getByToken.invalidate({ token });
      toast({ title: 'Traveler removed' });
    } catch (error) {
      const message = error instanceof TRPCClientError ? error.message : 'Failed to remove';
      toast({ title: message, variant: 'destructive' });
    }
  }

  async function handleSubmit() {
    try {
      await submitMutation.mutateAsync({ token });
      await utils.portals.getByToken.invalidate({ token });
      toast({ title: 'Details submitted. Thank you!' });
    } catch (error) {
      const message = error instanceof TRPCClientError ? error.message : 'Failed to submit';
      toast({ title: message, variant: 'destructive' });
    }
  }

  async function signOut() {
    await fetch(`/api/portal/${token}/logout`, { method: 'POST' });
    router.refresh();
  }

  const dueDate = fmtDate(portal.dueDate);

  return (
    <div className="min-h-screen bg-stone-50 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl px-4">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {portal.orgLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={portal.orgLogo}
                alt={portal.orgName}
                className="h-12 w-12 rounded-full border border-stone-200 object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <span className="font-serif text-lg font-bold text-green-800">
                  {portal.orgName[0]?.toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="text-sm text-stone-500">{portal.orgName}</p>
              <h1 className="font-serif text-2xl font-bold text-stone-900">{portal.tripName}</h1>
            </div>
          </div>
        </header>

        {portal.sessionEmail ? (
          <div className="mb-6 flex items-center justify-between rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm">
            <span className="text-stone-500">
              Signed in as <span className="text-stone-800">{portal.sessionEmail}</span>
            </span>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-1 text-stone-500 hover:text-stone-800"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        ) : null}

        {/* Intro card */}
        <div className="mb-6 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-900">Traveler details</h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            {portal.welcomeMessage ||
              'Please add everyone traveling on this trip and fill in their passport details and preferences. One person can complete this for the whole group.'}
          </p>
          {dueDate ? (
            <p className="mt-3 text-sm font-medium text-amber-700">
              Please complete by {dueDate}.
            </p>
          ) : null}
        </div>

        {isSubmitted ? (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
            <div>
              <p className="font-medium text-green-900">Details submitted</p>
              <p className="text-sm text-green-800">
                Thank you. {portal.orgName} has received your details. You can still make changes
                below if anything needs updating.
              </p>
            </div>
          </div>
        ) : null}

        {/* Travelers */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-medium text-stone-700">
            {travelers.length === 0
              ? 'No travelers added yet'
              : `${travelers.length} traveler${travelers.length === 1 ? '' : 's'}`}
          </p>
          <Button size="sm" variant="outline" onClick={openAdd}>
            <Plus className="mr-1 h-4 w-4" /> Add traveler
          </Button>
        </div>

        {travelers.length === 0 ? (
          <button
            onClick={openAdd}
            className="mb-6 flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-stone-300 bg-white py-12 text-stone-500 transition-colors hover:border-green-400 hover:text-green-700"
          >
            <UserPlus className="h-8 w-8" />
            <span className="text-sm font-medium">Add your first traveler</span>
          </button>
        ) : (
          <div className="mb-6 space-y-3">
            {travelers.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-stone-900">{t.fullName}</h3>
                    {t.isLead ? <Badge variant="secondary">Lead</Badge> : null}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => openEdit(t)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-red-600 hover:text-red-700"
                      onClick={() => handleRemove(t)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
                  <DetailRow label="Nationality" value={t.nationality} />
                  <DetailRow label="Date of birth" value={fmtDate(t.dateOfBirth)} />
                  <DetailRow label="Passport no." value={t.passportNumber} />
                  <DetailRow label="Passport expiry" value={fmtDate(t.passportExpiry)} />
                  <DetailRow label="Dietary" value={t.dietaryPreferences} />
                  <DetailRow label="Allergies" value={t.allergies} />
                  <DetailRow label="Arrival" value={t.arrivalDetails} />
                </div>
                {t.hasScan ? (
                  <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-green-700">
                    <FileCheck2 className="h-3.5 w-3.5" /> Passport scan uploaded
                  </p>
                ) : !t.passportNumber || !t.nationality ? (
                  <p className="mt-3 text-xs text-amber-600">
                    Passport details still needed. Tap the pencil to complete.
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {/* Submit */}
        {travelers.length > 0 ? (
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-stone-600">
              Once everyone is added and their details are complete, submit so {portal.orgName} can
              finalize your trip. You can still edit afterward.
            </p>
            <Button
              className="mt-4 w-full bg-green-700 hover:bg-green-800"
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending
                ? 'Submitting...'
                : isSubmitted
                  ? 'Re-submit updated details'
                  : 'Submit details'}
            </Button>
          </div>
        ) : null}

        <p className="mt-8 text-center text-xs text-stone-400">
          Your information is encrypted and shared only with {portal.orgName} to arrange your trip.
        </p>
      </div>

      <TravelerDialog
        token={token}
        traveler={editing}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
