'use client'
import React from 'react'
import ReviewerStatsTable from '../../components/dashboard/ReviewerStatsTable'
import QuestionStatsTable from '../../app/components/dashboard/QuestionStatsTable'
import Sidebar from '../../components/layout/Sidebar'
import AdminRoute from '../../components/auth/AdminRoute'
import TotalLearnersCard from '../../components/dashboard/TotalLearnersCard'
import TotalQuestionsCard from '../../components/dashboard/TotalQuestionsCard'
import DailyAnswersChart from '../../components/dashboard/DailyAnswersChart'
import DailyRegistrationsChart from '../../components/dashboard/DailyRegistrationsChart'
import LearnerActivityChart from '../../components/dashboard/LearnerActivityChart'
import SubjectQuestionCountTable from '../../components/dashboard/SubjectQuestionCountTable'
import ResultGrowthChart from '../../components/dashboard/ResultGrowthChart'
import AvgDailyGrowthCard from '../../components/dashboard/AvgDailyGrowthCard'
import GrowthTargetCard from '../../components/dashboard/GrowthTargetCard'

export default function AdminDashboard() {
    return (
        <AdminRoute>
            <div className="flex">
                <Sidebar />
                <div className="flex-1 p-6">
                    <h1 className="text-2xl font-semibold mb-6">Admin Dashboard</h1>

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