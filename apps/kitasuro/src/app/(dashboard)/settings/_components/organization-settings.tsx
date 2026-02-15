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
  logoUrl: z.string().url('Must be a valid URL').or(z.literal('')),
  aboutDescription: z.string().max(2000, 'Description must be under 2000 characters').optional(),
  paymentTerms: z.string().max(5000, 'Terms must be under 5000 characters').optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  organization: {
    id: string;
    name: string;
    logoUrl: string | null;
    aboutDescription: string | null;
    paymentTerms: string | null;
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
      logoUrl: organization.logoUrl || '',
      aboutDescription: organization.aboutDescription || '',
      paymentTerms: organization.paymentTerms || '',
    },
  });

  async function onSubmit(data: FormValues) {
    try {
      await updateOrgMutation.mutateAsync(data);
      toast({ title: 'Organization settings updated' });
    } catch {
      toast({ title: 'Failed to update settings', variant: 'destructive' });
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
                          } catch {
                            toast({ title: 'Failed to upload logo', variant: 'destructive' });
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
