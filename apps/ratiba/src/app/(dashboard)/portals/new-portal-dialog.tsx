'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TRPCClientError } from '@trpc/client';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Textarea } from '@repo/ui/textarea';
import { Label } from '@repo/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@repo/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@repo/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover';
import { useToast } from '@repo/ui/use-toast';
import { useDebounce } from '@repo/ui/use-debounce';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import type { RouterOutputs } from '@/lib/trpc';

type Booking = RouterOutputs['portals']['searchBookings'][number];

export function NewPortalDialog() {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [dueDate, setDueDate] = useState('');

  const createMutation = trpc.portals.create.useMutation();

  const debouncedSearch = useDebounce(search, 250);
  const { data: bookings = [], isFetching } = trpc.portals.searchBookings.useQuery(
    { search: debouncedSearch || undefined },
    { enabled: open && pickerOpen },
  );

  function reset() {
    setPickerOpen(false);
    setSearch('');
    setBooking(null);
    setWelcomeMessage('');
    setDueDate('');
  }

  async function handleCreate() {
    if (!booking) {
      toast({ title: 'Pick a booking first', variant: 'destructive' });
      return;
    }
    try {
      const created = await createMutation.mutateAsync({
        proposalId: booking.id,
        welcomeMessage: welcomeMessage.trim() || undefined,
        dueDate: dueDate || undefined,
      });
      toast({ title: 'Portal created' });
      setOpen(false);
      reset();
      router.push(`/portals/${created.id}`);
    } catch (error) {
      const message =
        error instanceof TRPCClientError ? error.message : 'Failed to create portal';
      toast({ title: message, variant: 'destructive' });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="bg-green-700 hover:bg-green-800">
          <Plus className="mr-1 h-4 w-4" /> New portal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New trip portal</DialogTitle>
          <DialogDescription>
            Create a link to collect traveler details for a booking.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Booking</Label>
            <Popover open={pickerOpen} onOpenChange={setPickerOpen} modal={false}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={pickerOpen}
                  className="w-full justify-between font-normal"
                >
                  {booking ? (
                    <span className="truncate">
                      {booking.tripName}
                      {booking.clientName ? ` — ${booking.clientName}` : ''}
                    </span>
                  ) : (
                    <span className="text-stone-500">Search booked trips...</span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search by trip or client name..."
                    value={search}
                    onValueChange={setSearch}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {isFetching ? 'Searching...' : 'No booked trips found.'}
                    </CommandEmpty>
                    {bookings.map((b) => (
                      <CommandItem
                        key={b.id}
                        value={b.id}
                        onSelect={() => {
                          setBooking(b);
                          setPickerOpen(false);
                          setSearch('');
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            booking?.id === b.id ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                        <span className="flex-1 truncate">
                          {b.tripName}
                          {b.clientName ? (
                            <span className="text-stone-500"> — {b.clientName}</span>
                          ) : null}
                        </span>
                        <span className="ml-2 shrink-0 text-xs text-stone-400">{b.status}</span>
                      </CommandItem>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <p className="mt-1 text-xs text-stone-500">
              Only paid and booked trips can have a portal. Trip name and lead traveler are taken
              from the booking.
            </p>
            {booking && !booking.clientEmail ? (
              <p className="mt-1 text-xs text-amber-600">
                This booking has no client email. Add one in the portal settings so the lead
                traveler can unlock the portal.
              </p>
            ) : null}
          </div>

          <div>
            <Label className="mb-1.5 block">Welcome message (optional)</Label>
            <Textarea
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              rows={3}
              placeholder="A short note shown to your client at the top of the portal."
            />
          </div>

          <div>
            <Label className="mb-1.5 block">Complete by (optional)</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            className="bg-green-700 hover:bg-green-800"
            onClick={handleCreate}
            disabled={createMutation.isPending || !booking}
          >
            {createMutation.isPending ? 'Creating...' : 'Create portal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
