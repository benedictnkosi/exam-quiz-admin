import { API_BASE_URL } from '@/config/constants';
import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface CapturerStats {
    total: number;
    status_counts: {
        new: number;
        approved: number;
        rejected: number;
        pending: number;
    };
    email: string | null;
    name: string;
    percentages: {
        new: number;
        approved: number;
        rejected: number;
        pending: number;
    };
}

interface StatsResponse {
    status: string;
    data: {
        total_questions: number;
        status_counts: {
            approved: number;
            new: number;
            pending: number;
            rejected: number;
        };
        subject_counts: {
            [key: string]: number;
        };
        grade_counts: {
            [key: string]: number;
        };
        capturer_stats: {
            [key: string]: CapturerStats;
        };
    };
}

export default function QuestionStatsTable() {
    const [stats, setStats] = useState<StatsResponse['data'] | null>(null);
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
                const response = await fetch(`${API_BASE_URL}/stats/questions?fromDate=${fromDate}`);
                const data: StatsResponse = await response.json();

                if (data.status === 'OK') {
                    setStats(data.data);
                } else {
                    setError('Failed to fetch statistics');
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
        <div className="bg-white rounded-lg shadow p-6 space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Questions Statistics</h2>
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

            {/* Subject Statistics */}
            <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">Subject Distribution</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Questions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {stats && Object.keys(stats.subject_counts).length > 0 ? (
                                Object.entries(stats.subject_counts).map(([subject, count]) => (
                                    <tr key={subject}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {subject}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {Object.keys(stats.grade_counts)[0]}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {count}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                                        No subject statistics available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Capturer Statistics */}
            <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">Capturer Statistics</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rejected</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approval Rate</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {stats && Object.entries(stats.capturer_stats).length > 0 ? (
                                Object.entries(stats.capturer_stats)
                                    .sort((a, b) => b[1].total - a[1].total)
                                    .map(([_, capturer]) => (
                                        <tr key={capturer.name}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {capturer.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {capturer.total}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {capturer.status_counts.new} ({capturer.percentages.new.toFixed(1)}%)
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {capturer.status_counts.approved} ({capturer.percentages.approved.toFixed(1)}%)
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {capturer.status_counts.rejected} ({capturer.percentages.rejected.toFixed(1)}%)
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {capturer.status_counts.pending} ({capturer.percentages.pending.toFixed(1)}%)
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {capturer.percentages.approved.toFixed(1)}%
                                            </td>
                                        </tr>
                                    ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                                        No capturer statistics available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
} 