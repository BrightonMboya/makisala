import { env } from '@/lib/env'

export const dynamic = 'force-static'

export function GET() {
    const body = [
        'User-agent: *',
        'Content-Signal: search=yes, ai-train=no, ai-input=yes',
        'Allow: /',
        'Disallow: /proposal/',
        'Disallow: /invite/',
        'Disallow: /onboarding/',
        'Disallow: /itineraries/',
        'Disallow: /accomodations/',
        '',
        `Sitemap: ${env.NEXT_PUBLIC_APP_URL}/sitemap.xml`,
        '',
    ].join('\n')

    return new Response(body, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
        },
    })
}
