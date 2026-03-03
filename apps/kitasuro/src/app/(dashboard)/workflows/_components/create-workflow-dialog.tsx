'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Textarea } from '@repo/ui/textarea';
import { Label } from '@repo/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select';
import { Plus } from 'lucide-react';
import { trpc } from '@/lib/trpc';

const TRIGGER_OPTIONS = [
  { value: 'proposal_completed', label: 'Proposal Completed' },
  { value: 'proposal_accepted', label: 'Proposal Accepted' },
  { value: 'proposal_shared', label: 'Proposal Shared' },
  { value: 'trip_ended', label: 'Trip Ended' },
  { value: 'trip_starting_soon', label: 'Trip Starting Soon' },
] as const;

const RECIPIENT_OPTIONS = [
  { value: 'client', label: 'Client' },
  { value: 'team', label: 'Team (notification email)' },
] as const;

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional(),
  triggerType: z.enum([
    'proposal_completed',
    'proposal_accepted',
    'proposal_shared',
    'trip_ended',
    'trip_starting_soon',
  ]),
  delayDays: z.number().int().min(0).max(365).optional(),
  emailSubject: z.string().min(1, 'Subject is required').max(200),
  emailBody: z.string().min(1, 'Body is required').max(5000),
  recipientType: z.enum(['client', 'team']),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateWorkflowDialog() {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      triggerType: 'proposal_completed',
      delayDays: 0,
      emailSubject: '',
      emailBody: '',
      recipientType: 'client',
    },
  });

  const createMutation = trpc.workflows.create.useMutation({
    onSuccess: () => {
      utils.workflows.list.invalidate();
      setOpen(false);
      form.reset();
    },
  });

  const onSubmit = (values: FormValues) => {
    createMutation.mutate({
      name: values.name,
      description: values.description,
      triggerType: values.triggerType,
      triggerConfig: values.delayDays ? { delayDays: values.delayDays } : undefined,
      actionType: 'send_email',
      actionConfig: {
        emailSubject: values.emailSubject,
        emailBody: values.emailBody,
        recipientType: values.recipientType,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Workflow
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Workflow</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...form.register('name')} placeholder="e.g., Post-trip review request" />
            {form.formState.errors.name && (
              <p className="mt-1 text-xs text-red-600">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Input id="description" {...form.register('description')} placeholder="Brief description" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Trigger</Label>
              <Select
                value={form.watch('triggerType')}
                onValueChange={(v) => form.setValue('triggerType', v as FormValues['triggerType'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="delayDays">Delay (days)</Label>
              <Input
                id="delayDays"
                type="number"
                min={0}
                max={365}
                {...form.register('delayDays', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div>
            <Label>Send to</Label>
            <Select
              value={form.watch('recipientType')}
              onValueChange={(v) => form.setValue('recipientType', v as 'client' | 'team')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECIPIENT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="emailSubject">Email Subject</Label>
            <Input
              id="emailSubject"
              {...form.register('emailSubject')}
              placeholder="e.g., How was your {{proposalTitle}} trip?"
            />
            {form.formState.errors.emailSubject && (
              <p className="mt-1 text-xs text-red-600">{form.formState.errors.emailSubject.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="emailBody">Email Body (HTML)</Label>
            <Textarea
              id="emailBody"
              {...form.register('emailBody')}
              rows={6}
              placeholder="Hi {{clientName}}, we hope you enjoyed..."
            />
            <p className="mt-1 text-xs text-stone-400">
              Variables: {'{{clientName}}'}, {'{{proposalTitle}}'}, {'{{organizationName}}'}
            </p>
            {form.formState.errors.emailBody && (
              <p className="mt-1 text-xs text-red-600">{form.formState.errors.emailBody.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Workflow'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
