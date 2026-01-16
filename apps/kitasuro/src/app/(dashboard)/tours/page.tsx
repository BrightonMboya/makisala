'use client';

import { Input } from '@repo/ui/input';
import { Button } from '@repo/ui/button';
import {
  Clock,
  Map,
  Search,
  Plus,
  Copy,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getDashboardData, getSharedTemplates, cloneTemplate } from '@/app/itineraries/actions';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';
import { useToast } from '@/lib/hooks/use-toast';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui/dialog';

export default function ToursPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [cloningId, setCloningId] = useState<string | null>(null);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboardData', session?.user?.id],
    queryFn: getDashboardData,
    staleTime: 30 * 1000,
    enabled: !!session?.user?.id,
  });

  const { data: sharedTemplates } = useQuery({
    queryKey: ['sharedTemplates'],
    queryFn: getSharedTemplates,
    staleTime: 60 * 1000,
    enabled: isTemplateDialogOpen,
  });

  const tours = dashboardData?.tours || [];

  const handleCloneTemplate = async (templateId: string) => {
    setCloningId(templateId);
    try {
      const result = await cloneTemplate(templateId);
      if (result.success) {
        toast({ title: 'Template added to your tours!' });
        queryClient.invalidateQueries({ queryKey: ['dashboardData', session?.user?.id] });
        setIsTemplateDialogOpen(false);
      } else {
        toast({ title: result.error || 'Failed to add template', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Failed to add template', variant: 'destructive' });
    } finally {
      setCloningId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-50">
      <header className="flex items-center justify-between border-b border-stone-200 bg-white px-8 py-4">
        <h2 className="font-serif text-2xl font-bold text-stone-900">Tours</h2>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-stone-400" />
            <Input placeholder="Search tours..." className="pl-9" />
          </div>
          <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-700 hover:bg-green-800 gap-2">
                <Plus className="h-4 w-4" />
                Add Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">Add Tour Template</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-stone-600 mb-4">
                Browse shared templates and add them to your organization's tours.
              </p>
              <div className="grid gap-4">
                {sharedTemplates?.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-start gap-4 rounded-xl border border-stone-200 bg-white p-4 hover:border-green-600/30"
                  >
                    {template.imageUrl && (
                      <img
                        src={template.imageUrl}
                        alt={template.name}
                        className="h-20 w-28 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-serif text-lg font-bold text-stone-900">{template.name}</h4>
                      <div className="flex items-center gap-3 mt-1 text-sm text-stone-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {template.days} days
                        </span>
                        {template.country && (
                          <span>{template.country}</span>
                        )}
                      </div>
                      {template.overview && (
                        <p className="text-sm text-stone-600 mt-2 line-clamp-2">{template.overview}</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-2"
                      onClick={() => handleCloneTemplate(template.id)}
                      disabled={cloningId === template.id}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {cloningId === template.id ? 'Adding...' : 'Add'}
                    </Button>
                  </div>
                ))}
                {sharedTemplates?.length === 0 && (
                  <div className="py-12 text-center text-stone-500">
                    No shared templates available
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="p-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
          </div>
        ) : tours.length === 0 ? (
          <div className="py-24 text-center">
            <div className="mx-auto h-12 w-12 text-stone-300 mb-4">
              <Map className="h-full w-full" />
            </div>
            <h3 className="text-lg font-medium text-stone-900">No tours yet</h3>
            <p className="text-stone-500 mt-1 mb-6">
              Add tour templates to get started with creating proposals.
            </p>
            <Button
              className="bg-green-700 hover:bg-green-800 gap-2"
              onClick={() => setIsTemplateDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Browse Templates
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tours.map((tour) => (
              <div
                key={tour.id}
                className="group rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition-all hover:border-green-600/30 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-green-800">
                      {tour.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-2 text-sm text-stone-500">
                      <Clock className="h-3.5 w-3.5" />
                      {tour.days} days
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
