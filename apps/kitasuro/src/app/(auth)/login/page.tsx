'use client';

import { useTransition, useEffect, useRef } from 'react';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form';
import { authClient } from '@/lib/auth-client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/lib/hooks/use-toast';
import Link from 'next/link';
import { acceptInvitation } from '@/app/(dashboard)/settings/actions';

const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

type LoginFormSchema = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, startTransition] = useTransition();
  const hasHandledSession = useRef(false);

  // Get invite token from URL params (for accepting invitation after login)
  const inviteToken = searchParams.get('invite');

  const { data: session, isPending } = authClient.useSession();

  // Handle existing session (user already logged in)
  useEffect(() => {
    if (session && !isPending && !hasHandledSession.current) {
      hasHandledSession.current = true;
      if (inviteToken) {
        // Accept invitation for already-logged-in user
        acceptInvitation(inviteToken)
          .then((result) => {
            if (result.success) {
              toast('Success!', { description: 'Invitation accepted.' });
            } else {
              toast('Warning', {
                description: result.error || 'Could not accept invitation.',
                variant: 'destructive',
              });
            }
            router.push('/dashboard');
          })
          .catch(() => {
            toast('Error', {
              description: 'Unexpected error accepting invitation.',
              variant: 'destructive',
            });
            router.push('/dashboard');
          });
      } else {
        router.push('/dashboard');
      }
    }
  }, [session, isPending, inviteToken, router, toast]);

  const form = useForm<LoginFormSchema>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: LoginFormSchema) {
    startTransition(async () => {
      await authClient.signIn.email(
        {
          email: data.email,
          password: data.password,
        },
        {
          onSuccess: async () => {
            // If there's an invite token, accept the invitation directly
            if (inviteToken) {
              const result = await acceptInvitation(inviteToken);
              if (result.success) {
                toast('Success!', {
                  description: 'Logged in and invitation accepted.',
                });
              } else {
                toast('Logged in', {
                  description: 'But there was an issue with the invitation.',
                  variant: 'destructive',
                });
              }
            } else {
              toast('Success!', {
                description: 'Logged in successfully. Welcome back!',
              });
            }
            router.push('/dashboard');
          },
          onError: (ctx) => {
            toast('Error', {
              description: `${ctx.error.message}`,
              variant: 'destructive',
            });
          },
        },
      );
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="font-serif text-3xl font-bold text-green-800">Kitasuro</h1>
          <p className="mt-2 text-stone-600">Log into your itinerary builder account</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
            <div className="space-y-4">
              <FormField
                name="email"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="name@example.com"
                        type="email"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                name="password"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input placeholder="••••••••" type="password" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-green-700 hover:bg-green-800"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Sign in'}
            </Button>
          </form>
        </Form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-stone-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-stone-500">Or continue with</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={loading}
          onClick={() => {
            startTransition(async () => {
              await authClient.signIn.social({
                provider: 'google',
                callbackURL: inviteToken ? `/login?invite=${inviteToken}` : '/dashboard',
              });
            });
          }}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </Button>

        <div className="text-center text-sm text-stone-600">
          Don't have an account?{' '}
          <Link href="/sign-up" className="font-medium text-green-700 hover:text-green-800">
            Create one here
          </Link>
        </div>
      </div>
    </div>
  );
}
