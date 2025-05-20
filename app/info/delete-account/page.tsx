'use client';

import Link from 'next/link';
import { useState } from 'react';
import { API_HOST } from '@/config/constants';

export default function DeleteAccountPage() {
    const [identifier, setIdentifier] = useState('');
    const [identifierType, setIdentifierType] = useState('email');
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
    const [isLoading, setIsLoading] = useState(false);

    const validatePhone = (phone: string) => {
        return /^0\d{9}$/.test(phone);
    };

    const handleDelete = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus({ type: null, message: '' });

        let email = identifier;
        if (identifierType === 'phone') {
            if (!validatePhone(identifier)) {
                setStatus({ type: 'error', message: 'Phone number must be 10 digits and start with 0' });
                setIsLoading(false);
                return;
            }
            email = `${identifier}@examquiz.co.za`;
        }

        try {
            const response = await fetch(`${API_HOST}/public/learn/learner/delete?email=${encodeURIComponent(email)}`, {
                method: 'DELETE',
            });
            const data = await response.json();

            if (data.status === 'OK') {
                setStatus({ type: 'success', message: data.message || 'Your account has been successfully marked for deletion.' });
                setIdentifier('');
            } else {
                setStatus({ type: 'error', message: 'Account not found. Please check your details and try again.' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'An error occurred. Please try again later.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white shadow rounded-lg p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">Account Deletion Information</h1>

                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-700">
                            This is the official account deletion page for <span className="font-semibold">Dimpo Learning App</span>,
                            operated by <span className="font-semibold">Sixty-five Group</span>.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-3">Delete Your Account</h2>
                            <form onSubmit={handleDelete} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        I want to delete my account using:
                                    </label>
                                    <div className="flex space-x-4 mb-4">
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                className="form-radio"
                                                name="identifierType"
                                                value="email"
                                                checked={identifierType === 'email'}
                                                onChange={(e) => setIdentifierType(e.target.value)}
                                            />
                                            <span className="ml-2">Email</span>
                                        </label>
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                className="form-radio"
                                                name="identifierType"
                                                value="phone"
                                                checked={identifierType === 'phone'}
                                                onChange={(e) => setIdentifierType(e.target.value)}
                                            />
                                            <span className="ml-2">Phone Number</span>
                                        </label>
                                    </div>
                                    <input
                                        type={identifierType === 'email' ? 'email' : 'tel'}
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        placeholder={identifierType === 'email' ? 'Enter your email' : 'Enter your phone number (e.g., 0123456789)'}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        required
                                    />
                                </div>

                                {status.type && (
                                    <div className={`p-4 rounded-md ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                        {status.message}
                                    </div>
                                )}

                                <div className="flex items-center justify-between">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                                    >
                                        {isLoading ? 'Deleting...' : 'Delete My Account'}
                                    </button>
                                    <Link
                                        href="/info"
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Cancel
                                    </Link>
                                </div>
                            </form>
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

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-3">Self-Service Account Deletion</h2>
                            <p className="text-gray-600 mb-4">
                                To delete your account, please follow these steps:
                            </p>
                            <ol className="list-decimal list-inside space-y-2 text-gray-600">
                                <li>Log in to your account</li>
                                <li>Go to your profile page</li>
                                <li>Click on the "Delete Account" button</li>
                                <li>Confirm your decision to delete your account</li>
                            </ol>
                            <p className="text-gray-600 mt-4">
                                Alternatively, you can use the form above to request account deletion by providing your email address or phone number.
                            </p>
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