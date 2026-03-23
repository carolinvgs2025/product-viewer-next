import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ColumnMetadata } from '@/lib/excel-parser';

interface ProductCardImageOnlyProps {
    data: any;
    headers: string[];
    imageUrl?: string;
    rowIndex: number;
    onDelete: (index: number) => void;
}

export function ProductCardImageOnly({
    data,
    headers,
    imageUrl,
    rowIndex,
    onDelete,
}: ProductCardImageOnlyProps) {
    // Find ID field dynamically
    const idField = headers.find(h => {
        const lowerHeader = h.toLowerCase().trim();
        return lowerHeader === 'id' || lowerHeader === 'item number' || lowerHeader === 'upc' || lowerHeader === 'sku';
    }) || headers[0];
    const displayId = data[idField];

    const titleField = headers.find(h => {
        const lowerHeader = h.toLowerCase().trim();
        return lowerHeader === 'name' || lowerHeader === 'title' || lowerHeader === 'product name' || lowerHeader === 'description';
    }) || headers[1] || headers[0];
    const title = data[titleField];

    const priceField = headers.find(h => {
        const lowerHeader = h.toLowerCase().trim();
        return lowerHeader === 'price' || lowerHeader === 'msrp' || lowerHeader === 'cost' || lowerHeader.includes('price');
    });
    const priceValue = priceField ? data[priceField] : null;

    const [zoomStyle, setZoomStyle] = useState({ opacity: 0, x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        const { left, top, width, height } = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setZoomStyle({ opacity: 1, x, y });
    };

    const handleMouseLeave = () => {
        setZoomStyle(prev => ({ ...prev, opacity: 0 }));
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full h-full bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col group relative hover:border-blue-500/50 hover:shadow-md transition-all duration-300 overflow-hidden"
        >
            {/* Top Left ID Pill */}
            <div className="absolute top-2 left-2 z-10 w-7 h-7 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-700 dark:text-gray-200 flex items-center justify-center text-[10px] font-bold shadow-sm border border-gray-200 dark:border-gray-700">
                {displayId}
            </div>

            {/* Top Right Delete Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(rowIndex);
                }}
                className="absolute top-2 right-2 z-10 p-1.5 text-gray-400 bg-white/50 dark:bg-gray-800/50 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-lg transition-all backdrop-blur-sm opacity-0 group-hover:opacity-100 focus:opacity-100 border border-transparent hover:border-red-200 dark:hover:border-red-800/50 shadow-sm"
                title="Delete product"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Image Section */}
            <div 
                className="relative aspect-square w-full bg-white dark:bg-gray-800/20 flex flex-col p-1 cursor-crosshair overflow-hidden"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                {imageUrl ? (
                    <>
                        <img
                            src={imageUrl}
                            alt={`Product ${displayId}`}
                            className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"
                            style={{ opacity: zoomStyle.opacity ? 0.3 : 1 }}
                            loading="lazy"
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
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 gap-2">
                        <ImageIcon className="w-8 h-8 opacity-20" />
                    </div>
                )}
            </div>

            {/* Bottom Bar: Product Name & Price */}
            <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex-1 flex flex-col justify-between">
                <p className="text-xs font-medium text-gray-900 dark:text-gray-100 leading-snug line-clamp-3">
                    {title}
                </p>
                {priceValue && (
                    <div className="flex justify-end mt-2 shrink-0">
                        <span className="text-[13px] font-black tracking-tight text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 px-2 py-0.5 rounded shadow-sm border border-emerald-100 dark:border-emerald-800/50">
                            {String(priceValue).startsWith('$') ? priceValue : `$${priceValue}`}
                        </span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
