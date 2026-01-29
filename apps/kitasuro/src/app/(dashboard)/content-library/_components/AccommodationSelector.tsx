'use client';

import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table';
import { Button } from '@repo/ui/button';
import { Globe, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface Accommodation {
  id: string;
  name: string;
  url: string | null;
  contentStatus: 'pending' | 'fetching' | 'completed' | 'failed' | null;
  lastFetchedAt: Date | null;
}

interface AccommodationSelectorProps {
  accommodations: Accommodation[];
}

export function AccommodationSelector({ accommodations }: AccommodationSelectorProps) {
  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Website</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="w-20"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accommodations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                No accommodations found.
              </TableCell>
            </TableRow>
          ) : (
            accommodations.map((acc) => (
              <TableRow key={acc.id}>
                <TableCell className="font-medium">{acc.name}</TableCell>
                <TableCell>
                  {acc.url ? (
                    <a
                      href={acc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:underline"
                    >
                      <Globe className="mr-1 h-3 w-3" />
                      Link
                    </a>
                  ) : (
                    <span className="text-gray-400">No URL</span>
                  )}
                </TableCell>
                <TableCell>
                  {acc.lastFetchedAt ? (
                    <span className="text-sm text-gray-600">
                      {format(new Date(acc.lastFetchedAt), 'MMM d, yyyy HH:mm')}
                    </span>
                  ) : (
                    <span className="text-gray-400">Never</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/accomodations/${acc.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
