'use client'

import { useEffect, useState } from 'react'
import { API_HOST } from '@/config/constants'
import { TrendingUp } from 'lucide-react'

interface ResultGrowthData {
    date: string
    count: number
    growth_percentage: number | null
}

interface ResultGrowthResponse {
    status: string
    data: ResultGrowthData[]
}

export default function AvgDailyGrowthCard() {
    const [avgGrowth, setAvgGrowth] = useState<number | null>(null)
    const [totalGrowth, setTotalGrowth] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${API_HOST}/api/result-growth/daily/with-percentage`)
                const result: ResultGrowthResponse = await response.json()

                if (result.status === 'success') {
                    // Get today's date and calculate date 7 days ago
                    const today = new Date()
                    const sevenDaysAgo = new Date(today)
                    sevenDaysAgo.setDate(today.getDate() - 7)

                    // Format dates for comparison
                    const todayStr = today.toISOString().split('T')[0]
                    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

                    // Filter data for past 7 days, excluding today
                    const filteredData = result.data
                        .filter(item =>
                            item.date !== todayStr &&
                            item.date >= sevenDaysAgoStr &&
                            item.growth_percentage !== null &&
                            Math.abs(item.growth_percentage) <= 100
                        )
                        .sort((a, b) => a.date.localeCompare(b.date)) // Sort by date to ensure correct order

                    // Calculate average growth (excluding today)
                    const totalGrowth = filteredData.reduce((sum, item) =>
                        sum + (item.growth_percentage || 0), 0
                    )
                    const average = filteredData.length > 0 ? totalGrowth / filteredData.length : 0
                    setAvgGrowth(average)

                    // Calculate total growth (excluding today)
                    if (filteredData.length > 0) {
                        // Ensure we're using the earliest and latest dates
                        const sortedData = [...filteredData].sort((a, b) => a.date.localeCompare(b.date))
                        const firstDayCount = sortedData[0].count
                        const lastDayCount = sortedData[sortedData.length - 1].count
                        const totalGrowthPercentage = firstDayCount > 0
                            ? ((lastDayCount - firstDayCount) / firstDayCount) * 100
                            : 0
                        setTotalGrowth(totalGrowthPercentage)
                    } else {
                        setTotalGrowth(0)
                    }
                } else {
                    setError('Failed to fetch growth data')
                }
            } catch (err) {
                setError('Error fetching growth data')
            }
        }

        fetchData()
    }, [])

    if (error) {
        return (
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Avg Daily Growth</h3>
                <p className="text-red-500">{error}</p>
            </div>
        )
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Avg Daily Growth</h3>
                <TrendingUp className="text-blue-500" size={24} />
            </div>
            <div className="text-3xl font-bold">
                {avgGrowth === null ? (
                    <span className="text-gray-400">Loading...</span>
                ) : (
                    <div className="space-y-2">
                        <div>
                            <span className="text-sm text-gray-500">Daily Avg: </span>
                            <span className={avgGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {avgGrowth.toFixed(2)}%
                            </span>
                        </div>
                        <div>
                            <span className="text-sm text-gray-500">Total: </span>
                            <span className={totalGrowth && totalGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {totalGrowth?.toFixed(2)}%
                            </span>
                        </div>
                    </div>
                )}
            </div>
            <p className="text-gray-500 text-sm mt-2">Last 7 days</p>
        </div>
    )
} 