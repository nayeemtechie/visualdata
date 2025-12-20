import { useCallback, useState } from 'react';
import * as XLSX from 'xlsx';

/**
 * Default required fields for the DataVista app
 */
export const REQUIRED_FIELDS = {
    date: { label: 'Date/Time', required: true },
    attributableSales: { label: 'Attributable Sales', required: false },
    ctr: { label: 'Click Through Rate (CTR)', required: false },
    impressions: { label: 'Impressions', required: false },
    clicks: { label: 'Clicks', required: false },
    spend: { label: 'Ad Spend', required: false },
};

/**
 * Detect the likely type of a column based on sample values
 * @param {any[]} values - Sample values from the column
 * @returns {string} - Detected type: 'date', 'number', 'percentage', 'currency', 'text'
 */
const detectColumnType = (values) => {
    const sampleSize = Math.min(values.length, 20);
    const sampleValues = values.slice(0, sampleSize).filter(v => v !== null && v !== undefined && v !== '');

    if (sampleValues.length === 0) return 'text';

    let dateCount = 0;
    let numberCount = 0;
    let percentCount = 0;
    let currencyCount = 0;

    for (const value of sampleValues) {
        const strValue = String(value).trim();

        // Check for percentage
        if (strValue.includes('%') || (typeof value === 'number' && value >= 0 && value <= 1)) {
            percentCount++;
            continue;
        }

        // Check for currency
        if (/^[$€£¥]/.test(strValue) || /[$€£¥]$/.test(strValue)) {
            currencyCount++;
            continue;
        }

        // Check for date
        if (typeof value === 'number' && value > 30000 && value < 50000) {
            // Likely Excel serial date
            dateCount++;
            continue;
        }

        const datePatterns = [
            /^\d{4}-\d{1,2}-\d{1,2}/, // YYYY-MM-DD
            /^\d{1,2}\/\d{1,2}\/\d{2,4}/, // MM/DD/YYYY or M/D/YY
            /^\d{1,2}-\d{1,2}-\d{2,4}/, // DD-MM-YYYY
            /^[A-Za-z]{3}\s+\d{1,2},?\s+\d{4}/, // Mon DD, YYYY
        ];

        if (datePatterns.some(pattern => pattern.test(strValue))) {
            dateCount++;
            continue;
        }

        // Check for number
        const numValue = parseFloat(strValue.replace(/[$,€£%]/g, ''));
        if (!isNaN(numValue)) {
            numberCount++;
            continue;
        }
    }

    const total = sampleValues.length;
    const threshold = 0.6; // 60% should match for type detection

    if (dateCount / total >= threshold) return 'date';
    if (percentCount / total >= threshold) return 'percentage';
    if (currencyCount / total >= threshold) return 'currency';
    if (numberCount / total >= threshold) return 'number';

    return 'text';
};

/**
 * Auto-detect column mappings based on column names
 * @param {string[]} columns - List of column names
 * @param {Object} columnTypes - Object with column types
 * @returns {Object} - Suggested column mappings
 */
