import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

function getOAuth2Client() {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/youtube/callback'
    if (!clientId || !clientSecret) {
        throw new Error('Missing Google OAuth env vars')
    }
    return new google.auth.OAuth2(clientId, clientSecret, redirectUri)
}

export async function POST(request: NextRequest) {
    try {
        const tokenCookie = request.cookies.get('yt_tokens')?.value
        let accessToken: string | undefined
        if (tokenCookie) {
            try {
                const parsed = JSON.parse(tokenCookie)
                accessToken = parsed?.access_token
            } catch {}
        }

        if (accessToken) {
            try {
                const oAuth2Client = getOAuth2Client()
                oAuth2Client.setCredentials({ access_token: accessToken })
                await oAuth2Client.revokeToken(accessToken)
            } catch (e) {
                // best-effort revoke; ignore failures
            }
        }

        const res = NextResponse.json({ disconnected: true })
        res.cookies.set('yt_tokens', '', { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0 })
        return res
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}


