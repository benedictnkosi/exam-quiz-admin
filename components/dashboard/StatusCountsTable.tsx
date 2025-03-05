import { API_BASE_URL } from '@/config/constants';
import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface StatusCount {
    capturer: string;
    new: number;
    approved: number;
    rejected: number;
    total: number;
}

interface StatusCountsResponse {
    status: string;
    data: StatusCount[];
}

export default function StatusCountsTable() {
    const [statusCounts, setStatusCounts] = useState<StatusCount[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date>(() => {
        const date = new Date();
        // Get previous Saturday
        const day = date.getDay();
        const diff = (day === 0 ? -1 : 7 - day); // if Sunday, go back 1 day, otherwise go back to last Saturday
        date.setDate(date.getDate() - diff);
        return date;
    });

    useEffect(() => {
        const fetchStatusCounts = async () => {
            try {
                const formattedDate = selectedDate.toISOString().split('T')[0];
                const response = await fetch(`${API_BASE_URL}/question-status-counts?from_date=${formattedDate}`);
                const data: StatusCountsResponse = await response.json();
                if (data.status === 'OK') {
                    setStatusCounts(data.data);
                }
            } catch (error) {
                console.error('Failed to fetch status counts:', error);
            }
        };

        fetchStatusCounts();
    }, [selectedDate]);

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Question Status Counts</h2>
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Capturer
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                New
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Approved
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Rejected
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {statusCounts.map((count, index) => (
                            <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {count.capturer}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {count.new}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {count.approved}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {count.rejected}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {count.total}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
} 