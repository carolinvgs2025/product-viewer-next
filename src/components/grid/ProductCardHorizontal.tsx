"use client";

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ChevronDown, Plus } from 'lucide-react';
import { FilterState } from '@/context/ProjectContext';

interface ProductCardHorizontalProps {
    data: any;
    headers: string[];
    imageUrl?: string;
    rowIndex: number;
    uniqueValues: Record<string, string[]>;
    onUpdate: (rowIndex: number, column: string, value: any) => void;
    activeFilters: FilterState;
}

export function ProductCardHorizontal({ data, headers, imageUrl, rowIndex, uniqueValues, onUpdate, activeFilters }: ProductCardHorizontalProps) {
    const [zoomStyle, setZoomStyle] = useState({ opacity: 0, x: 0, y: 0 });
    const imageRef = useRef<HTMLDivElement>(null);

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

    const otherHeaders = headers.filter(h => h !== titleField);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-800 flex flex-row group hover:shadow-2xl transition-all duration-300 h-[400px]"
        >
            {/* Left 50%: Image Area */}
            <div
                ref={imageRef}
                className="w-1/2 relative bg-gray-50 dark:bg-gray-800 overflow-hidden cursor-crosshair border-r border-gray-100 dark:border-gray-800"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                {/* ID Overlay - Top Left */}
                <div className="absolute top-0 left-0 z-10 p-2">
                    <div className="bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-br-lg rounded-tl-lg shadow-lg border border-white/20 flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-white/90">{headers[0]}:</span>
                        <span className="text-[10px] font-semibold">{String(data[headers[0]])}</span>
                    </div>
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


            {/* Right 50%: Editable Attributes */}
            <div className="w-1/2 flex flex-col">
                {/* Title / Header Fixed - Enhanced Display */}
                <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 block">
                        {titleField}
                    </label>
                    <textarea
                        value={String(title || "")}
                        onChange={(e) => {
                            onUpdate(rowIndex, titleField, e.target.value);
                        }}
                        className="w-full text-lg font-bold bg-transparent border-2 border-transparent hover:border-gray-200 focus:border-blue-500 focus:outline-none transition-colors text-gray-900 dark:text-gray-100 resize-none rounded-md px-2 py-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
                        placeholder={`Enter ${titleField}...`}
                        rows={3}
                        style={{ maxHeight: '84px', overflow: 'auto' }}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>

                {/* Quick Edit (Filtered Fields) Section */}
                {Object.keys(activeFilters).length > 0 && (
                    <div className="bg-blue-50/50 dark:bg-blue-900/10 border-b border-gray-100 dark:border-gray-800 px-6 py-4">
                        <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 mb-2">
                            <Plus className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Quick Edit</span>
                        </div>
                        <div className="max-h-[140px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-blue-200 dark:scrollbar-thumb-blue-900/30">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                                {Object.keys(activeFilters).map((column) => {
                                    const value = data[column] || "";
                                    const options = uniqueValues[column];
                                    const isDropdown = options && options.length > 0;

                                    return (
                                        <div key={column} className="flex flex-col gap-1">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate">
                                                {column}
                                            </label>
                                            {isDropdown ? (
                                                <select
                                                    value={String(value)}
                                                    onChange={(e) => onUpdate(rowIndex, column, e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 rounded text-sm py-1.5 px-2 transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-gray-200 shadow-sm"
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
                                                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 rounded text-sm py-1.5 px-2 transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-gray-200 shadow-sm"
                                                    placeholder={`Edit...`}
                                                    onClick={(e) => e.stopPropagation()}
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
                <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800 space-y-3 max-h-[250px]">
                    {headers.map((header) => {
                        if (header === titleField) return null; // Skip title field as it's shown above

                        const value = data[header] || "";
                        const options = uniqueValues[header];
                        const isDropdown = options && options.length > 0;

                        return (
                            <div key={header} className="group/field flex items-center gap-3">
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px] flex-shrink-0">
                                    {header}
                                </label>

                                {isDropdown ? (
                                    <div className="relative flex-1">
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
                                            className="w-full appearance-none bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md py-1.5 px-3 text-sm text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <option value="" disabled>Select...</option>
                                            {options.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                            {/* If current value is not in options (custom value), show it */}
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
                                        className="flex-1 bg-transparent border-b border-gray-200 dark:border-gray-700 py-1.5 text-sm text-gray-700 dark:text-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
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
