'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/dialog';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Combobox } from '@repo/ui/combobox';
import { DatePicker } from '@repo/ui/date-picker';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form';
import { toast } from '@repo/ui/toast';
import { Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { staleTimes } from '@/lib/query-keys';
import { toLocalISOString } from '@/lib/date-utils';

const schema = z
  .object({
    mode: z.enum(['existing', 'new']),
    clientId: z.string().optional(),
    newClientName: z.string().optional(),
    newClientEmail: z.string().optional(),
    newClientPhone: z.string().optional(),
    tourTitle: z.string().min(1, 'Tour title is required'),
    travelers: z.number().int().min(1, 'At least 1 traveler is required'),
    startDate: z.date({ message: 'Start date is required' }),
  })
  .superRefine((d, ctx) => {
    if (d.mode === 'existing') {
      if (!d.clientId) {
        ctx.addIssue({ code: 'custom', message: 'Select a client', path: ['clientId'] });
      }
      return;
    }
    // New client: name and a valid email are required, phone is optional.
    if (!d.newClientName || d.newClientName.trim().length === 0) {
      ctx.addIssue({ code: 'custom', message: 'Client name is required', path: ['newClientName'] });
    }
    if (!d.newClientEmail || d.newClientEmail.trim().length === 0) {
      ctx.addIssue({ code: 'custom', message: 'Email is required', path: ['newClientEmail'] });
    } else if (!z.string().email().safeParse(d.newClientEmail.trim()).success) {
      ctx.addIssue({ code: 'custom', message: 'Enter a valid email', path: ['newClientEmail'] });
    }
  });

type FormValues = z.infer<typeof schema>;

/**
 * Duplicate a proposal in a single flow: pick or create a client, set the party
 * size and start date, then land straight in the new copy's day-by-day builder.
 * Overrides are applied server-side by `proposals.duplicate`, so the copy loads
 * with these values already persisted.
 */
export function DuplicateProposalDialog({
  proposalId,
  defaultTitle,
  open,
  onOpenChange,
}: {
  proposalId: string;
  defaultTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();

  const { data: clientsData } = trpc.clients.list.useQuery(
    { limit: 100 },
    { staleTime: staleTimes.clients, enabled: open },
  );
  const clients = clientsData?.clients ?? [];

  const createClient = trpc.clients.create.useMutation();
  const duplicate = trpc.proposals.duplicate.useMutation();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      mode: 'existing',
      clientId: '',
      newClientName: '',
      newClientEmail: '',
      newClientPhone: '',
      tourTitle: defaultTitle,
      travelers: 2,
      startDate: undefined,
    },
  });

  const mode = form.watch('mode');

  const onSubmit = async (values: FormValues) => {
    try {
      let clientId = values.clientId || undefined;

      if (values.mode === 'new' && values.newClientName?.trim()) {
        const created = await createClient.mutateAsync({
          name: values.newClientName.trim(),
          email: values.newClientEmail?.trim() || undefined,
          phone: values.newClientPhone?.trim() || undefined,
        });
        clientId = created.id;
      }

      const result = await duplicate.mutateAsync({
        proposalId,
        clientId: clientId ?? null,
        tourTitle: values.tourTitle,
        // Serialize the picked local day pinned to noon UTC so it can't drift a
        // day backwards in negative-offset conversions (toISOString would).
        startDate: toLocalISOString(values.startDate),
        travelerGroups: [{ id: '1', count: values.travelers, type: 'Adult' }],
      });

      onOpenChange(false);
      router.push(`/itineraries/${result.newProposalId}/day-by-day`);
    } catch (error) {
      toast({
        title: 'Failed to duplicate proposal',
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Duplicate proposal</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            {/* Client */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => form.setValue('mode', 'existing')}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${mode === 'existing' ? 'bg-green-100 text-green-800' : 'text-stone-600 hover:bg-stone-100'}`}
                >
                  Existing client
                </button>
                <button
                  type="button"
                  onClick={() => {
                    form.setValue('mode', 'new');
                    form.setValue('clientId', '');
                  }}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${mode === 'new' ? 'bg-green-100 text-green-800' : 'text-stone-600 hover:bg-stone-100'}`}
                >
                  New client
                </button>
              </div>

              {mode === 'existing' ? (
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client *</FormLabel>
                      <FormControl>
                        <Combobox
                          items={clients.map((c) => ({ value: c.id, label: c.name }))}
                          value={field.value || null}
                          onChange={field.onChange}
                          placeholder="Search clients..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <>
                  <FormField
                    control={form.control}
                    name="newClientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. Jane Doe" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="newClientEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="jane@example.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="newClientPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone (optional)</FormLabel>
                          <FormControl>
                            <Input {...field} type="tel" placeholder="+255 ..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}
            </div>

            <FormField
              control={form.control}
              name="tourTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tour title *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start date *</FormLabel>
                    <FormControl>
                      <DatePicker date={field.value} setDate={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="travelers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Travelers *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 border-t pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="gap-2 bg-green-700 hover:bg-green-800"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Duplicate & edit
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
