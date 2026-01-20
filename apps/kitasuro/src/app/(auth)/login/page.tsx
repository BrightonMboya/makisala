'use client';

import { useTransition } from 'react';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useToast } from '@/lib/hooks/use-toast';
import Link from 'next/link';

const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

type LoginFormSchema = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, startTransition] = useTransition();

  const { data: session, isPending } = authClient.useSession();

  if (session && !isPending) {
    router.push('/dashboard');
  }

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
          onSuccess: (ctx) => {
            toast('Success!', {
              description: 'Logged in successfully. Welcome back!',
            });
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
