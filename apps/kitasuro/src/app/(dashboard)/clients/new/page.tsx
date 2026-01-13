import { ClientForm } from '../client-form'

export default function NewClientPage() {
  return (
    <div className="mt-10 min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add New Client</h1>
          <p className="mt-2 text-gray-600">Create a new client to associate with proposals</p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <ClientForm />
        </div>
      </div>
    </div>
  )
}
