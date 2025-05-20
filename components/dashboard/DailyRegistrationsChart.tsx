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

interface DailyRegistration {
    date: string
    count: number
}

interface DailyRegistrationsResponse {
    status: string
    data: DailyRegistration[]
}

export default function DailyRegistrationsChart() {
    const [data, setData] = useState<DailyRegistration[]>([])
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchDailyRegistrations = async () => {
            try {
                const response = await fetch(`${API_HOST}/api/stats/daily-registrations`)
                const result: DailyRegistrationsResponse = await response.json()
                if (result.status === 'OK') {
                    const excludedDate = '2025-05-19'
                    const filteredData = result.data.filter(item => item.date !== excludedDate)
                    setData(filteredData)
                } else {
                    setError('Failed to fetch daily registrations')
                }
            } catch (err) {
                setError('Error fetching daily registrations')
            }
        }

        fetchDailyRegistrations()
    }, [])

    if (error) {
        return (
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Daily Registrations</h3>
                <p className="text-red-500">{error}</p>
            </div>
        )
    }

    const chartData = {
        labels: data.map(item => new Date(item.date).toLocaleDateString()),
        datasets: [
            {
                label: 'Daily Registrations',
                data: data.map(item => item.count),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
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
                text: 'Daily Registrations Over Time'
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
            <h3 className="text-lg font-semibold mb-4">Daily Registrations</h3>
            <div className="h-[300px]">
                <Line data={chartData} options={options} />
            </div>
        </div>
    )
} 