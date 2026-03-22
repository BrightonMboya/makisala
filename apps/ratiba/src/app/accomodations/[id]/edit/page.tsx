import Link from 'next/link'
import { getPublicUrl } from '@/lib/storage'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { notFound } from 'next/navigation'
import { createServerCaller } from '@/server/trpc/caller'
import AccomodationForm from '../../_components/AccomodationForm'
import { log } from '@/lib/logger'


export default async function EditAccomodationPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const resolvedParams = await params
    const id = resolvedParams?.id

    if (!id) {
        log.error('No ID provided to EditAccomodationPage')
        notFound()
    }

    const trpc = await createServerCaller()
    const acc = await trpc.accommodations.getById({ id })

    if (!acc) {
        notFound()
    }

    const initialData = {
        ...acc,
        images: acc.images.map((img) => ({
            ...img,
            imageUrl: getPublicUrl(img.bucket, img.key),
        })),
    }

    return (
        <div className="mx-auto max-w-7xl p-4 mt-10">
            <div className="mb-8">
                <Button variant="ghost" asChild className="-ml-4 mb-4">
                    <Link href="/accomodations">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to List
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold text-gray-900">Edit {acc.name}</h1>
                <p className="mt-2 text-gray-600">Manage accommodation details.</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <AccomodationForm initialData={initialData} />
            </div>
        </div>
    )
}
