"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Check, ChevronDown, Plus } from 'lucide-react';
import { FilterState, useProject } from '@/context/ProjectContext';

interface ProductCardProps {
    data: any;
    headers: string[];
    imageUrl?: string;
    rowIndex: number;
    uniqueValues: Record<string, string[]>;
    onUpdate: (rowIndex: number, column: string, value: any) => void;
    activeFilters: FilterState;
}

export function ProductCard({ data, headers, imageUrl, rowIndex, uniqueValues, onUpdate, activeFilters }: ProductCardProps) {
    const { originalData } = useProject();
    const [zoomStyle, setZoomStyle] = useState({ opacity: 0, x: 0, y: 0 });
    const imageRef = useRef<HTMLDivElement>(null);

    const originalRow = originalData[rowIndex];
    const isModified = originalRow && headers.some(h => String(data[h]) !== String(originalRow[h]));

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!imageRef.current) return;

        const { left, top, width, height } = imageRef.current.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;

        setZoomStyle({ opacity: 1, x, y });
    };

    const handleMouseLeave = () => {
        setZoomStyle(prev => ({ ...prev, opacity: 0 }));
    };

    // Find the "Name" or "Title" to display prominently
    const titleField = headers.find(h => h.toLowerCase().includes('name') || h.toLowerCase().includes('title')) || headers[0];
    const title = data[titleField];
    const isTitleModified = originalRow && String(data[titleField]) !== String(originalRow[titleField]);

    const otherHeaders = headers.filter(h => h !== titleField);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-lg border h-[600px] flex flex-col group hover:shadow-2xl transition-all duration-300",
                isModified
                    ? "border-blue-400 dark:border-blue-500/50 ring-1 ring-blue-500/20"
                    : "border-gray-100 dark:border-gray-800"
            )}
        >
            {/* Top 60%: Image Area (Previously 50%) */}
            <div
                ref={imageRef}
                className="h-[60%] relative bg-gray-50 dark:bg-gray-800 overflow-hidden cursor-crosshair border-b border-gray-100 dark:border-gray-800"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                {/* ID Overlay - Top Left */}
                <div className="absolute top-0 left-0 z-10 p-2 flex flex-col gap-2">
                    <div className="bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-br-lg rounded-tl-lg shadow-lg border border-white/20 flex items-center gap-1.5 w-fit">
                        <span className="text-[10px] font-bold text-white/90">{headers[0]}:</span>
                        <span className="text-[10px] font-semibold">{String(data[headers[0]])}</span>
                    </div>

                    {isModified && (
                        <div className="bg-blue-600 backdrop-blur-md text-white px-2.5 py-1 rounded-r-lg shadow-lg border border-blue-400/30 flex items-center gap-1.5 w-fit animate-in fade-in slide-in-from-left-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider">Edited</span>
                        </div>
                    )}
                </div>

                {imageUrl ? (
                    <>
                        {/* Normal Image */}
                        {/* Normal Image */}
                        <img
                            src={imageUrl}
                            alt={String(title)}
                            className="object-contain p-6 w-full h-full transition-opacity duration-200"
                            style={{ opacity: zoomStyle.opacity ? 0.3 : 1 }}
                        />

                        {/* Zoomed Image Overlay */}
                        <div
                            className="absolute inset-0 pointer-events-none transition-opacity duration-200"
                            style={{
                                opacity: zoomStyle.opacity,
                                backgroundImage: `url(${imageUrl})`,
                                backgroundPosition: `${zoomStyle.x}% ${zoomStyle.y}%`,
                                backgroundSize: '250%',
                                backgroundRepeat: 'no-repeat'
                            }}
                        />
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-300 flex-col gap-2">
                        <span className="text-4xl">📷</span>
                        <span className="text-sm">No Image Linked</span>
                    </div>
                )}
            </div>


            {/* Bottom 40%: Editable Attributes */}
            <div className="h-[40%] flex flex-col pt-4">
                {/* Title / Header Fixed - Enhanced Display */}
                <div className="px-6 pb-3 border-b border-gray-100 dark:border-gray-800 relative">
                    {isTitleModified && (
                        <div className="absolute top-4 right-6 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    )}
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 block">
                        {titleField}
                    </label>
                    <textarea
                        value={String(title || "")}
                        onChange={(e) => {
                            onUpdate(rowIndex, titleField, e.target.value);
                        }}
                        className={cn(
                            "w-full text-base font-bold bg-transparent border-2 border-transparent hover:border-gray-200 focus:border-blue-500 focus:outline-none transition-colors text-gray-900 dark:text-gray-100 resize-none rounded-md px-2 py-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600",
                            isTitleModified && "text-blue-600 dark:text-blue-400"
                        )}
                        placeholder={`Enter ${titleField}...`}
                        rows={3}
                        style={{ maxHeight: '72px', overflow: 'auto' }}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>

                {/* Quick Edit (Filtered Fields) Section */}
                {Object.keys(activeFilters).length > 0 && (
                    <div className="bg-blue-50/50 dark:bg-blue-900/10 border-b border-gray-100 dark:border-gray-800 px-6 py-3">
                        <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 mb-2">
                            <Plus className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Quick Edit</span>
                        </div>
                        <div className="max-h-[120px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-blue-200 dark:scrollbar-thumb-blue-900/30">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                                {Object.keys(activeFilters).map((column) => {
                                    const value = data[column] || "";
                                    const originalValue = originalRow ? originalRow[column] : value;
                                    const isFieldModified = String(value) !== String(originalValue);
                                    const options = uniqueValues[column];
                                    const isDropdown = options && options.length > 0;

                                    return (
                                        <div key={column} className="flex flex-col gap-1 relative">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[9px] font-semibold text-gray-500 uppercase tracking-widest truncate">
                                                    {column}
                                                </label>
                                                {isFieldModified && (
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                )}
                                            </div>
                                            {isDropdown ? (
                                                <select
                                                    value={String(value)}
                                                    onChange={(e) => onUpdate(rowIndex, column, e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className={cn(
                                                        "w-full bg-white dark:bg-gray-800 border rounded text-[11px] py-1 px-1.5 transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-gray-200",
                                                        isFieldModified
                                                            ? "border-blue-400 dark:border-blue-500/50 text-blue-600 dark:text-blue-400"
                                                            : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700"
                                                    )}
                                                >
                                                    <option value="">Select...</option>
                                                    {options.map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    value={String(value)}
                                                    onChange={(e) => onUpdate(rowIndex, column, e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className={cn(
                                                        "w-full bg-white dark:bg-gray-800 border rounded text-[11px] py-1 px-1.5 transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-gray-200",
                                                        isFieldModified
                                                            ? "border-blue-400 dark:border-blue-500/50 text-blue-600 dark:text-blue-400"
                                                            : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700"
                                                    )}
                                                    placeholder={`Edit...`}
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Scrollable Fields */}
                <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800 space-y-3 max-h-[160px]">
                    {otherHeaders.map((header) => {
                        const value = data[header] || "";
                        const originalValue = originalRow ? originalRow[header] : value;
                        const isFieldModified = String(value) !== String(originalValue);
                        const options = uniqueValues[header];
                        const isDropdown = options && options.length > 0;

                        return (
                            <div key={header} className="group/field relative">
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                                        {header}
                                    </label>
                                    {isFieldModified && (
                                        <div className="flex items-center gap-1">
                                            <span className="text-[10px] text-blue-500 font-medium italic opacity-0 group-hover/field:opacity-100 transition-opacity">
                                                Changed
                                            </span>
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                        </div>
                                    )}
                                </div>

                                {isDropdown ? (
                                    <div className="relative">
                                        <select
                                            value={String(value)}
                                            onChange={(e) => {
                                                if (e.target.value === '__add_new__') {
                                                    const newVal = prompt(`Enter new value for ${header}:`);
                                                    if (newVal) onUpdate(rowIndex, header, newVal);
                                                } else {
                                                    onUpdate(rowIndex, header, e.target.value);
                                                }
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            className={cn(
                                                "w-full appearance-none bg-gray-50 dark:bg-gray-800 border rounded-md py-1.5 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none cursor-pointer transition-colors",
                                                isFieldModified
                                                    ? "border-blue-400/50 text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-900/5"
                                                    : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                            )}
                                        >
                                            <option value="" disabled>Select...</option>
                                            {options.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                            {!options.includes(String(value)) && value && (
                                                <option value={String(value)}>{String(value)}</option>
                                            )}
                                            <hr />
                                            <option value="__add_new__" className="text-blue-600 font-semibold">+ Add New...</option>
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                ) : (
                                    <input
                                        value={String(value)}
                                        onChange={(e) => onUpdate(rowIndex, header, e.target.value)}
                                        className={cn(
                                            "w-full bg-transparent border-b py-1 text-sm focus:border-blue-500 focus:outline-none transition-colors",
                                            isFieldModified
                                                ? "border-blue-400 text-blue-600 dark:text-blue-400 font-medium"
                                                : "border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300"
                                        )}
                                        placeholder="Empty"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
}
