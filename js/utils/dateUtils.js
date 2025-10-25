// Date Utility Functions

/**
 * Parse date string in MM/DD/YY format to Date object
 * @param {string} dateStr - Date string in MM/DD/YY format
 * @returns {Date|null} - Date object or null if invalid
 */
window.formatDate = (dateStr) => {
    if (!dateStr) return null;
    const [month, day, year] = dateStr.split('/');
    const fullYear = year.length === 2 ? '20' + year : year;
    return new Date(fullYear, parseInt(month) - 1, parseInt(day));
};

/**
 * Convert Date object to MM/DD/YY string
 * @param {Date} date - Date object
 * @returns {string} - Date string in MM/DD/YY format
 */
window.dateToString = (date) => {
    if (!date) return '';
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${month}/${day}/${year}`;
};

/**
 * Convert Excel serial date number to MM/DD/YY string
 * Excel stores dates as days since 1900-01-01
 * @param {number|string} serial - Excel serial date number
 * @returns {string} - Date string in MM/DD/YY format
 */
const excelDateToString = (serial) => {
    if (!serial || serial === '') return '';

    // If it's already a string date, return it
    if (typeof serial === 'string' && serial.includes('/')) return serial;

    // Convert Excel serial number to date
    if (typeof serial === 'number') {
        const utc_days = Math.floor(serial - 25569);
        const utc_value = utc_days * 86400;
        const date_info = new Date(utc_value * 1000);

        const month = String(date_info.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date_info.getUTCDate()).padStart(2, '0');
        const year = String(date_info.getUTCFullYear()).slice(-2);

        return `${month}/${day}/${year}`;
    }

    return '';
};

/**
 * Get today's date with time set to midnight
 * @returns {Date} - Today's date at 00:00:00
 */
const getToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
};
