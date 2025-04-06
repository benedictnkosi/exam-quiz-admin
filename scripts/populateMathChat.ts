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

// Sample users for the conversations
const userNames = ['Lerato', 'Mr. Dlamini', 'Thabo', 'Ms. Nkosi', 'Zanele', 'Mr. Mthembu'];
const authorUIDs = [
    'u65pX1a9KCbshI5VuprMcgVVfQI2',
    'XYZ123TeacherUID456789',
    'ABC987StudentUID123456',
    'DEF456TeacherUID789012',
    'GHI789StudentUID345678',
    'JKL012TeacherUID901234'
];

// Grade 10 Mathematics - Trigonometry
const grade10Conversation = [
    {
        userName: 'Lerato',
        text: 'Mr. Mthembu, I\'m struggling with trigonometric ratios. How do I know when to use sine, cosine, or tangent?'
    },
    {
        userName: 'Mr. Mthembu',
        text: 'Remember SOH-CAH-TOA! Sine = Opposite/Hypotenuse, Cosine = Adjacent/Hypotenuse, Tangent = Opposite/Adjacent. Look at what sides you have and what you need to find.'
    },
    {
        userName: 'Zanele',
        text: 'I use a little trick - if I need to find the opposite side, I use sine or tangent. If I need the adjacent side, I use cosine or tangent. And if I need the hypotenuse, I use sine or cosine!'
    },
    {
        userName: 'Mr. Mthembu',
        text: 'That\'s a great way to remember it! Let\'s try a problem: In a right-angled triangle, if the angle is 30° and the adjacent side is 5cm, what\'s the hypotenuse?'
    },
    {
        userName: 'Lerato',
        text: 'We need the hypotenuse and we have the adjacent side, so we use cosine! cos(30°) = adjacent/hypotenuse = 5/h. So h = 5/cos(30°).'
    }
];

// Grade 11 Mathematics - Functions
const grade11Conversation = [
    {
        userName: 'Thabo',
        text: 'Ms. Nkosi, I\'m having trouble understanding quadratic functions. How do I find the maximum or minimum point?'
    },
    {
        userName: 'Ms. Nkosi',
        text: 'For a quadratic function in the form f(x) = ax² + bx + c, the x-coordinate of the vertex (maximum or minimum) is given by x = -b/2a. Then you can substitute this x-value back into the function to find the y-coordinate.'
    },
    {
        userName: 'Zanele',
        text: 'And if a is positive, it\'s a minimum point, and if a is negative, it\'s a maximum point!'
    },
    {
        userName: 'Ms. Nkosi',
        text: 'Exactly! Let\'s try an example: Find the maximum point of f(x) = -2x² + 8x + 3.'
    },
    {
        userName: 'Thabo',
        text: 'First, x = -b/2a = -8/(2*-2) = 2. Then f(2) = -2(2)² + 8(2) + 3 = -8 + 16 + 3 = 11. So the maximum point is at (2, 11)!'
    }
];

// Grade 12 Mathematics - Calculus
const grade12Conversation = [
    {
        userName: 'Lerato',
        text: 'Mr. Mthembu, I\'m starting calculus and I\'m not sure about the difference between average and instantaneous rate of change.'
    },
    {
        userName: 'Mr. Mthembu',
        text: 'Think of it this way: average rate of change is like your average speed over a trip, while instantaneous rate of change is like your speed at a specific moment. Mathematically, average rate of change is (f(b)-f(a))/(b-a), while instantaneous rate of change is the derivative f\'(x).'
    },
    {
        userName: 'Thabo',
        text: 'So if we have a position function s(t), the average velocity would be the change in position over time, but the instantaneous velocity would be the derivative s\'(t)?'
    },
    {
        userName: 'Mr. Mthembu',
        text: 'Perfect! And acceleration would be the derivative of velocity, or the second derivative of position. This is why calculus is so powerful - it helps us understand how things change moment by moment.'
    }
];

// Function to create a new thread
async function createThread(grade: number, title: string) {
    try {
        const threadData = {
            createdAt: Timestamp.fromDate(new Date('2025-04-01T13:20:00+02:00')),
            createdById: authorUIDs[0],
            createdByName: userNames[0],
            grade: grade,
            subjectName: "Mathematics",
            title: title
        };

        const docRef = await addDoc(collection(db, 'threads'), threadData);
        console.log(`Thread created for grade ${grade} with ID: `, docRef.id);
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

// Function to populate a single conversation
async function populateConversation(grade: number, title: string, conversation: any[]) {
    try {
        const threadId = await createThread(grade, title);
        
        for (let i = 0; i < conversation.length; i++) {
            const delay = i * 60000; // One minute between messages
            await addSequentialMessage(threadId, conversation[i], delay);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    } catch (error) {
        console.error(`Error populating grade ${grade} conversation:`, error);
        throw error;
    }
}

// Main function to populate all conversations
async function populateAllMathConversations() {
    try {
        // First authenticate
        console.log('Authenticating...');
        await signInWithEmailAndPassword(auth, 'test02@gmail.com', 'password');

        // Populate conversations for each grade
        console.log('Creating conversations...');
        await populateConversation(10, 'Trigonometry', grade10Conversation);
        await populateConversation(11, 'Functions', grade11Conversation);
        await populateConversation(12, 'Calculus', grade12Conversation);

        console.log('Finished adding all conversations');
    } catch (error) {
        console.error('Error in conversation population:', error);
        process.exit(1);
    }
}

// Run the script
populateAllMathConversations().then(() => {
    console.log('Script completed successfully');
    process.exit(0);
}).catch((error) => {
    console.error('Error running script:', error);
    process.exit(1);
}); 