'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select';

type SortBy = 'updatedAt' | 'startDate' | 'createdAt' | 'status';
type SortOrder = 'asc' | 'desc';

interface SortControlsProps {
  sortBy: SortBy;
  sortOrder: SortOrder;
  onSortByChange: (value: SortBy) => void;
  onSortOrderChange: (value: SortOrder) => void;
}

export function SortControls({ sortBy, sortOrder, onSortByChange, onSortOrderChange }: SortControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <Select value={sortBy} onValueChange={(v) => onSortByChange(v as SortBy)}>
        <SelectTrigger className="h-9 w-[160px] text-sm">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="updatedAt">Last Updated</SelectItem>
          <SelectItem value="startDate">Start Date</SelectItem>
          <SelectItem value="createdAt">Created</SelectItem>
          <SelectItem value="status">Status</SelectItem>
        </SelectContent>
      </Select>
      <button
        onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
        className="flex h-9 items-center rounded-md border border-stone-200 px-2.5 text-sm text-stone-600 transition-colors hover:bg-stone-50"
        title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
      >
        {sortOrder === 'asc' ? '↑' : '↓'}
      </button>
    </div>
  );
}
