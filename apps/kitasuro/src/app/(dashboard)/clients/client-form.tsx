'use client';

import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Textarea } from '@repo/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient, deleteClient, updateClient } from './actions';
import { useToast } from '@repo/ui/use-toast';

const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  countryOfResidence: z.string().optional(),
  notes: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface ClientFormProps {
  client?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    countryOfResidence: string | null;
    notes: string | null;
  };
}

export function ClientForm({ client }: ClientFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const isEditing = !!client;

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client?.name || '',
      email: client?.email || '',
      phone: client?.phone || '',
      countryOfResidence: client?.countryOfResidence || '',
      notes: client?.notes || '',
    },
  });

  const onSubmit = async (data: ClientFormValues) => {
    try {
      const payload = {
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        countryOfResidence: data.countryOfResidence || undefined,
        notes: data.notes || undefined,
      };

      if (isEditing) {
        await updateClient(client.id, payload);
        toast({ title: 'Client updated successfully' });
      } else {
        await createClient(payload);
        toast({ title: 'Client created successfully' });
      }
      router.push('/clients');
    } catch (error) {
      toast({ title: 'Something went wrong', variant: 'destructive' });
    }
  };

  async function handleDelete() {
    if (!client || !confirm('Are you sure you want to delete this client?')) return;

    setIsDeleting(true);
    try {
      await deleteClient(client.id);
      toast({ title: 'Client deleted successfully' });
      router.push('/clients');
    } catch (error) {
      toast({ title: 'Failed to delete client', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="John Doe" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} type="email" placeholder="john@example.com" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="+1 234 567 8900" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="countryOfResidence"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country of Residence</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="United States" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Any additional notes about this client..."
                    rows={4}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <div>
            {isEditing && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Client'}
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => router.push('/clients')}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? 'Saving...'
                : isEditing
                  ? 'Update Client'
                  : 'Create Client'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
