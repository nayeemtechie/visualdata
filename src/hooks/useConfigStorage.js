/**
 * useConfigStorage Hook
 * Manages named chart configurations in localStorage
 */

const STORAGE_KEY = 'rv_configs';

/**
 * Get all saved configurations from localStorage
 */
const getAllConfigs = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (error) {
        console.error('Error reading configs from localStorage:', error);
        return {};
    }
};

/**
 * Save all configurations to localStorage
 */
const setAllConfigs = (configs) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
        return true;
    } catch (error) {
        console.error('Error saving configs to localStorage:', error);
        return false;
    }
};

/**
 * Custom hook for managing named chart configurations
 * @returns {Object} Configuration management functions
 */
export const useConfigStorage = () => {
    /**
     * Get list of all saved configuration names with metadata
     * @returns {Array<{name: string, savedAt: string}>}
     */
    const getSavedConfigs = () => {
        const configs = getAllConfigs();
        return Object.values(configs)
            .map(({ name, savedAt }) => ({ name, savedAt }))
            .sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
    };

    /**
     * Save current state as a named configuration
     * @param {string} name - Configuration name
     * @param {Object} mappings - Column mappings
     * @param {Array} charts - Custom charts array
     * @returns {boolean} Success status
     */
    const saveConfig = (name, mappings, charts) => {
        if (!name || typeof name !== 'string') {
            console.error('Invalid config name');
            return false;
        }

        const configs = getAllConfigs();
        configs[name] = {
            name,
            savedAt: new Date().toISOString(),
            mappings,
            charts,
        };

        return setAllConfigs(configs);
    };

    /**
     * Load a saved configuration by name
     * @param {string} name - Configuration name
     * @returns {Object|null} Configuration data or null if not found
     */
    const loadConfig = (name) => {
        const configs = getAllConfigs();
        const config = configs[name];

        if (!config) {
            console.error(`Config "${name}" not found`);
            return null;
        }

        return {
            mappings: config.mappings,
            charts: config.charts,
        };
    };

    /**
     * Delete a saved configuration
     * @param {string} name - Configuration name
     * @returns {boolean} Success status
     */
    const deleteConfig = (name) => {
        const configs = getAllConfigs();

        if (!configs[name]) {
            console.error(`Config "${name}" not found`);
            return false;
        }

        delete configs[name];
        return setAllConfigs(configs);
    };

    /**
     * Rename a saved configuration
     * @param {string} oldName - Current name
     * @param {string} newName - New name
     * @returns {boolean} Success status
     */
    const renameConfig = (oldName, newName) => {
        if (!newName || typeof newName !== 'string') {
            console.error('Invalid new config name');
            return false;
        }

        const configs = getAllConfigs();

        if (!configs[oldName]) {
            console.error(`Config "${oldName}" not found`);
            return false;
        }

        if (configs[newName] && oldName !== newName) {
            console.error(`Config "${newName}" already exists`);
            return false;
        }

        const config = configs[oldName];
        delete configs[oldName];
        configs[newName] = {
            ...config,
            name: newName,
            savedAt: new Date().toISOString(),
        };

        return setAllConfigs(configs);
    };

    /**
     * Check if a config name already exists
     * @param {string} name - Configuration name
     * @returns {boolean}
     */
    const configExists = (name) => {
        const configs = getAllConfigs();
        return !!configs[name];
    };

    return {
        getSavedConfigs,
        saveConfig,
        loadConfig,
        deleteConfig,
        renameConfig,
        configExists,
    };
};

export default useConfigStorage;
