"use client";

import React from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {format} from "date-fns";
import {CalendarIcon} from "lucide-react";

import {Button} from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
import {Checkbox} from "@/components/ui/checkbox";
import {Calendar} from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {cn} from "@/lib/utils";
import {useToast} from "@/lib/hooks/use-toast";
import {createInquiry} from "@/lib/cms-service";
import {ScrollArea} from "@/components/ui/scroll-area"

const formSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    countryOfResidence: z.string().min(1, "Country of residence is required"),
    phoneNumber: z.string().min(1, "Phone number is required"),
    email: z.string().email("Valid email is required"),
    startDate: z.date({
        message: "Start date is required",
    }),
    numberOfNights: z.string().min(1, "Number of nights is required"),
    numberOfAdults: z.string().min(1, "Number of adults is required"),
    numberOfChildren: z.string(),
    flightAssistance: z.enum(["yes", "no"]),
    experienceType: z.enum(["mid-range", "high-end", "top-end"]),
    comments: z.string().min(1, "Comments are required"),
    contactMethod: z.string().min(1, "Contact method is required"),
    consent: z.boolean().refine((val) => val === true, {
        message: "You must agree to the privacy policy",
    }),
});

type FormData = z.infer<typeof formSchema>;

const countries = [
    "United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Italy", "Spain",
    "Netherlands", "Switzerland", "Japan", "South Korea", "Singapore", "New Zealand", "South Africa"
];

const nightOptions = Array.from({length: 30}, (_, i) => (i + 1).toString());
const adultOptions = Array.from({length: 10}, (_, i) => (i + 1).toString());
const childrenOptions = Array.from({length: 6}, (_, i) => i.toString());

const currencies = ["USD", "EUR", "GBP", "AUD", "CAD", "CHF", "JPY", "ZAR"];

interface InquiryDialogProps {
    children: React.ReactNode;
}

export function InquiryDialog({children}: InquiryDialogProps) {
    const [open, setOpen] = React.useState(false);
    const [openCalendar, setOpenCalendar] = React.useState<boolean>(false);
    const {toast} = useToast()

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            countryOfResidence: "",
            phoneNumber: "",
            email: "",
            numberOfNights: "",
            numberOfAdults: "",
            numberOfChildren: "0",
            flightAssistance: "no",
            experienceType: "mid-range",
            comments: "",
            contactMethod: "",
            consent: true,
        },
    });

    const onSubmit = async (data: FormData) => {
        try {
            await createInquiry(data);
            toast({
                title: "Inquiry Submitted",
                description: "We'll get back to you within 24 hours!",
            });
            setOpen(false);
            form.reset();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to submit inquiry. Please try again.',
                variant: 'destructive',
            });
            console.log(error)
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent
                className="sm:max-w-[600px] max-h-screen overflow-y-scroll border border-red-500">
                {/*<ScrollArea className="overflow-y-auto max-h-[calc(90dvh-4rem)]">*/}
                <DialogHeader>
                    <DialogTitle>Safari Inquiry</DialogTitle>
                    <DialogDescription>
                        * indicates required fields. Tell us about your dream safari and we'll create the perfect
                        itinerary for you.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Personal Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Personal Information</h3>
                            <FormField
                                control={form.control}
                                name="email"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Email*</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter Email" type="email" {...field} />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="firstName"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>First Name*</FormLabel>
                                            <FormControl>
                                                <Input placeholder="First" {...field} />
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="lastName"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Last Name*</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Last" {...field} />
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="countryOfResidence"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Country of Residence*</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select your country"/>
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {countries.map((country) => (
                                                        <SelectItem key={country} value={country}>
                                                            {country}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="phoneNumber"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Phone Number*</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Phone number" {...field} />
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Travel Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Travel Information</h3>
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({field}) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>What is your start date?*</FormLabel>
                                        <Popover open={openCalendar} onOpenChange={setOpenCalendar}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP")
                                                        ) : (
                                                            <span>Pick a date</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50"/>
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="p-0 w-auto" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={(e) => {
                                                        setOpenCalendar(false)
                                                        field.onChange(e)
                                                    }}
                                                    disabled={(date) => date < new Date()}
                                                    initialFocus
                                                    className={cn("p-3 pointer-events-auto")}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />

                            <div className="flex flex-col md:grid md:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="numberOfNights"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Number of Nights?*</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Number of nights"/>
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {nightOptions.map((night) => (
                                                        <SelectItem key={night} value={night}>
                                                            {night} night{night !== "1" ? "s" : ""}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="numberOfAdults"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Number of Adults (over 18)*</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Number of adults"/>
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {adultOptions.map((adult) => (
                                                        <SelectItem key={adult} value={adult}>
                                                            {adult} adult{adult !== "1" ? "s" : ""}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="numberOfChildren"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Number of Children (under 18)</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue/>
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {childrenOptions.map((child) => (
                                                        <SelectItem key={child} value={child}>
                                                            {child} {child !== "1" ? "children" : "child"}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="flightAssistance"
                                render={({field}) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel>Do you need assistance booking your international
                                            flights?*</FormLabel>
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                className="flex flex-row space-x-6"
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="yes" id="flights-yes"/>
                                                    <label htmlFor="flights-yes">Yes</label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="no" id="flights-no"/>
                                                    <label htmlFor="flights-no">No</label>
                                                </div>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="experienceType"
                                render={({field}) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel>What kind of experience are you after?*</FormLabel>
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                className="space-y-3"
                                            >
                                                <div className="flex items-start space-x-2">
                                                    <RadioGroupItem value="mid-range" id="mid-range"
                                                                    className="mt-1"/>
                                                    <div>
                                                        <label htmlFor="mid-range"
                                                               className="font-medium">Mid-range</label>
                                                        <p className="text-sm text-muted-foreground">
                                                            I want a quality experience but don't need luxury, think
                                                            authentic tented camps.
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start space-x-2">
                                                    <RadioGroupItem value="high-end" id="high-end"
                                                                    className="mt-1"/>
                                                    <div>
                                                        <label htmlFor="high-end"
                                                               className="font-medium">High-end</label>
                                                        <p className="text-sm text-muted-foreground">
                                                            I want a luxury experience, great food & wine, good
                                                            service
                                                            and luxury facilities.
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start space-x-2">
                                                    <RadioGroupItem value="top-end" id="top-end" className="mt-1"/>
                                                    <div>
                                                        <label htmlFor="top-end"
                                                               className="font-medium">Top-end</label>
                                                        <p className="text-sm text-muted-foreground">
                                                            I simply want the best available, cost should not be a
                                                            consideration.
                                                        </p>
                                                    </div>
                                                </div>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="comments"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Any other comments or requests?*</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="We are two families travelling together and would love to see gorillas and chimps, do a 7-day safari to experience the wildebeest migration and then spend 5 days on the beach with great snorkelling and diving. We are an adventurous bunch and would also love to include some walking safaris with the BIG5!"
                                                className="min-h-[100px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="contactMethod"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>How would you prefer to discuss your adventure
                                            further?*</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Call me" {...field} />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="consent"
                                render={({field}) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>
                                                Consent*
                                            </FormLabel>
                                            <p className="text-sm text-muted-foreground">
                                                I agree to the privacy policy.
                                            </p>
                                        </div>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Button type="submit" className="w-full">
                            Submit Inquiry
                        </Button>
                    </form>
                </Form>
                {/*</ScrollArea>*/}
            </DialogContent>
        </Dialog>
    );
}