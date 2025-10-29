import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const base = process.env.NEXT_PUBLIC_ADMIN_API_BASE || 'http://127.0.0.1:8000'
        const res = await fetch(`${base}/api/heygen/pending`, { cache: 'no-store' })
        if (!res.ok) {
            return NextResponse.json({ error: 'Failed to fetch pending' }, { status: res.status })
        }
        const data = await res.json()
        return NextResponse.json(data)
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}


