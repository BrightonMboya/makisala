'use client'

import { useTransition, useState, Suspense } from 'react'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form'
import { authClient } from '@/lib/auth-client'
import { useSearchParams } from 'next/navigation'
import { useToast } from '@repo/ui/use-toast'
import Link from 'next/link'
import { Mail, CheckCircle } from 'lucide-react'

const SignUpSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.email('Please enter a valid email address'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
})

type SignUpFormSchema = z.infer<typeof SignUpSchema>

export default function SignUpPage() {
    return (
        <Suspense fallback={<SignUpSkeleton />}>
            <SignUpForm />
        </Suspense>
    )
}

function SignUpSkeleton() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-stone-50 p-4">
            <div className="w-full max-w-md space-y-8 rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
                <div className="text-center">
                    <h1 className="font-serif text-3xl font-bold text-green-800">Kitasuro</h1>
                    <p className="mt-2 text-stone-600">Create your tour operator account</p>
                </div>
                <div className="animate-pulse space-y-4">
                    <div className="h-10 bg-stone-200 rounded" />
                    <div className="h-10 bg-stone-200 rounded" />
                    <div className="h-10 bg-stone-200 rounded" />
                    <div className="h-10 bg-stone-200 rounded" />
                </div>
            </div>
        </div>
    )
}

function SignUpForm() {
    const { toast } = useToast()
    const searchParams = useSearchParams()
    const [loading, startTransition] = useTransition()
    const [signupComplete, setSignupComplete] = useState<string | null>(null)

    // Get pre-filled email and invite token from URL params
    const emailFromUrl = searchParams.get('email') || ''
    const inviteToken = searchParams.get('invite')

    const form = useForm<SignUpFormSchema>({
        resolver: zodResolver(SignUpSchema),
        defaultValues: {
            name: '',
            email: emailFromUrl,
            password: '',
        },
    })

    async function onSubmit(data: SignUpFormSchema) {
        startTransition(async () => {
            await authClient.signUp.email(
                {
                    email: data.email,
                    password: data.password,
                    name: data.name,
                },
                {
                    onSuccess: async () => {
                        // Show verification message - user needs to verify email before logging in
                        setSignupComplete(data.email)
                    },
                    onError: ctx => {
                        toast('Error', {
                            description: `${ctx.error.message}`,
                            variant: 'destructive',
                        })
                    },
                }
            )
        })
    }

    // Show verification success screen
    if (signupComplete) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-stone-50 p-4">
                <div className="w-full max-w-md space-y-6 rounded-2xl border border-stone-200 bg-white p-8 shadow-sm text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                        <h1 className="font-serif text-2xl font-bold text-green-800">Check your email</h1>
                        <p className="mt-2 text-stone-600">
                            We sent a verification link to <strong>{signupComplete}</strong>
                        </p>
                    </div>
                    <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                        <div className="flex items-start gap-3 text-left">
                            <Mail className="h-5 w-5 text-stone-500 mt-0.5" />
                            <div className="text-sm text-stone-600">
                                <p>Click the link in the email to verify your account and start using Kitasuro.</p>
                                <p className="mt-2">Can&apos;t find it? Check your spam folder.</p>
                            </div>
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        disabled={loading}
                        onClick={() => {
                            startTransition(async () => {
                                await authClient.sendVerificationEmail({
                                    email: signupComplete,
                                    callbackURL: '/dashboard?verified=true',
                                })
                                toast('Email sent!', {
                                    description: 'A new verification link has been sent.',
                                })
                            })
                        }}
                    >
                        {loading ? 'Sending...' : 'Resend verification email'}
                    </Button>
                    <div className="text-sm text-stone-500">
                        Already verified?{' '}
                        <Link href={inviteToken ? `/login?invite=${inviteToken}` : '/login'} className="font-medium text-green-700 hover:text-green-800">
                            Sign in
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-stone-50 p-4">
            <div className="w-full max-w-md space-y-8 rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
                <div className="text-center">
                    <h1 className="font-serif text-3xl font-bold text-green-800">Kitasuro</h1>
                    <p className="mt-2 text-stone-600">Create your tour operator account</p>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
                        <div className="space-y-4">
                            <FormField
                                name="name"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John Doe" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
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
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
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
                                        <FormMessage />
                                        <p className="text-xs text-stone-500">
                                            Must be at least 8 characters with uppercase, lowercase, and a number
                                        </p>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Button type="submit" className="w-full bg-green-700 hover:bg-green-800" disabled={loading}>
                            {loading ? 'Creating account...' : 'Create account'}
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
                            })
                        })
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
                    Already have an account?{' '}
                    <Link href="/login" className="font-medium text-green-700 hover:text-green-800">
                        Sign in instead
                    </Link>
                </div>
            </div>
        </div>
    )
}
