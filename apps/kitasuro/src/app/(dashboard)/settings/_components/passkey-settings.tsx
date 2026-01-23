'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import { useState, useTransition } from 'react';
import { authClient } from '@/lib/auth-client';
import { toast } from '@repo/ui/toast';
import { Key, Trash2, Plus, Smartphone, Laptop } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/ui/alert-dialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';

type Passkey = NonNullable<
  Awaited<ReturnType<typeof authClient.passkey.listUserPasskeys>>['data']
>[number];

export function PasskeySettings() {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: passkeys = [], isLoading } = useQuery({
    queryKey: ['passkeys'],
    queryFn: async () => {
      const { data, error } = await authClient.passkey.listUserPasskeys();
      if (error) throw error;
      return data || [];
    },
  });

  async function handleAddPasskey() {
    startTransition(async () => {
      try {
        const { data, error } = await authClient.passkey.addPasskey({
          name: getDeviceName(),
        });
        if (error) {
          toast({
            title: 'Failed to add passkey',
            description: error.message || 'Please try again.',
            variant: 'destructive',
          });
        } else if (data) {
          toast({ title: 'Passkey added successfully' });
          queryClient.invalidateQueries({ queryKey: ['passkeys'] });
        }
      } catch {
        toast({
          title: 'Failed to add passkey',
          description: 'Your browser may not support passkeys.',
          variant: 'destructive',
        });
      }
    });
  }

  async function handleDeletePasskey(id: string) {
    startTransition(async () => {
      try {
        const { error } = await authClient.passkey.deletePasskey({ id });
        if (error) {
          toast({
            title: 'Failed to delete passkey',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({ title: 'Passkey deleted successfully' });
          queryClient.invalidateQueries({ queryKey: ['passkeys'] });
        }
      } catch {
        toast({ title: 'Failed to delete passkey', variant: 'destructive' });
      } finally {
        setDeleteId(null);
      }
    });
  }

  function getDeviceName(): string {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua)) return 'iPhone/iPad';
    if (/Android/.test(ua)) return 'Android Device';
    if (/Mac/.test(ua)) return 'Mac';
    if (/Windows/.test(ua)) return 'Windows PC';
    if (/Linux/.test(ua)) return 'Linux';
    return 'Unknown Device';
  }

  function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Passkeys
          </CardTitle>
          <CardDescription>
            Passkeys let you sign in securely without a password using your device&apos;s
            biometrics (fingerprint, face) or screen lock.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="py-8 text-center text-gray-500">Loading passkeys...</div>
          ) : passkeys.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <Key className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No passkeys registered yet.</p>
              <p className="text-sm mt-1">Add a passkey for faster, more secure sign-ins.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {passkeys.map((passkey) => (
                <div
                  key={passkey.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {passkey.deviceType === 'singleDevice' ? (
                      <Smartphone className="h-5 w-5 text-gray-500" />
                    ) : (
                      <Laptop className="h-5 w-5 text-gray-500" />
                    )}
                    <div>
                      <p className="font-medium">{passkey.name || 'Unnamed Passkey'}</p>
                      <p className="text-sm text-gray-500">
                        Added {formatDate(passkey.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(passkey.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button onClick={handleAddPasskey} disabled={isPending} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            {isPending ? 'Adding...' : 'Add a Passkey'}
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Passkey?</AlertDialogTitle>
            <AlertDialogDescription>
              This passkey will be removed from your account. You won&apos;t be able to use it
              to sign in anymore. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDeletePasskey(deleteId)}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
