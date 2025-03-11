'use client'
import React from 'react'
import StatsCard from '@/components/dashboard/StatsCard'
import PendingApprovalsCard from '@/components/dashboard/PendingApprovalsCard'
import StatusCountsTable from '@/components/dashboard/StatusCountsTable'
import ReviewerStatsTable from '@/components/dashboard/ReviewerStatsTable'
import QuestionStatsTable from '@/app/components/dashboard/QuestionStatsTable'

export default function Dashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

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

      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <QuestionsPerWeekChart />
        <LearnersPerWeekChart />
      </div> */}

      <div className="grid grid-cols-1 gap-6 mt-6">
        <QuestionStatsTable />
        <StatusCountsTable />
        <ReviewerStatsTable />
      </div>
    </div>
  );
}
