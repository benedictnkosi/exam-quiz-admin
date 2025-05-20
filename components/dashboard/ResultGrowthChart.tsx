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

interface ResultGrowthData {
    date: string
    count: number
    growth_percentage: number | null
}

interface ResultGrowthResponse {
    status: string
    data: ResultGrowthData[]
}

export default function ResultGrowthChart() {
    const [data, setData] = useState<ResultGrowthData[]>([])
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
                    const excludedDate = '2025-05-19'
                    const filteredData = result.data
                        .filter(item =>
                            item.date !== today &&
                            item.date >= startDate &&
                            item.date !== excludedDate &&
                            (item.growth_percentage === null || Math.abs(item.growth_percentage) <= 100)
                        )
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

                    setData(filteredData)
                } else {
                    setError('Failed to fetch result growth data')
                }
            } catch (err) {
                setError('Error fetching result growth data')
            }
        }

        fetchData()
    }, [])

    if (error) {
        return (
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Daily Answers Growth</h3>
                <p className="text-red-500">{error}</p>
            </div>
        )
    }

    const chartData = {
        labels: data.map(item => new Date(item.date).toLocaleDateString()),
        datasets: [
            {
                label: 'Growth Percentage',
                data: data.map(item => item.growth_percentage || 0),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                tension: 0.1
            }
        ]
    }

    const options = {
        responsive: true,
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'Daily Result Growth Over Time (From Apr 9, 2025)'
            }
        },
        scales: {
            y: {
                type: 'linear' as const,
                display: true,
                title: {
                    display: true,
                    text: 'Growth Percentage (%)'
                },
                min: -100,
                max: 100
            }
        }
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Daily Answers Growth</h3>
            <div className="h-[300px]">
                <Line data={chartData} options={options} />
            </div>
        </div>
    )
} 