'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { FileText, LayoutDashboard, LogOut, Map, Plus, Settings, Users, Library } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@repo/ui/sidebar';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authClient, useActiveOrganization } from '@/lib/auth-client';
import { getOrganizationSettings } from '@/app/(dashboard)/settings/actions';
import { NewRequestDialog } from './new-request-dialog';

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const { data: activeOrg } = useActiveOrganization();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: orgSettings } = useQuery({
    queryKey: ['organization-settings'],
    queryFn: () => getOrganizationSettings(),
  });

  // Get org info from active organization
  const orgName = activeOrg?.name || 'Dashboard';
  const orgLogo = orgSettings?.logoUrl;
  const orgInitial = orgName[0]?.toUpperCase();
  const userName = session?.user?.name || '';
  const userEmail = session?.user?.email || '';

  const handleSignOut = async () => {
    queryClient.clear();
    await authClient.signOut();
    router.push('/login');
  };

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      href: '/dashboard',
      active: pathname === '/dashboard',
    },
    {
      icon: Map,
      label: 'Tours',
      href: '/tours',
      active: pathname?.startsWith('/tours'),
    },
    {
      icon: FileText,
      label: 'Itineraries',
      href: '/itineraries',
      active:
        pathname?.startsWith('/itineraries') &&
        !pathname.includes('day-by-day') &&
        !pathname.includes('pricing') &&
        !pathname.includes('preview') &&
        !pathname.includes('share'),
    },
    {
      icon: Library,
      label: 'Content Library',
      href: '/content-library',
      active: pathname?.startsWith('/content-library'),
    },
    {
      icon: Users,
      label: 'Clients',
      href: '/clients',
      active: pathname?.startsWith('/clients'),
    },
    {
      icon: Settings,
      label: 'Settings',
      href: '/settings',
      active: pathname?.startsWith('/settings'),
    },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-stone-200 p-4 group-data-[collapsible=icon]:p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              tooltip={orgName}
              className="group-data-[collapsible=icon]:!p-2"
            >
              <Link href="/dashboard">
                {orgLogo ? (
                  <img src={orgLogo} alt={orgName} className="h-10 w-10 rounded-full border-2 border-stone-200 object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 font-serif text-lg font-bold text-green-800">
                    {orgInitial}
                  </div>
                )}
                <span className="truncate font-serif text-lg font-bold text-green-800 group-data-[collapsible=icon]:hidden">
                  {orgName}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* New Request Button */}
        <SidebarGroup className="px-2 py-2">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setIsDialogOpen(true)}
                  tooltip="New Request"
                  className="bg-green-700 text-white hover:bg-green-800 hover:text-white"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Request</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Navigation */}
        <SidebarGroup className="px-2">
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={item.active} tooltip={item.label}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-stone-200 p-2">
        <SidebarMenu className="gap-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip={userName}
              className="group-data-[collapsible=icon]:!p-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 font-bold text-green-800">
                {userName[0] || '?'}
              </div>
              <div className="flex flex-col items-start group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-medium">{userName}</span>
                <span className="truncate text-xs text-stone-500">{userEmail}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              tooltip="Sign Out"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="h-4 w-4" />
              <span className="group-data-[collapsible=icon]:hidden">Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />

      {/* New Request Dialog - lazy loads data only when opened */}
      <NewRequestDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </Sidebar>
  );
}
