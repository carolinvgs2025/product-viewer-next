"use client";

import { useState, useCallback, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download, Layers } from 'lucide-react';
import { parseExcelFile, ParseResult, getExcelSheetNames } from '@/lib/excel-parser';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

interface ExcelUploaderProps {
    onUploadSuccess: (result: ParseResult) => void;
}

export function ExcelUploader({ onUploadSuccess }: ExcelUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sheetOptions, setSheetOptions] = useState<string[] | null>(null);
    const [pendingFile, setPendingFile] = useState<File | null>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const processFile = async (file: File, sheetName?: string) => {
        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.csv')) {
            setError('Please upload .xlsx or .csv files only');
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            // If it's an XLSX file and no sheet name provided, check for multiple sheets
            if (file.name.endsWith('.xlsx') && !sheetName) {
                const names = await getExcelSheetNames(file);
                if (names.length > 1) {
                    setSheetOptions(names);
                    setPendingFile(file);
                    setIsProcessing(false);
                    return;
                }
            }

            const result = await parseExcelFile(file, sheetName);
            onUploadSuccess(result);
            setSheetOptions(null);
            setPendingFile(null);
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

    const downloadTemplate = (e: React.MouseEvent) => {
        e.stopPropagation();

        // Row 1: Group Labels (Unmerged & Repeated for robustness)
        const groups = [
            "Identification", "Identification", // Id, Name
            "Attributes", "Attributes", "Attributes", "Attributes", "Attributes", "Attributes", "Attributes", "Attributes", "Attributes", // Brand...Target Price
            "Distribution", "Distribution", "Distribution", "Distribution" // Walmart...
        ];

        // Row 2: Field Headers
        const headers = [
            "Id", "Name",
            "Brand", "Form", "Scent", "Package Count", "Seasonal", "Primary Benefit", "Natural/Conventional", "Continuous Vs Manual Fragrance", "Store Location",
            "Walmart Price", "Grocery/Amazon", "DIY", "Target Price"
        ];

        // Sample Data
        const data = [
            ["3", "Febreze Fabric Refresher", "Febreze", "Fabric Refresher", "Fresh/Clean", "Stand Alone Air", "Not Seasonal", "Odor Control", "Conventional", "Manual", "Air Freshener", "5.99", "5.99", "5.99", "5.99"],
            ["4", "Febreze Air Effects", "Febreze", "Aerosol", "Floral", "Stand Alone Air", "Not Seasonal", "Odor Control", "Conventional", "Manual", "Air Freshener", "5.97", "5.97", "5.97", "5.97"],
        ];

        const ws = XLSX.utils.aoa_to_sheet([groups, headers, ...data]);

        // No merged cells needed! This is much safer for parsers.

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Product Data");

        XLSX.writeFile(wb, "product_viewer_template.xlsx");
    };

    return (
        <div className="relative group">
            {sheetOptions && pendingFile ? (
                <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-blue-500 p-8 text-center animate-in zoom-in-95 duration-300 shadow-xl">
                    <div className="flex flex-col items-center gap-4">
                        <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-900/20">
                            <Layers className="w-8 h-8 text-blue-500" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold dark:text-white">Multiple Sheets Detected</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Select which tab you'd like to import from <span className="font-semibold text-gray-700 dark:text-gray-200">{pendingFile.name}</span></p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-4">
                            {sheetOptions.map(name => (
                                <button
                                    key={name}
                                    onClick={() => processFile(pendingFile, name)}
                                    className="px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 rounded-xl transition-all border border-gray-100 dark:border-gray-700 hover:border-blue-500 shadow-sm flex items-center justify-center gap-2"
                                >
                                    <FileSpreadsheet className="w-4 h-4 opacity-50" />
                                    {name}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => {
                                setSheetOptions(null);
                                setPendingFile(null);
                            }}
                            className="mt-6 text-xs font-bold text-gray-400 hover:text-red-500 uppercase tracking-widest transition-colors"
                        >
                            Cancel Upload
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    className={cn(
                        "relative rounded-xl border-2 border-dashed transition-all duration-300 p-12 text-center",
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
                        accept=".xlsx,.csv"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={handleFileInput}
                    />

                    <div className="flex flex-col items-center gap-4 pointer-events-none">
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

                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold dark:text-white">
                                {isProcessing ? "Processing Spreadsheet..." : "Drop your Excel file here"}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Supports .xlsx or .csv (Row 1 = Headers)
                            </p>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-500 bg-red-50 dark:bg-red-900/10 px-4 py-2 rounded-lg">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Template Download Button (Outside Overlay) */}
            <button
                onClick={downloadTemplate}
                className="absolute top-4 right-4 z-20 hidden group-hover:flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
            >
                <Download className="w-3 h-3" />
                Download Example
            </button>
        </div>
    );
}
