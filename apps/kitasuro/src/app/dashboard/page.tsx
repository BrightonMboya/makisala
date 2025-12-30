'use client';

import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog';
import { Select, SelectContent, SelectItem, SelectValue, SelectTrigger } from '@repo/ui/select';
import {
  CheckCircle,
  Clock,
  FileText,
  Plus,
  Search,
  Settings,
  LogOut,
  LayoutDashboard
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { DatePicker } from '@repo/ui/date-picker';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form';
import { CountryDropdown } from '@repo/ui/country-dropdown';
import { getToursList, getAllProposals, getOrganizationSettings, updateOrganizationSettings } from '../itineraries/actions';
import { useToast } from '@/lib/hooks/use-toast';
import { authClient } from '@/lib/auth-client';

const requestSchema = z.object({
  email: z.email('Valid email is required'),
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
});

type RequestFormValues = z.infer<typeof requestSchema>;

type RequestItem = {
  id: string;
  client: string;
  travelers: number;
  country: string;
  title: string;
  startDate: string;
  received: string;
  source: string;
  status: 'new' | 'working' | 'draft' | 'shared';
};

const settingsSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  logoUrl: z.string().url('Secure URL is required').or(z.literal('')),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Valid hex color required'),
  notificationEmail: z.string().email('Valid email is required').or(z.literal('')),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [availableTours, setAvailableTours] = useState<
    { id: string; name: string; days: number }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [organization, setOrganization] = useState<any>(null);
  const { data: session, isPending: isSessionPending } = authClient.useSession();

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
  });

  const settingsForm = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: '',
      logoUrl: '',
      primaryColor: '#15803d',
      notificationEmail: '',
    },
  });

  useEffect(() => {
    if (!isSessionPending && !session) {
      router.push('/login');
    }
  }, [session, isSessionPending, router]);

  useEffect(() => {
    const fetchProposals = async () => {
      setIsLoading(true);
      try {
        const proposals = await getAllProposals();
        const transformed: RequestItem[] = proposals.map((p: any) => ({
          id: p.id,
          client: p.clientName || 'Unknown',
          travelers: 0, // Simplified for now
          country: 'Unknown',
          title: p.tourTitle || p.name,
          startDate: p.startDate ? new Date(p.startDate).toLocaleDateString() : 'TBD',
          received: new Date(p.createdAt).toLocaleDateString(),
          source: 'Manual',
          status: p.status === 'shared' ? 'shared' : 'draft',
        }));
        setRequests(transformed);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProposals();
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      if (session) {
        const settings = await getOrganizationSettings();
        if (settings) {
          setOrganization(settings);
          settingsForm.reset({
            name: settings.name,
            logoUrl: settings.logoUrl || '',
            primaryColor: settings.primaryColor || '#15803d',
            notificationEmail: settings.notificationEmail || '',
          });
        }
      }
    };
    fetchSettings();
  }, [session, settingsForm]);

  const handleDestinationChange = async (destination: string) => {
    form.setValue('destinationCountry', destination);
    const tours = await getToursList(destination.toLowerCase());
    setAvailableTours(tours);
  };

  const onSubmit = async (data: RequestFormValues) => {
      const newId = Math.random().toString(36).substring(7);
      const queryParams = new URLSearchParams();
      if (data.selectedTourId) queryParams.set('tourId', data.selectedTourId);
      queryParams.set('startDate', data.startDate.toISOString());
      queryParams.set('clientName', `${data.firstName} ${data.lastName}`.trim());
      queryParams.set('tourTitle', data.tourTitle);
      queryParams.set('tourType', data.tourType);
      queryParams.set('travelers', data.travelers.toString());

      router.push(`/itineraries/${newId}/day-by-day?${queryParams.toString()}`);
  };

  const onSettingsSubmit = async (data: SettingsFormValues) => {
    const result = await updateOrganizationSettings(data);
    if (result.success) {
      toast({
        title: 'Settings updated',
        description: 'Organization settings have been saved successfully.',
      });
      setIsSettingsOpen(false);
      // Refresh organization state
      setOrganization({ ...organization, ...data });
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to update settings',
        variant: 'destructive',
      });
    }
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push('/login');
  };

  if (isSessionPending) return null;

  return (
    <div className="flex h-screen bg-stone-50">
      {/* Sidebar */}
      <div className="w-64 border-r border-stone-200 bg-white flex flex-col">
        <div className="p-6">
          <h1 className="font-serif text-2xl font-bold text-green-800">Makisala.</h1>
        </div>
        <div className="px-4 py-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full justify-start gap-2 bg-green-700 shadow-sm hover:bg-green-800">
                <Plus className="h-4 w-4" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
               <DialogHeader>
                <DialogTitle className="font-serif text-xl">Add New Request</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem><FormLabel>Last Name *</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
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
                              <Select
                                onValueChange={(val) => handleDestinationChange(val)}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger><SelectValue placeholder="Select destination" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Rwanda">Rwanda</SelectItem>
                                  <SelectItem value="Tanzania">Tanzania</SelectItem>
                                </SelectContent>
                              </Select>
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
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="tourTitle"
                        render={({ field }) => (
                          <FormItem><FormLabel>Tour Title *</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                        )}
                      />
                       <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="startDate"
                          render={({ field }) => (
                            <FormItem><FormLabel>Start Date *</FormLabel><FormControl><DatePicker date={field.value} setDate={field.onChange} /></FormControl></FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="travelers"
                          render={({ field }) => (
                            <FormItem><FormLabel>Travelers *</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl></FormItem>
                          )}
                        />
                      </div>
                  </div>
                  <div className="flex justify-end gap-3 border-t pt-4">
                    <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" className="bg-green-700 hover:bg-green-800">Create & Start Building</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        <nav className="mt-6 flex-1 space-y-1 px-3">
          <SidebarItem icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" active />
          <SidebarItem icon={<FileText className="h-4 w-4" />} label="In Progress" count={requests.length} />
          <SidebarItem icon={<CheckCircle className="h-4 w-4" />} label="Shared" count={requests.filter(r => r.status === 'shared').length} />
          
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <button className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50 hover:text-stone-900">
                <div className="flex items-center gap-3">
                  <Settings className="h-4 w-4" />
                  Settings
                </div>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Organization Settings</DialogTitle>
              </DialogHeader>
              <Form {...settingsForm}>
                <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-4 py-4">
                  <FormField
                    control={settingsForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agency Name</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={settingsForm.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo URL (Supabase Storage)</FormLabel>
                        <FormControl><Input {...field} placeholder="https://..." /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={settingsForm.control}
                      name="primaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Brand Color</FormLabel>
                          <div className="flex gap-2">
                             <Input type="color" {...field} className="h-10 w-12 p-1" />
                             <Input {...field} className="flex-1" />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={settingsForm.control}
                    name="notificationEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notification Email</FormLabel>
                        <FormControl><Input {...field} placeholder="notifications@example.com" /></FormControl>
                        <p className="text-[10px] text-stone-400 mt-1">Comments on your proposals will be sent here.</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
                    <Button type="submit" className="bg-green-700 hover:bg-green-800">Save Changes</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </nav>
        <div className="mt-auto border-t border-stone-200 p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-bold">
              {session?.user.name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-900 truncate">{session?.user.name}</p>
              <p className="text-xs text-stone-500 truncate">{session?.user.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="flex items-center justify-between border-b border-stone-200 bg-white px-8 py-4">
          <h2 className="font-serif text-2xl font-bold text-stone-900">Dashboard</h2>
          <div className="flex items-center gap-4">
             <div className="relative w-64">
              <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-stone-400" />
              <Input placeholder="Search proposals..." className="pl-9" />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl p-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="py-24 text-center">
              <div className="mx-auto h-12 w-12 text-stone-300 mb-4">
                <FileText className="h-full w-full" />
              </div>
              <h3 className="text-lg font-medium text-stone-900">No proposals yet</h3>
              <p className="text-stone-500 mt-1">Create your first proposal to get started.</p>
              <Button className="mt-6 bg-green-700 hover:bg-green-800" onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Proposal
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <Link
                  key={req.id}
                  href={`/itineraries/${req.id}/day-by-day`}
                  className="group block rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition-all hover:border-green-600/30 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-green-800">{req.client}</h3>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          req.status === 'shared' ? 'bg-green-100 text-green-800' : 'bg-stone-100 text-stone-800'
                        }`}>
                          {req.status === 'shared' ? 'Shared' : 'Draft'}
                        </span>
                      </div>
                      <p className="text-sm text-stone-600 mt-1">{req.title}</p>
                    </div>
                    <div className="text-right text-sm text-stone-500">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Clock className="h-3.5 w-3.5" />
                        Starts {req.startDate}
                      </div>
                      <div className="mt-1">Created {req.received}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, count, active = false }: { icon: React.ReactNode; label: string; count?: number; active?: boolean }) {
  return (
    <button className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      active ? 'bg-green-50 text-green-800' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
    }`}>
      <div className="flex items-center gap-3">
        {icon}
        {label}
      </div>
      {count !== undefined && count > 0 && <span className="text-xs font-semibold text-stone-400">{count}</span>}
    </button>
  );
}
