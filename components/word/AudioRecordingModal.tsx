import { useState, useEffect, useRef, useCallback } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWavesurfer } from '@wavesurfer/react';
import { HOST_URL } from '@/services/api';

interface AudioRecordingModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAudioRecorded: (audioBlob: Blob, fileName?: string) => void;
    language: string;
    word?: string;
}

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
};

export function AudioRecordingModal({ open, onOpenChange, onAudioRecorded, language, word }: AudioRecordingModalProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [endTime, setEndTime] = useState<number | null>(null);
    const [translationInput, setTranslationInput] = useState(word || "");
    const containerRef = useRef<HTMLDivElement | null>(null);

    const {
        status,
        startRecording,
        stopRecording,
        mediaBlobUrl,
    } = useReactMediaRecorder({
        audio: true,
        onStop: (blobUrl, blob) => {
            if (blob) {
                onAudioRecorded(blob);
            }
        },
    });

    useEffect(() => {
        if (status === 'stopped' && mediaBlobUrl) {
            setAudioUrl(mediaBlobUrl);
        }
    }, [status, mediaBlobUrl]);

    useEffect(() => {
        if (open) {
            setStartTime(null);
            setEndTime(null);
            setTranslationInput(word || "");
        }
    }, [open, word]);

    // Setup wavesurfer
    const { wavesurfer, isPlaying, currentTime } = useWavesurfer({
        container: containerRef,
        height: 80,
        waveColor: '#a855f7',
        progressColor: '#ec4899',
        cursorColor: '#6366f1',
        barWidth: 3,
        barRadius: 3,
        url: audioUrl || undefined,
    });

    const onPlayPause = useCallback(() => {
        wavesurfer && wavesurfer.playPause();
    }, [wavesurfer]);

    const onWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!wavesurfer) return;
        const boundingRect = (e.target as HTMLDivElement).getBoundingClientRect();
        const x = e.clientX - boundingRect.left;
        const percent = x / boundingRect.width;
        wavesurfer.seekTo(percent);
    };

    const handleSetStartTime = () => {
        setStartTime(currentTime);
    };
    const handleSetEndTime = () => {
        setEndTime(currentTime);
    };

    const handleSave = async () => {
        if (!mediaBlobUrl) return;
        setIsProcessing(true);
        try {
            const response = await fetch(mediaBlobUrl);
            const blob = await response.blob();
            // Prepare FormData for API
            const formData = new FormData();
            formData.append('file', blob, 'recording.webm');
            if (startTime !== null) formData.append('startTime', startTime.toString());
            if (endTime !== null) formData.append('endTime', endTime.toString());
            if (translationInput) formData.append('word', translationInput);
            // Upload audio and get file name
            const uploadRes = await fetch(`${HOST_URL}/api/word/audio/upload`, {
                method: 'POST',
                body: formData,
            });
            let fileName = undefined;
            if (uploadRes.ok) {
                const data = await uploadRes.json();
                fileName = data.wordAudio?.filename;
            }
            onAudioRecorded(blob, fileName);
            onOpenChange(false);
        } catch (error) {
            console.error('Error processing audio:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Record Audio for {language}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center space-y-4 py-4">
                    <div className="w-full flex flex-col items-center justify-center">
                        {status === 'recording' ? (
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                <span>Recording...</span>
                            </div>
                        ) : status === 'stopped' && audioUrl ? (
                            <>
                                <div ref={containerRef} className="w-full cursor-pointer" onClick={onWaveformClick} />
                                <div className="flex items-center justify-between w-full mt-2">
                                    <span className="text-xs text-gray-500">{formatTime(currentTime)}</span>
                                    <Button type="button" onClick={onPlayPause} className="px-4 py-1">
                                        {isPlaying ? 'Pause' : 'Play'}
                                    </Button>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <Button type="button" size="sm" variant="outline" onClick={handleSetStartTime}>
                                        Set Start Time
                                    </Button>
                                    <Button type="button" size="sm" variant="outline" onClick={handleSetEndTime}>
                                        Set End Time
                                    </Button>
                                </div>
                                <div className="flex items-center gap-4 mt-1">
                                    <span className="text-xs text-blue-600">Start: {startTime !== null ? formatTime(startTime) : '--:--.---'}</span>
                                    <span className="text-xs text-pink-600">End: {endTime !== null ? formatTime(endTime) : '--:--.---'}</span>
                                </div>
                            </>
                        ) : null}
                    </div>
                    <div className="flex gap-2">
                        {status !== 'recording' ? (
                            <Button
                                onClick={startRecording}
                                disabled={isProcessing}
                                className="bg-red-500 hover:bg-red-600"
                            >
                                Start Recording
                            </Button>
                        ) : (
                            <Button
                                onClick={stopRecording}
                                disabled={isProcessing}
                                className="bg-gray-500 hover:bg-gray-600"
                            >
                                Stop Recording
                            </Button>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isProcessing}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={!mediaBlobUrl || isProcessing}
                    >
                        {isProcessing ? 'Saving...' : 'Save Recording'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 