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

interface CompletedChapter {
    date: string
    learnerCount: number
}

interface CompletedChaptersResponse {
    success: boolean
    data: CompletedChapter[]
}

export default function CompletedChaptersChart() {
    const [data, setData] = useState<CompletedChapter[]>([])
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchCompletedChapters = async () => {
            try {
                const response = await fetch(`${API_HOST}/api/reading-stats/completed-chapters`)
                const result: CompletedChaptersResponse = await response.json()
                if (result.success) {
                    // Sort the data by date in ascending order
                    const sortedData = [...result.data].sort((a, b) =>
                        new Date(a.date).getTime() - new Date(b.date).getTime()
                    )
                    setData(sortedData)
                } else {
                    setError('Failed to fetch completed chapters data')
                }
            } catch (err) {
                setError('Error fetching completed chapters data')
            }
        }

        fetchCompletedChapters()
    }, [])

    if (error) {
        return (
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Completed Chapters</h3>
                <p className="text-red-500">{error}</p>
            </div>
        )
    }

    const chartData = {
        labels: data.map(item => new Date(item.date).toLocaleDateString()),
        datasets: [
            {
                label: 'Learners Who Completed Chapters',
                data: data.map(item => item.learnerCount),
                borderColor: 'rgb(153, 102, 255)',
                backgroundColor: 'rgba(153, 102, 255, 0.5)',
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
                text: 'Daily Chapter Completions'
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
            <h3 className="text-lg font-semibold mb-4">Completed Chapters</h3>
            <div className="h-[300px]">
                <Line data={chartData} options={options} />
            </div>
        </div>
    )
} 