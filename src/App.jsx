import { useState, useCallback } from 'react';
import DropZone from './components/DropZone';
import ColumnMapper from './components/ColumnMapper';
import SalesVelocityChart from './components/SalesVelocityChart';
import EngagementChart from './components/EngagementChart';
import CustomChart from './components/CustomChart';
import HelpModal from './components/HelpModal';
import { useFileParser } from './hooks/useFileParser';

/**
 * Report Visualizer App
 * Interactive Report Builder for eCommerce Personalization
 */
function App() {
    const [showMapper, setShowMapper] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [confirmedMappings, setConfirmedMappings] = useState(null);
    const [customCharts, setCustomCharts] = useState([]);

    const {
        parseFile,
        reset,
        isLoading,
        error,
        parsedData,
        columns,
        columnTypes,
        suggestedMappings,
        needsMapping,
    } = useFileParser();

    const handleFileSelect = useCallback(async (file) => {
        try {
            const result = await parseFile(file);

            // Convert suggested mappings to new format and show mapper for confirmation
            const formattedMappings = {};
            Object.entries(result.suggestedMappings).forEach(([field, column]) => {
                if (field === 'date') {
                    formattedMappings[field] = { column, label: column };
                } else {
                    formattedMappings[field] = {
                        column,
                        label: column,
                        isPercentage: field === 'ctr',
                        color: undefined
                    };
                }
            });
            setConfirmedMappings(formattedMappings);
            setShowMapper(true);
        } catch (err) {
            console.error('File parsing error:', err);
        }
    }, [parseFile]);

    const handleMappingConfirm = useCallback((mappings) => {
        setConfirmedMappings(mappings);
        setShowMapper(false);
    }, []);

    const handleReset = useCallback(() => {
        reset();
        setConfirmedMappings(null);
        setShowMapper(false);
        setCustomCharts([]);
    }, [reset]);

    const handleAddChart = useCallback(() => {
        const newChart = {
            id: `chart-${Date.now()}`,
            config: {},
        };
        setCustomCharts(prev => [...prev, newChart]);
    }, []);

    const handleDeleteChart = useCallback((chartId) => {
        setCustomCharts(prev => prev.filter(c => c.id !== chartId));
    }, []);

    const handleChartConfigChange = useCallback((chartId, config) => {
        setCustomCharts(prev => prev.map(c =>
            c.id === chartId ? { ...c, config: { ...c.config, ...config } } : c
        ));
    }, []);

    const hasData = parsedData && parsedData.length > 0 && confirmedMappings;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {/* Algonomy Logo */}
                            <img
                                src="/images/algonomy-min.png"
                                alt="Algonomy"
                                className="h-8 w-auto"
                            />
                            <div className="border-l border-gray-200 pl-3 ml-1">
                                <h1 className="text-xl font-bold text-gray-900">Report Visualizer</h1>
                                <p className="text-xs text-gray-500">Interactive Report Builder</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            {/* Help Button - Always Visible */}
                            <button
                                onClick={() => setShowHelp(true)}
                                className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                title="Help & Documentation"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </button>

                            {hasData && (
                                <>
                                    <span className="text-sm text-gray-500">
                                        {parsedData.length.toLocaleString()} rows loaded
                                    </span>
                                    <button
                                        onClick={handleAddChart}
                                        className="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Add Chart
                                    </button>
                                    <button
                                        onClick={handleReset}
                                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Upload New File
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <h3 className="font-semibold text-red-800">Error parsing file</h3>
                                <p className="text-sm text-red-600 mt-1">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {!hasData ? (
                    /* Upload State */
                    <div className="max-w-2xl mx-auto">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-3">
                                Upload Your Data
                            </h2>
                            <p className="text-gray-500 text-lg">
                                Drag and drop an Excel or CSV file to instantly visualize your eCommerce performance
                            </p>
                            {/* Help hint */}
                            <button
                                onClick={() => setShowHelp(true)}
                                className="mt-4 inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Need help? View documentation
                            </button>
                        </div>

                        <DropZone onFileSelect={handleFileSelect} isLoading={isLoading} />

                        {/* Features Preview */}
                        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary-100 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">Auto-Detection</h3>
                                <p className="text-sm text-gray-500">Automatically detects columns and suggests mappings</p>
                            </div>
                            <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-royal-100 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-royal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">Time Aggregation</h3>
                                <p className="text-sm text-gray-500">Daily, Monthly, and Quarterly views</p>
                            </div>
                            <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-violet-100 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">Custom Charts</h3>
                                <p className="text-sm text-gray-500">Create unlimited charts with custom axes</p>
                            </div>
                        </div>

                        {/* More Features Row */}
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-orange-100 flex items-center justify-center">
                                    <span className="text-2xl">ƒx</span>
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">Formula Fields</h3>
                                <p className="text-sm text-gray-500">Create calculated metrics with formulas</p>
                            </div>
                            <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-pink-100 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">Zoom & Fullscreen</h3>
                                <p className="text-sm text-gray-500">Perfect for screenshots and presentations</p>
                            </div>
                            <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-cyan-100 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">Custom Colors</h3>
                                <p className="text-sm text-gray-500">Personalize chart colors for each metric</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Dashboard State */
                    <div className="space-y-6">
                        {/* Stats Bar */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="card p-4">
                                <p className="text-sm text-gray-500 mb-1">Data Points</p>
                                <p className="text-2xl font-bold text-gray-900">{parsedData.length.toLocaleString()}</p>
                            </div>
                            <div className="card p-4">
                                <p className="text-sm text-gray-500 mb-1">Columns</p>
                                <p className="text-2xl font-bold text-gray-900">{columns.length}</p>
                            </div>
                            <div className="card p-4">
                                <p className="text-sm text-gray-500 mb-1">Charts</p>
                                <p className="text-2xl font-bold text-gray-900">{2 + customCharts.length}</p>
                            </div>
                            <div className="card p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Mappings</p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {Object.keys(confirmedMappings).filter(k => confirmedMappings[k]?.column).length} fields
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowMapper(true)}
                                    className="p-2 text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                                    title="Edit Column Mappings"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Default Charts Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <SalesVelocityChart
                                data={parsedData}
                                columnMapping={confirmedMappings}
                            />
                            <EngagementChart
                                data={parsedData}
                                columnMapping={confirmedMappings}
                            />
                        </div>

                        {/* Custom Charts */}
                        {customCharts.length > 0 && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {customCharts.map(chart => (
                                    <CustomChart
                                        key={chart.id}
                                        id={chart.id}
                                        data={parsedData}
                                        columnMapping={confirmedMappings}
                                        columns={columns}
                                        initialConfig={chart.config}
                                        onDelete={handleDeleteChart}
                                        onConfigChange={handleChartConfigChange}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Add Chart Button */}
                        <button
                            onClick={handleAddChart}
                            className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 hover:text-primary-600 hover:border-primary-400 transition-colors flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add New Chart
                        </button>
                    </div>
                )}
            </main>

            {/* Column Mapper Modal */}
            <ColumnMapper
                isOpen={showMapper}
                onClose={() => setShowMapper(false)}
                columns={columns}
                columnTypes={columnTypes}
                suggestedMappings={confirmedMappings || suggestedMappings}
                onConfirm={handleMappingConfirm}
            />

            {/* Help Modal */}
            <HelpModal
                isOpen={showHelp}
                onClose={() => setShowHelp(false)}
            />

            {/* Footer */}
            <footer className="mt-16 py-8 border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-400">
                    <p>Report Visualizer • Executive-Ready Visualizations • Powered by Algonomy</p>
                    <p className="mt-2">
                        Developed by{' '}
                        <a
                            href="https://www.linkedin.com/in/nayeemuddinm/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-500 hover:text-primary-600 hover:underline transition-colors"
                        >
                            Nayeemuddin Mohammed
                        </a>
                    </p>
                </div>
            </footer>
        </div>
    );
}

export default App;
