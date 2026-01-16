"use client";

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { ColumnMetadata } from '@/lib/excel-parser';

export interface FilterState {
    [column: string]: Set<string>; // column -> selected values
}

interface ProjectContextType {
    data: any[];
    originalData: any[];
    filteredData: any[];
    headers: string[];
    columnMetadata: ColumnMetadata[];
    images: Record<string, string>;
    filters: FilterState;
    showOnlyChanged: boolean;
    setShowOnlyChanged: (show: boolean) => void;
    setProjectData: (result: { headers: string[], data: any[], columnMetadata: ColumnMetadata[] }) => void;
    updateImages: (newImages: Record<string, string>) => void;
    updateCell: (rowIndex: number, column: string, value: any) => void;
    bulkUpdate: (updates: { rowIndex: number, column: string, value: any }[]) => void;
    deleteRow: (rowIndex: number) => void;
    uniqueValues: Record<string, string[]>;
    setFilter: (column: string, values: Set<string>) => void;
    clearFilters: () => void;
    undo: () => void;
    canUndo: boolean;
    hasImageLinks: boolean;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    sorting: { column: string; desc: boolean } | null;
    setSorting: (sorting: { column: string; desc: boolean } | null) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const MAX_HISTORY = 50;

export function ProjectProvider({ children }: { children: React.ReactNode }) {
    const [data, setData] = useState<any[]>([]);
    const [originalData, setOriginalData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [columnMetadata, setColumnMetadata] = useState<ColumnMetadata[]>([]);
    const [images, setImages] = useState<Record<string, string>>({});
    const [filters, setFilters] = useState<FilterState>({});
    const [showOnlyChanged, setShowOnlyChanged] = useState(false);
    const [history, setHistory] = useState<any[][]>([]);
    const [hasImageLinks, setHasImageLinks] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [sorting, setSorting] = useState<{ column: string; desc: boolean } | null>(null);

    const setProjectData = useCallback((result: { headers: string[], data: any[], columnMetadata: ColumnMetadata[] }) => {
        setHeaders(result.headers);
        const dataWithIndices = result.data.map((row, index) => ({
            ...row,
            __rowIndex: index
        }));
        setData(dataWithIndices);
        setOriginalData(JSON.parse(JSON.stringify(dataWithIndices)));
        setColumnMetadata(result.columnMetadata || []);
        setFilters({});
        setShowOnlyChanged(false);
        setSearchQuery("");
        setSorting(null);
        setHistory([]); // Clear history on new data

        // Check for Image Links
        const potentialImageHeaders = result.headers.filter(h =>
            h.toLowerCase().includes('image') &&
            (h.toLowerCase().includes('link') || h.toLowerCase().includes('url') || h.toLowerCase().includes('src') || h.toLowerCase() === 'image')
        );

        const foundLinks = potentialImageHeaders.length > 0;
        setHasImageLinks(foundLinks);
    }, []);

    const updateImages = useCallback((newImages: Record<string, string>) => {
        setImages(prev => ({ ...prev, ...newImages }));
    }, []);

    const pushToHistory = useCallback((currentData: any[]) => {
        setHistory(prev => [currentData, ...prev].slice(0, MAX_HISTORY));
    }, []);

    const updateCell = useCallback((rowIndex: number, column: string, value: any) => {
        setData(prevData => {
            pushToHistory(prevData);
            const newData = [...prevData];
            if (newData[rowIndex]) {
                newData[rowIndex] = { ...newData[rowIndex], [column]: value };
            }
            return newData;
        });
    }, [pushToHistory]);

    const bulkUpdate = useCallback((updates: { rowIndex: number, column: string, value: any }[]) => {
        setData(prevData => {
            pushToHistory(prevData);
            const newData = [...prevData];
            updates.forEach(({ rowIndex, column, value }) => {
                if (newData[rowIndex]) {
                    newData[rowIndex] = { ...newData[rowIndex], [column]: value };
                }
            });
            return newData;
        });
    }, [pushToHistory]);

    const deleteRow = useCallback((rowIndex: number) => {
        setData(prevData => {
            pushToHistory(prevData);
            return prevData.filter((_, i) => i !== rowIndex);
        });
    }, [pushToHistory]);

    const applyToFiltered = useCallback((column: string, value: any) => {
        setData(prevData => {
            pushToHistory(prevData);

            // Re-apply filter logic to identify indices to update
            let resultIndices = prevData.map((_, i) => i);

            if (showOnlyChanged) {
                resultIndices = resultIndices.filter(idx => {
                    const row = prevData[idx];
                    const originalRow = originalData[idx];
                    if (!originalRow) return false;
                    return headers.some(h => String(row[h]) !== String(originalRow[h]));
                });
            }

            if (Object.keys(filters).length > 0) {
                resultIndices = resultIndices.filter(idx => {
                    const row = prevData[idx];
                    return Object.entries(filters).every(([col, selectedValues]) => {
                        if (selectedValues.has('__HAS_VALUE__')) {
                            const cellValue = row[col];
                            return cellValue !== null && cellValue !== undefined && String(cellValue).trim() !== '';
                        }
                        const cellValue = String(row[col] || "");
                        return selectedValues.has(cellValue);
                    });
                });
            }

            const newData = [...prevData];
            resultIndices.forEach(idx => {
                newData[idx] = { ...newData[idx], [column]: value };
            });
            return newData;
        });
    }, [pushToHistory, filters, showOnlyChanged, originalData, headers]);

    const undo = useCallback(() => {
        setHistory(prev => {
            if (prev.length === 0) return prev;
            const [lastState, ...remaining] = prev;
            setData(lastState);
            return remaining;
        });
    }, []);

    const setFilter = useCallback((column: string, values: Set<string>) => {
        setFilters(prev => {
            const newFilters = { ...prev };
            if (values.size === 0) {
                delete newFilters[column];
            } else {
                newFilters[column] = values;
            }
            return newFilters;
        });
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({});
    }, []);

    // Compute filtered data including Search logic
    const filteredData = useMemo(() => {
        let result = data.map((row, idx) => ({ ...row, __originalIndex: idx }));

        // 1. "Show only changed items" filter
        if (showOnlyChanged) {
            result = result.filter((row, idx) => {
                const originalRow = originalData[idx];
                if (!originalRow) return false;
                return headers.some(h => String(row[h]) !== String(originalRow[h]));
            });
        }

        // 2. Global Search filter (Support column:value syntax)
        if (searchQuery.trim()) {
            const query = searchQuery.trim();
            const colonIndex = query.indexOf(':');

            if (colonIndex > 0) {
                const targetHeaderPrefix = query.slice(0, colonIndex).toLowerCase().trim();
                const searchValue = query.slice(colonIndex + 1).toLowerCase().trim();

                // Find a header that matches the prefix
                const activeHeader = headers.find(h => h.toLowerCase() === targetHeaderPrefix);

                if (activeHeader) {
                    // Targeted column search
                    result = result.filter(row => {
                        const val = String(row[activeHeader] || "").toLowerCase();
                        return val.includes(searchValue);
                    });
                } else {
                    // Fallback to global if header not found
                    const lowerQuery = query.toLowerCase();
                    result = result.filter(row => {
                        return headers.some(h => {
                            const val = String(row[h] || "").toLowerCase();
                            return val.includes(lowerQuery);
                        });
                    });
                }
            } else {
                // Standard global search
                const lowerQuery = query.toLowerCase();
                result = result.filter(row => {
                    return headers.some(h => {
                        const val = String(row[h] || "").toLowerCase();
                        return val.includes(lowerQuery);
                    });
                });
            }
        }

        // 3. Column-specific filters
        if (Object.keys(filters).length > 0) {
            result = result.filter(row => {
                return Object.entries(filters).every(([column, selectedValues]) => {
                    if (selectedValues.has('__HAS_VALUE__')) {
                        const cellValue = row[column];
                        return cellValue !== null && cellValue !== undefined && String(cellValue).trim() !== '';
                    }
                    const cellValue = String(row[column] || "");
                    return selectedValues.has(cellValue);
                });
            });
        }

        // 4. Sorting
        if (sorting) {
            const { column, desc } = sorting;
            result = [...result].sort((a, b) => {
                const aVal = a[column];
                const bVal = b[column];

                if (aVal === bVal) return 0;
                if (aVal === null || aVal === undefined || aVal === "") return 1;
                if (bVal === null || bVal === undefined || bVal === "") return -1;

                const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' });
                return desc ? -comparison : comparison;
            });
        }

        return result;
    }, [data, originalData, filters, showOnlyChanged, headers, searchQuery, sorting]);

    // Optimize Unique Values calculation: only calculate for visible headers and cache results
    const uniqueValues = useMemo(() => {
        const result: Record<string, string[]> = {};
        if (headers.length === 0 || data.length === 0) return result;

        headers.forEach(h => {
            const values = new Set<string>();
            for (let i = 0; i < data.length; i++) {
                const val = data[i][h];
                if (val !== undefined && val !== null && val !== "") {
                    values.add(String(val));
                    // Cap at 200 unique values to keep suggestions relevant
                    if (values.size > 200) break;
                }
            }
            if (values.size > 0) {
                result[h] = Array.from(values).sort();
            }
        });
        return result;
    }, [data, headers]);

    return (
        <ProjectContext.Provider value={{
            data,
            originalData,
            filteredData,
            headers,
            columnMetadata,
            images,
            filters,
            showOnlyChanged,
            setShowOnlyChanged,
            setProjectData,
            updateImages,
            updateCell,
            bulkUpdate,
            deleteRow,
            uniqueValues,
            setFilter,
            clearFilters,
            undo,
            canUndo: history.length > 0,
            hasImageLinks,
            searchQuery,
            setSearchQuery,
            sorting,
            setSorting
        }}>
            {children}
        </ProjectContext.Provider>
    );
}

export function useProject() {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
}
