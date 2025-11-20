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
import AddAccomodation from '@/app/cms/itenaries/_components/AddAccomodation'
import { ControllerRenderProps } from 'react-hook-form'
import { type TourPackageForm } from '@/app/cms/tour-builder/page'

interface Props {
    accomodations: Array<{ name: string; id: string }>
    field: ControllerRenderProps<
        TourPackageForm,
        `itineraries.${number}.accommodation_id`
    >
    onCreated?: () => void
}

export default function SelectAccommodation({ accomodations, field, onCreated }: Props) {
    const [open, setOpen] = useState<boolean>(false)
    
    const selectedName = accomodations.find(a => a.id === field.value)?.name

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className="w-full justify-between"
                    aria-expanded={open}
                    role="combobox"
                >
                    {selectedName || 'Select accommodation ...'}
                    <ChevronDown className="text-muted-foreground" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command>
                    <CommandInput placeholder="Search for accommodation ...." />
                    <CommandList>
                        <CommandEmpty>
                            <div className="p-2">
                                <AddAccomodation onCreated={onCreated} />
                            </div>
                        </CommandEmpty>
                        <CommandGroup>
                            <CommandItem
                                value="no-accommodation"
                                onSelect={() => {
                                    field.onChange('')
                                    setOpen(false)
                                }}
                                className="text-muted-foreground italic"
                            >
                                No Accommodation
                                <CheckIcon
                                    className={cn(
                                        'ml-auto',
                                        !field.value ? 'opacity-100' : 'opacity-0',
                                    )}
                                />
                            </CommandItem>
                            {accomodations.map((acc) => (
                                <CommandItem
                                    key={acc.id}
                                    value={acc.name}
                                    onSelect={() => {
                                        field.onChange(acc.id)
                                        setOpen(false)
                                    }}
                                >
                                    {acc.name}
                                    <CheckIcon
                                        className={cn(
                                            'ml-auto',
                                            field.value === acc.id
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
