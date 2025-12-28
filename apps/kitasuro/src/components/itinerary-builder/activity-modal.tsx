'use client'

import { Button } from '@repo/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@repo/ui/dialog'
import { Switch } from '@repo/ui/switch'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { Activity } from './day-table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@repo/ui/select'
import {
    DndContext,
    type DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Combobox } from '@repo/ui/combobox'
import { commonActivities, nationalParks } from '@/lib/data/itinerary-data'

const moments = [
    'Morning',
    'Afternoon',
    'Evening',
    'Half Day',
    'Full Day',
    'Night',
] as const

export function ActivityModal({
    isOpen,
    onClose,
    dayId,
    initialActivities,
    onSave,
}: {
    isOpen: boolean
    onClose: () => void
    dayId: string | null
    initialActivities: Activity[]
    onSave: (activities: Activity[]) => void
}) {
    const [activities, setActivities] = useState<Activity[]>([])

    useEffect(() => {
        if (isOpen) {
            setActivities(initialActivities)
        }
    }, [isOpen, initialActivities])

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            setActivities((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id)
                const newIndex = items.findIndex((item) => item.id === over.id)
                return arrayMove(items, oldIndex, newIndex)
            })
        }
    }

    const handleAddActivity = () => {
        const newActivity: Activity = {
            id: Math.random().toString(36).substr(2, 9),
            name: '',
            location: '',
            moment: 'Morning',
            isOptional: false,
        }
        setActivities([...activities, newActivity])
    }

    const handleUpdateActivity = (id: string, field: keyof Activity, value: any) => {
        setActivities(
            activities.map((activity) =>
                activity.id === id ? { ...activity, [field]: value } : activity
            )
        )
    }

    const handleDeleteActivity = (id: string) => {
        setActivities(activities.filter((activity) => activity.id !== id))
    }

    const handleSave = () => {
        onSave(activities)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[900px]">
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
                        <div className="col-span-4">
                            Activity Location/Destination
                        </div>
                        <div className="col-span-3">Moment</div>
                        <div className="col-span-1 text-center">Optional</div>
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
                            <div className="space-y-2">
                                {activities.map((activity) => (
                                    <SortableActivityRow
                                        key={activity.id}
                                        activity={activity}
                                        onUpdate={handleUpdateActivity}
                                        onDelete={handleDeleteActivity}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>

                    <div className="mt-4">
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
                <div className="flex justify-start gap-2">
                    <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={handleSave}
                    >
                        Save Activities
                    </Button>
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function SortableActivityRow({
    activity,
    onUpdate,
    onDelete,
}: {
    activity: Activity
    onUpdate: (id: string, field: keyof Activity, value: any) => void
    onDelete: (id: string) => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: activity.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="grid grid-cols-12 gap-4 items-center bg-white"
        >
            <div className="col-span-1 flex justify-center">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 cursor-grab active:cursor-grabbing"
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical className="h-4 w-4 text-gray-400" />
                </Button>
            </div>
            <div className="col-span-3">
                <Combobox
                    items={commonActivities}
                    value={activity.name}
                    onChange={(val) => onUpdate(activity.id, 'name', val)}
                    placeholder="Select activity"
                />
            </div>
            <div className="col-span-4">
                 <Combobox
                    items={nationalParks}
                    value={activity.location}
                    onChange={(val) => onUpdate(activity.id, 'location', val)}
                    placeholder="Select location"
                />
            </div>
            <div className="col-span-3">
                <Select
                    value={activity.moment}
                    onValueChange={(val) => onUpdate(activity.id, 'moment', val)}
                >
                    <SelectTrigger className="h-9">
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
            <div className="col-span-1 flex items-center justify-center gap-2">
                <Switch
                    checked={activity.isOptional}
                    onCheckedChange={(checked) =>
                        onUpdate(activity.id, 'isOptional', checked)
                    }
                />
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => onDelete(activity.id)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
