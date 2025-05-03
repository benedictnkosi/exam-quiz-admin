import { NextResponse } from 'next/server';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { API_BASE_URL, API_HOST } from '@/config/constants';
import { HOST_URL } from '@/services/api';
import { COMPILER_INDEXES } from 'next/dist/shared/lib/constants';

const firebaseConfig = {
    apiKey: "AIzaSyA19oZVV-JIleL-XlEbDK8k-KPNk1vod8E",
    authDomain: "exam-quiz-b615e.firebaseapp.com",
    projectId: "exam-quiz-b615e",
    storageBucket: "exam-quiz-b615e.firebasestorage.app",
    messagingSenderId: "619089624841",
    appId: "1:619089624841:web:8cdb542ea7c8eb22681dd8",
    measurementId: "G-MR80CKN8H9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function getTopic(grade: number, term: number) {
    try {
        const url = new URL(`${HOST_URL}/api/topics/unposted/most-questions?grade=${grade}&term=${term}`);


        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching topic:', error);
        throw error;
    }
}

async function createThread(title: string, subjectName: string, grade: number) {
    try {
        const threadData = {
            createdAt: Timestamp.fromDate(new Date()),
            createdById: "OY3G9wydrNesx8nvbOyAKaFjlmJ2",
            createdByName: "Siya Da AI",
            grade: grade,
            subjectName: subjectName,
            title: title
        };

        const docRef = await addDoc(collection(db, 'threads'), threadData);
        return docRef.id;
    } catch (error) {
        console.error('Error creating thread: ', error);
        throw error;
    }
}

async function addMessage(threadId: string, message: string) {
    try {
        const data = {
            authorUID: "OY3G9wydrNesx8nvbOyAKaFjlmJ2",
            createdAt: Timestamp.fromDate(new Date()),
            text: message,
            threadId: threadId,
            userName: "Siya The AI"
        };

        await addDoc(collection(db, 'messages'), data);
    } catch (error) {
        console.error('Error adding message: ', error);
        throw error;
    }
}

async function sendPushNotification(subjectName: string, threadTitle: string, uid: string) {
    try {
        const response = await fetch(`${API_HOST}/api/push-notifications/new-thread`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                subject_name: subjectName,
                thread_title: threadTitle,
                uid: uid,
                grade: 12,
            })
        });

        if (!response.ok) {
            console.error('Push notification failed:', response.status);
        }
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
}

async function updateTopicPostedDate(topicId: string) {
    try {
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().replace('T', ' ').split('.')[0];

        const response = await fetch(`${HOST_URL}/api/topics/${topicId}/posted-date`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                postedDate: formattedDate
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error updating topic posted date:', error);
        throw error;
    }
}

async function checkExistingThread(title: string, subjectName: string, grade: number) {
    try {
        const threadsRef = collection(db, 'threads');
        const q = query(
            threadsRef,
            where('title', '==', title),
            where('subjectName', '==', subjectName),
            where('grade', '==', grade)
        );
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    } catch (error) {
        console.error('Error checking existing thread:', error);
        throw error;
    }
}

function mapGrade(grade: number): number {
    const gradeMap: { [key: number]: number } = {
        1: 12,
        2: 11,
        3: 10
    };
    return gradeMap[grade] || grade;
}

function cleanSubjectName(subjectName: string): string {
    return subjectName.replace(/P[12]/g, '').trim();
}

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const grade = parseInt(url.searchParams.get('grade') || '');
        const term = parseInt(url.searchParams.get('term') || '');

        if (!grade || !term) {
            return NextResponse.json(
                { error: 'Grade and term are required' },
                { status: 400 }
            );
        }

        await signInWithEmailAndPassword(auth, 'test02@gmail.com', 'password');

        const topicData = await getTopic(grade, term);
        const topic = topicData.topic;

        if (!topic) {
            return NextResponse.json(
                { error: 'No unposted topics found' },
                { status: 404 }
            );
        }

        const title = `${topic.subTopic}`;
        const subjectName = cleanSubjectName(topic.subject.name);
        const mappedGrade = mapGrade(grade);

        // Check if thread already exists
        const threadExists = await checkExistingThread(title, subjectName, mappedGrade);
        if (threadExists) {
            // Update the topic's posted date even if thread exists
            const response = await updateTopicPostedDate(topic.id);
            console.log(response);
            return NextResponse.json(
                { error: 'Thread with this title already exists' },
                { status: 409 }
            );
        }

        const threadId = await createThread(title, subjectName, mappedGrade);
        const keyLesson = `Let's discuss ${topic.subTopic} in ${subjectName}. This is an important topic that will help you understand ${topic.name}.`;

        await addMessage(threadId, keyLesson);

        // Update the topic's posted date
        const response = await updateTopicPostedDate(topic.id);
        console.log(response);

        // sendPushNotification(subjectName, title, "wBX5XFbzUCNGJgewnOVemIw9EOv2").catch(error => {
        //     console.error('Error in push notification:', error);
        // });

        return NextResponse.json({
            success: true,
            threadId,
            topic: {
                id: topic.id,
                name: topic.name,
                subTopic: topic.subTopic,
                subject: {
                    ...topic.subject,
                    name: subjectName
                }
            }
        });
    } catch (error) {
        console.error('Error in conversation population:', error);
        return NextResponse.json(
            { error: 'Failed to create thread' },
            { status: 500 }
        );
    }
} 