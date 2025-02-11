'use client'

import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../config/constants.js'
import StatsCard from './StatsCard'

interface ApiResponse {
    status: string
    count: number
}

export default function PendingApprovalsCard() {
    const [count, setCount] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/questions/new-count`)
                const data: ApiResponse = await response.json()
                if (data.status === 'OK') {
                    setCount(data.count)
                }
            } catch (err) {
                console.error('Failed to fetch pending count:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    return (
        <StatsCard
            title="Pending Approvals"
            value={loading ? '...' : count.toString()}
            description="Questions awaiting review"
        />
    )
} 