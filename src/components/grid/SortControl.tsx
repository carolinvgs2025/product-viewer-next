
import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    ArrowDownAZ,
    ArrowUpAZ,
    X,
    Search,
    ChevronDown,
    ChevronRight,
    FolderOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ColumnMetadata } from '@/lib/excel-parser';

interface SortConfig {
    column: string;
    desc: boolean;
}

interface SortControlProps {
    headers: string[];
    columnMetadata: ColumnMetadata[];
    sorting: SortConfig | null;
    setSorting: (config: SortConfig | null) => void;
}

export function SortControl({ headers, columnMetadata, sorting, setSorting }: SortControlProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('General');
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter and Group Columns
    const { groups, categories, searchResults } = useMemo(() => {
        const query = searchQuery.toLowerCase();

        // Grouping Data
        const allGroups: Record<string, string[]> = {};
        const allCategories: string[] = [];
        let hasGeneral = false;

        headers.forEach(header => {
            const meta = columnMetadata.find(m => m.header === header);
            const groupName = (meta && meta.group) ? meta.group : 'General';

            if (!allGroups[groupName]) {
                allGroups[groupName] = [];
                allCategories.push(groupName);
            }
            allGroups[groupName].push(header);
            if (groupName === 'General') hasGeneral = true;
        });

        // Sort Categories (Put General first if exists, then alphabetical)
        allCategories.sort((a, b) => {
            if (a === 'General') return -1;
            if (b === 'General') return 1;
            return a.localeCompare(b);
        });

        // Search Results (Flat list)
        const flatResults = headers.filter(h => h.toLowerCase().includes(query));

        return { groups: allGroups, categories: allCategories, searchResults: flatResults };
    }, [headers, columnMetadata, searchQuery]);

    // Ensure active category is valid when opening or changing data
    useEffect(() => {
        if (categories.length > 0 && !categories.includes(activeCategory)) {
            setActiveCategory(categories[0]);
        }
    }, [categories, activeCategory, isOpen]);

    const activeSortLabel = sorting ? `${sorting.column} (${sorting.desc ? 'Z-A' : 'A-Z'})` : null;

    return (
        <div className="relative" ref={containerRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-[11px] font-bold uppercase tracking-wider border whitespace-nowrap",
                    isOpen || sorting
                        ? "bg-blue-600 border-blue-600 text-white shadow-md ring-2 ring-blue-500/20"
                        : "border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                )}
            >
                <ArrowDownAZ className="w-3.5 h-3.5" />
                Sort{sorting ? `: ${sorting.column}` : ""}
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-300", isOpen && "rotate-180")} />
            </button>

            {/* Modal Portal */}
            {isOpen && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Modal Content */}
                    <div className="relative z-50 w-full max-w-4xl h-[80vh] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header: Search & Active Status */}
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 space-y-4 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm shrink-0">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    <ArrowDownAZ className="w-5 h-5 text-blue-500" />
                                    Sort Data
                                </h3>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search columns..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl text-base text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
                                    autoFocus
                                />
                            </div>

                            {sorting && (
                                <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg border border-blue-100 dark:border-blue-800">
                                    <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 font-medium">
                                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                        Active Sort: <span className="font-bold">{activeSortLabel}</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSorting(null);
                                            setIsOpen(false);
                                        }}
                                        className="text-xs bg-white dark:bg-gray-800 text-red-500 hover:text-red-600 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-md font-bold transition-all hover:shadow-sm flex items-center gap-1.5"
                                    >
                                        <X className="w-3 h-3" />
                                        CLEAR SORT
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Split Panes */}
                        <div className="flex flex-1 overflow-hidden">
                            {/* Left Sidebar: Categories (Hidden during search) */}
                            {searchQuery === '' && (
                                <div className="w-1/3 md:w-1/4 border-r border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30 overflow-y-auto p-2 space-y-1">
                                    <h5 className="text-[10px] font-bold uppercase text-gray-400 dark:text-gray-600 px-3 py-2 sticky top-0 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm z-10">
                                        Categories
                                    </h5>
                                    {categories.map(category => (
                                        <button
                                            key={category}
                                            onClick={() => setActiveCategory(category)}
                                            className={cn(
                                                "w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between group transition-all",
                                                activeCategory === category
                                                    ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-md ring-1 ring-black/5 dark:ring-white/5"
                                                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <FolderOpen className={cn("w-4 h-4", activeCategory === category ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500")} />
                                                <span className="truncate">{category}</span>
                                            </div>
                                            {activeCategory === category && (
                                                <ChevronRight className="w-4 h-4 text-blue-500" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Right Panel: Items (Grid) */}
                            <div className={cn(
                                "flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-900",
                                searchQuery !== '' ? "w-full" : "w-2/3 md:w-3/4"
                            )}>
                                {searchQuery !== '' ? (
                                    /* Search Results View */
                                    <div className="space-y-4">
                                        <h5 className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 mb-4">
                                            Found in {searchResults.length} columns
                                        </h5>
                                        {searchResults.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {searchResults.map(header => (
                                                    <SortOption
                                                        key={header}
                                                        header={header}
                                                        isActive={sorting?.column === header}
                                                        sortDesc={sorting?.desc ?? false}
                                                        onSort={(desc) => {
                                                            setSorting({ column: header, desc });
                                                            setIsOpen(false);
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-600">
                                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                                    <Search className="w-8 h-8 opacity-40" />
                                                </div>
                                                <p className="text-lg font-medium">No columns found matching "{searchQuery}"</p>
                                                <button
                                                    onClick={() => setSearchQuery('')}
                                                    className="mt-2 text-blue-500 hover:underline font-medium"
                                                >
                                                    Clear search
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* Category View */
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300" key={activeCategory}>
                                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                                    {activeCategory}
                                                </h2>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                    Select a column to sort by
                                                </p>
                                            </div>
                                            <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400">
                                                {groups[activeCategory]?.length || 0} Columns
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {groups[activeCategory]?.map(header => (
                                                <SortOption
                                                    key={header}
                                                    header={header}
                                                    isActive={sorting?.column === header}
                                                    sortDesc={sorting?.desc ?? false}
                                                    onSort={(desc) => {
                                                        setSorting({ column: header, desc });
                                                        setIsOpen(false);
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

function SortOption({ header, isActive, sortDesc, onSort }: {
    header: string;
    isActive: boolean;
    sortDesc: boolean;
    onSort: (desc: boolean) => void
}) {
    // calculate next state for main click
    const nextDesc = isActive ? !sortDesc : false;

    return (
        <button
            type="button"
            onClick={() => onSort(nextDesc)}
            className={cn(
                "group flex w-full items-center justify-between p-3 rounded-xl border transition-all duration-200 cursor-pointer pointer-events-auto",
                isActive
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 ring-1 ring-blue-500/20"
                    : "bg-gray-50 dark:bg-gray-800/30 border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm"
            )}
        >
            <span className={cn(
                "text-xs font-bold truncate mr-2 text-left flex-1",
                isActive ? "text-blue-700 dark:text-blue-300" : "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200"
            )}>
                {header}
            </span>

            <div className="flex gap-1 shrink-0">
                <div
                    role="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onSort(false);
                    }}
                    className={cn(
                        "p-1.5 rounded-lg transition-all cursor-pointer hover:scale-105",
                        isActive && !sortDesc
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-white dark:bg-gray-900 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white border border-gray-100 dark:border-gray-700"
                    )}
                    title="Sort A-Z"
                >
                    <ArrowDownAZ className="w-4 h-4" />
                </div>
                <div
                    role="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onSort(true);
                    }}
                    className={cn(
                        "p-1.5 rounded-lg transition-all cursor-pointer hover:scale-105",
                        isActive && sortDesc
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-white dark:bg-gray-900 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white border border-gray-100 dark:border-gray-700"
                    )}
                    title="Sort Z-A"
                >
                    <ArrowUpAZ className="w-4 h-4" />
                </div>
            </div>
        </button>
    );
}
