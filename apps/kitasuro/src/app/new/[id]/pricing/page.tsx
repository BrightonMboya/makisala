'use client'

import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { Input } from '@repo/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@repo/ui/select'
import { Plus, Trash2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Combobox } from '@repo/ui/combobox'
import { commonExtras } from '@/lib/data/itinerary-data'
import { useBuilder, type PricingRow, type ExtraOption } from '@/components/itinerary-builder/builder-context'

export default function PricingPage() {
    const params = useParams()
    const id = params.id as string

    const { pricingRows, setPricingRows, extras, setExtras } = useBuilder()

    const handleAddRow = () => {
        setPricingRows([
            ...pricingRows,
            {
                id: Math.random().toString(36).substr(2, 9),
                count: 1,
                type: 'Adult',
                unitPrice: 0,
            },
        ])
    }

    const handleRemoveRow = (rowId: string) => {
        setPricingRows(pricingRows.filter((row) => row.id !== rowId))
    }

    const handleUpdateRow = (rowId: string, field: keyof PricingRow, value: any) => {
        setPricingRows(
            pricingRows.map((row) =>
                row.id === rowId ? { ...row, [field]: value } : row
            )
        )
    }

    const handleAddExtra = () => {
        setExtras([
            ...extras,
            {
                id: Math.random().toString(36).substr(2, 9),
                name: '',
                price: 0,
                selected: false,
            },
        ])
    }

    const handleRemoveExtra = (extraId: string) => {
        setExtras(extras.filter((extra) => extra.id !== extraId))
    }

    const handleUpdateExtra = (extraId: string, field: keyof ExtraOption, value: any) => {
        setExtras(
            extras.map((extra) =>
                extra.id === extraId ? { ...extra, [field]: value } : extra
            )
        )
    }

    const rowsTotal = pricingRows.reduce(
        (acc, row) => acc + row.count * row.unitPrice,
        0
    )
    const extrasTotal = extras
        .filter((e) => e.selected)
        .reduce((acc, e) => acc + e.price, 0)
    const grandTotal = rowsTotal + extrasTotal

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-6">
                <div>
                    <h2 className="font-serif text-3xl font-bold text-stone-900">
                        Pricing & Inclusions
                    </h2>
                    <p className="mt-1 text-stone-500">Manage trip costs and optional add-ons.</p>
                </div>
                <div className="flex items-center gap-4 text-sm bg-white rounded-lg shadow-sm border border-stone-200 px-4 py-2">
                     <span className="font-bold text-stone-700">Total Quote Value:</span>
                     <span className="text-xl font-bold text-green-700">
                        $ {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                     </span>
                </div>
            </div>

            {/* Add Price Section */}
            <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
                 <div className="rounded-t-xl border-b border-stone-100 bg-stone-50/50 px-6 py-4 flex items-center justify-between">
                    <h3 className="font-bold text-stone-800 flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">1</span>
                        Trip Pricing
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">Currency</span>
                        <Select defaultValue="USD">
                            <SelectTrigger className="w-[180px] h-8 bg-white border-stone-200 text-xs shadow-none">
                                <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="USD">U.S. Dollar - $</SelectItem>
                                <SelectItem value="EUR">Euro - €</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-4 border-b border-stone-100 bg-stone-50/30 px-6 py-3 text-xs font-bold text-stone-500 uppercase tracking-wide">
                    <div className="col-span-5">Travelers & Type</div>
                    <div className="col-span-3">Unit Price</div>
                    <div className="col-span-4">Total</div>
                </div>
                
                <div className="p-6 space-y-3">
                    {pricingRows.map((row) => (
                        <div
                            key={row.id}
                            className="grid grid-cols-12 gap-4 items-center"
                        >
                            <div className="col-span-5 flex items-center gap-3">
                                <Select
                                    value={row.count.toString()}
                                    onValueChange={(val) =>
                                        handleUpdateRow(row.id, 'count', parseInt(val))
                                    }
                                >
                                    <SelectTrigger className="w-20 bg-stone-50 border-stone-200 shadow-none">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                            <SelectItem key={num} value={num.toString()}>
                                                {num}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <span className="text-stone-400 text-sm">x</span>
                                <div className="flex-1">
                                    <Select
                                        value={row.type}
                                        onValueChange={(val) =>
                                            handleUpdateRow(row.id, 'type', val)
                                        }
                                    >
                                        <SelectTrigger className="bg-stone-50 border-stone-200 shadow-none">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Adult">Adult</SelectItem>
                                            <SelectItem value="Senior">Senior</SelectItem>
                                            <SelectItem value="Child">Child</SelectItem>
                                            <SelectItem value="Baby">Baby</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="col-span-3">
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-stone-500 text-sm font-medium">$</span>
                                    <Input
                                        type="number"
                                        value={row.unitPrice}
                                        onChange={(e) =>
                                            handleUpdateRow(
                                                row.id,
                                                'unitPrice',
                                                parseFloat(e.target.value) || 0
                                            )
                                        }
                                        className="pl-7 bg-stone-50 border-stone-200 shadow-none"
                                    />
                                </div>
                            </div>
                            <div className="col-span-4 flex items-center justify-between pl-4">
                                <span className="font-bold text-stone-900 text-lg">
                                    $ {(row.count * row.unitPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                                <button
                                    className="text-stone-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-md"
                                    onClick={() => handleRemoveRow(row.id)}
                                    disabled={pricingRows.length === 1}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="border-t border-stone-100 bg-stone-50 p-4 rounded-b-xl">
                    <Button
                        variant="outline"
                        className="w-full justify-center gap-2 border-dashed bg-white text-stone-600 hover:bg-stone-50 hover:text-stone-900 hover:border-stone-300 shadow-sm"
                        onClick={handleAddRow}
                    >
                        <Plus className="h-4 w-4" />
                        Add another price line
                    </Button>
                </div>
            </div>

            <div className="flex items-center justify-end gap-2 pr-2">
                <Checkbox id="hide-total" className="border-stone-300 data-[state=checked]:bg-stone-900 data-[state=checked]:border-stone-900" />
                <label
                    htmlFor="hide-total"
                    className="text-sm font-medium text-stone-600 cursor-pointer select-none"
                >
                    Hide total price in user proposal
                </label>
            </div>

            {/* Extras Section */}
            <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
                <div className="rounded-t-xl border-b border-stone-100 bg-stone-50/50 px-6 py-4">
                    <h3 className="font-bold text-stone-800 flex items-center gap-2">
                         <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">2</span>
                        Optional Extras
                    </h3>
                </div>

                <div className="grid grid-cols-12 gap-4 border-b border-stone-100 bg-stone-50/30 px-6 py-3 text-xs font-bold text-stone-500 uppercase tracking-wide">
                    <div className="col-span-1 text-center">Select</div>
                    <div className="col-span-7">Option Details</div>
                    <div className="col-span-4">Price</div>
                </div>

                <div className="p-6 space-y-3">
                    {extras.map((extra) => (
                        <div
                            key={extra.id}
                            className="grid grid-cols-12 gap-4 items-center"
                        >
                            <div className="col-span-1 flex justify-center">
                                <Checkbox
                                    checked={extra.selected}
                                    onCheckedChange={(checked) =>
                                        handleUpdateExtra(extra.id, 'selected', checked)
                                    }
                                    className="border-stone-300 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                />
                            </div>
                            <div className="col-span-7">
                                <Combobox
                                    items={commonExtras}
                                    value={extra.name}
                                    onChange={(val) => handleUpdateExtra(extra.id, 'name', val)}
                                    placeholder="Select or type option"
                                    className="bg-stone-50 border-stone-200 shadow-none"
                                />
                            </div>
                            <div className="col-span-4 flex items-center gap-3">
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-2.5 text-stone-500 text-sm font-medium">$</span>
                                    <Input
                                        type="number"
                                        value={extra.price}
                                        onChange={(e) =>
                                            handleUpdateExtra(
                                                extra.id,
                                                'price',
                                                parseFloat(e.target.value) || 0
                                            )
                                        }
                                        className="pl-7 bg-stone-50 border-stone-200 shadow-none"
                                    />
                                </div>
                                <button
                                    className="text-stone-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-md"
                                    onClick={() => handleRemoveExtra(extra.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="border-t border-stone-100 bg-stone-50 p-4 rounded-b-xl">
                    <Button
                        variant="outline"
                        className="w-full justify-center gap-2 border-dashed bg-white text-stone-600 hover:bg-stone-50 hover:text-stone-900 hover:border-stone-300 shadow-sm"
                        onClick={handleAddExtra}
                    >
                        <Plus className="h-4 w-4" />
                        Add optional extra
                    </Button>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Link href={`/new/${id}/preview`}>
                    <Button className="bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-600/20 px-8">
                        Next: Preview & Edit <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            </div>
        </div>
    )
}
