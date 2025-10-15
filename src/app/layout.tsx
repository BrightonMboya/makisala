import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import "./globals.css";

import {Toaster} from "@/components/ui/toaster";
import Footer from "@/components/home/footer";
import Nav from "@/components/home/nav";
import {Providers} from "./providers";
import {OrganizationSchema, WebsiteSchema} from "@/components/schema"
import Script from "next/script";
import {Analytics} from "@vercel/analytics/next"
import {SpeedInsights} from "@vercel/speed-insights/next"

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
        <Script type={'application/ld+json'} strategy={'lazyOnload'}>
            {
                JSON.stringify([
                    OrganizationSchema(),
                    WebsiteSchema(),
                ])
            }
        </Script>
        <Script id="apollo-tracker" strategy="afterInteractive">
            {`
            function initApollo() {
              var n = Math.random().toString(36).substring(7),
                  o = document.createElement("script");
              o.src = "https://assets.apollo.io/micro/website-tracker/tracker.iife.js?nocache=" + n;
              o.async = true;
              o.defer = true;
              o.onload = function() {
                window.trackingFunctions.onLoad({ appId: "68efe68f053d06001553e5e7" });
              };
              document.head.appendChild(o);
            }
            initApollo();
          `}
        </Script>
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Analytics/>
        <SpeedInsights/>
        <Providers>
            <main>{children}</main>
        </Providers>
        <Toaster/>
        </body>
        <Footer/>
        </html>
    );
}
