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
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityModal, momentToArray } from './activity-modal';
import { AccommodationAlternativesModal } from './accommodation-alternatives-modal';
import { AsyncCombobox } from './async-combobox';
import { CreatableAsyncCombobox } from './creatable-async-combobox';
import { MealOptionsField } from './meal-options-field';
import { Textarea } from '@repo/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select';
import { Input } from '@repo/ui/input';
import type {
  AccommodationAlternative,
  BuilderActivity,
  BuilderDay,
  RoomAllocation,
  TransportModeType,
} from '@/types/itinerary-types';
import { addDays, format } from 'date-fns';
import { trpc } from '@/lib/trpc';
import { parseGeoValue, searchPlaces } from '@/lib/geocoding';

type Day = BuilderDay;
type Activity = BuilderActivity;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function DayTable({
  days,
  setDays,
  startDate,
  countries,
  totalPax = 0,
}: {
  days: Day[];
  setDays: React.Dispatch<React.SetStateAction<Day[]>>;
  startDate?: Date;
  countries?: string[];
  totalPax?: number;
}) {
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [alternativesDayId, setAlternativesDayId] = useState<string | null>(null);

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
    setDays((prev) =>
      prev.map((day) => {
        if (day.id === dayId) {
          return { ...day, activities: newActivities };
        }
        return day;
      }),
    );
    setIsActivityModalOpen(false);
  };

  const handleSaveAlternatives = (dayId: string, alternatives: AccommodationAlternative[]) => {
    setDays((prev) =>
      prev.map((day) => (day.id === dayId ? { ...day, alternatives } : day)),
    );
    setAlternativesDayId(null);
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
    setDays((prev) =>
      prev.map((day) => {
        if (day.id === dayId) {
          return { ...day, [field]: value };
        }
        return day;
      }),
    );
  };

  const handleUpdateDayMultiple = (dayId: string, updates: Partial<Day>) => {
    setDays((prev) =>
      prev.map((day) => {
        if (day.id === dayId) {
          return { ...day, ...updates };
        }
        return day;
      }),
    );
  };

  const selectedDay = days.find((d) => d.id === selectedDayId);
  const alternativesDay = days.find((d) => d.id === alternativesDayId);

  // Every custom moment used across the whole itinerary, so a moment added on
  // one day stays available in the activity dropdown on every other day.
  const knownMoments = useMemo(() => {
    const set = new Set<string>();
    days.forEach((day) =>
      day.activities.forEach((a) => momentToArray(a.moment).forEach((m) => set.add(m))),
    );
    return Array.from(set);
  }, [days]);

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
                totalPax={totalPax}
                onAddActivity={handleAddActivity}
                onManageAlternatives={setAlternativesDayId}
                onToggleMeal={handleToggleMeal}
                onDelete={handleDeleteDay}
                onDuplicate={handleDuplicateDay}
                onUpdate={handleUpdateDay}
                onUpdateMultiple={handleUpdateDayMultiple}
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
          countries={countries}
          knownMoments={knownMoments}
        />
      )}

      {alternativesDay && (
        <AccommodationAlternativesModal
          isOpen={!!alternativesDayId}
          onClose={() => setAlternativesDayId(null)}
          dayNumber={alternativesDay.dayNumber}
          primaryName={alternativesDay.accommodationName ?? null}
          alternatives={alternativesDay.alternatives ?? []}
          totalPax={totalPax}
          onSave={(alternatives) => handleSaveAlternatives(alternativesDay.id, alternatives)}
        />
      )}
    </div>
  );
}

