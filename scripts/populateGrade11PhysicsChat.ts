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
    createdByName: "Sipho Zulu",
    grade: 11,
    subjectName: "Physical Sciences",
    title: "Understanding Newton's Laws of Motion"
};

// Sample users for the conversation
const userNames = ['Sipho Zulu', 'Prof. Sarah van der Merwe', 'Themba Khumalo'];
const authorUIDs = [
    'u65pX1a9KCbshI5VuprMcgVVfQI2',
    'XYZ123TeacherUID456789',
    'ABC987StudentUID123456'
];

// Physics-focused conversation about Newton's Laws
const conversationFlow = [
    {
        userName: 'Sipho Zulu',
        text: 'I\'m having trouble understanding Newton\'s First Law. Can someone explain it in simple terms?'
    },
    {
        userName: 'Prof. Sarah van der Merwe',
        text: 'Newton\'s First Law states that an object will remain at rest or in uniform motion in a straight line unless acted upon by an external force. Think of a soccer ball - it won\'t start moving until you kick it, and it won\'t stop until something (like friction or another player) stops it.'
    },
    {
        userName: 'Sipho Zulu',
        text: 'So if I push a book on a table, it moves because of my force, but then stops because of friction?'
    },
    {
        userName: 'Themba Khumalo',
        text: 'Exactly! The book stops because friction is an external force acting against its motion. In space, where there\'s no friction, objects would keep moving forever unless another force acts on them.'
    },
    {
        userName: 'Sipho Zulu',
        text: 'What about Newton\'s Second Law? I know it has something to do with force equals mass times acceleration.'
    },
    {
        userName: 'Prof. Sarah van der Merwe',
        text: 'Yes! F = ma tells us that the force needed to accelerate an object depends on its mass. For example, it takes more force to push a heavy box than a light one to achieve the same acceleration.'
    },
    {
        userName: 'Sipho Zulu',
        text: 'Can we solve a problem using F = ma? Like, if a 5 kg box is pushed with a force of 20 N, what\'s its acceleration?'
    },
    {
        userName: 'Themba Khumalo',
        text: 'Let\'s solve it! Using F = ma, we can rearrange to a = F/m. So a = 20 N / 5 kg = 4 m/s². The box will accelerate at 4 meters per second squared.'
    },
    {
        userName: 'Sipho Zulu',
        text: 'And what about Newton\'s Third Law? I heard it\'s about action and reaction.'
    },
    {
        userName: 'Prof. Sarah van der Merwe',
        text: 'Newton\'s Third Law states that for every action, there\'s an equal and opposite reaction. When you push against a wall, the wall pushes back with equal force. This is why you can\'t push through solid objects - they push back!'
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
async function populateGrade11PhysicsConversation() {
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
populateGrade11PhysicsConversation().then(() => {
    console.log('Script completed successfully');
    process.exit(0);
}).catch((error) => {
    console.error('Error running script:', error);
    process.exit(1);
}); 