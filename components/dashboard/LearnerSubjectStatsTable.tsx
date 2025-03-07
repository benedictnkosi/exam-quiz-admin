import { API_BASE_URL } from '@/config/constants';
import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface SubjectCounts {
    new: number;
    approved: number;
    rejected: number;
}

interface SubjectStats {
    subject: string;
    counts: SubjectCounts;
    total: number;
}

interface LearnerStats {
    capturer: string;
    subjects: SubjectStats[];
    total_questions: number;
}

interface StatsResponse {
    status: string;
    data: LearnerStats[];
    from_date: string;
}

export default function LearnerSubjectStatsTable() {
    const [stats, setStats] = useState<LearnerStats[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date>(() => {
        const date = new Date('2024-01-01T00:00:00.000Z');
        return date;
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const formattedDate = selectedDate.toISOString().split('T')[0];
                const response = await fetch(`${API_BASE_URL}/questions-per-learner-subject?from_date=${formattedDate}`);
                const data: StatsResponse = await response.json();
                if (data.status === 'OK') {
                    setStats(data.data);
                }
            } catch (error) {
                console.error('Failed to fetch learner subject stats:', error);
            }
        };

        fetchStats();
    }, [selectedDate]);

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Questions per Learner and Subject</h2>
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">From Date:</span>
                    <DatePicker
                        selected={selectedDate}
                        onChange={(date: Date | null) => {
                            if (date) {
                                const newDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
                                setSelectedDate(newDate);
                            }
                        }}
                        className="border rounded-md p-2 text-sm"
                        dateFormat="yyyy-MM-dd"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                {stats.map((learner, index) => (
                    <div key={index} className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">{learner.capturer}</h3>
                            <span className="text-sm text-gray-500">Total Questions: {learner.total_questions}</span>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Subject
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
                                {learner.subjects.map((subject, subIndex) => (
                                    <tr key={subIndex} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {subject.subject}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                                            {subject.counts.new}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                                            {subject.counts.approved}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                            {subject.counts.rejected}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {subject.total}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
        </div>
    );
} 