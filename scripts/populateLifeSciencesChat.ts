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

// Grade 10 Life Sciences - Cell Biology
const grade10Conversation = [
    {
        userName: 'Lerato',
        text: 'Ms. Nkosi, I\'m having trouble understanding the difference between plant and animal cells. Can you help explain the key differences?'
    },
    {
        userName: 'Ms. Nkosi',
        text: 'Of course! The main differences are: plant cells have a cell wall, chloroplasts, and a large central vacuole, while animal cells don\'t. Plant cells are usually rectangular, while animal cells are more rounded. Both have a nucleus, cytoplasm, and cell membrane though!'
    },
    {
        userName: 'Thabo',
        text: 'I remember! The chloroplasts are what make plants green because they contain chlorophyll for photosynthesis. And the cell wall gives plants their rigid structure!'
    },
    {
        userName: 'Ms. Nkosi',
        text: 'Exactly! And the large central vacuole in plant cells helps maintain turgor pressure and store water and nutrients. These differences are why plants can make their own food and stand upright!'
    },
    {
        userName: 'Zanele',
        text: 'So that\'s why plants can\'t move like animals - their cell walls make them rigid. But both types of cells still need to carry out basic life processes like respiration and protein synthesis, right?'
    },
    {
        userName: 'Ms. Nkosi',
        text: 'Perfect understanding! Both cell types share the same basic life processes, just with different structures to support their different lifestyles.'
    }
];

// Grade 11 Life Sciences - Human Physiology
const grade11Conversation = [
    {
        userName: 'Thabo',
        text: 'Mr. Mthembu, I\'m confused about how the heart works. Can you explain the cardiac cycle?'
    },
    {
        userName: 'Mr. Mthembu',
        text: 'The cardiac cycle has two main phases: diastole (relaxation) and systole (contraction). During diastole, the heart chambers fill with blood. During systole, the ventricles contract to pump blood out. The "lub-dub" sound you hear is the closing of the heart valves!'
    },
    {
        userName: 'Lerato',
        text: 'So the "lub" is the atrioventricular valves closing, and the "dub" is the semilunar valves closing?'
    },
    {
        userName: 'Mr. Mthembu',
        text: 'Exactly! And the electrical impulses that control this cycle start in the sinoatrial node, then travel through the atrioventricular node and the Purkinje fibers. This ensures the heart beats in a coordinated way.'
    },
    {
        userName: 'Zanele',
        text: 'That\'s why an ECG can show if there are problems with the heart\'s electrical system! The different waves show the different stages of the cardiac cycle.'
    },
    {
        userName: 'Mr. Mthembu',
        text: 'Perfect! The P wave shows atrial depolarization, the QRS complex shows ventricular depolarization, and the T wave shows ventricular repolarization. This helps doctors diagnose heart conditions.'
    }
];

// Grade 12 Life Sciences - Genetics and Evolution
const grade12Conversation = [
    {
        userName: 'Zanele',
        text: 'Ms. Nkosi, I\'m having trouble understanding natural selection. Can you explain how it leads to evolution?'
    },
    {
        userName: 'Ms. Nkosi',
        text: 'Natural selection works through four main principles: 1) Variation exists in populations, 2) Some variations are better suited to the environment, 3) Organisms produce more offspring than can survive, and 4) Those with favorable traits are more likely to survive and reproduce.'
    },
    {
        userName: 'Thabo',
        text: 'So like with the peppered moths in England during the Industrial Revolution - when the trees got darker from pollution, the dark moths survived better because they were camouflaged?'
    },
    {
        userName: 'Ms. Nkosi',
        text: 'Exactly! That\'s a perfect example of natural selection in action. The environment changed, and the population changed in response. Over many generations, this can lead to new species forming.'
    },
    {
        userName: 'Lerato',
        text: 'And this is different from Lamarck\'s theory because it\'s not about individual organisms changing during their lifetime, but about populations changing over generations through differential survival and reproduction?'
    },
    {
        userName: 'Ms. Nkosi',
        text: 'Yes! Lamarck thought acquired characteristics could be inherited, but Darwin showed that it\'s about inherited variations that give some individuals a survival advantage. This is why we see such amazing adaptations in nature!'
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
            subjectName: "Life Sciences",
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
async function populateAllLifeSciencesConversations() {
    try {
        // First authenticate
        console.log('Authenticating...');
        await signInWithEmailAndPassword(auth, 'test02@gmail.com', 'password');

        // Populate conversations for each grade
        console.log('Creating conversations...');
        await populateConversation(10, 'Cell Biology', grade10Conversation);
        await populateConversation(11, 'Human Physiology', grade11Conversation);
        await populateConversation(12, 'Genetics and Evolution', grade12Conversation);

        console.log('Finished adding all conversations');
    } catch (error) {
        console.error('Error in conversation population:', error);
        process.exit(1);
    }
}

// Run the script
populateAllLifeSciencesConversations().then(() => {
    console.log('Script completed successfully');
    process.exit(0);
}).catch((error) => {
    console.error('Error running script:', error);
    process.exit(1);
}); 