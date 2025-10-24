import { type NextRequest, NextResponse } from 'next/server'
import { getPageBySlug } from '@/lib/cms-service'

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
    try {
        const page = await getPageBySlug(params.slug)
        return NextResponse.json(page)
    } catch (error) {
        return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }
}
