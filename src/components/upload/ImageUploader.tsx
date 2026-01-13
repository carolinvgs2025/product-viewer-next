"use client";

import { useState, useCallback, useRef } from 'react';
import { Upload, Image as ImageIcon, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils'; // Make sure this exists
import { useProject } from '@/context/ProjectContext';

// Concurrency limit for uploads
const MAX_CONCURRENT_UPLOADS = 5;

export function ImageUploader() {
    const { updateImages, images } = useProject();
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState({ total: 0, current: 0, failed: 0 });

    // Use ref to track queue to avoid state staleness in loop
    const queueRef = useRef<File[]>([]);
    const activeUploadsRef = useRef(0);
    const resultsBufferRef = useRef<Record<string, string>>({});

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const processQueue = async () => {
        if (queueRef.current.length === 0 && activeUploadsRef.current === 0) {
            setUploading(false);
            // Flush remaining results
            if (Object.keys(resultsBufferRef.current).length > 0) {
                updateImages(resultsBufferRef.current);
                resultsBufferRef.current = {};
            }
            return;
        }

        while (activeUploadsRef.current < MAX_CONCURRENT_UPLOADS && queueRef.current.length > 0) {
            const file = queueRef.current.shift();
            if (!file) break;

            activeUploadsRef.current++;

            // Upload single file
            // We don't await here to allow parallel processing
            uploadFile(file).then(() => {
                activeUploadsRef.current--;
                processQueue(); // Recursive call to pick up next
            });
        }
    };

    const uploadFile = async (file: File) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || `Server responded with ${res.status}`);
            }

            const data = await res.json();

            if (data.success && data.filename) {
                resultsBufferRef.current[data.filename] = data.url;
            } else {
                throw new Error('Upload failed: Missing filename or success flag');
            }

            setProgress(prev => ({ ...prev, current: prev.current + 1 }));

        } catch (e) {
            if (e instanceof TypeError && e.message === 'Failed to fetch') {
                console.error(`Network error uploading ${file.name}: Is the server running?`, e);
            } else {
                console.error(`Failed to upload ${file.name}`, e);
            }
            setProgress(prev => ({ ...prev, current: prev.current + 1, failed: prev.failed + 1 }));
        } finally {
            if (Object.keys(resultsBufferRef.current).length >= 10) {
                updateImages(resultsBufferRef.current);
                resultsBufferRef.current = {};
            }
        }
    };

    const startUpload = (files: FileList) => {
        const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));

        if (fileArray.length === 0) return;

        setUploading(true);
        setProgress({ total: fileArray.length, current: 0, failed: 0 });

        queueRef.current = fileArray;
        processQueue();
        setIsDragging(false);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        startUpload(e.dataTransfer.files);
    }, []);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            startUpload(e.target.files);
        }
    };

    const percent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
    const imageCount = Object.keys(images).length;

    return (
        <div className="space-y-4">
            <div
                className={cn(
                    "relative rounded-xl border-2 border-dashed transition-all duration-300 p-8 text-center",
                    isDragging
                        ? "border-purple-500 bg-purple-50/10 scale-[1.01] shadow-lg"
                        : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20",
                    uploading && "opacity-80 pointer-events-none"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileInput}
                />

                <div className="flex flex-col items-center gap-4">
                    <div className={cn(
                        "p-4 rounded-full bg-gray-100 dark:bg-white/5 transition-transform duration-300",
                        isDragging && "scale-110"
                    )}>
                        {uploading ? (
                            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                        ) : (
                            <ImageIcon className="w-8 h-8 text-purple-500" />
                        )}
                    </div>

                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold dark:text-white">
                            {uploading ? `Uploading images... ${percent}%` : "Drop images here"}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Bulk upload supported (1000+)
                        </p>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            {uploading && (
                <div className="w-full h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-purple-500 transition-all duration-300 ease-out"
                        style={{ width: `${percent}%` }}
                    />
                </div>
            )}

            {/* Status Stats */}
            {imageCount > 0 && (
                <div className="flex items-center justify-between text-sm p-4 rounded-lg bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-300 border border-green-100 dark:border-green-900/20">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>{imageCount} images waiting for match</span>
                    </div>
                    {progress.failed > 0 && (
                        <div className="text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            <span>{progress.failed} failures</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
