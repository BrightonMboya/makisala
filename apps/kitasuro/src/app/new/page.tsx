'use client'

import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@repo/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@repo/ui/select'
import {
    Archive,
    CheckCircle,
    Clock,
    FileText,
    Folder,
    LayoutDashboard,
    Mail,
    Plus,
    Search,
    Settings,
    Star,
    Truck,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { DatePicker } from '@repo/ui/date-picker'
import { Combobox } from '@repo/ui/combobox'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@repo/ui/form'
import { CountryDropdown } from '@repo/ui/country-dropdown'
import { getToursList } from './actions'
import { useToast } from '@/lib/hooks/use-toast'

const initialRequests = [
    {
        id: '1',
        client: 'Jordan Malouf',
        travelers: 2,
        country: 'Australia',
        title: '2-Day Budget Gorilla Trekking',
        startDate: 'Nov 29, 2025',
        received: 'Nov 29, 2025',
        source: 'SafariBookings',
        status: 'new',
    },
    {
        id: '2',
        client: 'Sarah Jenkins',
        travelers: 4,
        country: 'USA',
        title: '7-Day Serengeti Migration',
        startDate: 'Aug 15, 2026',
        received: 'Nov 28, 2025',
        source: 'Website',
        status: 'working',
    },
]

const requestSchema = z.object({
    email: z.string().email('Valid email is required'),
    firstName: z.string().optional(),
    lastName: z.string().min(1, 'Last name is required'),
    country: z.string().min(1, 'Country is required'),
    destinationCountry: z.string().min(1, 'Destination is required'),
    phone: z.string().optional(),
    tourTitle: z.string().min(1, 'Tour title is required'),
    tourType: z.string().min(1, 'Tour type is required'),
    startDate: z.date(),
    travelers: z.number().min(1, 'At least 1 traveler is required'),
    selectedTourId: z.string().optional(),
})

type RequestFormValues = z.infer<typeof requestSchema>

export default function RequestsPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [requests, setRequests] = useState(initialRequests)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [availableTours, setAvailableTours] = useState<{ id: string; name: string; days: number }[]>([])

    const form = useForm<RequestFormValues>({
        resolver: zodResolver(requestSchema),
        defaultValues: {
            email: '',
            firstName: '',
            lastName: '',
            country: '',
            destinationCountry: '',
            phone: '',
            tourTitle: '',
            tourType: 'Private Tour',
            travelers: 2,
            selectedTourId: '',
        },
    })

    // Remove initial fetch
    // useEffect(() => {
    //     const fetchTours = async () => {
    //         const tours = await getToursList()
    //         setAvailableTours(tours)
    //     }
    //     fetchTours()
    // }, [])

    const handleDestinationChange = async (destination: string) => {
        form.setValue('destinationCountry', destination)
        // Fetch tours for selected destination (convert to lowercase for DB match)
        const tours = await getToursList(destination.toLowerCase())
        setAvailableTours(tours)
        // Reset selected tour if destination changes
        form.setValue('selectedTourId', '')
        form.setValue('tourTitle', '')
    }

    const handleTourSelect = async (tourId: string) => {
        const tour = availableTours.find(t => t.id === tourId)
        if (tour) {
            form.setValue('tourTitle', tour.name)
            form.setValue('selectedTourId', tourId)
        }
    }

    const onSubmit = async (data: RequestFormValues) => {
        try {
            const newId = (requests.length + 1).toString()
            const newRequest = {
                id: newId,
                client: `${data.firstName} ${data.lastName}`,
                travelers: data.travelers,
                country: data.country,
                title: data.tourTitle,
                startDate: data.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                received: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                source: 'Manual Entry',
                status: 'new',
            }
            
            setRequests([newRequest, ...requests])
            setIsDialogOpen(false)
            
            // If a tour was selected, we could fetch its details here and pass them via query params or context
            // For now, we'll just navigate to the builder. 
            // In a real app, we'd save the request to DB and the builder would load it.
            // Since we're using client state for requests list but DB for tours, 
            // we'll pass the tourId as a query param to pre-populate the builder.
            
            const queryParams = new URLSearchParams()
            if (data.selectedTourId) {
                queryParams.set('tourId', data.selectedTourId)
            }
            queryParams.set('startDate', data.startDate.toISOString())
            queryParams.set('clientName', `${data.firstName} ${data.lastName}`.trim())
            queryParams.set('tourTitle', data.tourTitle)
            queryParams.set('tourType', data.tourType)
            
            router.push(`/new/${newId}/day-by-day?${queryParams.toString()}`)
            
            toast("Request Created", {
                description: "Navigating to itinerary builder...",
            })
        } catch (error) {
            console.error('Error creating request:', error)
            toast("Error", {
                description: "Failed to create request.",
                variant: "destructive",
            })
        }
    }

    return (
        <div className="flex h-screen bg-stone-50">
            {/* Sidebar */}
            <div className="w-64 border-r border-stone-200 bg-white">
                <div className="p-6">
                    <h1 className="font-serif text-2xl font-bold text-green-800">
                        Makisala.
                    </h1>
                </div>
                <div className="px-4 py-2">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full justify-start gap-2 bg-green-700 hover:bg-green-800 shadow-sm">
                                <Plus className="h-4 w-4" />
                                New Request
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="font-serif text-xl">Add New Request</DialogTitle>
                            </DialogHeader>
                            
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                                    {/* Client Information */}
                                    <div>
                                        <h3 className="mb-4 text-sm font-bold text-stone-900 border-b pb-2">Client Information</h3>
                                        <div className="space-y-4">
                                            <FormField
                                                control={form.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Email *</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="client@example.com" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="firstName"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>First Name</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="lastName"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Last Name *</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="destinationCountry"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Destination *</FormLabel>
                                                            <Select onValueChange={(val) => handleDestinationChange(val)} defaultValue={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Select destination" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="Rwanda">Rwanda</SelectItem>
                                                                    <SelectItem value="Tanzania">Tanzania</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="country"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Client Country *</FormLabel>
                                                            <FormControl>
                                                                <CountryDropdown
                                                                    value={field.value}
                                                                    onChange={(c) => field.onChange(c.name)}
                                                                    placeholder="Select country"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <FormField
                                                control={form.control}
                                                name="phone"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Phone</FormLabel>
                                                        <FormControl>
                                                            <Input type="tel" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    {/* Request Details */}
                                    <div>
                                        <h3 className="mb-4 text-sm font-bold text-stone-900 border-b pb-2">Request Details</h3>
                                        <div className="space-y-4">
                                            <FormField
                                                control={form.control}
                                                name="selectedTourId"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Select Existing Tour (Optional)</FormLabel>
                                                        <FormControl>
                                                            <Combobox
                                                                items={availableTours.map(t => ({ value: t.id, label: `${t.name} (${t.days} days)` }))}
                                                                value={field.value || ''}
                                                                onChange={(val) => handleTourSelect(val)}
                                                                placeholder={
                                                                    form.watch('destinationCountry') 
                                                                        ? (availableTours.length > 0 ? "Select a tour template" : "No tours found for this destination") 
                                                                        : "Select destination first"
                                                                }
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="tourTitle"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Tour Title *</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="e.g., 5-Day Rwanda Gorilla Safari" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="tourType"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Tour Type</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="Private Tour">Private Tour</SelectItem>
                                                                <SelectItem value="Group Tour">Group Tour</SelectItem>
                                                                <SelectItem value="Self-drive">Self-drive</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="startDate"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Start Date *</FormLabel>
                                                            <FormControl>
                                                                <DatePicker date={field.value} setDate={field.onChange} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="travelers"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Travelers *</FormLabel>
                                                            <FormControl>
                                                                <Input 
                                                                    type="number" 
                                                                    min={1} 
                                                                    {...field} 
                                                                    onChange={e => field.onChange(parseInt(e.target.value))}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4 border-t">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => setIsDialogOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            className="bg-green-700 hover:bg-green-800"
                                        >
                                            Create & Start Building
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
                <nav className="mt-6 space-y-1 px-3">
                    <SidebarItem
                        icon={<Star className="h-4 w-4" />}
                        label="New Requests"
                        count={requests.filter(r => r.status === 'new').length}
                        active
                    />
                    <SidebarItem
                        icon={<FileText className="h-4 w-4" />}
                        label="In Progress"
                        count={requests.filter(r => r.status === 'working').length}
                    />
                    <div className="pt-4 pb-2">
                        <div className="px-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">
                            Folders
                        </div>
                    </div>
                    <SidebarItem
                        icon={<Archive className="h-4 w-4" />}
                        label="Confirmed Bookings"
                        count={0}
                    />
                    <SidebarItem
                        icon={<CheckCircle className="h-4 w-4" />}
                        label="Completed Tours"
                        count={0}
                    />
                    <SidebarItem
                        icon={<Folder className="h-4 w-4" />}
                        label="Archived"
                        count={0}
                    />
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto bg-stone-50/50">
                {/* Header */}
                <header className="flex items-center justify-between border-b border-stone-200 bg-white px-8 py-4">
                    <div className="flex items-center gap-1">
                        <h2 className="font-serif text-2xl font-bold text-stone-900">Dashboard</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-stone-400" />
                            <Input 
                                placeholder="Search requests..." 
                                className="pl-9 bg-stone-50 border-stone-200 focus:bg-white transition-colors" 
                            />
                        </div>
                        <Button variant="ghost" size="icon" className="text-stone-500 hover:text-stone-900">
                            <Settings className="h-5 w-5" />
                        </Button>
                    </div>
                </header>

                {/* Request List */}
                <div className="p-8 max-w-7xl mx-auto">
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 rounded-lg bg-white p-1 shadow-sm border border-stone-100">
                                <Button variant="ghost" size="sm" className="bg-stone-100 text-stone-900 shadow-sm">All</Button>
                                <Button variant="ghost" size="sm" className="text-stone-500">Unread</Button>
                                <Button variant="ghost" size="sm" className="text-stone-500">Drafts</Button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-stone-500">Sort by:</span>
                            <select className="rounded-md border-none bg-transparent text-sm font-medium text-stone-900 focus:ring-0">
                                <option>Date received</option>
                                <option>Priority</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {requests.map((req) => (
                            <Link
                                key={req.id}
                                href={`/new/${req.id}/day-by-day`}
                                className="group block cursor-pointer rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition-all hover:border-green-600/30 hover:shadow-md"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-green-800 transition-colors">
                                                {req.client}
                                            </h3>
                                            <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-800">
                                                {req.status === 'new' ? 'New Request' : 'In Progress'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-stone-600">
                                            <span className="flex items-center gap-1.5">
                                                {req.country}
                                            </span>
                                            <span className="text-stone-300">•</span>
                                            <span>
                                                {req.travelers} Travelers
                                            </span>
                                            <span className="text-stone-300">•</span>
                                            <span>
                                                {req.title}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1.5 text-sm font-medium text-stone-900">
                                            <Clock className="h-3.5 w-3.5 text-stone-400" />
                                            {req.startDate}
                                        </div>
                                        <div className="mt-1 text-xs text-stone-500">
                                            Received {req.received} via {req.source}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function SidebarItem({
    icon,
    label,
    count,
    active = false,
}: {
    icon: React.ReactNode
    label: string
    count: number
    active?: boolean
}) {
    return (
        <button
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                    ? 'bg-green-50 text-green-800'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
            }`}
        >
            <div className="flex items-center gap-3">
                {icon}
                {label}
            </div>
            {count > 0 && <span className="text-xs font-semibold text-stone-400">{count}</span>}
        </button>
    )
}
