import { useMemo, useCallback } from 'react';
import {
    format,
    parseISO,
    startOfDay,
    startOfMonth,
    startOfQuarter,
    getQuarter,
    getYear,
    isValid
} from 'date-fns';

/**
 * Granularity options for data aggregation
 */
export const GRANULARITY = {
    DAILY: 'daily',
    MONTHLY: 'monthly',
    QUARTERLY: 'quarterly',
};

/**
 * Aggregation types for different metrics
 */
export const AGGREGATION_TYPE = {
    SUM: 'sum',
    AVERAGE: 'average',
    COUNT: 'count',
    MIN: 'min',
    MAX: 'max',
};

/**
 * Parse a date value that could be in various formats
 * @param {string|number|Date} value - The date value to parse
 * @returns {Date|null} - Parsed Date object or null if invalid
 */
const parseDate = (value) => {
    if (!value) return null;

    // Already a Date object
    if (value instanceof Date) {
        return isValid(value) ? value : null;
    }

    // Excel serial date number
    if (typeof value === 'number') {
        // Excel dates start from 1900-01-01 (or 1904-01-01 for Mac)
        // Serial number 1 = 1900-01-01
        // We need to adjust for Excel's leap year bug (1900 counted as leap year)
        const excelEpoch = new Date(1899, 11, 30); // Dec 30, 1899
        const millisecondsPerDay = 24 * 60 * 60 * 1000;
        const date = new Date(excelEpoch.getTime() + value * millisecondsPerDay);
        return isValid(date) ? date : null;
    }

    // String date
    if (typeof value === 'string') {
        // Try ISO format first
        let date = parseISO(value);
        if (isValid(date)) return date;

        // Try other common formats
        const formats = [
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // MM/DD/YYYY or M/D/YYYY
            /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
            /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
        ];

        for (const regex of formats) {
            const match = value.match(regex);
            if (match) {
                // Try parsing as Date constructor
                date = new Date(value);
                if (isValid(date)) return date;
            }
        }

        // Last resort: try native Date parsing
        date = new Date(value);
        return isValid(date) ? date : null;
    }

    return null;
};

/**
 * Get the period key for grouping based on granularity
 * @param {Date} date - The date to get period key for
 * @param {string} granularity - The granularity level
 * @returns {string} - Period key for grouping
 */
const getPeriodKey = (date, granularity) => {
    switch (granularity) {
        case GRANULARITY.DAILY:
            return format(startOfDay(date), 'yyyy-MM-dd');
        case GRANULARITY.MONTHLY:
            return format(startOfMonth(date), 'yyyy-MM');
        case GRANULARITY.QUARTERLY:
            const year = getYear(date);
            const quarter = getQuarter(date);
            return `${year}-Q${quarter}`;
        default:
            return format(startOfDay(date), 'yyyy-MM-dd');
    }
};

/**
 * Get display label for a period key
 * @param {string} periodKey - The period key
 * @param {string} granularity - The granularity level
 * @returns {string} - Human-readable label
 */
const getPeriodLabel = (periodKey, granularity) => {
    switch (granularity) {
        case GRANULARITY.DAILY:
            try {
                return format(parseISO(periodKey), 'MMM d, yyyy');
            } catch {
                return periodKey;
            }
        case GRANULARITY.MONTHLY:
            try {
                return format(parseISO(`${periodKey}-01`), 'MMM yyyy');
            } catch {
                return periodKey;
            }
        case GRANULARITY.QUARTERLY:
            return periodKey.replace('-', ' ');
        default:
            return periodKey;
    }
};

/**
 * Aggregate values based on aggregation type
 * @param {number[]} values - Array of numeric values
 * @param {string} aggregationType - Type of aggregation
 * @returns {number} - Aggregated result
 */
const aggregateValues = (values, aggregationType) => {
    if (!values || values.length === 0) return 0;

    const validValues = values.filter(v => typeof v === 'number' && !isNaN(v));
    if (validValues.length === 0) return 0;

    switch (aggregationType) {
        case AGGREGATION_TYPE.SUM:
            return validValues.reduce((sum, val) => sum + val, 0);
        case AGGREGATION_TYPE.AVERAGE:
            return validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
        case AGGREGATION_TYPE.COUNT:
            return validValues.length;
        case AGGREGATION_TYPE.MIN:
            return Math.min(...validValues);
        case AGGREGATION_TYPE.MAX:
            return Math.max(...validValues);
        default:
            return validValues.reduce((sum, val) => sum + val, 0);
    }
};

