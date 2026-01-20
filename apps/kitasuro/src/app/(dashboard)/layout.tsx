'use client';

import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@repo/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

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
