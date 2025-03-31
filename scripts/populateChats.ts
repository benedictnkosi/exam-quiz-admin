import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

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

// Sample data arrays - using fewer users for a focused conversation
const userNames = ['Test16', 'MathWhiz', 'AlgebraKing'];
const authorUIDs = [
    'SEvWWOLunQfQe2772FCSmZvUrz72',
    'KLmNoPqRsTuVwXyZ1234567890',
    'AbCdEfGhIjKlMnOpQrStUvWxYz'
];

// Single thread ID for the conversation
const threadId = 'ViKS5HjUeT9bj5fnNF1u';

// Sequential messages about solving for x
const conversationFlow = [
    {
        userName: 'Test16',
        text: 'Can someone help me solve this equation? 2x + 5 = 13'
    },
    {
        userName: 'MathWhiz',
        text: 'Sure! Let\'s solve it step by step. First, subtract 5 from both sides to isolate the term with x'
    },
    {
        userName: 'Test16',
        text: 'Okay, so that gives me 2x = 8, right?'
    },
    {
        userName: 'MathWhiz',
        text: 'Exactly! Now divide both sides by 2 to solve for x'
    },
    {
        userName: 'Test16',
        text: 'So x = 4! Did I get that right?'
    },
    {
        userName: 'AlgebraKing',
        text: 'Perfect! You can check by plugging 4 back into the original equation: 2(4) + 5 = 13'
    },
    {
        userName: 'Test16',
        text: 'Thanks! Can we try another one? How about 3x - 7 = 14'
    },
    {
        userName: 'MathWhiz',
        text: 'Go ahead and try solving it using the same steps we just learned!'
    },
    {
        userName: 'Test16',
        text: 'First I add 7 to both sides: 3x = 21'
    },
    {
        userName: 'Test16',
        text: 'Then divide by 3... so x = 7?'
    },
    {
        userName: 'AlgebraKing',
        text: 'Excellent work! You\'re getting really good at this!'
    },
    {
        userName: 'Test16',
        text: 'This makes so much more sense now. Can we try something harder next time?'
    }
];

async function addSequentialMessage(messageData: any, delay: number) {
    try {
        const userIndex = userNames.indexOf(messageData.userName);
        const data = {
            authorUID: authorUIDs[userIndex],
            createdAt: Timestamp.fromDate(new Date(Date.now() + delay)),
            text: messageData.text,
            threadId: threadId,
            userName: messageData.userName
        };

        const docRef = await addDoc(collection(db, 'messages'), data);
        console.log('Message added with ID: ', docRef.id);
    } catch (error) {
        console.error('Error adding message: ', error);
        throw error;
    }
}

// Function to add the conversation sequentially
async function populateConversation() {
    try {
        // First authenticate
        console.log('Authenticating...');
        // Replace with your admin email and password
        await signInWithEmailAndPassword(auth, 'test02@gmail.com', 'password');

        console.log('Adding conversation messages...');

        for (let i = 0; i < conversationFlow.length; i++) {
            // Add increasing delay for each message to maintain order
            const delay = i * 60000; // One minute between messages
            await addSequentialMessage(conversationFlow[i], delay);
            // Small delay in script execution to avoid overwhelming database
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log('Finished adding conversation');
    } catch (error) {
        console.error('Error in conversation population:', error);
        process.exit(1);
    }
}

// Add the conversation
populateConversation().then(() => {
    console.log('Script completed');
    process.exit(0);
}).catch((error) => {
    console.error('Error running script:', error);
    process.exit(1);
}); 