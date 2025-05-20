'use client'

import { useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js'
import { API_HOST } from '@/config/constants'

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
)

interface DailyBreakdown {
    date: string
    learners: number
}

interface DateRange {
    start: string
    end: string
}

interface LearnerActivityData {
    average_learners_per_day: number
    total_days_with_activity: number
    total_unique_learners: number
    daily_breakdown: DailyBreakdown[]
    date_range: DateRange
}

interface LearnerActivityResponse {
    status: string
    data: LearnerActivityData
}

export default function LearnerActivityChart() {
    const [data, setData] = useState<LearnerActivityData | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchLearnerActivity = async () => {
            try {
                const response = await fetch(`${API_HOST}/api/stats/average-learners-per-day`)
                const result: LearnerActivityResponse = await response.json()
                if (result.status === 'OK') {
                    const excludedDate = '2025-05-19'
                    const filteredData = result.data.daily_breakdown.filter(item => item.date !== excludedDate)
                    const updatedData = {
                        ...result.data,
                        daily_breakdown: filteredData
                    }
                    setData(updatedData)
                } else {
                    setError('Failed to fetch learner activity data')
                }
            } catch (err) {
                setError('Error fetching learner activity data')
            }
        }

        fetchLearnerActivity()
    }, [])

    if (error) {
        return (
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Learner Activity</h3>
                <p className="text-red-500">{error}</p>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Learner Activity</h3>
                <p>Loading...</p>
            </div>
        )
    }

    const chartData = {
        labels: data.daily_breakdown.map(item => new Date(item.date).toLocaleDateString()),
        datasets: [
            {
                label: 'Active Learners',
                data: data.daily_breakdown.map(item => item.learners),
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                tension: 0.1
            }
        ]
    }

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'Daily Active Learners'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1
                }
            }
        }
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Learner Activity</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-sm text-blue-600 font-medium">Average Learners/Day</h4>
                    <p className="text-2xl font-bold text-blue-700">{data.average_learners_per_day}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="text-sm text-green-600 font-medium">Active Days</h4>
                    <p className="text-2xl font-bold text-green-700">{data.total_days_with_activity}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="text-sm text-purple-600 font-medium">Unique Learners</h4>
                    <p className="text-2xl font-bold text-purple-700">{data.total_unique_learners}</p>
                </div>
            </div>

            <div className="text-sm text-gray-600 mb-4">
                Date Range: {new Date(data.date_range.start).toLocaleDateString()} - {new Date(data.date_range.end).toLocaleDateString()}
            </div>

            <div className="h-[300px]">
                <Line data={chartData} options={options} />
            </div>
        </div>
    )
} 