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

export default function TourSelector({
    tours,
}: {
    tours: Array<{ label: string; value: string }>
}) {
    const [selectedTour, setSelectedTour] = useState<string>()
    const [open, setOpen] = useState<boolean>(false)
    return (
        <>
            <p className="my-[10px] text-xl font-medium">
                Select the tour that the client will be gettting ....
            </p>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className="w-full justify-between md:max-w-[400px]"
                        aria-expanded={open}
                        role="combobox"
                    >
                        {selectedTour
                            ? tours.find((tour) => tour.value === selectedTour)
                                  ?.label
                            : 'Select tour ...'}
                        <ChevronDown className="text-muted-foreground" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
                    <Command>
                        <CommandInput placeholder="Search for tour ...." />
                        <CommandList>
                            <CommandEmpty>No Tours found</CommandEmpty>
                            <CommandGroup>
                                {tours.map((tour) => (
                                    <CommandItem
                                        key={tour.value}
                                        value={tour.value}
                                        onSelect={(currentValue) => {
                                            setSelectedTour(
                                                currentValue === selectedTour
                                                    ? ''
                                                    : currentValue,
                                            )
                                            setOpen(false)
                                        }}
                                    >
                                        {tour.label}
                                        <CheckIcon
                                            className={cn(
                                                'ml-auto',
                                                selectedTour === tour.value
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
