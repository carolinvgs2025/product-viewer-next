"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: any;
    headers: string[];
    imageUrl?: string;
    onNext?: () => void;
    onPrevious?: () => void;
    hasMultiple?: boolean;
}

export function ProductDetailModal({
    isOpen,
    onClose,
    product,
    headers,
    imageUrl,
    onNext,
    onPrevious,
    hasMultiple
}: ProductDetailModalProps) {
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

    if (!product) return null;

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
                            className="absolute top-4 right-4 z-50 p-2 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 rounded-full text-gray-800 dark:text-white transition-colors"
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
                        <div className="w-full md:w-1/2 bg-gray-50 dark:bg-gray-800/50 relative flex items-center justify-center p-12 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800">
                            {imageUrl ? (
                                <img
                                    src={imageUrl}
                                    alt={String(title)}
                                    className="w-full h-full max-h-[60vh] object-contain drop-shadow-2xl"
                                />
                            ) : (
                                <div className="text-gray-300 flex flex-col items-center gap-4">
                                    <span className="text-6xl">📷</span>
                                    <p className="text-lg font-medium">No Image Available</p>
                                </div>
                            )}
                        </div>

                        {/* Right Side: Data & Attributes */}
                        <div className="w-full md:w-1/2 flex flex-col bg-white/80 dark:bg-gray-900/90 backdrop-blur-sm">
                            {/* Header Section */}
                            <div className="p-8 pb-4 border-b border-gray-100 dark:border-gray-800">
                                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 block">
                                    {titleField}
                                </label>
                                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">
                                    {String(title || "Untitled Product")}
                                </h2>
                            </div>

                            {/* Attributes List */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                                <div className="grid grid-cols-1 gap-6">
                                    {otherHeaders.map((header) => {
                                        const value = product[header];
                                        if (!value) return null; // Clean mode: Hide empty fields in this view

                                        return (
                                            <div key={header} className="group flex flex-col gap-1 border-b border-gray-50 dark:border-gray-800/50 pb-3 last:border-0 hover:bg-gray-50 dark:hover:bg-white/5 p-2 -mx-2 rounded-lg transition-colors">
                                                <label className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                                                    {header}
                                                </label>
                                                <p className="text-base font-medium text-gray-700 dark:text-gray-200">
                                                    {String(value)}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Footer / Actions */}
                            <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/20 flex justify-between items-center text-xs text-gray-400 font-medium">
                                <span>ROW {product.__rowIndex ? product.__rowIndex + 1 : "?"}</span>

                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                        Esc to close
                                    </span>
                                    <span className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                        ← → to navigate
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
