'use client';

import { useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from '@repo/ui/use-toast';
import { useSession } from '@/components/session-context';

export function DashboardClientShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasShownVerificationToast = useRef(false);
  const { session, isPending } = useSession();

  // Show toast when user arrives after email verification
  useEffect(() => {
    if (searchParams.get('verified') === 'true' && !hasShownVerificationToast.current) {
      hasShownVerificationToast.current = true;
      toast('Email verified!', {
        description: 'Your email has been verified successfully. Welcome to Kitasuro!',
      });
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete('verified');
      window.history.replaceState({}, '', url.pathname);
    }
  }, [searchParams]);

  if (!session && !isPending) {
    router.push('/login');
  }

  return <>{children}</>;
}
