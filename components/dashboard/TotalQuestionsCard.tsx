'use client'

import { useEffect, useState } from 'react'
import StatsCard from './StatsCard'
import { API_HOST } from '@/config/constants'

interface TotalQuestionsResponse {
    status: string
    data: {
        total: number
    }
}

export default function TotalQuestionsCard() {
    const [total, setTotal] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchTotalQuestions = async () => {
            try {
                const response = await fetch(`${API_HOST}/api/stats/questions/total`)
                const data: TotalQuestionsResponse = await response.json()
                if (data.status === 'OK') {
                    setTotal(data.data.total)
                } else {
                    setError('Failed to fetch total questions')
                }
            } catch (err) {
                setError('Error fetching total questions')
            }
        }

        fetchTotalQuestions()
    }, [])

    if (error) {
        return <StatsCard title="Total Questions" value="Error" description={error} />
    }

    return (
        <StatsCard
            title="Total Questions"
            value={total?.toString() ?? 'Loading...'}
            description="Across all grades"
        />
    )
} 