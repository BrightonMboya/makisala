import { Suspense } from 'react';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@repo/ui/sidebar';
import { getSession } from '@/lib/session';
import { createServerCaller } from '@/server/trpc/caller';
import { AppSidebar } from '@/components/app-sidebar';
import { PlanProvider } from '@/components/plan-context';
import { SessionProvider } from '@/components/session-context';
import { DashboardClientShell } from './dashboard-client-shell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  // Fetch sidebar data server-side to avoid flash of fallback UI
  let sidebarData: {
    orgName: string;
    orgLogo: string | null;
    userName: string;
    userEmail: string;
    userImage: string | null;
  } | null = null;

  if (session?.user) {
    try {
      const trpc = await createServerCaller();
      const [org, userProfile] = await Promise.all([
        trpc.settings.getOrg(),
        trpc.settings.getCurrentUser(),
      ]);
      sidebarData = {
        orgName: org?.name || 'Dashboard',
        orgLogo: org?.logoUrl || null,
        userName: userProfile?.name || session.user.name || '',
        userEmail: session.user.email || '',
        userImage: userProfile?.image || null,
      };
    } catch {
      // Fallback if tRPC calls fail
      sidebarData = {
        orgName: 'Dashboard',
        orgLogo: null,
        userName: session.user.name || '',
        userEmail: session.user.email || '',
        userImage: session.user.image || null,
      };
    }
  }

  return (
    <SessionProvider>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardClientShell>
          <PlanProvider>
            <SidebarProvider defaultOpen={true}>
              <AppSidebar serverData={sidebarData} />
              <SidebarInset className="bg-stone-50">
                <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-stone-200 bg-white/80 px-6 backdrop-blur-md">
                  <SidebarTrigger className="-ml-1" />
                </header>
                <div className="min-h-screen">{children}</div>
              </SidebarInset>
            </SidebarProvider>
          </PlanProvider>
        </DashboardClientShell>
      </Suspense>
    </SessionProvider>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex h-screen bg-stone-50">
      <div className="w-64 border-r border-stone-200 bg-white" />
      <div className="flex-1">
        <div className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-stone-200 bg-white/80 px-6 backdrop-blur-md">
          <div className="h-6 w-6 animate-pulse rounded bg-stone-200" />
        </div>
        <div className="min-h-screen p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-stone-200 rounded" />
            <div className="h-64 bg-stone-200 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
