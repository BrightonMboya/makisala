'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'

import { cn } from '../cn'
import { Button } from './button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
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
    creatable = false,
    createLabel = 'Add',
}: {
    items: { value: string; label: string }[]
    value: string | null
    onChange: (value: string) => void
    placeholder?: string
    className?: string
    /** When set, typing a value that isn't an existing option shows an "Add …" row. */
    creatable?: boolean
    createLabel?: string
}) {
    const [open, setOpen] = React.useState(false)
    const [searchValue, setSearchValue] = React.useState('')

    const trimmed = searchValue.trim()

    const filteredItems = React.useMemo(() => {
        if (!trimmed) return items
        return items.filter((item) =>
            item.label.toLowerCase().includes(trimmed.toLowerCase())
        )
    }, [items, trimmed])

    // When the current value isn't one of the preset items, it's a freeform entry;
    // show the raw value rather than falling back to the placeholder.
    const selectedLabel = value
        ? (items.find((item) => item.value === value)?.label ?? value)
        : null

    const showCreate =
        creatable &&
        !!trimmed &&
        !items.some((item) => item.label.toLowerCase() === trimmed.toLowerCase())

    const handleCreate = () => {
        if (!trimmed) return
        onChange(trimmed)
        setOpen(false)
        setSearchValue('')
    }

    return (
        <Popover open={open} onOpenChange={setOpen} modal={false}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between font-normal", className)}
                >
                    <span className={cn('truncate', !selectedLabel && 'text-muted-foreground')}>
                        {selectedLabel ?? placeholder}
                    </span>
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
                        {filteredItems.length === 0 && !showCreate && (
                            <CommandEmpty>No item found.</CommandEmpty>
                        )}
                        <CommandGroup>
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
                        </CommandGroup>
                        {showCreate && (
                            <>
                                <CommandSeparator />
                                <CommandGroup>
                                    <CommandItem className="text-green-600" onSelect={handleCreate}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        {createLabel}: {trimmed}
                                    </CommandItem>
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
