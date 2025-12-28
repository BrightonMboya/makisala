'use client'

import React, { createContext, useContext, useState, type ReactNode, useEffect } from 'react'

// Types
export type Activity = {
    id: string
    name: string
    location: string
    moment: 'Morning' | 'Afternoon' | 'Evening' | 'Half Day' | 'Full Day' | 'Night'
    isOptional: boolean
}

export type Day = {
    id: string
    dayNumber: number
    date: string
    accommodation: string | null
    destination: string | null
    activities: Activity[]
    meals: {
        breakfast: boolean
        lunch: boolean
        dinner: boolean
    }
}

export type TravelerType = 'Adult' | 'Senior' | 'Child' | 'Baby'

export type TravelerGroup = {
    id: string
    count: number
    type: TravelerType
}

export type PricingRow = {
    id: string
    count: number
    type: string
    unitPrice: number
}

export type ExtraOption = {
    id: string
    name: string
    price: number
    selected: boolean
}

type BuilderContextType = {
    // Tour Details
    tourType: string
    setTourType: React.Dispatch<React.SetStateAction<string>>
    clientName: string
    setClientName: React.Dispatch<React.SetStateAction<string>>
    tourTitle: string
    setTourTitle: React.Dispatch<React.SetStateAction<string>>
    travelerGroups: TravelerGroup[]
    setTravelerGroups: React.Dispatch<React.SetStateAction<TravelerGroup[]>>
    
    // Day by Day
    days: Day[]
    setDays: React.Dispatch<React.SetStateAction<Day[]>>
    startDate: Date | undefined
    setStartDate: React.Dispatch<React.SetStateAction<Date | undefined>>
    startCity: string
    setStartCity: React.Dispatch<React.SetStateAction<string>>
    transferIncluded: string
    setTransferIncluded: React.Dispatch<React.SetStateAction<string>>
    pickupPoint: string
    setPickupPoint: React.Dispatch<React.SetStateAction<string>>
    
    // Pricing
    pricingRows: PricingRow[]
    setPricingRows: React.Dispatch<React.SetStateAction<PricingRow[]>>
    extras: ExtraOption[]
    setExtras: React.Dispatch<React.SetStateAction<ExtraOption[]>>
}

const BuilderContext = createContext<BuilderContextType | undefined>(undefined)

export function BuilderProvider({ children, initialData }: { children: ReactNode; initialData?: any }) {
    // Tour Details
    const [tourType, setTourType] = useState('Private Tour')
    const [clientName, setClientName] = useState('')
    const [tourTitle, setTourTitle] = useState('')
    const [travelerGroups, setTravelerGroups] = useState<TravelerGroup[]>([
        { id: '1', count: 2, type: 'Adult' }
    ])
    
    // Day by Day
    const [days, setDays] = useState<Day[]>([
        {
            id: '1',
            dayNumber: 1,
            date: '',
            accommodation: 'nature-kigali',
            destination: 'kigali',
            activities: [],
            meals: { breakfast: true, lunch: true, dinner: true },
        },
        {
            id: '2',
            dayNumber: 2,
            date: '',
            accommodation: 'mountain-gorilla-view',
            destination: 'volcanoes-np',
            activities: [
                {
                    id: 'act-1',
                    name: 'Mountain Gorilla Trekking',
                    location: 'Volcanoes National Park',
                    moment: 'Morning',
                    isOptional: false,
                },
            ],
            meals: { breakfast: true, lunch: true, dinner: true },
        },
        {
            id: '3',
            dayNumber: 3,
            date: '',
            accommodation: null,
            destination: 'kigali',
            activities: [
                {
                    id: 'act-2',
                    name: 'Golden monkey trekking',
                    location: 'Volcanoes National Park',
                    moment: 'Morning',
                    isOptional: false,
                },
            ],
            meals: { breakfast: true, lunch: true, dinner: false },
        },
    ])
    const [startDate, setStartDate] = useState<Date | undefined>(new Date(2026, 6, 1))
    const [startCity, setStartCity] = useState('Kigali')
    const [transferIncluded, setTransferIncluded] = useState('included')
    const [pickupPoint, setPickupPoint] = useState('kgl')
    
    // Pricing
    const [pricingRows, setPricingRows] = useState<PricingRow[]>([
        { id: '1', count: 2, type: 'Adult', unitPrice: 3000 },
    ])
    const [extras, setExtras] = useState<ExtraOption[]>([
        { id: '1', name: 'Airport Transfer', price: 50, selected: false },
    ])

    // Load initial data if provided
    useEffect(() => {
        if (initialData) {
            if (initialData.tourType) setTourType(initialData.tourType)
            if (initialData.clientName) setClientName(initialData.clientName)
            if (initialData.tourTitle) setTourTitle(initialData.tourTitle)
            if (initialData.days) setDays(initialData.days)
            if (initialData.startDate) setStartDate(new Date(initialData.startDate))
            if (initialData.travelerGroups) {
                setTravelerGroups(initialData.travelerGroups)
                // Sync pricing rows with initial traveler groups
                setPricingRows(initialData.travelerGroups.map((g: TravelerGroup) => ({
                    id: g.id,
                    count: g.count,
                    type: g.type,
                    unitPrice: initialData.price ? Number(initialData.price) : 0
                })))
            } else if (initialData.price) {
                // If no traveler groups provided but price is, update existing rows
                setPricingRows(prev => prev.map(row => ({
                    ...row,
                    unitPrice: Number(initialData.price)
                })))
            }
            // Add other fields as needed
        }
    }, [initialData])

    // Sync pricing rows when traveler groups change (optional, but requested behavior implies sync)
    // We only sync counts and types, preserving unit prices if IDs match
    useEffect(() => {
        setPricingRows(prevRows => {
            // Get the base price from the first row if available, to use for new rows
            const basePrice = prevRows.length > 0 ? prevRows[0]?.unitPrice! : 0

            return travelerGroups.map(group => {
                const existingRow = prevRows.find(r => r.id === group.id)
                if (existingRow) {
                    return { ...existingRow, count: group.count, type: group.type }
                }
                return {
                    id: group.id,
                    count: group.count,
                    type: group.type,
                    unitPrice: basePrice // Use inferred base price
                }
            })
        })
    }, [travelerGroups])

    return (
        <BuilderContext.Provider
            value={{
                tourType,
                setTourType,
                clientName,
                setClientName,
                tourTitle,
                setTourTitle,
                travelerGroups,
                setTravelerGroups,
                days,
                setDays,
                startDate,
                setStartDate,
                startCity,
                setStartCity,
                transferIncluded,
                setTransferIncluded,
                pickupPoint,
                setPickupPoint,
                pricingRows,
                setPricingRows,
                extras,
                setExtras,
            }}
        >
            {children}
        </BuilderContext.Provider>
    )
}

export function useBuilder() {
    const context = useContext(BuilderContext)
    if (context === undefined) {
        throw new Error('useBuilder must be used within a BuilderProvider')
    }
    return context
}
