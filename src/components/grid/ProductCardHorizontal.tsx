"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { FilterState, useProject } from '@/context/ProjectContext';
import { EditableDropdown } from '../ui/EditableDropdown';

interface ProductCardHorizontalProps {
    data: any;
    headers: string[];
    imageUrl?: string;
    rowIndex: number;
    uniqueValues: Record<string, string[]>;
    onUpdate: (rowIndex: number, column: string, value: any) => void;
    onDelete?: (rowIndex: number) => void;
    activeFilters: FilterState;
}

export function ProductCardHorizontal({ data, headers, imageUrl, rowIndex, uniqueValues, onUpdate, onDelete, activeFilters }: ProductCardHorizontalProps) {
    const isFiltered = Object.keys(activeFilters).length > 0;
    const [localDrafts, setLocalDrafts] = useState<Record<string, string>>({});
    const { originalData } = useProject();
    const [isDeleting, setIsDeleting] = useState(false);

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

    const titleField = headers.find(h => {
        const lowerHeader = h.toLowerCase();
        return lowerHeader.includes('name') || lowerHeader.includes('product description') || lowerHeader.includes('title');
    }) || headers[0];
    const title = data[titleField];

    const quickEditColumns = Object.keys(activeFilters).filter(col => col !== titleField);
    const otherHeaders = headers.filter(h => h !== titleField && !quickEditColumns.includes(h));

    const idField = headers.find(h => {
        const lowerHeader = h.toLowerCase().trim();
        return lowerHeader === 'id' || lowerHeader === 'product id' || lowerHeader === 'item id' || lowerHeader.includes('image id');
    }) || null;
    const idValue = idField ? data[idField] : `#${rowIndex + 1}`;

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
                "group bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border flex flex-col md:flex-row transition-all duration-300 relative",
                isModified
                    ? "border-blue-400 dark:border-blue-500/50 ring-1 ring-blue-500/10 shadow-blue-500/5 shadow-lg"
                    : "border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700"
            )}
        >
            <div className="absolute top-4 left-4 z-20">
                <div className="bg-black/70 backdrop-blur-md text-white px-4 py-1.5 rounded-xl text-2xl font-black border border-white/20 uppercase tracking-tighter shadow-2xl">
                    {idValue}
                </div>
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    if (isDeleting) {
                        onDelete?.(rowIndex);
                    } else {
                        setIsDeleting(true);
                    }
                }}
                onMouseLeave={() => setIsDeleting(false)}
                className={cn(
                    "absolute top-3 right-3 z-30 p-2 rounded-xl border transition-all duration-300 group/del shadow-sm flex items-center gap-1.5 backdrop-blur-md",
                    isDeleting
                        ? "bg-red-600 border-red-500 text-white w-auto px-3"
                        : "bg-white/80 dark:bg-black/60 border-gray-200 dark:border-white/10 text-gray-400 hover:text-red-500 hover:border-red-200 dark:hover:border-red-900/50 w-10 overflow-hidden"
                )}
            >
                <Trash2 className={cn("w-4 h-4 shrink-0 transition-transform", isDeleting && "scale-110")} />
                {isDeleting && <span className="text-[10px] font-bold whitespace-nowrap">Delete?</span>}
            </button>

            <div className="w-full md:w-[480px] h-64 md:h-auto shrink-0 relative bg-gray-50 dark:bg-gray-800 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800 overflow-hidden">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={String(title)}
                        className="object-contain w-full h-full transform group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-300 flex-col gap-2">
                        <span className="text-4xl">📷</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">No Image</span>
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900">
                <div className="p-5 pb-3 border-b border-gray-50 dark:border-gray-800/50 flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">
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
                        className="w-full text-lg font-bold bg-transparent border-none focus:ring-0 p-1 text-gray-900 dark:text-gray-100 resize-none rounded-md placeholder-gray-300 dark:placeholder-gray-700 leading-tight"
                        placeholder={`Enter ${titleField}...`}
                        rows={1}
                        style={{ overflow: 'hidden' }}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>

                <div className="flex-1 overflow-x-auto scrollbar-hide">
                    <div className="p-5 flex gap-6">
                        {quickEditColumns.length > 0 ? (
                            <div className="shrink-0 space-y-3 min-w-[280px]">
                                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                    <Plus className="w-3 h-3" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Quick View</span>
                                </div>
                                <div className="grid grid-cols-1 gap-3 bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100/50 dark:border-blue-900/30">
                                    {quickEditColumns.map((column) => {
                                        const value = data[column] || "";
                                        const options = uniqueValues[column];
                                        const isDropdown = options && options.length > 0;
                                        const isFieldModified = originalRow && String(value) !== String(originalRow[column]);

                                        return (
                                            <div key={column} className="flex flex-col gap-1.5 relative">
                                                <label className="text-[9px] font-bold text-blue-500/80 dark:text-blue-400/80 uppercase tracking-widest px-1">
                                                    {column}
                                                </label>
                                                {isDropdown ? (
                                                    <div className="space-y-1.5">
                                                        <EditableDropdown
                                                            value={localDrafts[column] ?? String(value)}
                                                            options={options}
                                                            column={column}
                                                            rowIndex={rowIndex}
                                                            isModified={isFieldModified}
                                                            onCommit={(val) => onUpdate(rowIndex, column, val)}
                                                            className="py-1.5 pl-3 pr-8 text-xs font-semibold shadow-sm"
                                                        />
                                                        {options.length > 0 && options.length <= 8 ? (
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {options.map(opt => (
                                                                    <button
                                                                        key={opt}
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            onUpdate(rowIndex, column, opt);
                                                                        }}
                                                                        className={cn(
                                                                            "px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all",
                                                                            String(value) === opt
                                                                                ? "bg-blue-600 text-white shadow-sm"
                                                                                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
                                                                        )}
                                                                    >
                                                                        {opt}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        ) : null}
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
                                                            "w-full bg-white dark:bg-gray-800 border rounded-lg text-xs font-semibold py-1.5 px-3 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-gray-200 shadow-sm transition-all",
                                                            isFieldModified
                                                                ? "border-blue-400 text-blue-600"
                                                                : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                                                        )}
                                                        placeholder={`Edit...`}
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : null}

                        <div className="flex gap-6 min-w-0">
                            {otherHeaders.map((header) => {
                                const value = data[header] || "";
                                const options = uniqueValues[header];
                                const isDropdown = options && options.length > 0;
                                const isFieldModified = originalRow && String(value) !== String(originalRow[header]);

                                return (
                                    <div key={header} className="flex flex-col gap-1.5 min-w-[200px] border-l border-gray-50 dark:border-gray-800 pl-4 first:border-0 first:pl-0 group/field">
                                        <div className="flex items-center gap-1.5">
                                            <Edit2 className="w-2.5 h-2.5 text-gray-300 group-hover/field:text-blue-400 transition-colors" />
                                            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest whitespace-nowrap">
                                                {header}
                                            </label>
                                        </div>

                                        {isDropdown ? (
                                            <div className="relative">
                                                <EditableDropdown
                                                    value={localDrafts[header] ?? String(value)}
                                                    options={options}
                                                    column={header}
                                                    rowIndex={rowIndex}
                                                    isModified={isFieldModified}
                                                    onCommit={(val) => onUpdate(rowIndex, header, val)}
                                                    className="py-1.5 pl-3 pr-8 text-xs font-medium bg-gray-50/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 hover:bg-white dark:hover:bg-gray-800 transition-all"
                                                />
                                                <div className="mt-1 text-[8px] text-gray-400 font-bold uppercase tracking-tight opacity-0 group-hover/field:opacity-100 transition-opacity">
                                                    {options.length} Options available
                                                </div>
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
                                                onClick={(e) => e.stopPropagation()}
                                                className={cn(
                                                    "w-full bg-transparent border-none focus:ring-0 p-1 text-sm font-medium text-gray-700 dark:text-gray-200 resize-none rounded-md placeholder-gray-200 dark:placeholder-gray-800 leading-snug",
                                                    isFieldModified && "text-blue-600 font-bold"
                                                )}
                                                placeholder="Empty"
                                                rows={2}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// Rebuild trigger
