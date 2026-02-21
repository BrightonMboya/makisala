import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

import { Toaster } from '@repo/ui/toaster'
import Footer from '../components/home/footer'
import Nav from '../components/home/nav'
import { Providers } from './providers'
import { OrganizationSchema, WebsiteSchema } from '@/components/schema'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
})

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
})

export const metadata: Metadata = {
    title: 'Safaris in Africa: Book with experts | Makisala Safaris ',
    description:
        'Explore Africa with Makisala - go on a walking safari - canoe safari - 4x4 safari ► Book an unforgettable Africa trip now! ',
    openGraph: {
        title: 'Safaris in Africa: Book with experts | Makisala Safaris ',
        description:
            'Explore Africa with Makisala - go on a walking safari - canoe safari - 4x4 safari ► Book an unforgettable Africa trip now! ',
        images: [
            {
                url: 'https://res.cloudinary.com/dr2tdyz2w/image/upload/v1753373584/family-safari.jpg_vu3zur.jpg',
            },
        ],
    },
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en">
            <Nav />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([OrganizationSchema(), WebsiteSchema()]) }} />
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
            <Script id="chatwoot" strategy="afterInteractive">
                {`
                window.chatwootSettings = {"position":"right","type":"expanded_bubble","launcherTitle":"Talk to our experts"};
              (function(d,t) {
                var BASE_URL="https://app.chatwoot.com";
                var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
                g.src=BASE_URL+"/packs/js/sdk.js";
                g.async = true;
                s.parentNode.insertBefore(g,s);
                g.onload=function(){
                  window.chatwootSDK.run({
                    websiteToken: 'bLp95TQA3BkPqjGt1anRTQo1',
                    baseUrl: BASE_URL
                  })
                }
              })(document,"script");
                `}
            </Script>
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <Analytics />
                <SpeedInsights />
                <Providers>
                    <main>{children}</main>
                </Providers>
                <Toaster />
            </body>
            <Footer />
        </html>
    )
}
