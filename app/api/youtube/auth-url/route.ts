import { NextResponse } from 'next/server'
import { google } from 'googleapis'

const SCOPES = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.force-ssl',
    'https://www.googleapis.com/auth/youtube',
]

function getOAuth2Client() {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/youtube/callback'
    if (!clientId || !clientSecret) {
        throw new Error('Missing Google OAuth env vars')
    }
    return new google.auth.OAuth2(clientId, clientSecret, redirectUri)
}

export async function GET() {
    try {
        const oAuth2Client = getOAuth2Client()
        const url = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
            prompt: 'consent',
        })
        return NextResponse.json({ url })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}


