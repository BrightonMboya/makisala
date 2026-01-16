'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui/dialog';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Badge } from '@repo/ui/badge';
import { Search, MapPin, Calendar, Plus, Check, Loader2 } from 'lucide-react';
import { getSharedTemplates, cloneTemplate } from '@/app/itineraries/actions';
import { authClient } from '@/lib/auth-client';
import Image from 'next/image';

interface TemplateBrowserProps {
  trigger: React.ReactNode;
  onTemplateCloned?: () => void;
}

interface Template {
  id: string;
  name: string;
  overview: string;
  days: number;
  country: string;
  imageUrl: string;
  tags: string[];
}

export function TemplateBrowser({ trigger, onTemplateCloned }: TemplateBrowserProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cloningId, setCloningId] = useState<string | null>(null);
  const [clonedIds, setClonedIds] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();

  const { data: templates = [], isLoading } = useQuery<Template[]>({
    queryKey: ['sharedTemplates'],
    queryFn: getSharedTemplates,
    enabled: open,
  });

  const cloneMutation = useMutation({
    mutationFn: cloneTemplate,
    onSuccess: async (result, templateId) => {
      if (result.success) {
        setClonedIds((prev) => new Set([...prev, templateId]));
        // Invalidate and refetch dashboard data to refresh tour count
        await queryClient.invalidateQueries({ queryKey: ['dashboardData', session?.user?.id] });
        await queryClient.refetchQueries({ queryKey: ['dashboardData', session?.user?.id] });
        onTemplateCloned?.();
      }
    },
    onSettled: () => {
      setCloningId(null);
    },
  });

  const handleClone = async (templateId: string) => {
    setCloningId(templateId);
    cloneMutation.mutate(templateId);
  };

  const filteredTemplates = templates.filter((template) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(query) ||
      template.country.toLowerCase().includes(query) ||
      template.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">Browse Tour Templates</DialogTitle>
          <p className="text-sm text-stone-500">
            Select a template to add to your agency. You can customize it after adding.
          </p>
        </DialogHeader>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <Input
            placeholder="Search by name, country, or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-auto mt-4 -mx-6 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-stone-500">
              {searchQuery ? 'No templates match your search.' : 'No templates available.'}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredTemplates.map((template) => {
                const isCloning = cloningId === template.id;
                const isCloned = clonedIds.has(template.id);

                return (
                  <div
                    key={template.id}
                    className={`group relative overflow-hidden rounded-xl border bg-white transition-all hover:shadow-md ${
                      isCloned ? 'border-green-300 bg-green-50/50' : 'border-stone-200'
                    }`}
                  >
                    {/* Image */}
                    <div className="relative h-40 overflow-hidden">
                      <Image
                        src={template.imageUrl}
                        alt={template.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="font-semibold text-white">{template.name}</h3>
                        <div className="flex items-center gap-3 mt-1 text-white/80 text-sm">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {template.country}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {template.days} days
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <p className="text-sm text-stone-600 line-clamp-2">{template.overview}</p>

                      {/* Tags */}
                      {template.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {template.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {template.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{template.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Action */}
                      <div className="mt-4">
                        {isCloned ? (
                          <Button disabled size="sm" className="w-full gap-2 bg-green-700">
                            <Check className="h-4 w-4" />
                            Added to your agency
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="w-full gap-2 bg-green-700 hover:bg-green-800"
                            onClick={() => handleClone(template.id)}
                            disabled={isCloning}
                          >
                            {isCloning ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Adding...
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4" />
                                Add to my agency
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-stone-200 flex justify-between items-center text-sm">
          <span className="text-stone-500">
            {clonedIds.size > 0 && `${clonedIds.size} template${clonedIds.size > 1 ? 's' : ''} added`}
          </span>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {clonedIds.size > 0 ? 'Done' : 'Close'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
