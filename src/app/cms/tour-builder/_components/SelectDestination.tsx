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
    destinations: Array<{ name: string; id: string }>
    field: ControllerRenderProps<
        TourPackageForm,
        `itineraries.${number}.main_destination`
    >
}

export default function SelectDestination({ destinations, field }: Props) {
    const [selectedDestination, setSelectedDestination] = useState<string>()
    const [open, setOpen] = useState<boolean>(false)
    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className="w-full justify-between"
                        aria-expanded={open}
                        role="combobox"
                    >
                        {selectedDestination
                            ? destinations.find(
                                  (destination) =>
                                      destination.name === selectedDestination,
                              )?.name
                            : 'Select Destination ...'}
                        <ChevronDown className="text-muted-foreground" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
                    <Command>
                        <CommandInput placeholder="Search for destination ...." />
                        <CommandList>
                            <CommandEmpty>
                                <AddAccomodation />
                            </CommandEmpty>
                            <CommandGroup>
                                {destinations.map((destination) => (
                                    <CommandItem
                                        key={destination.name}
                                        value={destination.name}
                                        onSelect={(currentValue) => {
                                            setSelectedDestination(
                                                currentValue ===
                                                    selectedDestination
                                                    ? ''
                                                    : currentValue,
                                            )
                                            field.onChange(destination.id)
                                            setOpen(false)
                                        }}
                                    >
                                        {destination.name}
                                        <CheckIcon
                                            className={cn(
                                                'ml-auto',
                                                selectedDestination ===
                                                    destination.name
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
        </>
    )
}
