import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin
const serviceAccount = require('../firebase-service-account.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const API_HOST = process.env.API_HOST || 'https://examquiz.dedicated.co.za';
const STATS_FILE = path.join(__dirname, 'deletion-stats.json');
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

interface DeletionStats {
    totalDeleted: number;
    lastRun: {
        date: string;
        deleted: number;
    };
}

function loadStats(): DeletionStats {
    try {
        if (fs.existsSync(STATS_FILE)) {
            const data = fs.readFileSync(STATS_FILE, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
    return {
        totalDeleted: 0,
        lastRun: {
            date: new Date().toISOString(),
            deleted: 0
        }
    };
}

function saveStats(stats: DeletionStats) {
    try {
        fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
    } catch (error) {
        console.error('Error saving stats:', error);
    }
}

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkAndDeleteUser(user: admin.auth.UserRecord) {
    let retries = 0;

    while (retries < MAX_RETRIES) {
        try {
            // Call the API endpoint
            const response = await fetch(`${API_HOST}/public/learn/learner?uid=${user.uid}`);

            if (!response.ok) {
                throw new Error(`API responded with status: ${response.status}`);
            }

            const data = await response.json();

            // If learner not found, delete the user
            if (data.status === 'NOK' && data.message === 'Learner not found') {
                console.log(`Learner not found for user ${user.email}, deleting...`);
                await admin.auth().deleteUser(user.uid);
                console.log(`Successfully deleted user: ${user.email}`);
                return { email: user.email || '', status: 'deleted' };
            } else {
                console.log(`Learner found for user ${user.email}, skipping...`);
                return { email: user.email || '', status: 'skipped' };
            }
        } catch (error) {
            retries++;
            if (retries === MAX_RETRIES) {
                console.error(`Failed to process user ${user.email} after ${MAX_RETRIES} attempts:`, error);
                return { email: user.email || '', status: 'error', error };
            }
            console.log(`Attempt ${retries} failed for user ${user.email}, retrying in ${RETRY_DELAY / 1000} seconds...`);
            await sleep(RETRY_DELAY);
        }
    }

    return { email: user.email || '', status: 'error', error: 'Max retries exceeded' };
}

async function getUsersCreatedToday() {
    try {
        console.log('Fetching users created yesterday...');

        // Get yesterday's date range
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate());
        yesterday.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get all users
        const listUsersResult = await admin.auth().listUsers();
        const users = listUsersResult.users;

        // Filter users created yesterday
        const yesterdayUsers = users.filter(user => {
            const creationTime = new Date(user.metadata.creationTime);
            return creationTime >= yesterday && creationTime < today;
        });

        // Print users created yesterday
        console.log('\nUsers created yesterday:');
        console.log('-------------------');
        if (yesterdayUsers.length === 0) {
            console.log('No users were created yesterday.');
            return [];
        }

        const results = {
            deleted: [] as string[],
            skipped: [] as string[],
            errors: [] as { email: string; error: any }[]
        };

        // Process each user
        for (const user of yesterdayUsers) {
            console.log(`\nProcessing user: ${user.email}`);
            console.log(`UID: ${user.uid}`);
            console.log(`Created at: ${user.metadata.creationTime}`);
            console.log(`Last sign in: ${user.metadata.lastSignInTime}`);

            const result = await checkAndDeleteUser(user);

            if (result.status === 'deleted') {
                results.deleted.push(result.email);
            } else if (result.status === 'skipped') {
                results.skipped.push(result.email);
            } else {
                results.errors.push({ email: result.email, error: result.error });
            }

            console.log('-------------------');
        }

        // Update and save stats
        const stats = loadStats();
        stats.totalDeleted += results.deleted.length;
        stats.lastRun = {
            date: new Date().toISOString(),
            deleted: results.deleted.length
        };
        saveStats(stats);

        // Print summary
        console.log('\nProcessing Summary:');
        console.log(`Total users processed: ${yesterdayUsers.length}`);
        console.log(`Users deleted: ${results.deleted.length}`);
        console.log(`Users skipped: ${results.skipped.length}`);
        console.log(`Errors encountered: ${results.errors.length}`);
        console.log('\nOverall Statistics:');
        console.log(`Total users deleted (all time): ${stats.totalDeleted}`);
        console.log(`Last run: ${new Date(stats.lastRun.date).toLocaleString()} - Deleted: ${stats.lastRun.deleted}`);

        if (results.errors.length > 0) {
            console.log('\nErrors:');
            results.errors.forEach(({ email, error }) => {
                console.log(`- ${email}: ${error.message || error}`);
            });
        }

        return yesterdayUsers;
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
}

async function deleteUsersByEmail(emails: string[]) {
    try {
        console.log(`Starting to delete ${emails.length} users...`);

        const results = {
            success: [] as string[],
            failed: [] as { email: string; error: string }[]
        };

        for (const email of emails) {
            try {
                // Get user by email
                const userRecord = await admin.auth().getUserByEmail(email);

                // Delete the user
                await admin.auth().deleteUser(userRecord.uid);

                console.log(`Successfully deleted user: ${email}`);
                results.success.push(email);
            } catch (error) {
                console.error(`Failed to delete user ${email}:`, error);
                results.failed.push({
                    email,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        // Print summary
        console.log('\nDeletion Summary:');
        console.log(`Successfully deleted: ${results.success.length} users`);
        console.log(`Failed to delete: ${results.failed.length} users`);

        if (results.failed.length > 0) {
            console.log('\nFailed deletions:');
            results.failed.forEach(({ email, error }) => {
                console.log(`- ${email}: ${error}`);
            });
        }

        return results;
    } catch (error) {
        console.error('Error in deleteUsersByEmail:', error);
        throw error;
    }
}

// Example usage
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (command === 'list-today') {
        try {
            await getUsersCreatedToday();
        } catch (error) {
            console.error('Failed to list users:', error);
        }
    } else if (command === 'delete') {
        // You can either pass emails directly or read from a file
        const emails = [
            // Add email addresses here
            // 'user1@example.com',
            // 'user2@example.com'
        ];

        // Or read from a file
        const emailFile = path.join(__dirname, 'emails-to-delete.txt');
        if (fs.existsSync(emailFile)) {
            const fileContent = fs.readFileSync(emailFile, 'utf-8');
            const fileEmails = fileContent.split('\n')
                .map(email => email.trim())
                .filter(email => email && email.includes('@'));
            emails.push(...fileEmails);
        }

        if (emails.length === 0) {
            console.log('No emails provided. Please add emails to the script or create an emails-to-delete.txt file.');
            return;
        }

        try {
            await deleteUsersByEmail(emails);
        } catch (error) {
            console.error('Script failed:', error);
        }
    } else {
        console.log('Please specify a command:');
        console.log('  list-today  - List all users created yesterday');
        console.log('  delete      - Delete users by email');
    }

    process.exit(0);
}

main(); 