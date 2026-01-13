"use client";

import React from 'react';
import { useProject } from '@/context/ProjectContext';
import { StatCard } from './StatCard';
import { motion } from 'framer-motion';
import { PieChart, ListFilter, BarChart3 } from 'lucide-react';

export function AnalyticsDashboard() {
    const { filteredData, uniqueValues, data } = useProject();

    // Use keys from uniqueValues as they are already filtered for categorical-like data
    const analyticsColumns = Object.keys(uniqueValues).sort();

    if (analyticsColumns.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-4">
                <PieChart className="w-12 h-12 opacity-20" />
                <p className="text-sm font-medium">No categorical data found for analytics.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header / Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20"
                >
                    <div className="flex items-center gap-3 mb-2 opacity-80">
                        <BarChart3 className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Total Products</span>
                    </div>
                    <div className="text-3xl font-black">{data.length}</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-violet-600 rounded-2xl p-6 text-white shadow-lg shadow-violet-500/20"
                >
                    <div className="flex items-center gap-3 mb-2 opacity-80">
                        <ListFilter className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Filtered View</span>
                    </div>
                    <div className="text-3xl font-black">
                        {filteredData.length}
                        <span className="text-sm font-medium ml-2 opacity-60">
                            ({((filteredData.length / data.length) * 100).toFixed(0)}%)
                        </span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gray-900 dark:bg-gray-800 rounded-2xl p-6 text-white shadow-lg"
                >
                    <div className="flex items-center gap-3 mb-2 opacity-80">
                        <PieChart className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Active Metrics</span>
                    </div>
                    <div className="text-3xl font-black">{analyticsColumns.length}</div>
                </motion.div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {analyticsColumns.map((col, index) => (
                    <StatCard
                        key={col}
                        column={col}
                        data={filteredData}
                    />
                ))}
            </div>
        </div>
    );
}
