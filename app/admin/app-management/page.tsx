'use client'

import React from 'react'
import Sidebar from '../../../components/layout/Sidebar'
import AdminRoute from '../../../components/auth/AdminRoute'
import SubjectRequestPieChart from '../../../components/dashboard/SubjectRequestPieChart'
import ReportedMessagesTable from '../../../components/dashboard/ReportedMessagesTable'
import GradeSubjectDifficultyChart from '../../../components/dashboard/GradeSubjectDifficultyChart'
import GradeSubjectPopularityChart from '../../../components/dashboard/GradeSubjectPopularityChart'

export default function AppManagementPage() {
    return (
        <AdminRoute>
            <div className="flex">
                <Sidebar />
                <div className="flex-1 p-6">
                    <h1 className="text-2xl font-semibold mb-6">App Management</h1>

                    <div className="grid grid-cols-1 gap-6">
                        <SubjectRequestPieChart />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <GradeSubjectDifficultyChart grade={1} />
                            <GradeSubjectDifficultyChart grade={2} />
                            <GradeSubjectDifficultyChart grade={3} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <GradeSubjectPopularityChart grade={1} />
                            <GradeSubjectPopularityChart grade={2} />
                            <GradeSubjectPopularityChart grade={3} />
                        </div>
                        <ReportedMessagesTable />
                    </div>
                </div>
            </div>
        </AdminRoute>
    )
} 