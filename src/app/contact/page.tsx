import C2A from "@/components/home/call-to-action";
import ContactForm from "@/components/contact-form";
import {BreadcrumbSchema} from "@/components/schema";
import Script from "next/script";
import {Metadata} from "next";

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: `Contact Makisala Safaris`,
        description: "Contact Makisala Safaris - info@makisala.com",
        openGraph: {
            title: ` Contact Makisala Safaris | Makisala Safaris`,
            description: `Contact Makisala Safaris - info@makisala.com`,
            images: [
                {
                    url: "https://res.cloudinary.com/dr2tdyz2w/image/upload/v1753373584/family-safari.jpg_vu3zur.jpg",
                    width: 1200,
                    height: 630,
                    alt: "Makisala Safaris",
                },
            ],
        },
    };
}

export default function Page() {
    return (
        <>
            <Script type={'application/ld+json'} strategy={'lazyOnload'}>
                {JSON.stringify([
                    BreadcrumbSchema({
                        breadcrumbs: [
                            {name: "Home", url: "https://www.makisala.com"},
                            {name: "Contact Us", url: "https://www.makisala.com/contact"},
                        ]
                    })
                ])}
            </Script>
            <section className="w-[350px] lg:w-[600px] mt-[100px] mx-auto mb-10">
                <h2 className="text-center text-3xl mb-5">Get in touch:</h2>
                <ContactForm/>
            </section>
            <C2A/>
        </>
    )
}