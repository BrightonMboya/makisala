'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import { Textarea } from '@repo/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { Eye, EyeOff, Link2, Loader2, Upload, X } from 'lucide-react';
import { useToast } from '@repo/ui/use-toast';
import { trpc } from '@/lib/trpc';

interface AccomodationFormProps {
  initialData?: {
    id: string;
    name: string;
    url?: string | null;
    overview?: string | null;
    description?: string | null;
    enhancedDescription?: string | null;
    images: { id: string; imageUrl: string; isOwn?: boolean; isHidden?: boolean }[];
  };
}

interface PendingFile {
  file: File;
  previewUrl: string;
}

interface PendingUrl {
  url: string;
}

type PendingImage = PendingFile | PendingUrl;

function isPendingFile(img: PendingImage): img is PendingFile {
  return 'file' in img;
}

export default function AccomodationForm({ initialData }: AccomodationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [images, setImages] = useState<
    { id: string; imageUrl: string; isOwn?: boolean; isHidden?: boolean }[]
  >(initialData?.images || []);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const createMutation = trpc.accommodations.create.useMutation();
  const updateMutation = trpc.accommodations.update.useMutation();
  const createUploadUrlsMutation = trpc.accommodations.createUploadUrls.useMutation();
  const hideImageMutation = trpc.accommodations.hideImage.useMutation();
  const unhideImageMutation = trpc.accommodations.unhideImage.useMutation();

  // Airbnb import state
  const [showAirbnbImport, setShowAirbnbImport] = useState(false);
  const [airbnbUrl, setAirbnbUrl] = useState('');
  const [scraping, setScraping] = useState(false);

  // Form refs for programmatic value setting
  const nameRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const overviewRef = useRef<HTMLTextAreaElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const enhancedDescRef = useRef<HTMLTextAreaElement>(null);

  async function scrapeAirbnb() {
    if (!airbnbUrl.trim()) return;
    setScraping(true);
    try {
      const res = await fetch('/api/scrape-airbnb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: airbnbUrl.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to scrape listing');
      }
      const data = await res.json();

      // Add scraped images to pending images
      if (data.images?.length) {
        const urlImages: PendingUrl[] = data.images.map((url: string) => ({ url }));
        setPendingImages((prev) => [...prev, ...urlImages]);
      }

      // Auto-fill form fields
      if (data.name && nameRef.current && !nameRef.current.value) {
        nameRef.current.value = data.name;
      }
      if (data.sourceUrl && urlRef.current && !urlRef.current.value) {
        urlRef.current.value = data.sourceUrl;
      }
      if (data.description) {
        if (overviewRef.current && !overviewRef.current.value) {
          overviewRef.current.value = data.description.slice(0, 200);
        }
        if (descriptionRef.current && !descriptionRef.current.value) {
          descriptionRef.current.value = data.description;
        }
        if (enhancedDescRef.current && !enhancedDescRef.current.value) {
          enhancedDescRef.current.value = data.description;
        }
      }
    } catch (error) {
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Failed to scrape Airbnb listing',
        variant: 'destructive',
      });
    } finally {
      setScraping(false);
    }
  }

  // Upload local files directly to R2 with presigned PUT URLs. Each file streams
  // straight to storage in parallel, so we never hit the serverless request-body
  // limit that caused "Payload too large" on multi-image uploads.
  async function uploadLocalFiles(files: PendingFile[], accommodationId: string) {
    if (files.length === 0) return [];

    const targets = await createUploadUrlsMutation.mutateAsync({
      accommodationId,
      files: files.map((f) => ({
        name: f.file.name,
        contentType: f.file.type,
        size: f.file.size,
      })),
    });

    await Promise.all(
      targets.map(async (target, i) => {
        const file = files[i]!.file;
        const res = await fetch(target.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });
        if (!res.ok) throw new Error('Upload failed');
      }),
    );

    return targets.map((t) => ({ key: t.key, bucket: t.bucket }));
  }

  async function uploadUrlImages(urls: string[], accommodationId: string) {
    if (urls.length === 0) return [];

    const res = await fetch('/api/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls, accommodationId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Image upload failed');
    }
    return (await res.json()).images as { key: string; bucket: string }[];
  }

  async function uploadAllPending(accommodationId: string) {
    const files = pendingImages.filter(isPendingFile);
    const urls = pendingImages
      .filter((img): img is PendingUrl => !isPendingFile(img))
      .map((img) => img.url);

    const [fileResults, urlResults] = await Promise.all([
      uploadLocalFiles(files, accommodationId),
      uploadUrlImages(urls, accommodationId),
    ]);
    return [...fileResults, ...urlResults];
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const data = {
      name: formData.get('name') as string,
      url: formData.get('url') as string,
      overview: formData.get('overview') as string,
      description: formData.get('description') as string,
      enhancedDescription: formData.get('enhancedDescription') as string,
    };

    try {
      if (initialData) {
        const uploaded = await uploadAllPending(initialData.id);
        await updateMutation.mutateAsync({
          id: initialData.id,
          ...data,
          newImages: uploaded,
          removedImageIds,
        });
        router.push('/accomodations');
      } else {
        const result = await createMutation.mutateAsync({ ...data });
        const accId = result?.id;
        if (accId && pendingImages.length > 0) {
          const uploaded = await uploadAllPending(accId);
          if (uploaded.length > 0) {
            await updateMutation.mutateAsync({
              id: accId,
              ...data,
              newImages: uploaded,
            });
          }
        }
        router.push(accId ? `/accomodations/${accId}/edit` : '/accomodations');
      }
      router.refresh();
    } catch (error) {
      toast({
        title: 'Save failed',
        description: 'Failed to save accomodation',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;
      setPendingImages((prev) => [...prev, { file, previewUrl: URL.createObjectURL(file) }]);
    }
  };

  const removeExistingImage = (id: string) => {
    setRemovedImageIds((prev) => [...prev, id]);
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const removePendingImage = (index: number) => {
    setPendingImages((prev) => {
      const removed = prev[index];
      if (removed && isPendingFile(removed)) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Hide/unhide a curated (shared-library) image for this org only. Applies
  // immediately (independent per-org toggle, not part of the Save payload) and
  // optimistically; reverts on failure.
  const toggleHideImage = async (id: string, hide: boolean) => {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, isHidden: hide } : img)));
    try {
      if (hide) await hideImageMutation.mutateAsync({ imageId: id });
      else await unhideImageMutation.mutateAsync({ imageId: id });
    } catch {
      setImages((prev) => prev.map((img) => (img.id === id ? { ...img, isHidden: !hide } : img)));
      toast({
        title: hide ? 'Failed to hide image' : 'Failed to unhide image',
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-8 pb-20">
      {/* Airbnb Import Toggle */}
      {!initialData && !showAirbnbImport && (
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowAirbnbImport(true)}
          className="flex items-center gap-2"
        >
          <Link2 className="h-4 w-4" />
          Import from Airbnb
        </Button>
      )}

      {!initialData && showAirbnbImport && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Import from Airbnb
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAirbnbImport(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={airbnbUrl}
                onChange={(e) => setAirbnbUrl(e.target.value)}
                placeholder="https://www.airbnb.com/rooms/..."
                className="flex-1"
              />
              <Button
                type="button"
                onClick={scrapeAirbnb}
                disabled={scraping || !airbnbUrl.trim()}
                variant="outline"
              >
                {scraping ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Fetch Listing'
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Paste an Airbnb listing URL to auto-fill details and import images.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Accomodation Name</Label>
                <Input
                  ref={nameRef}
                  id="name"
                  name="name"
                  defaultValue={initialData?.name}
                  required
                  placeholder="e.g. One&Only Gorilla's Nest"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">Website URL</Label>
                <Input
                  ref={urlRef}
                  id="url"
                  name="url"
                  defaultValue={initialData?.url || ''}
                  type="url"
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="overview">Overview (Short)</Label>
                <Textarea
                  ref={overviewRef}
                  id="overview"
                  name="overview"
                  defaultValue={initialData?.overview || ''}
                  placeholder="Brief summary for listings..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Full Description</Label>
                <Textarea
                  ref={descriptionRef}
                  id="description"
                  name="description"
                  defaultValue={initialData?.description || ''}
                  rows={6}
                  placeholder="Detailed description of the accomodation..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="enhancedDescription">
                  Property Overview (shown on detail page)
                </Label>
                <Textarea
                  ref={enhancedDescRef}
                  id="enhancedDescription"
                  name="enhancedDescription"
                  defaultValue={initialData?.enhancedDescription || ''}
                  rows={8}
                  placeholder="Rich property overview displayed on the public accommodation page..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {images.map((img) => {
                  // Own images (this org added) can be hard-deleted. Curated/global
                  // images belong to the shared library and can't be deleted, but
                  // this org can hide them from its own proposals (reversible).
                  const isOwn = initialData ? !!img.isOwn : true;
                  const hidden = !!img.isHidden;
                  return (
                    <div
                      key={img.id}
                      className={`relative aspect-square overflow-hidden rounded-md border bg-gray-100 ${
                        hidden ? 'opacity-50' : ''
                      }`}
                    >
                      <img src={img.imageUrl} alt="" className="h-full w-full object-cover" />
                      {isOwn ? (
                        <button
                          type="button"
                          onClick={() => removeExistingImage(img.id)}
                          className="absolute top-2 right-2 rounded-full bg-red-500 p-1.5 text-white hover:bg-red-600"
                          title="Delete image"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => toggleHideImage(img.id, !hidden)}
                            className="absolute top-2 right-2 rounded-full bg-gray-900/70 p-1.5 text-white hover:bg-gray-900"
                            title={hidden ? 'Show on your proposals' : 'Hide from your proposals'}
                          >
                            {hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </button>
                          <span className="absolute bottom-2 left-2 rounded bg-white/80 px-1.5 py-0.5 text-xs font-medium text-gray-700">
                            {hidden ? 'Hidden' : 'Curated'}
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}
                {pendingImages.map((img, i) => (
                  <div
                    key={i}
                    className="relative aspect-square overflow-hidden rounded-md border border-blue-200 bg-blue-50"
                  >
                    <img
                      src={isPendingFile(img) ? img.previewUrl : img.url}
                      alt=""
                      className="h-full w-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="rounded bg-white/80 px-1 text-[10px] font-medium text-blue-700">
                        New
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePendingImage(i)}
                      className="absolute top-1 right-1 rounded-full bg-gray-500 p-1 text-white hover:bg-gray-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <label className="relative flex aspect-square cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 hover:border-gray-400">
                  <Upload className="h-6 w-6 text-gray-400" />
                  <span className="mt-1 text-xs text-gray-500">Upload</span>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Accomodation'
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
