'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/lib/hooks/use-toast'
import { createAccommodation } from '@/app/cms/tour-builder/actions'
import { PlusCircle, Trash2, Plus } from 'lucide-react'

const FormSchema = z.object({
    name: z.string().min(2, {
        message: 'Name must be at least 2 characters.',
    }),
    url: z.string().optional(),
    overview: z.string().optional(),
    imageUrls: z.array(z.object({ value: z.string().url() })).optional(),
})

export default function AddAccomodation({ onCreated }: { onCreated?: () => void }) {
    const [open, setOpen] = useState(false)
    const { toast } = useToast()
    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            name: '',
            url: '',
            overview: '',
            imageUrls: [],
        },
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "imageUrls",
    });

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        try {
            // Transform array of objects back to array of strings
            const formattedData = {
                ...data,
                imageUrls: data.imageUrls?.map(item => item.value) || []
            }

            const newAcc = await createAccommodation(formattedData)
            toast('', {
                description: (
                    <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
                        <code className="text-white">
                            {JSON.stringify(newAcc, null, 2)}
                        </code>
                    </pre>
                ),
            })
            setOpen(false)
            form.reset()
            if (onCreated) {
                onCreated()
            }
        } catch (error) {
            toast('', {
                variant: 'destructive',
                description: 'Failed to create accommodation',
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    className="w-full justify-start font-normal"
                >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Accommodation
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Accommodation</DialogTitle>
                    <DialogDescription>
                        Add a new accommodation to the list. Click save when
                        you're done.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="w-full space-y-6"
                    >
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Accommodation Name"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Website URL</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="https://example.com"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <FormLabel>Image URLs</FormLabel>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => append({ value: "" })}
                                >
                                    <Plus className="h-4 w-4 mr-1" /> Add Image
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {fields.map((field, index) => (
                                    <FormField
                                        key={field.id}
                                        control={form.control}
                                        name={`imageUrls.${index}.value`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <div className="flex gap-2">
                                                    <FormControl>
                                                        <Input {...field} placeholder="https://example.com/image.jpg" />
                                                    </FormControl>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => remove(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ))}
                                {fields.length === 0 && (
                                    <p className="text-sm text-muted-foreground">No images added yet.</p>
                                )}
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="overview"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Overview</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Brief description..."
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit">Save changes</Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
