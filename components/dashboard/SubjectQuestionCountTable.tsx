'use client'
import React, { useEffect, useState } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { HOST_URL } from '@/services/api'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useAuth } from '@/contexts/AuthContext'
import ConfirmationDialog from '@/components/common/ConfirmationDialog'
import GradeQuestionCountCards from './GradeQuestionCountCards'
import QuestionDetailsModal from './QuestionDetailsModal'

interface SubjectQuestionCount {
    subject_name: string
    grade: string
    current_question_count: number
    remaining_questions_needed: number
    capturer: string | null
    subject_id: number
}

interface GradeCount {
    grade: string
    total_remaining_questions_needed: number
}

interface QuestionCount {
    year: number
    term: number
    count: number
}

export default function SubjectQuestionCountTable() {
    const [data, setData] = useState<SubjectQuestionCount[]>([])
    const [gradeCounts, setGradeCounts] = useState<GradeCount[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedTerm, setSelectedTerm] = useState("2")
    const { user } = useAuth()
    const [showConfirmation, setShowConfirmation] = useState(false)
    const [selectedSubject, setSelectedSubject] = useState<SubjectQuestionCount | null>(null)
    const [showQuestionDetails, setShowQuestionDetails] = useState(false)
    const [questionCounts, setQuestionCounts] = useState<QuestionCount[]>([])

    const handleAssign = async (subjectId: number) => {
        try {
            const response = await fetch(`${HOST_URL}/api/subjects/${subjectId}/assign/${user?.uid}`, {
                method: 'POST'
            })
            const result = await response.json()
            if (result.status === 'success') {
                // Refresh the data after successful assignment
                const updatedResponse = await fetch(`${HOST_URL}/api/subjects/questions/count/${selectedTerm}`)
                const updatedResult = await updatedResponse.json()
                if (updatedResult.status === 'success') {
                    setData(updatedResult.data.subjects)
                    setGradeCounts([
                        {
                            grade: 'Grade 12',
                            total_remaining_questions_needed: updatedResult.data.total_remaining_questions_needed_grade12
                        },
                        {
                            grade: 'Grade 11',
                            total_remaining_questions_needed: updatedResult.data.total_remaining_questions_needed_grade11
                        },
                        {
                            grade: 'Grade 10',
                            total_remaining_questions_needed: updatedResult.data.total_remaining_questions_needed_grade10
                        }
                    ])
                }
            } else {
                console.log(result.message)
            }
        } catch (error) {
            console.error('Error assigning subject:', error)
        }
    }

    const handleAssignClick = (subject: SubjectQuestionCount) => {
        if (subject.capturer) {
            setSelectedSubject(subject)
            setShowConfirmation(true)
        } else {
            handleAssign(subject.subject_id)
        }
    }

    const handleQuestionCountClick = async (subjectId: number, subjectName: string) => {
        try {
            const response = await fetch(`${HOST_URL}/api/questions/count/${subjectId}`)
            const result = await response.json()
            if (result.status === 'OK') {
                setQuestionCounts(result.data)
                setSelectedSubject({ ...selectedSubject!, subject_name: subjectName })
                setShowQuestionDetails(true)
            }
        } catch (error) {
            console.error('Error fetching question counts:', error)
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${HOST_URL}/api/subjects/questions/count/${selectedTerm}`)
                const result = await response.json()
                if (result.status === 'success') {
                    setData(result.data.subjects)
                    setGradeCounts([
                        {
                            grade: 'Grade 12',
                            total_remaining_questions_needed: result.data.total_remaining_questions_needed_grade12
                        },
                        {
                            grade: 'Grade 11',
                            total_remaining_questions_needed: result.data.total_remaining_questions_needed_grade11
                        },
                        {
                            grade: 'Grade 10',
                            total_remaining_questions_needed: result.data.total_remaining_questions_needed_grade10
                        }
                    ])
                }
            } catch (error) {
                console.error('Error fetching subject question counts:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [selectedTerm])

    if (loading) {
        return <div>Loading...</div>
    }

    return (
        <div className="space-y-4">
            <GradeQuestionCountCards gradeCounts={gradeCounts} />
            <div className="flex items-center space-x-2">
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Term" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">Term 1</SelectItem>
                        <SelectItem value="2">Term 2</SelectItem>
                        <SelectItem value="3">Term 3</SelectItem>
                        <SelectItem value="4">Term 4</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Subject</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead className="text-right">Question Count</TableHead>
                            <TableHead>Capturer</TableHead>
                            <TableHead>Assign</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell>{item.subject_name}</TableCell>
                                <TableCell>{item.grade}</TableCell>
                                <TableCell className="text-right">
                                    <button
                                        onClick={() => handleQuestionCountClick(item.subject_id, item.subject_name)}
                                        className="text-blue-500 hover:text-blue-700 hover:underline"
                                    >
                                        {item.current_question_count}
                                    </button>
                                </TableCell>
                                <TableCell>
                                    {item.capturer ? (
                                        item.capturer
                                    ) : (
                                        <span className="text-gray-500">Not Assigned</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <button
                                        className={`px-4 py-2 rounded-md ${item.current_question_count > 189
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-blue-500 hover:bg-blue-600'
                                            } text-white`}
                                        onClick={() => handleAssignClick(item)}
                                        disabled={item.current_question_count > 189}
                                    >
                                        {item.current_question_count > 189 ? 'Maximum Questions Reached' : 'Assign to me'}
                                    </button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <ConfirmationDialog
                isOpen={showConfirmation}
                onClose={() => setShowConfirmation(false)}
                onConfirm={() => {
                    if (selectedSubject) {
                        handleAssign(selectedSubject.subject_id)
                        setShowConfirmation(false)
                    }
                }}
                title="Confirm Assignment"
                message={`This subject is currently assigned to ${selectedSubject?.capturer}. Are you sure you want to reassign it to yourself?`}
            />

            <QuestionDetailsModal
                isOpen={showQuestionDetails}
                onClose={() => setShowQuestionDetails(false)}
                subjectName={selectedSubject?.subject_name || ''}
                questionCounts={questionCounts}
            />
        </div>
    )
} 