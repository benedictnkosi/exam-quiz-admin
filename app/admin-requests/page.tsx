'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { requestAdminAccess, getPendingAdminRequests, approveAdminRequest } from '@/services/api'

export default function AdminRequestsPage() {
  const { user } = useAuth()
  const [pendingRequests, setPendingRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchPendingRequests = async () => {
    try {
      const data = await getPendingAdminRequests()
      setPendingRequests(data)
    } catch (err) {
      console.error('Failed to fetch pending requests:', err)
      setError('Failed to load pending requests')
    }
  }

  const handleRequestAccess = async () => {
    if (!user?.uid) return;

    setLoading(true)
    try {
      await requestAdminAccess(user.uid)
      alert('Admin access requested successfully')
    } catch (err) {
      console.error('Failed to request admin access:', err)
      setError('Failed to request admin access')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (userId: string) => {
    if (!user?.uid) return;

    try {
      await approveAdminRequest(userId, user.uid)
      fetchPendingRequests()
      alert('Admin request approved successfully')
    } catch (err) {
      console.error('Failed to approve request:', err)
      setError('Failed to approve request')
    }
  }

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchPendingRequests()
    }
  }, [user])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Requests</h1>

      {user?.role !== 'admin' && (
        <div className="mb-8">
          <button
            onClick={handleRequestAccess}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Requesting...' : 'Request Admin Access'}
          </button>
        </div>
      )}

      {error && (
        <div className="text-red-600 mb-4">{error}</div>
      )}

      {user?.role === 'admin' && (
        <div className="bg-white shadow rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingRequests.map((request: any) => (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleApprove(request.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Approve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
} 