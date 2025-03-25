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

interface SubjectQuestionCount {
    subject_name: string
    grade: string
    question_count: number
}

export default function SubjectQuestionCountTable() {
    const [data, setData] = useState<SubjectQuestionCount[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedTerm, setSelectedTerm] = useState("2")

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${HOST_URL}/api/subjects/questions/count/${selectedTerm}`)
                const result = await response.json()
                if (result.status === 'success') {
                    setData(result.data)
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
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell>{item.subject_name}</TableCell>
                                <TableCell>{item.grade}</TableCell>
                                <TableCell className="text-right">{item.question_count}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
} 