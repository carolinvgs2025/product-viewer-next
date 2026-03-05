"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { FilterState, useProject } from '@/context/ProjectContext';
import { EditableDropdown } from '../ui/EditableDropdown';

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

    const titleField = headers.find(h => {
        const lowerHeader = h.toLowerCase();
        return lowerHeader.includes('name') ||
            lowerHeader.includes('product description') ||
            lowerHeader.includes('description') ||
            lowerHeader.includes('title');
    }) || headers[0];
    const title = data[titleField];
    const isTitleModified = originalRow && String(title) !== String(originalRow[titleField]);

    const otherHeaders = headers.filter(h => h !== titleField);

    const idField = headers.find(h => {
        const lowerHeader = h.toLowerCase().trim();
        return lowerHeader === 'id' ||
            lowerHeader === 'product id' ||
            lowerHeader === 'item id' ||
            lowerHeader.includes('image id');
    }) || null;
    const idValue = idField ? data[idField] : `#${rowIndex + 1}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onMouseLeave={handleMouseLeaveCard}
            className={cn(
                "group bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-lg border h-[600px] flex flex-col transition-all duration-300 relative",
                isModified
                    ? "border-blue-400 dark:border-blue-500/50 ring-1 ring-blue-500/10"
                    : "border-gray-100 dark:border-gray-800"
            )}
        >
            <div className="absolute top-4 left-4 z-20">
                <div className="bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xl font-bold border border-white/10 uppercase tracking-tight">
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

            {!imageUrl && (
                <div className="absolute top-4 left-[88px] z-20">
                    <div className="bg-red-500 text-white px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/40 animate-pulse">
                        MISSING
                    </div>
                </div>
            )}

            <div
                className="h-[320px] relative bg-gray-50 dark:bg-gray-800 overflow-hidden cursor-crosshair border-b border-gray-100 dark:border-gray-800"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                {imageUrl ? (
                    <>
                        <img
                            src={imageUrl}
                            alt={String(title)}
                            className="object-contain p-0 w-full h-full"
                            style={{ opacity: zoomStyle.opacity ? 0.3 : 1 }}
                        />
                        <div
                            className="absolute inset-0 pointer-events-none"
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

            <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-900">
                <div className={cn(
                    "px-4 border-b border-gray-50 dark:border-gray-800/50",
                    (titleField.toLowerCase() === 'id' || titleField.toLowerCase().includes('id')) ? "py-1.5" : "py-3"
                )}>
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5 block">
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
                            "w-full bg-transparent border-2 border-transparent hover:border-gray-200 focus:border-blue-500 focus:outline-none transition-colors text-gray-900 dark:text-gray-100 resize-none rounded-md px-2 py-0.5 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600",
                            (titleField.toLowerCase() === 'id' || titleField.toLowerCase().includes('id')) ? "text-sm font-semibold" : "text-base font-bold",
                            isTitleModified && "text-blue-600 dark:text-blue-400"
                        )}
                        placeholder={`Enter ${titleField}...`}
                        rows={(titleField.toLowerCase() === 'id' || titleField.toLowerCase().includes('id')) ? 1 : 2}
                        style={{ maxHeight: '72px', overflow: 'auto' }}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>

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
                                                <div className="space-y-1.5">
                                                    <EditableDropdown
                                                        value={localDrafts[column] ?? String(value)}
                                                        options={options}
                                                        column={column}
                                                        rowIndex={rowIndex}
                                                        isModified={isFieldModified}
                                                        onCommit={(val) => onUpdate(rowIndex, column, val)}
                                                        className="py-1 pl-1.5 pr-6 text-[11px]"
                                                    />
                                                    {options.length > 0 && options.length <= 8 && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {options.map(opt => (
                                                                <button
                                                                    key={opt}
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onUpdate(rowIndex, column, opt);
                                                                    }}
                                                                    className={cn(
                                                                        "px-1.5 py-0.5 rounded text-[9px] font-medium transition-all",
                                                                        String(value) === opt
                                                                            ? "bg-blue-100 text-blue-700 border border-blue-200"
                                                                            : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-transparent"
                                                                    )}
                                                                >
                                                                    {opt}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
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

                <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-500 space-y-2 max-h-[200px]">
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
                                    <div className="relative">
                                        <EditableDropdown
                                            value={localDrafts[header] ?? String(value)}
                                            options={options}
                                            column={header}
                                            rowIndex={rowIndex}
                                            isModified={isFieldModified}
                                            onCommit={(val) => onUpdate(rowIndex, header, val)}
                                            className={cn(
                                                "py-1 pl-3 pr-8 text-sm",
                                                !isFieldModified && "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700"
                                            )}
                                        />
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
