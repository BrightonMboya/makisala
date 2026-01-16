'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Map,
  Users,
  Settings,
  FileText,
  Plus,
  LogOut,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
  useSidebar,
} from '@repo/ui/sidebar';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui/tooltip';
import { DatePicker } from '@repo/ui/date-picker';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form';
import { CountryDropdown } from '@repo/ui/country-dropdown';
import { Combobox } from '@repo/ui/combobox';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getDashboardData } from '@/app/itineraries/actions';
import { queryKeys, staleTimes } from '@/lib/query-keys';
import { createClient } from '@/app/(dashboard)/clients/actions';
import { useToast } from '@/lib/hooks/use-toast';
import { authClient } from '@/lib/auth-client';
import { type RequestFormValues, requestSchema } from '@/lib/schemas/request';

// Sidebar Item Component - matches original styling
function SidebarItem({
  icon,
  label,
  count,
  active = false,
  href,
  isCollapsed,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  active?: boolean;
  href?: string;
  isCollapsed?: boolean;
}) {
  const content = (
    <div
      className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-green-50 text-green-800'
          : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
      } ${isCollapsed ? 'justify-center px-2' : ''}`}
    >
      <div className={`flex items-center ${isCollapsed ? '' : 'gap-3'}`}>
        {icon}
        {!isCollapsed && label}
      </div>
      {!isCollapsed && count !== undefined && count > 0 && (
        <span className="text-xs font-semibold text-stone-400">{count}</span>
      )}
    </div>
  );

  const linkOrButton = href ? (
    <Link href={href} className="block w-full">
      {content}
    </Link>
  ) : (
    <button className="w-full text-left">{content}</button>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkOrButton}</TooltipTrigger>
        <TooltipContent side="right" className="bg-stone-900 text-white">
          {label}
          {count !== undefined && count > 0 && (
            <span className="ml-2 text-stone-400">({count})</span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkOrButton;
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewClient, setIsNewClient] = useState(false);

  // Query shared data - only fetch clients and org tours for the New Request form
  const { data: dashboardData } = useQuery({
    queryKey: queryKeys.dashboardData(session?.user?.id),
    queryFn: getDashboardData,
    staleTime: staleTimes.dashboardData,
    enabled: !!session?.user?.id,
  });

  const availableTours = dashboardData?.tours || [];
  const clients = dashboardData?.clients || [];

  // Form
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
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardData(session?.user?.id) });
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

    setIsDialogOpen(false);
    router.push(`/itineraries/${newId}/day-by-day?${queryParams.toString()}`);
  };

  const handleSignOut = async () => {
    queryClient.clear();
    await authClient.signOut();
    router.push('/login');
  };

  return (
    <Sidebar collapsible="icon">
      {/* Logo */}
      <SidebarHeader className={`border-b border-stone-200 ${isCollapsed ? 'p-2' : 'p-6'}`}>
        <Link href="/dashboard">
          {isCollapsed ? (
            <span className="flex items-center justify-center font-serif text-2xl font-bold text-green-800">M</span>
          ) : (
            <h1 className="font-serif text-2xl font-bold text-green-800">Makisala.</h1>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="flex flex-col">
        {/* New Request Button */}
        <div className={`${isCollapsed ? 'px-2 py-2' : 'px-4 py-2'}`}>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                    <Button
                      className="w-full justify-center bg-green-700 p-2 shadow-sm hover:bg-green-800"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-stone-900 text-white">
                  New Request
                </TooltipContent>
              </Tooltip>
            ) : (
              <DialogTrigger asChild>
                <Button className="w-full justify-start gap-2 bg-green-700 shadow-sm hover:bg-green-800">
                  <Plus className="h-4 w-4" />
                  New Request
                </Button>
              </DialogTrigger>
            )}
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
                          onClick={() => {
                            setIsNewClient(false);
                            form.setValue('clientId', '');
                          }}
                          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${!isNewClient ? 'bg-green-100 text-green-800' : 'text-stone-600 hover:bg-stone-100'}`}
                        >
                          Existing Client
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsNewClient(true);
                            form.setValue('clientId', '');
                          }}
                          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${isNewClient ? 'bg-green-100 text-green-800' : 'text-stone-600 hover:bg-stone-100'}`}
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
                                  items={clients.map((c) => ({ value: c.id, label: c.name }))}
                                  value={field.value || null}
                                  onChange={field.onChange}
                                  placeholder="Search clients..."
                                />
                              </FormControl>
                              {clients.length === 0 && (
                                <p className="text-xs text-stone-500">
                                  No clients yet. Switch to "New Client" to create one.
                                </p>
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
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
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
                                </FormItem>
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
                            <p className="text-xs text-stone-500">
                              No tour templates available. Create tours first.
                            </p>
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
                            <Input
                              {...field}
                              placeholder="Auto-filled from template, customize if needed"
                            />
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
                          <FormItem>
                            <FormLabel>Start Date *</FormLabel>
                            <FormControl>
                              <DatePicker date={field.value} setDate={field.onChange} />
                            </FormControl>
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
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 border-t pt-4">
                    <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-green-700 hover:bg-green-800">
                      Create & Start Building
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Main Navigation */}
        <nav className="mt-6 flex-1 space-y-1 px-3">
          <SidebarItem
            icon={<LayoutDashboard className="h-4 w-4" />}
            label="Dashboard"
            href="/dashboard"
            active={pathname === '/dashboard'}
            isCollapsed={isCollapsed}
          />
          <SidebarItem
            icon={<Map className="h-4 w-4" />}
            label="Tours"
            href="/tours"
            active={pathname?.startsWith('/tours')}
            isCollapsed={isCollapsed}
          />
          <SidebarItem
            icon={<FileText className="h-4 w-4" />}
            label="Itineraries"
            href="/itineraries"
            active={pathname?.startsWith('/itineraries') && !pathname.includes('day-by-day') && !pathname.includes('pricing') && !pathname.includes('preview') && !pathname.includes('share')}
            isCollapsed={isCollapsed}
          />
          <SidebarItem
            icon={<Users className="h-4 w-4" />}
            label="Clients"
            href="/clients"
            active={pathname?.startsWith('/clients')}
            isCollapsed={isCollapsed}
          />
          <SidebarItem
            icon={<Settings className="h-4 w-4" />}
            label="Settings"
            href="/settings"
            active={pathname?.startsWith('/settings')}
            isCollapsed={isCollapsed}
          />
        </nav>
      </SidebarContent>

      {/* Footer with User Info */}
      <SidebarFooter className="border-t border-stone-200 p-4">
        {!isCollapsed && (
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 font-bold text-green-800">
              {session?.user?.name?.[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-stone-900">{session?.user?.name}</p>
              <p className="truncate text-xs text-stone-500">{session?.user?.email}</p>
            </div>
          </div>
        )}
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-stone-900 text-white">
              Sign Out
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
