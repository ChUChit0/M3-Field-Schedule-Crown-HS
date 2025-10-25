/**
 * LocalStorage Utilities
 *
 * Functions for saving and loading data from browser's LocalStorage.
 * All project data is stored locally per user/browser.
 *
 * Schema:
 * - 'crownScheduleData': { updates, currentUpdateId, lastSaved }
 * - 'projectName': Custom project name
 * - 'customAreaConfig': User-customized area codes
 * - 'customIdPatternConfig': User-customized floor/zone codes
 */

/**
 * Save main schedule data to LocalStorage
 */
function saveToLocalStorage(updates, currentUpdateId) {
    try {
        const dataToSave = {
            updates,
            currentUpdateId,
            lastSaved: new Date().toISOString()
        };
        localStorage.setItem('crownScheduleData', JSON.stringify(dataToSave));
        console.log('💾 Data saved to LocalStorage');
        return true;
    } catch (error) {
        console.error('Error saving to LocalStorage:', error);
        return false;
    }
}

/**
 * Load main schedule data from LocalStorage
 */
function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('crownScheduleData');
        if (saved) {
            const data = JSON.parse(saved);
            console.log('📂 Data loaded from LocalStorage');
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
