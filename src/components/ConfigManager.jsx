import { useState, useEffect, useRef } from 'react';
import { useConfigStorage } from '../hooks/useConfigStorage';

/**
 * ConfigManager Component
 * UI for saving, loading, and managing named configurations
 */
const ConfigManager = ({
    currentMappings,
    currentCharts,
    onLoadConfig,
    hasData = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [configName, setConfigName] = useState('');
    const [savedConfigs, setSavedConfigs] = useState([]);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const dropdownRef = useRef(null);

    // Use refs to always access the latest props (avoids stale closure issue)
    const mappingsRef = useRef(currentMappings);
    const chartsRef = useRef(currentCharts);

    // Keep refs in sync with props
    useEffect(() => {
        mappingsRef.current = currentMappings;
    }, [currentMappings]);

    useEffect(() => {
        chartsRef.current = currentCharts;
    }, [currentCharts]);

    const {
        getSavedConfigs,
        saveConfig,
        loadConfig,
        deleteConfig,
        configExists
    } = useConfigStorage();

    // Refresh saved configs list
    const refreshConfigs = () => {
        setSavedConfigs(getSavedConfigs());
    };

    useEffect(() => {
        refreshConfigs();
    }, []);

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

    // Clear messages after delay
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const handleSave = () => {
        if (!configName.trim()) {
            setError('Please enter a name for your configuration');
            return;
        }

        const name = configName.trim();

        if (configExists(name)) {
            if (!window.confirm(`A configuration named "${name}" already exists. Overwrite it?`)) {
                return;
            }
        }

        const success = saveConfig(name, mappingsRef.current, chartsRef.current);

        if (success) {
            setSuccessMessage(`Saved "${name}" successfully!`);
            setShowSaveModal(false);
            setConfigName('');
            refreshConfigs();
        } else {
            setError('Failed to save configuration');
        }
    };

    const handleLoad = (name) => {
        const config = loadConfig(name);
        if (config) {
            onLoadConfig(config.mappings, config.charts);
            setSuccessMessage(`Loaded "${name}"`);
            setIsOpen(false);
        } else {
            setError(`Failed to load "${name}"`);
        }
    };

    const handleDelete = (name, e) => {
        e.stopPropagation();
        if (window.confirm(`Delete configuration "${name}"?`)) {
            const success = deleteConfig(name);
            if (success) {
                setSuccessMessage(`Deleted "${name}"`);
                refreshConfigs();
            } else {
                setError(`Failed to delete "${name}"`);
            }
        }
    };

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Success/Error Messages */}
            {successMessage && (
                <div className="absolute -bottom-12 right-0 px-3 py-1.5 bg-green-100 text-green-700 text-sm rounded-lg whitespace-nowrap z-50">
                    {successMessage}
                </div>
            )}
            {error && (
                <div className="absolute -bottom-12 right-0 px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded-lg whitespace-nowrap z-50">
                    {error}
                </div>
            )}

            {/* Config Button */}
            <div className="flex items-center gap-2">
                {/* Save Button - only show when data exists */}
                {hasData && (
                    <button
                        onClick={() => setShowSaveModal(true)}
                        className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex items-center gap-1.5"
                        title="Save current configuration"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        Save
                    </button>
                )}

                {/* Load Dropdown */}
                <button
                    onClick={() => {
                        refreshConfigs();
                        setIsOpen(!isOpen);
                    }}
                    className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex items-center gap-1.5"
                    title="Load saved configuration"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Load
                    <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-700">Saved Configurations</h3>
                    </div>

                    {savedConfigs.length === 0 ? (
                        <div className="px-4 py-6 text-center text-gray-500 text-sm">
                            <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            No saved configurations yet
                        </div>
                    ) : (
                        <ul className="max-h-64 overflow-y-auto">
                            {savedConfigs.map((config) => (
                                <li key={config.name}>
                                    <button
                                        onClick={() => handleLoad(config.name)}
                                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors group"
                                    >
                                        <div className="text-left">
                                            <p className="text-sm font-medium text-gray-800 group-hover:text-primary-600">
                                                {config.name}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {formatDate(config.savedAt)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => handleDelete(config.name, e)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                            title="Delete configuration"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {/* Save Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Save Configuration</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Save your current chart setup to load later
                            </p>
                        </div>

                        <div className="p-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Configuration Name
                            </label>
                            <input
                                type="text"
                                value={configName}
                                onChange={(e) => setConfigName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                                placeholder="e.g., Sales Report Q4"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                autoFocus
                            />

                            {savedConfigs.length > 0 && (
                                <p className="text-xs text-gray-400 mt-2">
                                    {savedConfigs.length} configuration{savedConfigs.length !== 1 ? 's' : ''} saved
                                </p>
                            )}
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowSaveModal(false);
                                    setConfigName('');
                                    setError('');
                                }}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors"
                            >
                                Save Configuration
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConfigManager;
