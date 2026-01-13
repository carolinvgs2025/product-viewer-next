"use client";

import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useProject } from '@/context/ProjectContext';
import { ProductCard } from './ProductCard';
import { ProductCardHorizontal } from './ProductCardHorizontal';
import { cn } from '@/lib/utils';

interface CardGridProps {
    columns?: number;
    onCardClick?: (index: number) => void;
}

export function CardGrid({ columns = 3, onCardClick }: CardGridProps) {
    const { filteredData, headers, images, updateCell, uniqueValues, filters } = useProject();
    const parentRef = useRef<HTMLDivElement>(null);

    // Calculate row count based on dynamic columns
    const rowCount = Math.ceil(filteredData.length / columns);

    const virtualizer = useVirtualizer({
        count: rowCount,
        getScrollElement: () => parentRef.current,
        estimateSize: () => columns === 1 ? 420 : 620, // Smaller height for horizontal cards
        overscan: 3,
    });

    return (
        <div
            ref={parentRef}
            className="w-full h-[800px] overflow-y-auto bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-gray-800"
        >
            <div
                style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {virtualizer.getVirtualItems().map((virtualRow) => {
                    const startIndex = virtualRow.index * columns;
                    const rowItems = filteredData.slice(startIndex, startIndex + columns);

                    return (
                        <div
                            key={virtualRow.index}
                            className={cn(
                                "absolute top-0 left-0 w-full grid gap-6 px-4",
                                // Dynamic Grid Classes based on column count
                                columns === 1 ? "grid-cols-1" :
                                    columns === 2 ? "grid-cols-1 md:grid-cols-2" :
                                        "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                            )}
                            style={{
                                height: `${virtualRow.size}px`,
                                transform: `translateY(${virtualRow.start}px)`,
                            }}
                        >
                            {rowItems.map((item, i) => {
                                const originalIndex = startIndex + i;

                                // Find Image using simplified logic
                                let imageUrl: string | undefined;

                                for (const key of Object.keys(item)) {
                                    const val = String(item[key]);
                                    if (images[val]) {
                                        imageUrl = images[val];
                                        break;
                                    }
                                    const fuzzyKey = Object.keys(images).find(k => k === val || k.startsWith(val + '.'));
                                    if (fuzzyKey) {
                                        imageUrl = images[fuzzyKey];
                                        break;
                                    }

                                    // Auto-detect URL image links
                                    if (typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://'))) {
                                        imageUrl = val;
                                        break;
                                    }
                                }

                                const CardComponent = columns === 1 ? ProductCardHorizontal : ProductCard;

                                return (
                                    <div
                                        key={item.__rowIndex ?? originalIndex}
                                        className="h-full pb-6 cursor-pointer"
                                        onClick={() => onCardClick?.(originalIndex)}
                                    >
                                        <CardComponent
                                            data={item}
                                            headers={headers}
                                            imageUrl={imageUrl}
                                            rowIndex={item.__rowIndex ?? originalIndex}
                                            uniqueValues={uniqueValues}
                                            onUpdate={updateCell}
                                            activeFilters={filters}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
