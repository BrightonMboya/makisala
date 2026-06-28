'use server'

import { createHash } from 'node:crypto'
import { cookies, headers } from 'next/headers'
import { Logger } from 'next-axiom'
import { META_PIXEL_ID } from './constants'

// Server-side Meta Conversions API (CAPI). Mirrors the client-side
// fbq('track', 'Lead') call so Meta receives the conversion even when the
// browser pixel is blocked (ad blockers, Safari ITP, cookie loss). Both events
// carry the SAME eventId so Meta deduplicates them into one Lead — see
// landing-inquiry-form.tsx where the pixel call passes the matching eventID.
//
// Requires META_CAPI_ACCESS_TOKEN (Events Manager -> Settings -> Conversions
// API -> Generate access token). If the token is absent this no-ops, so the
// form keeps working before the secret is set.

const GRAPH_VERSION = 'v21.0'

// Normalize + SHA-256 hash per Meta's matching spec (lowercase, trimmed).
function hashField(value?: string | null): string | undefined {
    if (!value) return undefined
    const normalized = value.trim().toLowerCase()
    if (!normalized) return undefined
    return createHash('sha256').update(normalized).digest('hex')
}

// Phone wants digits only (country code included, no '+' or spaces).
function hashPhone(value?: string | null): string | undefined {
    if (!value) return undefined
    const digits = value.replace(/[^0-9]/g, '')
    if (!digits) return undefined
    return createHash('sha256').update(digits).digest('hex')
}

export interface SendMetaLeadParams {
    /** Shared dedup id, also passed to fbq('track','Lead',{},{eventID}). */
    eventId: string
    email: string
    phone?: string
    /** Lead's first name, improves Meta's event match quality (hashed as fn). */
    firstName?: string
    /** Full URL of the landing page the lead submitted from. */
    eventSourceUrl: string
}

export async function sendMetaLead(params: SendMetaLeadParams): Promise<void> {
    const accessToken = process.env.META_CAPI_ACCESS_TOKEN
    if (!accessToken) return // No token configured yet -> silently skip.

    try {
        const hdrs = await headers()
        const cookieStore = await cookies()

        const userAgent = hdrs.get('user-agent') ?? undefined
        const forwardedFor = hdrs.get('x-forwarded-for')
        const clientIp =
            forwardedFor?.split(',')[0]?.trim() || hdrs.get('x-real-ip') || undefined

        const fbp = cookieStore.get('_fbp')?.value
        const fbc = cookieStore.get('_fbc')?.value

        const userData: Record<string, unknown> = {}
        const em = hashField(params.email)
        const ph = hashPhone(params.phone)
        const fn = hashField(params.firstName)
        if (em) userData.em = [em]
        if (ph) userData.ph = [ph]
        if (fn) userData.fn = [fn]
        if (fbp) userData.fbp = fbp
        if (fbc) userData.fbc = fbc
        if (clientIp) userData.client_ip_address = clientIp
        if (userAgent) userData.client_user_agent = userAgent

        const body: Record<string, unknown> = {
            data: [
                {
                    event_name: 'Lead',
                    event_time: Math.floor(Date.now() / 1000),
                    event_id: params.eventId,
                    action_source: 'website',
                    event_source_url: params.eventSourceUrl,
                    user_data: userData,
                },
            ],
        }
        // Set META_TEST_EVENT_CODE while validating in Events Manager -> Test events.
        if (process.env.META_TEST_EVENT_CODE) {
            body.test_event_code = process.env.META_TEST_EVENT_CODE
        }

        const res = await fetch(
            `https://graph.facebook.com/${GRAPH_VERSION}/${META_PIXEL_ID}/events?access_token=${accessToken}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            }
        )

        if (!res.ok) {
            const log = new Logger()
            log.error('Meta CAPI Lead event failed', {
                status: res.status,
                response: await res.text(),
                eventSourceUrl: params.eventSourceUrl,
            })
            await log.flush()
        }
    } catch (error) {
        // Never let CAPI failures break the lead flow.
        const log = new Logger()
        log.error('Meta CAPI Lead event threw', {
            error: error instanceof Error ? error.message : String(error),
            eventSourceUrl: params.eventSourceUrl,
        })
        await log.flush()
    }
}
