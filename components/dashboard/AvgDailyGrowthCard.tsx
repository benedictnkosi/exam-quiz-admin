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

type TimePeriod = 7 | 14 | 30

export default function AvgDailyGrowthCard() {
    const [avgGrowth, setAvgGrowth] = useState<number | null>(null)
    const [totalGrowth, setTotalGrowth] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(14)
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' })

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${API_HOST}/api/result-growth/daily/with-percentage`)
                const result: ResultGrowthResponse = await response.json()

                if (result.status === 'success') {
                    // Get today's date and calculate date X days ago
                    const today = new Date()
                    const daysAgo = new Date(today)
                    daysAgo.setDate(today.getDate() - selectedPeriod)

                    // Format dates for comparison
                    const todayStr = today.toISOString().split('T')[0]
                    const daysAgoStr = daysAgo.toISOString().split('T')[0]

                    // Update date range for display
                    setDateRange({
                        start: daysAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        end: today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    })

                    // Filter data for selected period, excluding today
                    const filteredData = result.data
                        .filter(item =>
                            item.date !== todayStr &&
                            item.date >= daysAgoStr &&
                            item.date !== '2025-05-19' &&
                            item.growth_percentage !== null &&
                            Math.abs(item.growth_percentage) <= 100
                        )
                        .sort((a, b) => a.date.localeCompare(b.date))

                    // Calculate average growth (excluding today)
                    const totalGrowth = filteredData.reduce((sum, item) =>
                        sum + (item.growth_percentage || 0), 0
                    )
                    const average = filteredData.length > 0 ? totalGrowth / filteredData.length : 0
                    setAvgGrowth(average)

                    // Calculate total growth (excluding today)
                    if (filteredData.length > 0) {
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
    }, [selectedPeriod])

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
                <div className="flex items-center gap-2">
                    <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(Number(e.target.value) as TimePeriod)}
                        className="text-sm border rounded px-2 py-1"
                    >
                        <option value={7}>7 days</option>
                        <option value={14}>14 days</option>
                        <option value={30}>30 days</option>
                    </select>
                    <TrendingUp className="text-blue-500" size={24} />
                </div>
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
            <p className="text-gray-500 text-sm mt-2">
                {dateRange.start} - {dateRange.end}
            </p>
        </div>
    )
} 