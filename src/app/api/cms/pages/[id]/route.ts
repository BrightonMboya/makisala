import { type NextRequest, NextResponse } from 'next/server'
import { updatePage, deletePage } from '@/lib/cms-service'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const pageData = await request.json()
        const updatedPage = await updatePage(params.id, pageData)
        return NextResponse.json(updatedPage)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update page' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        await deletePage(params.id)
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 })
    }
}
