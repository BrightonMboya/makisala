import { NextResponse } from 'next/server'
import { saveTourData } from '@/lib/scraper'

export async function POST(req: Request) {
    try {
        const data = await req.json()
        const result = await saveTourData(data)

        return NextResponse.json({ success: true, result })
    } catch (err) {
        console.error('Import error:', err)
        return NextResponse.json(
            // @ts-expect-error idk the error type to include here
            { success: false, error: err.message },
            { status: 500 },
        )
    }
}
