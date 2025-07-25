import { API_BASE_URL, API_HOST } from '@/config/constants';
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
    ai_questions_count: number;
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

interface LanguageStats {
    capturerName: string;
    questionCount: number;
}

interface LanguageStatsResponse {
    fromDate: string;
    endDate: string;
    stats: LanguageStats[];
}

interface WordRecordingStats {
    learnerId: number;
    learnerName: string;
    totalRecordings: number;
}

interface WordRecordingResponse {
    fromDate: string;
    endDate: string;
    report: WordRecordingStats[];
}

export default function QuestionStatsTable() {
    const [stats, setStats] = useState<StatsResponse['data'] | null>(null);
    const [languageStats, setLanguageStats] = useState<LanguageStats[]>([]);
    const [wordRecordingStats, setWordRecordingStats] = useState<WordRecordingStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedFromDate, setSelectedFromDate] = useState<Date>(() => {
        const date = new Date();
        const day = date.getDay();
        const diff = date.getDate() - day - 1; // Get last Saturday
        date.setDate(diff);
        return date;
    });
    const [selectedEndDate, setSelectedEndDate] = useState<Date>(() => {
        return new Date();
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const fromDate = selectedFromDate.toISOString().split('T')[0];
                const endDate = selectedEndDate.toISOString().split('T')[0];

                // Fetch all stats
                const [statsResponse, languageStatsResponse, wordRecordingResponse] = await Promise.all([
                    fetch(`${API_BASE_URL}/stats/questions?fromDate=${fromDate}&endDate=${endDate}`),
                    fetch(`${API_HOST}/api/language-questions/capturer/stats?fromDate=${fromDate}&endDate=${endDate}`),
                    fetch(`${API_HOST}/api/words/report/recordings?fromDate=${fromDate}&endDate=${endDate}`)
                ]);

                const statsData: StatsResponse = await statsResponse.json();
                const languageStatsData: LanguageStatsResponse = await languageStatsResponse.json();
                const wordRecordingData: WordRecordingResponse = await wordRecordingResponse.json();

                if (statsData.status === 'OK') {
                    setStats(statsData.data);
                    setLanguageStats(languageStatsData.stats);
                    setWordRecordingStats(wordRecordingData.report);
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
    }, [selectedFromDate, selectedEndDate]);

    if (loading) {
        return <div className="text-center p-4">Loading statistics...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500 p-4">{error}</div>;
    }

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
        <div className="bg-white rounded-lg shadow p-6 space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Questions Statistics</h2>
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
                                Object.entries(stats.subject_counts)
                                  .filter(([subject]) => !/accounting|computer applications|information technology|life orientation/i.test(subject))
                                  .map(([subject, count]) => (
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

                {/* Summary Section */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-md font-medium mb-3">Total Questions Summary</h4>
                    <div className="grid grid-cols-4 gap-4">
                        <div className="bg-white p-3 rounded shadow">
                            <div className="text-sm text-gray-500">Total Questions</div>
                            <div className="text-xl font-semibold">
                                {stats && Object.values(stats.capturer_stats).reduce((sum, capturer) => sum + capturer.total, 0)}
                            </div>
                        </div>
                        <div className="bg-white p-3 rounded shadow">
                            <div className="text-sm text-gray-500">Total AI Questions (R1)</div>
                            <div className="text-xl font-semibold">
                                {stats && Object.values(stats.capturer_stats).reduce((sum, capturer) => sum + (capturer.ai_questions_count || 0), 0)}
                            </div>
                        </div>
                        <div className="bg-white p-3 rounded shadow">
                            <div className="text-sm text-gray-500">Total Normal Questions (R3)</div>
                            <div className="text-xl font-semibold">
                                {stats && Object.values(stats.capturer_stats).reduce((sum, capturer) => sum + (capturer.total - (capturer.ai_questions_count || 0)), 0)}
                            </div>
                        </div>
                        <div className="bg-white p-3 rounded shadow">
                            <div className="text-sm text-gray-500">Total Due (Rands)</div>
                            <div className="text-xl font-semibold">
                                {stats && `R ${(
                                    Object.values(stats.capturer_stats)
                                        .filter(capturer => capturer.email !== 'nkosi@gmail.com')
                                        .reduce((sum, capturer) => {
                                            const aiQuestions = capturer.ai_questions_count || 0;
                                            const normalQuestions = capturer.total - aiQuestions;
                                            return sum + (aiQuestions * 1) + (normalQuestions * 3);
                                        }, 0) +
                                    languageStats
                                        .filter(stat => stat.capturerName !== 'Benedict Nkosi')
                                        .reduce((sum, stat) => sum + stat.questionCount, 0) +
                                    wordRecordingStats
                                        .filter(stat => stat.learnerName !== 'Benedict Nkosi')
                                        .reduce((sum, stat) => sum + (stat.totalRecordings * 3), 0)
                                ).toLocaleString()}`}
                            </div>
                        </div>
                    </div>
                </div>

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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Questions (R1)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Normal Questions (R3)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Due</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {stats && Object.entries(stats.capturer_stats).length > 0 ? (
                                Object.entries(stats.capturer_stats)
                                    .sort((a, b) => b[1].total - a[1].total)
                                    .map(([capturerId, capturer]) => {
                                        const aiQuestions = capturer.ai_questions_count || 0;
                                        const normalQuestions = capturer.total - aiQuestions;
                                        const totalDue = capturer.email === 'nkosi@gmail.com' ? 0 : (aiQuestions * 1) + (normalQuestions * 3);

                                        return (
                                            <tr key={capturerId}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {capturer.name}
                                                    <div className="text-xs text-gray-500">{capturer.email}</div>
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
                                                <td className="px-6 py-4 whitespace-naowrap text-sm text-gray-500">
                                                    {aiQuestions}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {normalQuestions}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    R {totalDue.toLocaleString()}
                                                </td>
                                            </tr>
                                        );
                                    })
                            ) : (
                                <tr>
                                    <td colSpan={9} className="px-6 py-4 text-center text-sm text-gray-500">
                                        No capturer statistics available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Language and Word Recording Statistics */}
            <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">Language Questions & Word Recording Statistics</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Language Questions</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Word Recordings</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Due</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {languageStats.length > 0 || wordRecordingStats.length > 0 ? (
                                <>
                                    {languageStats.map((stat, index) => {
                                        const wordRecording = wordRecordingStats.find(wr => wr.learnerName === stat.capturerName) || { totalRecordings: 0 };
                                        const isBenedict = stat.capturerName === 'Benedict Nkosi';
                                        const totalDue = isBenedict ? 'N/A' : `R ${(stat.questionCount + (wordRecording.totalRecordings * 3)).toLocaleString()}`;

                                        return (
                                            <tr key={`lang-${index}`}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {stat.capturerName}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {stat.questionCount}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {wordRecording.totalRecordings}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {totalDue}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {wordRecordingStats
                                        .filter(stat => !languageStats.some(ls => ls.capturerName === stat.learnerName))
                                        .map((stat, index) => (
                                            <tr key={`word-${index}`}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {stat.learnerName}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    0
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {stat.totalRecordings}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {stat.learnerName === 'Benedict Nkosi' ? 'N/A' : `R ${(stat.totalRecordings * 3).toLocaleString()}`}
                                                </td>
                                            </tr>
                                        ))
                                    }
                                </>
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                                        No statistics available
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