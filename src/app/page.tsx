"use client";

import { useState, useEffect } from 'react';
import { ExcelUploader } from '@/components/upload/ExcelUploader';
import { ImageUploader } from '@/components/upload/ImageUploader';
import { DataGrid } from '@/components/grid/DataGrid';
import { CardGrid } from '@/components/grid/CardGrid';
import { FilterPanel } from '@/components/filters/FilterPanel';
import { ActiveFilterTags } from '@/components/filters/ActiveFilterTags';
import { ProductDetailModal } from '@/components/grid/ProductDetailModal';
import { ProjectProvider, useProject } from '@/context/ProjectContext';
import { DistributionChart } from '@/components/analytics/DistributionChart';
import {
    ArrowRight,
    CheckCircle2,
    LayoutGrid,
    Table,
    Grid2X2,
    Grid3X3,
    RotateCcw,
    Download,
    BarChart3,
    ChevronUp,
    ChevronDown as ChevronDownIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportToExcel } from '@/lib/excel-export';

function Dashboard() {
    const { data, filteredData, headers, columnMetadata, setProjectData, undo, canUndo, showOnlyChanged, setShowOnlyChanged, images, uniqueValues, updateCell, deleteRow, filters } = useProject();
    const [viewMode, setViewMode] = useState<'upload' | 'grid'>('upload');
    const [isExporting, setIsExporting] = useState(false);
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [analysisColumn, setAnalysisColumn] = useState('');
    const [selectedProductIndex, setSelectedProductIndex] = useState<number | null>(null);

    useEffect(() => {
        if (columnMetadata.length > 0 && !analysisColumn) {
            const firstAttribute = columnMetadata.find(m => m.group === 'Attributes');
            if (firstAttribute) {
                setAnalysisColumn(firstAttribute.header);
            }
        }
    }, [columnMetadata.length, analysisColumn]);

    const handleExport = () => {
        setIsExporting(true);
        try {
            exportToExcel(data, headers, columnMetadata, 'product-viewer-export.xlsx');
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export Excel file. Check console for details.');
        } finally {
            setIsExporting(false);
        }
    };

    // Keyboard shortcut for Undo
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
                if (canUndo) {
                    e.preventDefault();
                    undo();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, canUndo]);

    const [viewType, setViewType] = useState<'table' | 'cards'>('table');
    const [cardColumns, setCardColumns] = useState<1 | 2 | 3>(3);

    const hasData = data.length > 0;

    const handleViewGrid = () => {
        if (hasData) setViewMode('grid');
    };

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
            <div className="container mx-auto px-4 py-8">
                <header className="mb-12 text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent cursor-pointer" onClick={() => window.location.reload()}>
                        Product Viewer X
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        High-performance spreadsheet & image verification
                    </p>
                </header>

                {viewMode === 'upload' ? (
                    <div className="max-w-4xl mx-auto space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 relative overflow-hidden">
                                {hasData && (
                                    <div className="absolute top-0 left-0 w-full h-1 bg-green-500" />
                                )}
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-semibold">1. Upload Spreadsheet</h2>
                                    {hasData && <CheckCircle2 className="text-green-500 w-6 h-6" />}
                                </div>
                                <ExcelUploader onUploadSuccess={setProjectData} />
                                {hasData && (
                                    <p className="mt-4 text-center text-sm text-green-600 font-medium animate-in fade-in">
                                        ✓ {headers.length} columns detected (Smart Parse)
                                    </p>
                                )}
                            </div>

                            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 bg-opacity-50">
                                <h2 className="text-xl font-semibold mb-6">2. Upload Product Images</h2>
                                <ImageUploader />
                            </div>
                        </div>

                        {/* Action Bar */}
                        <div className="flex justify-center pt-8">
                            <button
                                onClick={handleViewGrid}
                                disabled={!hasData}
                                className="
                        group relative flex items-center gap-3 px-8 py-4 
                        bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                        text-white text-lg font-bold rounded-full shadow-lg hover:shadow-blue-500/25 
                        transition-all duration-300 transform hover:-translate-y-1
                    "
                            >
                                {hasData ? "Create Grid View" : "Upload Spreadsheet to Continue"}
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-bold tracking-tight">Dataset Loaded</h2>
                                <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold border border-blue-100 dark:border-blue-800/50">
                                    {data.length} Rows
                                </span>
                            </div>

                            <div className="flex items-center gap-3 bg-white dark:bg-gray-900 p-1.5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-x-auto no-scrollbar w-full lg:w-auto">
                                {/* Analytics Toggle */}
                                <div className="flex items-center gap-2 px-1">
                                    <button
                                        onClick={() => setShowAnalysis(!showAnalysis)}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-[11px] font-bold uppercase tracking-wider border",
                                            showAnalysis
                                                ? "bg-blue-600 border-blue-600 text-white shadow-md ring-2 ring-blue-500/20"
                                                : "border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                                        )}
                                    >
                                        <BarChart3 className="w-3.5 h-3.5" />
                                        Analytics
                                        <ChevronDownIcon className={cn("w-3.5 h-3.5 transition-transform duration-300", showAnalysis && "rotate-180")} />
                                    </button>

                                    {showAnalysis && (
                                        <select
                                            value={analysisColumn}
                                            onChange={(e) => setAnalysisColumn(e.target.value)}
                                            className="bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-xs font-bold py-1.5 px-2 focus:ring-1 focus:ring-blue-500 transition-all outline-none animate-in slide-in-from-left-2"
                                        >
                                            {headers
                                                .filter(h => columnMetadata.find(m => m.header === h)?.group === 'Attributes')
                                                .map(h => (
                                                    <option key={h} value={h}>{h}</option>
                                                ))}
                                        </select>
                                    )}
                                </div>

                                <div className="h-5 w-px bg-gray-200 dark:bg-gray-800 mx-1" />

                                {/* View Type Toggle */}
                                <div className="flex p-0.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                    <button
                                        onClick={() => setViewType('table')}
                                        title="Table View"
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all",
                                            viewType === 'table'
                                                ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-300 shadow-sm border border-gray-100 dark:border-gray-600"
                                                : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                                        )}
                                    >
                                        <Table className="w-4 h-4" />
                                        <span className="hidden sm:inline">Table</span>
                                    </button>
                                    <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 my-auto mx-1" />
                                    <div className="flex gap-0.5">
                                        {([1, 2, 3] as const).map((cols) => {
                                            const Icon = cols === 1 ? LayoutGrid : (cols === 2 ? Grid2X2 : Grid3X3);
                                            return (
                                                <button
                                                    key={cols}
                                                    onClick={() => {
                                                        setViewType('cards');
                                                        setCardColumns(cols);
                                                    }}
                                                    title={`Cards (${cols})`}
                                                    className={cn(
                                                        "p-1.5 rounded-md transition-all flex items-center gap-1",
                                                        viewType === 'cards' && cardColumns === cols
                                                            ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-300 shadow-sm border border-gray-100 dark:border-gray-600"
                                                            : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                                                    )}
                                                >
                                                    <Icon className="w-4 h-4" />
                                                    <span className="text-[9px] font-bold">{cols}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="h-5 w-px bg-gray-200 dark:bg-gray-800 mx-1" />

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowOnlyChanged(!showOnlyChanged)}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-[11px] font-bold uppercase tracking-wider border",
                                            showOnlyChanged
                                                ? "bg-blue-600 border-blue-600 text-white shadow-md ring-2 ring-blue-500/20"
                                                : "border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-1.5 h-1.5 rounded-full",
                                            showOnlyChanged ? "bg-white animate-pulse" : "bg-gray-300 dark:bg-gray-600"
                                        )} />
                                        Changes
                                    </button>

                                    <button
                                        onClick={undo}
                                        disabled={!canUndo}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm font-medium",
                                            canUndo
                                                ? "text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10"
                                                : "text-gray-300 dark:text-gray-700 cursor-not-allowed"
                                        )}
                                        title="Undo (Cmd+Z)"
                                    >
                                        <RotateCcw className={cn("w-4 h-4", canUndo && "animate-in spin-in-180 duration-500")} />
                                        Undo
                                    </button>
                                    <button
                                        onClick={handleExport}
                                        disabled={isExporting}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all text-sm font-medium shadow-sm hover:shadow-blue-500/25 shrink-0"
                                        title="Export to Excel"
                                    >
                                        <Download className={cn("w-4 h-4", isExporting && "animate-bounce")} />
                                        Export
                                    </button>
                                    <button
                                        onClick={() => setViewMode('upload')}
                                        className="px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-medium text-gray-500 shrink-0"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-sm font-medium shrink-0"
                                    >
                                        Top
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Two-column layout: Filters (left) + Content (right) */}
                        <div className="flex gap-6 items-start">
                            {/* Left Sidebar: Filters */}
                            <div className="w-80 flex-shrink-0 sticky top-4">
                                <FilterPanel />
                            </div>

                            {/* Right Content Area */}
                            <div className="flex-1 min-w-0 space-y-6">
                                {/* Active Tags */}
                                <div>
                                    <ActiveFilterTags />
                                </div>

                                {/* Analytics Section */}
                                {showAnalysis && (
                                    <div className="animate-in slide-in-from-top-4 duration-300 overflow-hidden">
                                        <DistributionChart
                                            data={filteredData}
                                            columnName={analysisColumn}
                                        />
                                    </div>
                                )}

                                {/* View Content */}
                                {viewType === 'table' ? (
                                    <DataGrid />
                                ) : (
                                    <CardGrid
                                        columns={cardColumns}
                                        onCardClick={(index) => setSelectedProductIndex(index)}
                                    />
                                )}

                                <p className="text-center text-xs text-gray-400 mt-8">
                                    Changes in Edit Mode are saved to temporary session memory.
                                    {filteredData.length !== data.length && (
                                        <span className="ml-2 text-blue-500">
                                            • Showing {filteredData.length} of {data.length} items
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Focus Mode Modal */}
                {selectedProductIndex !== null && (
                    <ProductDetailModal
                        isOpen={selectedProductIndex !== null}
                        onClose={() => setSelectedProductIndex(null)}
                        onNext={() => {
                            if (selectedProductIndex < filteredData.length - 1) {
                                setSelectedProductIndex(selectedProductIndex + 1);
                            }
                        }}
                        onPrevious={() => {
                            if (selectedProductIndex > 0) {
                                setSelectedProductIndex(selectedProductIndex - 1);
                            }
                        }}
                        product={filteredData[selectedProductIndex]}
                        rowIndex={filteredData[selectedProductIndex]?.__originalIndex ?? selectedProductIndex}
                        headers={headers}
                        uniqueValues={uniqueValues}
                        onUpdate={updateCell}
                        onDelete={(idx) => {
                            deleteRow(idx);
                            setSelectedProductIndex(null);
                        }}
                        filters={filters}
                        hasMultiple={filteredData.length > 1}
                        imageUrl={(() => {
                            const item = filteredData[selectedProductIndex];
                            if (!item) return undefined;

                            // Find Image Logic (Duplicated from Grid - consider utility later)
                            for (const key of Object.keys(item)) {
                                const val = String(item[key]);
                                if (images[val]) return images[val];
                                const fuzzyKey = Object.keys(images).find(k => k === val || k.startsWith(val + '.'));
                                if (fuzzyKey) return images[fuzzyKey];
                                if (typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://'))) return val;
                            }
                            return undefined;
                        })()}
                    />
                )}
            </div>
        </main >
    );
}

export default function Page() {
    return (
        <ProjectProvider>
            <Dashboard />
        </ProjectProvider>
    );
}
