'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/dialog';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form';
import { Combobox } from '@repo/ui/combobox';
import { DatePicker } from '@repo/ui/date-picker';
import { CountryDropdown } from '@repo/ui/country-dropdown';
import { getToursAndClients } from '@/app/itineraries/actions';
import { createClient } from '@/app/(dashboard)/clients/actions';
import { useToast } from '@repo/ui/use-toast';
import { authClient } from '@/lib/auth-client';
import { queryKeys, staleTimes } from '@/lib/query-keys';
import { type RequestFormValues, requestSchema } from '@/lib/schemas/request';

interface NewRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewRequestDialog({ open, onOpenChange }: NewRequestDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const [isNewClient, setIsNewClient] = useState(false);

  // Only fetch data when dialog is open
  const { data } = useQuery({
    queryKey: queryKeys.toursAndClients(session?.user?.id),
    queryFn: getToursAndClients,
    staleTime: staleTimes.toursAndClients,
    enabled: open && !!session?.user?.id,
  });

  const availableTours = data?.tours || [];
  const clients = data?.clients || [];

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      clientId: '',
      email: '',
      firstName: '',
      lastName: '',
      country: '',
      phone: '',
      tourTitle: '',
      tourType: 'Private Tour',
      travelers: 2,
      selectedTourId: '',
    },
  });

  const handleTourSelect = (tourId: string) => {
    form.setValue('selectedTourId', tourId);
    if (tourId) {
      const selectedTour = availableTours.find((t) => t.id === tourId);
      if (selectedTour) {
        form.setValue('tourTitle', selectedTour.name);
      }
    }
  };

  const onSubmit = async (data: RequestFormValues) => {
    let clientId = data.clientId;

    // If creating a new client, create it first
    if (isNewClient && data.lastName) {
      try {
        const result = await createClient({
          name: `${data.firstName || ''} ${data.lastName}`.trim(),
          email: data.email || undefined,
          phone: data.phone || undefined,
          countryOfResidence: data.country || undefined,
        });
        clientId = result.id;
        queryClient.invalidateQueries({ queryKey: queryKeys.toursAndClients(session?.user?.id) });
      } catch (error) {
        toast({ title: 'Failed to create client', variant: 'destructive' });
        return;
      }
    }

    const newId = Math.random().toString(36).substring(7);
    const queryParams = new URLSearchParams();
    if (data.selectedTourId) queryParams.set('tourId', data.selectedTourId);
    queryParams.set('startDate', data.startDate.toISOString());
    if (clientId) queryParams.set('clientId', clientId);
    queryParams.set('tourTitle', data.tourTitle);
    queryParams.set('tourType', data.tourType);
    queryParams.set('travelers', data.travelers.toString());

    onOpenChange(false);
    router.push(`/itineraries/${newId}/day-by-day?${queryParams.toString()}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Add New Request</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <div className="space-y-4">
              {/* Client Selection */}
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewClient(false);
                      form.setValue('clientId', '');
                    }}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${!isNewClient ? 'bg-green-100 text-green-800' : 'text-stone-600 hover:bg-stone-100'}`}
                  >
                    Existing Client
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewClient(true);
                      form.setValue('clientId', '');
                    }}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${isNewClient ? 'bg-green-100 text-green-800' : 'text-stone-600 hover:bg-stone-100'}`}
                  >
                    New Client
                  </button>
                </div>

                {!isNewClient ? (
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Client *</FormLabel>
                        <FormControl>
                          <Combobox
                            items={clients.map((c) => ({ value: c.id, label: c.name }))}
                            value={field.value || null}
                            onChange={field.onChange}
                            placeholder="Search clients..."
                          />
                        </FormControl>
                        {clients.length === 0 && (
                          <p className="text-xs text-stone-500">
                            No clients yet. Switch to "New Client" to create one.
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name *</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client Country</FormLabel>
                          <FormControl>
                            <CountryDropdown
                              value={field.value || ''}
                              onChange={(c) => field.onChange(c.name)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>

              {/* Tour Template Selection */}
              <FormField
                control={form.control}
                name="selectedTourId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tour Template *</FormLabel>
                    <FormControl>
                      <Combobox
                        items={availableTours.map((t) => ({
                          value: t.id,
                          label: `${t.name} (${t.days} days)`,
                        }))}
                        value={field.value || null}
                        onChange={(value) => handleTourSelect(value)}
                        placeholder="Search tour templates..."
                      />
                    </FormControl>
                    {availableTours.length === 0 && (
                      <p className="text-xs text-stone-500">
                        No tour templates available. Create tours first.
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tourTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tour Title *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Auto-filled from template, customize if needed"
                      />
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
                      <FormLabel>Start Date *</FormLabel>
                      <FormControl>
                        <DatePicker date={field.value} setDate={field.onChange} />
                      </FormControl>
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
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-green-700 hover:bg-green-800">
                Create & Start Building
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
