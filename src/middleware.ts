import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

export async function middleware(request: NextRequest) {
    const sessionCookie = getSessionCookie(request)
    const { pathname } = request.nextUrl

    if (sessionCookie && ['/sign-up', '/login'].includes(pathname)) {
        return NextResponse.redirect(new URL('/cms', request.url))
    }

    if (!sessionCookie && pathname.startsWith('/cms')) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/cms'],
}
