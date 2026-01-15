"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Edit2, ChevronDown, CheckCircle2, Trash2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: any;
    rowIndex: number | null;
    headers: string[];
    uniqueValues: Record<string, string[]>;
    imageUrl?: string;
    onNext?: () => void;
    onPrevious?: () => void;
    onUpdate: (rowIndex: number, column: string, value: any) => void;
    onDelete?: (rowIndex: number) => void;
    filters: any;
    hasMultiple?: boolean;
}

export function ProductDetailModal({
    isOpen,
    onClose,
    product,
    rowIndex,
    headers,
    uniqueValues,
    imageUrl,
    onNext,
    onPrevious,
    onUpdate,
    onDelete,
    filters,
    hasMultiple
}: ProductDetailModalProps) {
    const isFiltered = Object.keys(filters).length > 0;
    const [isDeleting, setIsDeleting] = useState(false);
    const [localDrafts, setLocalDrafts] = useState<Record<string, string>>({});
    const [zoomStyle, setZoomStyle] = useState({ opacity: 0, x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        const { left, top, width, height } = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setZoomStyle({ opacity: 1, x, y });
    };

    const handleMouseLeave = () => {
        setZoomStyle(prev => ({ ...prev, opacity: 0 }));
    };

    // Reset state when product changes
    useEffect(() => {
        setIsDeleting(false);
        setLocalDrafts({});
        setZoomStyle({ opacity: 0, x: 0, y: 0 });
    }, [rowIndex]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight' && onNext) onNext();
            if (e.key === 'ArrowLeft' && onPrevious) onPrevious();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, onNext, onPrevious]);

    const handleCommit = (column: string) => {
        if (rowIndex === null) return;
        const draftVal = localDrafts[column];
        if (draftVal !== undefined) {
            onUpdate(rowIndex, column, draftVal);
            setLocalDrafts(prev => {
                const next = { ...prev };
                delete next[column];
                return next;
            });
        }
    };

    if (!product || rowIndex === null) return null;

    // Separate Title/Name from other attributes for clean display
    const titleField = headers.find(h => h.toLowerCase().includes('name') || h.toLowerCase().includes('title')) || headers[0];
    const title = product[titleField];
    const otherHeaders = headers.filter(h => h !== titleField);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12 lg:p-24">
                    {/* Backdrop / Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-all"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-6xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row border border-white/20 z-50"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-50 p-2 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 rounded-full text-gray-800 dark:text-white transition-colors border border-white/10"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Navigation Arrows (Floating) */}
                        {hasMultiple && (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onPrevious?.(); }}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-white/80 dark:bg-black/50 hover:bg-white dark:hover:bg-black/70 backdrop-blur shadow-lg rounded-full text-gray-800 dark:text-white transition-all transform hover:scale-110 border border-gray-200 dark:border-gray-700"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onNext?.(); }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-white/80 dark:bg-black/50 hover:bg-white dark:hover:bg-black/70 backdrop-blur shadow-lg rounded-full text-gray-800 dark:text-white transition-all transform hover:scale-110 border border-gray-200 dark:border-gray-700"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            </>
                        )}

                        {/* Left Side: Hero Image */}
                        <div
                            className="w-full md:w-1/2 bg-gray-50 dark:bg-gray-800/50 relative flex items-center justify-center p-12 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800 overflow-hidden cursor-crosshair"
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                        >
                            {imageUrl ? (
                                <>
                                    <motion.img
                                        key={imageUrl}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        src={imageUrl}
                                        alt={String(title)}
                                        className="w-full h-full max-h-[60vh] object-contain drop-shadow-2xl transition-opacity duration-200"
                                        style={{ opacity: zoomStyle.opacity ? 0.3 : 1 }}
                                    />
                                    {/* Zoomed Image Overlay */}
                                    <div
                                        className="absolute inset-0 pointer-events-none transition-opacity duration-200"
                                        style={{
                                            opacity: zoomStyle.opacity,
                                            backgroundImage: `url(${imageUrl})`,
                                            backgroundPosition: `${zoomStyle.x}% ${zoomStyle.y}%`,
                                            backgroundSize: '200%',
                                            backgroundRepeat: 'no-repeat'
                                        }}
                                    />
                                </>
                            ) : (
                                <div className="text-gray-300 flex flex-col items-center gap-4">
                                    <span className="text-6xl">📷</span>
                                    <p className="text-lg font-medium text-gray-400">No Image Available</p>
                                </div>
                            )}
                        </div>

                        {/* Right Side: Data & Attributes */}
                        <div className="w-full md:w-1/2 flex flex-col bg-white/80 dark:bg-gray-900/90 backdrop-blur-sm">
                            {/* Header Section */}
                            <div className="p-8 pb-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-white/5">
                                <div className="flex items-center gap-2 mb-1">
                                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">
                                        {titleField}
                                    </label>
                                </div>
                                <textarea
                                    value={localDrafts[titleField] ?? String(title || "")}
                                    onChange={(e) => {
                                        setLocalDrafts(prev => ({ ...prev, [titleField]: e.target.value }));
                                    }}
                                    onBlur={() => handleCommit(titleField)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleCommit(titleField);
                                            (e.target as HTMLTextAreaElement).blur();
                                        }
                                    }}
                                    className="w-full text-2xl md:text-3xl font-extrabold bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 resize-none min-h-[80px]"
                                    placeholder="Enter title..."
                                />
                            </div>

                            {/* Attributes List */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                                <div className="grid grid-cols-1 gap-2">
                                    {otherHeaders.map((header) => {
                                        const value = product[header] || "";
                                        const options = uniqueValues[header];
                                        const isDropdown = options && options.length > 0;

                                        return (
                                            <div key={header} className="group flex flex-col gap-1 border-b border-gray-50 dark:border-gray-800/30 pb-3 last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/5 p-3 rounded-xl transition-all">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                                                        <Edit2 className="w-2.5 h-2.5 opacity-40" />
                                                        {header}
                                                    </label>
                                                </div>

                                                {isDropdown ? (
                                                    <div className="relative mt-1 group/input">
                                                        <input
                                                            list={`datalist-modal-${header}`}
                                                            value={localDrafts[header] ?? String(value)}
                                                            onChange={(e) => {
                                                                setLocalDrafts(prev => ({ ...prev, [header]: e.target.value }));
                                                            }}
                                                            onBlur={() => handleCommit(header)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    handleCommit(header);
                                                                    (e.target as HTMLInputElement).blur();
                                                                }
                                                            }}
                                                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-2 pl-3 pr-10 text-sm font-medium text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                            placeholder={`Edit ${header}...`}
                                                        />
                                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none opacity-0 group-hover/input:opacity-100 transition-opacity" />
                                                        <datalist id={`datalist-modal-${header}`}>
                                                            {options.map(opt => (
                                                                <option key={opt} value={opt} />
                                                            ))}
                                                        </datalist>
                                                    </div>
                                                ) : (
                                                    <textarea
                                                        value={localDrafts[header] ?? String(value)}
                                                        onChange={(e) => {
                                                            setLocalDrafts(prev => ({ ...prev, [header]: e.target.value }));
                                                        }}
                                                        onBlur={() => handleCommit(header)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                                e.preventDefault();
                                                                handleCommit(header);
                                                                (e.target as HTMLTextAreaElement).blur();
                                                            }
                                                        }}
                                                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-base font-medium text-gray-700 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-700 resize-none min-h-[24px]"
                                                        placeholder="Empty"
                                                        rows={1}
                                                        onInput={(e) => {
                                                            const target = e.target as HTMLTextAreaElement;
                                                            target.style.height = 'auto';
                                                            target.style.height = target.scrollHeight + 'px';
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Footer / Actions */}
                            <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/20 flex justify-between items-center">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                        ITEM {rowIndex + 1} {hasMultiple && "OF DATASET"}
                                    </span>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[9px] font-bold uppercase">
                                            ESC TO CLOSE
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[9px] font-bold uppercase">
                                            ← → NAVIGATE
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        if (isDeleting) {
                                            onDelete?.(rowIndex);
                                        } else {
                                            setIsDeleting(true);
                                        }
                                    }}
                                    onMouseLeave={() => setIsDeleting(false)}
                                    className={cn(
                                        "flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold transition-all duration-300 shadow-md uppercase tracking-wider",
                                        isDeleting
                                            ? "bg-red-600 text-white hover:bg-red-700 ring-4 ring-red-500/20"
                                            : "bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                                    )}
                                >
                                    <Trash2 className={cn("w-4 h-4 transition-transform", isDeleting && "scale-110")} />
                                    {isDeleting ? "Confirm Deletion?" : "Delete Product"}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
