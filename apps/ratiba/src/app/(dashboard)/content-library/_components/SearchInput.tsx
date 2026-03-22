'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebounce } from '@repo/ui/use-debounce';
import { Input } from '@repo/ui/input';
import { Search } from 'lucide-react';

export function SearchInput() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('query') || '');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    const currentQuery = searchParams.get('query') || '';
    if (debouncedSearchTerm === currentQuery) return;

    const params = new URLSearchParams(searchParams);
    if (debouncedSearchTerm) {
      params.set('query', debouncedSearchTerm);
    } else {
      params.delete('query');
    }
    params.set('page', '1');
    router.replace(`?${params.toString()}`);
  }, [debouncedSearchTerm, router, searchParams]);

  return (
    <div className="relative flex-1 max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <Input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search by name..."
        className="pl-10"
      />
    </div>
  );
}
