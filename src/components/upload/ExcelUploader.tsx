"use client";

import React, { useState, useCallback, useRef, Fragment } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download, Layers } from 'lucide-react';
import { parseExcelFile, ParseResult } from '@/lib/excel-parser';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

interface ExcelUploaderProps {
    onUploadSuccess: (result: ParseResult) => void;
}

export function ExcelUploader({ onUploadSuccess }: ExcelUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const processFile = async (file: File) => {
        if (!file.name.endsWith('.xlsx')) {
            setError('Please upload .xlsx files only');
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const result = await parseExcelFile(file);
            onUploadSuccess(result);
        } catch (err) {
            setError('Failed to parse Excel file.');
            console.error(err);
        } finally {
            setIsProcessing(false);
            setIsDragging(false);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    }, []);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    return (
        <div className="relative group">
            <div
                className={cn(
                    "relative rounded-xl border-2 border-dashed transition-all duration-300 p-8 md:p-12 text-center",
                    isDragging
                        ? "border-blue-500 bg-blue-50/10 scale-[1.01] shadow-lg"
                        : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20",
                    isProcessing && "opacity-50 pointer-events-none"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    accept=".xlsx"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={handleFileInput}
                />

                <div className="flex flex-col items-center gap-6 pointer-events-none">
                    <div className={cn(
                        "p-4 rounded-full bg-gray-100 dark:bg-white/5 transition-transform duration-300",
                        isDragging && "scale-110"
                    )}>
                        {isProcessing ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                        ) : (
                            <FileSpreadsheet className="w-8 h-8 text-green-500" />
                        )}
                    </div>

                    <div className="space-y-4 w-full max-w-sm">
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold dark:text-white">
                                {isProcessing ? "Processing Spreadsheet..." : "Drop your Excel file here"}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
                                Supports .xlsx files only (First sheet only)
                            </p>
                        </div>

                        {/* Visual Spreadsheet Mockup */}
                        <div className="bg-gray-50 dark:bg-black/40 rounded-lg p-3 border border-gray-100 dark:border-white/10 shadow-inner">
                            <div className="flex items-center gap-2 mb-2">
                                <Layers className="w-3 h-3 text-gray-400" />
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Expected Format (Excel)</span>
                            </div>
                            <div className="grid grid-cols-5 gap-1">
                                {/* Excel Headers Indicators */}
                                <div className="text-[8px] text-gray-400 font-medium self-center px-1 italic">Row 1</div>
                                <div className="px-1 invisible">.</div>
                                <div className="px-1 invisible">.</div>
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded py-0.5 text-[7px] font-bold text-blue-500 uppercase tracking-widest text-center truncate">Attr...</div>
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded py-0.5 text-[7px] font-bold text-blue-500 uppercase tracking-widest text-center truncate">Attr...</div>

                                <div className="text-[8px] text-gray-400 font-medium self-center px-1 italic">Row 2</div>

                                {/* Field Headers Row */}
                                {['ID', 'Name', 'Brand', 'Scent'].map((h) => (
                                    <div key={h} className="bg-white dark:bg-gray-800 p-1.5 rounded border border-gray-100 dark:border-white/5 text-[9px] font-bold text-gray-400 dark:text-gray-500 truncate">
                                        {h}
                                    </div>
                                ))}

                                {/* Pulse Data Rows */}
                                {[1, 2].map((i) => (
                                    <Fragment key={i}>
                                        <div className="text-[8px] text-gray-400/30 font-medium self-center px-1 italic">...</div>
                                        <div className="h-2 bg-gray-200 dark:bg-gray-700/50 rounded animate-pulse" />
                                        <div className="h-2 bg-gray-200 dark:bg-gray-700/50 rounded animate-pulse opacity-80" />
                                        <div className="h-2 bg-gray-200 dark:bg-gray-700/50 rounded animate-pulse opacity-60" />
                                        <div className="h-2 bg-gray-200 dark:bg-gray-700/50 rounded animate-pulse opacity-40" />
                                    </Fragment>
                                ))}
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-500 bg-red-50 dark:bg-red-900/10 px-4 py-2 rounded-lg">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
