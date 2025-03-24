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

interface DailyAnswer {
    date: string
    count: number
}

interface DailyAnswersResponse {
    status: string
    data: DailyAnswer[]
}

export default function DailyAnswersChart() {
    const [data, setData] = useState<DailyAnswer[]>([])
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchDailyAnswers = async () => {
            try {
                const response = await fetch(`${API_HOST}/api/stats/daily-answers`)
                const result: DailyAnswersResponse = await response.json()
                if (result.status === 'OK') {
                    setData(result.data)
                } else {
                    setError('Failed to fetch daily answers')
                }
            } catch (err) {
                setError('Error fetching daily answers')
            }
        }

        fetchDailyAnswers()
    }, [])

    if (error) {
        return (
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Daily Answers</h3>
                <p className="text-red-500">{error}</p>
            </div>
        )
    }

    const chartData = {
        labels: data.map(item => new Date(item.date).toLocaleDateString()),
        datasets: [
            {
                label: 'Daily Answers',
                data: data.map(item => item.count),
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
                text: 'Daily Answers Over Time'
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
            <h3 className="text-lg font-semibold mb-4">Daily Answers</h3>
            <div className="h-[300px]">
                <Line data={chartData} options={options} />
            </div>
        </div>
    )
} 