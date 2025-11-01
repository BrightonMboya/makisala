import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '@/lib/hooks/use-toast'

const FormSchema = z.object({
    name: z.string().min(2, {
        message: 'Accomodation listing should include a name',
    }),
    email: z.email({
        message: 'We need an email address for communication to this listing',
    }),
    // phoneNumber: z.string().min(10, {
    //     message: 'Adding a sales phone number of this listing is required',
    // }),
    overview: z.string().min(2, {
        message:
            'Overview is necessary to display in itineraries and on the website',
    }),
})

export default function AddAccomodation() {
    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
    })
    const { toast } = useToast()

    function onSubmit(data: z.infer<typeof FormSchema>) {
        toast('You submitted the following values:', {
            description: (
                <pre className="mt-2 w-[320px] rounded-md bg-neutral-950 p-4">
                    <code className="text-white">
                        {JSON.stringify(data, null, 2)}
                    </code>
                </pre>
            ),
        })
    }

    return (
        <>
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline">
                        Add a new Accommodation Entry
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] md:max-w-[600px]">
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="my-5"
                        >
                            <DialogHeader>
                                <DialogTitle>New Accommodation</DialogTitle>
                                <DialogDescription>
                                    Make changes to your profile here. Click
                                    save when you&apos;re done.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="my-5 grid gap-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <Input
                                                placeholder="Serengeti Sopa Lodge"
                                                {...field}
                                            />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="sales@sopalodges.com"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="overview"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Overview</FormLabel>
                                            <Textarea
                                                placeholder="This property is located in the Southern Serengeti offerring a mixture of luxury ..."
                                                {...field}
                                            />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button type="submit">Save changes</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    )
}
