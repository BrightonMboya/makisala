"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import ContactForm from "@/components/contact-form";
import {usePostHog} from 'posthog-js/react'


interface InquiryDialogProps {
    children: React.ReactNode;
}

export function InquiryDialog({children}: InquiryDialogProps) {
    const [open, setOpen] = React.useState(false);
    const posthog = usePostHog()

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild onClick={() => {
                posthog.capture('Inquiry Dialog Triggered')
            }}>
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