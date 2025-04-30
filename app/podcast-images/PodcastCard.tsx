import React, { useState, useRef } from 'react';

interface PodcastImage {
    recordingFileName: string;
    lecture_name: string;
    image: string | null;
    main_topic: string;
    id: number;
    image_search: string;
}

interface PodcastCardProps {
    podcast: PodcastImage;
    selectedSubject: string;
    API_HOST: string;
    setPodcasts: (data: PodcastImage[]) => void;
}

const PodcastCard: React.FC<PodcastCardProps> = ({ podcast, selectedSubject, API_HOST, setPodcasts }) => {
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [pasteAreaActive, setPasteAreaActive] = useState(false);
    const pasteAreaRef = useRef<HTMLDivElement>(null);

    const handlePaste = async (event: React.ClipboardEvent) => {
        const items = event.clipboardData.items;
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('topic_id', podcast.id.toString());

                    setUploading(true);
                    setUploadError(null);

                    try {
                        const response = await fetch(`${API_HOST}/public/learn/chat/upload-lecture-image`, {
                            method: 'POST',
                            body: formData,
                        });

                        if (!response.ok) {
                            throw new Error('Failed to upload image');
                        }

                        // Refresh the podcasts list to show the new image
                        const fetchResponse = await fetch(`${API_HOST}/api/topics/recordings/${selectedSubject}`);
                        const fetchData = await fetchResponse.json();
                        if (fetchData.status === 'success') {
                            setPodcasts(fetchData.data);
                        }
                    } catch (error) {
                        console.error('Error uploading image:', error);
                        setUploadError('Failed to upload image. Please try again.');
                    } finally {
                        setUploading(false);
                    }
                }
            }
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-center mb-4 relative">
                {podcast.image ? (
                    <img
                        src={`${API_HOST}/public/learn/learner/get-lecture-image?image=${podcast.image}`}
                        alt={podcast.lecture_name}
                        className="w-24 h-24 object-cover rounded-lg border"
                    />
                ) : (
                    <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center border">
                        <span className="text-gray-500 text-xs text-center">No image available</span>
                    </div>
                )}
            </div>
            <div
                ref={pasteAreaRef}
                onPaste={handlePaste}
                onDragEnter={() => setPasteAreaActive(true)}
                onDragLeave={() => setPasteAreaActive(false)}
                onDragOver={e => e.preventDefault()}
                className={`p-4 border-2 border-dashed rounded-lg text-center transition-colors mb-2 ${pasteAreaActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                tabIndex={0}
            >
                <div className="flex flex-col items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs text-gray-600">Paste (Ctrl+V or Cmd+V) or drag an image here</p>
                </div>
                {uploading && (
                    <div className="mt-2 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                )}
                {uploadError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-2 py-1 rounded mt-2 text-xs">
                        {uploadError}
                    </div>
                )}
            </div>
            <h3 className="text-lg font-semibold mb-2">{podcast.lecture_name}</h3>
            <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Topic:</span> {podcast.main_topic}
            </p>
            <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">File:</span> {podcast.recordingFileName}
            </p>
            {podcast.image_search && (
                <a
                    href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(podcast.image_search)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search for images
                </a>
            )}
        </div>
    );
};

export default PodcastCard; 