import { NextRequest, NextResponse } from 'next/server'

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const base = process.env.NEXT_PUBLIC_ADMIN_API_BASE || 'http://127.0.0.1:8000'
        const res = await fetch(`${base}/api/heygen/${params.id}/mark-uploaded`, { method: 'POST' })
        if (!res.ok) {
            return NextResponse.json({ error: 'Failed to mark uploaded' }, { status: res.status })
        }
        const data = await res.json().catch(() => ({}))
        return NextResponse.json(data)
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}


