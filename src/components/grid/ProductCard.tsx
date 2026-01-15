"use client";

import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import { FilterState, useProject } from '@/context/ProjectContext';

interface ProductCardProps {
    data: any;
    headers: string[];
    imageUrl?: string;
    rowIndex: number;
    uniqueValues: Record<string, string[]>;
    onUpdate: (rowIndex: number, column: string, value: any) => void;
    onDelete?: (rowIndex: number) => void;
    activeFilters: FilterState;
}

export function ProductCard({ data, headers, imageUrl, rowIndex, uniqueValues, onUpdate, onDelete, activeFilters }: ProductCardProps) {
    const { originalData } = useProject();
    const [localDrafts, setLocalDrafts] = useState<Record<string, string>>({});
    const isFiltered = Object.keys(activeFilters).length > 0;
    const [zoomStyle, setZoomStyle] = useState({ opacity: 0, x: 0, y: 0 });
    const [isDeleting, setIsDeleting] = useState(false);

    const handleMouseMove = (e: React.MouseEvent) => {
        const { left, top, width, height } = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setZoomStyle({ opacity: 1, x, y });
    };

    const handleMouseLeave = () => {
        setZoomStyle(prev => ({ ...prev, opacity: 0 }));
    };

    // Reset delete state when mouse leaves card to avoid stuck state
    const handleMouseLeaveCard = () => {
        setIsDeleting(false);
    };

    const handleCommit = (column: string) => {
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

    const originalRow = originalData[rowIndex];
    const isModified = originalRow && headers.some(h => String(data[h]) !== String(originalRow[h]));

    // Find the "Name" or "Title" to display prominently
    const titleField = headers.find(h => h.toLowerCase().includes('name') || h.toLowerCase().includes('title')) || headers[0];
    const title = data[titleField];
    const isTitleModified = originalRow && String(title) !== String(originalRow[titleField]);

    const otherHeaders = headers.filter(h => h !== titleField);

    // Find the "ID" field for the badge
    const idField = headers.find(h => h.toLowerCase() === 'id' || h.toLowerCase() === 'id ') || null;
    const idValue = idField ? data[idField] : `#${rowIndex + 1}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onMouseLeave={handleMouseLeaveCard}
            className={cn(
                "group bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-lg border h-[540px] flex flex-col transition-all duration-300 relative",
                isModified
                    ? "border-blue-400 dark:border-blue-500/50 ring-1 ring-blue-500/10"
                    : "border-gray-100 dark:border-gray-800"
            )}
        >
            {/* ID / Index Badge */}
            <div className="absolute top-4 left-4 z-20">
                <div className="bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-full text-[9px] font-bold border border-white/10 uppercase">
                    {idValue}
                </div>
            </div>

            {/* Delete Button - Floating */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    if (isDeleting) {
                        onDelete?.(rowIndex);
                    } else {
                        setIsDeleting(true);
                    }
                }}
                className={cn(
                    "absolute top-4 right-4 z-30 p-2 rounded-xl border transition-all duration-300 group/del shadow-sm flex items-center gap-1.5 backdrop-blur-md",
                    isDeleting
                        ? "bg-red-600 border-red-500 text-white w-auto px-3"
                        : "bg-white/80 dark:bg-black/60 border-gray-200 dark:border-white/10 text-gray-400 hover:text-red-500 hover:border-red-200 dark:hover:border-red-900/50 w-10 overflow-hidden"
                )}
                title={isDeleting ? "Click again to confirm" : "Delete Product"}
            >
                <Trash2 className={cn("w-4 h-4 shrink-0 transition-transform", isDeleting && "scale-110")} />
                {isDeleting && <span className="text-[10px] font-bold whitespace-nowrap">Confirm?</span>}
            </button>

            {/* Image Area - 40% height */}
            <div
                className="h-[270px] relative bg-gray-50 dark:bg-gray-800 overflow-hidden cursor-crosshair border-b border-gray-100 dark:border-gray-800"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                {imageUrl ? (
                    <>
                        {/* Normal Image */}
                        <img
                            src={imageUrl}
                            alt={String(title)}
                            className="object-contain p-0 w-full h-full transition-opacity duration-200"
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
                        <span className="text-4xl text-gray-200 dark:text-gray-700">📷</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">No Image</span>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-900">
                {/* Title Section - Prominent */}
                <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-800/50">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 block">
                        {titleField}
                    </label>
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
                        className={cn(
                            "w-full text-base font-bold bg-transparent border-2 border-transparent hover:border-gray-200 focus:border-blue-500 focus:outline-none transition-colors text-gray-900 dark:text-gray-100 resize-none rounded-md px-2 py-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600",
                            isTitleModified && "text-blue-600 dark:text-blue-400"
                        )}
                        placeholder={`Enter ${titleField}...`}
                        rows={2}
                        style={{ maxHeight: '72px', overflow: 'auto' }}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>

                {/* Quick Edit (Filtered Fields) Section */}
                {Object.keys(activeFilters).length > 0 && (
                    <div className="bg-blue-50/50 dark:bg-blue-900/10 border-b border-gray-100 dark:border-gray-800 px-4 py-2">
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
                                                <div className="relative group/input">
                                                    <input
                                                        list={`datalist-${rowIndex}-${column}`}
                                                        value={localDrafts[column] ?? String(value)}
                                                        onChange={(e) => {
                                                            setLocalDrafts(prev => ({ ...prev, [column]: e.target.value }));
                                                        }}
                                                        onBlur={() => handleCommit(column)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                handleCommit(column);
                                                                (e.target as HTMLInputElement).blur();
                                                            }
                                                        }}
                                                        className={cn(
                                                            "w-full bg-white dark:bg-gray-800 border rounded text-[11px] py-1 pl-1.5 pr-6 transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-gray-200",
                                                            isFieldModified
                                                                ? "border-blue-400 dark:border-blue-500/50 text-blue-600 dark:text-blue-400"
                                                                : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700"
                                                        )}
                                                        placeholder={`Edit ${column}...`}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none opacity-0 group-hover/input:opacity-100 transition-opacity" />
                                                    <datalist id={`datalist-${rowIndex}-${column}`}>
                                                        {options.map(opt => (
                                                            <option key={opt} value={opt} />
                                                        ))}
                                                    </datalist>
                                                </div>
                                            ) : (
                                                <input
                                                    value={localDrafts[column] ?? String(value)}
                                                    onChange={(e) => {
                                                        setLocalDrafts(prev => ({ ...prev, [column]: e.target.value }));
                                                    }}
                                                    onBlur={() => handleCommit(column)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleCommit(column);
                                                            (e.target as HTMLInputElement).blur();
                                                        }
                                                    }}
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
                <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800 space-y-2 max-h-[160px]">
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
                                    <div className="flex items-center gap-2">
                                        {isFieldModified && (
                                            <div className="flex items-center gap-1">
                                                <span className="text-[10px] text-blue-500 font-medium italic opacity-0 group-hover/field:opacity-100 transition-opacity">
                                                    Changed
                                                </span>
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {isDropdown ? (
                                    <div className="relative group/input">
                                        <input
                                            list={`datalist-scroll-${rowIndex}-${header}`}
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
                                            onClick={(e) => e.stopPropagation()}
                                            className={cn(
                                                "w-full bg-gray-50 dark:bg-gray-800 border rounded-md py-1 pl-3 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors",
                                                isFieldModified
                                                    ? "border-blue-400/50 text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-900/5"
                                                    : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                            )}
                                            placeholder={`Edit ${header}...`}
                                        />
                                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none opacity-0 group-hover/input:opacity-100 transition-opacity" />
                                        <datalist id={`datalist-scroll-${rowIndex}-${header}`}>
                                            {options.map(opt => (
                                                <option key={opt} value={opt} />
                                            ))}
                                        </datalist>
                                        <div className="mt-1 text-[10px] text-gray-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                                            Common: {options.slice(0, 3).join(', ')}...
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <input
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
                                            onClick={(e) => e.stopPropagation()}
                                            className={cn(
                                                "w-full bg-gray-50 dark:bg-gray-800 border rounded-md py-1 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors",
                                                isFieldModified
                                                    ? "border-blue-400/50 text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-900/5"
                                                    : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                            )}
                                            placeholder={`Edit ${header}...`}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
}
