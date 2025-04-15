'use client'

import { useEffect, useState } from 'react'
import { API_HOST } from '@/config/constants'
import { Target } from 'lucide-react'

interface GrowthData {
    date: string
    count: number
    growth_percentage: number | null
}

interface GrowthResponse {
    status: string
    data: GrowthData[]
}

export default function GrowthTargetCard() {
    const [requiredGrowth, setRequiredGrowth] = useState<number | null>(null)
    const [currentCount, setCurrentCount] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${API_HOST}/api/result-growth/daily/with-percentage`)
                const result: GrowthResponse = await response.json()
                
                if (result.status === 'success' && result.data.length > 1) { // Ensure we have at least 2 days of data
                    // Get yesterday's count (index 1 since data is sorted by date desc)
                    const yesterdayData = result.data[1]
                    setCurrentCount(yesterdayData.count)
                    
                    // Calculate days until December 31st, 2025
                    const targetDate = new Date('2025-12-31')
                    const today = new Date()
                    const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                    
                    // Calculate required daily growth rate
                    // Using compound growth formula: FV = PV(1 + r)^t
                    // Where: FV = 1,000,000, PV = yesterday's count, t = days remaining
                    // Solving for r: r = (FV/PV)^(1/t) - 1
                    const targetCount = 1000000
                    const dailyGrowthRate = Math.pow(targetCount / yesterdayData.count, 1 / daysRemaining) - 1
                    const growthPercentage = dailyGrowthRate * 100
                    
                    setRequiredGrowth(growthPercentage)
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
                <h3 className="text-lg font-semibold mb-2">Target Growth Rate</h3>
                <p className="text-red-500">{error}</p>
            </div>
        )
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Target Growth Rate</h3>
                <Target className="text-purple-500" size={24} />
            </div>
            <div className="text-3xl font-bold">
                {requiredGrowth === null ? (
                    <span className="text-gray-400">Loading...</span>
                ) : (
                    <span className="text-purple-600">
                        {requiredGrowth.toFixed(2)}%
                    </span>
                )}
            </div>
            <p className="text-gray-500 text-sm mt-2">
                Daily growth needed for 1M answers per day by Dec 31
            </p>
            {currentCount && (
               <><p className="text-gray-500 text-sm mt-1">
                    Ad every 20 answers = 50 000
                </p>
                <p className="text-gray-500 text-sm mt-1">
                R0,094 per ad = R4700
            </p>
            </>
            )}
        </div>
    )
} 