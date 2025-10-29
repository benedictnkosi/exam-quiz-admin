import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

function getOAuth2Client() {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const publicBase = process.env.GOOGLE_REDIRECT_URI_BASE
        || process.env.NEXT_PUBLIC_HOST_URL
        || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)
    const redirectUri = process.env.GOOGLE_REDIRECT_URI
        || (publicBase ? `${publicBase}/api/youtube/callback` : 'http://localhost:3000/api/youtube/callback')
    if (!clientId || !clientSecret) {
        throw new Error('Missing Google OAuth env vars')
    }
    return new google.auth.OAuth2(clientId, clientSecret, redirectUri)
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const code = searchParams.get('code')
        if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })

        const oAuth2Client = getOAuth2Client()
        const { tokens } = await oAuth2Client.getToken(code)

        // Store tokens in a secure cookie
        const response = NextResponse.redirect(new URL('/admin/youtube-uploads', request.url))
        response.cookies.set('yt_tokens', JSON.stringify(tokens), {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 30,
        })
        return response
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}


