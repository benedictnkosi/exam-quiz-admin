import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { API_BASE_URL, API_HOST } from '../../config/constants';

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

async function getQuestion() {
    try {
        const url = new URL(`${API_BASE_URL}/question/random-ai`);
        url.searchParams.append('uid', 'OY3G9wydrNesx8nvbOyAKaFjlmJ2');
        url.searchParams.append('subject_name', 'Agricultural Sciences');

        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching question:', error);
        throw error;
    }
}

// Function to create a new thread
async function createThread(title: string, subjectName: string) {
    try {
        const threadData = {
            createdAt: Timestamp.fromDate(new Date()),
            createdById: "OY3G9wydrNesx8nvbOyAKaFjlmJ2",
            createdByName: "Siya Da AI",
            grade: 12,
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

// Function to add a message to the thread
async function addMessage(threadId: string, message: string) {
    try {
        const data = {
            authorUID: "OY3G9wydrNesx8nvbOyAKaFjlmJ2",
            createdAt: Timestamp.fromDate(new Date()),
            text: message,
            threadId: threadId,
            userName: "System"
        };

        await addDoc(collection(db, 'messages'), data);
    } catch (error) {
        console.error('Error adding message: ', error);
        throw error;
    }
}

// Function to extract title and key lesson from AI explanation
function extractContent(aiExplanation: string) {
    // Get the first line and remove '#' characters
    const firstLine = aiExplanation.split('\n')[0];
    const title = firstLine ? firstLine.replace(/#/g, '').trim() : null;

    // Find the last '*' character and take everything after it
    const lastStarIndex = aiExplanation.lastIndexOf('*');
    const keyLesson = lastStarIndex !== -1 ? aiExplanation.substring(lastStarIndex + 1).trim() : null;

    return { title, keyLesson };
}

// Function to send push notification for new thread
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
                uid: uid
            })
        });

        if (!response.ok) {
            console.error('Push notification failed:', response.status);
        }
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
}

// Main function to create thread and populate conversation
async function populateAgriculturalSciencesConversation() {
    try {
        await signInWithEmailAndPassword(auth, 'siya@examquiz.co.za', 'password');

        let attempts = 0;
        const maxAttempts = 10;
        let questionData;
        let title;
        let keyLesson;
        let subjectName;

        while (attempts < maxAttempts) {
            attempts++;
            questionData = await getQuestion();
            subjectName = questionData.question.subject.name;

            const extracted = extractContent(questionData.question.ai_explanation);
            title = extracted.title;
            keyLesson = extracted.keyLesson;

            if (title && keyLesson) {
                break;
            }

            if (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        if (!title || !keyLesson) {
            console.error('Failed to extract both title and key lesson after', maxAttempts, 'attempts');
            process.exit(1);
        }

        const threadId = await createThread(title, subjectName);
        await addMessage(threadId, keyLesson);

        sendPushNotification(subjectName, title, "wBX5XFbzUCNGJgewnOVemIw9EOv2").catch(error => {
            console.error('Error in push notification:', error);
        });
    } catch (error) {
        console.error('Error in conversation population:', error);
        process.exit(1);
    }
}

// Run the script
populateAgriculturalSciencesConversation().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error('Error running script:', error);
    process.exit(1);
}); 