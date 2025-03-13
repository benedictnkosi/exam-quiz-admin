import { API_BASE_URL } from '@/config/constants';
import React, { useState, useEffect } from 'react';
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

export default function StatusCountsTable() {
    const [stats, setStats] = useState<StatsResponse['data'] | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(() => {
        const date = new Date();
        const day = date.getDay();
        const diff = (day === 0 ? -1 : 7 - day);
        date.setDate(date.getDate() - diff);
        return date;
    });

    useEffect(() => {
        const fetchStatusCounts = async () => {
            setLoading(true);
            setError(null);

            try {
                const formattedDate = selectedDate.toISOString().split('T')[0];
                const response = await fetch(`${API_BASE_URL}/stats/questions?fromDate=${formattedDate}`);
                const data: StatsResponse = await response.json();

                if (data.status === 'OK' && data.data) {
                    setStats(data.data);
                } else {
                    setError('Invalid response format');
                    setStats(null);
                }
            } catch (error) {
                console.error('Failed to fetch status counts:', error);
                setError('Failed to fetch data. Please try again.');
                setStats(null);
            } finally {
                setLoading(false);
            }
        };

        fetchStatusCounts();
    }, [selectedDate]);

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Question Statistics</h2>
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
                {loading ? (
                    <div className="text-center py-4">Loading...</div>
                ) : error ? (
                    <div className="text-center py-4 text-red-500">{error}</div>
                ) : !stats ? (
                    <div className="text-center py-4">No data available for the selected date.</div>
                ) : (
                    <div className="space-y-8">
                        {/* Status Counts */}
                        <div>
                            <h3 className="text-lg font-medium mb-4">Status Distribution</h3>
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">New</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approved</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rejected</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="px-6 py-4 text-sm text-gray-500">{stats.status_counts.new}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{stats.status_counts.approved}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{stats.status_counts.pending}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{stats.status_counts.rejected}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{stats.total_questions}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Subject Distribution */}
                        <div>
                            <h3 className="text-lg font-medium mb-4">Subject Distribution</h3>
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {Object.entries(stats.subject_counts).map(([subject, count]) => (
                                        <tr key={subject}>
                                            <td className="px-6 py-4 text-sm text-gray-900">{subject}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Grade Distribution */}
                        <div>
                            <h3 className="text-lg font-medium mb-4">Grade Distribution</h3>
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {Object.entries(stats.grade_counts).map(([grade, count]) => (
                                        <tr key={grade}>
                                            <td className="px-6 py-4 text-sm text-gray-900">Grade {grade}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>


                    </div>
                )}
            </div>
        </div>
    );
} 