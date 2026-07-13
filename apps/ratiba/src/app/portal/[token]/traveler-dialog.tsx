'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TRPCClientError } from '@trpc/client';
import { FileCheck2, Upload } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Textarea } from '@repo/ui/textarea';
import { CountryDropdown } from '@repo/ui/country-dropdown';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@repo/ui/dialog';
import { useToast } from '@repo/ui/use-toast';
import { trpc } from '@/lib/trpc';
import type { RouterOutputs } from '@/lib/trpc';
import { SCAN_ACCEPT, SCAN_MAX_BYTES, uploadPassportScan } from './scan-upload';

type Traveler = RouterOutputs['portals']['getByToken']['travelers'][number];

const schema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  nationality: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  passportNumber: z.string().optional(),
  passportIssuingCountry: z.string().optional(),
  passportExpiry: z.string().optional(),
  dietaryPreferences: z.string().optional(),
  allergies: z.string().optional(),
  medicalNotes: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  arrivalDetails: z.string().optional(),
  specialRequests: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];

function emptyValues(): FormValues {
  return {
    fullName: '',
    nationality: '',
    dateOfBirth: '',
    gender: '',
    passportNumber: '',
    passportIssuingCountry: '',
    passportExpiry: '',
    dietaryPreferences: '',
    allergies: '',
    medicalNotes: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    arrivalDetails: '',
    specialRequests: '',
  };
}

function fromTraveler(t: Traveler): FormValues {
  return {
    fullName: t.fullName ?? '',
    nationality: t.nationality ?? '',
    dateOfBirth: t.dateOfBirth ?? '',
    gender: t.gender ?? '',
    passportNumber: t.passportNumber ?? '',
    passportIssuingCountry: t.passportIssuingCountry ?? '',
    passportExpiry: t.passportExpiry ?? '',
    dietaryPreferences: t.dietaryPreferences ?? '',
    allergies: t.allergies ?? '',
    medicalNotes: t.medicalNotes ?? '',
    emergencyContactName: t.emergencyContactName ?? '',
    emergencyContactPhone: t.emergencyContactPhone ?? '',
    arrivalDetails: t.arrivalDetails ?? '',
    specialRequests: t.specialRequests ?? '',
  };
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 text-xs font-semibold tracking-wide text-stone-500 uppercase">
      {children}
    </p>
  );
}

interface TravelerDialogProps {
  token: string;
  traveler: Traveler | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TravelerDialog({ token, traveler, open, onOpenChange }: TravelerDialogProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const addMutation = trpc.portals.addTraveler.useMutation();
  const updateMutation = trpc.portals.updateTraveler.useMutation();
  const isEditing = !!traveler;
  const fileRef = useRef<HTMLInputElement>(null);
  // The chosen passport file is staged here and uploaded on save, so adding a
  // traveler and attaching their passport happen in a single step.
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues(),
  });

  // Reset the form and any staged file whenever the dialog opens for a traveler.
  useEffect(() => {
    if (open) {
      form.reset(traveler ? fromTraveler(traveler) : emptyValues());
      setPendingFile(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  }, [open, traveler, form]);

  function handlePickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;
    if (file.size > SCAN_MAX_BYTES) {
      toast({ title: 'File must be under 10MB.', variant: 'destructive' });
      return;
    }
    setPendingFile(file);
  }

  const onSubmit = async (data: FormValues) => {
    try {
      // Save the details first so we have a traveler id to attach the scan to.
      let travelerId: string;
      if (isEditing) {
        await updateMutation.mutateAsync({ token, travelerId: traveler.id, ...data });
        travelerId = traveler.id;
      } else {
        const created = await addMutation.mutateAsync({ token, ...data });
        travelerId = created.id;
      }

      // Then upload the staged passport, if one was chosen. A scan failure must
      // not lose the details the traveler just entered, so we surface it and
      // still close rather than throwing the whole submit away.
      let scanError: string | null = null;
      if (pendingFile) {
        try {
          await uploadPassportScan(token, travelerId, pendingFile);
        } catch (err) {
          scanError = err instanceof Error ? err.message : 'Passport scan upload failed';
        }
      }

      await utils.portals.getByToken.invalidate({ token });
      if (scanError) {
        toast({
          title: `Details saved, but the passport scan didn't upload: ${scanError}`,
          variant: 'destructive',
        });
      } else {
        toast({ title: isEditing ? 'Traveler updated' : 'Traveler added' });
      }
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof TRPCClientError ? error.message : 'Something went wrong';
      toast({ title: message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit traveler' : 'Add a traveler'}</DialogTitle>
          <DialogDescription>
            Enter details exactly as they appear on the passport.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name (as in passport) *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Jane Amelia Doe" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="nationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nationality</FormLabel>
                    <FormControl>
                      <CountryDropdown
                        placeholder="Select country"
                        value={field.value || undefined}
                        onChange={(c) => field.onChange(c.name)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of birth</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:ring-1 focus:ring-ring focus:outline-none"
                    >
                      <option value="">Select</option>
                      {GENDERS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SectionLabel>Passport</SectionLabel>
            <FormField
              control={form.control}
              name="passportNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Passport number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="A1234567" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="passportIssuingCountry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issuing country</FormLabel>
                    <FormControl>
                      <CountryDropdown
                        placeholder="Select country"
                        value={field.value || undefined}
                        onChange={(c) => field.onChange(c.name)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="passportExpiry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry date</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <SectionLabel>Preferences & health</SectionLabel>
            <FormField
              control={form.control}
              name="dietaryPreferences"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dietary preferences</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Vegetarian, halal, no pork..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="allergies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allergies</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nuts, shellfish, penicillin..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="medicalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medical notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={2}
                      placeholder="Anything the operator should know (medication, mobility, etc.)"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SectionLabel>Emergency contact</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="emergencyContactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Contact name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emergencyContactPhone"
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
            </div>

            <SectionLabel>Travel logistics</SectionLabel>
            <FormField
              control={form.control}
              name="arrivalDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Arrival details</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Flight KL565, arriving 12 Aug 14:30" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="specialRequests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special requests</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={2}
                      placeholder="Room preferences, celebrations, anything else..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SectionLabel>Passport scan</SectionLabel>
            <div className="rounded-lg border border-dashed border-stone-300 p-3">
              {pendingFile ? (
                <p className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-stone-700">
                  <FileCheck2 className="h-4 w-4 text-green-700" />
                  {pendingFile.name}
                </p>
              ) : traveler?.hasScan ? (
                <p className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-green-700">
                  <FileCheck2 className="h-4 w-4" />
                  {traveler.passportScanName || 'Scan uploaded'}
                </p>
              ) : (
                <p className="mb-2 text-sm text-stone-500">
                  Optional. Add a photo or PDF of the passport photo page. It uploads when
                  you save.
                </p>
              )}
              <input
                ref={fileRef}
                type="file"
                accept={SCAN_ACCEPT}
                className="hidden"
                onChange={handlePickFile}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="mr-1 h-4 w-4" />
                {pendingFile || traveler?.hasScan ? 'Choose a different file' : 'Choose file'}
              </Button>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? 'Saving...'
                  : isEditing
                    ? 'Save changes'
                    : 'Add traveler'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
