"use client";

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit2, ChevronDown, ChevronRight } from 'lucide-react';
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
    const { originalData, hiddenColumns, columnMetadata } = useProject();
    const [isDeleting, setIsDeleting] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Identity', 'System Filters']));

    const toggleGroup = (group: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(group)) next.delete(group);
            else next.add(group);
            return next;
        });
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

    const titleField = headers.find(h => {
        const lowerHeader = h.toLowerCase();
        return lowerHeader.includes('name') || lowerHeader.includes('product description') || lowerHeader.includes('title');
    }) || headers[0];
    const title = data[titleField];

    // Group headers by their metadata group
    const groupedAttributes = useMemo(() => {
        const groups: Record<string, string[]> = {};
        const visibleHeaders = headers.filter(h => h !== titleField && !hiddenColumns.has(h));
        
        visibleHeaders.forEach(header => {
            const meta = columnMetadata.find(m => m.header === header);
            const groupName = meta?.group || 'Other';
            if (!groups[groupName]) groups[groupName] = [];
            groups[groupName].push(header);
        });
        
        return groups;
    }, [headers, columnMetadata, hiddenColumns, titleField]);

    const idField = headers.find(h => {
        const lowerHeader = h.toLowerCase().trim();
        return lowerHeader === 'id' || lowerHeader === 'product id';
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
                <div 
                    className="p-5 pb-3 border-b border-gray-50 dark:border-gray-800/50 flex flex-col gap-1"
                    onClick={(e) => e.stopPropagation()}
                >
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
                        rows={3}
                        style={{ minHeight: '60px', height: 'auto', overflow: 'hidden' }}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>

                <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {Object.entries(groupedAttributes).map(([groupName, groupHeaders]: [string, string[]]) => {
                            const isExpanded = expandedGroups.has(groupName);
                            
                            return (
                                <div key={groupName} className="border-b border-gray-50 dark:border-gray-800/50 last:border-none">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleGroup(groupName);
                                        }}
                                        className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group/header"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-1 h-4 bg-blue-500 rounded-full opacity-0 group-hover/header:opacity-100 transition-opacity" />
                                            <span className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">
                                                {groupName}
                                            </span>
                                            <span className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-[9px] font-bold text-gray-400">
                                                {groupHeaders.length}
                                            </span>
                                        </div>
                                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                                    </button>

                                    {isExpanded && (
                                        <div className="px-5 pb-6 pt-2 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                            {groupHeaders.map((header: string) => {
                                                const value = data[header] || "";
                                                const options = uniqueValues[header];
                                                const isDropdown = options && options.length > 0;
                                                const isFieldModified = originalRow && String(value) !== String(originalRow[header]);
                                                const hasDraft = localDrafts[header] !== undefined;
                                                const displayValue = hasDraft ? localDrafts[header] : String(value || "—");

                                                return (
                                                    <div key={header} className="flex flex-col gap-1.5 group/field relative">
                                                        <div className="flex items-center justify-between group-hover/field:translate-x-0.5 transition-transform duration-200">
                                                            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest truncate max-w-[140px]">
                                                                {header}
                                                            </label>
                                                            {isFieldModified && (
                                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" title="Modified" />
                                                            )}
                                                        </div>

                                                        <div className="relative">
                                                            {isDropdown ? (
                                                                <div 
                                                                    className="-ml-2"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <EditableDropdown
                                                                        value={hasDraft ? localDrafts[header] : String(value)}
                                                                        options={options}
                                                                        column={header}
                                                                        rowIndex={rowIndex}
                                                                        isModified={isFieldModified}
                                                                        onCommit={(val) => onUpdate(rowIndex, header, val)}
                                                                        className={cn(
                                                                            "py-1.5 px-2 text-sm font-semibold transition-all border-none shadow-none focus-within:bg-white dark:focus-within:bg-gray-800",
                                                                            "bg-transparent hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-lg",
                                                                            isFieldModified && "text-blue-600 dark:text-blue-400"
                                                                        )}
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <textarea
                                                                    value={displayValue}
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
                                                                        "w-full bg-transparent border-none focus:ring-1 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-gray-800 px-2 py-1.5 text-sm font-semibold text-gray-800 dark:text-gray-100 resize-none rounded-lg transition-all",
                                                                        "hover:bg-gray-100/50 dark:hover:bg-gray-800/50",
                                                                        isFieldModified && "text-blue-600 dark:text-blue-400",
                                                                        !value && !hasDraft && "text-gray-300 dark:text-gray-700 italic font-normal"
                                                                    )}
                                                                    placeholder="Empty"
                                                                    rows={1}
                                                                    onInput={(e) => {
                                                                        const target = e.target as HTMLTextAreaElement;
                                                                        target.style.height = 'auto';
                                                                        target.style.height = `${target.scrollHeight}px`;
                                                                    }}
                                                                    style={{ minHeight: '32px', overflow: 'hidden' }}
                                                                />
                                                            )}
                                                            
                                                            <Edit2 className="absolute right-2 top-2 w-3 h-3 text-gray-300 dark:text-gray-600 opacity-0 group-hover/field:opacity-100 transition-opacity pointer-events-none" />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// Rebuild trigger
