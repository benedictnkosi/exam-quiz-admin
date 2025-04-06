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

// Sample data for the thread
const threadData = {
    createdAt: Timestamp.fromDate(new Date('2025-04-01T13:20:00+02:00')),
    createdById: "u65pX1a9KCbshI5VuprMcgVVfQI2",
    createdByName: "Thabo",
    grade: 12,
    subjectName: "Physical Sciences",
    title: "Understanding Doppler Effect"
};

// Sample users for the conversation
const userNames = ['Thabo', 'Dr. Nomsa Patel', 'Lerato Ndlovu'];
const authorUIDs = [
    'u65pX1a9KCbshI5VuprMcgVVfQI2',
    'XYZ123TeacherUID456789',
    'ABC987StudentUID123456'
];

// Physics-focused conversation about Doppler Effect
const conversationFlow = [
    {
        userName: 'Thabo',
        text: 'Can someone help me understand the Doppler effect? I know it has something to do with sound waves changing frequency.'
    },
    {
        userName: 'Dr. Nomsa Patel',
        text: 'The Doppler effect is the change in frequency of a wave (like sound) when the source and observer are moving relative to each other. Think of an ambulance siren - it sounds higher pitched when coming toward you and lower pitched when moving away.'
    },
    {
        userName: 'Thabo',
        text: 'Oh, I see! So is that why the pitch of the siren changes as the ambulance passes by?'
    },
    {
        userName: 'Lerato Ndlovu',
        text: 'Exactly! When the ambulance moves toward you, the sound waves are compressed (wavelength decreases, frequency increases). When it moves away, the waves are stretched out (wavelength increases, frequency decreases).'
    },
    {
        userName: 'Thabo',
        text: 'Can we solve a problem using the Doppler effect formula? I have one from my textbook.'
    },
    {
        userName: 'Dr. Nomsa Patel',
        text: 'Sure! The formula is f = f₀[(v ± vᵣ)/(v ± vₛ)], where f₀ is the original frequency, v is the speed of sound, vᵣ is receiver velocity, and vₛ is source velocity. Share your problem!'
    },
    {
        userName: 'Thabo',
        text: 'If a source emits sound at 500 Hz and moves away from a stationary observer at 20 m/s, what frequency will the observer hear? (Speed of sound = 340 m/s)'
    },
    {
        userName: 'Lerato Ndlovu',
        text: 'Let\'s solve this step by step! Since the source is moving away, we use: f = 500[(340)/(340 + 20)] = 471.7 Hz'
    },
    {
        userName: 'Thabo',
        text: 'Thanks! I understand now why the frequency decreases - the waves are being stretched out as the source moves away.'
    },
    {
        userName: 'Dr. Nomsa Patel',
        text: 'Excellent! The Doppler effect also applies to light waves - this is how astronomers know that galaxies are moving away from us (red shift) or toward us (blue shift).'
    }
];

// Function to create a new thread
async function createThread() {
    try {
        const docRef = await addDoc(collection(db, 'threads'), threadData);
        console.log('Thread created with ID: ', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error creating thread: ', error);
        throw error;
    }
}

// Function to add a message to the thread
async function addSequentialMessage(threadId: string, messageData: any, delay: number) {
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

// Main function to create thread and populate conversation
async function populatePhysicsConversation() {
    try {
        // First authenticate
        console.log('Authenticating...');
        await signInWithEmailAndPassword(auth, 'test02@gmail.com', 'password');

        // Create the thread
        console.log('Creating thread...');
        const threadId = await createThread();

        console.log('Adding conversation messages...');
        for (let i = 0; i < conversationFlow.length; i++) {
            // Add increasing delay for each message to maintain order
            const delay = i * 60000; // One minute between messages
            await addSequentialMessage(threadId, conversationFlow[i], delay);
            // Small delay in script execution to avoid overwhelming database
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log('Finished adding conversation');
    } catch (error) {
        console.error('Error in conversation population:', error);
        process.exit(1);
    }
}

// Run the script
populatePhysicsConversation().then(() => {
    console.log('Script completed successfully');
    process.exit(0);
}).catch((error) => {
    console.error('Error running script:', error);
    process.exit(1);
}); 