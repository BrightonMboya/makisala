import { notFound } from 'next/navigation'
import { createServerCaller } from '@/server/trpc/caller'
import { ClientForm } from '../../client-form'

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const trpc = await createServerCaller()
  const client = await trpc.clients.getById({ id }).catch(() => null)

  if (!client) {
    notFound()
  }

  return (
    <div className="mt-10 min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Client</h1>
          <p className="mt-2 text-gray-600">Update client information</p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <ClientForm client={client} />
        </div>
      </div>
    </div>
  )
}
