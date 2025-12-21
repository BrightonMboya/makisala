'use client'

import { useTransition } from 'react'

import { cn } from '@/lib/utils'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { authClient } from '@/lib/auth-client'
import { redirect } from 'next/navigation'
import { useToast } from '@/lib/hooks/use-toast'

const LoginSchema = z.object({
    email: z.email(),
    password: z.string().min(8),
})

type LoginFormSchema = z.infer<typeof LoginSchema>

export function LoginForm() {
    const { toast } = useToast()
    const [loading, startTransition] = useTransition()

    const form = useForm<LoginFormSchema>({
        resolver: zodResolver(LoginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    })

    async function onSubmit(data: LoginFormSchema) {
        startTransition(async () => {
            const { data: res, error } = await authClient.signIn.email(
                {
                    email: data.email,
                    password: data.password,
                },
                {
                    onSuccess: ctx => {
                        toast('Success!', {
                            description: 'Logged in successfully. Welcome back!',
                        })
                        redirect('/cms')
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

    return (
        <div className="grid gap-6 lg:max-w-xl">
            <h3 className="text-xl font-semibold">Log into Makisala CMS</h3>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid gap-2">
                        <div className="grid gap-1">
                            <FormField
                                name="email"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel className="sr-only" htmlFor="email">
                                            Email
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="name@example.com"
                                                type="email"
                                                autoCapitalize="none"
                                                autoComplete="email"
                                                autoCorrect="off"
                                                {...field}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid gap-1">
                            <FormField
                                name="password"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel
                                            className="sr-only"
                                            htmlFor="password"
                                        ></FormLabel>
                                        <FormControl>
                                            <Input placeholder="*****" type="password" {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                        <Button>{loading ? 'Loading ...' : 'Log in'}</Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}
