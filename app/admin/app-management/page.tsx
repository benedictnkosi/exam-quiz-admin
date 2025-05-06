'use client'

import React from 'react'
import Sidebar from '../../../components/layout/Sidebar'
import AdminRoute from '../../../components/auth/AdminRoute'
import SubjectRequestPieChart from '../../../components/dashboard/SubjectRequestPieChart'
import ReportedMessagesTable from '../../../components/dashboard/ReportedMessagesTable'

export default function AppManagementPage() {
    return (
        <AdminRoute>
            <div className="flex">
                <Sidebar />
                <div className="flex-1 p-6">
                    <h1 className="text-2xl font-semibold mb-6">App Management</h1>

                    <div className="grid grid-cols-1 gap-6">
                        <SubjectRequestPieChart />
                        <ReportedMessagesTable />
                    </div>
                </div>
            </div>
        </AdminRoute>
    )
} 