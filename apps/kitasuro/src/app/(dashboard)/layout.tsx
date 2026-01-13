'use client';

import { Sidebar } from './_components/sidebar';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = authClient.useSession();

  useEffect(() => {
    if (!isSessionPending && !session) {
      router.push('/login');
    }
  }, [session, isSessionPending, router]);

  if (isSessionPending) return null;

  return (
    <div className="flex min-h-screen bg-stone-50">
      <Sidebar />
      <div className="flex-1 ml-64 min-h-screen">
          {children}
      </div>
    </div>
  );
}
