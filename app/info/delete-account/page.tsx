import Link from 'next/link';

export default function DeleteAccountPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white shadow rounded-lg p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">Account Deletion Information</h1>

                    <div className="space-y-6">
                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-3">How to Delete Your Account</h2>
                            <p className="text-gray-600 mb-4">
                                To delete your account, please follow these steps:
                            </p>
                            <ol className="list-decimal list-inside space-y-2 text-gray-600">
                                <li>Log in to your account</li>
                                <li>Go to your profile page</li>
                                <li>Click on the "Delete Account" button</li>
                                <li>Confirm your decision to delete your account</li>
                            </ol>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-3">What Data Will Be Deleted</h2>
                            <p className="text-gray-600 mb-4">
                                When you delete your account, the following data will be permanently removed:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-gray-600">
                                <li>Your personal profile information</li>
                                <li>Your quiz history and scores</li>
                                <li>Your progress and achievements</li>
                                <li>Your account preferences and settings</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-3">Data Retention</h2>
                            <p className="text-gray-600">
                                Please note that some data may be retained for legal or administrative purposes for a period of up to 30 days after account deletion. This includes:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-gray-600 mt-2">
                                <li>Transaction records (if applicable)</li>
                                <li>Compliance-related information</li>
                                <li>Service usage logs</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-3">Important Notes</h2>
                            <ul className="list-disc list-inside space-y-2 text-gray-600">
                                <li>Account deletion is permanent and cannot be undone</li>
                                <li>You will lose access to all your data and progress</li>
                                <li>If you have any active subscriptions, they will be cancelled</li>
                                <li>You will need to create a new account if you wish to use our services again</li>
                            </ul>
                        </section>

                        <div className="pt-6">
                            <Link
                                href="/info"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Return to Info
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 