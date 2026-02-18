import { NextResponse, type NextRequest } from "next/server";

export default async function proxy(request: NextRequest) {
    // Lightweight cookie check — no DB/network call.
    // Full session validation happens client-side via useSession() in the layout.
    const hasSession = request.cookies.has("better-auth.session_token");

    if (!hasSession) {
        return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/itineraries/:path*"],
};
