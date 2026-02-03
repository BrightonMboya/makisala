'use client';

import { Button } from '@repo/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/dropdown-menu';
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
import {
  Car,
  Copy,
  FileText,
  GripVertical,
  Loader2,
  MoreVertical,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { ActivityModal } from './activity-modal';
import { AsyncCombobox } from './async-combobox';
import { CreatableAsyncCombobox } from './creatable-async-combobox';
import { Textarea } from '@repo/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select';
import { Input } from '@repo/ui/input';
import type { TransportModeType } from '@/types/itinerary-types';
import { addDays, format } from 'date-fns';
import {
  getAccommodationById,
  getNationalParkById,
  getRandomDayTemplate,
  searchAccommodations,
  searchNationalParks,
} from '@/app/itineraries/actions';

import type { BuilderActivity, BuilderDay } from '@/types/itinerary-types';

type Day = BuilderDay;
type Activity = BuilderActivity;

export function DayTable({
  days,
  setDays,
  startDate,
}: {
  days: Day[];
  setDays: React.Dispatch<React.SetStateAction<Day[]>>;
  startDate?: Date;
}) {
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Helper to recalculate day numbers and dates
  const recalculateDays = (items: Day[]) => {
    return items.map((item, index) => ({
      ...item,
      dayNumber: index + 1,
      date: startDate ? format(addDays(startDate, index), 'MMM d') : '',
    }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setDays((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        return recalculateDays(newItems);
      });
    }
  };

  const handleAddActivity = (dayId: string) => {
    setSelectedDayId(dayId);
    setIsActivityModalOpen(true);
  };

  const handleSaveActivities = (dayId: string, newActivities: Activity[]) => {
    setDays(
      days.map((day) => {
        if (day.id === dayId) {
          return { ...day, activities: newActivities };
        }
        return day;
      }),
    );
    setIsActivityModalOpen(false);
  };

  const handleToggleMeal = (dayId: string, meal: 'breakfast' | 'lunch' | 'dinner') => {
    setDays(
      days.map((day) => {
        if (day.id === dayId) {
          return {
            ...day,
            meals: {
              ...day.meals,
              [meal]: !day.meals[meal],
            },
          };
        }
        return day;
      }),
    );
  };

  const handleDeleteDay = (dayId: string) => {
    const newDays = days.filter((day) => day.id !== dayId);
    setDays(recalculateDays(newDays));
  };

  const handleDuplicateDay = (dayId: string) => {
    const dayToDuplicate = days.find((day) => day.id === dayId);
    if (!dayToDuplicate) return;

    const newDay = {
      ...dayToDuplicate,
      id: Math.random().toString(36).substr(2, 9),
      dayNumber: days.length + 1,
      activities: dayToDuplicate.activities.map((a) => ({
        ...a,
        id: Math.random().toString(36).substr(2, 9),
      })),
    };

    const index = days.findIndex((day) => day.id === dayId);
    const newDays = [...days];
    newDays.splice(index + 1, 0, newDay);

    setDays(recalculateDays(newDays));
  };

  const handleUpdateDay = (dayId: string, field: keyof Day, value: any) => {
    setDays(
      days.map((day) => {
        if (day.id === dayId) {
          return { ...day, [field]: value };
        }
        return day;
      }),
    );
  };

  const selectedDay = days.find((d) => d.id === selectedDayId);

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 border-b bg-stone-50 px-4 py-3 text-xs font-bold text-stone-500 uppercase">
        <div className="col-span-1">Days</div>
        <div className="col-span-3">Accommodation</div>
        <div className="col-span-3">Main Destination</div>
        <div className="col-span-3">Activities</div>
        <div className="col-span-2">Meal Plan</div>
      </div>

      {/* Table Body */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={days.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          <div className="divide-y divide-stone-100">
            {days.map((day) => (
              <SortableDayRow
                key={day.id}
                day={day}
                onAddActivity={handleAddActivity}
                onToggleMeal={handleToggleMeal}
                onDelete={handleDeleteDay}
                onDuplicate={handleDuplicateDay}
                onUpdate={handleUpdateDay}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Footer */}
      <div className="border-t border-stone-100 bg-stone-50 p-4">
        <Button
          variant="outline"
          className="w-full justify-center gap-2 border-dashed bg-white text-green-600 hover:bg-green-50 hover:text-green-700"
          onClick={() => {
            const newDay: Day = {
              id: Math.random().toString(36).substr(2, 9),
              dayNumber: days.length + 1,
              date: '',
              accommodation: null,
              destination: null,
              activities: [],
              meals: {
                breakfast: true,
                lunch: true,
                dinner: true,
              },
            };
            setDays(recalculateDays([...days, newDay]));
          }}
        >
          <Plus className="h-4 w-4" />
          Add day
        </Button>
      </div>

      {selectedDay && (
        <ActivityModal
          isOpen={isActivityModalOpen}
          onClose={() => setIsActivityModalOpen(false)}
          dayId={selectedDay.dayNumber.toString()}
          initialActivities={selectedDay.activities}
          onSave={(activities) => handleSaveActivities(selectedDay.id, activities)}
        />
      )}
    </div>
  );
}

function SortableDayRow({
  day,
  onAddActivity,
  onToggleMeal,
  onDelete,
  onDuplicate,
  onUpdate,
}: {
  day: Day;
  onAddActivity: (id: string) => void;
  onToggleMeal: (id: string, meal: 'breakfast' | 'lunch' | 'dinner') => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onUpdate: (id: string, field: keyof Day, value: any) => void;
}) {
  // Callbacks for async accommodation search
  const handleAccommodationSearch = useCallback(async (query: string) => {
    const results = await searchAccommodations(query, 10);
    return results.map((acc) => ({ value: acc.id, label: acc.name }));
  }, []);

  // Only fetch label if we don't already have the accommodation name
  // This prevents N+1 queries when proposal data already includes names
  const handleGetAccommodationLabel = useCallback(
    async (id: string) => {
      // Check if we already have the name from the day data
      if (day.accommodationName) {
        return day.accommodationName;
      }
      const acc = await getAccommodationById(id);
      return acc?.name || null;
    },
    [day.accommodationName],
  );

  // Destination search handler
  const handleDestinationSearch = useCallback(async (query: string) => {
    const results = await searchNationalParks(query, 10);
    return results.map((p) => ({ value: p.id, label: p.name }));
  }, []);

  // Get destination label by ID
  const handleGetDestinationLabel = useCallback(async (id: string) => {
    // Check if it's a UUID (national park ID) vs custom text
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUUID) {
      // Custom text, return as-is
      return id;
    }
    const park = await getNationalParkById(id);
    return park?.name || null;
  }, []);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: day.id,
  });

  const [isExpanded, setIsExpanded] = useState(!!day.description);
  const [isTransferExpanded, setIsTransferExpanded] = useState(!!day.transfer);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const handleSuggestContent = useCallback(async () => {
    if (!day.destination) return;

    setIsSuggesting(true);
    try {
      const template = await getRandomDayTemplate(
        day.destination,
        undefined,
        day.description ? [day.description] : undefined,
      );
      if (template?.description) {
        onUpdate(day.id, 'description', template.description);
        setIsExpanded(true);
      }
    } finally {
      setIsSuggesting(false);
    }
  }, [day.destination, day.description, day.id, onUpdate]);

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
      className="border-b border-stone-100 bg-white hover:bg-stone-50"
    >
      <div className="grid grid-cols-12 gap-4 px-4 py-4">
        {/* Day Column */}
        <div className="col-span-1 flex gap-2">
          <button
            {...attributes}
            {...listeners}
            className="mt-1 cursor-grab text-stone-400 hover:text-stone-600 active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div>
            <div className="font-bold text-stone-900">Day {day.dayNumber}</div>
            <div className="text-xs whitespace-nowrap text-stone-500">{day.date}</div>
          </div>
        </div>

        {/* Accommodation Column */}
        <div className="col-span-3 min-w-0">
          <div className="space-y-2">
            <AsyncCombobox
              value={day.accommodation}
              onChange={(val) => onUpdate(day.id, 'accommodation', val)}
              onSearch={handleAccommodationSearch}
              onGetLabel={handleGetAccommodationLabel}
              initialLabel={day.accommodationName}
              placeholder="Search accommodation..."
              className="w-full"
            />
          </div>
        </div>

        {/* Destination Column */}
        <div className="col-span-3 min-w-0">
          <CreatableAsyncCombobox
            value={day.destination}
            onChange={(val) => onUpdate(day.id, 'destination', val)}
            onSearch={handleDestinationSearch}
            onGetLabel={handleGetDestinationLabel}
            placeholder="Select Destination"
            createLabel="Use"
          />
        </div>

        {/* Activities Column */}
        <div className="col-span-3 space-y-2">
          {day.activities.length === 0 ? (
            <Button
              variant="outline"
              className="w-full justify-center gap-2 border-dashed text-green-600 hover:bg-green-50 hover:text-green-700"
              onClick={() => onAddActivity(day.id)}
            >
              <Plus className="h-3 w-3" />
              Add Activities
            </Button>
          ) : (
            <div className="space-y-2">
              {day.activities.map((activity, idx) => (
                <div key={activity.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-stone-700 underline decoration-stone-300 underline-offset-2">
                    {activity.name}
                  </span>
                  <button
                    className="text-xs font-medium text-green-600 hover:underline"
                    onClick={() => onAddActivity(day.id)}
                  >
                    Edit
                  </button>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-full justify-start gap-2 px-0 text-xs text-green-600 hover:text-green-700"
                onClick={() => onAddActivity(day.id)}
              >
                <Plus className="h-3 w-3" />
                Add more
              </Button>
            </div>
          )}
        </div>

        {/* Meal Plan Column */}
        <div className="col-span-2 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1">
              <div className="flex gap-1">
                <MealBadge
                  label="B"
                  active={day.meals.breakfast}
                  onClick={() => onToggleMeal(day.id, 'breakfast')}
                />
                <MealBadge
                  label="L"
                  active={day.meals.lunch}
                  onClick={() => onToggleMeal(day.id, 'lunch')}
                />
                <MealBadge
                  label="D"
                  active={day.meals.dinner}
                  onClick={() => onToggleMeal(day.id, 'dinner')}
                />
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-stone-400 hover:text-stone-600">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDuplicate(day.id)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate Day
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => onDelete(day.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Day
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Expandable Day Overview Section */}
      <div className="px-4 pb-3">
        {isExpanded ? (
          <div className="space-y-2 border-t border-stone-100 pt-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-stone-600 uppercase">
                <FileText className="h-3.5 w-3.5" />
                Day Overview
              </label>
              <div className="flex items-center gap-3">
                {day.destination && (
                  <button
                    onClick={handleSuggestContent}
                    disabled={isSuggesting}
                    className="flex items-center gap-1 text-xs font-medium text-green-600 hover:underline disabled:opacity-50"
                    title="Suggest content based on destination"
                  >
                    {isSuggesting ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    Suggest
                  </button>
                )}
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-xs font-medium text-stone-400 hover:text-stone-600"
                >
                  Hide
                </button>
              </div>
            </div>
            <Textarea
              value={day.description || ''}
              onChange={(e) => onUpdate(day.id, 'description', e.target.value)}
              placeholder="Tell the story of this day... What will guests experience? What makes it special?"
              className="min-h-[80px] border-stone-200 bg-stone-50 text-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>
        ) : (
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(true)}
              className="group flex-1 rounded-md border border-dashed border-stone-200 px-3 py-2 text-left transition-colors hover:border-stone-300 hover:bg-stone-50"
            >
              <span className="flex items-center gap-1.5 text-xs text-stone-500 group-hover:text-stone-700">
                <FileText className="h-3.5 w-3.5" />
                {day.description ? 'Edit day overview' : 'Add day overview (optional)'}
              </span>
            </button>
            {day.destination && !day.description && (
              <button
                onClick={handleSuggestContent}
                disabled={isSuggesting}
                className="flex items-center gap-1.5 rounded-md border border-dashed border-green-300 bg-green-50 px-3 py-2 text-xs font-medium text-green-600 transition-colors hover:bg-green-100 disabled:opacity-50"
                title="Auto-fill with suggested content"
              >
                {isSuggesting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                Suggest
              </button>
            )}
          </div>
        )}
      </div>

      {/* Transfer Section */}
      <div className="px-4 pb-3">
        {isTransferExpanded ? (
          <TransferFields
            transfer={day.transfer || null}
            dayDestination={day.destination}
            onUpdate={(transfer) => onUpdate(day.id, 'transfer', transfer)}
            onRemove={() => {
              onUpdate(day.id, 'transfer', null);
              setIsTransferExpanded(false);
            }}
          />
        ) : (
          <button
            onClick={async () => {
              if (!day.transfer) {
                const emptyTransfer = {
                  originId: null,
                  originName: '',
                  destinationId: null,
                  destinationName: '',
                  mode: 'road_4x4' as TransportModeType,
                  durationMinutes: null,
                  distanceKm: null,
                  notes: '',
                };
                // Pre-populate origin from the day's destination
                if (day.destination && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(day.destination)) {
                  onUpdate(day.id, 'transfer', emptyTransfer);
                  const park = await getNationalParkById(day.destination);
                  if (park) {
                    onUpdate(day.id, 'transfer', { ...emptyTransfer, originName: park.name });
                  }
                } else {
                  onUpdate(day.id, 'transfer', { ...emptyTransfer, originName: day.destination || '' });
                }
              }
              setIsTransferExpanded(true);
            }}
            className="group w-full cursor-pointer rounded-md border border-dashed border-stone-200 px-3 py-2 text-left transition-colors hover:border-stone-300 hover:bg-stone-50"
          >
            <span className="flex items-center gap-1.5 text-xs text-stone-500 group-hover:text-stone-700">
              <Car className="h-3.5 w-3.5" />
              {day.transfer ? 'Edit transfer' : 'Add transfer (optional)'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

function TransferFields({
  transfer,
  dayDestination,
  onUpdate,
  onRemove,
}: {
  transfer: NonNullable<Day['transfer']> | null;
  dayDestination: string | null;
  onUpdate: (transfer: NonNullable<Day['transfer']>) => void;
  onRemove: () => void;
}) {
  const current = transfer || {
    originId: null,
    originName: '',
    destinationId: null,
    destinationName: '',
    mode: 'road_4x4' as TransportModeType,
    durationMinutes: null,
    distanceKm: null,
    notes: '',
  };

  const update = (field: string, value: any) => {
    onUpdate({ ...current, [field]: value });
  };

  // Parse duration into hours for display
  const durationHours = current.durationMinutes ? Math.round(current.durationMinutes / 60) : '';

  return (
    <div className="space-y-3 border-t border-stone-100 pt-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-stone-600 uppercase">
          <Car className="h-3.5 w-3.5" />
          Transfer
        </label>
        <button
          onClick={onRemove}
          className="flex cursor-pointer items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700"
        >
          <X className="h-3 w-3" />
          Remove
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-stone-500 uppercase">From</label>
          <Input
            className="h-9 text-xs"
            placeholder="e.g. Kigali Airport, Lodge name..."
            value={current.originName}
            onChange={(e) => onUpdate({ ...current, originId: null, originName: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-stone-500 uppercase">To</label>
          <Input
            className="h-9 text-xs"
            placeholder="e.g. Akagera NP, Lodge name..."
            value={current.destinationName}
            onChange={(e) => onUpdate({ ...current, destinationId: null, destinationName: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-stone-500 uppercase">Mode</label>
          <Select value={current.mode} onValueChange={(val) => update('mode', val)}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="road_4x4">4WD Safari</SelectItem>
              <SelectItem value="road_shuttle">Shuttle</SelectItem>
              <SelectItem value="road_bus">Bus</SelectItem>
              <SelectItem value="flight_domestic">Domestic Flight</SelectItem>
              <SelectItem value="flight_bush">Bush Flight</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-stone-500 uppercase">Duration (hours)</label>
          <Input
            type="number"
            min={0}
            className="h-9 text-xs"
            placeholder="0"
            value={durationHours}
            onChange={(e) => {
              const h = parseInt(e.target.value) || 0;
              update('durationMinutes', h * 60 || null);
            }}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-stone-500 uppercase">Distance (km)</label>
          <Input
            type="number"
            min={0}
            className="h-9 text-xs"
            placeholder="Optional"
            value={current.distanceKm ?? ''}
            onChange={(e) => update('distanceKm', parseInt(e.target.value) || null)}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-medium text-stone-500 uppercase">Notes</label>
        <Textarea
          value={current.notes || ''}
          onChange={(e) => update('notes', e.target.value)}
          placeholder="Transfer notes (optional)"
          className="min-h-[40px] text-xs"
        />
      </div>
    </div>
  );
}

function MealBadge({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-5 w-5 items-center justify-center rounded border text-xs font-medium transition-colors ${
        active
          ? 'border-green-600 bg-green-50 text-green-700'
          : 'border-stone-300 text-stone-300 hover:border-stone-400 hover:text-stone-400'
      }`}
    >
      {label}
    </button>
  );
}
