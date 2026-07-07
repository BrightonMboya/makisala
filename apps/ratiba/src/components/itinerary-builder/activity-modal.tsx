import { Button } from '@repo/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/dialog';
import { Switch } from '@repo/ui/switch';
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Image as ImageIcon,
  Plus,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BuilderActivity as Activity } from '@/types/itinerary-types';
import { MultiSelect } from '@repo/ui/multi-select';
import { Input } from '@repo/ui/input';
import { Textarea } from '@repo/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover';
import { ImagePicker } from './image-picker';
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CreatableAsyncCombobox } from './creatable-async-combobox';
import { trpc } from '@/lib/trpc';
import { searchPlaces } from '@/lib/geocoding';
import { isTransferActivity } from '@/lib/transform-utils';

const moments = ['Morning', 'Afternoon', 'Evening', 'Half Day', 'Full Day', 'Night'] as const;

// `moment` is a single string field on BuilderActivity storing one or more
// moments comma-separated (e.g. "Morning, Afternoon"). The multi-select UI
// splits it for display and joins with ", " on change.
export const momentToArray = (moment: string): string[] =>
  moment
    ? moment
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean)
    : [];

export function ActivityModal({
  isOpen,
  onClose,
  dayId,
  initialActivities,
  onSave,
  countries,
  knownMoments,
}: {
  isOpen: boolean;
  onClose: () => void;
  dayId: string | null;
  initialActivities: Activity[];
  onSave: (activities: Activity[]) => void;
  countries?: string[];
  // Custom moments used anywhere in the itinerary, so a moment created on one
  // day (e.g. "Before Lunch") stays available in the dropdown on every day.
  knownMoments?: string[];
}) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const utils = trpc.useUtils();

  // Org-wide custom moments, persisted so a moment created on any itinerary
  // (e.g. "Before Lunch", "Sundowner") is available on every itinerary.
  const { data: orgMoments } = trpc.moments.list.useQuery();
  const createMomentMutation = trpc.moments.create.useMutation();

  // Moment options = the canonical set, plus the org's saved custom moments,
  // plus any moment already used on this itinerary's days (knownMoments) or on
  // this day's activities. Union keeps created moments searchable everywhere.
  const momentOptions = useMemo(() => {
    const set = new Set<string>(moments);
    orgMoments?.forEach((m) => set.add(m.name));
    knownMoments?.forEach((m) => set.add(m));
    activities.forEach((a) => momentToArray(a.moment).forEach((m) => set.add(m)));
    return Array.from(set).map((m) => ({ value: m, label: m }));
  }, [activities, knownMoments, orgMoments]);

  // Persist a moment org-wide the first time it's used. Canonical moments are
  // built in and never stored; anything else is upserted (unique on org+name),
  // then the list is refreshed so it shows up on other days/itineraries.
  const canonicalMoments = useMemo(() => new Set<string>(moments), []);
  const persistNewMoments = useCallback(
    (vals: string[]) => {
      const existing = new Set(orgMoments?.map((m) => m.name) ?? []);
      vals
        .map((v) => v.trim())
        .filter((v) => v && !canonicalMoments.has(v) && !existing.has(v))
        .forEach((name) => {
          createMomentMutation.mutate(
            { name },
            { onSuccess: () => utils.moments.list.invalidate() },
          );
        });
    },
    [orgMoments, canonicalMoments, createMomentMutation, utils],
  );
  const createActivityMutation = trpc.activities.create.useMutation();

  const libraryCacheRef = useRef<
    Map<
      string,
      {
        name: string;
        locationName: string | null;
        latitude: number | null;
        longitude: number | null;
      }
    >
  >(new Map());

  const resolveActivityById = useCallback(
    async (id: string) => {
      const cached = libraryCacheRef.current.get(id);
      if (cached) return cached;
      const a = await utils.activities.getById.fetch({ id });
      if (!a) return null;
      const next = {
        name: a.name,
        locationName: a.locationName,
        latitude: a.latitude != null ? Number(a.latitude) : null,
        longitude: a.longitude != null ? Number(a.longitude) : null,
      };
      libraryCacheRef.current.set(id, next);
      return next;
    },
    [utils],
  );

  const handleActivitySearch = useCallback(
    async (query: string) => {
      const results = await utils.activities.search.fetch({ query, limit: 10 });
      results.forEach((a) =>
        libraryCacheRef.current.set(a.id, {
          name: a.name,
          locationName: null,
          latitude: null,
          longitude: null,
        }),
      );
      return results.map((a) => ({ value: a.id, label: a.name }));
    },
    [utils],
  );

  const handleActivityGetLabel = useCallback(
    async (id: string) => {
      const a = await resolveActivityById(id);
      return a?.name ?? null;
    },
    [resolveActivityById],
  );

  const handleActivityCreate = useCallback(
    async (name: string) => {
      const activity = await createActivityMutation.mutateAsync({ name });
      libraryCacheRef.current.set(activity.id, {
        name: activity.name,
        locationName: null,
        latitude: null,
        longitude: null,
      });
      return { value: activity.id, label: activity.name };
    },
    [createActivityMutation],
  );

  // Location search handler — Photon autocomplete
  const handleLocationSearch = useCallback(
    async (query: string) => {
      if (query.length < 2) return [];
      const results = await searchPlaces(query, countries);
      return results.map((r) => ({ value: r.name, label: r.displayName }));
    },
    [countries],
  );

  const initialActivitiesRef = useRef(initialActivities);
  initialActivitiesRef.current = initialActivities;
  const loadedDayRef = useRef<string | null>(null);
  useEffect(() => {
    if (isOpen && loadedDayRef.current !== dayId) {
      setActivities(initialActivitiesRef.current);
      loadedDayRef.current = dayId;
    }
  }, [isOpen, dayId]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setActivities((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAddActivity = () => {
    const newActivity: Activity = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      location: '',
      moment: 'Morning',
      isOptional: false,
      description: '',
      imageUrl: '',
    };
    setActivities((prev) => [...prev, newActivity]);
  };

  const handleUpdateActivity = (id: string, field: keyof Activity, value: any) => {
    // Save any brand-new moment org-wide as soon as it's picked.
    if (field === 'moment' && typeof value === 'string') {
      persistNewMoments(momentToArray(value));
    }
    setActivities((prev) =>
      prev.map((activity) => (activity.id === id ? { ...activity, [field]: value } : activity)),
    );
  };

  const handleDeleteActivity = (id: string) => {
    setActivities((prev) => prev.filter((activity) => activity.id !== id));
  };

  const handleSave = () => {
    onSave(activities);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1 text-xl font-bold">
            Activities Day {dayId}
            <span className="text-green-500">.</span>
          </DialogTitle>
        </DialogHeader>
        <div className="-mx-6 flex-1 overflow-y-auto px-6 py-4">
          <div className="mb-4 grid grid-cols-12 gap-4 border-b pb-2 text-xs font-bold text-gray-500">
            <div className="col-span-1 text-center">Order</div>
            <div className="col-span-3">Activity Type</div>
            <div className="col-span-3">Location</div>
            <div className="col-span-2">Moment</div>
            <div className="col-span-1">Time</div>
            <div className="col-span-2 text-center">Actions</div>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={activities.map((a) => a.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {activities.map((activity) => (
                  <SortableActivityRow
                    key={activity.id}
                    activity={activity}
                    momentOptions={momentOptions}
                    onUpdate={handleUpdateActivity}
                    onDelete={handleDeleteActivity}
                    onActivitySearch={handleActivitySearch}
                    onActivityCreate={handleActivityCreate}
                    onActivityGetLabel={handleActivityGetLabel}
                    onActivityResolve={resolveActivityById}
                    onLocationSearch={handleLocationSearch}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div className="mt-6">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 border-dashed text-green-600 hover:bg-green-50 hover:text-green-700"
              onClick={handleAddActivity}
            >
              <Plus className="h-4 w-4" />
              Add new activity
            </Button>
          </div>
        </div>
        <div className="flex justify-start gap-2 border-t pt-4">
          <Button className="bg-green-600 hover:bg-green-700" onClick={handleSave}>
            Save Activities
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SortableActivityRow({
  activity,
  momentOptions,
  onUpdate,
  onDelete,
  onActivitySearch,
  onActivityCreate,
  onActivityGetLabel,
  onActivityResolve,
  onLocationSearch,
}: {
  activity: Activity;
  momentOptions: { value: string; label: string }[];
  onUpdate: (id: string, field: keyof Activity, value: any) => void;
  onDelete: (id: string) => void;
  onActivitySearch: (query: string) => Promise<{ value: string; label: string }[]>;
  onActivityCreate: (name: string) => Promise<{ value: string; label: string } | null>;
  onActivityGetLabel: (id: string) => Promise<string | null>;
  onActivityResolve: (id: string) => Promise<{
    name: string;
    locationName: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null>;
  onLocationSearch: (query: string) => Promise<{ value: string; label: string }[]>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: activity.id,
  });

  const [isExpanded, setIsExpanded] = useState(!!activity.description || !!activity.imageUrl);

  // When the activity name mentions "transfer", swap the single location field
  // for a From/To pair (e.g. "Transfer by road from Arusha Airport to Gombe Hotel").
  const isTransfer = isTransferActivity(activity.name);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg border bg-white p-2 shadow-sm transition-all hover:border-stone-300"
    >
      <div className="grid grid-cols-12 items-center gap-4">
        <div className="col-span-1 flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 cursor-grab text-stone-400 active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </Button>
        </div>
        <div className="col-span-3">
          <CreatableAsyncCombobox
            value={activity.libraryId ?? activity.name}
            onChange={async (val) => {
              if (!val) {
                onUpdate(activity.id, 'libraryId', null);
                onUpdate(activity.id, 'name', '');
                return;
              }
              const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                val,
              );
              if (!isUuid) {
                onUpdate(activity.id, 'libraryId', null);
                onUpdate(activity.id, 'name', val);
                return;
              }
              onUpdate(activity.id, 'libraryId', val);
              const resolved = await onActivityResolve(val);
              if (resolved) {
                onUpdate(activity.id, 'name', resolved.name);
                if (!activity.location && resolved.locationName) {
                  onUpdate(activity.id, 'location', resolved.locationName);
                }
              }
            }}
            onSearch={onActivitySearch}
            onCreate={onActivityCreate}
            onGetLabel={onActivityGetLabel}
            initialLabel={activity.name || null}
            placeholder="Select activity"
            createLabel="Create"
            className="h-9 border-stone-200"
          />
        </div>
        <div className="col-span-3">
          {isTransfer ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-9 shrink-0 text-[10px] font-bold tracking-wide text-stone-400 uppercase">
                  From
                </span>
                <CreatableAsyncCombobox
                  value={activity.fromLocation ?? ''}
                  onChange={(val) => onUpdate(activity.id, 'fromLocation', val)}
                  onSearch={onLocationSearch}
                  initialLabel={activity.fromLocation || null}
                  placeholder="Origin"
                  createLabel="Use"
                  className="h-9 min-w-0 flex-1 border-stone-200"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-9 shrink-0 text-[10px] font-bold tracking-wide text-stone-400 uppercase">
                  To
                </span>
                <CreatableAsyncCombobox
                  value={activity.toLocation ?? ''}
                  onChange={(val) => onUpdate(activity.id, 'toLocation', val)}
                  onSearch={onLocationSearch}
                  initialLabel={activity.toLocation || null}
                  placeholder="Destination"
                  createLabel="Use"
                  className="h-9 min-w-0 flex-1 border-stone-200"
                />
              </div>
            </div>
          ) : (
            <CreatableAsyncCombobox
              value={activity.location}
              onChange={(val) => onUpdate(activity.id, 'location', val)}
              onSearch={onLocationSearch}
              initialLabel={activity.location || null}
              placeholder="Select location"
              createLabel="Use"
              className="h-9 border-stone-200"
            />
          )}
        </div>
        <div className="col-span-2">
          <MultiSelect
            options={momentOptions}
            selected={momentToArray(activity.moment)}
            onChange={(vals) => onUpdate(activity.id, 'moment', vals.join(', '))}
            placeholder="Moment"
            className="border-stone-200"
            creatable
            createLabel="Add moment"
          />
        </div>
        <div className="col-span-1">
          <Input
            type="time"
            value={activity.startTime || ''}
            onChange={(e) => onUpdate(activity.id, 'startTime', e.target.value || null)}
            className="h-9 border-stone-200 text-xs"
            placeholder="--:--"
          />
        </div>
        <div className="col-span-2 flex items-center justify-end gap-2">
          <div className="mr-2 flex items-center gap-1.5" title="Is Optional?">
            <Switch
              checked={activity.isOptional}
              onCheckedChange={(checked) => onUpdate(activity.id, 'isOptional', checked)}
              className="scale-75"
            />
            <span className="text-[10px] font-bold text-stone-400 uppercase">Opt</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-stone-400 hover:text-stone-700"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-400 hover:bg-red-50 hover:text-red-600"
            onClick={() => onDelete(activity.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 grid grid-cols-2 gap-4 border-t border-stone-100 px-10 pt-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-500 uppercase">Description</label>
            <Textarea
              value={activity.description || ''}
              onChange={(e) => onUpdate(activity.id, 'description', e.target.value)}
              placeholder="Describe what guests will do..."
              className="min-h-[80px] border-stone-200 bg-stone-50 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-500 uppercase">Image URL</label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="relative h-[80px] w-[120px] overflow-hidden border-dashed border-stone-300 p-0 hover:border-stone-400"
                  >
                    {activity.imageUrl ? (
                      <img
                        src={activity.imageUrl}
                        alt="Selected"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-stone-400">
                        <ImageIcon className="h-5 w-5" />
                        <span className="text-[10px]">Select Image</span>
                      </div>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <ImagePicker
                    value={activity.imageUrl}
                    onChange={(url) => onUpdate(activity.id, 'imageUrl', url)}
                  />
                </PopoverContent>
              </Popover>
              <div className="flex-1">
                <Input
                  value={activity.imageUrl || ''}
                  onChange={(e) => onUpdate(activity.id, 'imageUrl', e.target.value)}
                  placeholder="Or paste URL here..."
                  className="mb-2 border-stone-200 bg-stone-50 text-sm"
                />
                <p className="text-[10px] text-stone-500">
                  Select from library or paste any image URL.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
