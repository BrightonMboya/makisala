'use client';

import { Input } from '@repo/ui/input';
import { useDebounce } from '@repo/ui/use-debounce';
import { Loader2, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { trpc } from '@/lib/trpc';

export function MealOptionsField({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const utils = trpc.useUtils();
  const createOption = trpc.mealOptions.create.useMutation();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);

  const q = query.trim();
  const debouncedQuery = useDebounce(q, 300);
  const { data: results = [], isFetching } = trpc.mealOptions.search.useQuery(
    { query: debouncedQuery, limit: 8 },
    { enabled: open, placeholderData: (prev) => prev, staleTime: 60 * 1000 },
  );

  const isPending = q !== debouncedQuery || isFetching;
  const suggestions = results.filter(
    (r) => !value.some((v) => v.toLowerCase() === r.name.toLowerCase()),
  );
  const showCreate =
    q.length > 0 &&
    !isPending &&
    !results.some((r) => r.name.toLowerCase() === q.toLowerCase()) &&
    !value.some((v) => v.toLowerCase() === q.toLowerCase());

  const add = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!value.some((v) => v.toLowerCase() === trimmed.toLowerCase())) {
      onChange([...value, trimmed]);
    }
    setQuery('');
  };

  const remove = (name: string) => {
    onChange(value.filter((v) => v !== name));
  };

  const handleCreate = async () => {
    if (!q || creating) return;
    setCreating(true);
    try {
      const created = await createOption.mutateAsync({ name: q });
      utils.mealOptions.search.invalidate();
      add(created.name);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mt-1.5 space-y-1">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1 rounded bg-stone-100 px-1.5 py-0.5 text-xs text-stone-600"
            >
              {name}
              <button
                type="button"
                onClick={() => remove(name)}
                className="text-stone-400 hover:text-stone-600"
                title="Remove"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {open ? (
        <div
          className="relative"
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
              setOpen(false);
              setQuery('');
            }
          }}
        >
          <div className="flex items-center gap-1">
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (showCreate) handleCreate();
                  else if (suggestions[0]) add(suggestions[0].name);
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  setOpen(false);
                  setQuery('');
                }
              }}
              placeholder="e.g. Picnic Lunch, Bonfire Drinks"
              className="h-8 border-stone-200 bg-stone-50 text-xs shadow-none"
            />
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setQuery('');
              }}
              className="shrink-0 rounded-md p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              title="Done"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {(suggestions.length > 0 || showCreate || isPending) && (
            <div className="absolute z-50 mt-1 max-h-64 w-full min-w-48 overflow-y-auto rounded-md border border-stone-200 bg-white py-1 shadow-lg">
              {suggestions.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => add(r.name)}
                  className="flex w-full items-center px-2.5 py-1.5 text-left text-xs text-stone-700 hover:bg-stone-50"
                >
                  {r.name}
                </button>
              ))}
              {showCreate && (
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-left text-xs font-medium text-green-600 hover:bg-green-50 disabled:opacity-60"
                >
                  {creating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Plus className="h-3 w-3" />
                  )}
                  Add &quot;{q}&quot;
                </button>
              )}
              {isPending && suggestions.length === 0 && !showCreate && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-stone-400">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Searching…
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-700"
        >
          <Plus className="h-3 w-3" />
          Add Extras
        </button>
      )}
    </div>
  );
}
