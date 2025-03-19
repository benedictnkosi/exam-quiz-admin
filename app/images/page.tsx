'use client';

import { API_BASE_URL, IMAGE_BASE_URL } from '@/config/constants';
import { useAuth } from '@/contexts/AuthContext';
import React, { useState } from 'react';

type ImageData = {
    image: string;
    question: string | number;
};

const ImagesPage = () => {
    const [limit, setLimit] = useState(10);
    const [images, setImages] = useState<ImageData[]>([]);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectComment, setRejectComment] = useState('');
    const [currentImageId, setCurrentImageId] = useState<string | null>(null);
    const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
    const { user } = useAuth()

    const fetchImages = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/smallest-images?limit=${limit}`);
            const data = await response.json();
            if (data.status === 'OK') {
                setImages(data.images);
            }
        } catch (error) {
            console.error('Error fetching images:', error);
        }
    };

    const handleReject = async (imageId: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/question/set-status`, {
                method: 'POST',
                body: JSON.stringify({
                    question_id: imageId,
                    status: 'rejected',
                    comment: rejectComment,
                    email: user?.email,
                    uid: user?.uid
                }),
            })

            const data = await response.json();

            if (data.status === 'OK') {
                setShowRejectModal(false);
                console.log('Image rejected successfully');
            } else {
                console.error('Error rejecting image:', data.message);
                alert(data.message || 'Failed to reject image');
            }
        } catch (error) {
            console.error('Error rejecting image:', error);
            alert('Failed to reject image');
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold mb-6">Images</h1>
            <div className="mb-4">
                <input
                    type="number"
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="border p-2 mr-2"
                    placeholder="Enter limit"
                />
                <button onClick={fetchImages} className="bg-blue-500 text-white p-2">Get Images</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((img, index) => (
                    <div key={index} className="border p-4">
                        <img src={`${IMAGE_BASE_URL}${img.image}`} alt={`Image ${index}`} className="w-full h-auto" />
                        <button className="bg-green-500 text-white mt-2 p-2">Convert</button>
                        <button onClick={() => { setCurrentQuestionId(img.question as string); setShowRejectModal(true); }} className="bg-red-500 text-white mt-2 p-2">Reject</button>
                        <label className="block text-sm font-medium text-gray-700">
                            Question ID: {img.question}
                        </label>
                    </div>
                ))}
            </div>

            {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-96">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Reject Image</h3>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="rejectComment" className="block text-sm font-medium text-gray-700">
                                    Rejection Comment
                                </label>
                                <textarea
                                    id="rejectComment"
                                    value={rejectComment}
                                    onChange={(e) => setRejectComment(e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    rows={4}
                                    required
                                />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button
                                    onClick={() => setShowRejectModal(false)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleReject(currentQuestionId!)}
                                    disabled={!rejectComment.trim() || !currentQuestionId}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                >
                                    Reject
                                </button>

                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImagesPage; 