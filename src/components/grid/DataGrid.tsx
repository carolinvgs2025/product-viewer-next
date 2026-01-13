"use client";

import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
    ColumnDef,
    SortingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useProject } from '@/context/ProjectContext';
import { cn } from '@/lib/utils';
import { ArrowUpDown, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

const HEADER_HEIGHT = 48;

export function DataGrid() {
    const { filteredData, headers, images, originalData } = useProject();
    const [sorting, setSorting] = useState<SortingState>([]);

    // Memoize columns
    const columns = useMemo<ColumnDef<any>[]>(() => {
        if (headers.length === 0) return [];

        return headers.map(header => ({
            accessorKey: header,
            header: ({ column }) => {
                return (
                    <button
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="flex items-center gap-1 hover:text-blue-500 transition-colors font-semibold w-full text-left"
                    >
                        {header}
                        <ArrowUpDown className="ml-2 h-3 w-3 shrink-0" />
                    </button>
                )
            },
            cell: ({ row, getValue }) => {
                const val = getValue() as string;
                const rowIndex = row.original.__rowIndex;
                const originalRow = originalData[rowIndex];
                const isModified = originalRow && String(val) !== String(originalRow[header]);

                // Check if this value maps to an image
                let imageUrl = images[val];

                if (!imageUrl) {
                    const key = Object.keys(images).find(k => k === val || k.startsWith(val + '.'));
                    if (key) imageUrl = images[key];
                }

                if (imageUrl) {
                    return (
                        <div className={cn(
                            "flex items-center gap-2 group p-1 rounded-md transition-colors",
                            isModified && "bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500/20"
                        )}>
                            <div className="relative w-12 h-12 rounded-md overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                                <Image
                                    src={imageUrl}
                                    alt={val || "Product Image"}
                                    width={100}
                                    height={100}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                    loading="lazy"
                                />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className={cn(
                                    "text-xs font-medium truncate",
                                    isModified ? "text-blue-600 dark:text-blue-400" : "text-gray-400"
                                )}>
                                    {val}
                                </span>
                                {isModified && <span className="text-[9px] uppercase font-bold text-blue-500">Edited</span>}
                            </div>
                        </div>
                    )
                }

                return (
                    <div className="relative group/cell w-full h-full flex items-center">
                        <span className={cn(
                            "truncate block transition-colors",
                            isModified ? "text-blue-600 dark:text-blue-400 font-medium" : "text-gray-700 dark:text-gray-300"
                        )} title={String(val)}>
                            {String(val)}
                        </span>
                        {isModified && (
                            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-3 bg-blue-500 rounded-r-full" />
                        )}
                    </div>
                );
            }
        }));
    }, [headers, images, originalData]); // Re-create if headers, images or originalData change

    const table = useReactTable({
        data: filteredData,
        columns,
        state: {
            sorting,
        },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    const parentRef = useRef<HTMLDivElement>(null);

    const { rows } = table.getRowModel();

    const virtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 60, // Estimate row height
        overscan: 20,
        paddingStart: HEADER_HEIGHT,
    });

    const gridTemplateColumns = `repeat(${headers.length}, minmax(180px, 1fr))`;

    return (
        <div className="w-full h-[600px] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-2xl flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center shrink-0">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200">
                    Product Data Grid ({filteredData.length} items)
                </h3>
                <div className="text-sm text-gray-500">
                    <span className="text-green-500 font-medium">{Object.keys(images).length}</span> images loaded
                </div>
            </div>

            <div ref={parentRef} className="flex-1 overflow-auto relative scroll-smooth">
                {filteredData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <p>No data to display</p>
                    </div>
                ) : (
                    <div style={{ height: `${virtualizer.getTotalSize()}px`, minWidth: '100%', width: 'fit-content', position: 'relative' }}>

                        <div className="sticky top-0 z-10 grid bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 text-sm shadow-sm"
                            style={{
                                height: HEADER_HEIGHT,
                                gridTemplateColumns,
                                width: '100%'
                            }}
                        >
                            {table.getHeaderGroups().map(headerGroup => (
                                <React.Fragment key={headerGroup.id}>
                                    {headerGroup.headers.map(header => (
                                        <div key={header.id} className="p-3 flex items-center border-r border-gray-200 dark:border-gray-700/50 last:border-r-0 min-w-0">
                                            <div className="truncate w-full">
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                            </div>
                                        </div>
                                    ))}
                                </React.Fragment>
                            ))}
                        </div>

                        {virtualizer.getVirtualItems().map((virtualRow) => {
                            const row = rows[virtualRow.index];
                            return (
                                <div
                                    key={row.id}
                                    className={cn(
                                        "absolute top-0 left-0 grid border-b border-gray-100 dark:border-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors text-sm items-center",
                                        virtualRow.index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/50 dark:bg-gray-800/30"
                                    )}
                                    style={{
                                        height: `${virtualRow.size}px`,
                                        width: '100%',
                                        transform: `translateY(${virtualRow.start}px)`,
                                        gridTemplateColumns
                                    }}
                                >
                                    {row.getVisibleCells().map(cell => (
                                        <div key={cell.id} className="p-3 truncate h-full flex items-center border-r border-gray-100 dark:border-gray-800/50 last:border-r-0">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </div>
                                    ))}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
