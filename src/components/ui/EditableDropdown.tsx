"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditableDropdownProps {
    value: string;
    options: string[];
    column: string;
    onCommit: (val: string) => void;
    rowIndex: number;
    isModified: boolean;
    className?: string;
}

export function EditableDropdown({
    value,
    options,
    column,
    onCommit,
    rowIndex,
    isModified,
    className
}: EditableDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [draft, setDraft] = useState<string | null>(null);
    const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
    const dropdownRef = useRef<HTMLDivElement>(null);
    const displayValue = draft ?? value;

    const updateCoords = () => {
        if (dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    const handleOpen = () => {
        updateCoords();
        setIsOpen(true);
    };

    useEffect(() => {
        if (!isOpen) return;

        const handleInteraction = (e: MouseEvent) => {
            const portalMenu = document.getElementById('dropdown-portal-root');
            if (dropdownRef.current?.contains(e.target as Node)) return;
            if (portalMenu?.contains(e.target as Node)) return;

            setIsOpen(false);
            if (draft !== null) {
                onCommit(draft);
                setDraft(null);
            }
        };

        const handleScroll = () => updateCoords();

        document.addEventListener('mousedown', handleInteraction);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleScroll);

        return () => {
            document.removeEventListener('mousedown', handleInteraction);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleScroll);
        };
    }, [isOpen, draft, onCommit]);

    const menuContent = isOpen && (
        <div
            id="dropdown-portal-root"
            className="fixed z-[9999] pointer-events-auto mt-1"
            style={{
                top: coords.top,
                left: coords.left,
                width: Math.max(coords.width, 320)
            }}
        >
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150 origin-top">
                <div className="p-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center px-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Choose {column}</span>
                    <span className="text-[10px] font-medium text-blue-500">{options.length} options</span>
                </div>
                <div className={cn(
                    "max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800 p-2",
                    options.length > 6 ? "grid grid-cols-2 gap-1" : "flex flex-col gap-1"
                )}>
                    {options.length > 0 ? (
                        options.map(opt => (
                            <button
                                key={opt}
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCommit(opt);
                                    setDraft(null);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "text-left px-3 py-2 text-sm rounded-lg transition-all",
                                    opt === value
                                        ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20"
                                        : "bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-400 border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                                )}
                            >
                                <span className="truncate block" title={opt}>{opt}</span>
                            </button>
                        ))
                    ) : (
                        <div className="col-span-2 px-3 py-4 text-center text-xs text-gray-400 italic">No existing values</div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="relative group/input" ref={dropdownRef}>
            <input
                value={displayValue}
                onChange={(e) => {
                    setDraft(e.target.value);
                    if (!isOpen) handleOpen();
                }}
                onFocus={handleOpen}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        setIsOpen(false);
                        onCommit(draft ?? value);
                        setDraft(null);
                        (e.target as HTMLInputElement).blur();
                    }
                    if (e.key === 'Escape') {
                        setIsOpen(false);
                        setDraft(null);
                        (e.target as HTMLInputElement).blur();
                    }
                }}
                className={cn(
                    "w-full bg-white dark:bg-gray-800 border rounded transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-gray-200",
                    isModified
                        ? "border-blue-400 dark:border-blue-500/50 text-blue-600 dark:text-blue-400"
                        : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700",
                    className
                )}
                placeholder={`Edit ${column}...`}
                onClick={(e) => e.stopPropagation()}
            />
            <ChevronDown className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform duration-200",
                isOpen ? "rotate-180" : "rotate-0"
            )} />

            {isOpen && typeof document !== 'undefined' && createPortal(menuContent, document.body)}
        </div>
    );
}
