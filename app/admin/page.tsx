'use client'
import React from 'react'
import StatsCard from '@/components/dashboard/StatsCard'
import PendingApprovalsCard from '@/components/dashboard/PendingApprovalsCard'
import StatusCountsTable from '@/components/dashboard/StatusCountsTable'
import ReviewerStatsTable from '@/components/dashboard/ReviewerStatsTable'
import QuestionStatsTable from '@/app/components/dashboard/QuestionStatsTable'
import Sidebar from '@/components/layout/Sidebar'
import AdminRoute from '@/components/auth/AdminRoute'

export default function AdminDashboard() {
    return (
        <AdminRoute>
            <div className="flex">
                <Sidebar />
                <div className="flex-1 p-6">
                    <h1 className="text-2xl font-semibold mb-6">Admin Dashboard</h1>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <PendingApprovalsCard />
                        <StatsCard
                            title="Total Questions"
                            value="1,234"
                            description="Across all grades"
                        />
                        <StatsCard
                            title="Your Questions"
                            value="123"
                            description="Questions you've created"
                        />
                        <StatsCard
                            title="Registered Learners"
                            value="5,678"
                            description="Total app users"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-6 mt-6">
                        <QuestionStatsTable />
                        <StatusCountsTable />
                        <ReviewerStatsTable />
                    </div>
                </div>
            </div>
        </AdminRoute>
    )
} 