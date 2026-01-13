'use client';

import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog';
import {
  CheckCircle,
  Clock,
  FileText,
  Plus,
  Settings,
  LogOut,
  LayoutDashboard,
  Users,
  Map
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { DatePicker } from '@repo/ui/date-picker';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form';
import { CountryDropdown } from '@repo/ui/country-dropdown';
import { getDashboardData } from '@/app/itineraries/actions';
import { createClient } from '@/app/(dashboard)/clients/actions';
import { useToast } from '@/lib/hooks/use-toast';
import { authClient } from '@/lib/auth-client';
import { Combobox } from '@repo/ui/combobox';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { requestSchema, type RequestFormValues } from '@/lib/schemas/request';


// --- Components ---

function SidebarItem({ 
  icon, 
  label, 
  count, 
  active = false,
  href
}: { 
  icon: React.ReactNode; 
  label: string; 
  count?: number; 
  active?: boolean;
  href?: string;
}) {
  const content = (
    <div className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      active ? 'bg-green-50 text-green-800' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
    }`}>
      <div className="flex items-center gap-3">
        {icon}
        {label}
      </div>
      {count !== undefined && count > 0 && <span className="text-xs font-semibold text-stone-400">{count}</span>}
    </div>
  );

  if (href) {
    return <Link href={href} className="block w-full">{content}</Link>;
  }

  return <button className="w-full text-left">{content}</button>;
}

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewClient, setIsNewClient] = useState(false);
  const { data: session } = authClient.useSession();

  // Query shared data
  const { data: dashboardData } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: getDashboardData,
    staleTime: 30 * 1000,
  });

  const availableTours = dashboardData?.tours || [];
  const requests = dashboardData?.proposals || [];
  const clients = dashboardData?.clients || [];

  // Forms
  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      clientId: '',
      email: '',
      firstName: '',
      lastName: '',
      country: '',
      phone: '',
      tourTitle: '',
      tourType: 'Private Tour',
      travelers: 2,
      selectedTourId: '',
    },
  });


  const handleTourSelect = (tourId: string) => {
    form.setValue('selectedTourId', tourId);
    if (tourId) {
      const selectedTour = availableTours.find((t) => t.id === tourId);
      if (selectedTour) {
        form.setValue('tourTitle', selectedTour.name);
      }
    }
  };

  const onSubmit = async (data: RequestFormValues) => {
      let clientId = data.clientId;

      // If creating a new client, create it first
      if (isNewClient && data.lastName) {
        try {
          const result = await createClient({
            name: `${data.firstName || ''} ${data.lastName}`.trim(),
            email: data.email || undefined,
            phone: data.phone || undefined,
            countryOfResidence: data.country || undefined,
          });
          clientId = result.id;
          // Invalidate query to refresh clients list
          queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
        } catch (error) {
          toast({ title: 'Failed to create client', variant: 'destructive' });
          return;
        }
      }

      const newId = Math.random().toString(36).substring(7);
      const queryParams = new URLSearchParams();
      if (data.selectedTourId) queryParams.set('tourId', data.selectedTourId);
      queryParams.set('startDate', data.startDate.toISOString());
      if (clientId) queryParams.set('clientId', clientId);
      queryParams.set('tourTitle', data.tourTitle);
      queryParams.set('tourType', data.tourType);
      queryParams.set('travelers', data.travelers.toString());

      setIsDialogOpen(false); // Close dialog
      router.push(`/itineraries/${newId}/day-by-day?${queryParams.toString()}`);
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push('/login');
  };

  return (
      <div className="w-64 border-r border-stone-200 bg-white flex flex-col h-full min-h-screen fixed left-0 top-0">
        <div className="p-6">
          <Link href="/dashboard">
             <h1 className="font-serif text-2xl font-bold text-green-800">Makisala.</h1>
          </Link>
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
                    {/* Client Selection */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => { setIsNewClient(false); form.setValue('clientId', ''); }}
                          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${!isNewClient ? 'bg-green-100 text-green-800' : 'text-stone-600 hover:bg-stone-100'}`}
                        >
                          Existing Client
                        </button>
                        <button
                          type="button"
                          onClick={() => { setIsNewClient(true); form.setValue('clientId', ''); }}
                          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${isNewClient ? 'bg-green-100 text-green-800' : 'text-stone-600 hover:bg-stone-100'}`}
                        >
                          New Client
                        </button>
                      </div>

                      {!isNewClient ? (
                        <FormField
                          control={form.control}
                          name="clientId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Select Client *</FormLabel>
                              <FormControl>
                                <Combobox
                                  items={clients.map(c => ({ value: c.id, label: c.name }))}
                                  value={field.value || null}
                                  onChange={field.onChange}
                                  placeholder="Search clients..."
                                />
                              </FormControl>
                              {clients.length === 0 && (
                                <p className="text-xs text-stone-500">No clients yet. Switch to "New Client" to create one.</p>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : (
                        <>
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
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
                          <FormField
                            control={form.control}
                            name="country"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Client Country</FormLabel>
                                <FormControl>
                                  <CountryDropdown
                                    value={field.value || ''}
                                    onChange={(c) => field.onChange(c.name)}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                    </div>

                    {/* Tour Template Selection */}
                    <FormField
                      control={form.control}
                      name="selectedTourId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tour Template *</FormLabel>
                          <FormControl>
                            <Combobox
                              items={availableTours.map((t) => ({
                                value: t.id,
                                label: `${t.name} (${t.days} days)`,
                              }))}
                              value={field.value || null}
                              onChange={(value) => handleTourSelect(value)}
                              placeholder="Search tour templates..."
                            />
                          </FormControl>
                          {availableTours.length === 0 && (
                            <p className="text-xs text-stone-500">No tour templates available. Create tours first.</p>
                          )}
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
                              <Input {...field} placeholder="Auto-filled from template, customize if needed" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
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
          <SidebarItem 
            icon={<LayoutDashboard className="h-4 w-4" />} 
            label="Dashboard" 
            href="/dashboard"
            active={pathname === '/dashboard'}
          />
          <SidebarItem 
            icon={<Map className="h-4 w-4" />} 
            label="Itineraries" 
            href="/itineraries"
            count={requests.length}
            active={pathname?.startsWith('/itineraries') && !pathname.includes('day-by-day')} 
          />
          <SidebarItem 
            icon={<Users className="h-4 w-4" />} 
            label="Clients" 
            href="/clients"
            count={clients.length}
            active={pathname?.startsWith('/clients')}
          />
          
          <div className="pt-4 mt-4 border-t border-stone-100">
             <SidebarItem icon={<FileText className="h-4 w-4" />} label="Requests" count={requests.filter(r => r.status !== 'shared').length} />
             <SidebarItem icon={<CheckCircle className="h-4 w-4" />} label="Shared" count={requests.filter(r => r.status === 'shared').length} />
          </div>

          <SidebarItem
            icon={<Settings className="h-4 w-4" />}
            label="Settings"
            href="/settings"
            active={pathname?.startsWith('/settings')}
          />
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
  );
}
