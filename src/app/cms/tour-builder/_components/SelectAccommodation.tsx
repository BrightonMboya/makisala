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
        `itineraries.${number}.accommodation`
    >
}

export default function SelectAccommodation({ accomodations, field }: Props) {
    const [selectedAccomodation, setSelectedAccomodation] = useState<string>()
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
                        {selectedAccomodation
                            ? accomodations.find(
                                  (acc) => acc.name === selectedAccomodation,
                              )?.name
                            : 'Select accommodation ...'}
                        <ChevronDown className="text-muted-foreground" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
                    <Command>
                        <CommandInput placeholder="Search for accommodation ...." />
                        <CommandList>
                            <CommandEmpty>
                                <AddAccomodation />
                            </CommandEmpty>
                            <CommandGroup>
                                {accomodations.map((acc) => (
                                    <CommandItem
                                        key={acc.name}
                                        value={acc.name}
                                        onSelect={(currentValue) => {
                                            setSelectedAccomodation(
                                                currentValue ===
                                                    selectedAccomodation
                                                    ? ''
                                                    : currentValue,
                                            )
                                            field.onChange(acc.id)
                                            setOpen(false)
                                        }}
                                    >
                                        {acc.name}
                                        <CheckIcon
                                            className={cn(
                                                'ml-auto',
                                                selectedAccomodation ===
                                                    acc.name
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
