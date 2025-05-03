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
        const url = new URL(`${API_BASE_URL}/topics/unposted/most-questions`);
        url.searchParams.append('grade', '12');
        url.searchParams.append('term', '2');

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

// Main function to create thread and populate conversation
async function populateConversation() {
    try {
        await signInWithEmailAndPassword(auth, 'test02@gmail.com', 'password');

        const topicData = await getQuestion();
        const topic = topicData.topic;

        if (!topic) {
            console.error('No unposted topics found');
            process.exit(1);
        }

        const title = `${topic.name} - ${topic.subTopic}`;
        const subjectName = topic.subject.name;

        const threadId = await createThread(title, subjectName);
        const keyLesson = `Let's discuss ${topic.subTopic} in ${topic.subject.name}. This is an important topic that will help you understand ${topic.name}.`;

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
populateConversation().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error('Error running script:', error);
    process.exit(1);
}); 