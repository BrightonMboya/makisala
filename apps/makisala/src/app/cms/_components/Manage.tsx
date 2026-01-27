import { TabsContent } from '@repo/ui/tabs'
import { Search } from 'lucide-react'
import { Input } from '@repo/ui/input'
import { useState } from 'react'
import { useDebounce } from '@repo/ui/use-debounce'
import PageList from './PageList'
import { type HandleLoadPage } from '../page'

export default function Manage({ handleLoadPage }: { handleLoadPage: HandleLoadPage }) {
    const [searchQuery, setSearchQuery] = useState('')
    const debouncedQuery = useDebounce(searchQuery, 500)

    return (
        <TabsContent value="manage" className="space-y-6">
            <div>
                <div className="container mx-auto max-w-7xl px-4 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <p className="text-muted-foreground text-balance">
                            Search and manage your internal pages
                        </p>
                    </div>

                    {/* Search Input */}
                    <div className="relative mb-8">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                        <Input
                            type="text"
                            placeholder="Search for pages by title, content, or author..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="h-12 pl-10 text-lg"
                        />
                    </div>

                    {/* Page List */}
                    <PageList query={debouncedQuery} handleLoadPage={handleLoadPage} />
                </div>
            </div>
        </TabsContent>
    )
}
