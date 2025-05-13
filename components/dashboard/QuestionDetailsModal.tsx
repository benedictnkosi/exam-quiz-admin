import React from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface QuestionCount {
    year: number
    term: number
    count: number
}

interface QuestionDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    subjectName: string
    questionCounts: QuestionCount[]
}

export default function QuestionDetailsModal({
    isOpen,
    onClose,
    subjectName,
    questionCounts
}: QuestionDetailsModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Question Count Details - {subjectName}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="mt-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Year</TableHead>
                                <TableHead>Term</TableHead>
                                <TableHead className="text-right">Question Count</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {questionCounts.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>{item.year}</TableCell>
                                    <TableCell>Term {item.term}</TableCell>
                                    <TableCell className="text-right">{item.count}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
} 