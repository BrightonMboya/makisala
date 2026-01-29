import { getAccommodations } from './actions'
import { Button } from '@repo/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table'
import { Edit, Plus, Search, Globe, MapPin, Eye } from 'lucide-react'
import Link from 'next/link'
import { Input } from '@repo/ui/input'

export default async function AccomodationsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const filters = await searchParams
    const page = Number(filters.page) || 1
    const query = filters.query as string

    const { accommodations: data, pagination } = await getAccommodations({
        page,
        limit: 15,
        query,
    })

    return (
        <div className="mt-10 min-h-screen bg-gray-50 p-4">
            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Accomodations</h1>
                        <p className="mt-2 text-gray-600">Manage your stay options and their details</p>
                    </div>
                        <Button asChild>
                            <Link href="/accomodations/new">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Accomodation
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
                                <TableHead>Website</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Images</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No accomodations found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map(acc => (
                                    <TableRow key={acc.id}>
                                        <TableCell className="font-medium">
                                            {acc.name}
                                        </TableCell>
                                        <TableCell>
                                            {acc.url ? (
                                                <a href={acc.url} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline">
                                                    <Globe className="mr-1 h-3 w-3" />
                                                    Link
                                                </a>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {acc.latitude && acc.longitude ? (
                                                <span className="flex items-center text-gray-600">
                                                    <MapPin className="mr-1 h-3 w-3" />
                                                    {acc.latitude}, {acc.longitude}
                                                </span>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {acc.images.length} images
                                        </TableCell>
                                        <TableCell className="text-right flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/accomodations/${acc.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                    <span className="sr-only">View</span>
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/accomodations/${acc.id}/edit`}>
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

                {pagination.totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-center gap-2">
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                            <Button
                                key={p}
                                variant={p === pagination.page ? 'default' : 'outline'}
                                size="sm"
                                asChild
                            >
                                <Link href={`/accomodations?page=${p}${query ? `&query=${query}` : ''}`}>
                                    {p}
                                </Link>
                            </Button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
