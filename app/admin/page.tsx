'use client'
import React from 'react'
import ReviewerStatsTable from '../../components/dashboard/ReviewerStatsTable'
import QuestionStatsTable from '../../app/components/dashboard/QuestionStatsTable'
import Sidebar from '../../components/layout/Sidebar'
import AdminRoute from '../../components/auth/AdminRoute'
import SubjectQuestionCountTable from '../../components/dashboard/SubjectQuestionCountTable'

export default function AdminDashboard() {
    return (
        <AdminRoute>
            <div className="flex">
                <Sidebar />
                <div className="flex-1 p-6">
                    <h1 className="text-2xl font-semibold mb-6">Admin Dashboard</h1>



                    <div className="grid grid-cols-1 gap-6 mt-6">
                        <QuestionStatsTable />
                        <ReviewerStatsTable />
                        <SubjectQuestionCountTable />
                    </div>
                </div>
            </div>
        </AdminRoute>
    )
} 