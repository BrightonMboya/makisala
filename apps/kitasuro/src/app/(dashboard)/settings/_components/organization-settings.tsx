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
import { updateOrganizationSettings, uploadOrganizationLogo } from '../actions';
import { toast } from '@repo/ui/toast';
import { Textarea } from '@repo/ui/textarea';
import { useQueryClient } from '@tanstack/react-query';


const schema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  logoUrl: z.string().url('Must be a valid URL').or(z.literal('')),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Valid hex color required'),
  aboutDescription: z.string().optional(),
  paymentTerms: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  organization: {
    id: string;
    name: string;
    logoUrl: string | null;
    primaryColor: string | null;
    aboutDescription: string | null;
    paymentTerms: string | null;
  };
}

export function OrganizationSettings({ organization }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: organization.name,
      logoUrl: organization.logoUrl || '',
      primaryColor: organization.primaryColor || '#15803d',
      aboutDescription: organization.aboutDescription || '',
      paymentTerms: organization.paymentTerms || '',
    },
  });

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    try {
      const result = await updateOrganizationSettings(data);
      if (result.success) {
        toast({ title: 'Organization settings updated' });
      }
    } catch {
      toast({ title: 'Failed to update settings', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
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
                          setIsUploadingLogo(true);
                          try {
                            const reader = new FileReader();
                            reader.onload = async () => {
                              try {
                                const base64 = reader.result as string;
                                const result = await uploadOrganizationLogo(base64);
                                if (result.success && result.url) {
                                  field.onChange(result.url);
                                  toast({ title: 'Logo uploaded' });
                                  queryClient.invalidateQueries({ queryKey: ['org-logo'] });
                                }
                              } catch {
                                toast({ title: 'Failed to upload logo', variant: 'destructive' });
                              } finally {
                                setIsUploadingLogo(false);
                              }
                            };
                            reader.readAsDataURL(file);
                          } catch {
                            toast({ title: 'Failed to read file', variant: 'destructive' });
                            setIsUploadingLogo(false);
                          }
                          // Reset so the same file can be re-selected
                          e.target.value = '';
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
              name="primaryColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand Color</FormLabel>
                  <FormControl>
                    <div className="flex gap-3">
                      <Input type="color" {...field} className="h-10 w-14 p-1 cursor-pointer" />
                      <Input {...field} className="flex-1" placeholder="#15803d" />
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
