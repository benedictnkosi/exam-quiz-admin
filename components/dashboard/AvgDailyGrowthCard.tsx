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
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${API_HOST}/api/result-growth/daily/with-percentage`)
                const result: ResultGrowthResponse = await response.json()
                
                if (result.status === 'success') {
                    // Filter data from April 9th, 2025 onwards and remove today's data
                    const today = new Date().toISOString().split('T')[0]
                    const startDate = '2025-04-09'
                    const filteredData = result.data
                        .filter(item => 
                            item.date !== today && 
                            item.date >= startDate &&
                            item.growth_percentage !== null &&
                            Math.abs(item.growth_percentage) <= 100
                        )
                    
                    // Calculate average growth
                    const totalGrowth = filteredData.reduce((sum, item) => 
                        sum + (item.growth_percentage || 0), 0
                    )
                    const average = totalGrowth / filteredData.length
                    setAvgGrowth(average)
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
                    <span className={avgGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {avgGrowth.toFixed(2)}%
                    </span>
                )}
            </div>
            <p className="text-gray-500 text-sm mt-2">Last 2 weeks</p>
        </div>
    )
} 