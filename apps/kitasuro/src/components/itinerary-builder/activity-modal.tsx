import { Button } from '@repo/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/dialog';
import { Switch } from '@repo/ui/switch';
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import type { BuilderActivity as Activity } from '@/types/itinerary-types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select';
import { Input } from '@repo/ui/input';
import { Textarea } from '@repo/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover';
import { ImagePicker } from './image-picker';
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Combobox } from '@repo/ui/combobox';
import { commonActivities } from '@/lib/data/itinerary-data';
import { getAllNationalParks } from '@/app/itineraries/actions';

const moments = ['Morning', 'Afternoon', 'Evening', 'Half Day', 'Full Day', 'Night'] as const;

export function ActivityModal({
  isOpen,
  onClose,
  dayId,
  initialActivities,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  dayId: string | null;
  initialActivities: Activity[];
  onSave: (activities: Activity[]) => void;
}) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [nationalParksList, setNationalParksList] = useState<{ value: string; label: string }[]>(
    [],
  );

  useEffect(() => {
    if (isOpen) {
      setActivities(initialActivities);
      getAllNationalParks().then((parks) => {
        setNationalParksList(parks.map((p) => ({ value: p.id, label: p.name })));
      });
    }
  }, [isOpen, initialActivities]);

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
    setActivities([...activities, newActivity]);
  };

  const handleUpdateActivity = (id: string, field: keyof Activity, value: any) => {
    setActivities(
      activities.map((activity) =>
        activity.id === id ? { ...activity, [field]: value } : activity,
      ),
    );
  };

  const handleDeleteActivity = (id: string) => {
    setActivities(activities.filter((activity) => activity.id !== id));
  };

  const handleSave = () => {
    onSave(activities);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1 text-xl font-bold">
            Activities Day {dayId}
            <span className="text-green-500">.</span>
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="mb-4 grid grid-cols-12 gap-4 border-b pb-2 text-xs font-bold text-gray-500">
            <div className="col-span-1 text-center">Order</div>
            <div className="col-span-3">Activity Type</div>
            <div className="col-span-3">Location</div>
            <div className="col-span-3">Moment</div>
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
                    onUpdate={handleUpdateActivity}
                    onDelete={handleDeleteActivity}
                    nationalParksList={nationalParksList}
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
  onUpdate,
  onDelete,
  nationalParksList,
}: {
  activity: Activity;
  onUpdate: (id: string, field: keyof Activity, value: any) => void;
  onDelete: (id: string) => void;
  nationalParksList: { value: string; label: string }[];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: activity.id,
  });

  const [isExpanded, setIsExpanded] = useState(!!activity.description || !!activity.imageUrl);

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
          <Combobox
            items={commonActivities}
            value={activity.name}
            onChange={(val) => onUpdate(activity.id, 'name', val)}
            placeholder="Select activity"
            className="h-9 border-stone-200"
          />
        </div>
        <div className="col-span-3">
          <Combobox
            items={nationalParksList}
            value={activity.location}
            onChange={(val) => onUpdate(activity.id, 'location', val)}
            placeholder="Select location"
            className="h-9 border-stone-200"
          />
        </div>
        <div className="col-span-3">
          <Select
            value={activity.moment}
            onValueChange={(val) => onUpdate(activity.id, 'moment', val)}
          >
            <SelectTrigger className="h-9 border-stone-200">
              <SelectValue placeholder="Moment" />
            </SelectTrigger>
            <SelectContent>
              {moments.map((moment) => (
                <SelectItem key={moment} value={moment}>
                  {moment}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
