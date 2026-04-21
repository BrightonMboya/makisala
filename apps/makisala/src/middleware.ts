import { NextResponse, type NextRequest } from 'next/server'

// import { getSessionCookie } from 'better-auth/cookies'

const MARKDOWN_ROUTES: Array<(pathname: string) => string | null> = [
    pathname => (pathname === '/tours' || pathname === '/tours/' ? '/tours.md' : null),
    pathname => {
        const match = pathname.match(/^\/tours\/([^/]+)\/?$/)
        return match ? `/tours/${match[1]}.md` : null
    },
    pathname =>
        pathname === '/accommodations' || pathname === '/accommodations/'
            ? '/accommodations.md'
            : null,
    pathname => {
        const match = pathname.match(/^\/accommodations\/([^/]+)\/?$/)
        return match ? `/accommodations/${match[1]}.md` : null
    },
]

function prefersMarkdown(accept: string | null): boolean {
    if (!accept) return false
    const parts = accept.split(',').map(p => p.trim().toLowerCase())
    let markdownQ = 0
    let htmlQ = 0
    for (const part of parts) {
        const [type, ...params] = part.split(';').map(s => s.trim())
        const q = Number(params.find(p => p.startsWith('q='))?.slice(2) ?? '1')
        if (type === 'text/markdown') markdownQ = Math.max(markdownQ, q)
        else if (type === 'text/html' || type === 'application/xhtml+xml')
            htmlQ = Math.max(htmlQ, q)
    }
    return markdownQ > 0 && markdownQ >= htmlQ
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    if (prefersMarkdown(request.headers.get('accept'))) {
        for (const resolver of MARKDOWN_ROUTES) {
            const target = resolver(pathname)
            if (target) {
                const url = request.nextUrl.clone()
                url.pathname = target
                const response = NextResponse.rewrite(url)
                response.headers.set('Vary', 'Accept')
                return response
            }
        }
    }

    const response = NextResponse.next()

    const tourMatch = pathname.match(/^\/tours\/([^/]+)\/?$/)
    if (tourMatch) {
        response.headers.set(
            'Link',
            `</tours/${tourMatch[1]}.md>; rel="alternate"; type="text/markdown"`
        )
        response.headers.set('Vary', 'Accept')
    }

    const accommodationMatch = pathname.match(/^\/accommodations\/([^/]+)\/?$/)
    if (accommodationMatch) {
        response.headers.set(
            'Link',
            `</accommodations/${accommodationMatch[1]}.md>; rel="alternate"; type="text/markdown"`
        )
        response.headers.set('Vary', 'Accept')
    }

    // const sessionCookie = getSessionCookie(request)
    //
    // if (sessionCookie && ['/sign-up', '/login'].includes(pathname)) {
    //     return NextResponse.redirect(new URL('/cms', request.url))
    // }
    //
    // if (!sessionCookie && pathname.startsWith('/cms')) {
    //     return NextResponse.redirect(new URL('/login', request.url))
    // }

    return response
}

export const config = {
    matcher: ['/cms', '/tours', '/tours/:slug*', '/accommodations', '/accommodations/:slug*'],
}
