import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function capitalize(word: string) {
    return word[0].toUpperCase() + word.slice(1)
}

export function slugify(name: string) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // remove special chars
        .trim()
        .replace(/\s+/g, '-') // replace spaces with dashes
}
