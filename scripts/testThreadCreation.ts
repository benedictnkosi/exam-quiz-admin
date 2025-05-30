import { createThreadAndPostMessage } from '@/services/threadService'

async function testThreadCreation() {
    try {
        const result = await createThreadAndPostMessage({
            threadName: "Welcome to Chronicles of dimpo",
            messageBody: "Welcome to our discussion about the Chronicles of dimpo! Feel free to share your thoughts and questions.",
            subjectName: "Chronicles of dimpo",
            grade: 12,
            createdById: "test-user-id", // Replace with actual user ID
            createdByName: "Test User" // Replace with actual user name
        })

        console.log('Thread created successfully:', result)
    } catch (error) {
        console.error('Error creating thread:', error)
    }
}

// Run the test
testThreadCreation() 