"use client";

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from 'recharts';
import { motion } from 'framer-motion';
import { useProject } from '@/context/ProjectContext';
import { cn } from '@/lib/utils';

interface StatCardProps {
    column: string;
    data: any[];
}

const COLORS = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e',
    '#f97316', '#eab308', '#22c55e', '#06b6d4',
    '#6366f1', '#a855f7', '#d946ef', '#f472b6'
];

export function StatCard({ column, data }: StatCardProps) {
    const { filters, setFilter } = useProject();

    // Aggregation logic
    const stats = useMemo(() => {
        const counts: Record<string, number> = {};
        data.forEach(row => {
            const val = String(row[column] || "N/A");
            counts[val] = (counts[val] || 0) + 1;
        });

        const total = data.length;
        const result = Object.entries(counts)
            .map(([name, value]) => ({
                name,
                value,
                percentage: ((value / total) * 100).toFixed(1)
            }))
            .sort((a, b) => b.value - a.value);

        return result;
    }, [data, column]);

    const activeValues = filters[column] || new Set();

    const handleToggleFilter = (value: string) => {
        const newValues = new Set(activeValues);
        if (newValues.has(value)) {
            newValues.delete(value);
        } else {
            newValues.add(value);
        }
        setFilter(column, newValues);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col gap-6"
        >
            <div className="flex justify-between items-start">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{column}</h3>
                <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold">
                    {stats.length} Options
                </span>
            </div>

            {/* Donut Chart */}
            <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={stats}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                            onClick={(data) => handleToggleFilter(data.name)}
                            cursor="pointer"
                        >
                            {stats.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                    className={cn(
                                        "transition-all duration-300",
                                        activeValues.size > 0 && !activeValues.has(entry.name) ? "opacity-30" : "opacity-100"
                                    )}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Mini Pivot Table */}
            <div className="flex-1 overflow-auto max-h-[160px] scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                <table className="w-full text-xs text-left">
                    <thead className="sticky top-0 bg-white dark:bg-gray-900 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <tr>
                            <th className="pb-2">Value</th>
                            <th className="pb-2 text-right">#</th>
                            <th className="pb-2 text-right">%</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                        {stats.map((row, idx) => (
                            <tr
                                key={row.name}
                                onClick={() => handleToggleFilter(row.name)}
                                className={cn(
                                    "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
                                    activeValues.has(row.name) && "bg-blue-50/50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400"
                                )}
                            >
                                <td className="py-2 pr-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                        <span className="truncate max-w-[120px] font-medium">{row.name}</span>
                                    </div>
                                </td>
                                <td className="py-2 text-right font-bold">{row.value}</td>
                                <td className="py-2 text-right text-gray-500">{row.percentage}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}
