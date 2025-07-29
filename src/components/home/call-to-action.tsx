import {InquiryDialog} from "@/components/enquire-dialog-button";
import {Button} from "@/components/ui/button";
import {Users} from "lucide-react";

export default function C2A() {
    return (
        <section className="py-16 bg-gradient-to-r from-primary/10 to-secondary/10 ">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Start Your Journey?</h2>
                <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                    Let us help you create memories that will last a lifetime. Explore our destinations and find
                    your next adventure.
                </p>
                <InquiryDialog>
                    <Button size="lg" className="bg-primary hover:bg-primary/90">
                        <Users className="h-5 w-5 mr-2"/>
                        Speak with Our Experts
                    </Button>
                </InquiryDialog>

            </div>
        </section>
    )
}