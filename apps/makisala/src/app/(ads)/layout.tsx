import { GoogleTagManager } from '@next/third-parties/google'

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <GoogleTagManager gtmId="AW-17982843958" />
            <body>{children}</body>
        </html>
    )
}
