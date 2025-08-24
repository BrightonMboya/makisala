"use client";

import React from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {useToast} from "@/lib/hooks/use-toast";
import {createInquiry} from "@/lib/cms-service";
import ContactForm from "@/components/contact-form";


interface InquiryDialogProps {
    children: React.ReactNode;
}

export function InquiryDialog({children}: InquiryDialogProps) {
    const [open, setOpen] = React.useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent
                className="sm:max-w-[600px] max-h-[90dvh] overflow-y-scroll">
                <DialogHeader>
                    <DialogTitle>Safari Inquiry</DialogTitle>
                    <DialogDescription>
                        * indicates required fields.
                    </DialogDescription>
                </DialogHeader>
                <ContactForm setOpen={setOpen}/>
            </DialogContent>
        </Dialog>
    );
}