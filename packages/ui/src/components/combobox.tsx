'use client'

import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'

import { cn } from '../cn'
import { Button } from './button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from './command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from './popover'

export function Combobox({
    items,
    value,
    onChange,
    placeholder = 'Select item...',
    className,
}: {
    items: { value: string; label: string }[]
    value: string | null
    onChange: (value: string) => void
    placeholder?: string
    className?: string
}) {
    const [open, setOpen] = React.useState(false)
    const [searchValue, setSearchValue] = React.useState('')

    const filteredItems = React.useMemo(() => {
        if (!searchValue) return items
        return items.filter((item) =>
            item.label.toLowerCase().includes(searchValue.toLowerCase())
        )
    }, [items, searchValue])

    return (
        <Popover open={open} onOpenChange={setOpen} modal={false}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between font-normal", className)}
                >
                    {value
                        ? items.find((item) => item.value === value)?.label
                        : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput 
                        placeholder={`Search ${placeholder.toLowerCase()}...`}
                        value={searchValue}
                        onValueChange={setSearchValue}
                    />
                    <CommandList>
                        <CommandEmpty>No item found.</CommandEmpty>
                        {filteredItems.map((item) => (
                            <CommandItem
                                key={item.value}
                                value={item.value}
                                onSelect={(currentValue) => {
                                    onChange(currentValue === value ? '' : currentValue)
                                    setOpen(false)
                                    setSearchValue('')
                                }}
                            >
                                <Check
                                    className={cn(
                                        'mr-2 h-4 w-4',
                                        value === item.value
                                            ? 'opacity-100'
                                            : 'opacity-0'
                                    )}
                                />
                                {item.label}
                            </CommandItem>
                        ))}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