function SortableDayRow({
  day,
  totalPax,
  onAddActivity,
  onManageAlternatives,
  onToggleMeal,
  onDelete,
  onDuplicate,
  onUpdate,
  onUpdateMultiple,
}: {
  day: Day;
  totalPax: number;
  onAddActivity: (id: string) => void;
  onManageAlternatives: (id: string) => void;
  onToggleMeal: (id: string, meal: 'breakfast' | 'lunch' | 'dinner') => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onUpdate: (id: string, field: keyof Day, value: any) => void;
  onUpdateMultiple: (id: string, updates: Partial<Day>) => void;
}) {
  const utils = trpc.useUtils();

  // Remember id -> name for hotels seen in search so we can store the name on
  // pick (it shows in the pricing breakdown and avoids a refetch).
  const accommodationNameCache = useRef<Map<string, string>>(new Map());

  const parkCache = useRef<Map<string, { name: string; lat: number | null; lng: number | null }>>(
    new Map(),
  );

  // Callbacks for async accommodation search
  const handleAccommodationSearch = useCallback(
    async (query: string) => {
      const results = await utils.accommodations.search.fetch({ query, limit: 10 });
      results.forEach((acc) => accommodationNameCache.current.set(acc.id, acc.name));
      return results.map((acc) => ({ value: acc.id, label: acc.name }));
    },
    [utils],
  );

  // Persist both the id and the display name when a hotel is picked (or cleared).
  const handleAccommodationChange = useCallback(
    (val: string) => {
      if (!val) {
        onUpdateMultiple(day.id, { accommodation: null, accommodationName: null, rooms: [] });
        return;
      }
      const cachedName = accommodationNameCache.current.get(val) ?? null;
      onUpdateMultiple(day.id, {
        accommodation: val,
        accommodationName: cachedName,
        // Seed a first room row so the night is ready to price.
        ...((day.rooms?.length ?? 0) === 0
          ? { rooms: [{ roomType: null, pax: totalPax > 0 ? totalPax : 1 }] }
          : {}),
      });
      // Fallback: resolve the name if it wasn't in the search cache.
      if (!cachedName) {
        utils.accommodations.getLookup.fetch({ id: val }).then((acc) => {
          if (acc?.name) {
            accommodationNameCache.current.set(val, acc.name);
            onUpdate(day.id, 'accommodationName', acc.name);
          }
        });
      }
    },
    [day.id, day.rooms, totalPax, onUpdate, onUpdateMultiple, utils],
  );

  // Only fetch label if we don't already have the accommodation name
  // This prevents N+1 queries when proposal data already includes names
  const handleGetAccommodationLabel = useCallback(
    async (id: string) => {
      // Check if we already have the name from the day data
      if (day.accommodationName) {
        return day.accommodationName;
      }
      const acc = await utils.accommodations.getLookup.fetch({ id });
      return acc?.name || null;
    },
    [day.accommodationName, utils],
  );

  const handleDestinationSearch = useCallback(
    async (query: string) => {
      if (query.length < 2) return [];

      const results = await utils.nationalParks.search.fetch({ query, limit: 20 });

      results.forEach((p) =>
        parkCache.current.set(p.id, {
          name: p.name,
          lat: p.latitude != null ? Number(p.latitude) : null,
          lng: p.longitude != null ? Number(p.longitude) : null,
        }),
      );

      return results.map((p) => ({ value: p.id, label: p.name }));
    },
    [utils],
  );

  const createDestination = trpc.nationalParks.createCustom.useMutation();

  const handleDestinationCreate = useCallback(
    async (name: string) => {
      // Silently geocode the typed name so the new destination gets a map pin.
      // Photon biases but never restricts, so any top hit is acceptable here.
      let lat: number | null = null;
      let lng: number | null = null;
      let country: string | undefined;
      try {
        const [top] = await searchPlaces(name);
        if (top) {
          lat = top.latitude;
          lng = top.longitude;
          country = top.country;
        }
      } catch {
        // Geocoding is best-effort; a destination with no pin is still usable.
      }

      const created = await createDestination.mutateAsync({
        name,
        latitude: lat ?? undefined,
        longitude: lng ?? undefined,
        country,
      });

      parkCache.current.set(created.id, { name: created.name, lat, lng });
      return { value: created.id, label: created.name };
    },
    [createDestination],
  );

  const handleGetDestinationLabel = useCallback(
    async (id: string) => {
      if (UUID_RE.test(id)) {
        const cached = parkCache.current.get(id);
        if (cached) return cached.name;
        const park = await utils.nationalParks.getById.fetch({ id });
        if (park) {
          parkCache.current.set(id, {
            name: park.name,
            lat: park.latitude != null ? Number(park.latitude) : null,
            lng: park.longitude != null ? Number(park.longitude) : null,
          });
          return park.name;
        }
        return null;
      }
      const geo = parseGeoValue(id);
      if (geo) return geo.name;
      return id;
    },
    [utils],
  );
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: day.id,
  });

  const [isExpanded, setIsExpanded] = useState(!!day.description);
  const [isTransferExpanded, setIsTransferExpanded] = useState(!!day.transfer);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const suggestMutation = trpc.translations.suggestDayCopy.useMutation();

  const handleSuggestContent = useCallback(async () => {
    let destName = day.destinationName || '';
    if (!destName && day.destination) {
      // Resolve name from geo value or park ID
      const geo = parseGeoValue(day.destination);
      destName = geo?.name || day.destination;
    }
    if (!destName) return;

    setIsSuggesting(true);
    try {
      const result = await suggestMutation.mutateAsync({
        destinationName: destName,
        dayNumber: day.dayNumber,
        activities: day.activities.map((a) => ({
          name: a.name,
          location: a.location || undefined,
        })),
        accommodationName: day.accommodationName || null,
      });
      if (result.description) {
        onUpdate(day.id, 'description', result.description);
        setIsExpanded(true);
      }
    } finally {
      setIsSuggesting(false);
    }
  }, [day.destination, day.destinationName, day.dayNumber, day.activities, day.accommodationName, day.id, onUpdate]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  // ----- Room mix (per night) -----
  const rooms = day.rooms ?? [];
  const assignedPax = rooms.reduce((sum, r) => sum + (Number(r.pax) || 0), 0);
  const paxMatches = totalPax > 0 && assignedPax === totalPax;

  const accommodationUuid =
    day.accommodation && UUID_RE.test(day.accommodation) ? day.accommodation : null;
  const { data: hotelRoomTypes = [] } =
    trpc.rateCards.accommodationRates.roomTypesForAccommodation.useQuery(
      { accommodationId: accommodationUuid ?? '' },
      { enabled: !!accommodationUuid },
    );
  const roomOptions = useMemo(() => {
    const generic = ['single', 'double', 'triple', 'quad', 'family'];
    if (hotelRoomTypes.length > 0) {
      const seen = new Set<string>();
      const out: string[] = [];
      for (const r of hotelRoomTypes) {
        if (!seen.has(r.roomType)) {
          seen.add(r.roomType);
          out.push(r.roomType);
        }
      }
      return out;
    }
    return generic;
  }, [hotelRoomTypes]);
  const roomListId = `rooms-${day.id}`;
  const titleCase = (s: string) =>
    s
      .split(/\s+/)
      .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : ''))
      .join(' ');

  const updateRoom = (index: number, patch: Partial<RoomAllocation>) => {
    onUpdate(
      day.id,
      'rooms',
      rooms.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    );
  };
  const addRoom = () => {
    const remaining = totalPax - assignedPax;
    onUpdate(day.id, 'rooms', [
      ...rooms,
      { roomType: null, pax: remaining > 0 ? remaining : 1 },
    ]);
  };
  const removeRoom = (index: number) => {
    onUpdate(
      day.id,
      'rooms',
      rooms.filter((_, i) => i !== index),
    );
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
              onChange={handleAccommodationChange}
              onSearch={handleAccommodationSearch}
              onGetLabel={handleGetAccommodationLabel}
              initialLabel={day.accommodationName}
              placeholder="Search accommodation..."
              className="w-full"
            />
            {day.accommodation && (
              <div className="space-y-2">
                {/* Room mix — one row per room type, with how many travelers in each.
                    Board basis is taken from the Meal Plan (B/L/D) column. */}
                <div>
                  <div className="mb-0.5 flex items-center justify-between">
                    <label className="block text-[10px] font-medium uppercase tracking-wide text-stone-500">
                      Rooms
                    </label>
                    {totalPax > 0 && (
                      <span
                        className={`text-[10px] font-medium ${
                          paxMatches ? 'text-stone-400' : 'text-amber-600'
                        }`}
                        title="Travelers assigned to rooms vs. total travelers"
                      >
                        {assignedPax}/{totalPax} pax
                      </span>
                    )}
                  </div>
                  <datalist id={roomListId}>
                    {roomOptions.map((rt) => (
                      <option key={rt} value={rt}>
                        {titleCase(rt)}
                      </option>
                    ))}
                  </datalist>
                  <div className="space-y-1">
                    {rooms.map((room, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <input
                          type="text"
                          list={roomListId}
                          value={room.roomType ?? ''}
                          onChange={(e) =>
                            updateRoom(idx, {
                              roomType: e.target.value || null,
                            })
                          }
                          placeholder="Room…"
                          className={`h-8 min-w-0 flex-1 rounded-md border bg-white px-2 text-xs ${
                            room.roomType
                              ? 'border-stone-200 text-stone-700'
                              : 'border-amber-300 bg-amber-50 text-amber-800'
                          }`}
                          title="Pick a room from the hotel's rate card, or type a new name"
                        />
                        <input
                          type="number"
                          min={1}
                          value={room.pax || ''}
                          onChange={(e) =>
                            updateRoom(idx, { pax: parseInt(e.target.value, 10) || 0 })
                          }
                          className="h-8 w-12 shrink-0 rounded-md border border-stone-200 bg-white px-1 text-center text-xs text-stone-700"
                          title="Travelers in this room type"
                        />
                        {rooms.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRoom(idx)}
                            className="shrink-0 rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
                            title="Remove room type"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addRoom}
                    className="mt-1 flex items-center gap-1 text-[11px] font-medium text-green-600 hover:text-green-700"
                  >
                    <Plus className="h-3 w-3" />
                    Add room type
                  </button>
                </div>

                {/* Alternative lodges for this night */}
                <button
                  type="button"
                  onClick={() => onManageAlternatives(day.id)}
                  className="flex items-center gap-1 border-t border-stone-100 pt-2 text-[11px] font-medium text-green-600 hover:text-green-700"
                >
                  {(day.alternatives?.length ?? 0) > 0 ? (
                    <>
                      <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700">
                        {day.alternatives!.length}
                      </span>
                      {day.alternatives!.length === 1 ? 'Alternative' : 'Alternatives'}
                      <span className="text-stone-400">· Manage</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3 w-3" />
                      Add alternative
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Destination Column */}
        <div className="col-span-3 min-w-0">
          <CreatableAsyncCombobox
            value={day.destination}
            onChange={(val) => {
              if (!val) {
                onUpdateMultiple(day.id, {
                  destination: null,
                  destinationName: null,
                  destinationLat: null,
                  destinationLng: null,
                });
                return;
              }
              if (UUID_RE.test(val)) {
                const cached = parkCache.current.get(val);
                onUpdateMultiple(day.id, {
                  destination: val,
                  destinationName: cached?.name ?? day.destinationName ?? null,
                  destinationLat: cached?.lat ?? null,
                  destinationLng: cached?.lng ?? null,
                });
                if (!cached) {
                  handleGetDestinationLabel(val).then((name) => {
                    const resolved = parkCache.current.get(val);
                    onUpdateMultiple(day.id, {
                      destinationName: name ?? null,
                      destinationLat: resolved?.lat ?? null,
                      destinationLng: resolved?.lng ?? null,
                    });
                  });
                }
              } else {
                onUpdateMultiple(day.id, {
                  destination: val,
                  destinationName: val,
                  destinationLat: null,
                  destinationLng: null,
                });
              }
            }}
            onSearch={handleDestinationSearch}
            onCreate={handleDestinationCreate}
            onGetLabel={handleGetDestinationLabel}
            initialLabel={day.destinationName}
            placeholder="Search parks or type a destination"
            createLabel="Add"
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
            <MealOptionsField
              value={day.mealOptions ?? []}
              onChange={(next) => onUpdate(day.id, 'mealOptions', next)}
            />
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
                // Pre-populate origin from the day's destination name
                const originName = day.destinationName || '';
                onUpdate(day.id, 'transfer', { ...emptyTransfer, originName });
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

  // Parse duration into hours for display (supports decimals like 0.5, 1.5)
  const durationHours = current.durationMinutes ? current.durationMinutes / 60 : '';

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
            onChange={(e) =>
              onUpdate({ ...current, destinationId: null, destinationName: e.target.value })
            }
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
              <SelectItem value="mini_bus">Mini Bus</SelectItem>
              <SelectItem value="flight_domestic">Domestic Flight</SelectItem>
              <SelectItem value="flight_bush">Bush Flight</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-stone-500 uppercase">
            Duration (hours)
          </label>
          <Input
            type="number"
            min={0}
            step={0.5}
            className="h-9 text-xs"
            placeholder="0"
            value={durationHours}
            onChange={(e) => {
              const h = parseFloat(e.target.value) || 0;
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
