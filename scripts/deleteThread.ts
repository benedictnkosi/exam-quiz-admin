import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
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

async function deleteThreadAndMessages(threadId: string) {
    try {
        // First authenticate
        console.log('Authenticating...');
        await signInWithEmailAndPassword(auth, 'test02@gmail.com', 'password');

        console.log(`Deleting thread ${threadId} and its messages...`);

        // 1. Delete all messages associated with the thread
        const messagesRef = collection(db, 'messages');
        const q = query(messagesRef, where('threadId', '==', threadId));
        const querySnapshot = await getDocs(q);

        console.log(`Found ${querySnapshot.size} messages to delete`);

        const deletionPromises = querySnapshot.docs.map(async (document) => {
            console.log(`Deleting message ${document.id}`);
            await deleteDoc(doc(db, 'messages', document.id));
        });

        await Promise.all(deletionPromises);
        console.log('All messages deleted');

        // 2. Delete the thread itself
        await deleteDoc(doc(db, 'threads', threadId));
        console.log('Thread deleted');

        console.log('Thread and all associated messages have been deleted successfully');
    } catch (error) {
        console.error('Error in deletion:', error);
        process.exit(1);
    }
}

// Get threadId from command line argument
const threadId = process.argv[2];

if (!threadId) {
    console.error('Please provide a thread ID as a command line argument');
    process.exit(1);
}

// Run the deletion
deleteThreadAndMessages(threadId).then(() => {
    console.log('Script completed successfully');
    process.exit(0);
}).catch((error) => {
    console.error('Error running script:', error);
    process.exit(1);
}); 