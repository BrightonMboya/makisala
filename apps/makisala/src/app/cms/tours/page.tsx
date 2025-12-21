import { getAllTours } from '../tour-builder/actions'
import { Button } from '@repo/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table'
import { Edit, Eye, Plus } from 'lucide-react'
import Link from 'next/link'
import Pagination from './_components/Pagination'
import TourFilters from './_components/TourFilters'

export default async function ToursPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const page = Number(searchParams.page) || 1
    const query = searchParams.query as string
    const country = searchParams.country as string
    const minDays = searchParams.minDays ? Number(searchParams.minDays) : undefined
    const maxDays = searchParams.maxDays ? Number(searchParams.maxDays) : undefined

    const { tours, pagination } = await getAllTours({
        page,
        limit: 15,
        query,
        country,
        minDays,
        maxDays,
    })

    return (
        <div className="mt-10 min-h-screen bg-gray-50 p-4">
            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Tours Management</h1>
                        <p className="mt-2 text-gray-600">Manage your tour packages</p>
                    </div>
                    <Button asChild>
                        <Link href="/cms/tour-builder">
                            <Plus className="mr-2 h-4 w-4" />
                            Create New Tour
                        </Link>
                    </Button>
                </div>

                <TourFilters />

                <div className="rounded-lg border bg-white shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tour Name</TableHead>
                                <TableHead>Country</TableHead>
                                <TableHead>Days</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Last Updated</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tours.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No tours found matching your criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tours.map(tour => (
                                    <TableRow key={tour.id}>
                                        <TableCell className="font-medium">
                                            {tour.tourName}
                                        </TableCell>
                                        <TableCell>{tour.country}</TableCell>
                                        <TableCell>{tour.number_of_days} Days</TableCell>
                                        <TableCell>${tour.pricing}</TableCell>
                                        <TableCell>
                                            {tour.updatedAt
                                                ? new Date(tour.updatedAt).toLocaleDateString()
                                                : '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/tours/${tour.slug}`} target="_blank">
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    <span className="sr-only">View</span>
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/cms/tour-builder?id=${tour.id}`}>
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

                <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} />
            </div>
        </div>
    )
}
