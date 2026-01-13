"use client";

import React from 'react';
import { useProject } from '@/context/ProjectContext';
import { X } from 'lucide-react';

export function ActiveFilterTags() {
    const { filters, setFilter, columnMetadata } = useProject();

    const activeFilters = Object.entries(filters).flatMap(([column, values]) =>
        Array.from(values).map(value => ({
            column,
            value,
            group: columnMetadata.find(m => m.header === column)?.group || 'Identification'
        }))
    );

    if (activeFilters.length === 0) {
        return null;
    }

    const removeFilter = (column: string, value: string) => {
        const currentFilter = filters[column] || new Set();
        const newFilter = new Set(currentFilter);
        newFilter.delete(value);
        setFilter(column, newFilter);
    };

    return (
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-3 sticky top-0 z-20 shadow-sm">
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Active Filters:
                </span>
                {activeFilters.map(({ column, value, group }) => (
                    <div
                        key={`${column}-${value}`}
                        className="inline-flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full text-xs font-medium border border-blue-200 dark:border-blue-800"
                    >
                        <span className="text-blue-500 dark:text-blue-400 font-bold">{group}:</span>
                        <span className="font-semibold">{column}</span>
                        <span className="text-blue-400 dark:text-blue-500">=</span>
                        <span>{value}</span>
                        <button
                            onClick={() => removeFilter(column, value)}
                            className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                            aria-label={`Remove filter ${column}: ${value}`}
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
