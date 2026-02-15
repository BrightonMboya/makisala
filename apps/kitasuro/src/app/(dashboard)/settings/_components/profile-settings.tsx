'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import { Input } from '@repo/ui/input';
import { Button } from '@repo/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRef, useState } from 'react';
import { toast } from '@repo/ui/toast';
import { Badge } from '@repo/ui/badge';
import { PasskeySettings } from './passkey-settings';
import { Loader2, Upload } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  image: z.string().url().or(z.literal('')).optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  isAdmin: boolean;
}

export function ProfileSettings({ user, isAdmin }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const updateProfileMutation = trpc.settings.updateProfile.useMutation();
  const uploadAvatarMutation = trpc.settings.uploadAvatar.useMutation();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user.name,
      image: user.image || '',
    },
  });

  const currentImage = form.watch('image');

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Please select an image file', variant: 'destructive' });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Image must be less than 5MB', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const result = await uploadAvatarMutation.mutateAsync({ base64Data: base64 });
      if (result.url) {
        form.setValue('image', result.url);
        queryClient.invalidateQueries({ queryKey: [['settings', 'getCurrentUser']] });
        toast({ title: 'Profile picture uploaded' });
      }
    } catch {
      toast({ title: 'Failed to upload profile picture', variant: 'destructive' });
    } finally {
      setIsUploading(false);
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function onSubmit(data: FormValues) {
    try {
      await updateProfileMutation.mutateAsync(data);
      queryClient.invalidateQueries({ queryKey: [['settings', 'getCurrentUser']] });
      toast({ title: 'Profile updated successfully' });
    } catch {
      toast({ title: 'Failed to update profile', variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
          <CardDescription>Manage your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex items-center gap-4 pb-4 border-b">
                {currentImage ? (
                  <img
                    src={currentImage}
                    alt={user.name}
                    className="h-16 w-16 rounded-full object-cover border"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center text-green-800 text-2xl font-bold">
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium">{user.email}</p>
                  <Badge variant={isAdmin ? 'default' : 'secondary'}>
                    {isAdmin ? 'Admin' : 'Team Member'}
                  </Badge>
                </div>
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile Picture</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileSelect}
                          disabled={isUploading}
                        />
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                {field.value ? 'Change Picture' : 'Upload Picture'}
                              </>
                            )}
                          </Button>
                          {field.value && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => field.onChange('')}
                              disabled={isUploading}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        {field.value && (
                          <img
                            src={field.value}
                            alt="Profile preview"
                            className="h-16 w-16 object-cover rounded-full border"
                          />
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <PasskeySettings />
    </div>
  );
}
