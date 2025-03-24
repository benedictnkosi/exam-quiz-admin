'use client'

import { useEffect, useState } from 'react'
import StatsCard from './StatsCard'
import { API_HOST } from '@/config/constants'

interface TotalLearnersResponse {
    status: string
    data: {
        total: number
    }
}

export default function TotalLearnersCard() {
    const [total, setTotal] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchTotalLearners = async () => {
            try {
                const response = await fetch(`${API_HOST}/api/stats/total-learners`)
                const data: TotalLearnersResponse = await response.json()
                if (data.status === 'OK') {
                    setTotal(data.data.total)
                } else {
                    setError('Failed to fetch total learners')
                }
            } catch (err) {
                setError('Error fetching total learners')
            }
        }

        fetchTotalLearners()
    }, [])

    if (error) {
        return <StatsCard title="Total Learners" value="Error" description={error} />
    }

    return (
        <StatsCard
            title="Total Learners"
            value={total?.toString() ?? 'Loading...'}
            description="Total registered learners"
        />
    )
} 