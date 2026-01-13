'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import { Input } from '@repo/ui/input';
import { Button } from '@repo/ui/button';
import { Switch } from '@repo/ui/switch';
import { Label } from '@repo/ui/label';
import { useState } from 'react';
import { updateOrganizationSettings } from '../actions';
import {toast } from '@repo/ui/toast';

interface Props {
  organization: {
    notificationEmail: string | null;
  };
  isAdmin: boolean;
}

export function NotificationSettings({ organization, isAdmin }: Props) {
  const [email, setEmail] = useState(organization.notificationEmail || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSave() {
    setIsSubmitting(true);
    try {
      const result = await updateOrganizationSettings({ notificationEmail: email });
      if (result.success) {
        toast({ title: 'Notification settings updated' });
      }
    } catch {
      toast({ title: 'Failed to update settings', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Configure how you receive notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="notificationEmail">Notification Email</Label>
            <p className="text-sm text-gray-500 mb-2">
              Comments and proposal updates will be sent to this address
            </p>
            <div className="flex gap-3">
              <Input
                id="notificationEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="notifications@youragency.com"
                disabled={!isAdmin}
                className="max-w-md"
              />
              {isAdmin && (
                <Button onClick={handleSave} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
              )}
            </div>
            {!isAdmin && (
              <p className="text-sm text-amber-600 mt-2">
                Only admins can change notification settings
              </p>
            )}
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Email Notifications</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>New Comments</Label>
                  <p className="text-sm text-gray-500">
                    Get notified when clients comment on proposals
                  </p>
                </div>
                <Switch defaultChecked disabled />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Proposal Accepted</Label>
                  <p className="text-sm text-gray-500">
                    Get notified when clients accept proposals
                  </p>
                </div>
                <Switch defaultChecked disabled />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4">More notification options coming soon</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
