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
import { API_BASE_URL } from '@/services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface CapturedQuestion {
  capturer: string;
  count: number;
  week: string;
}

interface ApiResponse {
  status: string;
  data: CapturedQuestion[];
  total_questions: number;
}

export default function QuestionsPerWeekChart() {
  const [chartData, setChartData] = useState<CapturedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/questions/captured-per-week`);
        const data: ApiResponse = await response.json();
        if (data.status === 'OK') {
          setChartData(data.data);
        } else {
          setError('Failed to load data');
        }
      } catch (err) {
        setError('Failed to fetch data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Questions Captured Per Week',
      },
    },
  };

  const data = {
    labels: chartData.map(item => item.capturer.split('@')[0]), // Show only username part
    datasets: [
      {
        label: 'Questions Captured',
        data: chartData.map(item => item.count),
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  if (loading) return <div>Loading chart...</div>;
  if (error) return <div>Error loading chart: {error}</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <Bar options={options} data={data} />
    </div>
  );
} 