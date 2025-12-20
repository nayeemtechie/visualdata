import { useState, useMemo } from 'react';
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
import { CHART_COLORS, formatNumber, evaluateFormula } from './ColumnMapper';

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
    const [yAxisField, setYAxisField] = useState(initialConfig.yAxisField || '');
    const [yAxisLabel, setYAxisLabel] = useState(initialConfig.yAxisLabel || '');
    const [isPercentage, setIsPercentage] = useState(initialConfig.isPercentage || false);
    const [chartColor, setChartColor] = useState(initialConfig.color || CHART_COLORS[0]);
    const [showConfig, setShowConfig] = useState(!initialConfig.yAxisField);
    const [hiddenMetrics, setHiddenMetrics] = useState(new Set());

    // Get available fields from column mapping
    const availableFields = useMemo(() => {
        const fields = [];
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
        });
        return fields;
    }, [columnMapping]);

    // Build metrics for aggregator
    const selectedMetrics = useMemo(() => {
        if (!yAxisField) return [];

        const config = columnMapping[yAxisField];
        if (!config) return [];

        return [{
            field: yAxisField,
            label: yAxisLabel || config.label || config.column,
            aggregationType: isPercentage ? AGGREGATION_TYPE.AVERAGE : AGGREGATION_TYPE.SUM,
            color: chartColor,
            isPercentage,
        }];
    }, [yAxisField, yAxisLabel, columnMapping, isPercentage, chartColor]);

    // Build column mapping for aggregator
    const aggregatorMapping = useMemo(() => {
        const mapping = {};
        if (columnMapping.date?.column) {
            mapping.date = columnMapping.date.column;
        }

        if (yAxisField && columnMapping[yAxisField]?.column) {
            mapping[yAxisField] = columnMapping[yAxisField].column;
        }

        return mapping;
    }, [columnMapping, yAxisField]);

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

    const handleFieldChange = (field) => {
        setYAxisField(field);
        const config = columnMapping[field];
        if (config) {
            setYAxisLabel(config.label || config.column);
            setIsPercentage(config.isPercentage || false);
            setChartColor(config.color || CHART_COLORS[0]);
        }
    };

    const handleApplyConfig = () => {
        setShowConfig(false);
        onConfigChange?.(id, {
            yAxisField,
            yAxisLabel,
            isPercentage,
            color: chartColor,
            chartType,
            granularity,
            title,
            subtitle,
        });
    };

    // Handle legend click
    const handleLegendClick = (entry) => {
        const field = entry.dataKey;
        setHiddenMetrics(prev => {
            const newSet = new Set(prev);
            if (newSet.has(field)) {
                newSet.delete(field);
            } else {
                newSet.add(field);
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
                {payload.map((entry, index) => (
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
                ))}
            </div>
        );
    };

    // Get metric total
    const metricTotal = selectedMetrics.length > 0
        ? getMetricTotal(selectedMetrics[0].field, selectedMetrics[0].aggregationType)
        : undefined;

    // Render chart based on type
    const renderChart = () => {
        const commonProps = {
            data: chartData,
            margin: { top: 10, right: 30, left: 0, bottom: 0 },
        };

        const isHidden = hiddenMetrics.has(yAxisField);

        if (chartType === 'bar') {
            return (
                <BarChart {...commonProps}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v, isPercentage)} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend onClick={handleLegendClick} wrapperStyle={{ cursor: 'pointer' }} />
                    <Bar dataKey={yAxisField} name={yAxisLabel} fill={chartColor} hide={isHidden} radius={[4, 4, 0, 0]} />
                </BarChart>
            );
        }

        if (chartType === 'area') {
            return (
                <AreaChart {...commonProps}>
                    <defs>
                        <linearGradient id={`gradient-custom-${id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v, isPercentage)} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend onClick={handleLegendClick} wrapperStyle={{ cursor: 'pointer' }} />
                    <Area type="monotone" dataKey={yAxisField} name={yAxisLabel} stroke={chartColor} strokeWidth={2} fill={`url(#gradient-custom-${id})`} hide={isHidden} />
                </AreaChart>
            );
        }

        // Default: line chart
        return (
            <LineChart {...commonProps}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v, isPercentage)} />
                <Tooltip content={<CustomTooltip />} />
                <Legend onClick={handleLegendClick} wrapperStyle={{ cursor: 'pointer' }} />
                <Line type="monotone" dataKey={yAxisField} name={yAxisLabel} stroke={chartColor} strokeWidth={3} dot={{ fill: chartColor, strokeWidth: 2, r: 4 }} hide={isHidden} />
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

                    {/* Y-Axis Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Y-Axis (Value)</label>
                        <select
                            value={yAxisField}
                            onChange={(e) => handleFieldChange(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">-- Select field --</option>
                            {availableFields.map(field => (
                                <option key={field.field} value={field.field}>
                                    {field.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Y-Axis Label & Options */}
                    {yAxisField && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Y-Axis Label</label>
                                <input
                                    type="text"
                                    value={yAxisLabel}
                                    onChange={(e) => setYAxisLabel(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isPercentage}
                                        onChange={(e) => setIsPercentage(e.target.checked)}
                                        className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-gray-600">Show as percentage (%)</span>
                                </label>

                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">Color:</span>
                                    <input
                                        type="color"
                                        value={chartColor}
                                        onChange={(e) => setChartColor(e.target.value)}
                                        className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Apply Button */}
                    <button
                        onClick={handleApplyConfig}
                        disabled={!yAxisField}
                        className={`w-full py-3 rounded-xl font-semibold transition-colors ${yAxisField
                                ? 'bg-primary-500 text-white hover:bg-primary-600'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        Create Chart
                    </button>
                </div>
            </div>
        );
    }

    // Render chart view
    if (isEmpty || !yAxisField) {
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
            selectedMetrics={selectedMetrics}
            onMetricsChange={() => { }}
            metricTotal={formatNumber(metricTotal, isPercentage)}
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
