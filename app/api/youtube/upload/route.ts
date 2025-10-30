import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { Readable } from 'stream'

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

async function getAuthFromCookie(request: NextRequest) {
    const tokenCookie = request.cookies.get('yt_tokens')?.value
    if (!tokenCookie) return null
    try {
        return JSON.parse(tokenCookie)
    } catch {
        return null
    }
}

export async function POST(request: NextRequest) {
    try {
        const tokens = await getAuthFromCookie(request)
        if (!tokens) {
            return NextResponse.json({ needsAuth: true }, { status: 401 })
        }

        const body = await request.json()
        const { title, description, heygenId, privacyStatus = 'unlisted', tags } = body || {}
        if (!title || !heygenId) {
            return NextResponse.json({ error: 'Missing title or heygenId' }, { status: 400 })
        }

        console.log('Starting YouTube upload (HeyGen):', { title, heygenId, tagsCount: tags?.length })

        const oAuth2Client = getOAuth2Client()
        oAuth2Client.setCredentials(tokens)

        const youtube = google.youtube({ version: 'v3', auth: oAuth2Client })

        // Fetch finalized video (with captions burned-in) from HeyGen proxy API
        const base = process.env.NEXT_PUBLIC_ADMIN_API_BASE || 'https://examquiz.dedicated.co.za'
        const videoEndpoint = `${base}/api/heygen/${heygenId}/video`
        console.log('Fetching HeyGen video:', videoEndpoint)
        const res = await fetch(videoEndpoint, { cache: 'no-store' })
        if (!res.ok) {
            console.error('Failed to fetch HeyGen video:', res.status, res.statusText)
            return NextResponse.json({ error: `Failed to fetch HeyGen video (${res.status})` }, { status: 400 })
        }

        const arrayBuffer = await res.arrayBuffer()
        let videoBuffer = Buffer.from(arrayBuffer as ArrayBuffer)
        console.log('Video buffer size:', videoBuffer.length, 'bytes')

        // Directly upload the fetched video as-is (captions are already burned-in upstream)
        const uploadBody: NodeJS.ReadableStream = Readable.from(videoBuffer)

        console.log('Uploading to YouTube...')
        const insertResponse = await youtube.videos.insert({
            part: ['snippet', 'status'],
            requestBody: {
                snippet: { title, description, tags },
                status: { 
                    privacyStatus: 'public',
                    selfDeclaredMadeForKids: false 
                },
            },
            media: {
                body: uploadBody,
            },
        })

        const videoId = insertResponse.data.id
        console.log('Upload successful:', videoId)

        return NextResponse.json({ id: videoId })
    } catch (e: any) {
        console.error('YouTube upload error:', e.message, e.stack)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}


