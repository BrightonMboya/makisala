'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'

interface TagInputProps {
    placeholder?: string
    tags: string[]
    setTags: (tags: string[]) => void
}

export function TagInput({ placeholder, tags, setTags }: TagInputProps) {
    const [inputValue, setInputValue] = useState('')

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            const newTag = inputValue.trim()
            if (newTag && !tags.includes(newTag)) {
                setTags([...tags, newTag])
                setInputValue('')
            }
        }
    }

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter((tag) => tag !== tagToRemove))
    }

    return (
        <div className="flex flex-col gap-2">
            <Input
                placeholder={placeholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
            />
            <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-sm">
                        {tag}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                            onClick={() => removeTag(tag)}
                        >
                            <X className="h-3 w-3" />
                            <span className="sr-only">Remove {tag}</span>
                        </Button>
                    </Badge>
                ))}
            </div>
        </div>
    )
}
