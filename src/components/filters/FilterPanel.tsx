"use client";

import React, { useState, useMemo } from 'react';
import { useProject } from '@/context/ProjectContext';
import { ChevronDown, ChevronRight, X, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FilterPanel() {
    const { columnMetadata, data, filters, setFilter, clearFilters, showOnlyMissingImages, setShowOnlyMissingImages, images } = useProject();
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['System Filters']));
    const [expandedFilters, setExpandedFilters] = useState<Set<string>>(new Set());

    // Group columns by their category
    const groupedColumns = useMemo(() => {
        const groups: Record<string, string[]> = {};

        columnMetadata.forEach(({ header, group }) => {
            const lowerHeader = header.toLowerCase().trim();
            if (lowerHeader === 'id' || lowerHeader === 'name') return;

            if (!groups[group]) {
                groups[group] = [];
            }
            groups[group].push(header);
        });

        return groups;
    }, [columnMetadata]);

    // Get unique values for each column
    const columnValues = useMemo(() => {
        const values: Record<string, Set<string>> = {};

        const filteredMeta = columnMetadata.filter(({ header }) => {
            const lowerHeader = header.toLowerCase().trim();
            return lowerHeader !== 'id' && lowerHeader !== 'name';
        });

        filteredMeta.forEach(({ header }) => {
            values[header] = new Set();
        });

        data.forEach(row => {
            filteredMeta.forEach(({ header }) => {
                const val = row[header];
                if (val !== null && val !== undefined && String(val).trim() !== '') {
                    values[header].add(String(val));
                } else {
                    values[header].add('(Blank)');
                }
            });
        });

        return values;
    }, [data, columnMetadata]);

    const toggleGroup = (group: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(group)) {
                next.delete(group);
            } else {
                next.add(group);
            }
            return next;
        });
    };

    const toggleFilterExpansion = (column: string) => {
        setExpandedFilters(prev => {
            const next = new Set(prev);
            if (next.has(column)) {
                next.delete(column);
            } else {
                next.add(column);
            }
            return next;
        });
    };

    const toggleValue = (column: string, value: string) => {
        const currentFilter = filters[column] || new Set();
        const newFilter = new Set(currentFilter);

        if (newFilter.has(value)) {
            newFilter.delete(value);
        } else {
            newFilter.add(value);
        }

        setFilter(column, newFilter);
    };

    const activeFilterCount = Object.values(filters).reduce((sum, set) => sum + set.size, 0) + (showOnlyMissingImages ? 1 : 0);

    const missingImagesCount = useMemo(() => {
        const headers = columnMetadata.map(m => m.header);
        return data.filter(row => {
            const hasImage = headers.some(h => {
                const val = String(row[h] || "").trim();
                if (!val) return false;
                if (images[val]) return true;
                const fuzzyKey = Object.keys(images).find(k => k === val || k.startsWith(val + '.'));
                if (fuzzyKey) return true;
                return typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://'));
            });
            return !hasImage;
        }).length;
    }, [data, images, columnMetadata]);

    if (columnMetadata.length === 0) {
        return null;
    }

    const clearAllWithSystem = () => {
        clearFilters();
        setShowOnlyMissingImages(false);
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg p-4 sticky top-4 max-h-[calc(100vh-120px)] flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <h3 className="font-semibold text-gray-700 dark:text-gray-200">Filters</h3>
                    {activeFilterCount > 0 && (
                        <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {activeFilterCount}
                        </span>
                    )}
                </div>
                {activeFilterCount > 0 && (
                    <button
                        onClick={clearAllWithSystem}
                        className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
                    >
                        <X className="w-3 h-3" />
                        Clear All
                    </button>
                )}
            </div>

            <div className="space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-500 flex-1 pr-2">
                {/* System Filters */}
                <div className="border border-blue-100 dark:border-blue-900/30 rounded-lg overflow-hidden mb-2">
                    <button
                        onClick={() => toggleGroup('System Filters')}
                        className="w-full flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-100/50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                        <span className="font-bold text-sm text-blue-700 dark:text-blue-400 uppercase tracking-tight">System Filters</span>
                        {expandedGroups.has('System Filters') ? (
                            <ChevronDown className="w-4 h-4 text-blue-500" />
                        ) : (
                            <ChevronRight className="w-4 h-4 text-blue-500" />
                        )}
                    </button>

                    {expandedGroups.has('System Filters') && (
                        <div className="p-3 space-y-3 bg-white dark:bg-gray-900">
                            <label className="flex items-center justify-between cursor-pointer group">
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Missing Images</span>
                                    <span className="text-[10px] text-gray-500 font-medium">{missingImagesCount} products need attention</span>
                                </div>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={showOnlyMissingImages}
                                        onChange={(e) => setShowOnlyMissingImages(e.target.checked)}
                                    />
                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                </div>
                            </label>
                        </div>
                    )}
                </div>
                {Object.entries(groupedColumns).map(([group, columns]) => {
                    if (group === 'Identification') return null;

                    const isExpanded = expandedGroups.has(group);
                    const isDistributionGroup = group.toLowerCase().includes('distribution');

                    return (
                        <div key={group} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                            <button
                                onClick={() => toggleGroup(group)}
                                className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">{group}</span>
                                {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-500" />
                                )}
                            </button>

                            {isExpanded && (
                                <div className="p-3 space-y-3 bg-white dark:bg-gray-900">
                                    {columns.map(column => {
                                        const activeValues = filters[column] || new Set();

                                        // For distribution columns, show presence/absence checkboxes
                                        if (isDistributionGroup) {
                                            return (
                                                <div key={column} className="space-y-1">
                                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        {column}
                                                    </label>
                                                    <div className="space-y-1">
                                                        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded transition-colors">
                                                            <input
                                                                type="checkbox"
                                                                checked={activeValues.has('__HAS_VALUE__')}
                                                                onChange={() => toggleValue(column, '__HAS_VALUE__')}
                                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                                                Has Value
                                                            </span>
                                                        </label>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        // For non-distribution columns, show regular value-based filters
                                        const values = Array.from(columnValues[column] || []).sort();

                                        if (values.length === 0 || values.length > 500) {
                                            return null; // Skip columns with no values or too many values
                                        }

                                        const isFilterExpanded = expandedFilters.has(column);
                                        const displayValues = isFilterExpanded ? values : values.slice(0, 5);
                                        const hasMore = values.length > 5;

                                        return (
                                            <div key={column} className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        {column}
                                                    </label>
                                                </div>
                                                <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-500">
                                                    {displayValues.map(value => (
                                                        <label
                                                            key={value}
                                                            className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded transition-colors"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={activeValues.has(value)}
                                                                onChange={() => toggleValue(column, value)}
                                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                                                {value}
                                                            </span>
                                                        </label>
                                                    ))}

                                                    {hasMore && (
                                                        <button
                                                            onClick={() => toggleFilterExpansion(column)}
                                                            className="w-full text-left text-[11px] font-bold text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 px-1 py-1 flex items-center gap-1 mt-1 transition-colors"
                                                        >
                                                            {isFilterExpanded ? (
                                                                <>
                                                                    <ChevronDown className="w-3 h-3 rotate-180" />
                                                                    Show Less
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ChevronDown className="w-3 h-3" />
                                                                    Show All ({values.length})
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
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
    );
}
