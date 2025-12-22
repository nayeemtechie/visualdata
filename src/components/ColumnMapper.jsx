import { useState, useEffect, useMemo } from 'react';

/**
 * Default chart color palette
 */
export const CHART_COLORS = [
    '#14b8a6', // Teal
    '#6366f1', // Royal Blue
    '#a855f7', // Violet
    '#f97316', // Orange
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#84cc16', // Lime
    '#f43f5e', // Rose
];

/**
 * Format number with K/M suffix
 */
export const formatNumber = (value, isPercentage = false) => {
    if (value === null || value === undefined || isNaN(value)) return '0';

    if (isPercentage) {
        return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;
    }

    const absValue = Math.abs(value);
    if (absValue >= 1000000) {
        return `${(value / 1000000).toFixed(2)}M`;
    }
    if (absValue >= 1000) {
        return `${(value / 1000).toFixed(2)}K`;
    }
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

/**
 * Parse and evaluate a formula with column references
 * Supports: +, -, *, /, (, ), and column names in {curly braces}
 * Example: "{clicks} / {impressions} * 100"
 * 
 * @param {string} formula - Formula string with {column_name} references
 * @param {Object} row - Raw data row with column names as keys
 * @param {Object} columnMapping - Optional mapping for field->column lookups (not typically needed for raw data)
 * @returns {number|null} - Calculated result or null if evaluation fails
 */
export const evaluateFormula = (formula, row, columnMapping = {}) => {
    if (!formula || typeof formula !== 'string') return null;

    try {
        // Replace column references with actual values
        let expression = formula;
        const columnRefs = formula.match(/\{([^}]+)\}/g) || [];

        for (const ref of columnRefs) {
            const columnName = ref.slice(1, -1).trim(); // Remove { and }

            // Try to find the value in the row directly first (most common case)
            let value = null;

            // 1. Direct column name lookup (handles spaces and special chars)
            if (row.hasOwnProperty(columnName)) {
                value = parseFloat(row[columnName]);
            }
            // 2. Try case-insensitive match
            else {
                const lowerColumnName = columnName.toLowerCase();
                for (const key of Object.keys(row)) {
                    if (key.toLowerCase() === lowerColumnName) {
                        value = parseFloat(row[key]);
                        break;
                    }
                }
            }
            // 3. Try through columnMapping (for field names like 'attributableSales')
            if (value === null && columnMapping) {
                for (const [field, config] of Object.entries(columnMapping)) {
                    if (config?.column === columnName || config?.label === columnName || field === columnName) {
                        const actualColumn = config?.column || columnName;
                        if (row.hasOwnProperty(actualColumn)) {
                            value = parseFloat(row[actualColumn]);
                        }
                        break;
                    }
                }
            }

            if (value === null || isNaN(value)) {
                return null; // Can't evaluate if any value is missing or NaN
            }

            // Replace ALL occurrences of this reference
            expression = expression.split(ref).join(value.toString());
        }

        // Safely evaluate the mathematical expression
        // Only allow numbers, operators, parentheses, decimal points, and whitespace
        if (!/^[\d\s+\-*/().]+$/.test(expression)) {
            console.warn('Formula contains invalid characters:', expression);
            return null;
        }

        // Use Function constructor for safe math evaluation
        const result = Function(`"use strict"; return (${expression})`)();
        return typeof result === 'number' && !isNaN(result) && isFinite(result) ? result : null;
    } catch (err) {
        console.warn('Formula evaluation error:', err.message, 'Formula:', formula);
        return null;
    }
};

/**
 * ColumnMapper Component
 * Modal for mapping Excel columns to required app fields
 * Supports dynamic field addition, formulas, and custom metrics
 */
