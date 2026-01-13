"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, Zap } from 'lucide-react';
import { useProject } from '@/context/ProjectContext';
import { cn } from '@/lib/utils';

export function GlobalSearch() {
    const { searchQuery, setSearchQuery, data, headers } = useProject();
    const [isFocused, setIsFocused] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);

    // Collect all unique values from the dataset for predictive text
    const allUniqueValues = useMemo(() => {
        const values = new Set<string>();
        data.forEach(row => {
            headers.forEach(h => {
                const val = row[h];
                if (val && String(val).trim()) {
                    values.add(String(val).trim());
                }
            });
        });
        return Array.from(values);
    }, [data, headers]);

    // Filter suggestions based on current query
    const suggestions = useMemo(() => {
        if (!searchQuery || searchQuery.startsWith('/') || searchQuery.length < 2) return [];

        const lowerQuery = searchQuery.toLowerCase();
        return allUniqueValues
            .filter(v => v.toLowerCase().includes(lowerQuery))
            .slice(0, 8); // Limit to top 8 suggestions
    }, [searchQuery, allUniqueValues]);

    useEffect(() => {
        setSelectedIndex(-1);
    }, [searchQuery]);

    // Handle outside clicks to close suggestions
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isRegex = searchQuery.startsWith('/') && searchQuery.endsWith('/') && searchQuery.length > 2;

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
            e.preventDefault();
        } else if (e.key === 'ArrowUp') {
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
            e.preventDefault();
        } else if (e.key === 'Enter') {
            if (selectedIndex >= 0) {
                setSearchQuery(suggestions[selectedIndex]);
                setIsFocused(false);
            }
        } else if (e.key === 'Escape') {
            setIsFocused(false);
        }
    };

    return (
        <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
            <div className={cn(
                "relative flex items-center bg-white dark:bg-gray-900 rounded-2xl border-2 transition-all duration-300 shadow-sm",
                isFocused ? "border-blue-500 shadow-blue-500/10 scale-[1.01]" : "border-gray-100 dark:border-gray-800",
                isRegex && "ring-2 ring-violet-500/20"
            )}>
                <div className="pl-4 text-gray-400">
                    {isRegex ? <Zap className="w-5 h-5 text-violet-500 animate-pulse" /> : <Search className="w-5 h-5" />}
                </div>

                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search anything... (use /pattern/ for regex)"
                    className="w-full py-4 px-4 bg-transparent outline-none text-base font-medium placeholder:text-gray-400 dark:text-gray-100"
                />

                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery("")}
                        className="p-2 mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Suggestions Dropdown */}
            {isFocused && suggestions.length > 0 && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2 border-b border-gray-50 dark:border-gray-800 text-[10px] uppercase tracking-wider font-bold text-gray-400 flex justify-between items-center">
                        <span>Predictive Matches</span>
                        <span>{suggestions.length} suggested</span>
                    </div>
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={suggestion}
                            onClick={() => {
                                setSearchQuery(suggestion);
                                setIsFocused(false);
                            }}
                            onMouseEnter={() => setSelectedIndex(index)}
                            className={cn(
                                "w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between",
                                index === selectedIndex ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300" : "text-gray-600 dark:text-gray-400"
                            )}
                        >
                            <span className="truncate">{suggestion}</span>
                            {index === selectedIndex && <ArrowRight className="w-3 h-3" />}
                        </button>
                    ))}
                </div>
            )}

            {/* Regex Mode Indicator */}
            {isRegex && (
                <div className="absolute -top-6 right-2 text-[10px] font-bold text-violet-500 uppercase tracking-widest flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Regex Mode Active
                </div>
            )}
        </div>
    );
}

function ArrowRight({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
    );
}
