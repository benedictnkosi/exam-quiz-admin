import { API_BASE_URL } from '@/config/constants';
import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface Capturer {
    id: number;
    name: string;
    email: string;
}

interface Counts {
    new: number;
    approved: number;
    rejected: number;
    total: number;
}

interface CaptureData {
    capturer: Capturer;
    counts: Counts;
}

interface StatusCountsResponse {
    status: string;
    capturers: CaptureData[];
}

export default function StatusCountsTable() {
    const [capturers, setCapturers] = useState<CaptureData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
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
            setLoading(true);
            setError(null);

            try {
                const formattedDate = selectedDate.toISOString().split('T')[0];
                const response = await fetch(`${API_BASE_URL}/questions/status-counts?from_date=${formattedDate}`);
                const data: StatusCountsResponse = await response.json();

                if (data.status === 'OK' && Array.isArray(data.capturers)) {
                    setCapturers(data.capturers);
                } else {
                    setError(data.status === 'OK' ? 'Invalid response format' : (data.status || 'Error fetching data'));
                    setCapturers([]);
                }
            } catch (error) {
                console.error('Failed to fetch status counts:', error);
                setError('Failed to fetch data. Please try again.');
                setCapturers([]);
            } finally {
                setLoading(false);
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
                {loading ? (
                    <div className="text-center py-4">Loading...</div>
                ) : error ? (
                    <div className="text-center py-4 text-red-500">{error}</div>
                ) : capturers.length === 0 ? (
                    <div className="text-center py-4">No data available for the selected date.</div>
                ) : (
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
                            {capturers.map((item, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {item.capturer.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.counts.new}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.counts.approved}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.counts.rejected}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.counts.total}
                                    </td>
                                </tr>
                            ))}
                            <tr className="bg-gray-50 font-medium">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    Total
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {capturers.reduce((sum, item) => sum + item.counts.new, 0)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {capturers.reduce((sum, item) => sum + item.counts.approved, 0)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {capturers.reduce((sum, item) => sum + item.counts.rejected, 0)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {capturers.reduce((sum, item) => sum + item.counts.total, 0)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
} 