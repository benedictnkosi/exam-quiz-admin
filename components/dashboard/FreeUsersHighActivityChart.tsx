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

interface FreeUserStats {
    date: string
    userCount: number
}

interface FreeUsersResponse {
    success: boolean
    data: {
        stats: FreeUserStats[]
        description: string
    }
}

export default function FreeUsersHighActivityChart() {
    const [data, setData] = useState<FreeUserStats[]>([])
    const [error, setError] = useState<string | null>(null)
    const [description, setDescription] = useState<string>('')

    useEffect(() => {
        const fetchFreeUsersStats = async () => {
            try {
                const response = await fetch(`${API_HOST}/api/usage-stats/free-users-high-activity`)
                const result: FreeUsersResponse = await response.json()
                if (result.success) {
                    // Sort the data by date in ascending order
                    const sortedData = [...result.data.stats].sort((a, b) =>
                        new Date(a.date).getTime() - new Date(b.date).getTime()
                    )
                    setData(sortedData)
                    setDescription(result.data.description)
                } else {
                    setError('Failed to fetch free users stats')
                }
            } catch (err) {
                setError('Error fetching free users stats')
            }
        }

        fetchFreeUsersStats()
    }, [])

    if (error) {
        return (
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Free Users High Activity</h3>
                <p className="text-red-500">{error}</p>
            </div>
        )
    }

    const chartData = {
        labels: data.map(item => new Date(item.date).toLocaleDateString()),
        datasets: [
            {
                label: 'Free Users with High Activity',
                data: data.map(item => item.userCount),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
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
                text: 'Free Users with High Activity Over Time'
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
            <h3 className="text-lg font-semibold mb-4">Free Users High Activity</h3>
            {description && (
                <p className="text-sm text-gray-600 mb-4">{description}</p>
            )}
            <div className="h-[300px]">
                <Line data={chartData} options={options} />
            </div>
        </div>
    )
} 