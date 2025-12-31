import { useState, useRef, useEffect } from 'react';
import { GRANULARITY } from '../hooks/useDataAggregator';

/**
 * Zoom level options
 */
const ZOOM_LEVELS = [
    { value: 1, label: '100%' },
    { value: 1.25, label: '125%' },
    { value: 1.5, label: '150%' },
    { value: 2, label: '200%' },
];

/**
 * ChartCard Component
 * Reusable card wrapper with granularity toggle, metric selectors, zoom, and editable titles
 */
const ChartCard = ({
    title: initialTitle,
    subtitle: initialSubtitle,
    granularity,
    onGranularityChange,
    availableMetrics = [],
    selectedMetrics = [],
    onMetricsChange,
    metricTotal,
    onTitleChange,
    onDelete,
    showDelete = false,
    children
}) => {
    const [showMetricSelector, setShowMetricSelector] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState(initialTitle);
    const [editedSubtitle, setEditedSubtitle] = useState(initialSubtitle || '');
    const [zoomLevel, setZoomLevel] = useState(1);
    const [showZoomMenu, setShowZoomMenu] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showMetricTotal, setShowMetricTotal] = useState(true);
    const chartRef = useRef(null);

    // Handle ESC key to exit fullscreen
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
                setZoomLevel(1);
            }
        };

        if (isFullscreen) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isFullscreen]);

    const granularityOptions = [
        { value: GRANULARITY.DAILY, label: 'Daily' },
        { value: GRANULARITY.MONTHLY, label: 'Monthly' },
        { value: GRANULARITY.QUARTERLY, label: 'Quarterly' },
    ];

    const handleMetricToggle = (metric) => {
        const isSelected = selectedMetrics.some(m => m.field === metric.field);
        if (isSelected) {
            if (selectedMetrics.length > 1) {
                onMetricsChange?.(selectedMetrics.filter(m => m.field !== metric.field));
            }
        } else {
            onMetricsChange?.([...selectedMetrics, metric]);
        }
    };

    const handlePercentageToggle = (metric, e) => {
        e.stopPropagation();
        const updatedMetrics = selectedMetrics.map(m =>
            m.field === metric.field ? { ...m, isPercentage: !m.isPercentage } : m
        );
        onMetricsChange?.(updatedMetrics);
    };

    const handleTitleSave = () => {
        setIsEditingTitle(false);
        onTitleChange?.({ title: editedTitle, subtitle: editedSubtitle });
    };

    const handleTitleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleTitleSave();
        } else if (e.key === 'Escape') {
            setEditedTitle(initialTitle);
            setEditedSubtitle(initialSubtitle || '');
            setIsEditingTitle(false);
        }
    };

    const toggleFullscreen = () => {
        if (!isFullscreen) {
            setIsFullscreen(true);
            setZoomLevel(1.5);
        } else {
            setIsFullscreen(false);
            setZoomLevel(1);
        }
    };

    const displayTitle = editedTitle || initialTitle;
    const displaySubtitle = editedSubtitle || initialSubtitle;

    const cardClasses = isFullscreen
        ? 'fixed inset-4 z-50 bg-white rounded-2xl shadow-2xl p-6 overflow-auto'
        : 'card p-6';

    return (
        <>
            {/* Fullscreen backdrop */}
            {isFullscreen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={toggleFullscreen}
                />
            )}

            <div className={cardClasses} ref={chartRef}>
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                        {isEditingTitle ? (
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={editedTitle}
                                    onChange={(e) => setEditedTitle(e.target.value)}
                                    onKeyDown={handleTitleKeyDown}
                                    onBlur={handleTitleSave}
                                    className="text-lg font-bold text-gray-900 bg-transparent border-b-2 border-primary-500 focus:outline-none w-full"
                                    autoFocus
                                />
                            </div>
                        ) : (
                            <div
                                className="cursor-pointer group"
                                onClick={() => setIsEditingTitle(true)}
                                title="Click to edit title"
                            >
                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors flex items-center gap-2">
                                    {displayTitle}
                                    <svg className="w-4 h-4 text-gray-300 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </h3>
                            </div>
                        )}
                        {metricTotal !== undefined && (
                            showMetricTotal ? (
                                <div className="group flex items-center gap-2 mt-2">
                                    <p className="text-2xl font-bold text-primary-600">
                                        {typeof metricTotal === 'number'
                                            ? metricTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })
                                            : metricTotal
                                        }
                                    </p>
                                    <button
                                        onClick={() => setShowMetricTotal(false)}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-all"
                                        title="Hide value"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowMetricTotal(true)}
                                    className="mt-2 text-xs text-gray-400 hover:text-primary-500 flex items-center gap-1 transition-colors"
                                    title="Show value"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    Show value
                                </button>
                            )
                        )}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2">
                        {/* Zoom Control */}
                        <div className="relative">
                            <button
                                onClick={() => setShowZoomMenu(!showZoomMenu)}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Zoom for screenshot"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                </svg>
                            </button>

                            {showZoomMenu && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowZoomMenu(false)}
                                    />
                                    <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-2 min-w-[120px] z-20">
                                        <p className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase">Zoom</p>
                                        {ZOOM_LEVELS.map(level => (
                                            <button
                                                key={level.value}
                                                onClick={() => {
                                                    setZoomLevel(level.value);
                                                    setShowZoomMenu(false);
                                                }}
                                                className={`w-full px-4 py-2 text-sm text-left transition-colors ${zoomLevel === level.value
                                                    ? 'bg-primary-50 text-primary-700'
                                                    : 'hover:bg-gray-50 text-gray-700'
                                                    }`}
                                            >
                                                {level.label}
                                            </button>
                                        ))}
                                        <hr className="my-2 border-gray-100" />
                                        <button
                                            onClick={() => {
                                                toggleFullscreen();
                                                setShowZoomMenu(false);
                                            }}
                                            className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                            </svg>
                                            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Metric Selector */}
                        {availableMetrics.length > 0 && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowMetricSelector(!showMetricSelector)}
                                    className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Metrics
                                </button>

                                {showMetricSelector && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setShowMetricSelector(false)}
                                        />
                                        <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-2 min-w-[250px] z-20 max-h-80 overflow-y-auto">
                                            <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                                Overlay Metrics
                                            </p>
                                            {availableMetrics.map(metric => {
                                                const isSelected = selectedMetrics.some(m => m.field === metric.field);
                                                const selectedMetric = selectedMetrics.find(m => m.field === metric.field);
                                                return (
                                                    <div
                                                        key={metric.field}
                                                        className={`w-full px-4 py-2 text-sm flex items-center gap-3 transition-colors ${isSelected
                                                            ? 'bg-primary-50 text-primary-700'
                                                            : 'hover:bg-gray-50 text-gray-700'
                                                            }`}
                                                    >
                                                        <button
                                                            onClick={() => handleMetricToggle(metric)}
                                                            className="flex items-center gap-3 flex-1 text-left"
                                                        >
                                                            <div
                                                                className="w-3 h-3 rounded-sm border-2 flex-shrink-0"
                                                                style={{
                                                                    backgroundColor: isSelected ? metric.color : 'transparent',
                                                                    borderColor: metric.color
                                                                }}
                                                            />
                                                            <span className="flex-1">{metric.label}</span>
                                                        </button>
                                                        {isSelected && (
                                                            <label
                                                                className="flex items-center gap-1 cursor-pointer px-2 py-1 rounded bg-white border border-gray-200 hover:border-primary-300 transition-colors"
                                                                title="Toggle percentage format"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedMetric?.isPercentage || false}
                                                                    onChange={(e) => handlePercentageToggle(metric, e)}
                                                                    className="w-3 h-3 text-primary-500 rounded"
                                                                />
                                                                <span className="text-xs font-medium text-gray-600">%</span>
                                                            </label>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Granularity Toggle */}
                        <div className="flex items-center bg-gray-100 rounded-lg p-1">
                            {granularityOptions.map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => onGranularityChange?.(option.value)}
                                    className={`toggle-btn ${granularity === option.value
                                        ? 'toggle-btn-active'
                                        : 'toggle-btn-inactive'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>

                        {/* Delete Button */}
                        {showDelete && (
                            <button
                                onClick={onDelete}
                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete chart"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Chart Content with Zoom */}
                <div
                    className="transition-all duration-300 origin-top-left"
                    style={{
                        height: `${320 * zoomLevel}px`,
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: 'top left',
                        width: `${100 / zoomLevel}%`
                    }}
                >
                    <div className="h-80 w-full">
                        {children}
                    </div>
                </div>
            </div>
        </>
    );
};

export default ChartCard;
