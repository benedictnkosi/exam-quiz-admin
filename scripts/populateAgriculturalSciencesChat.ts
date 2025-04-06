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

// Grade 10 Agricultural Sciences - Basic Plant Production
const grade10Conversation = [
    {
        userName: 'Lerato',
        text: 'Ms. Nkosi, I\'m having trouble understanding soil types and their importance for crop production. Can you explain the different soil types we have in South Africa?'
    },
    {
        userName: 'Ms. Nkosi',
        text: 'In South Africa, we mainly have three types of soil: sandy soil, clay soil, and loam soil. Sandy soil drains quickly but doesn\'t hold nutrients well. Clay soil holds water and nutrients but can become waterlogged. Loam soil is the ideal mix of sand, silt, and clay - it has good drainage and nutrient retention.'
    },
    {
        userName: 'Thabo',
        text: 'So that\'s why my father adds compost to our sandy soil - to improve its water and nutrient holding capacity!'
    },
    {
        userName: 'Ms. Nkosi',
        text: 'Exactly! Organic matter like compost helps improve soil structure and fertility. It\'s especially important in our region where we often have sandy soils. Different crops also prefer different soil types - for example, maize grows well in loam soil, while certain vegetables prefer sandy loam.'
    },
    {
        userName: 'Zanele',
        text: 'And we can test soil pH to know if we need to add lime or sulfur to adjust it for specific crops, right?'
    },
    {
        userName: 'Ms. Nkosi',
        text: 'Yes! Most crops prefer a pH between 6.0 and 7.0. If the soil is too acidic (low pH), we add lime. If it\'s too alkaline (high pH), we add sulfur. This helps plants absorb nutrients properly.'
    }
];

// Grade 11 Agricultural Sciences - Animal Production
const grade11Conversation = [
    {
        userName: 'Thabo',
        text: 'Mr. Mthembu, I\'m confused about the different cattle breeds in South Africa and their characteristics. Can you explain the main breeds we use?'
    },
    {
        userName: 'Mr. Mthembu',
        text: 'We have several important breeds in South Africa. The Nguni is our indigenous breed - very hardy and disease-resistant. The Bonsmara is a local breed developed for beef production. Then we have imported breeds like the Hereford and Angus for beef, and the Holstein for dairy. Each has its own advantages depending on the farming system.'
    },
    {
        userName: 'Lerato',
        text: 'So the Nguni is good for small-scale farmers because it can handle our climate and diseases well, while the Bonsmara is better for commercial beef production?'
    },
    {
        userName: 'Mr. Mthembu',
        text: 'Exactly! The Nguni is perfect for extensive farming systems and communal areas. It has good tick resistance and can survive on poorer quality grazing. The Bonsmara, on the other hand, has been bred for better growth rates and carcass quality, making it ideal for commercial beef production.'
    },
    {
        userName: 'Zanele',
        text: 'And we need to consider factors like climate, available grazing, and market requirements when choosing a breed, right?'
    },
    {
        userName: 'Mr. Mthembu',
        text: 'Yes! That\'s called breed selection. We also need to consider the farming system, available resources, and management skills. A good farmer matches the breed to their specific conditions and market needs.'
    }
];

// Grade 12 Agricultural Sciences - Agricultural Management
const grade12Conversation = [
    {
        userName: 'Zanele',
        text: 'Ms. Nkosi, I\'m having trouble understanding sustainable farming practices. Can you explain how we can farm more sustainably in South Africa?'
    },
    {
        userName: 'Ms. Nkosi',
        text: 'Sustainable farming involves several key practices: crop rotation to maintain soil health, conservation tillage to prevent soil erosion, integrated pest management to reduce chemical use, and water conservation techniques like drip irrigation. We also need to consider climate change adaptation strategies.'
    },
    {
        userName: 'Thabo',
        text: 'So like using cover crops to protect the soil and add organic matter, and planting drought-resistant crop varieties?'
    },
    {
        userName: 'Ms. Nkosi',
        text: 'Exactly! And we can also use precision agriculture techniques - using technology to apply inputs like water and fertilizer more efficiently. This reduces waste and environmental impact while maintaining productivity.'
    },
    {
        userName: 'Lerato',
        text: 'And sustainable farming isn\'t just about the environment - it\'s also about economic viability and social responsibility, right?'
    },
    {
        userName: 'Ms. Nkosi',
        text: 'Yes! That\'s the triple bottom line of sustainability: environmental, economic, and social. We need to ensure farming is profitable, environmentally friendly, and benefits the community. This includes fair labor practices and contributing to food security.'
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
            subjectName: "Agricultural Sciences",
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
async function populateAllAgriculturalSciencesConversations() {
    try {
        // First authenticate
        console.log('Authenticating...');
        await signInWithEmailAndPassword(auth, 'test02@gmail.com', 'password');

        // Populate conversations for each grade
        console.log('Creating conversations...');
        await populateConversation(10, 'Basic Plant Production', grade10Conversation);
        await populateConversation(11, 'Animal Production', grade11Conversation);
        await populateConversation(12, 'Agricultural Management', grade12Conversation);

        console.log('Finished adding all conversations');
    } catch (error) {
        console.error('Error in conversation population:', error);
        process.exit(1);
    }
}

// Run the script
populateAllAgriculturalSciencesConversations().then(() => {
    console.log('Script completed successfully');
    process.exit(0);
}).catch((error) => {
    console.error('Error running script:', error);
    process.exit(1);
}); 