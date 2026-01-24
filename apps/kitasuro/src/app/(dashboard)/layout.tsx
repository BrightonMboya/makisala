'use client';

import { useRef } from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter, useSearchParams } from 'next/navigation';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@repo/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { toast } from '@repo/ui/use-toast';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasShownVerificationToast = useRef(false);
  const { data: session, isPending } = authClient.useSession();

  // Show toast when user arrives after email verification (runs once during render)
  if (searchParams.get('verified') === 'true' && !hasShownVerificationToast.current) {
    hasShownVerificationToast.current = true;
    toast('Email verified!', {
      description: 'Your email has been verified successfully. Welcome to Kitasuro!',
    });
    // Clean up URL on next tick to avoid hydration issues
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete('verified');
        window.history.replaceState({}, '', url.pathname);
      }, 0);
    }
  }

  if (!session && !isPending) {
    router.push('/login');
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="bg-stone-50">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-stone-200 bg-white/80 px-6 backdrop-blur-md">
          <SidebarTrigger className="-ml-1" />
        </header>
        <div className="min-h-screen">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
