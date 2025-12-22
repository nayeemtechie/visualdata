import { useState, useMemo, useEffect } from 'react';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import ChartCard from './ChartCard';
import { useDataAggregator, GRANULARITY, AGGREGATION_TYPE } from '../hooks/useDataAggregator';
import { CHART_COLORS, formatNumber } from './ColumnMapper';

/**
 * Chart type options
 */
const CHART_TYPES = [
    { value: 'line', label: 'Line', icon: '📈' },
    { value: 'area', label: 'Area', icon: '📊' },
    { value: 'bar', label: 'Bar', icon: '📶' },
];

/**
 * CustomChart Component
 * User-created chart with customizable X/Y axis and chart type
 * Supports multi-select Y-axis fields
 */
const CustomChart = ({
    id,
    data = [],
    columnMapping = {},
    columns = [],
    initialConfig = {},
    onDelete,
    onConfigChange,
}) => {
    const [granularity, setGranularity] = useState(initialConfig.granularity || GRANULARITY.DAILY);
    const [chartType, setChartType] = useState(initialConfig.chartType || 'line');
    const [title, setTitle] = useState(initialConfig.title || 'Custom Chart');
    const [subtitle, setSubtitle] = useState(initialConfig.subtitle || '');
    const [selectedFields, setSelectedFields] = useState(initialConfig.selectedFields || []);
    const [showConfig, setShowConfig] = useState(!initialConfig.selectedFields?.length);
    const [hiddenMetrics, setHiddenMetrics] = useState(new Set());

    // Get ALL available fields - both from mapping AND raw columns
    const availableFields = useMemo(() => {
        const fields = [];
        const addedColumns = new Set();

        // First add mapped fields with their settings
        Object.entries(columnMapping).forEach(([field, config]) => {
            if (field === 'date') return;
            if (!config?.column || config.column === '__formula__') return;

            fields.push({
                field,
                label: config.label || config.column,
                column: config.column,
                isPercentage: config.isPercentage || false,
                color: config.color || CHART_COLORS[fields.length % CHART_COLORS.length],
            });
            addedColumns.add(config.column);
        });

        // Then add any columns that weren't mapped
        columns.forEach((col, idx) => {
            if (addedColumns.has(col)) return;
            // Skip date-like columns
            const dateColumn = columnMapping.date?.column;
            if (col === dateColumn) return;

            fields.push({
                field: `raw_${col}`,
                label: col,
                column: col,
                isPercentage: false,
                color: CHART_COLORS[(fields.length) % CHART_COLORS.length],
            });
        });

        return fields;
    }, [columnMapping, columns]);

    // Build metrics for aggregator from selected fields
    const selectedMetrics = useMemo(() => {
        return selectedFields.map(f => ({
            ...f,
            aggregationType: f.isPercentage ? AGGREGATION_TYPE.AVERAGE : AGGREGATION_TYPE.SUM,
        }));
    }, [selectedFields]);

    // Build column mapping for aggregator
    const aggregatorMapping = useMemo(() => {
        const mapping = {};
        if (columnMapping.date?.column) {
            mapping.date = columnMapping.date.column;
        }

        selectedFields.forEach(f => {
            mapping[f.field] = f.column;
        });

        return mapping;
    }, [columnMapping, selectedFields]);

    // Use the data aggregator hook
    const { chartData, getMetricTotal, isEmpty } = useDataAggregator(
        data,
        aggregatorMapping,
        granularity,
        selectedMetrics
    );

    const handleTitleChange = ({ title: newTitle, subtitle: newSubtitle }) => {
        setTitle(newTitle);
        setSubtitle(newSubtitle);
        onConfigChange?.(id, { title: newTitle, subtitle: newSubtitle });
    };

    const handleFieldToggle = (field) => {
        setSelectedFields(prev => {
            const exists = prev.some(f => f.field === field.field);
            if (exists) {
                return prev.filter(f => f.field !== field.field);
            } else {
                return [...prev, {
                    ...field,
                    color: field.color || CHART_COLORS[prev.length % CHART_COLORS.length],
                }];
            }
        });
    };

    const handleFieldColorChange = (fieldKey, color) => {
        setSelectedFields(prev => prev.map(f =>
            f.field === fieldKey ? { ...f, color } : f
        ));
    };

    const handleFieldPercentageToggle = (fieldKey) => {
        setSelectedFields(prev => prev.map(f =>
            f.field === fieldKey ? { ...f, isPercentage: !f.isPercentage } : f
        ));
    };

    const handleApplyConfig = () => {
        setShowConfig(false);
        onConfigChange?.(id, {
            selectedFields,
            chartType,
            granularity,
            title,
            subtitle,
        });
    };

    // Handle metrics change from ChartCard
    const handleMetricsChange = (newMetrics) => {
        setSelectedFields(newMetrics);
    };

    // Handle legend click
    const handleLegendClick = (entry) => {
        const field = entry.dataKey;
        setHiddenMetrics(prev => {
            const newSet = new Set(prev);
            if (newSet.has(field)) {
                newSet.delete(field);
            } else {
                // Don't hide the last visible metric
                if (selectedFields.length - newSet.size > 1) {
                    newSet.add(field);
                }
            }
            return newSet;
        });
    };

    // Custom tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload || !payload.length) return null;

        return (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
                <p className="font-semibold text-gray-900 mb-2">{label}</p>
                {payload.map((entry, index) => {
                    const metric = selectedFields.find(m => m.field === entry.dataKey);
                    const isPercentage = metric?.isPercentage;
                    return (
                        <div key={index} className="flex items-center gap-2 text-sm">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-gray-600">{entry.name}:</span>
                            <span className="font-semibold text-gray-900">
                                {formatNumber(entry.value, isPercentage)}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    };

    // Get primary metric total
    const primaryMetric = selectedFields[0];
    const metricTotal = primaryMetric
        ? getMetricTotal(primaryMetric.field, primaryMetric.isPercentage ? AGGREGATION_TYPE.AVERAGE : AGGREGATION_TYPE.SUM)
        : undefined;

    // Render chart based on type
    const renderChart = () => {
        const commonProps = {
            data: chartData,
            margin: { top: 10, right: 30, left: 0, bottom: 0 },
        };

        const primaryIsPercentage = primaryMetric?.isPercentage;

        if (chartType === 'bar') {
            return (
                <BarChart {...commonProps}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v, primaryIsPercentage)} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend onClick={handleLegendClick} wrapperStyle={{ cursor: 'pointer' }} />
                    {selectedFields.map((field, idx) => (
                        <Bar
                            key={field.field}
                            dataKey={field.field}
                            name={field.label}
                            fill={field.color}
                            hide={hiddenMetrics.has(field.field)}
                            radius={[4, 4, 0, 0]}
                        />
                    ))}
                </BarChart>
            );
        }

        if (chartType === 'area') {
            return (
                <AreaChart {...commonProps}>
                    <defs>
                        {selectedFields.map(field => (
                            <linearGradient key={field.field} id={`gradient-${id}-${field.field}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={field.color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={field.color} stopOpacity={0} />
                            </linearGradient>
                        ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v, primaryIsPercentage)} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend onClick={handleLegendClick} wrapperStyle={{ cursor: 'pointer' }} />
                    {selectedFields.map(field => (
                        <Area
                            key={field.field}
                            type="monotone"
                            dataKey={field.field}
                            name={field.label}
                            stroke={field.color}
                            strokeWidth={2}
                            fill={`url(#gradient-${id}-${field.field})`}
                            hide={hiddenMetrics.has(field.field)}
                        />
                    ))}
                </AreaChart>
            );
        }

        // Default: line chart
        return (
            <LineChart {...commonProps}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v, primaryIsPercentage)} />
                <Tooltip content={<CustomTooltip />} />
                <Legend onClick={handleLegendClick} wrapperStyle={{ cursor: 'pointer' }} />
                {selectedFields.map(field => (
                    <Line
                        key={field.field}
                        type="monotone"
                        dataKey={field.field}
                        name={field.label}
                        stroke={field.color}
                        strokeWidth={3}
                        dot={{ fill: field.color, strokeWidth: 2, r: 4 }}
                        hide={hiddenMetrics.has(field.field)}
                    />
                ))}
            </LineChart>
        );
    };

    // Configuration panel
    if (showConfig) {
        return (
            <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Configure Chart</h3>
                    {onDelete && (
                        <button
                            onClick={() => onDelete(id)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    )}
                </div>

                <div className="space-y-4">
                    {/* Chart Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Chart Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Enter chart title"
                        />
                    </div>

                    {/* Chart Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Chart Type</label>
                        <div className="flex gap-2">
                            {CHART_TYPES.map(type => (
                                <button
                                    key={type.value}
                                    onClick={() => setChartType(type.value)}
                                    className={`flex-1 px-4 py-2 rounded-xl font-medium transition-colors ${chartType === type.value
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {type.icon} {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Y-Axis Fields - Multi-select */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Y-Axis Fields <span className="text-gray-400">(select multiple)</span>
                        </label>
                        <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-1">
                            {availableFields.map(field => {
                                const isSelected = selectedFields.some(f => f.field === field.field);
                                return (
                                    <div
                                        key={field.field}
                                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-primary-50' : 'hover:bg-gray-50'
                                            }`}
                                        onClick={() => handleFieldToggle(field)}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => { }}
                                            className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
                                        />
                                        <div
                                            className="w-4 h-4 rounded"
                                            style={{ backgroundColor: field.color }}
                                        />
                                        <span className="flex-1 text-sm text-gray-700">{field.label}</span>
                                        {field.isPercentage && (
                                            <span className="text-xs bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded">%</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Selected Fields Options */}
                    {selectedFields.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Selected Fields Options</label>
                            <div className="space-y-2">
                                {selectedFields.map(field => (
                                    <div key={field.field} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                                        <input
                                            type="color"
                                            value={field.color}
                                            onChange={(e) => handleFieldColorChange(field.field, e.target.value)}
                                            className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                                        />
                                        <span className="flex-1 text-sm text-gray-700">{field.label}</span>
                                        <label className="flex items-center gap-1 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={field.isPercentage}
                                                onChange={() => handleFieldPercentageToggle(field.field)}
                                                className="w-3 h-3 text-primary-500 rounded"
                                            />
                                            <span className="text-xs text-gray-500">%</span>
                                        </label>
                                        <button
                                            onClick={() => handleFieldToggle(field)}
                                            className="text-gray-400 hover:text-red-500"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Apply Button */}
                    <button
                        onClick={handleApplyConfig}
                        disabled={selectedFields.length === 0}
                        className={`w-full py-3 rounded-xl font-semibold transition-colors ${selectedFields.length > 0
                            ? 'bg-primary-500 text-white hover:bg-primary-600'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        Create Chart ({selectedFields.length} field{selectedFields.length !== 1 ? 's' : ''})
                    </button>
                </div>
            </div>
        );
    }

    // Render chart view
    if (isEmpty || selectedFields.length === 0) {
        return (
            <ChartCard
                title={title}
                subtitle={subtitle}
                granularity={granularity}
                onGranularityChange={setGranularity}
                availableMetrics={[]}
                selectedMetrics={[]}
                onTitleChange={handleTitleChange}
                onDelete={() => onDelete?.(id)}
                showDelete={true}
            >
                <div className="h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                        <button
                            onClick={() => setShowConfig(true)}
                            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                        >
                            Configure Chart
                        </button>
                    </div>
                </div>
            </ChartCard>
        );
    }

    return (
        <ChartCard
            title={title}
            subtitle={subtitle}
            granularity={granularity}
            onGranularityChange={setGranularity}
            availableMetrics={availableFields}
            selectedMetrics={selectedFields}
            onMetricsChange={handleMetricsChange}
            metricTotal={formatNumber(metricTotal, primaryMetric?.isPercentage)}
            onTitleChange={handleTitleChange}
            onDelete={() => onDelete?.(id)}
            showDelete={true}
        >
            <ResponsiveContainer width="100%" height="100%">
                {renderChart()}
            </ResponsiveContainer>
        </ChartCard>
    );
};

export default CustomChart;
