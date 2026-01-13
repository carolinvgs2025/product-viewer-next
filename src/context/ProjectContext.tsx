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
    uniqueValues: Record<string, string[]>;
    setFilter: (column: string, values: Set<string>) => void;
    clearFilters: () => void;
    undo: () => void;
    canUndo: boolean;
    hasImageLinks: boolean;
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
        let result = data;

        // 1. "Show only changed items" filter
        if (showOnlyChanged) {
            result = result.filter((row, idx) => {
                const originalRow = originalData[idx];
                if (!originalRow) return false;
                return headers.some(h => String(row[h]) !== String(originalRow[h]));
            });
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

        return result;
    }, [data, originalData, filters, showOnlyChanged, headers]);

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
                    // Cap at 30 unique values to keep UI clean and processing fast
                    if (values.size > 30) break;
                }
            }
            if (values.size > 0 && values.size <= 30) {
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
            uniqueValues,
            setFilter,
            clearFilters,
            undo,
            canUndo: history.length > 0,
            hasImageLinks
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
