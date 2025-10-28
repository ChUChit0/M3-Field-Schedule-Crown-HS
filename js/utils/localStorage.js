/**
 * LocalStorage Utilities
 *
 * Functions for saving and loading data from browser's LocalStorage.
 * All project data is stored locally per user/browser.
 *
 * Schema:
 * - 'crownScheduleData': { updates, currentUpdateId, lastSaved, dataVersion }
 * - 'projectName': Custom project name
 * - 'customAreaConfig': User-customized area codes
 * - 'customIdPatternConfig': User-customized floor/zone codes
 *
 * Data Versioning System:
 * - v1.0: Initial schema (original implementation)
 * - v1.1: Added dataVersion field for migration support
 * - Future versions: Will auto-migrate using migrateData()
 */

// Current data version
const CURRENT_DATA_VERSION = '1.1';

/**
 * Save main schedule data to LocalStorage
 */
function saveToLocalStorage(updates, currentUpdateId) {
    try {
        const dataToSave = {
            updates,
            currentUpdateId,
            lastSaved: new Date().toISOString(),
            dataVersion: CURRENT_DATA_VERSION
        };
        localStorage.setItem('crownScheduleData', JSON.stringify(dataToSave));
        console.log('💾 Data saved to LocalStorage (version ' + CURRENT_DATA_VERSION + ')');
        return true;
    } catch (error) {
        console.error('Error saving to LocalStorage:', error);
        return false;
    }
}

/**
 * Migrate data from old versions to current version
 *
 * This function ensures backward compatibility when updating the app.
 * Users' existing data is preserved and new fields are added with defaults.
 *
 * @param {Object} data - Raw data from LocalStorage
 * @returns {Object} - Migrated data with current schema
 */
function migrateData(data) {
    const version = data.dataVersion || '1.0'; // Default to v1.0 if no version

    console.log('🔄 Migrating data from version ' + version + ' to ' + CURRENT_DATA_VERSION);

    // Migration v1.0 → v1.1
    if (version === '1.0' || !data.dataVersion) {
        console.log('  ✅ Adding dataVersion field');
        data.dataVersion = CURRENT_DATA_VERSION;

        // Ensure all updates have the correct structure
        if (data.updates && Array.isArray(data.updates)) {
            data.updates = data.updates.map(update => ({
                id: update.id,
                name: update.name,
                activities: update.activities || [],
                loaded: update.loaded !== undefined ? update.loaded : false,
                savedFilters: update.savedFilters || null
            }));
        }

        console.log('  ✅ Migration v1.0 → v1.1 complete');
    }

    // Future migrations would go here
    // Example: if (version === '1.1') { /* migrate to v1.2 */ }

    // Auto-save migrated data
    localStorage.setItem('crownScheduleData', JSON.stringify(data));
    console.log('✅ Data migration complete and saved');

    return data;
}

/**
 * Load main schedule data from LocalStorage with automatic migration
 */
function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('crownScheduleData');
        if (saved) {
            let data = JSON.parse(saved);

            // Auto-migrate if needed
            const currentVersion = data.dataVersion || '1.0';
            if (currentVersion !== CURRENT_DATA_VERSION) {
                console.log('⚠️  Old data version detected (' + currentVersion + '). Auto-migrating...');
                data = migrateData(data);
            } else {
                console.log('📂 Data loaded from LocalStorage (version ' + CURRENT_DATA_VERSION + ')');
            }

            return data;
        }
        return null;
    } catch (error) {
        console.error('Error loading from LocalStorage:', error);
        return null;
    }
}

/**
 * Export data as JSON file for backup
 */
function exportBackup(updates, currentUpdateId) {
    try {
        const dataToExport = {
            updates,
            currentUpdateId,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `crown-schedule-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error('Error exporting backup:', error);
        return false;
    }
}

/**
 * Import data from JSON backup file
 */
function importBackup(file, onSuccess, onError) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);

            if (!imported.updates || !Array.isArray(imported.updates)) {
                throw new Error('Invalid backup file format');
            }

            if (onSuccess) {
                onSuccess(imported);
            }
        } catch (error) {
            console.error('Error importing backup:', error);
            if (onError) {
                onError(error);
            }
        }
    };
    reader.readAsText(file);
}

/**
 * Clear all schedule data from LocalStorage
 */
function clearLocalStorage() {
    try {
        localStorage.removeItem('crownScheduleData');
        console.log('🗑️ LocalStorage cleared');
        return true;
    } catch (error) {
        console.error('Error clearing LocalStorage:', error);
        return false;
    }
}
