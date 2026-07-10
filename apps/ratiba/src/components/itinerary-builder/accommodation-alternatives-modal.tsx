'use client';

import { Button } from '@repo/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/dialog';
import { Lightbulb, Plus, X } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { AsyncCombobox } from './async-combobox';
import { trpc } from '@/lib/trpc';
import type { AccommodationAlternative, RoomAllocation } from '@/types/itinerary-types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const newId = () => Math.random().toString(36).substr(2, 9);

/**
 * Manage the alternative lodges offered for a single night. Each alternative
 * gets its own lodge, room mix, and board basis (B/L/D). The price delta for
 * each alternative is set later, on the pricing step.
 */
export function AccommodationAlternativesModal({
  isOpen,
  onClose,
  dayNumber,
  primaryName,
  alternatives,
  totalPax,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  dayNumber: number;
  primaryName: string | null;
  alternatives: AccommodationAlternative[];
  totalPax: number;
  onSave: (alternatives: AccommodationAlternative[]) => void;
}) {
  // Local working copy so a Cancel discards edits. The modal is unmounted while
  // closed (rendered only for the active day), so this initializer re-seeds from
  // the latest `alternatives` on every open.
  const [draft, setDraft] = useState<AccommodationAlternative[]>(alternatives);

  const addAlternative = () => {
    setDraft((prev) => [
      ...prev,
      {
        id: newId(),
        accommodation: null,
        accommodationName: null,
        rooms: [{ roomType: null, pax: totalPax > 0 ? totalPax : 1 }],
        meals: { breakfast: false, lunch: false, dinner: false },
        mealOptions: [],
        additionalPrice: null,
        priceUnitLabel: null,
        hideInQuote: false,
      },
    ]);
  };

  const updateAlternative = (id: string, patch: Partial<AccommodationAlternative>) => {
    setDraft((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  };

  const removeAlternative = (id: string) => {
    setDraft((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSave = () => {
    // Persist only alternatives where a lodge was actually chosen.
    onSave(draft.filter((a) => !!a.accommodation));
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-[820px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            Alternative accommodation
            <span className="ml-2 text-sm font-normal text-stone-500">
              Day {dayNumber}
              {primaryName ? ` · instead of ${primaryName}` : ''}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Offer the client a different lodge for this night, an upgrade or a more budget-friendly
            option. Set how much it changes the price (up or down) later, on the Pricing step.
          </span>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto py-2">
          {draft.length === 0 ? (
            <div className="rounded-lg border border-dashed border-stone-200 py-10 text-center text-sm text-stone-400">
              No alternatives yet for this night.
            </div>
          ) : (
            draft.map((alt, idx) => (
              <AlternativeRow
                key={alt.id}
                index={idx}
                alternative={alt}
                totalPax={totalPax}
                onUpdate={(patch) => updateAlternative(alt.id, patch)}
                onRemove={() => removeAlternative(alt.id)}
              />
            ))
          )}

          <Button
            variant="outline"
            className="w-full justify-center gap-2 border-dashed bg-white text-green-600 hover:bg-green-50 hover:text-green-700"
            onClick={addAlternative}
          >
            <Plus className="h-4 w-4" />
            Add alternative accommodation
          </Button>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-stone-100 pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button className="bg-green-700 hover:bg-green-800" onClick={handleSave}>
            Save alternatives
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AlternativeRow({
  index,
  alternative,
  totalPax,
  onUpdate,
  onRemove,
}: {
  index: number;
  alternative: AccommodationAlternative;
  totalPax: number;
  onUpdate: (patch: Partial<AccommodationAlternative>) => void;
  onRemove: () => void;
}) {
  const utils = trpc.useUtils();
  const nameCache = useRef<Map<string, string>>(new Map());

  const handleSearch = useCallback(
    async (query: string) => {
      const results = await utils.accommodations.search.fetch({ query, limit: 10 });
      results.forEach((acc) => nameCache.current.set(acc.id, acc.name));
      return results.map((acc) => ({ value: acc.id, label: acc.name }));
    },
    [utils],
  );

  const handleChange = useCallback(
    (val: string) => {
      if (!val) {
        onUpdate({ accommodation: null, accommodationName: null });
        return;
      }
      const cachedName = nameCache.current.get(val) ?? null;
      onUpdate({
        accommodation: val,
        accommodationName: cachedName,
        ...((alternative.rooms?.length ?? 0) === 0
          ? { rooms: [{ roomType: null, pax: totalPax > 0 ? totalPax : 1 }] }
          : {}),
      });
      if (!cachedName) {
        utils.accommodations.getLookup.fetch({ id: val }).then((acc) => {
          if (acc?.name) {
            nameCache.current.set(val, acc.name);
            onUpdate({ accommodationName: acc.name });
          }
        });
      }
    },
    [alternative.rooms, onUpdate, totalPax, utils],
  );

  const handleGetLabel = useCallback(
    async (id: string) => {
      if (alternative.accommodationName) return alternative.accommodationName;
      const acc = await utils.accommodations.getLookup.fetch({ id });
      return acc?.name || null;
    },
    [alternative.accommodationName, utils],
  );

  // ----- Room mix -----
  const rooms = alternative.rooms ?? [];
  const assignedPax = rooms.reduce((sum, r) => sum + (Number(r.pax) || 0), 0);
  const paxMatches = totalPax > 0 && assignedPax === totalPax;

  const accommodationUuid =
    alternative.accommodation && UUID_RE.test(alternative.accommodation)
      ? alternative.accommodation
      : null;
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
  const roomListId = `alt-rooms-${alternative.id}`;
  const titleCase = (s: string) =>
    s
      .split(/\s+/)
      .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : ''))
      .join(' ');

  const updateRoom = (i: number, patch: Partial<RoomAllocation>) => {
    onUpdate({ rooms: rooms.map((r, ri) => (ri === i ? { ...r, ...patch } : r)) });
  };
  const addRoom = () => {
    const remaining = totalPax - assignedPax;
    onUpdate({ rooms: [...rooms, { roomType: null, pax: remaining > 0 ? remaining : 1 }] });
  };
  const removeRoom = (i: number) => {
    onUpdate({ rooms: rooms.filter((_, ri) => ri !== i) });
  };

  const meals = alternative.meals ?? { breakfast: false, lunch: false, dinner: false };
  const toggleMeal = (meal: 'breakfast' | 'lunch' | 'dinner') => {
    onUpdate({ meals: { ...meals, [meal]: !meals[meal] } });
  };

  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold tracking-wide text-stone-500 uppercase">
          Alternative {index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700"
        >
          <X className="h-3.5 w-3.5" />
          Remove
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.4fr_1fr_auto]">
        {/* Accommodation */}
        <div className="space-y-1">
          <label className="block text-[10px] font-medium tracking-wide text-stone-500 uppercase">
            Accommodation
          </label>
          <AsyncCombobox
            value={alternative.accommodation}
            onChange={handleChange}
            onSearch={handleSearch}
            onGetLabel={handleGetLabel}
            initialLabel={alternative.accommodationName}
            placeholder="Search accommodation..."
            className="w-full"
          />
        </div>

        {/* Room mix */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="block text-[10px] font-medium tracking-wide text-stone-500 uppercase">
              Rooms
            </label>
            {totalPax > 0 && (
              <span
                className={`text-[10px] font-medium ${paxMatches ? 'text-stone-400' : 'text-amber-600'}`}
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
            {rooms.map((room, i) => (
              <div key={i} className="flex items-center gap-1">
                <input
                  type="text"
                  list={roomListId}
                  value={room.roomType ?? ''}
                  onChange={(e) => updateRoom(i, { roomType: e.target.value || null })}
                  placeholder="Room…"
                  className={`h-8 min-w-0 flex-1 rounded-md border bg-white px-2 text-xs ${
                    room.roomType
                      ? 'border-stone-200 text-stone-700'
                      : 'border-amber-300 bg-amber-50 text-amber-800'
                  }`}
                />
                <input
                  type="number"
                  min={1}
                  value={room.pax || ''}
                  onChange={(e) => updateRoom(i, { pax: parseInt(e.target.value, 10) || 0 })}
                  className="h-8 w-12 shrink-0 rounded-md border border-stone-200 bg-white px-1 text-center text-xs text-stone-700"
                />
                {rooms.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRoom(i)}
                    className="shrink-0 rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
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

        {/* Meal plan */}
        <div className="space-y-1">
          <label className="block text-[10px] font-medium tracking-wide text-stone-500 uppercase">
            Meal Plan
          </label>
          <div className="flex gap-1">
            <MealToggle label="B" active={meals.breakfast} onClick={() => toggleMeal('breakfast')} />
            <MealToggle label="L" active={meals.lunch} onClick={() => toggleMeal('lunch')} />
            <MealToggle label="D" active={meals.dinner} onClick={() => toggleMeal('dinner')} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MealToggle({
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
      type="button"
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded border text-xs font-medium transition-colors ${
        active
          ? 'border-green-600 bg-green-50 text-green-700'
          : 'border-stone-300 text-stone-300 hover:border-stone-400 hover:text-stone-400'
      }`}
    >
      {label}
    </button>
  );
}
