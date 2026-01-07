import { useState, useRef, useEffect } from 'react';
import { format, subDays, subMonths, startOfQuarter, startOfYear, isValid } from 'date-fns';

/**
 * Quick preset options for date ranges
 */
const PRESETS = [
    { label: 'Last 7 days', getValue: () => ({ start: subDays(new Date(), 7), end: new Date() }) },
    { label: 'Last 30 days', getValue: () => ({ start: subDays(new Date(), 30), end: new Date() }) },
    { label: 'Last 90 days', getValue: () => ({ start: subDays(new Date(), 90), end: new Date() }) },
    { label: 'Last Quarter', getValue: () => ({ start: subMonths(new Date(), 3), end: new Date() }) },
    { label: 'Year to Date', getValue: () => ({ start: startOfYear(new Date()), end: new Date() }) },
];

/**
 * DateRangeFilter Component
 * Global date range picker with quick presets
 */
const DateRangeFilter = ({
    startDate,
    endDate,
    onChange,
    minDate,
    maxDate,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handlePresetClick = (preset) => {
        const { start, end } = preset.getValue();
        onChange({ startDate: start, endDate: end });
        setIsOpen(false);
    };

    const handleStartChange = (e) => {
        const date = new Date(e.target.value);
        if (isValid(date)) {
            onChange({ startDate: date, endDate });
        }
    };

    const handleEndChange = (e) => {
        const date = new Date(e.target.value);
        if (isValid(date)) {
            onChange({ startDate, endDate: date });
        }
    };

    const handleClear = () => {
        onChange({ startDate: null, endDate: null });
        setIsOpen(false);
    };

    const formatDateForInput = (date) => {
        if (!date || !isValid(date)) return '';
        return format(date, 'yyyy-MM-dd');
    };

    const formatDateForDisplay = (date) => {
        if (!date || !isValid(date)) return '';
        return format(date, 'MMM d, yyyy');
    };

    const hasFilter = startDate || endDate;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Filter Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${hasFilter
                        ? 'bg-primary-50 border-primary-200 text-primary-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>

                {hasFilter ? (
                    <span className="font-medium">
                        {formatDateForDisplay(startDate) || 'Start'} → {formatDateForDisplay(endDate) || 'End'}
                    </span>
                ) : (
                    <span>Date Range</span>
                )}

                <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>

                {hasFilter && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleClear();
                        }}
                        className="ml-1 p-0.5 hover:bg-primary-100 rounded"
                        title="Clear filter"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                    {/* Quick Presets */}
                    <div className="p-3 border-b border-gray-100">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Quick Select</p>
                        <div className="flex flex-wrap gap-1.5">
                            {PRESETS.map((preset) => (
                                <button
                                    key={preset.label}
                                    onClick={() => handlePresetClick(preset)}
                                    className="px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-primary-100 hover:text-primary-700 rounded-md transition-colors"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Date Range */}
                    <div className="p-3">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Custom Range</p>
                        <div className="flex items-center gap-2">
                            <div className="flex-1">
                                <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    value={formatDateForInput(startDate)}
                                    onChange={handleStartChange}
                                    max={formatDateForInput(endDate) || formatDateForInput(maxDate)}
                                    min={formatDateForInput(minDate)}
                                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                />
                            </div>
                            <span className="text-gray-400 mt-5">→</span>
                            <div className="flex-1">
                                <label className="block text-xs text-gray-500 mb-1">End Date</label>
                                <input
                                    type="date"
                                    value={formatDateForInput(endDate)}
                                    onChange={handleEndChange}
                                    min={formatDateForInput(startDate) || formatDateForInput(minDate)}
                                    max={formatDateForInput(maxDate)}
                                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                        <button
                            onClick={handleClear}
                            className="text-xs text-gray-500 hover:text-gray-700"
                        >
                            Clear filter
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="px-3 py-1 text-xs font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-md transition-colors"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DateRangeFilter;
