'use client';

import { Input } from '@repo/ui/input';
import {
  Map,
  Search,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { staleTimes } from '@/lib/query-keys';
import { useSession } from '@/components/session-context';
import { useState, useMemo, useDeferredValue } from 'react';
import ProposalTemplateCard from '../_components/proposal-template-card';

export default function ToursPage() {
  const { session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const { data: templates = [], isLoading } = trpc.proposals.listTemplates.useQuery(undefined, {
    staleTime: staleTimes.tours,
    enabled: !!session?.user?.id,
  });

  // Filter templates based on search query (deferred for performance)
  const filteredTemplates = useMemo(() => {
    if (!deferredSearchQuery.trim()) return templates;
    const query = deferredSearchQuery.toLowerCase();
    return templates.filter(
      (template) =>
        template.name.toLowerCase().includes(query) ||
        (template.tourTitle || '').toLowerCase().includes(query) ||
        template.countries.some((c) => c.toLowerCase().includes(query))
    );
  }, [templates, deferredSearchQuery]);

  return (
    <div className="flex flex-col h-full bg-stone-50">
      <header className="flex items-center justify-between border-b border-stone-200 bg-white px-8 py-4">
        <h2 className="font-serif text-2xl font-bold text-stone-900">Tours</h2>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-stone-400" />
            <Input
              placeholder="Search by name, country..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="p-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
          </div>
        ) : templates.length === 0 ? (
          <div className="py-24 text-center">
            <div className="mx-auto h-12 w-12 text-stone-300 mb-4">
              <Map className="h-full w-full" />
            </div>
            <h3 className="text-lg font-medium text-stone-900">No templates yet</h3>
            <p className="text-stone-500 mt-1 mb-6">
              Save a finished proposal as a template from its menu to see it here.
            </p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="py-24 text-center">
            <div className="mx-auto h-12 w-12 text-stone-300 mb-4">
              <Search className="h-full w-full" />
            </div>
            <h3 className="text-lg font-medium text-stone-900">No templates found</h3>
            <p className="text-stone-500 mt-1">
              Try adjusting your search query.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => (
              <ProposalTemplateCard key={template.id} template={template} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
