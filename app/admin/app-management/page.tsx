'use client'

import React from 'react'
import Sidebar from '../../../components/layout/Sidebar'
import AdminRoute from '../../../components/auth/AdminRoute'
import SubjectRequestPieChart from '../../../components/dashboard/SubjectRequestPieChart'
import ReportedMessagesTable from '../../../components/dashboard/ReportedMessagesTable'
import GradeSubjectDifficultyChart from '../../../components/dashboard/GradeSubjectDifficultyChart'
import GradeSubjectPopularityChart from '../../../components/dashboard/GradeSubjectPopularityChart'
import TotalLearnersCard from '../../../components/dashboard/TotalLearnersCard'
import TotalQuestionsCard from '../../../components/dashboard/TotalQuestionsCard'
import DailyAnswersChart from '../../../components/dashboard/DailyAnswersChart'
import DailyRegistrationsChart from '../../../components/dashboard/DailyRegistrationsChart'
import LearnerActivityChart from '../../../components/dashboard/LearnerActivityChart'
import ResultGrowthChart from '../../../components/dashboard/ResultGrowthChart'
import AvgDailyGrowthCard from '../../../components/dashboard/AvgDailyGrowthCard'
import GrowthTargetCard from '../../../components/dashboard/GrowthTargetCard'
import FreeUsersHighActivityChart from '../../../components/dashboard/FreeUsersHighActivityChart'
import CompletedChaptersChart from '../../../components/dashboard/CompletedChaptersChart'

export default function AppManagementPage() {
    return (
        <AdminRoute>
            <div className="flex">
                <Sidebar />
                <div className="flex-1 p-6">
                    <h1 className="text-2xl font-semibold mb-6">App Management</h1>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <TotalQuestionsCard />
                        <TotalLearnersCard />
                        <AvgDailyGrowthCard />
                        <GrowthTargetCard />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <ResultGrowthChart />
                        <DailyAnswersChart />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <DailyRegistrationsChart />
                        <LearnerActivityChart />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <FreeUsersHighActivityChart />
                        <CompletedChaptersChart />
                    </div>

                    <div className="grid grid-cols-1 gap-6 mt-6">
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