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

interface SubjectDifficulty {
    subject_ids: number[];
    subject_name: string;
    total_answers: number;
    correct_answers: number;
    incorrect_answers: number;
    success_rate: number;
    difficulty_level: string;
}

interface SubjectDifficultyResponse {
    status: string;
    grade: number;
    subjects: SubjectDifficulty[];
}

interface GradeSubjectDifficultyChartProps {
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

export default function GradeSubjectDifficultyChart({ grade }: GradeSubjectDifficultyChartProps) {
    const [data, setData] = useState<SubjectDifficulty[]>([]);
    const [error, setError] = useState<string | null>(null);
    const highSchoolGrade = getHighSchoolGrade(grade);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${API_HOST}/api/subject-difficulty/${grade}`);
                const result: SubjectDifficultyResponse = await response.json();
                if (result.status === 'OK') {
                    // Sort subjects by success rate in descending order
                    const sortedData = [...result.subjects].sort((a, b) => b.success_rate - a.success_rate);
                    setData(sortedData);
                } else {
                    setError('Failed to fetch subject difficulty data');
                }
            } catch (err) {
                setError('Error fetching subject difficulty data');
            }
        };

        fetchData();
    }, [grade]);

    if (error) {
        return (
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Grade {highSchoolGrade} Subject Difficulty</h3>
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty.toLowerCase()) {
            case 'easy':
                return 'rgba(75, 192, 192, 0.5)'; // Green
            case 'moderate':
                return 'rgba(255, 206, 86, 0.5)'; // Yellow
            case 'challenging':
                return 'rgba(255, 99, 132, 0.5)'; // Red
            default:
                return 'rgba(54, 162, 235, 0.5)'; // Blue
        }
    };

    const getDifficultyBorderColor = (difficulty: string) => {
        switch (difficulty.toLowerCase()) {
            case 'easy':
                return 'rgb(75, 192, 192)';
            case 'moderate':
                return 'rgb(255, 206, 86)';
            case 'challenging':
                return 'rgb(255, 99, 132)';
            default:
                return 'rgb(54, 162, 235)';
        }
    };

    const chartData = {
        labels: data.map(item => item.subject_name),
        datasets: [
            {
                label: 'Success Rate (%)',
                data: data.map(item => item.success_rate),
                backgroundColor: data.map(item => getDifficultyColor(item.difficulty_level)),
                borderColor: data.map(item => getDifficultyBorderColor(item.difficulty_level)),
                borderWidth: 1
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
                text: `Grade ${highSchoolGrade} Subject Difficulty`
            },
            tooltip: {
                callbacks: {
                    label: function (context: any) {
                        const subject = data[context.dataIndex];
                        return [
                            `Success Rate: ${subject.success_rate.toFixed(2)}%`,
                            `Difficulty: ${subject.difficulty_level}`,
                            `Total Answers: ${subject.total_answers}`,
                            `Correct: ${subject.correct_answers}`,
                            `Incorrect: ${subject.incorrect_answers}`
                        ];
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                title: {
                    display: true,
                    text: 'Success Rate (%)'
                }
            }
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Grade {highSchoolGrade} Subject Difficulty</h3>
            <div className="h-[300px]">
                <Bar data={chartData} options={options} />
            </div>
        </div>
    );
} 