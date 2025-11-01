'use client'

import { z } from 'zod'
import TourSelector from '@/app/cms/itenaries/_components/TourSelector'
import AddAccomodation from '@/app/cms/itenaries/_components/AddAccomodation'

const itinerarySchema = z.object({
    tour_overview: z.string(),
    guest_name: z.string(),
    day_by_day: z.array(
        z.object({
            estimated_dirving_distance: z.string().nullish(),
            overview: z.string(),
            destination: z.string(),
            departing_from: z.string(),
        }),
    ),
    price: z.string(),
    date: z.date(),
})

type tinerarySchema = z.infer<typeof itinerarySchema>

const sampleTours = [
    {
        value: '2 Days Tanzania Safari',
        label: '2 Days Tanzania Safari',
    },
    {
        value: 'Rwanda Gorilla Trekking',
        label: 'Rwanda Gorilla Trekking',
    },
    {
        value: '7 Days Kilimanjaro Trekking',
        label: '7 Days Kilimanjaro Trekking',
    },
    {
        value: 'The Great Migration safari',
        label: 'The Great Migration safari',
    },
    {
        value: 'Maasai Mara, and serengeti luxury safari',
        label: 'Maasai Mara, and serengeti luxury safari',
    },
]

export default function Page() {
    return (
        <main className="mt-[100px] items-center">
            <TourSelector tours={sampleTours} />
            <AddAccomodation />
        </main>
    )
}