/**
 * Parse numeric value from various formats
 * @param {any} value - Value to parse
 * @returns {number|null} - Parsed number or null
 */
const parseNumericValue = (value) => {
    if (typeof value === 'number' && !isNaN(value)) return value;
    if (typeof value === 'string') {
        // Remove currency symbols, commas, and percentage signs
        const cleaned = value.replace(/[$,€£%]/g, '').trim();
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? null : parsed;
    }
    return null;
};

/**
 * Main hook for aggregating data based on time granularity
 * 
 * @param {Object[]} rawData - Array of data rows
 * @param {Object} columnMapping - Mapping of required fields to column names
 * @param {string} granularity - Aggregation granularity (daily, monthly, quarterly)
 * @param {Object[]} metrics - Array of metrics to aggregate [{field, aggregationType, label}]
 * @returns {Object} - Aggregated data and helper functions
 */
export const useDataAggregator = (
    rawData = [],
    columnMapping = {},
    granularity = GRANULARITY.DAILY,
    metrics = []
) => {
    /**
     * Aggregate data based on date and selected metrics
     */
    const aggregatedData = useMemo(() => {
        if (!rawData || rawData.length === 0 || !columnMapping.date) {
            return [];
        }

        const dateColumn = columnMapping.date;

        // Group data by period
        const groupedData = new Map();

        for (const row of rawData) {
            const dateValue = row[dateColumn];
            const parsedDate = parseDate(dateValue);

            if (!parsedDate) continue;

            const periodKey = getPeriodKey(parsedDate, granularity);

            if (!groupedData.has(periodKey)) {
                groupedData.set(periodKey, {
                    periodKey,
                    date: parsedDate,
                    rows: [],
                });
            }

            groupedData.get(periodKey).rows.push(row);
        }

        // Aggregate metrics for each period
        const result = [];

        // Sort periods chronologically
        const sortedPeriods = Array.from(groupedData.values()).sort(
            (a, b) => a.date.getTime() - b.date.getTime()
        );

        for (const period of sortedPeriods) {
            const aggregatedRow = {
                periodKey: period.periodKey,
                label: getPeriodLabel(period.periodKey, granularity),
                date: period.date,
                rowCount: period.rows.length,
            };

            // Aggregate each metric
            for (const metric of metrics) {
                const columnName = columnMapping[metric.field] || metric.field;
                const values = period.rows
                    .map(row => parseNumericValue(row[columnName]))
                    .filter(v => v !== null);

                aggregatedRow[metric.field] = aggregateValues(values, metric.aggregationType);
            }

            result.push(aggregatedRow);
        }

        return result;
    }, [rawData, columnMapping, granularity, metrics]);

    /**
     * Get total aggregated value for a specific metric
     */
    const getMetricTotal = useCallback((field, aggregationType = AGGREGATION_TYPE.SUM) => {
        const values = aggregatedData.map(row => row[field]).filter(v => v !== undefined);
        return aggregateValues(values, aggregationType);
    }, [aggregatedData]);

    /**
     * Get min and max values for a metric (useful for chart scales)
     */
    const getMetricRange = useCallback((field) => {
        const values = aggregatedData.map(row => row[field]).filter(v => v !== undefined && v !== null);
        if (values.length === 0) return { min: 0, max: 0 };
        return {
            min: Math.min(...values),
            max: Math.max(...values),
        };
    }, [aggregatedData]);

    /**
     * Get data formatted for Recharts
     */
    const chartData = useMemo(() => {
        return aggregatedData.map(row => ({
            ...row,
            name: row.label, // Recharts uses 'name' for X-axis labels
        }));
    }, [aggregatedData]);

    return {
        aggregatedData,
        chartData,
        getMetricTotal,
        getMetricRange,
        totalPeriods: aggregatedData.length,
        isEmpty: aggregatedData.length === 0,
    };
};

export default useDataAggregator;
