
import { useState, useMemo, useRef, useEffect } from 'react';
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

            {/* Smart Popover - Split Pane Layout */}
            {isOpen && (
                <div className="absolute top-full right-0 lg:left-0 lg:right-auto mt-2 z-50 w-[800px] origin-top-left animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl flex flex-col h-[640px] overflow-hidden">


                        {/* Header: Search & Active Status */}
                        <div className="p-3 border-b border-gray-100 dark:border-gray-800 space-y-3 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm shrink-0">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Filter columns..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    autoFocus
                                />
                            </div>

                            {sorting && (
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                        Active: {activeSortLabel}
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSorting(null);
                                            setIsOpen(false);
                                        }}
                                        className="text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 px-2 py-1 rounded-md font-medium transition-colors flex items-center gap-1"
                                    >
                                        <X className="w-3 h-3" />
                                        Clear Sort
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Split Panes */}
                        <div className="flex flex-1 overflow-hidden">

                            {/* Left Sidebar: Categories (Hidden during search) */}
                            {searchQuery === '' && (
                                <div className="w-1/3 border-r border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30 overflow-y-auto no-scrollbar p-2 space-y-1">
                                    <h5 className="text-[10px] font-bold uppercase text-gray-400 dark:text-gray-600 px-3 py-2">
                                        Categories
                                    </h5>
                                    {categories.map(category => (
                                        <button
                                            key={category}
                                            onClick={() => setActiveCategory(category)}
                                            className={cn(
                                                "w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between group transition-all",
                                                activeCategory === category
                                                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm"
                                                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <FolderOpen className={cn("w-3.5 h-3.5", activeCategory === category ? "text-blue-500" : "text-gray-400")} />
                                                <span className="truncate">{category}</span>
                                            </div>
                                            {activeCategory === category && (
                                                <ChevronRight className="w-3 h-3 text-blue-500" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Right Panel: Items (Grid) */}
                            <div className={cn(
                                "flex-1 overflow-y-auto p-4 no-scrollbar",
                                searchQuery !== '' ? "w-full" : "w-2/3"
                            )}>
                                {searchQuery !== '' ? (
                                    /* Search Results View */
                                    <div className="space-y-4">
                                        <h5 className="text-[10px] font-bold uppercase text-gray-400 dark:text-gray-600">
                                            Search Results ({searchResults.length})
                                        </h5>
                                        {searchResults.length > 0 ? (
                                            <div className="grid grid-cols-2 gap-2">
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
                                            <div className="text-center py-12 text-gray-400 dark:text-gray-600">
                                                <Search className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                                <p className="text-sm">No columns found</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* Category View */
                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300" key={activeCategory}>
                                        <div className="flex items-center justify-between">
                                            <h5 className="text-[10px] font-bold uppercase text-gray-400 dark:text-gray-600">
                                                {activeCategory}
                                            </h5>
                                            <span className="text-[10px] text-gray-400">{groups[activeCategory]?.length || 0} columns</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2"> {/* Keeping Grid 2 to fit more columns without scroll */}
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
                </div>
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
    return (
        <div className={cn(
            "group flex items-center justify-between p-2 rounded-lg border transition-all duration-200",
            isActive
                ? "bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
                : "bg-gray-50/50 dark:bg-gray-800/30 border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-white dark:hover:bg-gray-800"
        )}>
            <span className={cn(
                "text-xs font-medium truncate mr-2",
                isActive ? "text-blue-700 dark:text-blue-300" : "text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100"
            )}>
                {header}
            </span>

            <div className="flex gap-0.5 shrink-0 opacity-100">
                <button
                    onClick={(e) => { e.stopPropagation(); onSort(false); }}
                    className={cn(
                        "p-1.5 rounded-md transition-colors",
                        isActive && !sortDesc
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-gray-100 dark:bg-gray-700/50 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                    )}
                    title="Sort A-Z (Ascending)"
                >
                    <ArrowDownAZ className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onSort(true); }}
                    className={cn(
                        "p-1.5 rounded-md transition-colors",
                        isActive && sortDesc
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-gray-100 dark:bg-gray-700/50 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                    )}
                    title="Sort Z-A (Descending)"
                >
                    <div className="rotate-0 flex items-center justify-center">
                        <ArrowUpAZ className="w-3.5 h-3.5" />
                    </div>
                </button>
            </div>
        </div>
    );
}
