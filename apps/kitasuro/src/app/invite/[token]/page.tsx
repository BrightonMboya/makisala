import {
  getInvitationByToken,
  acceptInvitation,
} from '@/app/(dashboard)/settings/actions';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import Link from 'next/link';

async function getSession() {
  return await auth.api.getSession({ headers: await headers() });
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invitation = await getInvitationByToken(token);
  const session = await getSession();

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is logged in, process the invitation
  if (session?.user?.id) {
    // Check if email matches
    if (session.user.email !== invitation.email) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Email Mismatch</CardTitle>
              <CardDescription>
                This invitation was sent to {invitation.email}. Please log in with that email
                address.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Currently logged in as: {session.user.email}
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">Log in with Different Account</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Accept the invitation
    const result = await acceptInvitation(token, session.user.id);
    if (result.success) {
      redirect('/dashboard');
    }
  }

  // User not logged in - show invitation details and prompt to sign up/in
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-green-700">You&apos;re Invited!</CardTitle>
          <CardDescription>
            {invitation.inviter?.name} has invited you to join{' '}
            <strong>{invitation.organization?.name}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-stone-100 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              <strong>Role:</strong> {invitation.role === 'admin' ? 'Admin' : 'Team Member'}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Email:</strong> {invitation.email}
            </p>
          </div>
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link
                href={`/sign-up?email=${encodeURIComponent(invitation.email)}&invite=${token}`}
              >
                Create Account
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/login?invite=${token}`}>Already have an account? Log in</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
