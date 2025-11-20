'use client'

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import { CheckIcon, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import AddNationalPark from './AddNationalPark'
import { ControllerRenderProps } from 'react-hook-form'
import { type TourPackageForm } from '@/app/cms/tour-builder/page'

interface Props {
    destinations: Array<{ name: string; id: string }>
    field: ControllerRenderProps<
        TourPackageForm,
        `itineraries.${number}.national_park_id`
    >
    onCreated?: () => void
}

export default function SelectDestination({ destinations, field, onCreated }: Props) {
    const [open, setOpen] = useState<boolean>(false)
    
    const selectedName = destinations.find(d => d.id === field.value)?.name

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className="w-full justify-between"
                    aria-expanded={open}
                    role="combobox"
                >
                    {selectedName || 'Select Destination ...'}
                    <ChevronDown className="text-muted-foreground" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command>
                    <CommandInput placeholder="Search for destination ...." />
                    <CommandList>
                        <CommandEmpty>
                            <div className="p-2">
                                <AddNationalPark onCreated={onCreated} />
                            </div>
                        </CommandEmpty>
                        <CommandGroup>
                            {destinations.map((destination) => (
                                <CommandItem
                                    key={destination.id}
                                    value={destination.name}
                                    onSelect={() => {
                                        field.onChange(destination.id)
                                        setOpen(false)
                                    }}
                                >
                                    {destination.name}
                                    <CheckIcon
                                        className={cn(
                                            'ml-auto',
                                            field.value === destination.id
                                                ? 'opacity-100'
                                                : 'opacity-0',
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
