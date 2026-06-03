'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Textarea } from '@repo/ui/textarea';
import { Label } from '@repo/ui/label';
import { Badge } from '@repo/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/ui/alert-dialog';
import { toast } from '@repo/ui/toast';
import { Lock, Pencil, Plus, Trash2 } from 'lucide-react';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@/server/trpc/router';
import { trpc } from '@/lib/trpc';
import { PaymentMethodBrand } from '@/components/proposal/PaymentMethodBrand';

type ListOutput = inferRouterOutputs<AppRouter>['paymentMethods']['list'];
type PaymentMethodRow = ListOutput['methods'][number];

const METHOD_TYPES = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'pesapal', label: 'Pesapal' },
  { value: 'stripe', label: 'Stripe / Card Link' },
  { value: 'paypal', label: 'PayPal' },
] as const;

type MethodType = (typeof METHOD_TYPES)[number]['value'];

const LINK_TYPES: MethodType[] = ['pesapal', 'stripe', 'paypal'];

interface Props {
  initialData: ListOutput;
}

const EMPTY_DRAFT = { type: 'bank_transfer' as MethodType, label: '', instructions: '', url: '' };

export function PaymentMethodsSettings({ initialData }: Props) {
  const utils = trpc.useUtils();
  const { data } = trpc.paymentMethods.list.useQuery(undefined, { initialData });

  const methods = data?.methods ?? [];
  const locked = Boolean(data?.lockedAt);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [requestReason, setRequestReason] = useState('');

  const invalidate = () => utils.paymentMethods.list.invalidate();

  const createMutation = trpc.paymentMethods.create.useMutation();
  const updateMutation = trpc.paymentMethods.update.useMutation();
  const deleteMutation = trpc.paymentMethods.delete.useMutation();
  const confirmMutation = trpc.paymentMethods.confirm.useMutation();
  const requestChangeMutation = trpc.paymentMethods.requestChange.useMutation();

  const resetDraft = () => {
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
    setShowAddForm(false);
  };

  async function saveDraft() {
    if (!draft.label.trim()) {
      toast({ title: 'Label is required', variant: 'destructive' });
      return;
    }
    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          type: draft.type,
          label: draft.label.trim(),
          instructions: draft.instructions,
          url: draft.url,
        });
        toast({ title: 'Payment method updated' });
      } else {
        await createMutation.mutateAsync({
          type: draft.type,
          label: draft.label.trim(),
          instructions: draft.instructions,
          url: draft.url,
        });
        toast({ title: 'Payment method added' });
      }
      await invalidate();
      resetDraft();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save payment method';
      toast({ title: message, variant: 'destructive' });
    }
  }

  function startEdit(method: PaymentMethodRow) {
    setEditingId(method.id);
    setShowAddForm(false);
    setDraft({
      type: method.type as MethodType,
      label: method.label,
      instructions: method.instructions ?? '',
      url: method.url ?? '',
    });
  }

  async function removeMethod(id: string) {
    try {
      await deleteMutation.mutateAsync({ id });
      await invalidate();
      toast({ title: 'Payment method removed' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove payment method';
      toast({ title: message, variant: 'destructive' });
    }
  }

  async function confirmAndLock() {
    try {
      await confirmMutation.mutateAsync();
      await invalidate();
      setConfirmOpen(false);
      toast({ title: 'Payment details confirmed and locked' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to confirm payment details';
      toast({ title: message, variant: 'destructive' });
    }
  }

  async function requestChange() {
    try {
      await requestChangeMutation.mutateAsync({ reason: requestReason.trim() || undefined });
      setRequestReason('');
      toast({
        title: 'Change request sent',
        description: 'The Ratiba team will review your request and unlock your payment details.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send request';
      toast({ title: message, variant: 'destructive' });
    }
  }

  const isLinkType = LINK_TYPES.includes(draft.type);

  const draftForm = (
    <div className="space-y-4 rounded-lg border border-stone-200 bg-stone-50 p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select
            value={draft.type}
            onValueChange={(value) => setDraft((d) => ({ ...d, type: value as MethodType }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METHOD_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  <span className="flex h-5 items-center">
                    <PaymentMethodBrand type={t.value} size="sm" />
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Label</Label>
          <Input
            value={draft.label}
            onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
            placeholder='e.g. "Bank Transfer (USD)"'
          />
        </div>
      </div>

      {isLinkType && (
        <div className="space-y-2">
          <Label>Payment link</Label>
          <Input
            value={draft.url}
            onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))}
            placeholder="https://..."
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>{isLinkType ? 'Instructions (optional)' : 'Details / instructions'}</Label>
        <Textarea
          rows={isLinkType ? 2 : 5}
          value={draft.instructions}
          onChange={(e) => setDraft((d) => ({ ...d, instructions: e.target.value }))}
          placeholder={
            isLinkType
              ? 'Any notes shown alongside the payment link.'
              : 'Account name, account number, bank, SWIFT/branch, reference, etc.'
          }
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={resetDraft}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={saveDraft}
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {editingId ? 'Save changes' : 'Add method'}
        </Button>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>
              Add the payout details clients use to pay you directly. We don&apos;t process
              payments. These details are shown to a client after they confirm a proposal.
            </CardDescription>
          </div>
          {locked && (
            <Badge variant="secondary" className="shrink-0 gap-1">
              <Lock className="h-3 w-3" /> Locked
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {locked && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-medium">Payment details are locked for security.</p>
            <p className="mt-1 text-amber-800">
              To protect against payout tampering, these can&apos;t be edited once confirmed.
              Request a change below and the Ratiba team will verify and unlock them.
            </p>
          </div>
        )}

        {methods.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-6 text-center text-sm text-stone-500">
            No payment methods yet. Add one so clients can pay you directly.
          </p>
        ) : (
          <ul className="space-y-3">
            {methods.map((method) => (
              <li key={method.id} className="rounded-lg border border-stone-200 p-4">
                {editingId === method.id ? (
                  draftForm
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex h-6 items-center">
                        <PaymentMethodBrand type={method.type} size="md" />
                      </div>
                      <p className="mt-1 font-medium text-stone-900">{method.label}</p>
                      {method.instructions && (
                        <p className="mt-1 text-sm whitespace-pre-line text-stone-600">
                          {method.instructions}
                        </p>
                      )}
                      {method.url && (
                        <p className="mt-1 truncate text-sm text-stone-500">{method.url}</p>
                      )}
                    </div>
                    {!locked && (
                      <div className="flex shrink-0 gap-1">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(method)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => removeMethod(method.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {!locked && (
          <>
            {showAddForm ? (
              draftForm
            ) : (
              editingId === null && (
                <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
                  <Plus className="mr-1 h-4 w-4" /> Add payment method
                </Button>
              )
            )}

            {methods.length > 0 && (
              <div className="flex items-center justify-between gap-4 border-t border-stone-200 pt-6">
                <p className="text-sm text-stone-500">
                  Confirm to lock these details. After locking, changes require a request to the
                  Ratiba team.
                </p>
                <Button onClick={() => setConfirmOpen(true)} className="shrink-0">
                  <Lock className="mr-1 h-4 w-4" /> Confirm &amp; lock
                </Button>
              </div>
            )}
          </>
        )}

        {locked && (
          <div className="space-y-3 border-t border-stone-200 pt-6">
            <Label>Request a change</Label>
            <Textarea
              rows={3}
              value={requestReason}
              onChange={(e) => setRequestReason(e.target.value)}
              placeholder="Briefly describe the change you need (optional)."
            />
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={requestChange}
                disabled={requestChangeMutation.isPending}
              >
                {requestChangeMutation.isPending ? 'Sending...' : 'Request change'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm and lock payment details?</AlertDialogTitle>
            <AlertDialogDescription>
              Double-check every detail. Once confirmed, you won&apos;t be able to edit your
              payment methods yourself. Unlocking requires emailing the Ratiba team to verify the
              change. This protects you and your clients against payout tampering.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAndLock} disabled={confirmMutation.isPending}>
              {confirmMutation.isPending ? 'Locking...' : 'Confirm & lock'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
