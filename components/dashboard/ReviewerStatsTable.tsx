import { API_BASE_URL } from '@/config/constants';
import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface ReviewerStats {
    reviewer: string;
    approved: number;
    rejected: number;
    total: number;
    new: number;
}

interface ReviewerStatsResponse {
    status: string;
    data: ReviewerStats[];
}

export default function ReviewerStatsTable() {
    const [reviewerStats, setReviewerStats] = useState<ReviewerStats[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date>(() => {
        const date = new Date();
        // Get previous Saturday
        const day = date.getDay();
        const diff = (day === 0 ? -1 : 7 - day);
        date.setDate(date.getDate() - diff);
        return date;
    });

    useEffect(() => {
        const fetchReviewerStats = async () => {
            try {
                const formattedDate = selectedDate.toISOString().split('T')[0];
                const response = await fetch(`${API_BASE_URL}/questions-reviewed?from_date=${formattedDate}`);
                const data: ReviewerStatsResponse = await response.json();
                if (data.status === 'OK') {
                    setReviewerStats(data.data);
                }
            } catch (error) {
                console.error('Failed to fetch reviewer stats:', error);
            }
        };

        fetchReviewerStats();
    }, [selectedDate]);

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Reviewer Statistics</h2>
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">From Date:</span>
                    <DatePicker
                        selected={selectedDate}
                        onChange={(date: Date | null) => setSelectedDate(date || new Date())}
                        className="border rounded-md p-2 text-sm"
                        dateFormat="yyyy-MM-dd"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
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
                            <tr key={index} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {stat.reviewer}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className="text-green-600">{stat.approved}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className="text-red-600">{stat.rejected}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className="text-blue-600">{stat.new}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {stat.total}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                        <tr>
                            <td className="px-6 py-3 text-sm font-medium text-gray-900">
                                Total
                            </td>
                            <td className="px-6 py-3 text-sm text-green-600 font-medium">
                                {reviewerStats.reduce((sum, stat) => sum + stat.approved, 0)}
                            </td>
                            <td className="px-6 py-3 text-sm text-red-600 font-medium">
                                {reviewerStats.reduce((sum, stat) => sum + stat.rejected, 0)}
                            </td>
                            <td className="px-6 py-3 text-sm text-blue-600 font-medium">
                                {reviewerStats.reduce((sum, stat) => sum + stat.new, 0)}
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-900 font-medium">
                                {reviewerStats.reduce((sum, stat) => sum + stat.total, 0)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
} 