const ColumnMapper = ({
    isOpen,
    onClose,
    columns = [],
    columnTypes = {},
    suggestedMappings = {},
    onConfirm
}) => {
    const [mappings, setMappings] = useState({});
    const [customFields, setCustomFields] = useState([]);
    const [newFieldName, setNewFieldName] = useState('');
    const [newFieldFormula, setNewFieldFormula] = useState('');
    const [showFormulaHelp, setShowFormulaHelp] = useState(false);

    // Base required fields
    const baseFields = useMemo(() => ({
        date: { label: 'Date/Time', required: true, hint: 'Required for time-series' },
    }), []);

    // Default metric fields that can be mapped (removed Ad Spend)
    const defaultMetricFields = useMemo(() => ({
        attributableSales: { label: 'Attributable Sales', required: false },
        ctr: { label: 'Click Through Rate (CTR)', required: false, isPercentage: true },
        impressions: { label: 'Impressions', required: false },
        clicks: { label: 'Clicks', required: false },
    }), []);

    useEffect(() => {
        if (isOpen && suggestedMappings) {
            setMappings(suggestedMappings);
        }
    }, [isOpen, suggestedMappings]);

    const handleMappingChange = (field, columnName) => {
        setMappings(prev => ({
            ...prev,
            [field]: columnName ? {
                column: columnName,
                label: prev[field]?.label || columnName,
                isPercentage: prev[field]?.isPercentage || false,
                color: prev[field]?.color || CHART_COLORS[Object.keys(prev).length % CHART_COLORS.length],
                formula: prev[field]?.formula,
            } : undefined,
        }));
    };

    const handleLabelChange = (field, label) => {
        setMappings(prev => ({
            ...prev,
            [field]: prev[field] ? { ...prev[field], label } : undefined,
        }));
    };

    const handlePercentageToggle = (field) => {
        setMappings(prev => ({
            ...prev,
            [field]: prev[field] ? {
                ...prev[field],
                isPercentage: !prev[field].isPercentage
            } : undefined,
        }));
    };

    const handleColorChange = (field, color) => {
        setMappings(prev => ({
            ...prev,
            [field]: prev[field] ? { ...prev[field], color } : undefined,
        }));
    };

    const handleFormulaChange = (field, formula) => {
        setMappings(prev => ({
            ...prev,
            [field]: prev[field] ? { ...prev[field], formula } : undefined,
        }));
    };

    const handleAddCustomField = (withFormula = false) => {
        if (newFieldName.trim()) {
            const fieldKey = `custom_${newFieldName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
            const formula = withFormula && newFieldFormula.trim() ? newFieldFormula.trim() : undefined;

            setCustomFields(prev => [...prev, {
                key: fieldKey,
                label: newFieldName.trim(),
                hasFormula: !!formula,
            }]);

            // If formula is provided, set up the mapping with formula
            if (formula) {
                setMappings(prev => ({
                    ...prev,
                    [fieldKey]: {
                        column: '__formula__',
                        label: newFieldName.trim(),
                        formula: formula,
                        isPercentage: false,
                        color: CHART_COLORS[Object.keys(prev).length % CHART_COLORS.length],
                    }
                }));
            }

            setNewFieldName('');
            setNewFieldFormula('');
        }
    };

    const handleRemoveCustomField = (fieldKey) => {
        setCustomFields(prev => prev.filter(f => f.key !== fieldKey));
        setMappings(prev => {
            const newMappings = { ...prev };
            delete newMappings[fieldKey];
            return newMappings;
        });
    };

    const handleConfirm = () => {
        onConfirm?.(mappings);
        onClose?.();
    };

    // Combine all fields
    const allFields = useMemo(() => {
        const combined = { ...baseFields, ...defaultMetricFields };
        customFields.forEach(f => {
            combined[f.key] = {
                label: f.label,
                required: false,
                isCustom: true,
                hasFormula: f.hasFormula,
            };
        });
        return combined;
    }, [baseFields, defaultMetricFields, customFields]);

    const isValid = !!mappings.date?.column;

    const getTypeIcon = (type) => {
        switch (type) {
            case 'date': return '📅';
            case 'number': return '🔢';
            case 'percentage': return '%';
            case 'currency': return '💰';
            default: return '📝';
        }
    };

    const getMappingValue = (field) => {
        const mapping = mappings[field];
        if (!mapping) return '';
        if (mapping.formula && mapping.column === '__formula__') return '__formula__';
        return typeof mapping === 'string' ? mapping : mapping.column || '';
    };

    const getMappingLabel = (field) => {
        const mapping = mappings[field];
        if (!mapping) return '';
        return typeof mapping === 'string' ? mapping : mapping.label || mapping.column || '';
    };

    const getMappingColor = (field) => {
        const mapping = mappings[field];
        if (!mapping || typeof mapping === 'string') {
            return CHART_COLORS[Object.keys(mappings).indexOf(field) % CHART_COLORS.length];
        }
        return mapping.color || CHART_COLORS[0];
    };

    const getMappingFormula = (field) => {
        const mapping = mappings[field];
        if (!mapping || typeof mapping === 'string') return '';
        return mapping.formula || '';
    };

    const isPercentage = (field) => {
        const mapping = mappings[field];
        if (!mapping || typeof mapping === 'string') return false;
        return mapping.isPercentage || false;
    };

    const hasFormula = (field) => {
        const mapping = mappings[field];
        return mapping?.formula && mapping?.column === '__formula__';
    };

    if (!isOpen) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Map Your Columns</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Help us understand your data by mapping columns to fields
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors"
                        >
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[55vh]">
                    <div className="space-y-4">
                        {Object.entries(allFields).map(([field, { label, required, hint, isCustom, hasFormula: fieldHasFormula }]) => (
                            <div key={field} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                <div className="w-1/4 pt-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        {label}
                                        {required && <span className="text-red-500 ml-1">*</span>}
                                        {fieldHasFormula && (
                                            <span className="ml-2 px-1.5 py-0.5 text-xs bg-violet-100 text-violet-700 rounded">ƒx</span>
                                        )}
                                        {isCustom && (
                                            <button
                                                onClick={() => handleRemoveCustomField(field)}
                                                className="ml-2 text-red-400 hover:text-red-600"
                                            >
                                                <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )}
                                    </label>
                                    {hint && <span className="text-xs text-gray-400">{hint}</span>}
                                </div>

                                <div className="flex-1 space-y-2">
                                    {/* Column Select or Formula Display */}
                                    {hasFormula(field) ? (
                                        <div className="w-full px-4 py-2.5 rounded-xl border border-violet-300 bg-violet-50">
                                            <div className="flex items-center gap-2">
                                                <span className="text-violet-600 font-mono text-sm">ƒx</span>
                                                <input
                                                    type="text"
                                                    value={getMappingFormula(field)}
                                                    onChange={(e) => handleFormulaChange(field, e.target.value)}
                                                    className="flex-1 bg-transparent text-sm font-mono text-violet-800 focus:outline-none"
                                                    placeholder="e.g., {clicks} / {impressions} * 100"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <select
                                            value={getMappingValue(field)}
                                            onChange={(e) => handleMappingChange(field, e.target.value)}
                                            className={`w-full px-4 py-2.5 rounded-xl border transition-colors duration-200 ${getMappingValue(field)
                                                ? 'border-primary-300 bg-white'
                                                : 'border-gray-200 bg-white'
                                                } focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                                        >
                                            <option value="">-- Select column --</option>
                                            {columns.map(col => (
                                                <option key={col} value={col}>
                                                    {getTypeIcon(columnTypes[col])} {col}
                                                </option>
                                            ))}
                                        </select>
                                    )}

                                    {/* Additional options when column is selected or has formula */}
                                    {(getMappingValue(field) || hasFormula(field)) && field !== 'date' && (
                                        <div className="flex items-center gap-3 mt-2">
                                            {/* Display Label */}
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    placeholder="Display label"
                                                    value={getMappingLabel(field)}
                                                    onChange={(e) => handleLabelChange(field, e.target.value)}
                                                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                />
                                            </div>

                                            {/* Percentage Toggle */}
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={isPercentage(field)}
                                                    onChange={() => handlePercentageToggle(field)}
                                                    className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
                                                />
                                                <span className="text-sm text-gray-600">%</span>
                                            </label>

                                            {/* Color Picker */}
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="color"
                                                    value={getMappingColor(field)}
                                                    onChange={(e) => handleColorChange(field, e.target.value)}
                                                    className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {(getMappingValue(field) || hasFormula(field)) && (
                                    <button
                                        onClick={() => handleMappingChange(field, '')}
                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors mt-1"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        ))}

                        {/* Add Custom Field */}
                        <div className="p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary-300 transition-colors space-y-3">
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    placeholder="Field name..."
                                    value={newFieldName}
                                    onChange={(e) => setNewFieldName(e.target.value)}
                                    className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                                <button
                                    onClick={() => handleAddCustomField(false)}
                                    disabled={!newFieldName.trim()}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${newFieldName.trim()
                                        ? 'bg-primary-500 text-white hover:bg-primary-600'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    Add Field
                                </button>
                            </div>

                            {/* Formula Input */}
                            <div className="flex items-center gap-3">
                                <div className="flex-1 flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-gray-50">
                                    <span className="text-violet-600 font-mono text-sm">ƒx</span>
                                    <input
                                        type="text"
                                        placeholder="Optional formula: {column1} / {column2} * 100"
                                        value={newFieldFormula}
                                        onChange={(e) => setNewFieldFormula(e.target.value)}
                                        className="flex-1 bg-transparent text-sm focus:outline-none"
                                    />
                                    <button
                                        onClick={() => setShowFormulaHelp(!showFormulaHelp)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </button>
                                </div>
                                <button
                                    onClick={() => handleAddCustomField(true)}
                                    disabled={!newFieldName.trim() || !newFieldFormula.trim()}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${newFieldName.trim() && newFieldFormula.trim()
                                        ? 'bg-violet-500 text-white hover:bg-violet-600'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    Add Formula
                                </button>
                            </div>

                            {/* Formula Help */}
                            {showFormulaHelp && (
                                <div className="p-3 bg-violet-50 rounded-lg text-sm text-violet-700">
                                    <p className="font-medium mb-2">📝 Formula Syntax - Use EXACT column names from your data:</p>
                                    <div className="space-y-2 text-xs">
                                        <div className="p-2 bg-violet-100 rounded">
                                            <p className="font-semibold">Format:</p>
                                            <code className="block mt-1">{'{exact_column_name}'} operator {'{exact_column_name}'}</code>
                                        </div>
                                        <div className="p-2 bg-white rounded border border-violet-200">
                                            <p className="font-semibold">Your columns:</p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {columns.slice(0, 8).map(col => (
                                                    <code key={col} className="px-1 bg-violet-100 rounded text-violet-800">{`{${col}}`}</code>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="p-2 bg-white rounded border border-violet-200">
                                            <p className="font-semibold">Examples with your data:</p>
                                            {columns.length >= 2 && (
                                                <code className="block mt-1 text-violet-800">
                                                    {`{${columns[1]}} / {${columns[2] || columns[1]}} * 100`}
                                                </code>
                                            )}
                                        </div>
                                        <p className="text-violet-600">Operators: <code className="bg-violet-100 px-1 rounded">+ - * / ( )</code></p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Detected Columns Preview */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm font-medium text-gray-600 mb-3">
                            Detected Columns ({columns.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {columns.map(col => {
                                const isMapped = Object.values(mappings).some(m =>
                                    (typeof m === 'string' ? m : m?.column) === col
                                );
                                return (
                                    <span
                                        key={col}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg ${isMapped
                                            ? 'bg-primary-100 text-primary-700'
                                            : 'bg-white text-gray-600 border border-gray-200'
                                            }`}
                                    >
                                        {getTypeIcon(columnTypes[col])} {col}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        {isValid
                            ? '✓ Ready to visualize'
                            : '⚠️ Please map at least the Date column'}
                    </p>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!isValid}
                            className={`btn-primary ${!isValid ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Apply Mapping
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ColumnMapper;
