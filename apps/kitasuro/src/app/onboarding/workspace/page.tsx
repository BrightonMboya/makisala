'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@repo/ui/input';
import { Button } from '@repo/ui/button';
import { ArrowRight } from 'lucide-react';
import { toast } from '@repo/ui/toast';
import { trpc } from '@/lib/trpc';
import { StepPage } from '../_components/step-page';
import { useOnboardingState } from '../_components/use-onboarding-state';

export default function WorkspaceStepPage() {
  const router = useRouter();
  const updateOrgMutation = trpc.settings.updateOrg.useMutation();
  const uploadLogoMutation = trpc.settings.uploadLogo.useMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isLoading, isAdmin, onboardingData, setOnboardingData } = useOnboardingState();
  const [agencyName, setAgencyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  // Initialize form values once data is available (no useEffect needed)
  if (!initialized && onboardingData) {
    setAgencyName(onboardingData.organization?.name || '');
    setLogoUrl(onboardingData.organization?.logoUrl || '');
    setInitialized(true);
  }

  const onContinue = () => {
    if (!isAdmin) return;

    const value = agencyName.trim();
    if (!value) {
      toast({ title: 'Agency name is required', variant: 'destructive' });
      return;
    }

    updateOrgMutation.mutate(
      { name: value },
      {
        onSuccess: () => {
          setOnboardingData(undefined, (prev) =>
            prev
              ? {
                  ...prev,
                  organization: prev.organization
                    ? { ...prev.organization, name: value }
                    : prev.organization,
                }
              : prev,
          );
          router.push('/onboarding/notification');
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : 'Failed to update agency name';
          toast({ title: message, variant: 'destructive' });
        },
      },
    );
  };

  const readFileAsDataURL = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const onUploadLogo = async (file: File) => {
    if (!isAdmin) return;
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File too large',
        description: 'Please select an image under 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingLogo(true);
    try {
      const base64 = await readFileAsDataURL(file);
      const result = await uploadLogoMutation.mutateAsync({ base64Data: base64 });
      if (result.url) {
        setLogoUrl(result.url);
        setOnboardingData(undefined, (prev) =>
          prev
            ? {
                ...prev,
                organization: prev.organization
                  ? { ...prev.organization, logoUrl: result.url }
                  : prev.organization,
              }
            : prev,
        );
        toast({ title: 'Logo uploaded' });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload logo';
      toast({ title: message, variant: 'destructive' });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  if (isLoading) {
    return <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />;
  }

  return (
    <StepPage
      step={1}
      total={5}
      title="Create your workspace"
      description="Set your agency name and logo. These appear on proposal pages and shared itineraries."
    >
      <div className="space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-800">Agency name</span>
          <Input
            value={agencyName}
            onChange={(event) => setAgencyName(event.target.value)}
            placeholder="Savannah Trails Safaris"
            disabled={!isAdmin || updateOrgMutation.isPending}
          />
        </label>

        <div className="space-y-2">
          <span className="text-sm font-medium text-stone-800">Agency logo</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            disabled={!isAdmin || isUploadingLogo || uploadLogoMutation.isPending}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              await onUploadLogo(file);
              event.target.value = '';
            }}
          />
          <div className="flex items-center gap-4 rounded-xl border border-stone-200 bg-stone-50 p-3">
            {logoUrl ? (
              <img src={logoUrl} alt="Organization logo" className="h-16 w-16 rounded-full border border-stone-200 object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-stone-300 bg-white text-xl font-semibold text-stone-400">
                {agencyName?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              disabled={!isAdmin || isUploadingLogo || uploadLogoMutation.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploadingLogo ? 'Uploading...' : logoUrl ? 'Change logo' : 'Upload logo'}
            </Button>
          </div>
        </div>

        {!isAdmin && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Only admins can change organization details. Ask an admin to complete this step.
          </p>
        )}

        <div className="flex items-center justify-end gap-4">
          <Button
            onClick={onContinue}
            disabled={!isAdmin || updateOrgMutation.isPending}
            className="gap-2 bg-green-700 hover:bg-green-800"
          >
            {updateOrgMutation.isPending ? 'Saving...' : 'Continue'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </StepPage>
  );
}
