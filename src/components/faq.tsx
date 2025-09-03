export interface FAQItem {
    question: string
    answer: string
}

export interface FAQProps {
    faqs: FAQItem[]
}

export function FAQ({faqs}: FAQProps) {
    return (
        <section className="w-full max-w-4xl mx-auto px-4 py-12">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-balance mb-4">Frequently Asked Questions</h2>
                <p className="text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">Find answers to the most
                    common questions about this tour.</p>
            </div>

            <div className="space-y-6">
                {faqs.map((faq, index) => (
                    <div key={index} className="flex items-center space-x-3">
                        <p className="font-medium text-2xl ">{index + 1}</p>
                        <div className="p-6">
                            <h3 className="text-xl font-semibold mb-3 text-balance">{faq.question}</h3>
                            <p className="text-muted-foreground leading-relaxed text-pretty">{faq.answer}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}
