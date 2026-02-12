import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs';
import { Building2, Users, Bell, User } from 'lucide-react';
import { OrganizationSettings } from './_components/organization-settings';
import { TeamManagement } from './_components/team-management';
import { NotificationSettings } from './_components/notification-settings';
import { ProfileSettings } from './_components/profile-settings';
import {
  getOrganizationSettings,
  getTeamMembers,
  getPendingInvitations,
  getCurrentUser,
  checkIsAdmin,
} from './actions';
import { redirect } from 'next/navigation';

interface SettingsPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const isAdmin = await checkIsAdmin();
  const params = await searchParams;

  const [organization, teamMembers, pendingInvitations, currentUser] = await Promise.all([
    getOrganizationSettings(),
    getTeamMembers(),
    getPendingInvitations(),
    getCurrentUser(),
  ]);

  if (!organization || !currentUser) {
    redirect('/login');
  }

  // Determine default tab from URL param or based on admin status
  const validTabs = ['organization', 'team', 'notifications', 'profile'];
  const requestedTab = params.tab;
  const defaultTab = requestedTab && validTabs.includes(requestedTab)
    ? requestedTab
    : (isAdmin ? 'organization' : 'profile');

  return (
    <div className="p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">Manage your organization and account settings</p>
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1">
            <TabsTrigger
              value="organization"
              className="gap-2 py-2"
              disabled={!isAdmin}
            >
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Organization</span>
            </TabsTrigger>
            <TabsTrigger
              value="team"
              className="gap-2 py-2"
              disabled={!isAdmin}
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Team</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 py-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2 py-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="organization">
            {isAdmin ? (
              <OrganizationSettings organization={organization} />
            ) : (
              <div className="text-center py-12 text-gray-500">
                Only admins can access organization settings.
              </div>
            )}
          </TabsContent>

          <TabsContent value="team">
            {isAdmin ? (
              <TeamManagement
                members={teamMembers}
                invitations={pendingInvitations}
                currentUserId={currentUser.id}
              />
            ) : (
              <div className="text-center py-12 text-gray-500">
                Only admins can manage team members.
              </div>
            )}
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationSettings organization={organization} isAdmin={isAdmin} />
          </TabsContent>

          <TabsContent value="profile">
            <ProfileSettings user={currentUser} isAdmin={isAdmin} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
