'use client'

import { useEffect, useState } from 'react'
import { Pie } from 'react-chartjs-2'
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    Title
} from 'chart.js'
import { API_HOST } from '@/config/constants'

// Register ChartJS components
ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    Title
)

interface SubjectRequest {
    subjectName: string;
    requestCount: number;
}

interface SubjectRequestResponse {
    success: boolean;
    data: SubjectRequest[];
}

export default function SubjectRequestPieChart() {
    const [data, setData] = useState<SubjectRequest[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${API_HOST}/api/subjects/request-counts`);
                const result: SubjectRequestResponse = await response.json();
                if (result.success) {
                    setData(result.data);
                } else {
                    setError('Failed to fetch subject request data');
                }
            } catch (err) {
                setError('Error fetching subject request data');
            }
        };

        fetchData();
    }, []);

    if (error) {
        return (
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Subject Request Distribution</h3>
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    const chartData = {
        labels: data.map(item => item.subjectName),
        datasets: [
            {
                data: data.map(item => item.requestCount),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(153, 102, 255, 0.5)',
                    'rgba(255, 159, 64, 0.5)',
                    'rgba(138, 194, 73, 0.5)',
                    'rgba(234, 82, 111, 0.5)',
                    'rgba(35, 181, 211, 0.5)',
                    'rgba(39, 154, 241, 0.5)',
                    'rgba(126, 82, 160, 0.5)',
                    'rgba(247, 184, 1, 0.5)',
                    'rgba(42, 157, 143, 0.5)',
                    'rgba(231, 111, 81, 0.5)',
                    'rgba(38, 70, 83, 0.5)'
                ],
                borderColor: [
                    'rgb(255, 99, 132)',
                    'rgb(54, 162, 235)',
                    'rgb(255, 206, 86)',
                    'rgb(75, 192, 192)',
                    'rgb(153, 102, 255)',
                    'rgb(255, 159, 64)',
                    'rgb(138, 194, 73)',
                    'rgb(234, 82, 111)',
                    'rgb(35, 181, 211)',
                    'rgb(39, 154, 241)',
                    'rgb(126, 82, 160)',
                    'rgb(247, 184, 1)',
                    'rgb(42, 157, 143)',
                    'rgb(231, 111, 81)',
                    'rgb(38, 70, 83)'
                ],
                borderWidth: 1
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right' as const,
                labels: {
                    boxWidth: 12,
                    padding: 10,
                    font: {
                        size: 11
                    }
                }
            },
            title: {
                display: true,
                text: 'Subject Request Distribution'
            }
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Subject Request Distribution</h3>
            <div className="h-[250px]">
                <Pie data={chartData} options={options} />
            </div>
        </div>
    );
} 