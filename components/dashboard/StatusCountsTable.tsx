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
    name: string;
    percentages: {
        new: number;
        approved: number;
        rejected: number;
        pending: number;
    };
    ai_questions?: number;
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
    const [selectedFromDate, setSelectedFromDate] = useState<Date>(() => {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        return date;
    });
    const [selectedEndDate, setSelectedEndDate] = useState<Date>(() => {
        return new Date();
    });

    useEffect(() => {
        const fetchStatusCounts = async () => {
            setLoading(true);
            setError(null);

            try {
                const fromDate = selectedFromDate.toISOString().split('T')[0];
                const endDate = selectedEndDate.toISOString().split('T')[0];
                const response = await fetch(`${API_BASE_URL}/stats/questions?fromDate=${fromDate}&endDate=${endDate}`);
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
    }, [selectedFromDate, selectedEndDate]);

    const handleFromDateChange = (date: Date | null) => {
        if (date) {
            setSelectedFromDate(date);
            // If end date is before new from date, update end date
            if (selectedEndDate < date) {
                setSelectedEndDate(date);
            }
        }
    };

    const handleEndDateChange = (date: Date | null) => {
        if (date) {
            setSelectedEndDate(date);
            // If from date is after new end date, update from date
            if (selectedFromDate > date) {
                setSelectedFromDate(date);
            }
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Question Statistics</h2>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">From:</span>
                        <DatePicker
                            selected={selectedFromDate}
                            onChange={handleFromDateChange}
                            className="border rounded-md p-2 text-sm"
                            dateFormat="yyyy-MM-dd"
                            maxDate={selectedEndDate}
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">To:</span>
                        <DatePicker
                            selected={selectedEndDate}
                            onChange={handleEndDateChange}
                            className="border rounded-md p-2 text-sm"
                            dateFormat="yyyy-MM-dd"
                            minDate={selectedFromDate}
                            maxDate={new Date()}
                        />
                    </div>
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

                        {/* Capturer Statistics */}
                        <div>
                            <h3 className="text-lg font-medium mb-4">Capturer Statistics</h3>
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capturer</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">AI Questions (R1)</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Normal Questions (R3)</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">New</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approved</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rejected</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {Object.entries(stats.capturer_stats)
                                        .sort((a, b) => b[1].total - a[1].total)
                                        .map(([capturerId, stats]) => (
                                            <tr key={capturerId}>
                                                <td className="px-6 py-4 text-sm text-gray-900">{stats.name}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{stats.total}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{stats.ai_questions || 0}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{stats.total - (stats.ai_questions || 0)}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {stats.status_counts.new} ({stats.percentages.new.toFixed(1)}%)
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {stats.status_counts.approved} ({stats.percentages.approved.toFixed(1)}%)
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {stats.status_counts.rejected} ({stats.percentages.rejected.toFixed(1)}%)
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {stats.status_counts.pending} ({stats.percentages.pending.toFixed(1)}%)
                                                </td>
                                            </tr>
                                        ))}
                                    <tr className="bg-gray-50 font-medium">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">Total</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {Object.values(stats.capturer_stats).reduce((sum, capturer) => sum + capturer.total, 0)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {Object.values(stats.capturer_stats).reduce((sum, capturer) => sum + (capturer.ai_questions || 0), 0)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {Object.values(stats.capturer_stats).reduce((sum, capturer) => sum + (capturer.total - (capturer.ai_questions || 0)), 0)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {Object.values(stats.capturer_stats).reduce((sum, capturer) => sum + capturer.status_counts.new, 0)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {Object.values(stats.capturer_stats).reduce((sum, capturer) => sum + capturer.status_counts.approved, 0)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {Object.values(stats.capturer_stats).reduce((sum, capturer) => sum + capturer.status_counts.rejected, 0)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {Object.values(stats.capturer_stats).reduce((sum, capturer) => sum + capturer.status_counts.pending, 0)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
} 