'use client'

import { useEffect, useState } from 'react'
import { Bar } from 'react-chartjs-2'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js'
import { API_HOST } from '@/config/constants'

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
)

interface SubjectPopularity {
    subject_ids: number[];
    subject_name: string;
    total_answers: number;
    unique_learners: number;
    unique_questions: number;
    percentage_of_total: number;
    popularity_rank: number;
}

interface SubjectPopularityResponse {
    status: string;
    grade: number;
    total_answers_across_subjects: number;
    subjects: SubjectPopularity[];
}

interface GradeSubjectPopularityChartProps {
    grade: number;
}

const getHighSchoolGrade = (grade: number): number => {
    const gradeMap: { [key: number]: number } = {
        1: 12,
        2: 11,
        3: 10
    };
    return gradeMap[grade] || grade;
};

export default function GradeSubjectPopularityChart({ grade }: GradeSubjectPopularityChartProps) {
    const [data, setData] = useState<SubjectPopularity[]>([]);
    const [error, setError] = useState<string | null>(null);
    const highSchoolGrade = getHighSchoolGrade(grade);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${API_HOST}/api/subject-popularity/${grade}`);
                const result: SubjectPopularityResponse = await response.json();
                if (result.status === 'OK') {
                    // Sort subjects by popularity rank
                    const sortedData = [...result.subjects].sort((a, b) => a.popularity_rank - b.popularity_rank);
                    setData(sortedData);
                } else {
                    setError('Failed to fetch subject popularity data');
                }
            } catch (err) {
                setError('Error fetching subject popularity data');
            }
        };

        fetchData();
    }, [grade]);

    if (error) {
        return (
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Grade {highSchoolGrade} Subject Popularity</h3>
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    const chartData = {
        labels: data.map(item => item.subject_name),
        datasets: [
            {
                label: 'Total Answers',
                data: data.map(item => item.total_answers),
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgb(54, 162, 235)',
                borderWidth: 1,
                yAxisID: 'y'
            },
            {
                label: 'Unique Learners',
                data: data.map(item => item.unique_learners),
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgb(255, 99, 132)',
                borderWidth: 1,
                yAxisID: 'y1'
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: `Grade ${highSchoolGrade} Subject Popularity`
            },
            tooltip: {
                callbacks: {
                    label: function (context: any) {
                        const subject = data[context.dataIndex];
                        const datasetLabel = context.dataset.label;
                        const value = context.raw;

                        if (datasetLabel === 'Total Answers') {
                            return [
                                `Total Answers: ${value.toLocaleString()}`,
                                `Percentage of Total: ${subject.percentage_of_total.toFixed(2)}%`,
                                `Popularity Rank: #${subject.popularity_rank}`
                            ];
                        }
                        return `${datasetLabel}: ${value.toLocaleString()}`;
                    }
                }
            }
        },
        scales: {
            y: {
                type: 'linear' as const,
                display: true,
                position: 'left' as const,
                title: {
                    display: true,
                    text: 'Total Answers'
                }
            },
            y1: {
                type: 'linear' as const,
                display: true,
                position: 'right' as const,
                title: {
                    display: true,
                    text: 'Unique Learners'
                },
                grid: {
                    drawOnChartArea: false
                }
            }
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Grade {highSchoolGrade} Subject Popularity</h3>
            <div className="h-[300px]">
                <Bar data={chartData} options={options} />
            </div>
        </div>
    );
} 