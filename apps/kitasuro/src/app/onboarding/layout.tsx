import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/session';
import { SessionProvider } from '@/components/session-context';

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-stone-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,black_20%,transparent_75%)]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(20,83,45,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(20,83,45,0.12)_1px,transparent_1px)] bg-[size:48px_48px]" />
        </div>
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-green-100/70 to-transparent" />
        <div className="absolute left-[-10rem] top-[-8rem] h-80 w-80 rounded-full bg-green-200/30 blur-3xl" />
        <div className="absolute bottom-[-10rem] right-[-10rem] h-96 w-96 rounded-full bg-stone-200/60 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:px-8">
        <div className="mb-10">
          <Link href="/" className="font-serif text-2xl font-bold text-green-900">
            Ratiba
          </Link>
        </div>

        <SessionProvider>
          <div className="flex flex-1 items-center justify-center pb-12">{children}</div>
        </SessionProvider>
      </div>
    </div>
  );
}
