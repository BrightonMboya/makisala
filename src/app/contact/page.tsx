import C2A from "@/components/home/call-to-action";
import ContactForm from "@/components/contact-form";

export default function Page() {
    return (
        <>
            <section className="w-[350px] lg:w-[600px] mt-[100px] mx-auto mb-10">
                <h2 className="text-center text-3xl mb-5">Get in touch:</h2>
                <ContactForm/>
            </section>
            <C2A/>
        </>
    )
}