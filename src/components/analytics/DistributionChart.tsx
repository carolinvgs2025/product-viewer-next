"use client";

import React, { useMemo } from 'react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts';

interface DistributionChartProps {
    data: any[];
    columnName: string;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, value, name, percent } = props;
    const RADIAN = Math.PI / 180;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    if (percent < 0.02) return null; // Only show for slices > 2%

    return (
        <g>
            <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke="#9ca3af" fill="none" />
            <circle cx={ex} cy={ey} r={2} fill="#9ca3af" stroke="none" />
            <text
                x={ex + (cos >= 0 ? 1 : -1) * 12}
                y={ey}
                textAnchor={textAnchor}
                fill="#374151"
                dominantBaseline="central"
                className="text-xs font-bold dark:text-gray-300"
                style={{ fontSize: '13px' }}
            >
                {`${(percent * 100).toFixed(0)}% — ${name}`}
            </text>
        </g>
    );
};

export function DistributionChart({ data, columnName }: DistributionChartProps) {
    const chartData = useMemo(() => {
        const counts: Record<string, number> = {};

        data.forEach(row => {
            const val = String(row[columnName] || '(Empty)');
            counts[val] = (counts[val] || 0) + 1;
        });

        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10); // Top 10 for clarity
    }, [data, columnName]);

    if (!columnName) return null;

    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xl h-[500px] animate-in fade-in zoom-in-95 duration-500 flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 italic">
                        Distribution: <span className="text-blue-600 dark:text-blue-400 not-italic">{columnName}</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Showing top {chartData.length} categories</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Analysis Mode</span>
                </div>
            </div>

            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 20, right: 120, left: 120, bottom: 20 }}>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderCustomizedLabel}
                            outerRadius={100}
                            innerRadius={60}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="outline-none" />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1f2937',
                                border: 'none',
                                borderRadius: '12px',
                                color: '#f3f4f6',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                padding: '8px 12px',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                            }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value: any) => [`${value} items`, 'Count']}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
