import { API_BASE_URL } from '@/config/constants';
import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface ReviewerStats {
    reviewer: string;
    reviewer_name: string;
    approved: number;
    rejected: number;
    new: number;
    total: number;
}

interface ReviewerStatsResponse {
    status: string;
    data: ReviewerStats[];
}

export default function ReviewerStatsTable() {
    const [reviewerStats, setReviewerStats] = useState<ReviewerStats[]>([]);
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
        const fetchReviewerStats = async () => {
            setLoading(true);
            setError(null);

            try {
                const fromDate = selectedFromDate.toISOString().split('T')[0];
                const endDate = selectedEndDate.toISOString().split('T')[0];
                const response = await fetch(`${API_BASE_URL}/questions-reviewed?from_date=${fromDate}&endDate=${endDate}`);
                const data: ReviewerStatsResponse = await response.json();

                if (data.status === 'OK' && Array.isArray(data.data)) {
                    setReviewerStats(data.data);
                } else {
                    setError(data.status === 'OK' ? 'Invalid response format' : (data.status || 'Error fetching data'));
                    setReviewerStats([]);
                }
            } catch (error) {
                console.error('Failed to fetch reviewer stats:', error);
                setError('Failed to fetch data. Please try again.');
                setReviewerStats([]);
            } finally {
                setLoading(false);
            }
        };

        fetchReviewerStats();
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
                <h2 className="text-xl font-semibold text-gray-800">Reviewer Statistics</h2>
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
                ) : reviewerStats.length === 0 ? (
                    <div className="text-center py-4">No data available for the selected date.</div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Reviewer
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Approved
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Rejected
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    New
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Reviewed
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {reviewerStats.map((stat, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {stat.reviewer_name || stat.reviewer}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {stat.approved}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {stat.rejected}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {stat.new}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {stat.total}
                                    </td>
                                </tr>
                            ))}
                            <tr className="bg-gray-50 font-medium">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    Total
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {reviewerStats.reduce((sum, stat) => sum + stat.approved, 0)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {reviewerStats.reduce((sum, stat) => sum + stat.rejected, 0)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {reviewerStats.reduce((sum, stat) => sum + stat.new, 0)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {reviewerStats.reduce((sum, stat) => sum + stat.total, 0)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
} 