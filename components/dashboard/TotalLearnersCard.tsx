'use client'

import { useEffect, useState } from 'react'
import StatsCard from './StatsCard'
import { API_HOST } from '@/config/constants'

interface TotalLearnersResponse {
    status: string
    data: {
        total: number
        grade_breakdown: {
            grade: number
            count: number
        }[]
    }
}

export default function TotalLearnersCard() {
    const [total, setTotal] = useState<number | null>(null)
    const [gradeBreakdown, setGradeBreakdown] = useState<{ grade: number; count: number }[]>([])
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchTotalLearners = async () => {
            try {
                const response = await fetch(`${API_HOST}/api/stats/total-learners`)
                const data: TotalLearnersResponse = await response.json()
                if (data.status === 'OK') {
                    setTotal(data.data.total)
                    setGradeBreakdown(data.data.grade_breakdown)
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
        <div className="bg-white rounded-lg shadow p-4">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-700">Total Learners</h3>
                <p className="text-3xl font-bold text-gray-900">{total?.toString() ?? 'Loading...'}</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
                {gradeBreakdown.map((item) => (
                    <div
                        key={item.grade}
                        className="bg-gray-50 rounded-lg p-2 text-center"
                    >
                        <div className="text-xl font-bold text-gray-900">
                            {item.grade}
                        </div>
                        <div className="text-sm text-gray-600">
                            {item.count}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
} 