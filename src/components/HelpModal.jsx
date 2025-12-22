import { useState } from 'react';

/**
 * HelpModal Component
 * Interactive documentation and features guide modal
 */
const HelpModal = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('getting-started');

    const tabs = [
        { id: 'getting-started', label: 'Getting Started', icon: '🚀' },
        { id: 'features', label: 'Features', icon: '✨' },
        { id: 'column-mapping', label: 'Column Mapping', icon: '🔗' },
        { id: 'formulas', label: 'Formulas', icon: 'ƒx' },
        { id: 'charts', label: 'Charts', icon: '📊' },
        { id: 'tips', label: 'Tips & Tricks', icon: '💡' },
    ];

    if (!isOpen) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-primary-500 to-royal-500">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Help & Documentation</h2>
                                <p className="text-sm text-white/80">Learn how to use Report Visualizer</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors"
                        >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="flex h-[calc(85vh-80px)]">
                    {/* Sidebar */}
                    <div className="w-48 border-r border-gray-100 p-3 space-y-1 bg-gray-50">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full px-3 py-2 rounded-lg text-left text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === tab.id
                                        ? 'bg-primary-100 text-primary-700'
                                        : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                <span>{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        {activeTab === 'getting-started' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-900">Getting Started</h3>

                                <div className="space-y-4">
                                    <div className="flex gap-4 p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl">
                                        <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold">1</div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">Upload Your Data</h4>
                                            <p className="text-sm text-gray-600 mt-1">Drag and drop an Excel (.xlsx, .xls) or CSV file onto the upload zone. We support files with date columns and numeric metrics.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 p-4 bg-gradient-to-r from-royal-50 to-royal-100 rounded-xl">
                                        <div className="w-8 h-8 rounded-full bg-royal-500 text-white flex items-center justify-center font-bold">2</div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">Map Your Columns</h4>
                                            <p className="text-sm text-gray-600 mt-1">We'll auto-detect columns, but you can customize mappings. Set display labels, colors, and mark metrics as percentages.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 p-4 bg-gradient-to-r from-violet-50 to-violet-100 rounded-xl">
                                        <div className="w-8 h-8 rounded-full bg-violet-500 text-white flex items-center justify-center font-bold">3</div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">Visualize & Analyze</h4>
                                            <p className="text-sm text-gray-600 mt-1">Explore your data with interactive charts. Switch between Daily/Monthly/Quarterly views and add custom charts.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                    <div className="flex gap-3">
                                        <span className="text-amber-500">💡</span>
                                        <div>
                                            <h4 className="font-semibold text-amber-800">Pro Tip</h4>
                                            <p className="text-sm text-amber-700 mt-1">Your data stays in your browser - nothing is uploaded to any server!</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'features' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-900">Features Overview</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 border border-gray-200 rounded-xl">
                                        <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center mb-3">
                                            <span className="text-xl">📤</span>
                                        </div>
                                        <h4 className="font-semibold text-gray-900">Drag & Drop Upload</h4>
                                        <p className="text-sm text-gray-500 mt-1">Excel (.xlsx, .xls) and CSV files</p>
                                    </div>

                                    <div className="p-4 border border-gray-200 rounded-xl">
                                        <div className="w-10 h-10 rounded-lg bg-royal-100 flex items-center justify-center mb-3">
                                            <span className="text-xl">🔍</span>
                                        </div>
                                        <h4 className="font-semibold text-gray-900">Auto-Detection</h4>
                                        <p className="text-sm text-gray-500 mt-1">Intelligent column type recognition</p>
                                    </div>

                                    <div className="p-4 border border-gray-200 rounded-xl">
                                        <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center mb-3">
                                            <span className="text-xl">📅</span>
                                        </div>
                                        <h4 className="font-semibold text-gray-900">Time Aggregation</h4>
                                        <p className="text-sm text-gray-500 mt-1">Daily, Monthly, Quarterly views</p>
                                    </div>

                                    <div className="p-4 border border-gray-200 rounded-xl">
                                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center mb-3">
                                            <span className="text-xl">📊</span>
                                        </div>
                                        <h4 className="font-semibold text-gray-900">Custom Charts</h4>
                                        <p className="text-sm text-gray-500 mt-1">Line, Area, Bar with multi-select</p>
                                    </div>

                                    <div className="p-4 border border-gray-200 rounded-xl">
                                        <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center mb-3">
                                            <span className="text-xl">🔢</span>
                                        </div>
                                        <h4 className="font-semibold text-gray-900">Formula Fields</h4>
                                        <p className="text-sm text-gray-500 mt-1">Create calculated metrics</p>
                                    </div>

                                    <div className="p-4 border border-gray-200 rounded-xl">
                                        <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center mb-3">
                                            <span className="text-xl">🔍</span>
                                        </div>
                                        <h4 className="font-semibold text-gray-900">Zoom & Fullscreen</h4>
                                        <p className="text-sm text-gray-500 mt-1">Perfect for screenshots</p>
                                    </div>
                                </div>

                                <div className="p-4 border border-gray-200 rounded-xl">
                                    <h4 className="font-semibold text-gray-900 mb-2">Additional Features</h4>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        <li>✅ Editable chart titles (click to edit)</li>
                                        <li>✅ Custom colors per metric</li>
                                        <li>✅ Percentage formatting toggle</li>
                                        <li>✅ K/M number formatting (1.5M, 250K)</li>
                                        <li>✅ Multi-metric overlay on charts</li>
                                        <li>✅ Legend click to toggle visibility</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {activeTab === 'column-mapping' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-900">Column Mapping</h3>

                                <p className="text-gray-600">After uploading your file, Map Your Columns to help the system understand your data structure.</p>

                                <div className="space-y-4">
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <h4 className="font-semibold text-gray-900 mb-3">Default Fields</h4>
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-gray-200">
                                                    <th className="text-left py-2 text-gray-500 font-medium">Field</th>
                                                    <th className="text-left py-2 text-gray-500 font-medium">Description</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-gray-600">
                                                <tr className="border-b border-gray-100">
                                                    <td className="py-2 font-medium">Date/Time *</td>
                                                    <td className="py-2">Required. Your date column for time-series.</td>
                                                </tr>
                                                <tr className="border-b border-gray-100">
                                                    <td className="py-2 font-medium">Attributable Sales</td>
                                                    <td className="py-2">Primary sales metric (shown in Chart 1)</td>
                                                </tr>
                                                <tr className="border-b border-gray-100">
                                                    <td className="py-2 font-medium">CTR</td>
                                                    <td className="py-2">Click Through Rate (shown in Chart 2)</td>
                                                </tr>
                                                <tr className="border-b border-gray-100">
                                                    <td className="py-2 font-medium">Impressions</td>
                                                    <td className="py-2">View/impression counts</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-2 font-medium">Clicks</td>
                                                    <td className="py-2">Click counts</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="p-4 border border-gray-200 rounded-xl">
                                        <h4 className="font-semibold text-gray-900 mb-2">Field Options</h4>
                                        <ul className="text-sm text-gray-600 space-y-2">
                                            <li><strong>Display Label:</strong> Custom name shown in charts</li>
                                            <li><strong>% Toggle:</strong> Mark as percentage (appends % symbol)</li>
                                            <li><strong>Color Picker:</strong> Choose chart line/area color</li>
                                        </ul>
                                    </div>

                                    <div className="p-4 bg-primary-50 border border-primary-200 rounded-xl">
                                        <h4 className="font-semibold text-primary-800 mb-2">Adding Custom Fields</h4>
                                        <p className="text-sm text-primary-700">Use the "Add Field" button to create additional metrics from your data columns.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'formulas' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-900">Formula Fields</h3>

                                <p className="text-gray-600">Create calculated fields using formulas that reference your data columns.</p>

                                <div className="p-4 bg-violet-50 border border-violet-200 rounded-xl">
                                    <h4 className="font-semibold text-violet-800 mb-3">Formula Syntax</h4>
                                    <div className="bg-white rounded-lg p-3 font-mono text-sm text-violet-700">
                                        {'{column_name}'} operator {'{column_name}'}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-900">Supported Operators</h4>
                                    <div className="flex gap-2">
                                        {['+', '-', '*', '/', '(', ')'].map(op => (
                                            <span key={op} className="px-3 py-1 bg-gray-100 rounded-lg font-mono text-gray-700">{op}</span>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <h4 className="font-semibold text-gray-900 mb-3">Examples</h4>
                                    <div className="space-y-2 font-mono text-sm">
                                        <div className="p-2 bg-white rounded border border-gray-200">
                                            <span className="text-violet-600">{'{clicks}'} / {'{impressions}'} * 100</span>
                                            <span className="text-gray-400 ml-2">// CTR</span>
                                        </div>
                                        <div className="p-2 bg-white rounded border border-gray-200">
                                            <span className="text-violet-600">{'{revenue}'} / {'{orders}'}</span>
                                            <span className="text-gray-400 ml-2">// AOV</span>
                                        </div>
                                        <div className="p-2 bg-white rounded border border-gray-200">
                                            <span className="text-violet-600">{'{sales}'} - {'{spend}'}</span>
                                            <span className="text-gray-400 ml-2">// Profit</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                    <div className="flex gap-3">
                                        <span className="text-amber-500">⚠️</span>
                                        <div>
                                            <h4 className="font-semibold text-amber-800">Important</h4>
                                            <p className="text-sm text-amber-700 mt-1">Use <strong>exact column names</strong> from your data. Click the ℹ️ icon in the formula input to see available columns.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'charts' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-900">Charts Guide</h3>

                                <div className="space-y-4">
                                    <div className="p-4 border border-gray-200 rounded-xl">
                                        <h4 className="font-semibold text-gray-900 mb-2">Default Charts</h4>
                                        <ul className="text-sm text-gray-600 space-y-2">
                                            <li><strong>Attributable Sales Velocity:</strong> Area chart showing sales over time</li>
                                            <li><strong>Engagement:</strong> Line chart showing CTR and engagement metrics</li>
                                        </ul>
                                    </div>

                                    <div className="p-4 bg-primary-50 border border-primary-200 rounded-xl">
                                        <h4 className="font-semibold text-primary-800 mb-2">Creating Custom Charts</h4>
                                        <ol className="text-sm text-primary-700 space-y-1 list-decimal list-inside">
                                            <li>Click the "+ Add Chart" button</li>
                                            <li>Enter a chart title</li>
                                            <li>Select chart type (Line, Area, or Bar)</li>
                                            <li>Choose Y-axis fields (multi-select supported)</li>
                                            <li>Customize colors and percentage settings</li>
                                            <li>Click "Create Chart"</li>
                                        </ol>
                                    </div>

                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <h4 className="font-semibold text-gray-900 mb-2">Chart Controls</h4>
                                        <ul className="text-sm text-gray-600 space-y-2">
                                            <li><strong>✏️ Title:</strong> Click to edit chart title</li>
                                            <li><strong>🔍 Zoom:</strong> 100%, 125%, 150%, 200%, or Fullscreen</li>
                                            <li><strong>+ Metrics:</strong> Add/remove overlay metrics</li>
                                            <li><strong>Daily/Monthly/Quarterly:</strong> Change time aggregation</li>
                                            <li><strong>Legend:</strong> Click to toggle metric visibility</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'tips' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-900">Tips & Tricks</h3>

                                <div className="space-y-4">
                                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                                        <h4 className="font-semibold text-green-800 flex items-center gap-2">
                                            <span>📸</span> Taking Screenshots
                                        </h4>
                                        <p className="text-sm text-green-700 mt-1">Use the zoom feature (🔍) to enlarge charts before taking screenshots. Fullscreen mode works great for presentations!</p>
                                    </div>

                                    <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl">
                                        <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                                            <span>🎨</span> Color Coordination
                                        </h4>
                                        <p className="text-sm text-blue-700 mt-1">Set consistent colors for the same metrics across different charts using the color picker in Column Mapping.</p>
                                    </div>

                                    <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl">
                                        <h4 className="font-semibold text-purple-800 flex items-center gap-2">
                                            <span>📊</span> Comparing Metrics
                                        </h4>
                                        <p className="text-sm text-purple-700 mt-1">Use "+ Metrics" to overlay multiple metrics on the same chart for easy comparison.</p>
                                    </div>

                                    <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl">
                                        <h4 className="font-semibold text-orange-800 flex items-center gap-2">
                                            <span>📅</span> Date Formats
                                        </h4>
                                        <p className="text-sm text-orange-700 mt-1">We support most date formats including Excel serial dates. If dates aren't recognized, try formatting as YYYY-MM-DD in your source file.</p>
                                    </div>

                                    <div className="p-4 bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-xl">
                                        <h4 className="font-semibold text-pink-800 flex items-center gap-2">
                                            <span>🔄</span> Re-mapping Columns
                                        </h4>
                                        <p className="text-sm text-pink-700 mt-1">Click the ⚙️ icon in the Mappings card to re-open Column Mapping and adjust your field configurations.</p>
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-900 rounded-xl">
                                    <h4 className="font-semibold text-white flex items-center gap-2">
                                        <span>⌨️</span> Keyboard Shortcuts
                                    </h4>
                                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                                        <div className="flex items-center gap-2 text-gray-300">
                                            <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">Esc</kbd>
                                            <span>Close modals</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-300">
                                            <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">Enter</kbd>
                                            <span>Save edited title</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HelpModal;
