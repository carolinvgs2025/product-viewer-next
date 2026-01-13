"use client";

import React, { useMemo, useState } from 'react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Text,
    LabelList
} from 'recharts';
import { PieChart as PieIcon, BarChart3, ArrowDownWideNarrow } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DistributionChartProps {
    data: any[];
    columnName: string;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

const wrapText = (text: string, maxChars: number) => {
    // If text is short enough, return as single line
    if (text.length <= maxChars) return [text];

    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        if (currentLine.length + 1 + words[i].length <= maxChars) {
            currentLine += ' ' + words[i];
        } else {
            lines.push(currentLine);
            currentLine = words[i];
        }
    }
    lines.push(currentLine);
    return lines;
};

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

    const fullText = `${(percent * 100).toFixed(0)}% — ${name}`;
    // Wrap at 25 characters
    const lines = wrapText(fullText, 25);

    return (
        <g className="text-gray-900 dark:text-white">
            <path
                d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
                stroke="currentColor"
                fill="none"
                className="text-gray-400 dark:text-gray-500"
            />
            <circle
                cx={ex}
                cy={ey}
                r={2}
                fill="currentColor"
                stroke="none"
                className="text-gray-400 dark:text-gray-500"
            />
            <text
                x={ex + (cos >= 0 ? 1 : -1) * 12}
                y={ey}
                textAnchor={textAnchor}
                fill="currentColor"
                dominantBaseline={lines.length > 1 ? "auto" : "central"}
                className="text-xs font-bold active-label"
                style={{ fontSize: '12px', fontWeight: 700 }}
            >
                {lines.map((line, index) => (
                    <tspan
                        key={index}
                        x={ex + (cos >= 0 ? 1 : -1) * 12}
                        dy={index === 0 ? (lines.length > 1 ? "-0.4em" : "0") : "1.2em"}
                        className={index === 0 && lines.length > 1 ? "font-extrabold" : ""}
                    >
                        {line}
                    </tspan>
                ))}
            </text>
        </g>
    );
};

const CustomYAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const lines = wrapText(payload.value, 30);

    return (
        <g transform={`translate(${x},${y})`}>
            <text
                x={-10}
                y={0}
                dy={lines.length > 1 ? -8 : 4}
                textAnchor="end"
                fill="currentColor"
                className="text-[11px] font-medium text-gray-600 dark:text-gray-400"
            >
                {lines.map((line, index) => (
                    <tspan key={index} x={-10} dy={index === 0 ? 0 : 12}>
                        {line}
                    </tspan>
                ))}
            </text>
        </g>
    );
};

export function DistributionChart({ data, columnName }: DistributionChartProps) {
    const [chartType, setChartType] = useState<'pie' | 'bar'>('bar'); // Default to 'bar' based on user preference

    const chartData = useMemo(() => {
        const counts: Record<string, number> = {};
        let total = 0;

        data.forEach(row => {
            const val = String(row[columnName] || '(Empty)');
            counts[val] = (counts[val] || 0) + 1;
            total++;
        });

        // Sort Highest to Lowest
        return Object.entries(counts)
            .map(([name, value]) => ({
                name,
                value,
                percentageLabel: `${((value / total) * 100).toFixed(0)}%`
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 15); // Show top 15 for bar chart, maybe less for pie
    }, [data, columnName]);

    if (!columnName) return null;

    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xl h-[600px] animate-in fade-in zoom-in-95 duration-500 flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 italic flex items-center gap-2">
                        Distribution: <span className="text-blue-600 dark:text-blue-400 not-italic">{columnName}</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <ArrowDownWideNarrow className="w-3 h-3" />
                        Ordered Highest to Lowest
                    </p>
                </div>

                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setChartType('bar')}
                        className={cn(
                            "p-2 rounded-md transition-all",
                            chartType === 'bar'
                                ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm"
                                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        )}
                        title="Ordered List (Bar)"
                    >
                        <BarChart3 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setChartType('pie')}
                        className={cn(
                            "p-2 rounded-md transition-all",
                            chartType === 'pie'
                                ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm"
                                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        )}
                        title="Proportions (Pie)"
                    >
                        <PieIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex-1 min-h-0 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'bar' ? (
                        <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" opacity={0.5} />
                            <XAxis type="number" hide />
                            <YAxis
                                type="category"
                                dataKey="name"
                                width={180}
                                tick={<CustomYAxisTick />}
                                interval={0}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                                contentStyle={{
                                    backgroundColor: '#1f2937',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: '#f3f4f6',
                                    fontSize: '12px'
                                }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Bar
                                dataKey="value"
                                fill="#3b82f6"
                                radius={[0, 4, 4, 0]}
                                barSize={24}
                                animationDuration={1000}
                            >
                                <LabelList
                                    dataKey="percentageLabel"
                                    position="right"
                                    className="text-xs font-bold fill-gray-600 dark:fill-gray-400"
                                    style={{ fontSize: 11, fontWeight: 600 }}
                                />
                                {
                                    chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))
                                }
                            </Bar>
                        </BarChart>
                    ) : (
                        <PieChart margin={{ top: 20, right: 120, left: 120, bottom: 20 }}>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={renderCustomizedLabel}
                                outerRadius={120}
                                innerRadius={70}
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
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
}
