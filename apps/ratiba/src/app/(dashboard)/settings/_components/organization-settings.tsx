'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import { Input } from '@repo/ui/input';
import { Button } from '@repo/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRef, useState } from 'react';
import { toast } from '@repo/ui/toast';
import { Textarea } from '@repo/ui/textarea';
import { useQueryClient } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const schema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(63, 'Slug must be under 63 characters')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Use lowercase letters, numbers and single hyphens only',
    ),
  logoUrl: z.string().url('Must be a valid URL').or(z.literal('')),
  aboutDescription: z.string().max(2000, 'Description must be under 2000 characters').optional(),
  paymentTerms: z.string().max(5000, 'Terms must be under 5000 characters').optional(),
  address: z.string().max(1000, 'Address must be under 1000 characters').optional(),
  phone: z.string().max(64, 'Phone must be under 64 characters').optional(),
  taxId: z.string().max(64, 'Tax ID must be under 64 characters').optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  organization: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    aboutDescription: string | null;
    paymentTerms: string | null;
    address: string | null;
    phone: string | null;
    taxId: string | null;
  };
}

export function OrganizationSettings({ organization }: Props) {
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const updateOrgMutation = trpc.settings.updateOrg.useMutation();
  const uploadLogoMutation = trpc.settings.uploadLogo.useMutation();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: organization.name,
      slug: organization.slug,
      logoUrl: organization.logoUrl || '',
      aboutDescription: organization.aboutDescription || '',
      paymentTerms: organization.paymentTerms || '',
      address: organization.address || '',
      phone: organization.phone || '',
      taxId: organization.taxId || '',
    },
  });

  async function onSubmit(data: FormValues) {
    try {
      await updateOrgMutation.mutateAsync(data);
      toast({ title: 'Organization settings updated' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update settings';
      // Surface a taken slug inline on the field, not just as a toast.
      if (/slug is already taken/i.test(message)) {
        form.setError('slug', { type: 'manual', message });
      }
      toast({ title: message, variant: 'destructive' });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Settings</CardTitle>
        <CardDescription>Manage your agency branding and appearance</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agency Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toLowerCase().trim())}
                      placeholder="your-agency"
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">
                    Used to send client emails from{' '}
                    <span className="font-medium text-gray-700">
                      {field.value || 'your-agency'}@ratiba.io
                    </span>
                    . Must be unique.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          if (file.size > MAX_FILE_SIZE) {
                            toast({
                              title: 'File too large',
                              description: 'Please select an image under 5MB',
                              variant: 'destructive',
                            });
                            e.target.value = '';
                            return;
                          }

                          setIsUploadingLogo(true);
                          try {
                            const base64 = await readFileAsDataURL(file);
                            const result = await uploadLogoMutation.mutateAsync({ base64Data: base64 });
                            if (result.url) {
                              field.onChange(result.url);
                              toast({ title: 'Logo uploaded' });
                              queryClient.invalidateQueries({ queryKey: [['settings', 'getOrg']] });
                            }
                          } catch (error) {
                            const message = error instanceof Error ? error.message : 'Failed to upload logo';
                            toast({ title: message, variant: 'destructive' });
                          } finally {
                            setIsUploadingLogo(false);
                            e.target.value = '';
                          }
                        }}
                      />
                      <div className="flex items-center gap-5">
                        {field.value ? (
                          <img
                            src={field.value}
                            alt="Logo preview"
                            className="h-20 w-20 rounded-full border-2 border-stone-200 object-cover"
                          />
                        ) : (
                          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-stone-300 bg-stone-50 text-2xl font-bold text-stone-400">
                            {organization.name[0]?.toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isUploadingLogo}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            {isUploadingLogo ? 'Uploading...' : field.value ? 'Change Logo' : 'Upload Logo'}
                          </Button>
                          {field.value && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600"
                              onClick={() => field.onChange('')}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="aboutDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>About Your Organization</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      placeholder="Tell clients about your organization. This will appear on proposals."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Address</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="Street, city, country. Appears in the 'From' block on your invoices."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Phone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+255 ..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taxId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax ID / VAT Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="TIN / VAT registration number" />
                    </FormControl>
                    <p className="text-xs text-gray-500">
                      Shown on invoices as your tax registration. Required for a valid VAT invoice.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="paymentTerms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Terms & Conditions</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={6}
                      placeholder="Enter your payment terms and conditions. This will appear at the end of proposals."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={updateOrgMutation.isPending}>
                {updateOrgMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
