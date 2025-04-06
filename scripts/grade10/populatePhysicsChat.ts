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
    createdByName: "Sipho",
    grade: 10,
    subjectName: "Physical Sciences",
    title: "Understanding Forces and Motion"
};

// Sample users for the conversation
const userNames = ['Sipho', 'Mr. Khumalo', 'Nomsa'];
const authorUIDs = [
    'u65pX1a9KCbshI5VuprMcgVVfQI2',
    'XYZ123TeacherUID456789',
    'ABC987StudentUID123456'
];

// Physics-focused conversation about Forces and Motion
const conversationFlow = [
    {
        userName: 'Sipho',
        text: 'Hi everyone! I\'m having trouble understanding Newton\'s First Law of Motion. Can someone help explain it?'
    },
    {
        userName: 'Mr. Khumalo',
        text: 'Of course! Newton\'s First Law, also called the Law of Inertia, states that an object will remain at rest or in uniform motion unless acted upon by an external force. Think of a soccer ball - it stays still until you kick it, and keeps moving until friction and air resistance slow it down.'
    },
    {
        userName: 'Nomsa',
        text: 'I like to think of it like this: when you\'re in a car and it suddenly stops, your body keeps moving forward because of inertia. That\'s why we need seatbelts!'
    },
    {
        userName: 'Sipho',
        text: 'Oh, that makes sense! So inertia is like the tendency of objects to keep doing what they\'re doing?'
    },
    {
        userName: 'Mr. Khumalo',
        text: 'Exactly! And the more mass an object has, the more inertia it has. That\'s why it\'s harder to push a heavy box than a light one.'
    },
    {
        userName: 'Sipho',
        text: 'Can we do a practice problem? What happens to a 2kg book on a table when you push it with 5N of force?'
    },
    {
        userName: 'Nomsa',
        text: 'We can use F=ma to solve this! If the force is 5N and mass is 2kg, then acceleration would be 2.5 m/s². But remember, this is only if there\'s no friction!'
    },
    {
        userName: 'Mr. Khumalo',
        text: 'Good point, Nomsa! In real life, we\'d need to consider friction. The book might not move at all if the static friction is greater than 5N.'
    },
    {
        userName: 'Sipho',
        text: 'This is really helpful! I think I understand forces and motion much better now.'
    },
    {
        userName: 'Mr. Khumalo',
        text: 'Great! Remember that these laws apply to everything around us - from sports to driving to space travel. Keep practicing and you\'ll master it!'
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