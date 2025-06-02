'use client'
import React, { useState, useEffect } from 'react'
import Sidebar from '../../../components/layout/Sidebar'
import AdminRoute from '../../../components/auth/AdminRoute'
import { useAuth } from '../../../contexts/AuthContext'
import { HOST_URL } from '@/services/api'

interface Subscription {
    id: number
    created: string
    endDate: string
    paymentDate: string
    amount: string
    learner_id: number
    followMeCode: string
}

export default function SubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [upgradeLoading, setUpgradeLoading] = useState(false)
    const [upgradeFollowMeCode, setUpgradeFollowMeCode] = useState('')
    const [endDate, setEndDate] = useState(() => {
        const nextMonth = new Date()
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        return nextMonth.toISOString().split('T')[0]
    })
    const { user } = useAuth()

    useEffect(() => {
        fetchSubscriptions()
    }, [])

    const fetchSubscriptions = async () => {
        try {
            const response = await fetch(`${HOST_URL}/api/admin/subscriptions`)
            const data = await response.json()
            if (data.status === 'OK') {
                setSubscriptions(data.data)
            } else {
                setError('Failed to fetch subscriptions')
            }
        } catch (err) {
            setError('Error fetching subscriptions')
        } finally {
            setLoading(false)
        }
    }

    const handleUpgradeToGold = async () => {
        if (!user?.uid) {
            setError('User not authenticated')
            return
        }

        if (!upgradeFollowMeCode) {
            setError('Please enter a Follow Me Code')
            return
        }

        if (!endDate) {
            setError('Please select an end date')
            return
        }

        setUpgradeLoading(true)
        try {
            const response = await fetch(`${HOST_URL}/api/admin/subscriptions/add-gold`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    follow_me_code: upgradeFollowMeCode,
                    end_date: endDate,
                    admin_uid: user.uid
                }),
            })

            const data = await response.json()
            if (data.status === 'OK') {
                fetchSubscriptions() // Refresh the list
                setUpgradeFollowMeCode('') // Clear the input
                setError(null) // Clear any previous errors
            } else {
                setError(data.message || 'Failed to upgrade subscription')
            }
        } catch (err) {
            setError('Error upgrading subscription')
        } finally {
            setUpgradeLoading(false)
        }
    }

    const filteredSubscriptions = subscriptions.filter(sub =>
        sub.followMeCode.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <AdminRoute>
            <div className="flex">
                <Sidebar />
                <div className="flex-1 p-6">
                    <h1 className="text-2xl font-semibold mb-6">Subscription Management</h1>

                    {/* Upgrade to Gold Section */}
                    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                        <h2 className="text-xl font-semibold mb-4">Upgrade to Gold Subscription</h2>
                        <div className="flex gap-4 items-end">
                            <div className="flex-1">
                                <label htmlFor="followMeCode" className="block text-sm font-medium text-gray-700 mb-1">
                                    Follow Me Code
                                </label>
                                <input
                                    type="text"
                                    id="followMeCode"
                                    placeholder="Enter Follow Me Code..."
                                    className="w-full p-2 border rounded"
                                    value={upgradeFollowMeCode}
                                    onChange={(e) => setUpgradeFollowMeCode(e.target.value)}
                                />
                            </div>
                            <div className="flex-1">
                                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    id="endDate"
                                    className="w-full p-2 border rounded"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <button
                                onClick={handleUpgradeToGold}
                                disabled={upgradeLoading}
                                className="bg-blue-500 mt-4 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
                            >
                                {upgradeLoading ? 'Upgrading...' : 'Upgrade to Gold'}
                            </button>

                        </div>
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Subscriptions Table Section */}
                    <div className="bg-white rounded-lg shadow-md">
                        <div className="p-6">
                            <h2 className="text-xl font-semibold mb-4">All Subscriptions</h2>
                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder="Search by Follow Me Code..."
                                    className="w-full p-2 border rounded"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>



                            {loading ? (
                                <div>Loading...</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full bg-white border">
                                        <thead>
                                            <tr>
                                                <th className="px-6 py-3 border-b text-left">Follow Me Code</th>
                                                <th className="px-6 py-3 border-b text-left">Created</th>
                                                <th className="px-6 py-3 border-b text-left">End Date</th>
                                                <th className="px-6 py-3 border-b text-left">Payment Date</th>
                                                <th className="px-6 py-3 border-b text-left">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredSubscriptions.map((sub) => (
                                                <tr key={sub.id}>
                                                    <td className="px-6 py-4 border-b">{sub.followMeCode}</td>
                                                    <td className="px-6 py-4 border-b">
                                                        {new Date(sub.created).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 border-b">
                                                        {new Date(sub.endDate).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 border-b">
                                                        {new Date(sub.paymentDate).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 border-b">${sub.amount}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminRoute>
    )
} 