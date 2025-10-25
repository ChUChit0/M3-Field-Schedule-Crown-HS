// Excel Import and Processing Utilities
import { excelDateToString } from './dateUtils.js';

/**
 * Process Excel file and extract data
 * @param {File} file - Excel file
 * @returns {Promise<{data: Array, headers: Array}>} - Parsed Excel data and headers
 */
export const processExcelFile = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });

                if (jsonData.length === 0) {
                    reject(new Error('Excel file is empty'));
                    return;
                }

                const headers = jsonData[0];
                const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== ''));

                resolve({ data: rows, headers });
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
};

/**
 * Map Excel row to activity object using column mapping
 * @param {Array} row - Excel row data
 * @param {Object} columnMapping - Mapping of field keys to column indices
 * @returns {Object} - Activity object
 */
export const mapRowToActivity = (row, columnMapping) => {
    const activity = {
        area: 'A' // Default area
    };

    Object.keys(columnMapping).forEach(fieldKey => {
        const colIndex = columnMapping[fieldKey];
        let value = row[colIndex];

        // Skip empty/undefined values
        if (value === '' || value === null || value === undefined) {
            return;
        }

        // Convert dates (start, finish, actual_start, actual_finish)
        if (['start', 'finish', 'actual_start', 'actual_finish'].includes(fieldKey)) {
            value = excelDateToString(value);
            // If conversion failed, skip this field
            if (!value) return;
        }

        activity[fieldKey] = value;
    });

    return activity;
};

/**
 * Apply keyword filters to activities
 * @param {Array} activities - Array of activities
 * @param {Object} filterConfig - Filter configuration {field: string, keywords: Array}
 * @returns {Array} - Filtered activities
 */
export const applyKeywordFilters = (activities, filterConfig) => {
    if (!filterConfig.keywords || filterConfig.keywords.length === 0) {
        return activities;
    }

    return activities.filter(activity => {
        const fieldValue = String(activity[filterConfig.field] || '').toLowerCase();
        return filterConfig.keywords.some(keyword =>
            fieldValue.includes(keyword.toLowerCase())
        );
    });
};

/**
 * Validate activity has required fields
 * @param {Object} activity - Activity object
 * @returns {boolean} - True if valid
 */
export const isValidActivity = (activity) => {
    // Only require ID and Name - dates are optional
    return activity.id && activity.name;
};
