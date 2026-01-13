import { getClients } from './actions'
import { Button } from '@repo/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table'
import { Edit, Plus, Search, Mail, Phone, MapPin } from 'lucide-react'
import Link from 'next/link'
import { Input } from '@repo/ui/input'

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const filters = await searchParams
  const page = Number(filters.page) || 1
  const query = filters.query as string

  const { clients: data, pagination } = await getClients({
    page,
    limit: 15,
    query,
  })

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
            <p className="mt-2 text-gray-600">Manage your client contacts and information</p>
          </div>
          <Button asChild>
            <Link href="/clients/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Link>
          </Button>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <form method="GET">
              <Input
                name="query"
                defaultValue={query}
                placeholder="Search by name..."
                className="pl-10"
              />
            </form>
          </div>
        </div>

        <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Country</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No clients found.
                  </TableCell>
                </TableRow>
              ) : (
                data.map(client => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      {client.name}
                    </TableCell>
                    <TableCell>
                      {client.email ? (
                        <a href={`mailto:${client.email}`} className="flex items-center text-blue-600 hover:underline">
                          <Mail className="mr-1 h-3 w-3" />
                          {client.email}
                        </a>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {client.phone ? (
                        <span className="flex items-center text-gray-600">
                          <Phone className="mr-1 h-3 w-3" />
                          {client.phone}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {client.countryOfResidence ? (
                        <span className="flex items-center text-gray-600">
                          <MapPin className="mr-1 h-3 w-3" />
                          {client.countryOfResidence}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/clients/${client.id}/edit`}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {(pagination.page > 1 || pagination.hasNextPage) && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              asChild={pagination.page > 1}
            >
              {pagination.page > 1 ? (
                <Link href={`/clients?page=${pagination.page - 1}${query ? `&query=${query}` : ''}`}>
                  Previous
                </Link>
              ) : (
                <span>Previous</span>
              )}
            </Button>
            <span className="text-sm text-gray-600">Page {pagination.page}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNextPage}
              asChild={pagination.hasNextPage}
            >
              {pagination.hasNextPage ? (
                <Link href={`/clients?page=${pagination.page + 1}${query ? `&query=${query}` : ''}`}>
                  Next
                </Link>
              ) : (
                <span>Next</span>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
