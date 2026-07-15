'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import { Input } from '@repo/ui/input';
import { Button } from '@repo/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRef, useState } from 'react';
import { toast } from '@repo/ui/toast';
import { Textarea } from '@repo/ui/textarea';
import { Facebook, Instagram, Loader2, Plus, RefreshCw, Search, Star, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Google is connected via search (auto-fetched rating/count), so it is not a
// manually-addable platform; only these are entered by hand.
const MANUAL_PLATFORMS = [
  { value: 'safaribookings', label: 'SafariBookings' },
  { value: 'tripadvisor', label: 'Tripadvisor' },
] as const;

/** A stable reviews link that reads Google reviews without an individual profile URL. */
function googleReviewsUrl(placeId: string): string {
  return `https://search.google.com/local/reviews?placeid=${encodeURIComponent(placeId)}`;
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 0 1-2.59-2.59 2.59 2.59 0 0 1 3.44-2.44V9.7a5.66 5.66 0 0 0-.85-.06A5.68 5.68 0 0 0 4.2 15.3 5.68 5.68 0 0 0 9.85 21a5.68 5.68 0 0 0 5.68-5.68V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.28 4.28 0 0 1-3.23-1.48z" />
    </svg>
  );
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const optionalNumberString = (max: number, message: string) =>
  z.string().refine((v) => {
    if (v.trim() === '') return true;
    const n = Number(v);
    return !Number.isNaN(n) && n >= 0 && n <= max;
  }, message);

const schema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(63, 'Slug must be under 63 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens only'),
  logoUrl: z.string().url('Must be a valid URL').or(z.literal('')),
  aboutDescription: z.string().max(2000, 'Description must be under 2000 characters').optional(),
  paymentTerms: z.string().max(5000, 'Terms must be under 5000 characters').optional(),
  address: z.string().max(1000, 'Address must be under 1000 characters').optional(),
  phone: z.string().max(64, 'Phone must be under 64 characters').optional(),
  taxId: z.string().max(64, 'Tax ID must be under 64 characters').optional(),
  reviewLinks: z.array(
    z.object({
      platform: z.enum(['google', 'safaribookings', 'tripadvisor']),
      url: z.string().url('Enter a valid URL').or(z.literal('')),
      rating: optionalNumberString(5, 'Rating must be between 0 and 5'),
      reviewCount: optionalNumberString(1_000_000, 'Enter a whole number'),
      placeId: z.string().optional(),
      source: z.enum(['manual', 'google']),
    }),
  ),
  socialLinks: z.object({
    instagram: z.string().url('Enter a valid URL').or(z.literal('')),
    tiktok: z.string().url('Enter a valid URL').or(z.literal('')),
    facebook: z.string().url('Enter a valid URL').or(z.literal('')),
  }),
});

type FormValues = z.infer<typeof schema>;

