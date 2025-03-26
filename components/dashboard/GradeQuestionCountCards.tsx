'use client'
import React from 'react'

interface GradeQuestionCount {
    grade: string
    total_remaining_questions_needed: number
}

interface GradeQuestionCountCardsProps {
    gradeCounts: GradeQuestionCount[]
}

export default function GradeQuestionCountCards({ gradeCounts }: GradeQuestionCountCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {gradeCounts.map((gradeCount) => (
                <div
                    key={gradeCount.grade}
                    className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow"
                >
                    <div className="text-gray-600 font-medium">
                        Remaining Questions
                    </div>
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                        {gradeCount.total_remaining_questions_needed}
                    </div>
                    <div className="text-gray-600 font-medium">
                        {gradeCount.grade}
                    </div>
                </div>
            ))}
        </div>
    )
} 