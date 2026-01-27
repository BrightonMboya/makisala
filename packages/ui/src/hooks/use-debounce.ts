'use client'

import { useEffect, useState } from 'react'

/**
 * Custom hook that debounces a value
 * Only updates after the specified delay has passed without changes
 */
export function useDebounce<T>(value: T, delay = 500): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)

    useEffect(() => {
        // Set up a timer to update the debounced value after delay
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        // Clean up the timer if value changes before delay completes
        return () => {
            clearTimeout(handler)
        }
    }, [value, delay])

    return debouncedValue
}
