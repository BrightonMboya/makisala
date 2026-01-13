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
import { useState } from 'react';
import { updateUserProfile } from '../actions';
import { toast } from '@repo/ui/toast';
import { CloudinaryImagePicker } from '@/components/cloudinary-image-picker';
import { Badge } from '@repo/ui/badge';

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
    role: 'admin' | 'member';
  };
}

export function ProfileSettings({ user }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user.name,
      image: user.image || '',
    },
  });

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    try {
      const result = await updateUserProfile(data);
      if (result.success) {
        toast({ title: 'Profile updated successfully' });
      }
    } catch {
      toast({ title: 'Failed to update profile', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Profile</CardTitle>
        <CardDescription>Manage your personal information</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center text-green-800 text-2xl font-bold">
                {user.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-medium">{user.email}</p>
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                  {user.role === 'admin' ? 'Admin' : 'Team Member'}
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
                      <CloudinaryImagePicker
                        value={field.value}
                        onSelect={(url) => field.onChange(url)}
                        triggerLabel="Change Picture"
                      />
                      {field.value && (
                        <div className="flex items-center gap-4">
                          <img
                            src={field.value}
                            alt="Profile preview"
                            className="h-16 w-16 object-cover rounded-full border"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => field.onChange('')}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
