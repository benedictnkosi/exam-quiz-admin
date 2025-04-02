'use client'

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { fetchMySubjects, getLearner } from '@/services/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MainMenu from '@/components/MainMenu';
import Image from 'next/image';

interface Subject {
    id: string;
    name: string;
    total_questions: number;
    answered_questions: number;
    correct_answers: number;
}

interface LearnerInfo {
    id: number;
    uid: string;
    name: string;
    grade: {
        id: number;
        number: number;
        active: number;
    };
    school_name: string;
    school_address: string;
    school_latitude: number;
    school_longitude: number;
    curriculum: string;
    terms: string;
    email: string;
    role?: string;
    points: number;
    streak: number;
    avatar: string;
}

// Helper function to get subject icon
function getSubjectIcon(subjectName: string): string {
  const nameMap: { [key: string]: string } = {
    'Physical Sciences': 'physics',
    'Agricultural Sciences': 'agriculture',
    'Mathematical Literacy': 'maths',
    'Life Sciences': 'life-science',
    'Business Studies': 'business-studies',
    'Life Orientation': 'life-orientation',
    'Economics': 'economics',
    'Geography': 'geography',
    'History': 'history',
    'Tourism': 'tourism',
    'Mathematics': 'mathematics'
  }

  const mappedName = nameMap[subjectName] || subjectName.toLowerCase().replace(/\s+/g, '-')
  return `/images/subjects/${mappedName}.png`
}

export default function ChatPage() {
    const { user } = useAuth();
    const { isDark } = useTheme();
    const router = useRouter();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [learnerGrade, setLearnerGrade] = useState<number | null>(null);
    const [learnerInfo, setLearnerInfo] = useState<LearnerInfo | null>(null);

    useEffect(() => {
        if (!user?.uid) {
            router.push('/login');
            return;
        }

        async function loadData() {
            try {
                setIsLoading(true);
                const [response, learnerData] = await Promise.all([
                    fetchMySubjects(user!.uid),
                    getLearner(user!.uid)
                ]);
                
                setLearnerGrade(learnerData.grade.number);
                setLearnerInfo(learnerData);
                console.log('Raw response:', response);
                
                if (response?.subjects && Array.isArray(response.subjects)) {
                    const subjectGroups = response.subjects.reduce((acc: Record<string, Subject>, curr) => {
                        if (!curr?.name) return acc;
                        const baseName = curr.name.split(' P')[0];
                        console.log('Processing subject:', curr.name, 'baseName:', baseName);

                        if (!acc[baseName]) {
                            acc[baseName] = {
                                id: curr.id.toString(),
                                name: baseName,
                                total_questions: curr.totalSubjectQuestions || 0,
                                answered_questions: curr.totalResults || 0,
                                correct_answers: curr.correctAnswers || 0
                            };
                        } else {
                            acc[baseName].total_questions += curr.totalSubjectQuestions || 0;
                            acc[baseName].answered_questions += curr.totalResults || 0;
                            acc[baseName].correct_answers += curr.correctAnswers || 0;
                        }
                        return acc;
                    }, {});

                    const groupedSubjects = Object.values(subjectGroups);
                    console.log('Grouped subjects:', groupedSubjects);
                    setSubjects(groupedSubjects);
                }
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadData();
    }, [user?.uid, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#1B1464]">
                <div className="max-w-4xl mx-auto">
                    <MainMenu learnerInfo={learnerInfo} />
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                        <span className="ml-4 text-white">Loading subjects...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#1B1464]">
            <div className="max-w-4xl mx-auto">
                <MainMenu learnerInfo={learnerInfo} />
                <div className="px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center gap-4 mb-6">
                        
                        <div className="bg-white/10 backdrop-blur-lg shadow rounded-lg p-6 flex-1">
                            <h1 className="text-2xl font-bold text-white">Study Buddies Chat 💬</h1>
                        </div>
                    </div>

                    <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-6">
                        <p className="text-red-200">
                            ⚠️ Let&apos;s keep it friendly and on topic! No profanity or bullying. Violations will lead to account suspension.
                        </p>
                    </div>

                    {subjects.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-300">No subjects available</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {subjects.map((subject) => (
                                <Link
                                    key={subject.id}
                                    href={`/threads/${subject.id}?subjectName=${encodeURIComponent(subject.name)}&grade=${learnerGrade}`}
                                    className="block bg-white/10 backdrop-blur-lg shadow rounded-lg p-4 hover:bg-white/20 transition-all"
                                >
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <img
                                                src={getSubjectIcon(subject.name)}
                                                alt={subject.name}
                                                className="h-10 w-10 rounded-full"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = '/images/subjects/default.png';
                                                }}
                                            />
                                        </div>
                                        <div className="ml-4 flex-1">
                                            <h3 className="text-lg font-medium text-white">
                                                {subject.name}
                                            </h3>
                                            <p className="text-sm text-gray-300">
                                                Tap to join chat
                                            </p>
                                        </div>
                                        <svg className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 