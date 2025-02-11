'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/constants.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface LearnerData {
  month: string
  month_key: string
  count: number
}

interface DateRange {
  start: string
  end: string
}

interface ApiResponse {
  status: string
  data: LearnerData[]
  total_learners: number
  date_range: DateRange
}

export default function LearnersPerWeekChart() {
  const [chartData, setChartData] = useState<LearnerData[]>([])
  const [dateRange, setDateRange] = useState<DateRange>({ start: '', end: '' })
  const [totalLearners, setTotalLearners] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/learners/created-per-month`)
        const data: ApiResponse = await response.json()
        if (data.status === 'OK') {
          setChartData(data.data)
          setDateRange(data.date_range)
          setTotalLearners(data.total_learners)
        } else {
          setError('Failed to load data')
        }
      } catch (err) {
        setError('Failed to fetch data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `New Learners (${dateRange.start} - ${dateRange.end})`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          precision: 0
        }
      }
    }
  }

  const data = {
    labels: chartData.map(item => item.month),
    datasets: [
      {
        label: `Total Learners: ${totalLearners}`,
        data: chartData.map(item => item.count),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      },
    ],
  }

  if (loading) return <div>Loading chart...</div>
  if (error) return <div>Error loading chart: {error}</div>

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <Bar options={options} data={data} />
    </div>
  )
} 