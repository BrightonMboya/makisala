'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import { Input } from '@repo/ui/input';
import { Button } from '@repo/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/table';
import { Badge } from '@repo/ui/badge';
import { useState } from 'react';
import {
  inviteTeamMember,
  removeTeamMember,
  updateMemberRole,
  revokeInvitation,
} from '../actions';
import { toast } from '@repo/ui/toast';
import { Mail, UserMinus, Clock, X, Crown, User } from 'lucide-react';

interface TeamMember {
  id: string;  // Member ID (from member table)
  memberId: string;  // Same as id
  userId: string;  // User ID (from user table)
  name: string;
  email: string;
  role: string;  // 'admin' | 'member'
  image: string | null;
}

interface Invitation {
  id: string;
  email: string;
  role: string;  // 'admin' | 'member'
  expiresAt: Date;
  inviter: { name: string };
}

interface Props {
  members: TeamMember[];
  invitations: Invitation[];
  currentUserId: string;
}

export function TeamManagement({ members, invitations, currentUserId }: Props) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [isInviting, setIsInviting] = useState(false);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail) return;

    setIsInviting(true);
    try {
      const result = await inviteTeamMember({ email: inviteEmail, role: inviteRole });
      if (result.success) {
        toast({ title: 'Invitation sent successfully' });
        setInviteEmail('');
      } else {
        toast({ title: result.error || 'Failed to send invitation', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Failed to send invitation', variant: 'destructive' });
    } finally {
      setIsInviting(false);
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    const result = await removeTeamMember(memberId);
    if (result.success) {
      toast({ title: 'Team member removed' });
    } else {
      toast({ title: result.error || 'Failed to remove member', variant: 'destructive' });
    }
  }

  async function handleRoleChange(memberId: string, newRole: 'admin' | 'member') {
    const result = await updateMemberRole(memberId, newRole);
    if (result.success) {
      toast({ title: 'Role updated' });
    } else {
      toast({ title: result.error || 'Failed to update role', variant: 'destructive' });
    }
  }

  async function handleRevokeInvitation(invitationId: string) {
    const result = await revokeInvitation(invitationId);
    if (result.success) {
      toast({ title: 'Invitation revoked' });
    }
  }

  return (
    <div className="space-y-6">
      {/* Invite Form */}
      <Card>
        <CardHeader>
          <CardTitle>Invite Team Member</CardTitle>
          <CardDescription>Send an email invitation to add someone to your team</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
            </div>
            <Select
              value={inviteRole}
              onValueChange={(v) => setInviteRole(v as 'admin' | 'member')}
            >
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={isInviting}>
              <Mail className="mr-2 h-4 w-4" />
              {isInviting ? 'Sending...' : 'Send Invite'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            {members.length} member{members.length !== 1 ? 's' : ''} in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {member.name}
                      {member.userId === currentUserId && (
                        <Badge variant="outline" className="text-xs">
                          You
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Select
                      value={member.role}
                      onValueChange={(v) => handleRoleChange(member.id, v as 'admin' | 'member')}
                      disabled={member.userId === currentUserId}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">
                          <span className="flex items-center gap-2">
                            <Crown className="h-3 w-3" /> Admin
                          </span>
                        </SelectItem>
                        <SelectItem value="member">
                          <span className="flex items-center gap-2">
                            <User className="h-3 w-3" /> Member
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    {member.id !== currentUserId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Invitations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Invited By</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell>{invitation.email}</TableCell>
                    <TableCell>
                      <Badge variant={invitation.role === 'admin' ? 'default' : 'secondary'}>
                        {invitation.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{invitation.inviter?.name || 'Unknown'}</TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {new Date(invitation.expiresAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeInvitation(invitation.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
