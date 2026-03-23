import React, { useState, useMemo } from 'react';
import { useProject } from '@/context/ProjectContext';
import { ChevronDown, ChevronRight, X, Filter, Eye, EyeOff, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FilterPanel() {
    const { columnMetadata, data, filters, setFilter, clearFilters, showOnlyMissingImages, setShowOnlyMissingImages, images, headers, hiddenColumns, toggleColumnVisibility, updateHeaderOrder } = useProject();
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['System Filters']));
    const [expandedFilters, setExpandedFilters] = useState<Set<string>>(new Set());
    const [draggedHeader, setDraggedHeader] = useState<string | null>(null);
    const [dragOverHeader, setDragOverHeader] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent, header: string) => {
        setDraggedHeader(header);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnd = (e: React.DragEvent) => {
        setDraggedHeader(null);
        setDragOverHeader(null);
    };

    const handleDragOver = (e: React.DragEvent, targetHeader: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverHeader !== targetHeader) {
            setDragOverHeader(targetHeader);
        }
    };

    const handleDragLeave = (e: React.DragEvent, targetHeader: string) => {
        if (dragOverHeader === targetHeader) {
            setDragOverHeader(null);
        }
    };

    const handleDrop = (e: React.DragEvent, targetHeader: string) => {
        e.preventDefault();
        setDragOverHeader(null);
        if (!draggedHeader || draggedHeader === targetHeader) return;

        const newHeaders = [...headers];
        const draggedIdx = newHeaders.indexOf(draggedHeader);
        const targetIdx = newHeaders.indexOf(targetHeader);

        newHeaders.splice(draggedIdx, 1);
        
        // Since we removed 'draggedIdx', the true index of 'targetHeader' might have shifted.
        // We always want to insert the dragged header directly ABOVE the targetHeader.
        const insertIdx = draggedIdx < targetIdx ? targetIdx - 1 : targetIdx;
        newHeaders.splice(insertIdx, 0, draggedHeader);

        updateHeaderOrder(newHeaders);
    };

    // Get unique values for each column
    const columnValues = useMemo(() => {
        const values: Record<string, Set<string>> = {};

        const filteredMeta = columnMetadata;

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

    const configurableHeaders = headers;

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg p-4 sticky top-4 max-h-[calc(100vh-120px)] flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <h3 className="font-semibold text-gray-700 dark:text-gray-200">Attributes & Filters</h3>
                    {activeFilterCount > 0 && (
                        <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {activeFilterCount}
                        </span>
                    )}
                </div>
                {activeFilterCount > 0 && (
                    <button
                        onClick={clearAllWithSystem}
                        className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1 transition-colors"
                    >
                        <X className="w-3 h-3" />
                        Clear All
                    </button>
                )}
            </div>

            <div className="space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-500 flex-1 pr-2">
                {/* System Filters */}
                <div className="border border-blue-100 dark:border-blue-900/30 rounded-lg overflow-hidden mb-4">
                    <button
                        onClick={() => toggleGroup('System Filters')}
                        className="w-full flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-100/50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                        <span className="font-bold text-sm text-blue-700 dark:text-blue-400 uppercase tracking-tight">System Checks</span>
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

                {/* Unified Attribute List */}
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                    Card Attributes
                </div>
                
                {configurableHeaders.map(header => {
                    const isHidden = hiddenColumns.has(header);
                    const isExpanded = expandedGroups.has(header);
                    const activeValues = filters[header] || new Set();
                    const hasActiveFilters = activeValues.size > 0;
                    
                    const meta = columnMetadata.find(c => c.header === header);
                    const isDistribution = meta?.group?.toLowerCase().includes('distribution');

                    // Values for filtering (only if not distribution)
                    const values = isDistribution ? [] : Array.from(columnValues[header] || []).sort();
                    const isFilterExpanded = expandedFilters.has(header);
                    const displayValues = isFilterExpanded ? values : values.slice(0, 5);
                    const hasMore = values.length > 5;
                    const canExpand = isDistribution || values.length > 0;

                    return (
                        <div 
                            key={`attr-${header}`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, header)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => handleDragOver(e, header)}
                            onDragLeave={(e) => handleDragLeave(e, header)}
                            onDrop={(e) => handleDrop(e, header)}
                            className={cn(
                                "border rounded-lg overflow-hidden mb-2 transition-all bg-white dark:bg-gray-900 group/item",
                                draggedHeader === header && "opacity-50 blur-[1px]",
                                dragOverHeader === header && draggedHeader !== header && "border-t-2 border-blue-500 shadow-[0_-4px_10px_rgba(59,130,246,0.2)] rounded-t-none",
                                hasActiveFilters ? "border-blue-300 dark:border-blue-700 shadow-sm" : "border-gray-200 dark:border-gray-800"
                            )}
                        >
                            {/* Accordion Header */}
                            <div className="flex items-center justify-between p-1 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                    <div className="text-gray-300 dark:text-gray-600 cursor-grab active:cursor-grabbing px-1 hover:text-gray-500 py-1">
                                        <GripVertical className="w-4 h-4" />
                                    </div>
                                    
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleColumnVisibility(header);
                                        }}
                                        className={cn(
                                            "p-1.5 rounded-md transition-all",
                                            isHidden 
                                                ? "text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700" 
                                                : "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                                        )}
                                        title={isHidden ? "Show on card" : "Hide from card"}
                                    >
                                        {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                    
                                    <button 
                                        onClick={() => toggleGroup(header)} 
                                        disabled={!canExpand}
                                        className={cn(
                                            "flex-1 flex items-center justify-between text-left truncate pr-2 py-1.5",
                                            !canExpand && "cursor-default"
                                        )}
                                    >
                                        <span className={cn(
                                            "text-sm font-semibold truncate transition-all duration-200", 
                                            isHidden ? "text-gray-400 dark:text-gray-500 line-through" : "text-gray-700 dark:text-gray-200",
                                            hasActiveFilters && "text-blue-700 dark:text-blue-400"
                                        )}>
                                            {header}
                                        </span>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {hasActiveFilters && (
                                                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                                            )}
                                            {canExpand && (
                                                isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />
                                            )}
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Accordion Body (Filters) */}
                            {isExpanded && canExpand && (
                                <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                                    {isDistribution ? (
                                        <div className="space-y-1">
                                            <label className="flex items-center gap-2 cursor-pointer hover:bg-white dark:hover:bg-gray-800 p-1.5 rounded transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700 shadow-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={activeValues.has('__HAS_VALUE__')}
                                                    onChange={() => toggleValue(header, '__HAS_VALUE__')}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className={cn(
                                                    "text-sm",
                                                    activeValues.has('__HAS_VALUE__') ? "text-gray-900 dark:text-white font-medium" : "text-gray-600 dark:text-gray-400"
                                                )}>
                                                    Requires Value
                                                </span>
                                            </label>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-500 pr-1">
                                                {displayValues.map(value => {
                                                    const isActive = activeValues.has(value);
                                                    return (
                                                        <label
                                                            key={value}
                                                            className={cn(
                                                                "flex items-center gap-2 cursor-pointer p-1.5 rounded transition-colors border shadow-sm",
                                                                isActive 
                                                                    ? "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50" 
                                                                    : "bg-white dark:bg-gray-900 border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                                                            )}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isActive}
                                                                onChange={() => toggleValue(header, value)}
                                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <span className={cn(
                                                                "text-sm truncate",
                                                                isActive ? "text-blue-900 dark:text-blue-100 font-medium" : "text-gray-600 dark:text-gray-400"
                                                            )}>
                                                                {value}
                                                            </span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                            {hasMore && (
                                                <button
                                                    onClick={() => toggleFilterExpansion(header)}
                                                    className="w-full text-left text-[11px] font-bold text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 px-1 py-2 flex items-center justify-center gap-1 mt-2 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 transition-colors shadow-sm"
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
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
