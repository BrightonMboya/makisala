import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import "./globals.css";

import {Toaster} from "@/components/ui/toaster";
import Footer from "@/components/home/footer";
import Nav from "@/components/home/nav";
import {Providers} from "./providers";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Safaris in Africa: Book with experts | Makisala Safaris ",
    description: "Explore Africa with Makisala - go on a walking safari - canoe safari - 4x4 safari ► Book an unforgettable Africa trip now! ",
    openGraph: {
        title: "Safaris in Africa: Book with experts | Makisala Safaris ",
        description: "Explore Africa with Makisala - go on a walking safari - canoe safari - 4x4 safari ► Book an unforgettable Africa trip now! ",
        images: [{url: "https://res.cloudinary.com/dr2tdyz2w/image/upload/v1753373584/family-safari.jpg_vu3zur.jpg",}]
    }
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <Nav/>
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
            <main>{children}</main>
        </Providers>
        <Toaster/>
        </body>
        <Footer/>
        </html>
    );
}