const autoDetectMappings = (columns, columnTypes) => {
    const mappings = {};
    const lowerColumns = columns.map(c => c.toLowerCase());

    // Date column detection
    const datePatterns = ['date', 'time', 'day', 'period', 'timestamp'];
    for (let i = 0; i < columns.length; i++) {
        if (columnTypes[columns[i]] === 'date' ||
            datePatterns.some(p => lowerColumns[i].includes(p))) {
            mappings.date = columns[i];
            break;
        }
    }

    // Attributable Sales detection
    const salesPatterns = ['attributable sales', 'sales', 'revenue', 'total sales', 'attributed sales'];
    for (let i = 0; i < columns.length; i++) {
        if (salesPatterns.some(p => lowerColumns[i].includes(p))) {
            mappings.attributableSales = columns[i];
            break;
        }
    }

    // CTR detection
    const ctrPatterns = ['ctr', 'click through', 'clickthrough', 'click-through', 'click rate'];
    for (let i = 0; i < columns.length; i++) {
        if (ctrPatterns.some(p => lowerColumns[i].includes(p))) {
            mappings.ctr = columns[i];
            break;
        }
    }

    // Impressions detection
    const impressionPatterns = ['impression', 'impr', 'views', 'reach'];
    for (let i = 0; i < columns.length; i++) {
        if (impressionPatterns.some(p => lowerColumns[i].includes(p))) {
            mappings.impressions = columns[i];
            break;
        }
    }

    // Clicks detection
    const clickPatterns = ['click', 'clk'];
    for (let i = 0; i < columns.length; i++) {
        const col = lowerColumns[i];
        if (clickPatterns.some(p => col.includes(p)) && !col.includes('rate') && !col.includes('through')) {
            mappings.clicks = columns[i];
            break;
        }
    }

    // Spend detection
    const spendPatterns = ['spend', 'cost', 'budget', 'ad spend'];
    for (let i = 0; i < columns.length; i++) {
        if (spendPatterns.some(p => lowerColumns[i].includes(p))) {
            mappings.spend = columns[i];
            break;
        }
    }

    return mappings;
};

/**
 * Hook for parsing Excel/CSV files using SheetJS
 * 
 * @returns {Object} - Parser functions and state
 */
export const useFileParser = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [parsedData, setParsedData] = useState(null);
    const [columns, setColumns] = useState([]);
    const [columnTypes, setColumnTypes] = useState({});
    const [suggestedMappings, setSuggestedMappings] = useState({});
    const [needsMapping, setNeedsMapping] = useState(false);

    /**
     * Parse a file (XLSX or CSV)
     * @param {File} file - The file to parse
     * @returns {Promise<Object>} - Parsed data and metadata
     */
    const parseFile = useCallback(async (file) => {
        setIsLoading(true);
        setError(null);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, {
                type: 'array',
                cellDates: false, // Keep as serial numbers for better handling
                cellNF: true,
                cellText: true,
            });

            // Get the first sheet
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                raw: true, // Get raw values
                defval: null, // Default value for empty cells
            });

            if (jsonData.length === 0) {
                throw new Error('The file appears to be empty or has no data rows.');
            }

            // Extract column names
            const columnNames = Object.keys(jsonData[0]);

            // Detect column types
            const types = {};
            for (const col of columnNames) {
                const values = jsonData.map(row => row[col]);
                types[col] = detectColumnType(values);
            }

            // Auto-detect mappings
            const mappings = autoDetectMappings(columnNames, types);

            // Check if we have the minimum required fields
            const hasDate = !!mappings.date;
            const hasMetric = !!(mappings.attributableSales || mappings.ctr || mappings.impressions);

            setColumns(columnNames);
            setColumnTypes(types);
            setSuggestedMappings(mappings);
            setParsedData(jsonData);
            setNeedsMapping(!hasDate || !hasMetric);

            return {
                data: jsonData,
                columns: columnNames,
                columnTypes: types,
                suggestedMappings: mappings,
                needsMapping: !hasDate || !hasMetric,
                rowCount: jsonData.length,
                sheetName: firstSheetName,
            };
        } catch (err) {
            const errorMessage = err.message || 'Failed to parse the file. Please ensure it is a valid Excel or CSV file.';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Reset the parser state
     */
    const reset = useCallback(() => {
        setIsLoading(false);
        setError(null);
        setParsedData(null);
        setColumns([]);
        setColumnTypes({});
        setSuggestedMappings({});
        setNeedsMapping(false);
    }, []);

    /**
     * Update mappings after user selection
     */
    const updateMappings = useCallback((newMappings) => {
        setSuggestedMappings(prev => ({ ...prev, ...newMappings }));
        // Check if we now have required fields
        const hasDate = !!newMappings.date;
        setNeedsMapping(!hasDate);
    }, []);

    return {
        parseFile,
        reset,
        updateMappings,
        isLoading,
        error,
        parsedData,
        columns,
        columnTypes,
        suggestedMappings,
        needsMapping,
    };
};

export default useFileParser;
