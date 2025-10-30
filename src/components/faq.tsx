export interface FAQItem {
    question: string
    answer: string
}

export interface FAQProps {
    faqs: FAQItem[]
}

export function FAQ({ faqs }: FAQProps) {
    return (
        <section className="mx-auto w-full max-w-4xl px-4 py-12">
            <div className="mb-12 text-center">
                <h2 className="mb-4 text-3xl font-bold text-balance">
                    Frequently Asked Questions
                </h2>
                <p className="text-muted-foreground mx-auto max-w-2xl text-lg text-pretty">
                    Find answers to the most common questions about this tour.
                </p>
            </div>

            <div className="space-y-6">
                {faqs.map((faq, index) => (
                    <div key={index} className="flex items-center space-x-3">
                        <p className="text-2xl font-medium">{index + 1}</p>
                        <div className="p-6">
                            <h3 className="mb-3 text-xl font-semibold text-balance">
                                {faq.question}
                            </h3>
                            <p className="text-muted-foreground leading-relaxed text-pretty">
                                {faq.answer}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}
