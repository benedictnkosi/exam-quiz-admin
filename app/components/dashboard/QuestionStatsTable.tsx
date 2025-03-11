import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface Capturer {
    capturerId: number;
    capturerName: string;
    questionCount: number;
}

interface SubjectStats {
    subjectId: number;
    subjectName: string;
    grade: number;
    capturers: Capturer[];
}

interface StatsResponse {
    status: string;
    fromDate: string;
    statistics: SubjectStats[];
    message?: string;
}

export default function QuestionStatsTable() {
    const [stats, setStats] = useState<SubjectStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(() => {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return date;
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const fromDate = selectedDate.toISOString().split('T')[0];
                const response = await fetch(`/api/stats/questions?fromDate=${fromDate}`);
                const data: StatsResponse = await response.json();

                if (data.status === 'OK') {
                    setStats(data.statistics);
                } else {
                    setError(data.message || 'Failed to fetch statistics');
                }
            } catch (err) {
                setError('Failed to fetch statistics');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [selectedDate]);

    if (loading) {
        return <div className="text-center p-4">Loading statistics...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500 p-4">{error}</div>;
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Questions per Subject</h2>
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">From Date:</span>
                    <DatePicker
                        selected={selectedDate}
                        onChange={(date: Date | null) => setSelectedDate(date || selectedDate)}
                        className="border rounded-md p-2 text-sm"
                        dateFormat="yyyy-MM-dd"
                    />
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Questions</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capturers</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {stats.map((subject) => {
                            const totalQuestions = subject.capturers.reduce(
                                (sum, capturer) => sum + capturer.questionCount,
                                0
                            );

                            return (
                                <tr key={subject.subjectId}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {subject.subjectName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {subject.grade}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {totalQuestions}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        <div className="space-y-1">
                                            {subject.capturers.map((capturer) => (
                                                <div key={capturer.capturerId}>
                                                    {capturer.capturerName}: {capturer.questionCount}
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
} 