type ReviewPlatform = FormValues['reviewLinks'][number]['platform'];

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
    reviewLinks: Array<{
      platform: ReviewPlatform;
      url: string;
      rating: number | null;
      reviewCount: number | null;
      placeId?: string | null;
      source?: 'manual' | 'google';
    }> | null;
    socialLinks: { instagram?: string; tiktok?: string; facebook?: string } | null;
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
      reviewLinks: (organization.reviewLinks || []).map((r) => ({
        platform: r.platform,
        url: r.url,
        rating: r.rating != null ? String(r.rating) : '',
        reviewCount: r.reviewCount != null ? String(r.reviewCount) : '',
        placeId: r.placeId ?? undefined,
        source: r.source ?? 'manual',
      })),
      socialLinks: {
        instagram: organization.socialLinks?.instagram || '',
        tiktok: organization.socialLinks?.tiktok || '',
        facebook: organization.socialLinks?.facebook || '',
      },
    },
  });

  const reviewFields = useFieldArray({ control: form.control, name: 'reviewLinks' });

  const searchPlacesMutation = trpc.settings.searchGooglePlaces.useMutation();
  const refreshPlaceMutation = trpc.settings.refreshGooglePlace.useMutation();
  const [googleQuery, setGoogleQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{
    placeId: string;
    name: string;
    address: string | null;
    rating: number | null;
    reviewCount: number | null;
    mapsUri: string | null;
  }> | null>(null);

  // Watch the rows so the Google block reacts to connect/refresh/disconnect. There
  // is at most one Google-sourced row; everything else is a manual platform.
  const watchedReviews = useWatch({ control: form.control, name: 'reviewLinks' });
  const googleIndex = (watchedReviews ?? []).findIndex((r) => r?.source === 'google');
  const googleRow = googleIndex >= 0 ? watchedReviews?.[googleIndex] : undefined;

  async function handleSearchGoogle() {
    const q = googleQuery.trim();
    if (q.length < 2) return;
    try {
      const results = await searchPlacesMutation.mutateAsync({ query: q });
      setSearchResults(results);
      if (results.length === 0) toast({ title: 'No businesses found for that name' });
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : 'Search failed',
        variant: 'destructive',
      });
    }
  }

  function connectGoogle(candidate: NonNullable<typeof searchResults>[number]) {
    const row = {
      platform: 'google' as const,
      url: candidate.mapsUri || googleReviewsUrl(candidate.placeId),
      rating: candidate.rating != null ? String(candidate.rating) : '',
      reviewCount: candidate.reviewCount != null ? String(candidate.reviewCount) : '',
      placeId: candidate.placeId,
      source: 'google' as const,
    };
    if (googleIndex >= 0) reviewFields.update(googleIndex, row);
    else reviewFields.append(row);
    setSearchResults(null);
    setGoogleQuery('');
    toast({ title: `Connected ${candidate.name || 'Google listing'}. Save to keep it.` });
  }

  async function refreshGoogle(index: number, placeId: string) {
    try {
      const place = await refreshPlaceMutation.mutateAsync({ placeId });
      form.setValue(
        `reviewLinks.${index}.rating`,
        place.rating != null ? String(place.rating) : '',
      );
      form.setValue(
        `reviewLinks.${index}.reviewCount`,
        place.reviewCount != null ? String(place.reviewCount) : '',
      );
      if (place.mapsUri) form.setValue(`reviewLinks.${index}.url`, place.mapsUri);
      toast({ title: 'Google rating refreshed. Save to keep it.' });
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : 'Refresh failed',
        variant: 'destructive',
      });
    }
  }

  async function onSubmit(data: FormValues) {
    // Form fields are strings for editing; coerce to the DB shape and drop rows
    // with no link (an empty platform row the user added but never filled in).
    const reviewLinks = data.reviewLinks
      .filter((r) => r.url.trim() !== '')
      .map((r) => ({
        platform: r.platform,
        url: r.url.trim(),
        rating: r.rating.trim() === '' ? null : Number(r.rating),
        reviewCount: r.reviewCount.trim() === '' ? null : Math.round(Number(r.reviewCount)),
        placeId: r.placeId?.trim() ? r.placeId.trim() : null,
        source: r.source,
      }));

    const socialLinks = {
      instagram: data.socialLinks.instagram.trim(),
      tiktok: data.socialLinks.tiktok.trim(),
      facebook: data.socialLinks.facebook.trim(),
    };

    try {
      await updateOrgMutation.mutateAsync({
        name: data.name,
        slug: data.slug,
        logoUrl: data.logoUrl,
        aboutDescription: data.aboutDescription,
        paymentTerms: data.paymentTerms,
        address: data.address,
        phone: data.phone,
        taxId: data.taxId,
        reviewLinks,
        socialLinks,
      });
      toast({ title: 'Organization settings updated' });
      queryClient.invalidateQueries({ queryKey: [['settings', 'getOrg']] });
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Organization Settings</CardTitle>
            <CardDescription>Manage your agency branding and appearance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
                            const result = await uploadLogoMutation.mutateAsync({
                              base64Data: base64,
                            });
                            if (result.url) {
                              field.onChange(result.url);
                              toast({ title: 'Logo uploaded' });
                              queryClient.invalidateQueries({ queryKey: [['settings', 'getOrg']] });
                            }
                          } catch (error) {
                            const message =
                              error instanceof Error ? error.message : 'Failed to upload logo';
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
                            {isUploadingLogo
                              ? 'Uploading...'
                              : field.value
                                ? 'Change Logo'
                                : 'Upload Logo'}
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reviews</CardTitle>
            <CardDescription>
              Showcase your ratings on Google, SafariBookings and Tripadvisor. These appear as trust
              badges at the end of every proposal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Google — connected via business search, rating/count auto-fetched */}
            <div className="space-y-3">
              <p className="text-xs font-semibold tracking-wide text-gray-700 uppercase">Google</p>
              {googleRow ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-200 p-4">
                  <div className="flex items-center gap-3">
                    <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Connected to Google</p>
                      <p className="text-xs text-gray-500">
                        {googleRow.rating ? `${googleRow.rating} ★` : 'No rating'}
                        {googleRow.reviewCount ? ` · ${googleRow.reviewCount} reviews` : ''} ·
                        updates automatically
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      disabled={refreshPlaceMutation.isPending || !googleRow.placeId}
                      onClick={() =>
                        googleRow.placeId && refreshGoogle(googleIndex, googleRow.placeId)
                      }
                    >
                      {refreshPlaceMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Refresh
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => reviewFields.remove(googleIndex)}
                      aria-label="Disconnect Google"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={googleQuery}
                      onChange={(e) => setGoogleQuery(e.target.value)}
                      onKeyDown={(e) => {
                        // Enter should search, not submit the whole settings form.
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearchGoogle();
                        }
                      }}
                      placeholder="Search your business name"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2"
                      disabled={searchPlacesMutation.isPending || googleQuery.trim().length < 2}
                      onClick={handleSearchGoogle}
                    >
                      {searchPlacesMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                      Search
                    </Button>
                  </div>
                  {searchResults && searchResults.length > 0 && (
                    <ul className="divide-y divide-stone-100 overflow-hidden rounded-lg border border-stone-200">
                      {searchResults.map((r) => (
                        <li key={r.placeId}>
                          <button
                            type="button"
                            onClick={() => connectGoogle(r)}
                            className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-stone-50"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-gray-900">{r.name}</p>
                              {r.address && (
                                <p className="truncate text-xs text-gray-500">{r.address}</p>
                              )}
                            </div>
                            <span className="shrink-0 text-xs text-gray-500">
                              {r.rating != null ? `${r.rating} ★` : 'No rating'}
                              {r.reviewCount != null ? ` · ${r.reviewCount}` : ''}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-xs text-gray-500">
                    Type your Google Business name, then pick the right listing. Your rating and
                    review count are pulled in automatically.
                  </p>
                </div>
              )}
            </div>

            {/* Manual platforms — no public API, entered by hand */}
            <div className="space-y-3 border-t border-stone-100 pt-6">
              <p className="text-xs font-semibold tracking-wide text-gray-700 uppercase">
                Other platforms
              </p>
              {reviewFields.fields.map((field, index) =>
                watchedReviews?.[index]?.source === 'google' ? null : (
                  <div
                    key={field.id}
                    className="grid grid-cols-1 gap-3 rounded-lg border border-stone-200 p-4 sm:grid-cols-[minmax(0,150px)_minmax(0,1fr)_auto] sm:items-start"
                  >
                    <FormField
                      control={form.control}
                      name={`reviewLinks.${index}.platform`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel className="sm:sr-only">Platform</FormLabel>
                          <Select value={f.value} onValueChange={f.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Platform" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {MANUAL_PLATFORMS.map((p) => (
                                <SelectItem key={p.value} value={p.value}>
                                  {p.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`reviewLinks.${index}.url`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel className="sm:sr-only">Profile URL</FormLabel>
                          <FormControl>
                            <Input {...f} placeholder="https://..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="justify-self-start text-red-500 hover:text-red-600 sm:mt-0.5"
                      onClick={() => reviewFields.remove(index)}
                      aria-label="Remove review platform"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ),
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() =>
                  reviewFields.append({
                    platform: 'safaribookings',
                    url: '',
                    rating: '',
                    reviewCount: '',
                    source: 'manual',
                  })
                }
              >
                <Plus className="h-4 w-4" />
                Add review platform
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Social Media</CardTitle>
            <CardDescription>
              Link your social profiles. Icons appear in the "About agency" section of your
              proposals.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="socialLinks.instagram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Instagram className="h-4 w-4" /> Instagram
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://instagram.com/youragency" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="socialLinks.tiktok"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <TikTokIcon className="h-4 w-4" /> TikTok
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://tiktok.com/@youragency" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="socialLinks.facebook"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Facebook className="h-4 w-4" /> Facebook
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://facebook.com/youragency" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateOrgMutation.isPending}>
            {updateOrgMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
