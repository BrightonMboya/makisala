'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { FAQItem } from '@/components/faq'

export function FaqAccordion({ faqs }: { faqs: FAQItem[] }) {
    const [openIndex, setOpenIndex] = useState<number | null>(0)

    return (
        <div className="divide-y divide-stone-200">
            {faqs.map((faq, index) => (
                <div key={index}>
                    <button
                        onClick={() =>
                            setOpenIndex(openIndex === index ? null : index)
                        }
                        className="flex w-full items-center justify-between py-5 text-left transition-colors hover:text-amber-800"
                    >
                        <span className="pr-4 text-lg font-medium text-stone-800">
                            {faq.question}
                        </span>
                        <ChevronDown
                            className={`h-5 w-5 flex-shrink-0 text-stone-400 transition-transform duration-300 ${
                                openIndex === index ? 'rotate-180' : ''
                            }`}
                        />
                    </button>
                    <div
                        className={`grid transition-all duration-300 ease-in-out ${
                            openIndex === index
                                ? 'grid-rows-[1fr] opacity-100'
                                : 'grid-rows-[0fr] opacity-0'
                        }`}
                    >
                        <div className="overflow-hidden">
                            <p className="pb-5 leading-relaxed text-stone-600">
                                {faq.answer}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
