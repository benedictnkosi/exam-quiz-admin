'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import AdminRoute from '@/components/auth/AdminRoute'

interface PendingItem {
    id: number
    title: string
    video_url: string
    caption_url?: string
    created_at?: string
    uploaded?: boolean
}

export default function YoutubeUploadsPage() {
    const [pending, setPending] = useState<PendingItem[]>([])
    const [loading, setLoading] = useState(false)
    const [authNeeded, setAuthNeeded] = useState(false)
    const [uploadingId, setUploadingId] = useState<number | null>(null)

    const fetchPending = async () => {
        setLoading(true)
        try {
            const base = process.env.NEXT_PUBLIC_ADMIN_API_BASE || 'https://examquiz.dedicated.co.za'

            const res = await fetch(`${base}/api/heygen/pending`, { cache: 'no-store' })
            const data = await res.json()
            setPending(Array.isArray(data) ? data : [])
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPending()
        // Check if user is already authenticated
        checkAuthStatus()
    }, [])

    const checkAuthStatus = async () => {
        try {
            // Try a simple upload request to check auth status
            const res = await fetch('/api/youtube/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: 'test', description: '', videoUrl: 'test' }),
            })
            if (res.status === 401) {
                setAuthNeeded(true)
            }
        } catch (e) {
            // Ignore errors for auth check
        }
    }

    const startAuth = async () => {
        const res = await fetch('/api/youtube/auth-url')
        const data = await res.json()
        if (data.url) {
            window.location.href = data.url
        }
    }

    const disconnect = async () => {
        try {
            await fetch('/api/youtube/disconnect', { method: 'POST' })
            setAuthNeeded(true)
        } catch (e) {
            console.error(e)
        }
    }

    const formatDate = (iso?: string) => {
        const d = iso ? new Date(iso) : new Date()
        return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' })
    }

    const uploadItem = async (item: PendingItem) => {
        try {
            setUploadingId(item.id)
            const dateStr = formatDate(item.created_at)
            
            // Check if title contains "madlanga" for specialized Madlanga Commission content
            const isMadlanga = item.title.toLowerCase().includes('madlanga')
            const isAdhoc = item.title.toLowerCase().includes('parliamentary')
            
            let title, description, tags
            
            if (isMadlanga) {
                title = `The Madlanga Commission ${dateStr}`
                description = `Step into the courtroom soap opera that never ends — The Madlanga Commission. 🎬\n\nDan breaks down the latest testimony, name-dropping, and jaw-dropping revelations from South Africa's most dramatic inquiry. From missing bullets to mystery phone calls and power plays behind the scenes, it's the story that makes Generations look like a documentary.\n\nThis is South Africa Why So Serious News — where the scandals are serious, but the anchor isn't.\nCatch new episodes daily for your 60-second fix of Mzansi madness.\n\n📺 Smart. Funny. Fast. Mzansi.\n#WhySoSerious`
                tags = [
                    'MadlangaCommission','SouthAfrica','WhySoSerious','MzansiNews','CommissionOfInquiry',
                    'PoliticalSatire','DailyNews','DanReports','Corruption','SouthAfricanPolitics','MzansiDrama',
                    'Justice','CourtroomDrama','BreakingNews','SouthAfricanNews','NewsSatire','ComedyNews',
                    'Bheki','KatMatlala','WitnessB','WitnessC','SAHeadlines','TrendingSA','PrimeNews',
                    'EWN','SABCNews','Mzansi'
                ]
            } else if (isAdhoc) {
                title = `Parliamentary Ad-Hoc Committee ${dateStr}`
                description = `Parliament's Ad Hoc Committee is back — and so is the drama. 🎭\n\nDan unpacks the wild twists behind former KZN Police Commissioner Mkhwanazi's allegations — from whispered corruption and political interference to confused ministers trying to remember what they disbanded.\n\nIt's Parliament's favourite reality show: the Ad Hoc Committee — where everyone swears they're innocent, and no one remembers who's in charge.\n\nThis is South Africa Why So Serious News — 60 seconds of sharp satire, Mzansi-style.\n\n📺 Smart. Funny. Fast. Mzansi.\n#WhySoSerious`
                tags = [
                    'AdHocCommittee','Mkhwanazi','SouthAfrica','WhySoSerious','MzansiNews','PoliticalSatire',
                    'CommissionOfInquiry','Corruption','PolicePolitics','Bheki','Parliament','DailyNews',
                    'SAHeadlines','MzansiDrama','SouthAfricanPolitics','BreakingNews','NewsSatire',
                    'DanReports','Justice','Inquiry','SAPS','StateCapture','Mzansi','PrimeNews','SABCNews',
                    'EWN','TrendingSA'
                ]
            } else {
                title = `Mzansi Daily News ${dateStr}`
                description = `Welcome to South Africa Why So Serious News — your daily 60-second dose of Mzansi's madness! 🇿🇦\n\nHosted by Dan, this satirical news update delivers the day's biggest headlines with wit, speed, and straight-face humour.\nFrom commissions and corruption to power cuts and pop culture — it's the real news, just less depressing.\n\nWe laugh before we cry, one headline at a time.\n\n📺 New episodes daily\n🎙️ Smart. Funny. Fast. Mzansi.`
                tags = [
                    'SouthAfrica','WhySoSerious','MzansiNews','DailyNews','Satire','SouthAfricanNews',
                    'BreakingNews','ComedyNews','SAComedy','DanReports','Mzansi','TrendingSA',
                    'CommissionOfInquiry','Corruption','Loadshedding','SAHeadlines','PoliticalSatire',
                    'SABCNews','EWN','PrimeNews','MzansiDrama','Shorts','TikTokNews','AfricanNews',
                    'NewsParody','LocalNews','GoodNightMzansi'
                ]
            }
            
            const res = await fetch('/api/youtube/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description, heygenId: item.id, tags, privacyStatus: 'public' }),
            })
            if (res.status === 401) {
                setAuthNeeded(true)
                // Automatically trigger OAuth flow
                await startAuth()
                return
            }
            const data = await res.json()
            if (data?.id) {
                await fetch(`/api/heygen/${item.id}/mark-uploaded`, { method: 'POST' })
                await fetchPending()
            }
        } catch (e) {
            console.error(e)
        } finally {
            setUploadingId(null)
        }
    }

    const hasItems = useMemo(() => pending.length > 0, [pending])

    return (
        <AdminRoute>
            <div className="flex">
                <Sidebar />
                <div className="flex-1 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-semibold">YouTube Uploads</h1>
                        <div className="space-x-2">
                            {authNeeded && (
                                <button onClick={startAuth} className="px-3 py-2 bg-red-600 text-white rounded">Connect YouTube</button>
                            )}
                            {!authNeeded && (
                                <>
                                    <button onClick={disconnect} className="px-3 py-2 bg-gray-200 rounded">Disconnect</button>
                                    <button onClick={startAuth} className="px-3 py-2 bg-gray-200 rounded">Reconnect</button>
                                </>
                            )}
                            <button onClick={fetchPending} className="px-3 py-2 bg-gray-200 rounded">Refresh</button>
                        </div>
                    </div>

                    {loading && <div>Loading…</div>}
                    
                    {authNeeded && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-yellow-800">
                                        YouTube Authentication Required
                                    </h3>
                                    <div className="mt-2 text-sm text-yellow-700">
                                        <p>You need to connect your YouTube account to upload videos. Click the button below to authenticate.</p>
                                    </div>
                                    <div className="mt-4">
                                        <button onClick={startAuth} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                                            Connect YouTube Account
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {!loading && !hasItems && !authNeeded && (
                        <div className="text-gray-600">No pending videos.</div>
                    )}

                    {!loading && hasItems && !authNeeded && (
                        <table className="min-w-full bg-white border">
                            <thead>
                                <tr className="bg-gray-100 text-left">
                                    <th className="p-2 border">ID</th>
                                    <th className="p-2 border">Title</th>
                                    <th className="p-2 border">Created</th>
                                    <th className="p-2 border">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pending.map(item => (
                                    <tr key={item.id} className="border-b">
                                        <td className="p-2 border">{item.id}</td>
                                        <td className="p-2 border">{item.title}</td>
                                        <td className="p-2 border">{item.created_at || ''}</td>
                                        <td className="p-2 border">
                                            <div className="flex items-center gap-2">
                                                <a href={item.video_url} target="_blank" rel="noreferrer" className="px-2 py-1 text-sm bg-gray-100 rounded">Open</a>
                                                <button
                                                    disabled={uploadingId === item.id}
                                                    onClick={() => uploadItem(item)}
                                                    className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50"
                                                >{uploadingId === item.id ? 'Uploading…' : 'Upload to YouTube'}</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </AdminRoute>
    )
}


