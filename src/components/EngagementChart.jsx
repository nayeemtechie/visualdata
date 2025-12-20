import { useState, useMemo } from 'react';
import {
    LineChart,
    Line,
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
 * EngagementChart Component
 * Chart displaying CTR (average) over time with multi-metric overlay
 */
const EngagementChart = ({ data = [], columnMapping = {} }) => {
    const [granularity, setGranularity] = useState(GRANULARITY.DAILY);
    const [hiddenMetrics, setHiddenMetrics] = useState(new Set());

    // Build available metrics from column mapping - focused on engagement metrics
    const availableMetrics = useMemo(() => {
        const metrics = [];

        // Primary metric: CTR
        if (columnMapping.ctr?.column) {
            metrics.push({
                field: 'ctr',
                label: columnMapping.ctr.label || 'Click Through Rate',
                aggregationType: AGGREGATION_TYPE.AVERAGE,
                color: columnMapping.ctr.color || CHART_COLORS[2],
                isPercentage: columnMapping.ctr.isPercentage !== false,
                formula: columnMapping.ctr.formula,
            });
        }

        // Add other mapped metrics that are engagement-related
        const engagementFields = ['impressions', 'clicks'];
        engagementFields.forEach(field => {
            const config = columnMapping[field];
            if (!config?.column) return;

            metrics.push({
                field,
                label: config.label || config.column,
                aggregationType: AGGREGATION_TYPE.SUM,
                color: config.color || CHART_COLORS[metrics.length % CHART_COLORS.length],
                isPercentage: config.isPercentage || false,
                formula: config.formula,
            });
        });

        // Add any custom fields that look like engagement metrics
        Object.entries(columnMapping).forEach(([field, config]) => {
            if (['date', 'attributableSales', 'ctr', 'impressions', 'clicks'].includes(field)) return;
            if (!config?.column) return;

            // Only include if it's a percentage or contains rate/engagement keywords
            const lowerLabel = (config.label || config.column || '').toLowerCase();
            const isEngagementMetric = config.isPercentage ||
                lowerLabel.includes('rate') ||
                lowerLabel.includes('exit') ||
                lowerLabel.includes('bounce') ||
                lowerLabel.includes('conversion') ||
                lowerLabel.includes('cvr');

            if (isEngagementMetric) {
                metrics.push({
                    field,
                    label: config.label || config.column,
                    aggregationType: config.isPercentage ? AGGREGATION_TYPE.AVERAGE : AGGREGATION_TYPE.SUM,
                    color: config.color || CHART_COLORS[metrics.length % CHART_COLORS.length],
                    isPercentage: config.isPercentage || false,
                    formula: config.formula,
                });
            }
        });

        return metrics;
    }, [columnMapping]);

    const [selectedMetrics, setSelectedMetrics] = useState(() =>
        availableMetrics.length > 0 ? [availableMetrics[0]] : []
    );

    // Update selected metrics when available metrics change
    useMemo(() => {
        if (availableMetrics.length > 0 && selectedMetrics.length === 0) {
            setSelectedMetrics([availableMetrics[0]]);
        }
    }, [availableMetrics]);

    // Build column mapping for aggregator
    const aggregatorMapping = useMemo(() => {
        const mapping = {};
        if (columnMapping.date?.column) {
            mapping.date = columnMapping.date.column;
        } else if (typeof columnMapping.date === 'string') {
            mapping.date = columnMapping.date;
        }

        Object.entries(columnMapping).forEach(([field, config]) => {
            if (field === 'date') return;
            if (typeof config === 'string') {
                mapping[field] = config;
            } else if (config?.column && config.column !== '__formula__') {
                mapping[field] = config.column;
            }
        });
        return mapping;
    }, [columnMapping]);

    // Filter selected metrics to only those that are available
    const validSelectedMetrics = useMemo(() => {
        const available = new Set(availableMetrics.map(m => m.field));
        const valid = selectedMetrics.filter(m => available.has(m.field));
        return valid.length > 0 ? valid : (availableMetrics.length > 0 ? [availableMetrics[0]] : []);
    }, [selectedMetrics, availableMetrics]);

    // Get non-formula metrics for aggregator
    const nonFormulaMetrics = useMemo(() => {
        return validSelectedMetrics.filter(m => !m.formula);
    }, [validSelectedMetrics]);

    // Use the data aggregator hook
    const { chartData: baseChartData, getMetricTotal, isEmpty } = useDataAggregator(
        data,
        aggregatorMapping,
        granularity,
        nonFormulaMetrics
    );

    // Apply formulas to chart data
    const chartData = useMemo(() => {
        const formulaMetrics = validSelectedMetrics.filter(m => m.formula);
        if (formulaMetrics.length === 0) return baseChartData;

        return baseChartData.map(row => {
            const newRow = { ...row };
            formulaMetrics.forEach(metric => {
                newRow[metric.field] = evaluateFormula(metric.formula, row, columnMapping) || 0;
            });
            return newRow;
        });
    }, [baseChartData, validSelectedMetrics, columnMapping]);

    // Handle legend click to toggle visibility
    const handleLegendClick = (entry) => {
        const field = entry.dataKey;
        setHiddenMetrics(prev => {
            const newSet = new Set(prev);
            if (newSet.has(field)) {
                newSet.delete(field);
            } else {
                if (validSelectedMetrics.length - newSet.size > 1) {
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
                    const metric = validSelectedMetrics.find(m => m.field === entry.dataKey);
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

    // Get primary metric total for display
    const primaryMetric = validSelectedMetrics[0];
    const metricTotal = primaryMetric
        ? getMetricTotal(primaryMetric.field, primaryMetric.aggregationType)
        : undefined;

    const formatTotal = () => {
        if (metricTotal === undefined) return undefined;
        return formatNumber(metricTotal, primaryMetric?.isPercentage);
    };

    if (isEmpty || availableMetrics.length === 0) {
        return (
            <ChartCard
                title="Engagement"
                subtitle="Click Through Rate over time"
                granularity={granularity}
                onGranularityChange={setGranularity}
                availableMetrics={availableMetrics}
                selectedMetrics={validSelectedMetrics}
                onMetricsChange={setSelectedMetrics}
            >
                <div className="h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                        </svg>
                        <p>No engagement data available</p>
                        <p className="text-sm mt-1">Map "CTR" or rate columns to see data</p>
                    </div>
                </div>
            </ChartCard>
        );
    }

    return (
        <ChartCard
            title="Engagement"
            subtitle="Click Through Rate over time"
            granularity={granularity}
            onGranularityChange={setGranularity}
            availableMetrics={availableMetrics}
            selectedMetrics={validSelectedMetrics}
            onMetricsChange={setSelectedMetrics}
            metricTotal={formatTotal()}
        >
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis
                        dataKey="name"
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => formatNumber(value, primaryMetric?.isPercentage)}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        onClick={handleLegendClick}
                        wrapperStyle={{ cursor: 'pointer' }}
                    />
                    {validSelectedMetrics.map(metric => (
                        <Line
                            key={metric.field}
                            type="monotone"
                            dataKey={metric.field}
                            name={metric.label}
                            stroke={metric.color}
                            strokeWidth={3}
                            dot={{ fill: metric.color, strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, strokeWidth: 2 }}
                            hide={hiddenMetrics.has(metric.field)}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </ChartCard>
    );
};

export default EngagementChart;
