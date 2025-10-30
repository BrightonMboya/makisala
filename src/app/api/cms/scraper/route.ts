import { NextResponse } from 'next/server'
import { saveTourData } from '@/lib/scraper'

export async function POST(req: Request) {
    try {
        const data = await req.json()
        const result = await saveTourData(data)

        return NextResponse.json({ success: true, result })
    } catch (err: any) {
        console.error('Import error:', err)
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 },
        )
    }
}
