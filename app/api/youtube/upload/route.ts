import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { Readable } from 'stream'
import { tmpdir } from 'os'
import { promises as fs } from 'fs'
import path from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import subsrt from 'subsrt'
import iconv from 'iconv-lite'
// Lazy-load ffmpeg to avoid bundling/platform issues; if unavailable we skip burning
async function getFfmpeg() {
    try {
        // Use eval to avoid webpack static analysis
        const req = eval('require') as NodeRequire
        const ffmpegMod = req('fluent-ffmpeg')
        let installerPath = ''
        try {
            const inst = req('@ffmpeg-installer/ffmpeg')
            installerPath = inst.path
        } catch {
            // No installer available; assume ffmpeg is on PATH
        }
        if (installerPath && ffmpegMod?.setFfmpegPath) {
            ffmpegMod.setFfmpegPath(installerPath)
        }
        return ffmpegMod
    } catch (e) {
        console.warn('[burn] ffmpeg not available, skipping hard-burn:', (e as any)?.message)
        return null
    }
}

const execFileAsync = promisify(execFile)

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
        const { title, description, videoUrl, captionUrl, burnSubtitles = true, privacyStatus = 'unlisted', tags } = body || {}
        if (!title || !videoUrl) {
            return NextResponse.json({ error: 'Missing title or videoUrl' }, { status: 400 })
        }

        console.log('Starting YouTube upload:', { title, videoUrl, tagsCount: tags?.length })

        const oAuth2Client = getOAuth2Client()
        oAuth2Client.setCredentials(tokens)

        const youtube = google.youtube({ version: 'v3', auth: oAuth2Client })

        // Fetch the remote video and optionally hard-burn subtitles into it
        console.log('Fetching video from URL:', videoUrl)
        const res = await fetch(videoUrl)
        if (!res.ok) {
            console.error('Failed to fetch video:', res.status, res.statusText)
            return NextResponse.json({ error: `Failed to fetch video (${res.status})` }, { status: 400 })
        }

        const arrayBuffer = await res.arrayBuffer()
        let videoBuffer = Buffer.from(arrayBuffer as ArrayBuffer)
        console.log('Video buffer size:', videoBuffer.length, 'bytes')

        // If we should burn subtitles and we have a prepared capBuffer, produce a new mp4 with burned subs
        let uploadBody: NodeJS.ReadableStream = Readable.from(videoBuffer)
        if (burnSubtitles && captionUrl) {
            try {
                // Ensure we have capBuffer from prior block; if not yet fetched/converted, do basic fetch here too
                // We will have capBuffer in scope only inside the captions block; re-fetch here if needed
            } catch {
                // no-op: optional prefetch failed
            }
        }

        // If we created a burned file, overwrite uploadBody
        if (burnSubtitles && captionUrl) {
            try {
                const ffmpeg = await getFfmpeg()
                if (!ffmpeg) throw new Error('ffmpeg not available')
                const captionsDir = path.join(process.cwd(), 'captions')
                await fs.mkdir(captionsDir, { recursive: true })

                const tmpDir = tmpdir()
                const inVideo = path.join(tmpDir, `in-video-${Date.now()}.mp4`)
                const srtPath = path.join(tmpDir, `in-subs-${Date.now()}.srt`)
                const outVideo = path.join(tmpDir, `out-video-${Date.now()}.mp4`)

                // We need an SRT file on disk. If we already converted and persisted one, prefer that. Otherwise, try to generate quickly from captionUrl here.
                let haveSrt = false
                // Try to find the last persisted srt for this session/video in captions dir
                // If not found, we will attempt to generate a minimal SRT by fetching captionUrl and using subsrt quickly
                try {
                    // quick generation path
                    const capRes = await fetch(captionUrl)
                    if (capRes.ok) {
                        const capBuf2 = Buffer.from(await capRes.arrayBuffer() as ArrayBuffer)
                        let assText: string
                        if (capBuf2.length >= 2 && capBuf2[0] === 0xFF && capBuf2[1] === 0xFE) assText = iconv.decode(capBuf2, 'utf16-le')
                        else if (capBuf2.length >= 2 && capBuf2[0] === 0xFE && capBuf2[1] === 0xFF) assText = iconv.decode(capBuf2, 'utf16-be')
                        else assText = iconv.decode(capBuf2, 'utf8')

                        let srtText = ''
                        try { srtText = subsrt.convert(assText, { to: 'srt', from: 'ass' }) } catch {
                            // subsrt failed, will fallback
                        }
                        if (!srtText || srtText.trim().length === 0) {
                            srtText = convertAssToSrtFallback(assText)
                        }
                        if (srtText && srtText.trim().length > 0) {
                            await fs.writeFile(srtPath, srtText, 'utf8')
                            haveSrt = true
                        }
                    }
                } catch {
                    // ignore caption fetch/convert errors here; we'll skip burn
                }

                if (haveSrt) {
                    await fs.writeFile(inVideo, videoBuffer)
                    console.log('[burn] Running ffmpeg to burn subtitles:', inVideo, '+', srtPath)
                    const escapedSrt = srtPath.replace(/'/g, "\\'")
                    const vfFilter = `subtitles='${escapedSrt}':charenc=UTF-8:force_style='Alignment=5,MarginV=40,MarginL=40,MarginR=40,Outline=1,FontSize=16,LineSpacing=2,WrapStyle=0'`
                    await new Promise<void>((resolve, reject) => {
                        ffmpeg(inVideo)
                            .outputOptions(['-vf', vfFilter, '-c:a', 'copy'])
                            .on('error', (err: any) => reject(err))
                            .on('end', () => resolve())
                            .save(outVideo)
                    })
                    const burned = await fs.readFile(outVideo)
                    console.log('[burn] Burned video size:', burned.length)
                    uploadBody = Readable.from(burned)
                } else {
                    console.warn('[burn] No valid SRT available; uploading original video without hard-burned subs')
                }
            } catch (burnErr: any) {
                console.warn('[burn] Failed to burn subtitles:', burnErr?.message)
            }
        }

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

        // Optionally upload captions if provided and in a supported format
        // Only upload separate captions if we are NOT hard-burning them
        if (!burnSubtitles && videoId && captionUrl) {
            try {
                console.log('Fetching caption from URL:', captionUrl)
                const capRes = await fetch(captionUrl)
                if (!capRes.ok) {
                    console.warn('Failed to fetch captions:', capRes.status, capRes.statusText)
                } else {
                    let capBuffer: Buffer = Buffer.from(await capRes.arrayBuffer() as ArrayBuffer)
                    console.log('[captions] Fetched caption bytes:', capBuffer.length)
                    // Persist original .ass for debugging
                    try {
                        const captionsDir = path.join(process.cwd(), 'captions')
                        await fs.mkdir(captionsDir, { recursive: true })
                        const originalPath = path.join(captionsDir, `${videoId}-${Date.now()}.original`) // keep original extension unknown
                        await fs.writeFile(originalPath, capBuffer)
                        console.log('[captions] Persisted original caption to:', originalPath)
                    } catch (persistErr: any) {
                        console.warn('[captions] Failed to persist original caption copy:', persistErr?.message)
                    }
                    let lower = captionUrl.toLowerCase()
                    let mimeType: string | undefined

                    // If .ass provided, try converting to .srt using a pure JS library first (subsrt)
                    if (lower.endsWith('.ass')) {
                        try {
                            console.log('[captions] Converting .ass to .srt using subsrt')
                            // Detect BOM for UTF-16LE/BE and decode properly; fallback to utf8
                            let assText: string
                            if (capBuffer.length >= 2 && capBuffer[0] === 0xFF && capBuffer[1] === 0xFE) {
                                assText = iconv.decode(capBuffer, 'utf16-le')
                                console.log('[captions] Decoded ASS as utf16-le')
                            } else if (capBuffer.length >= 2 && capBuffer[0] === 0xFE && capBuffer[1] === 0xFF) {
                                assText = iconv.decode(capBuffer, 'utf16-be')
                                console.log('[captions] Decoded ASS as utf16-be')
                            } else {
                                assText = iconv.decode(capBuffer, 'utf8')
                                console.log('[captions] Decoded ASS as utf8')
                            }
                            let srtText = ''
                            try {
                                srtText = subsrt.convert(assText, { to: 'srt', from: 'ass' })
                            } catch (e: any) {
                                console.warn('[captions] subsrt threw error:', e?.message)
                            }
                            if (!srtText || srtText.trim().length === 0) {
                                console.warn('[captions] subsrt produced empty SRT output, using fallback converter')
                                srtText = convertAssToSrtFallback(assText)
                            }
                            capBuffer = Buffer.from(srtText, 'utf8')
                            mimeType = 'application/x-subrip'
                            // Persist a copy to captions directory for debugging/auditing
                            try {
                                const captionsDir = path.join(process.cwd(), 'captions')
                                await fs.mkdir(captionsDir, { recursive: true })
                                const persisted = path.join(captionsDir, `${videoId}-${Date.now()}.srt`)
                                await fs.writeFile(persisted, capBuffer)
                                console.log('[captions] Persisted converted SRT to:', persisted)
                            } catch (persistErr: any) {
                                console.warn('[captions] Failed to persist SRT copy:', persistErr?.message)
                            }
                            console.log('[captions] Converted .ass to .srt via subsrt')
                        } catch (convErr: any) {
                            console.warn('[captions] subsrt conversion failed, attempting ffmpeg fallback:', convErr?.message)
                            // Fallback: try ffmpeg if available
                            try {
                                const inFile = path.join(tmpdir(), `in-${Date.now()}.ass`)
                                const outFile = path.join(tmpdir(), `out-${Date.now()}.srt`)
                                console.log('[captions] Writing ASS to temp for ffmpeg:', inFile, 'bytes=', capBuffer.length)
                                await fs.writeFile(inFile, capBuffer)
                                console.log('[captions] Running ffmpeg:', 'ffmpeg -y -i', inFile, outFile)
                                const { stdout, stderr } = await execFileAsync('ffmpeg', ['-y', '-i', inFile, outFile])
                                console.log('[captions] ffmpeg stdout:', stdout)
                                console.log('[captions] ffmpeg stderr:', stderr)
                                const converted = await fs.readFile(outFile)
                                console.log('[captions] Converted SRT size (ffmpeg):', converted.length)
                                capBuffer = converted
                                mimeType = 'application/x-subrip'
                                // Persist
                                try {
                                    const captionsDir = path.join(process.cwd(), 'captions')
                                    await fs.mkdir(captionsDir, { recursive: true })
                                    const persisted = path.join(captionsDir, `${videoId}-${Date.now()}.srt`)
                                    await fs.writeFile(persisted, capBuffer)
                                    console.log('[captions] Persisted converted SRT to:', persisted)
                                } catch (persistErr: any) {
                                    console.warn('[captions] Failed to persist SRT copy:', persistErr?.message)
                                }
                                fs.unlink(inFile).catch(() => {})
                                console.log('Converted .ass to .srt via ffmpeg')
                            } catch (ffErr: any) {
                                console.warn('ffmpeg conversion failed, skipping captions:', ffErr?.message)
                                if (ffErr?.code === 'ENOENT') {
                                    console.error('[captions] ffmpeg not found on PATH. Please install ffmpeg.')
                                }
                                mimeType = undefined
                            }
                        }
                    } else {
                        if (lower.endsWith('.srt')) mimeType = 'application/x-subrip'
                        else if (lower.endsWith('.vtt')) mimeType = 'text/vtt'
                        else if (lower.endsWith('.sbv')) mimeType = 'text/x-subviewer'
                        else if (lower.endsWith('.ttml') || lower.endsWith('.dfxp')) mimeType = 'application/ttml+xml'
                    }

                    if (mimeType) {
                        console.log('Uploading captions to YouTube...')
                        await youtube.captions.insert({
                            part: ['snippet'],
                            requestBody: {
                                snippet: {
                                    videoId,
                                    language: 'en',
                                    name: 'English',
                                    isDraft: false,
                                },
                            },
                            media: {
                                mimeType,
                                body: Readable.from(capBuffer),
                            },
                        } as any)
                        console.log('Captions upload successful')
                    } else {
                        console.warn('Caption format not supported or conversion failed, skipping upload')
                    }
                }
            } catch (capErr: any) {
                console.warn('Captions upload failed:', capErr?.message)
            }
        }

        return NextResponse.json({ id: videoId })
    } catch (e: any) {
        console.error('YouTube upload error:', e.message, e.stack)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

function convertAssToSrtFallback(assText: string): string {
    // Very small fallback converter: parses Dialogue lines and builds SRT
    // Expected Dialogue: 0,0:0:0.00,0:0:0.76,Style,...,Text
    const lines = assText.split(/\r?\n/)
    const srtParts: string[] = []
    let index = 1
    for (const line of lines) {
        if (!line.startsWith('Dialogue:')) continue
        // Split first 10 fields to reach Text (ASS can contain commas in text, so limit splits)
        const parts = line.split(/,(.+)/)[1]?.split(',')
        if (!parts || parts.length < 9) continue
        // After 'Dialogue: <layer>', the next two fields are Start and End
        // Safely extract by re-splitting with a limit
        const afterPrefix = line.replace(/^Dialogue:\s*/, '')
        const fields = [] as string[]
        let current = ''
        let commas = 0
        for (let i = 0; i < afterPrefix.length; i++) {
            const ch = afterPrefix[i]
            if (ch === ',' && commas < 9) { // up to Text field start
                fields.push(current)
                current = ''
                commas++
            } else {
                current += ch
            }
        }
        fields.push(current)
        if (fields.length < 10) continue
        const layer = fields[0]
        const startRaw = fields[1]
        const endRaw = fields[2]
        const textRaw = fields.slice(9).join(',') // rest is Text
        const start = normalizeAssTime(startRaw)
        const end = normalizeAssTime(endRaw)
        const text = cleanAssText(textRaw)
        if (!start || !end || !text.trim()) continue
        srtParts.push(String(index++))
        srtParts.push(`${start} --> ${end}`)
        srtParts.push(text)
        srtParts.push('')
    }
    return srtParts.join('\n')
}

function normalizeAssTime(t: string): string | null {
    // ASS time like H:MM:SS.CS or 0:0:0.00 → produce HH:MM:SS,mmm
    const m = t.match(/^(\d+):(\d+):(\d+)[.:](\d{1,2})$/)
    if (!m) return null
    const hh = String(parseInt(m[1], 10)).padStart(2, '0')
    const mm = String(parseInt(m[2], 10)).padStart(2, '0')
    const ss = String(parseInt(m[3], 10)).padStart(2, '0')
    const cs = m[4].padEnd(2, '0').slice(0, 2) // centiseconds
    const ms = String(parseInt(cs, 10) * 10).padStart(3, '0')
    return `${hh}:${mm}:${ss},${ms}`
}

function cleanAssText(text: string): string {
    // Remove ASS override tags {\...} and replace \N with newline
    let out = text.replace(/\{[^}]*\}/g, '')
    out = out.replace(/\\N/gi, '\n')
    // Collapse multiple spaces, trim
    out = out.replace(/\s+$/g, '')
    return out
}


