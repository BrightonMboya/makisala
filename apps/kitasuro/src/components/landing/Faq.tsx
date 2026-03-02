import React from 'react'
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent
} from '@repo/ui/accordion'

const Faq = () => {
    return (
        <div className='border-b'>
            <div
                id="customers"
                className="mx-auto border-x w-fit px-8 space-y-20"
            >
                <div className="max-w-5xl relative z-0 mx-auto px-4 py-20 sm:px-10 sm:py-28">
                    <div className="mx-auto mb-16 max-w-2xl text-center space-y-4">
                        <h2 className="font-display text-3xl font-bold text-neutral-900 sm:text-5xl">
                            Frequently Asked Question
                        </h2>
                        <p className="mt-4 text-base text-neutral-500">
                            Labore cum suscipit praesentium ipsa mollitia et delectus, quisquam eaque, fugit quidem vel, sint cumque tenetur esse.
                        </p>
                    </div>

                    <div className='min-w-5xl w-full'>
                        <Accordion
                            type="multiple"
                            className="w-full max-w-4xl"
                        >
                            {
                                Array.from({ length: 5 }, (_, i) => i + 1).map((item) => (
                                    <AccordionItem
                                        key={item}
                                        value={`item-${item}`}
                                        className='w-full'
                                    >
                                        <AccordionTrigger className='w-full'>
                                            What is the difference between Kitasuro and other tour operators?
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <p>
                                                Kitasuro is a tour operator that specializes in safari trips. It offers a unique experience that other tour operators do not provide.
                                            </p>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))
                            }
                        </Accordion>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Faq


function CustomerCard({
    company,
    quote,
    name,
    title,
    avatar,
}: {
    company: string;
    logo: string;
    quote: string;
    name: string;
    title: string;
    avatar: string;
}) {
    return (
        <div className="rounded-xl border border-neutral-200 bg-white p-8">
            <div className="mb-6 text-lg font-bold tracking-tight text-neutral-900">{company}</div>
            <blockquote
                className="text-sm leading-relaxed text-neutral-600"
                dangerouslySetInnerHTML={{ __html: `&ldquo;${quote}&rdquo;` }}
            />
            <div className="mt-4 flex items-center gap-3">
                <img
                    alt={name}
                    src={avatar}
                    width={40}
                    height={40}
                    className="size-10 rounded-full border border-neutral-200"
                    loading="lazy"
                />
                <div>
                    <p className="text-sm font-medium text-neutral-900">{name}</p>
                    <p className="text-xs text-neutral-500">{title}</p>
                </div>
            </div>
        </div>
    );
}
