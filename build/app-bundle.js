/**
 * Crown HS Schedule Calendar - Complete Bundle
 * Auto-generated from modular source files
 */
const { useState, useEffect, useMemo, useRef } = React;



// ========== CONFIG ==========
// Area Configuration
window.areaConfig = {
    "E": { name: "Area E", color: "#475569" },
    "D": { name: "Area D", color: "#64748b" },
    "C": { name: "Area C", color: "#94a3b8" },
    "B": { name: "Area B", color: "#64748b" },
    "A": { name: "Area A", color: "#475569" },
    "F": { name: "Area F", color: "#94a3b8" }
};

// Field definitions for Excel mapping
window.FIELD_DEFINITIONS = [
    { key: 'id', label: 'Activity ID', required: true },
    { key: 'name', label: 'Activity Name', required: true },
    { key: 'contractor', label: 'Contractor / Sub', required: false, keywords: ['contractor', 'sub', 'subcontractor', 'sub contractor', 'subs'] },
    { key: 'original_duration', label: 'Original Duration', required: false },
    { key: 'start', label: 'Start Date', required: true },
    { key: 'finish', label: 'Finish Date', required: true },
    { key: 'actual_start', label: 'Actual Start', required: false },
    { key: 'actual_finish', label: 'Actual Finish', required: false },
    { key: 'rem_duration', label: 'New Rem Duration', required: false },
    { key: 'comments', label: 'Comments', required: false },
    { key: 'area', label: 'Area', required: false }
];

// ID Pattern Configuration for parsing activity IDs
const ID_PATTERN_CONFIG = {
    floors: {
        'LL': 'Lower Level',
        'ML': 'Mezzanine Level',
        '01': '1st Floor',
        '02': '2nd Floor',
        '03': '3rd Floor',
        '04': '4th Floor',
        '05': '5th Floor',
        'RF': 'Roof'
    },
    zones: {
        'INT': 'Interior',
        'K': 'Kitchen',
        'BAT': 'Bathroom',
        'COR': 'Corridor',
        'LBY': 'Lobby',
        'OFF': 'Office',
        'MEC': 'Mechanical',
        'ELE': 'Electrical',
        'EXT': 'Exterior'
    }
};

// Parse Activity ID to extract Area, Floor, Zone
window.parseActivityID = (activityID) => {
    if (!activityID) return { area: null, floor: null, zone: null, number: null };

    // Pattern: AREA-FLOOR-ZONE-NUMBER (e.g., D-LL-INT-1230 or C-01-K-1190)
    const parts = activityID.split('-');

    if (parts.length >= 2) {
        const area = parts[0].trim(); // First part is Area (A, B, C, D, E, F) - trim spaces
        const floor = parts.length >= 3 ? parts[1].trim() : null; // Second part is Floor (LL, 01, 02, etc.)
        const zone = parts.length >= 4 ? parts[2].trim() : null; // Third part is Zone (INT, K, BAT, etc.)
        const number = parts.length >= 4 ? parts[3].trim() : (parts.length >= 3 ? parts[2].trim() : parts[1].trim()); // Last part is number

        return {
            area: area,
            floor: floor ? (ID_PATTERN_CONFIG.floors[floor] || floor) : null,
            zone: zone ? (ID_PATTERN_CONFIG.zones[zone] || zone) : null,
            number: number,
            rawFloor: floor,
            rawZone: zone
        };
    }

    return { area: null, floor: null, zone: null, number: null };
};

// ========== UTILITIES ==========
// Date Utility Functions

/**
 * Parse date string in MM/DD/YY format to Date object
 * @param {string} dateStr - Date string in MM/DD/YY format
 * @returns {Date|null} - Date object or null if invalid
 */
window.formatDate = (dateStr) => {
    if (!dateStr) return null;

    // Clean any trailing letters (e.g., "07/09/24 A" → "07/09/24")
    const cleanedDate = String(dateStr).replace(/\s*[A-Za-z]+\s*$/g, '').trim();

    const [month, day, year] = cleanedDate.split('/');
    if (!month || !day || !year) return null;

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

    // If it's already a string date, clean and return it
    if (typeof serial === 'string' && serial.includes('/')) {
        // Remove any letters at the end (e.g., "07/09/24 A" → "07/09/24")
        // This handles Excel dates with trailing "A" or other letters
        return serial.replace(/\s*[A-Za-z]+\s*$/g, '').trim();
    }

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

// Excel Import and Processing Utilities

/**
 * Process Excel file and extract data
 * @param {File} file - Excel file
 * @returns {Promise<{data: Array, headers: Array}>} - Parsed Excel data and headers
 */
const processExcelFile = (file) => {
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
const mapRowToActivity = (row, columnMapping) => {
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
const applyKeywordFilters = (activities, filterConfig) => {
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
const isValidActivity = (activity) => {
    // Only require ID and Name - dates are optional
    return activity.id && activity.name;
};

// Intelligent Duplicate Detection System
// For Construction Project Management

/**
 * Compare two activities to determine if they're duplicates
 * Uses fuzzy matching on 4 critical fields: id, name, start, finish
 *
 * @param {Object} activity1 - First activity
 * @param {Object} activity2 - Second activity
 * @returns {Object} - {isDuplicate: boolean, matchScore: number, differences: Array}
 */
const compareActivities = (activity1, activity2) => {
    const fields = ['id', 'name', 'start', 'finish'];
    let matches = 0;
    const differences = [];

    fields.forEach(field => {
        const val1 = String(activity1[field] || '').trim().toLowerCase();
        const val2 = String(activity2[field] || '').trim().toLowerCase();

        if (val1 === val2) {
            matches++;
        } else {
            differences.push({
                field,
                oldValue: activity1[field],
                newValue: activity2[field]
            });
        }
    });

    const matchScore = matches / fields.length; // 0.0 to 1.0

    // If 3 or 4 out of 4 critical fields match, it's likely a duplicate/update
    const isDuplicate = matches >= 3;

    return {
        isDuplicate,
        matchScore,
        matches,
        differences
    };
};

/**
 * Analyze import data for duplicates against existing activities
 *
 * @param {Array} importActivities - Activities to be imported
 * @param {Array} existingActivities - Activities already in the update
 * @returns {Object} - Analysis results with statistics and recommendations
 */
const analyzeImport = (importActivities, existingActivities) => {
    const duplicates = [];
    const newActivities = [];
    const updates = [];

    importActivities.forEach(importAct => {
        let bestMatch = null;
        let bestScore = 0;

        // Find best matching existing activity
        existingActivities.forEach(existingAct => {
            const comparison = compareActivities(importAct, existingAct);
            if (comparison.isDuplicate && comparison.matchScore > bestScore) {
                bestScore = comparison.matchScore;
                bestMatch = {
                    existing: existingAct,
                    comparison
                };
            }
        });

        if (bestMatch) {
            // Check if there are actual differences (potential update)
            if (bestMatch.comparison.differences.length > 0) {
                updates.push({
                    activity: importAct,
                    existing: bestMatch.existing,
                    differences: bestMatch.comparison.differences,
                    matchScore: bestMatch.comparison.matchScore
                });
            } else {
                // Exact duplicate
                duplicates.push({
                    activity: importAct,
                    existing: bestMatch.existing,
                    matchScore: bestMatch.comparison.matchScore
                });
            }
        } else {
            // No match found - it's a new activity
            newActivities.push(importAct);
        }
    });

    // Calculate statistics
    const total = importActivities.length;
    const duplicateCount = duplicates.length;
    const updateCount = updates.length;
    const newCount = newActivities.length;
    const duplicatePercentage = (duplicateCount / total) * 100;
    const updatePercentage = (updateCount / total) * 100;

    // Generate intelligent recommendation
    const recommendation = generateRecommendation({
        total,
        duplicateCount,
        updateCount,
        newCount,
        duplicatePercentage,
        updatePercentage
    });

    return {
        duplicates,
        updates,
        newActivities,
        statistics: {
            total,
            duplicateCount,
            updateCount,
            newCount,
            duplicatePercentage: Math.round(duplicatePercentage),
            updatePercentage: Math.round(updatePercentage)
        },
        recommendation
    };
};

/**
 * Generate intelligent recommendation based on import analysis
 *
 * @param {Object} stats - Import statistics
 * @returns {Object} - Recommendation with type and message
 */
const generateRecommendation = (stats) => {
    const { duplicateCount, updateCount, newCount, duplicatePercentage, updatePercentage } = stats;

    // High percentage of duplicates/updates (>50%) suggests this is a project update
    if ((duplicatePercentage + updatePercentage) > 50) {
        return {
            type: 'CREATE_NEW_UPDATE',
            icon: 'fa-plus-square',
            color: 'blue',
            title: 'Create New Update Version',
            message: `Detected ${duplicateCount + updateCount} activities that already exist (${duplicatePercentage + updatePercentage}% of import). This looks like a project update.`,
            suggestion: 'Recommended: Create a new Update version (e.g., Update 14) to preserve historical data and track changes over time.',
            priority: 'high'
        };
    }

    // Medium updates (20-50%) - give user options
    if (updateCount > 0 && updatePercentage >= 20) {
        return {
            type: 'REPLACE_AND_ADD',
            icon: 'fa-sync-alt',
            color: 'yellow',
            title: 'Updates Detected',
            message: `Found ${updateCount} activities with changes and ${newCount} new activities.`,
            suggestion: 'Consider: Replace existing activities with updated data and add new ones, or create a new Update version.',
            priority: 'medium'
        };
    }

    // Mostly new activities (<20% duplicates)
    if (newCount > duplicateCount + updateCount) {
        return {
            type: 'ADD_NEW_ONLY',
            icon: 'fa-plus-circle',
            color: 'green',
            title: 'Mostly New Activities',
            message: `Found ${newCount} new activities and only ${duplicateCount} duplicates.`,
            suggestion: 'Recommended: Import only new activities and skip duplicates.',
            priority: 'low'
        };
    }

    // Few or no duplicates
    if (duplicateCount === 0) {
        return {
            type: 'IMPORT_ALL',
            icon: 'fa-check-circle',
            color: 'green',
            title: 'No Duplicates Detected',
            message: 'All activities appear to be new.',
            suggestion: 'Safe to import all activities.',
            priority: 'low'
        };
    }

    // Default recommendation
    return {
        type: 'REVIEW_MANUALLY',
        icon: 'fa-eye',
        color: 'gray',
        title: 'Manual Review Recommended',
        message: `Mixed import: ${duplicateCount} duplicates, ${updateCount} updates, ${newCount} new.`,
        suggestion: 'Review the details below and choose the best option for your workflow.',
        priority: 'medium'
    };
};

/**
 * Get next update number
 * @param {Array} updates - Array of existing updates
 * @returns {number} - Next update number
 */
const getNextUpdateNumber = (updates) => {
    const numbers = updates
        .map(u => {
            const match = u.name.match(/\d+/);
            return match ? parseInt(match[0]) : 0;
        })
        .filter(n => n > 0);

    return numbers.length > 0 ? Math.max(...numbers) + 1 : updates.length + 1;
};

/**
 * Comparison Utilities
 *
 * Algorithms for comparing schedule updates and detecting variance.
 *
 * Features:
 * - Activity matching by ID
 * - Date change detection (start, finish, duration)
 * - Variance classification (delayed, advanced, duration changes)
 * - Metrics calculation (averages, totals, percentages)
 * - New/removed activity detection
 */

/**
 * Calculate duration in days (calendar or workdays only)
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {Number} workDaysPerWeek - 5 (Mon-Fri), 6 (Mon-Sat), or 7 (all days)
 * @returns {Number} Duration in days
 */
function calculateDuration(startDate, endDate, workDaysPerWeek = 7) {
    if (!startDate || !endDate) return 0;

    if (workDaysPerWeek === 7) {
        // Calendar days (includes all 7 days)
        return Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
    }

    // Workdays with specific exclusions
    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
        const dayOfWeek = current.getDay();
        // 0 = Sunday, 6 = Saturday

        if (workDaysPerWeek === 5) {
            // Mon-Fri only (exclude Saturday and Sunday)
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                count++;
            }
        } else if (workDaysPerWeek === 6) {
            // Mon-Sat (exclude only Sunday)
            if (dayOfWeek !== 0) {
                count++;
            }
        }

        current.setDate(current.getDate() + 1);
    }

    return count;
}

/**
 * Compare two updates and generate comprehensive variance analysis
 *
 * @param {Object} baselineUpdate - The original/reference update
 * @param {Object} currentUpdate - The revised/current update
 * @param {String} compareType - 'start', 'finish', or 'both'
 * @param {Number} workDaysPerWeek - 5 (Mon-Fri) or 7 (all days including weekends)
 * @returns {Object} Comparison results with metrics and changes
 */
function compareUpdates(baselineUpdate, currentUpdate, compareType = 'both', workDaysPerWeek = 7) {
    if (!baselineUpdate || !currentUpdate) {
        return null;
    }

    // Create maps for quick lookup
    const baselineMap = new Map();
    const currentMap = new Map();

    // Normalize ID: trim spaces and convert to uppercase for comparison
    const normalizeId = (id) => {
        if (!id) return null;
        return String(id).trim().toUpperCase();
    };

    baselineUpdate.activities.forEach(act => {
        if (act.id) {
            const normalizedId = normalizeId(act.id);
            if (normalizedId) baselineMap.set(normalizedId, act);
        }
    });

    currentUpdate.activities.forEach(act => {
        if (act.id) {
            const normalizedId = normalizeId(act.id);
            if (normalizedId) currentMap.set(normalizedId, act);
        }
    });

    // Results arrays
    const changes = [];
    const newActivities = [];
    const removedActivities = [];
    const noChangeActivities = [];

    // Stats
    let delayedCount = 0;
    let advancedCount = 0;
    let durationChangeCount = 0;
    let totalDelayDays = 0;
    let totalAdvanceDays = 0;
    let totalDurationDelta = 0;

    // Process activities in current update
    currentMap.forEach((currentAct, normalizedId) => {
        const baselineAct = baselineMap.get(normalizedId);

        if (!baselineAct) {
            // New activity (not in baseline)
            newActivities.push({
                activity: currentAct,
                type: 'new',
                status: '🔵'
            });
            return;
        }

        // Activity exists in both - compare dates
        // Clean any trailing letters from dates before parsing (e.g., "07/09/24 A" → "07/09/24")
        const cleanDate = (dateStr) => {
            if (!dateStr) return null;
            return String(dateStr).replace(/\s*[A-Za-z]+\s*$/g, '').trim();
        };

        const baselineStart = baselineAct.start ? new Date(cleanDate(baselineAct.start)) : null;
        const baselineFinish = baselineAct.finish ? new Date(cleanDate(baselineAct.finish)) : null;
        const currentStart = currentAct.start ? new Date(cleanDate(currentAct.start)) : null;
        const currentFinish = currentAct.finish ? new Date(cleanDate(currentAct.finish)) : null;

        // Calculate deltas
        let startDelta = 0;
        let finishDelta = 0;
        let durationDelta = 0;
        let baselineDuration = 0;
        let currentDuration = 0;

        if (baselineStart && currentStart) {
            startDelta = Math.round((currentStart - baselineStart) / (1000 * 60 * 60 * 24));
        }

        if (baselineFinish && currentFinish) {
            finishDelta = Math.round((currentFinish - baselineFinish) / (1000 * 60 * 60 * 24));
        }

        // Calculate duration delta (respecting workdays vs calendar days)
        if (baselineStart && baselineFinish && currentStart && currentFinish) {
            baselineDuration = calculateDuration(baselineStart, baselineFinish, workDaysPerWeek);
            currentDuration = calculateDuration(currentStart, currentFinish, workDaysPerWeek);
            durationDelta = currentDuration - baselineDuration;
        }

        // Determine change type based on compareType setting
        let changeType = 'no_change';
        let status = '⚪';
        let description = '';
        let impact = 0;

        if (compareType === 'start' || compareType === 'both') {
            if (startDelta > 0) {
                changeType = 'delayed';
                status = '🔴';
                description = `Start delayed by ${startDelta} days`;
                impact = startDelta;
                delayedCount++;
                totalDelayDays += startDelta;
            } else if (startDelta < 0) {
                changeType = 'advanced';
                status = '🟢';
                description = `Start advanced by ${Math.abs(startDelta)} days`;
                impact = startDelta;
                advancedCount++;
                totalAdvanceDays += Math.abs(startDelta);
            }
        }

        if (compareType === 'finish' || compareType === 'both') {
            if (finishDelta > 0 && changeType === 'no_change') {
                changeType = 'delayed';
                status = '🔴';
                description = `Finish delayed by ${finishDelta} days`;
                impact = finishDelta;
                delayedCount++;
                totalDelayDays += finishDelta;
            } else if (finishDelta < 0 && changeType === 'no_change') {
                changeType = 'advanced';
                status = '🟢';
                description = `Finish advanced by ${Math.abs(finishDelta)} days`;
                impact = finishDelta;
                advancedCount++;
                totalAdvanceDays += Math.abs(finishDelta);
            }
        }

        // Check for duration changes (if comparing both)
        if (compareType === 'both' && durationDelta !== 0 && changeType === 'no_change') {
            changeType = 'duration_change';
            status = '🟡';
            description = `Duration ${durationDelta > 0 ? 'increased' : 'decreased'} by ${Math.abs(durationDelta)} days`;
            impact = durationDelta;
            durationChangeCount++;
            totalDurationDelta += durationDelta;
        }

        // ALWAYS add duration info to description if there's a duration change
        // This is key: even if delayed/advanced, show if duration changed
        if (durationDelta !== 0 && changeType !== 'duration_change') {
            const durationInfo = durationDelta > 0
                ? `Duration +${durationDelta}d (${baselineDuration}d→${currentDuration}d)`
                : `Duration ${durationDelta}d (${baselineDuration}d→${currentDuration}d)`;
            description += `, ${durationInfo}`;

            // Count duration changes separately
            if (changeType !== 'no_change') {
                durationChangeCount++;
                totalDurationDelta += Math.abs(durationDelta);
            }
        } else if (durationDelta === 0 && changeType !== 'no_change') {
            // Dates moved but duration maintained - this is important!
            description += ` ✅ Duration maintained (${baselineDuration}d)`;
        }

        // Create change object
        const changeObj = {
            activity: currentAct,
            baselineActivity: baselineAct,
            type: changeType,
            status,
            description,
            startDelta,
            finishDelta,
            durationDelta,
            baselineDuration,
            currentDuration,
            impact,
            baselineDates: {
                start: baselineAct.start,
                finish: baselineAct.finish
            },
            currentDates: {
                start: currentAct.start,
                finish: currentAct.finish
            }
        };

        if (changeType === 'no_change') {
            noChangeActivities.push(changeObj);
        } else {
            changes.push(changeObj);
        }
    });

    // Find removed activities (in baseline but not in current)
    baselineMap.forEach((baselineAct, normalizedId) => {
        if (!currentMap.has(normalizedId)) {
            removedActivities.push({
                activity: baselineAct,
                type: 'removed',
                status: '⚫'
            });
        }
    });

    // Calculate metrics
    const totalActivities = currentMap.size;
    const totalChanges = changes.length + newActivities.length + removedActivities.length;
    const onTrackCount = noChangeActivities.length;
    const scheduleHealth = totalActivities > 0 ? Math.round((onTrackCount / totalActivities) * 100) : 0;

    const avgDelay = delayedCount > 0 ? (totalDelayDays / delayedCount).toFixed(1) : 0;
    const avgAdvance = advancedCount > 0 ? (totalAdvanceDays / advancedCount).toFixed(1) : 0;
    const avgDurationDelta = durationChangeCount > 0 ? (totalDurationDelta / durationChangeCount).toFixed(1) : 0;

    // Sort changes by impact (most delayed first)
    changes.sort((a, b) => {
        if (a.type === 'delayed' && b.type === 'delayed') return Math.abs(b.impact) - Math.abs(a.impact);
        if (a.type === 'delayed') return -1;
        if (b.type === 'delayed') return 1;
        if (a.type === 'advanced' && b.type === 'advanced') return Math.abs(b.impact) - Math.abs(a.impact);
        if (a.type === 'advanced') return -1;
        if (b.type === 'advanced') return 1;
        return Math.abs(b.impact) - Math.abs(a.impact);
    });

    return {
        baselineUpdate,
        currentUpdate,
        compareType,
        workDaysPerWeek,
        metrics: {
            totalActivities,
            totalChanges,
            delayedCount,
            advancedCount,
            durationChangeCount,
            newActivitiesCount: newActivities.length,
            removedActivitiesCount: removedActivities.length,
            onTrackCount,
            scheduleHealth,
            avgDelay,
            avgAdvance,
            avgDurationDelta,
            totalDelayDays,
            totalAdvanceDays
        },
        changes,
        newActivities,
        removedActivities,
        noChangeActivities,
        allActivities: [...changes, ...newActivities, ...removedActivities, ...noChangeActivities]
    };
}

/**
 * Get color class for change type
 */
function getChangeTypeColor(changeType) {
    const colors = {
        delayed: 'text-red-600 bg-red-50',
        advanced: 'text-green-600 bg-green-50',
        duration_change: 'text-amber-600 bg-amber-50',
        new: 'text-blue-600 bg-blue-50',
        removed: 'text-gray-600 bg-gray-50',
        no_change: 'text-gray-500 bg-gray-50'
    };
    return colors[changeType] || 'text-gray-500 bg-gray-50';
}

/**
 * Get color class for impact badge
 */
function getImpactColor(impact, type) {
    if (type === 'delayed') return 'bg-red-600';
    if (type === 'advanced') return 'bg-green-600';
    if (type === 'duration_change') return 'bg-amber-600';
    if (type === 'new') return 'bg-blue-600';
    if (type === 'removed') return 'bg-gray-600';
    return 'bg-gray-400';
}

/**
 * Format date for display
 */
function formatDateShort(dateString) {
    if (!dateString) return 'N/A';

    // Clean any trailing letters (e.g., "07/09/24 A" → "07/09/24")
    const cleanedDate = String(dateString).replace(/\s*[A-Za-z]+\s*$/g, '').trim();

    const date = new Date(cleanedDate);
    if (isNaN(date.getTime())) return 'Invalid Date';

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Format impact as text
 */
function formatImpact(impact, type) {
    if (type === 'new') return 'New activity';
    if (type === 'removed') return 'Removed';
    if (type === 'no_change') return 'No change';

    const absImpact = Math.abs(impact);
    if (impact > 0) return `+${absImpact} days`;
    if (impact < 0) return `-${absImpact} days`;
    return 'No change';
}

// Export functions
window.compareUpdates = compareUpdates;
window.getChangeTypeColor = getChangeTypeColor;
window.getImpactColor = getImpactColor;
window.formatDateShort = formatDateShort;
window.formatImpact = formatImpact;

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

// ========== COMPONENTS ==========
/**
 * Toast Notification Component
 *
 * Auto-dismissing notification that appears for 3 seconds.
 *
 * @param {Object} props
 * @param {string} props.message - Message to display
 * @param {string} props.type - Type of toast ('success' or 'error')
 * @param {Function} props.onClose - Callback when toast closes
 */


function Toast({ message, type, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`toast ${type}`}>
            <i className={`fas ${type === 'success' ? 'fa-check-circle text-green-600' : 'fa-exclamation-circle text-red-600'} text-xl`}></i>
            <span className="font-medium">{message}</span>
        </div>
    );
}

/**
 * Delete Confirmation Modal Component
 *
 * Confirmation dialog before deleting an update.
 * Shows warning about permanent deletion and activity count.
 *
 * @param {Object} props
 * @param {Object} props.update - Update to delete
 * @param {Function} props.onClose - Callback to close modal
 * @param {Function} props.onConfirm - Callback to confirm deletion
 */

function DeleteConfirmModal({ update, onClose, onConfirm }) {
    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="glass rounded-2xl p-8 max-w-md w-full">
                <h2 className="text-2xl font-bold mb-4 text-red-600">
                    <i className="fas fa-exclamation-triangle mr-3"></i>
                    Delete Update?
                </h2>
                <p className="text-gray-700 mb-2">
                    Are you sure you want to delete <strong>{update.name}</strong>?
                </p>
                <p className="text-gray-600 text-sm mb-6">
                    This will permanently delete {update.activities.length} activities. This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg transition">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition">
                        <i className="fas fa-trash mr-2"></i>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Rename Update Modal Component
 *
 * Simple modal for renaming an update (e.g., "Update 12" → "Week 3 Update").
 *
 * @param {Object} props
 * @param {Object} props.update - Update to rename
 * @param {Function} props.onClose - Callback to close modal
 * @param {Function} props.onRename - Callback to rename update (updateId, newName)
 */


function RenameUpdateModal({ update, onClose, onRename }) {
    const [newName, setNewName] = useState(update.name);

    const handleSubmit = () => {
        if (newName.trim()) {
            onRename(update.id, newName.trim());
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="glass rounded-2xl p-8 max-w-md w-full">
                <h2 className="text-2xl font-bold mb-6">
                    <i className="fas fa-edit mr-3 text-slate-600"></i>
                    Rename Update
                </h2>
                <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-slate-500 focus:outline-none mb-6"
                    placeholder="Update name..."
                    autoFocus
                />
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg transition">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition">
                        <i className="fas fa-save mr-2"></i>
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Settings Modal Component
 *
 * Allows users to configure project settings including:
 * - Project name customization
 * - Version information
 * - Release notes
 *
 * @param {Object} props
 * @param {Function} props.onClose - Callback to close modal
 * @param {string} props.projectName - Current project name
 * @param {Function} props.onSaveProjectName - Callback to save new project name
 */


function SettingsModal({ onClose, projectName, onSaveProjectName }) {
    const APP_VERSION = "1.3.0";
    const [name, setName] = useState(projectName);

    const handleSave = () => {
        if (name.trim()) {
            onSaveProjectName(name.trim());
            onClose();
        } else {
            alert('Project name cannot be empty');
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="glass rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800">
                            <i className="fas fa-cog mr-3 text-gray-600"></i>
                            Settings
                        </h2>
                        <p className="text-sm text-gray-500 mt-1 ml-12">Version {APP_VERSION}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl transition"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Project Name Section */}
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                        <i className="fas fa-project-diagram mr-2 text-blue-600"></i>
                        Project Name
                    </h3>
                    <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-4">
                        <p className="text-sm text-blue-800">
                            <i className="fas fa-info-circle mr-2"></i>
                            This name will appear in the header and will help you identify your project.
                        </p>
                    </div>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                        placeholder="e.g., Crown HS Schedule, Building A Construction, etc."
                    />
                </div>

                {/* Release Notes Section */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">
                        Release Notes
                    </h3>
                    <div className="bg-gray-50 rounded p-4 space-y-4 max-h-64 overflow-y-auto">
                        {/* Version 1.3.0 */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-gray-800">v1.3.0</span>
                                <span className="text-xs text-gray-500">October 2025</span>
                            </div>
                            <ul className="space-y-1 text-sm text-gray-700 ml-4">
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400">•</span>
                                    <span>Multi-select filters with Shift+Click range selection</span>
                                </li>
                            </ul>
                        </div>

                        {/* Version 1.2.0 */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-gray-800">v1.2.0</span>
                                <span className="text-xs text-gray-500">April 2025</span>
                            </div>
                            <ul className="space-y-1 text-sm text-gray-700 ml-4">
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400">•</span>
                                    <span>Collapsible accordion interface for space optimization</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400">•</span>
                                    <span>Mass contractor assignment to filtered activities</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400">•</span>
                                    <span>Real-time activity counter with search functionality</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400">•</span>
                                    <span>Professional styling and UI improvements</span>
                                </li>
                            </ul>
                        </div>

                        {/* Version 1.1.0 */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-gray-800">v1.1.0</span>
                                <span className="text-xs text-gray-500">October 2024</span>
                            </div>
                            <ul className="space-y-1 text-sm text-gray-700 ml-4">
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400">•</span>
                                    <span>Modular architecture with build system</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400">•</span>
                                    <span>Enhanced column mapping and validation</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400">•</span>
                                    <span>Import Wizard preview improvements</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400">•</span>
                                    <span>Performance optimizations and bug fixes</span>
                                </li>
                            </ul>
                        </div>

                        {/* Version 1.0.0 */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-gray-800">v1.0.0</span>
                                <span className="text-xs text-gray-500">September 2022</span>
                            </div>
                            <ul className="space-y-1 text-sm text-gray-700 ml-4">
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400">•</span>
                                    <span>Initial production release</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400">•</span>
                                    <span>Interactive calendar with activity scheduling</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400">•</span>
                                    <span>Excel import/export with column mapping</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400">•</span>
                                    <span>Intelligent duplicate detection</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400">•</span>
                                    <span>Multi-update management and version control</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-6 border-t-2 border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-gray-300 hover:bg-gray-400 rounded-lg transition font-medium"
                    >
                        <i className="fas fa-times mr-2"></i>
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
                    >
                        <i className="fas fa-save mr-2"></i>
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Edit Activity Modal Component
 *
 * Allows editing all fields of an existing activity.
 * Shows warning when activity lacks start/finish dates (Activities Without Dates).
 * Highlights missing required fields.
 *
 * @param {Object} props
 * @param {Object} props.activity - Activity to edit
 * @param {Function} props.onClose - Callback to close modal
 * @param {Function} props.onSave - Callback to save edited activity
 * @param {Object} props.customAreaConfig - Custom area configuration
 * @param {Object} props.customIdPatternConfig - Custom ID pattern config
 */


function EditActivityModal({ activity, onClose, onSave, customAreaConfig, customIdPatternConfig }) {
    const [editedActivity, setEditedActivity] = useState({
        ...activity
    });
    const [applyToAllWithSameName, setApplyToAllWithSameName] = useState(false);

    // Marker state management
    const [marker, setMarker] = useState({
        type: activity.marker?.type || 'none',
        applyTo: activity.marker?.applyTo || 'finish'
    });

    // Calculate date variances and duration
    const calculateVariances = () => {
        const parseDate = (dateStr) => {
            if (!dateStr) return null;
            // Try MM/DD/YY format
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                let [month, day, year] = parts;
                year = year.length === 2 ? '20' + year : year;
                return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
            }
            // Try YYYY-MM-DD format
            const d = new Date(dateStr);
            return isNaN(d.getTime()) ? null : d;
        };

        const calculateDays = (date1, date2) => {
            if (!date1 || !date2) return null;
            const diffTime = date2.getTime() - date1.getTime();
            return Math.round(diffTime / (1000 * 60 * 60 * 24));
        };

        const startDate = parseDate(editedActivity.start);
        const finishDate = parseDate(editedActivity.finish);
        const actualStartDate = parseDate(editedActivity.actual_start);
        const actualFinishDate = parseDate(editedActivity.actual_finish);

        return {
            startVariance: calculateDays(startDate, actualStartDate),
            finishVariance: calculateDays(finishDate, actualFinishDate),
            actualDuration: calculateDays(actualStartDate, actualFinishDate)
        };
    };

    const variances = calculateVariances();

    // Marker configuration with professional project management standards
    const markerTypes = {
        none: {
            name: 'None',
            icon: '',
            color: '',
            description: 'No special marker'
        },
        milestone: {
            name: 'Milestone',
            icon: 'fas fa-gem',
            color: '#f59e0b',
            bgColor: '#fef3c7',
            description: 'Major project deliverable or phase completion'
        },
        critical: {
            name: 'Critical Path',
            icon: 'fas fa-exclamation-triangle',
            color: '#ef4444',
            bgColor: '#fee2e2',
            description: 'Activity that cannot be delayed without impacting project completion'
        },
        inspection: {
            name: 'Inspection Point',
            icon: 'fas fa-clipboard-check',
            color: '#10b981',
            bgColor: '#d1fae5',
            description: 'Safety inspection, code compliance, or required approval'
        },
        deliverable: {
            name: 'Key Deliverable',
            icon: 'fas fa-flag-checkered',
            color: '#3b82f6',
            bgColor: '#dbeafe',
            description: 'Draw request (payment), submittal, or phase completion'
        },
        deadline: {
            name: 'Deadline',
            icon: 'fas fa-clock',
            color: '#f97316',
            bgColor: '#ffedd5',
            description: 'Contractual deadline, permit deadline, or time-sensitive date'
        }
    };

    const handleSave = () => {
        if (!editedActivity.id || !editedActivity.name) {
            alert('Activity ID and Name are required');
            return;
        }

        if (!editedActivity.start || !editedActivity.finish) {
            alert('Please provide both Start and Finish dates to move this activity to the calendar');
            return;
        }

        // Include marker data in the saved activity
        const activityWithMarker = {
            ...editedActivity,
            marker: marker.type !== 'none' ? marker : null
        };

        // Pass flag to indicate if contractor should be applied to all activities with same name
        onSave(activityWithMarker, applyToAllWithSameName);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="glass rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-4">
                    <i className="fas fa-edit mr-3 text-blue-600"></i>
                    Edit Activity
                </h2>

                {(!editedActivity.start || !editedActivity.finish) && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                        <div className="flex items-start">
                            <i className="fas fa-info-circle text-yellow-600 mt-1 mr-3"></i>
                            <div className="text-sm text-gray-700">
                                <strong>Note:</strong> Once you add both Start and Finish dates, this activity will automatically move from "Activities Without Dates" to the calendar.
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold mb-1">Activity ID *</label>
                        <input
                            type="text"
                            value={editedActivity.id}
                            onChange={(e) => setEditedActivity({...editedActivity, id: e.target.value})}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-1">Area</label>
                        <select
                            value={editedActivity.area}
                            onChange={(e) => setEditedActivity({...editedActivity, area: e.target.value})}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        >
                            {Object.keys(customAreaConfig).map(area => (
                                <option key={area} value={area}>{customAreaConfig[area].name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-semibold mb-1">Contractor</label>
                        <input
                            type="text"
                            value={editedActivity.contractor || ''}
                            onChange={(e) => setEditedActivity({...editedActivity, contractor: e.target.value})}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            placeholder="e.g., M3, ACME, XYZ Corp..."
                        />

                        {/* Bulk Assignment Checkbox */}
                        {editedActivity.contractor && (
                            <label className="flex items-center gap-2 mt-3 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg text-sm text-gray-700 cursor-pointer hover:bg-blue-100 transition">
                                <input
                                    type="checkbox"
                                    checked={applyToAllWithSameName}
                                    onChange={(e) => setApplyToAllWithSameName(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="flex-1">
                                    <i className="fas fa-users-cog mr-2 text-blue-600"></i>
                                    Apply contractor "<strong>{editedActivity.contractor}</strong>" to <strong>all activities</strong> with name: "<strong className="text-blue-700">{editedActivity.name}</strong>"
                                </span>
                            </label>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-1">Floor</label>
                        <input
                            type="text"
                            value={editedActivity.floor || ''}
                            onChange={(e) => setEditedActivity({...editedActivity, floor: e.target.value})}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            placeholder="e.g., Lower Level, 1st Floor..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-1">Zone</label>
                        <input
                            type="text"
                            value={editedActivity.zone || ''}
                            onChange={(e) => setEditedActivity({...editedActivity, zone: e.target.value})}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            placeholder="e.g., Interior, Kitchen..."
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-semibold mb-1">Activity Name *</label>
                        <input
                            type="text"
                            value={editedActivity.name}
                            onChange={(e) => setEditedActivity({...editedActivity, name: e.target.value})}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <div className="relative">
                        <label className="block text-sm font-semibold mb-1">
                            Start Date *
                            {!editedActivity.start && (
                                <span className="ml-2 text-red-600 text-xs">
                                    <i className="fas fa-exclamation-circle"></i> Missing
                                </span>
                            )}
                        </label>
                        <input
                            type="text"
                            value={editedActivity.start || ''}
                            onChange={(e) => setEditedActivity({...editedActivity, start: e.target.value})}
                            className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none ${
                                !editedActivity.start ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                            }`}
                            placeholder="MM/DD/YY"
                        />
                    </div>

                    <div className="relative">
                        <label className="block text-sm font-semibold mb-1">
                            Finish Date *
                            {!editedActivity.finish && (
                                <span className="ml-2 text-red-600 text-xs">
                                    <i className="fas fa-exclamation-circle"></i> Missing
                                </span>
                            )}
                        </label>
                        <input
                            type="text"
                            value={editedActivity.finish || ''}
                            onChange={(e) => setEditedActivity({...editedActivity, finish: e.target.value})}
                            className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none ${
                                !editedActivity.finish ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                            }`}
                            placeholder="MM/DD/YY"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-1">Original Duration</label>
                        <input
                            type="text"
                            value={editedActivity.original_duration || ''}
                            onChange={(e) => setEditedActivity({...editedActivity, original_duration: e.target.value})}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            placeholder="Days"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-1">New Rem Duration</label>
                        <input
                            type="text"
                            value={editedActivity.rem_duration || ''}
                            onChange={(e) => setEditedActivity({...editedActivity, rem_duration: e.target.value})}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            placeholder="Days"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-1">Actual Start</label>
                        <input
                            type="text"
                            value={editedActivity.actual_start || ''}
                            onChange={(e) => setEditedActivity({...editedActivity, actual_start: e.target.value})}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            placeholder="MM/DD/YY"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-1">Actual Finish</label>
                        <input
                            type="text"
                            value={editedActivity.actual_finish || ''}
                            onChange={(e) => setEditedActivity({...editedActivity, actual_finish: e.target.value})}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            placeholder="MM/DD/YY"
                        />
                    </div>

                    {/* Variance Calculations Display */}
                    {(variances.startVariance !== null || variances.finishVariance !== null || variances.actualDuration !== null) && (
                        <div className="col-span-2 bg-gray-50 border border-gray-300 rounded-lg p-3">
                            <div className="grid grid-cols-3 gap-3 text-sm">
                                {variances.startVariance !== null && (
                                    <div className="text-center">
                                        <div className="text-xs text-gray-600 mb-1">Start Variance</div>
                                        <div className={`font-bold text-lg ${
                                            variances.startVariance > 0 ? 'text-red-600' :
                                            variances.startVariance < 0 ? 'text-green-600' :
                                            'text-blue-600'
                                        }`}>
                                            {variances.startVariance > 0 ? '+' : ''}{variances.startVariance} days
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {variances.startVariance > 0 ? '(Started late)' :
                                             variances.startVariance < 0 ? '(Started early)' :
                                             '(On time)'}
                                        </div>
                                    </div>
                                )}
                                {variances.finishVariance !== null && (
                                    <div className="text-center">
                                        <div className="text-xs text-gray-600 mb-1">Finish Variance</div>
                                        <div className={`font-bold text-lg ${
                                            variances.finishVariance > 0 ? 'text-red-600' :
                                            variances.finishVariance < 0 ? 'text-green-600' :
                                            'text-blue-600'
                                        }`}>
                                            {variances.finishVariance > 0 ? '+' : ''}{variances.finishVariance} days
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {variances.finishVariance > 0 ? '(Finished late)' :
                                             variances.finishVariance < 0 ? '(Finished early)' :
                                             '(On time)'}
                                        </div>
                                    </div>
                                )}
                                {variances.actualDuration !== null && (
                                    <div className="text-center">
                                        <div className="text-xs text-gray-600 mb-1">Actual Duration</div>
                                        <div className="font-bold text-lg text-purple-600">
                                            {variances.actualDuration} days
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {editedActivity.original_duration &&
                                             `(Planned: ${editedActivity.original_duration} days)`}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="col-span-2">
                        <label className="block text-sm font-semibold mb-1">Comments</label>
                        <textarea
                            value={editedActivity.comments || ''}
                            onChange={(e) => setEditedActivity({...editedActivity, comments: e.target.value})}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            rows="3"
                            placeholder="Additional notes..."
                        />
                    </div>

                    {/* Marker Selection Section */}
                    <div className="col-span-2 mt-4 pt-4 border-t-2 border-gray-200">
                        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                            <i className="fas fa-star mr-2 text-yellow-500"></i>
                            Project Marker (Optional)
                        </h3>
                        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-3 mb-4">
                            <p className="text-sm text-blue-800">
                                <i className="fas fa-info-circle mr-2"></i>
                                Mark important dates on the calendar with professional project management indicators
                            </p>
                        </div>

                        {/* Marker Type Selection */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold mb-2">Marker Type</label>
                            <select
                                value={marker.type}
                                onChange={(e) => setMarker({...marker, type: e.target.value})}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-base"
                            >
                                {Object.keys(markerTypes).map(key => {
                                    const markerInfo = markerTypes[key];
                                    return (
                                        <option key={key} value={key}>
                                            {markerInfo.name} {markerInfo.description ? `- ${markerInfo.description}` : ''}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        {/* Visual Preview of Selected Marker */}
                        {marker.type !== 'none' && (
                            <div
                                className="mb-4 p-4 rounded-lg border-2"
                                style={{
                                    backgroundColor: markerTypes[marker.type].bgColor,
                                    borderColor: markerTypes[marker.type].color
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <i
                                        className={`${markerTypes[marker.type].icon} text-2xl`}
                                        style={{ color: markerTypes[marker.type].color }}
                                    ></i>
                                    <div>
                                        <p className="font-bold text-gray-800">{markerTypes[marker.type].name}</p>
                                        <p className="text-sm text-gray-600">{markerTypes[marker.type].description}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Apply To Radio Buttons */}
                        {marker.type !== 'none' && (
                            <div>
                                <label className="block text-sm font-semibold mb-2">Apply Marker To:</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition flex-1">
                                        <input
                                            type="radio"
                                            name="markerApplyTo"
                                            value="start"
                                            checked={marker.applyTo === 'start'}
                                            onChange={(e) => setMarker({...marker, applyTo: e.target.value})}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-800">Start Date</p>
                                            <p className="text-xs text-gray-600">{editedActivity.start || 'Not set'}</p>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-2 p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition flex-1">
                                        <input
                                            type="radio"
                                            name="markerApplyTo"
                                            value="finish"
                                            checked={marker.applyTo === 'finish'}
                                            onChange={(e) => setMarker({...marker, applyTo: e.target.value})}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-800">Finish Date</p>
                                            <p className="text-xs text-gray-600">{editedActivity.finish || 'Not set'}</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
                    >
                        <i className="fas fa-save mr-2"></i>
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Manual Entry Modal Component
 *
 * Form for manually adding a new activity with all fields.
 * Features auto-parsing of Activity ID to extract Area/Floor/Zone.
 * Supports pre-filling date when clicking on a calendar day.
 *
 * @param {Object} props
 * @param {Function} props.onClose - Callback to close modal
 * @param {Function} props.onAdd - Callback to add activity (activities, update)
 * @param {Object} props.currentUpdate - Current update object
 * @param {Date} props.prefilledDate - Optional prefilled date from calendar
 */


function ManualEntryModal({ onClose, onAdd, currentUpdate, prefilledDate = null }) {
    const [activity, setActivity] = useState({
        id: '',
        name: '',
        area: 'A',
        floor: '',
        zone: '',
        contractor: '',
        original_duration: '',
        start: prefilledDate ? dateToString(prefilledDate) : '',
        finish: prefilledDate ? dateToString(prefilledDate) : '',
        actual_start: '',
        actual_finish: '',
        rem_duration: '',
        comments: ''
    });

    // 🆕 Auto-parse Activity ID when user types it
    const handleIdChange = (newId) => {
        const parsed = parseActivityID(newId);

        setActivity({
            ...activity,
            id: newId,
            // Auto-fill from parsed ID (parsed values override defaults)
            area: parsed.area || activity.area,
            floor: parsed.floor || activity.floor,
            zone: parsed.zone || activity.zone
        });
    };

    const handleSubmit = () => {
        if (!activity.id || !activity.name || !activity.start || !activity.finish) {
            alert('Please complete required fields: ID, Name, Start, Finish');
            return;
        }
        onAdd([activity], currentUpdate);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="glass rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6">
                    <i className="fas fa-plus-circle mr-3 text-slate-600"></i>
                    Add Activity Manually
                </h2>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold mb-1">Activity ID *</label>
                        <input
                            type="text"
                            value={activity.id}
                            onChange={(e) => handleIdChange(e.target.value)}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-slate-500 focus:outline-none"
                            placeholder="e.g., D-LL-INT-1230"
                        />
                        {activity.id && (activity.floor || activity.zone) && (
                            <div className="text-xs text-green-600 mt-1">
                                <i className="fas fa-check-circle mr-1"></i>
                                Auto-detected: {activity.floor && `Floor: ${activity.floor}`}{activity.floor && activity.zone && ', '}{activity.zone && `Zone: ${activity.zone}`}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-1">Area</label>
                        <select
                            value={activity.area}
                            onChange={(e) => setActivity({...activity, area: e.target.value})}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-slate-500 focus:outline-none"
                        >
                            {Object.keys(areaConfig).map(area => (
                                <option key={area} value={area}>{areaConfig[area].name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-1">Floor</label>
                        <input
                            type="text"
                            value={activity.floor}
                            onChange={(e) => setActivity({...activity, floor: e.target.value})}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-slate-500 focus:outline-none"
                            placeholder="e.g., Lower Level, 1st Floor..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-1">Zone</label>
                        <input
                            type="text"
                            value={activity.zone}
                            onChange={(e) => setActivity({...activity, zone: e.target.value})}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-slate-500 focus:outline-none"
                            placeholder="e.g., Interior, Kitchen..."
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-semibold mb-1">Contractor</label>
                        <input
                            type="text"
                            value={activity.contractor}
                            onChange={(e) => setActivity({...activity, contractor: e.target.value})}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-slate-500 focus:outline-none"
                            placeholder="e.g., M3, ACME, XYZ Corp..."
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-semibold mb-1">Activity Name *</label>
                        <input
                            type="text"
                            value={activity.name}
                            onChange={(e) => setActivity({...activity, name: e.target.value})}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-slate-500 focus:outline-none"
                            placeholder="Install Structural Steel"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-1">Start Date *</label>
                        <input
                            type="text"
                            value={activity.start}
                            onChange={(e) => setActivity({...activity, start: e.target.value})}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-slate-500 focus:outline-none"
                            placeholder="01/15/25"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-1">Finish Date *</label>
                        <input
                            type="text"
                            value={activity.finish}
                            onChange={(e) => setActivity({...activity, finish: e.target.value})}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-slate-500 focus:outline-none"
                            placeholder="01/20/25"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-1">Original Duration</label>
                        <input
                            type="text"
                            value={activity.original_duration}
                            onChange={(e) => setActivity({...activity, original_duration: e.target.value})}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-slate-500 focus:outline-none"
                            placeholder="5"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-1">New Rem Duration</label>
                        <input
                            type="text"
                            value={activity.rem_duration}
                            onChange={(e) => setActivity({...activity, rem_duration: e.target.value})}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-slate-500 focus:outline-none"
                            placeholder="3"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-1">Actual Start</label>
                        <input
                            type="text"
                            value={activity.actual_start}
                            onChange={(e) => setActivity({...activity, actual_start: e.target.value})}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-slate-500 focus:outline-none"
                            placeholder="01/16/25"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-1">Actual Finish</label>
                        <input
                            type="text"
                            value={activity.actual_finish}
                            onChange={(e) => setActivity({...activity, actual_finish: e.target.value})}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-slate-500 focus:outline-none"
                            placeholder="01/19/25"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-semibold mb-1">Comments</label>
                        <textarea
                            value={activity.comments}
                            onChange={(e) => setActivity({...activity, comments: e.target.value})}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-slate-500 focus:outline-none"
                            rows="3"
                            placeholder="Additional notes..."
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg transition">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition">
                        <i className="fas fa-plus mr-2"></i>
                        Add Activity
                    </button>
                </div>
            </div>
        </div>
    );
}

// Duplicate Detection Modal Component
// Intelligent modal for handling duplicate activities during import


function DuplicateDetectionModal({
    analysis,
    currentUpdate,
    allUpdates,
    onCancel,
    onImportNewOnly,
    onReplaceAndImport,
    onCreateNewUpdate
}) {
    const { duplicates, updates, newActivities, statistics, recommendation } = analysis;
    const [selectedOption, setSelectedOption] = React.useState(null);
    const [showDetails, setShowDetails] = React.useState(false);

    const nextUpdateNumber = getNextUpdateNumber(allUpdates);

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
            <div className="modal-content glass rounded-2xl p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-bold text-gray-800">
                        <i className="fas fa-search-plus mr-3 text-blue-600"></i>
                        Duplicate Detection Analysis
                    </h2>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Statistics Dashboard */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="glass rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-blue-600">{statistics.total}</div>
                        <div className="text-sm text-gray-600 mt-1">Total Activities</div>
                    </div>
                    <div className="glass rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-green-600">{statistics.newCount}</div>
                        <div className="text-sm text-gray-600 mt-1">New Activities</div>
                    </div>
                    <div className="glass rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-yellow-600">{statistics.updateCount}</div>
                        <div className="text-sm text-gray-600 mt-1">With Changes</div>
                    </div>
                    <div className="glass rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-red-600">{statistics.duplicateCount}</div>
                        <div className="text-sm text-gray-600 mt-1">Exact Duplicates</div>
                    </div>
                </div>

                {/* AI Recommendation */}
                <div className={`bg-${recommendation.color}-50 border-l-4 border-${recommendation.color}-500 rounded-lg p-6 mb-6`}>
                    <div className="flex items-start">
                        <i className={`fas ${recommendation.icon} text-${recommendation.color}-600 text-3xl mr-4 mt-1`}></i>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-800 mb-2">
                                <i className="fas fa-robot mr-2"></i>
                                AI Recommendation: {recommendation.title}
                            </h3>
                            <p className="text-gray-700 mb-2">{recommendation.message}</p>
                            <p className="text-gray-600 text-sm italic">{recommendation.suggestion}</p>
                        </div>
                    </div>
                </div>

                {/* Options */}
                <div className="space-y-4 mb-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                        <i className="fas fa-tasks mr-2"></i>
                        Choose Import Strategy:
                    </h3>

                    {/* Option 1: Create New Update (if recommended) */}
                    {recommendation.type === 'CREATE_NEW_UPDATE' && (
                        <button
                            onClick={() => setSelectedOption('new-update')}
                            className={`w-full text-left p-4 rounded-xl border-2 transition ${
                                selectedOption === 'new-update'
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-300 hover:border-blue-300'
                            }`}
                        >
                            <div className="flex items-start">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 mt-1 ${
                                    selectedOption === 'new-update' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                                }`}>
                                    {selectedOption === 'new-update' && <i className="fas fa-check text-white text-xs"></i>}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-800 mb-1">
                                        <i className="fas fa-plus-square text-blue-600 mr-2"></i>
                                        Create Update {nextUpdateNumber} (Recommended)
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                        Create a new update version with all {statistics.total} activities.
                                        This preserves historical data and allows you to track changes over time.
                                        Your current update ({currentUpdate.name}) will remain unchanged.
                                    </p>
                                </div>
                            </div>
                        </button>
                    )}

                    {/* Option 2: Import New Only */}
                    <button
                        onClick={() => setSelectedOption('new-only')}
                        className={`w-full text-left p-4 rounded-xl border-2 transition ${
                            selectedOption === 'new-only'
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-300 hover:border-green-300'
                        }`}
                    >
                        <div className="flex items-start">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 mt-1 ${
                                selectedOption === 'new-only' ? 'border-green-500 bg-green-500' : 'border-gray-300'
                            }`}>
                                {selectedOption === 'new-only' && <i className="fas fa-check text-white text-xs"></i>}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-800 mb-1">
                                    <i className="fas fa-plus-circle text-green-600 mr-2"></i>
                                    Import {statistics.newCount} New Activities Only
                                </h4>
                                <p className="text-sm text-gray-600">
                                    Add only new activities to {currentUpdate.name}.
                                    Skip all duplicates ({statistics.duplicateCount}) and activities with changes ({statistics.updateCount}).
                                </p>
                            </div>
                        </div>
                    </button>

                    {/* Option 3: Replace and Import */}
                    {statistics.updateCount > 0 && (
                        <button
                            onClick={() => setSelectedOption('replace-and-import')}
                            className={`w-full text-left p-4 rounded-xl border-2 transition ${
                                selectedOption === 'replace-and-import'
                                    ? 'border-yellow-500 bg-yellow-50'
                                    : 'border-gray-300 hover:border-yellow-300'
                            }`}
                        >
                            <div className="flex items-start">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 mt-1 ${
                                    selectedOption === 'replace-and-import' ? 'border-yellow-500 bg-yellow-500' : 'border-gray-300'
                                }`}>
                                    {selectedOption === 'replace-and-import' && <i className="fas fa-check text-white text-xs"></i>}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-800 mb-1">
                                        <i className="fas fa-sync-alt text-yellow-600 mr-2"></i>
                                        Replace {statistics.updateCount} Activities + Import {statistics.newCount} New
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                        Update existing activities with new data and add new activities.
                                        Skip exact duplicates ({statistics.duplicateCount}).
                                        <span className="text-yellow-700 font-semibold ml-1">Warning: This will modify {currentUpdate.name}.</span>
                                    </p>
                                </div>
                            </div>
                        </button>
                    )}
                </div>

                {/* Details Toggle */}
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="w-full text-left px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition mb-4"
                >
                    <i className={`fas fa-chevron-${showDetails ? 'up' : 'down'} mr-2`}></i>
                    {showDetails ? 'Hide' : 'Show'} Detailed Activity Breakdown
                </button>

                {/* Detailed Breakdown */}
                {showDetails && (
                    <div className="space-y-6 mb-6">
                        {/* New Activities */}
                        {newActivities.length > 0 && (
                            <div className="glass rounded-xl p-4">
                                <h4 className="font-bold text-gray-800 mb-3">
                                    <i className="fas fa-plus-circle text-green-600 mr-2"></i>
                                    New Activities ({newActivities.length})
                                </h4>
                                <div className="max-h-60 overflow-y-auto space-y-2">
                                    {newActivities.slice(0, 20).map((act, idx) => (
                                        <div key={idx} className="p-3 bg-white rounded-lg border border-green-200 text-sm">
                                            <div className="font-mono font-semibold text-gray-800">{act.id}</div>
                                            <div className="text-gray-600">{act.name}</div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {act.start} → {act.finish}
                                            </div>
                                        </div>
                                    ))}
                                    {newActivities.length > 20 && (
                                        <div className="text-center text-sm text-gray-500 py-2">
                                            And {newActivities.length - 20} more...
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Activities with Changes */}
                        {updates.length > 0 && (
                            <div className="glass rounded-xl p-4">
                                <h4 className="font-bold text-gray-800 mb-3">
                                    <i className="fas fa-sync-alt text-yellow-600 mr-2"></i>
                                    Activities with Changes ({updates.length})
                                </h4>
                                <div className="max-h-60 overflow-y-auto space-y-2">
                                    {updates.slice(0, 10).map((update, idx) => (
                                        <div key={idx} className="p-3 bg-white rounded-lg border border-yellow-200 text-sm">
                                            <div className="font-mono font-semibold text-gray-800">{update.activity.id}</div>
                                            <div className="text-gray-600">{update.activity.name}</div>
                                            <div className="mt-2 space-y-1">
                                                {update.differences.map((diff, i) => (
                                                    <div key={i} className="flex items-center text-xs">
                                                        <span className="text-gray-500 capitalize w-20">{diff.field}:</span>
                                                        <span className="text-red-600 line-through mr-2">{diff.oldValue || '(empty)'}</span>
                                                        <i className="fas fa-arrow-right text-gray-400 mr-2"></i>
                                                        <span className="text-green-600">{diff.newValue || '(empty)'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {updates.length > 10 && (
                                        <div className="text-center text-sm text-gray-500 py-2">
                                            And {updates.length - 10} more...
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Exact Duplicates */}
                        {duplicates.length > 0 && (
                            <div className="glass rounded-xl p-4">
                                <h4 className="font-bold text-gray-800 mb-3">
                                    <i className="fas fa-copy text-red-600 mr-2"></i>
                                    Exact Duplicates ({duplicates.length})
                                </h4>
                                <div className="max-h-60 overflow-y-auto space-y-2">
                                    {duplicates.slice(0, 10).map((dup, idx) => (
                                        <div key={idx} className="p-3 bg-white rounded-lg border border-red-200 text-sm">
                                            <div className="font-mono font-semibold text-gray-800">{dup.activity.id}</div>
                                            <div className="text-gray-600">{dup.activity.name}</div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {dup.activity.start} → {dup.activity.finish}
                                            </div>
                                        </div>
                                    ))}
                                    {duplicates.length > 10 && (
                                        <div className="text-center text-sm text-gray-500 py-2">
                                            And {duplicates.length - 10} more...
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t-2 border-gray-200">
                    <button
                        onClick={onCancel}
                        className="px-6 py-3 bg-gray-300 hover:bg-gray-400 rounded-lg transition font-medium"
                    >
                        <i className="fas fa-times mr-2"></i>
                        Cancel Import
                    </button>

                    {selectedOption === 'new-update' && (
                        <button
                            onClick={() => onCreateNewUpdate(newActivities, updates, duplicates)}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
                        >
                            <i className="fas fa-plus-square mr-2"></i>
                            Create Update {nextUpdateNumber}
                        </button>
                    )}

                    {selectedOption === 'new-only' && (
                        <button
                            onClick={() => onImportNewOnly(newActivities)}
                            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium"
                        >
                            <i className="fas fa-plus-circle mr-2"></i>
                            Import {statistics.newCount} New Activities
                        </button>
                    )}

                    {selectedOption === 'replace-and-import' && (
                        <button
                            onClick={() => onReplaceAndImport(newActivities, updates)}
                            className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition font-medium"
                        >
                            <i className="fas fa-sync-alt mr-2"></i>
                            Replace & Import ({statistics.updateCount + statistics.newCount} activities)
                        </button>
                    )}

                    {!selectedOption && (
                        <button
                            disabled
                            className="px-6 py-3 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
                        >
                            Select an Option Above
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Bulk Contractor Assignment Modal Component
 *
 * 2-step wizard for assigning contractors to multiple activities:
 * 1. Filter activities (by contractor, area, floor, zone, name, dates)
 * 2. Assign contractor name to filtered activities
 *
 * Features:
 * - Multi-criteria filtering
 * - "Select All" shortcut
 * - Preview before assignment
 * - Shows current contractor for each activity
 *
 * @param {Object} props
 * @param {Function} props.onClose - Callback to close modal
 * @param {Object} props.currentUpdate - Current update with activities
 * @param {Function} props.onAssign - Callback to assign contractor (activities, contractorName)
 */


function BulkContractorModal({ onClose, currentUpdate, onAssign }) {
    const [step, setStep] = useState(1); // 1: Filter, 2: Assign
    const [filters, setFilters] = useState({
        contractor: '',
        area: '',
        floor: '',
        zone: '',
        activityName: '',
        startDate: '',
        endDate: ''
    });
    const [contractorName, setContractorName] = useState('');
    const [filteredActivities, setFilteredActivities] = useState([]);

    // Get unique values for dropdowns
    const uniqueContractors = [...new Set(currentUpdate.activities.map(a => a.contractor).filter(Boolean))].sort();
    const uniqueAreas = [...new Set(currentUpdate.activities.map(a => a.area).filter(Boolean))].sort();
    const uniqueFloors = [...new Set(currentUpdate.activities.map(a => a.floor).filter(Boolean))].sort();
    const uniqueZones = [...new Set(currentUpdate.activities.map(a => a.zone).filter(Boolean))].sort();

    const handleApplyFilters = () => {
        let activities = [...currentUpdate.activities];

        // Apply filters
        if (filters.contractor) {
            activities = activities.filter(a => a.contractor === filters.contractor);
        }
        if (filters.area) {
            activities = activities.filter(a => a.area === filters.area);
        }
        if (filters.floor) {
            activities = activities.filter(a => a.floor === filters.floor);
        }
        if (filters.zone) {
            activities = activities.filter(a => a.zone === filters.zone);
        }
        if (filters.activityName) {
            activities = activities.filter(a =>
                a.name && a.name.toLowerCase().includes(filters.activityName.toLowerCase())
            );
        }
        if (filters.startDate) {
            activities = activities.filter(a => a.start && a.start >= filters.startDate);
        }
        if (filters.endDate) {
            activities = activities.filter(a => a.finish && a.finish <= filters.endDate);
        }

        setFilteredActivities(activities);
        setStep(2);
    };

    const handleAssign = () => {
        if (!contractorName.trim()) {
            alert('Please enter a contractor name');
            return;
        }

        if (filteredActivities.length === 0) {
            alert('No activities selected');
            return;
        }

        // Assign contractor to all filtered activities
        onAssign(filteredActivities, contractorName.trim());
        onClose();
    };

    const handleSelectAll = () => {
        setFilters({
            contractor: '',
            area: '',
            floor: '',
            zone: '',
            activityName: '',
            startDate: '',
            endDate: ''
        });
        setFilteredActivities([...currentUpdate.activities]);
        setStep(2);
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content glass rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-bold text-gray-800">
                        <i className="fas fa-users-cog mr-3 text-purple-600"></i>
                        Bulk Contractor Assignment
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center gap-4 mb-8">
                    <div className={`flex items-center ${step >= 1 ? 'text-purple-600' : 'text-gray-400'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                            step >= 1 ? 'border-purple-600 bg-purple-50' : 'border-gray-300'
                        }`}>
                            {step > 1 ? <i className="fas fa-check"></i> : '1'}
                        </div>
                        <span className="ml-2 font-semibold">Filter Activities</span>
                    </div>
                    <div className="flex-1 h-0.5 bg-gray-300"></div>
                    <div className={`flex items-center ${step >= 2 ? 'text-purple-600' : 'text-gray-400'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                            step >= 2 ? 'border-purple-600 bg-purple-50' : 'border-gray-300'
                        }`}>
                            2
                        </div>
                        <span className="ml-2 font-semibold">Assign Contractor</span>
                    </div>
                </div>

                {/* STEP 1: Filter Activities */}
                {step === 1 && (
                    <div className="fade-in">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">
                            <i className="fas fa-filter mr-2 text-blue-600"></i>
                            Step 1: Select Activities to Update
                        </h3>
                        <p className="text-sm text-gray-600 mb-6">
                            Filter to select specific activities, or click "Select All" to update all activities
                        </p>

                        <div className="space-y-4 mb-6">
                            {/* Existing Contractor Filter */}
                            <div>
                                <label className="block font-semibold mb-2">Current Contractor:</label>
                                <select
                                    value={filters.contractor}
                                    onChange={(e) => setFilters({...filters, contractor: e.target.value})}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                                >
                                    <option value="">All Contractors (including unassigned)</option>
                                    {uniqueContractors.map(contractor => (
                                        <option key={contractor} value={contractor}>{contractor}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Area Filter */}
                                <div>
                                    <label className="block font-semibold mb-2">Area:</label>
                                    <select
                                        value={filters.area}
                                        onChange={(e) => setFilters({...filters, area: e.target.value})}
                                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                                    >
                                        <option value="">All Areas</option>
                                        {uniqueAreas.map(area => (
                                            <option key={area} value={area}>{area}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Floor Filter */}
                                <div>
                                    <label className="block font-semibold mb-2">Floor:</label>
                                    <select
                                        value={filters.floor}
                                        onChange={(e) => setFilters({...filters, floor: e.target.value})}
                                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                                    >
                                        <option value="">All Floors</option>
                                        {uniqueFloors.map(floor => (
                                            <option key={floor} value={floor}>{floor}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Zone Filter */}
                                <div>
                                    <label className="block font-semibold mb-2">Zone:</label>
                                    <select
                                        value={filters.zone}
                                        onChange={(e) => setFilters({...filters, zone: e.target.value})}
                                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                                    >
                                        <option value="">All Zones</option>
                                        {uniqueZones.map(zone => (
                                            <option key={zone} value={zone}>{zone}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Activity Name Filter */}
                                <div>
                                    <label className="block font-semibold mb-2">Activity Name (contains):</label>
                                    <input
                                        type="text"
                                        value={filters.activityName}
                                        onChange={(e) => setFilters({...filters, activityName: e.target.value})}
                                        placeholder="e.g., DRYWALL, FRAME..."
                                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Date Range Filters */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-semibold mb-2">Start Date (from):</label>
                                    <input
                                        type="text"
                                        value={filters.startDate}
                                        onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                                        placeholder="MM/DD/YY"
                                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold mb-2">End Date (to):</label>
                                    <input
                                        type="text"
                                        value={filters.endDate}
                                        onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                                        placeholder="MM/DD/YY"
                                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-between gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-3 bg-gray-300 hover:bg-gray-400 rounded-lg transition font-medium"
                            >
                                <i className="fas fa-times mr-2"></i>
                                Cancel
                            </button>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleSelectAll}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
                                >
                                    <i className="fas fa-check-double mr-2"></i>
                                    Select All Activities
                                </button>
                                <button
                                    onClick={handleApplyFilters}
                                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium"
                                >
                                    <i className="fas fa-arrow-right mr-2"></i>
                                    Apply Filters & Continue
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: Assign Contractor */}
                {step === 2 && (
                    <div className="fade-in">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">
                            <i className="fas fa-user-tag mr-2 text-purple-600"></i>
                            Step 2: Assign Contractor to Selected Activities
                        </h3>

                        {/* Preview Stats */}
                        <div className="bg-purple-50 border-l-4 border-purple-500 rounded-lg p-4 mb-6">
                            <div className="flex items-center gap-3">
                                <i className="fas fa-info-circle text-purple-600 text-2xl"></i>
                                <div>
                                    <p className="font-semibold text-gray-800">
                                        {filteredActivities.length} {filteredActivities.length === 1 ? 'activity' : 'activities'} selected
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        The contractor name will be assigned to all selected activities
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Contractor Name Input */}
                        <div className="mb-6">
                            <label className="block font-semibold mb-2 text-lg">Contractor Name:</label>
                            <input
                                type="text"
                                value={contractorName}
                                onChange={(e) => setContractorName(e.target.value)}
                                placeholder="e.g., M3, ACME Construction, XYZ Corp..."
                                className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none text-lg"
                                autoFocus
                            />
                        </div>

                        {/* Preview List */}
                        {filteredActivities.length > 0 && (
                            <div className="mb-6">
                                <h4 className="font-semibold text-gray-800 mb-3">
                                    Preview - Activities to Update:
                                </h4>
                                <div className="bg-white border-2 border-gray-200 rounded-lg max-h-60 overflow-y-auto p-4">
                                    {filteredActivities.slice(0, 10).map((activity, idx) => (
                                        <div key={idx} className="py-2 border-b border-gray-100 last:border-0">
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-sm text-gray-600">{activity.id}</span>
                                                <span className="text-sm text-gray-800 flex-1">{activity.name}</span>
                                                {activity.contractor && (
                                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                                        Current: {activity.contractor}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {filteredActivities.length > 10 && (
                                        <div className="text-center text-sm text-gray-500 py-2 mt-2">
                                            And {filteredActivities.length - 10} more activities...
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-between gap-3">
                            <button
                                onClick={() => setStep(1)}
                                className="px-6 py-3 bg-gray-300 hover:bg-gray-400 rounded-lg transition font-medium"
                            >
                                <i className="fas fa-arrow-left mr-2"></i>
                                Back to Filters
                            </button>
                            <button
                                onClick={handleAssign}
                                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium"
                            >
                                <i className="fas fa-check mr-2"></i>
                                Assign to {filteredActivities.length} {filteredActivities.length === 1 ? 'Activity' : 'Activities'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Export Options Modal Component - Redesigned
 *
 * Two main export modes:
 * - Quick Export: Load saved filter layout
 * - Manual Export: Configure filters manually
 *
 * Modes are mutually exclusive for clarity
 */


function ExportOptionsModal({ onClose, currentUpdate, onExport, savedFilterLayouts = [] }) {
    // Export mode: 'layout' or 'manual'
    const [exportMode, setExportMode] = useState('manual');

    // Layout mode state
    const [selectedLayout, setSelectedLayout] = useState(null);

    // Manual mode state
    const [exportFilters, setExportFilters] = useState({
        contractor: '',
        area: '',
        floor: '',
        zone: '',
        activityName: '',
        dateRangePreset: 'all',
        dateRangeStart: null,
        dateRangeEnd: null,
        includeOverlap: true
    });

    const [sortBy, setSortBy] = useState('start');
    const [sortOrder, setSortOrder] = useState('asc');

    // Switch to layout mode
    const selectLayout = (layout) => {
        if (layout) {
            setExportMode('layout');
            setSelectedLayout(layout);
        } else {
            setSelectedLayout(null);
        }
    };

    // Switch to manual mode
    const enableManualFilters = () => {
        setExportMode('manual');
        setSelectedLayout(null);
    };

    // Date preset handler
    const setDatePreset = (preset) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch(preset) {
            case 'all':
                setExportFilters({...exportFilters,
                    dateRangePreset: 'all',
                    dateRangeStart: null,
                    dateRangeEnd: null
                });
                break;
            case 'next2weeks':
                const end2w = new Date(today);
                end2w.setDate(end2w.getDate() + 14);
                setExportFilters({...exportFilters,
                    dateRangePreset: 'next2weeks',
                    dateRangeStart: today,
                    dateRangeEnd: end2w
                });
                break;
            case 'next3weeks':
                const end3w = new Date(today);
                end3w.setDate(end3w.getDate() + 21);
                setExportFilters({...exportFilters,
                    dateRangePreset: 'next3weeks',
                    dateRangeStart: today,
                    dateRangeEnd: end3w
                });
                break;
            case 'thismonth':
                const startMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                const endMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                setExportFilters({...exportFilters,
                    dateRangePreset: 'thismonth',
                    dateRangeStart: startMonth,
                    dateRangeEnd: endMonth
                });
                break;
            case 'custom':
                setExportFilters({...exportFilters, dateRangePreset: 'custom'});
                break;
        }
    };

    const handleExport = () => {
        onExport(exportFilters, sortBy, sortOrder, selectedLayout);
        onClose();
    };

    // Unique values for dropdowns
    const uniqueContractors = [...new Set(currentUpdate.activities.map(a => a.contractor).filter(Boolean))].sort();
    const uniqueAreas = [...new Set(currentUpdate.activities.map(a => a.area).filter(Boolean))].sort();
    const uniqueFloors = [...new Set(currentUpdate.activities.map(a => a.floor).filter(Boolean))].sort();
    const uniqueZones = [...new Set(currentUpdate.activities.map(a => a.zone).filter(Boolean))].sort();

    // Check if any manual filters are active
    const hasManualFilters = exportFilters.contractor || exportFilters.area ||
                            exportFilters.floor || exportFilters.zone ||
                            exportFilters.activityName ||
                            (exportFilters.dateRangeStart && exportFilters.dateRangeEnd);

    // Format date
    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear();
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content glass rounded-xl p-5 max-w-2xl w-full max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-2xl font-bold text-gray-800">
                        <i className="fas fa-file-export mr-2 text-green-600"></i>
                        Export to Excel
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* OPTION A: Saved Layout */}
                {savedFilterLayouts && savedFilterLayouts.length > 0 && (
                    <div className={`border rounded-lg p-4 mb-4 transition ${
                        exportMode === 'layout' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
                    }`}>
                        <label className="block font-semibold text-gray-800 mb-2">
                            <i className="fas fa-bolt mr-2 text-blue-600"></i>
                            Option A: Load Saved Filter Layout
                        </label>
                        <select
                            value={selectedLayout ? selectedLayout.id : ''}
                            onChange={(e) => {
                                const layout = savedFilterLayouts.find(l => l.id === e.target.value);
                                selectLayout(layout || null);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        >
                            <option value="">-- Select a saved layout --</option>
                            {savedFilterLayouts.map(layout => (
                                <option key={layout.id} value={layout.id}>
                                    {layout.name} ({layout.filters.length} filters)
                                </option>
                            ))}
                        </select>
                        {selectedLayout && (
                            <div className="mt-2 text-xs text-gray-600 bg-white rounded p-2">
                                <strong>Applied filters:</strong>
                                {selectedLayout.filters.map((f, idx) => (
                                    <div key={idx}>• {f.column}: {f.values?.length || 0} values</div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Divider */}
                {savedFilterLayouts && savedFilterLayouts.length > 0 && (
                    <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 border-t border-gray-300"></div>
                        <span className="text-sm text-gray-500 font-medium">OR</span>
                        <div className="flex-1 border-t border-gray-300"></div>
                    </div>
                )}

                {/* OPTION B: Manual Filters */}
                <div className={`border rounded-lg p-4 mb-4 transition ${
                    exportMode === 'manual' ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'
                }`}>
                    <label className="block font-semibold text-gray-800 mb-3">
                        <i className="fas fa-filter mr-2 text-green-600"></i>
                        Option B: Manual Filters
                    </label>

                    <div className={`space-y-3 ${exportMode === 'layout' ? 'opacity-40 pointer-events-none' : ''}`}>

                        {/* Date Range */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range:</label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => { enableManualFilters(); setDatePreset('all'); }}
                                    className={`px-3 py-1.5 text-sm rounded-lg font-medium transition ${
                                        exportFilters.dateRangePreset === 'all' ?
                                            'bg-blue-600 text-white' :
                                            'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                                    }`}
                                >
                                    All Dates
                                </button>
                                <button
                                    onClick={() => { enableManualFilters(); setDatePreset('next2weeks'); }}
                                    className={`px-3 py-1.5 text-sm rounded-lg font-medium transition ${
                                        exportFilters.dateRangePreset === 'next2weeks' ?
                                            'bg-blue-600 text-white' :
                                            'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                                    }`}
                                >
                                    Next 2 Weeks
                                </button>
                                <button
                                    onClick={() => { enableManualFilters(); setDatePreset('next3weeks'); }}
                                    className={`px-3 py-1.5 text-sm rounded-lg font-medium transition ${
                                        exportFilters.dateRangePreset === 'next3weeks' ?
                                            'bg-blue-600 text-white' :
                                            'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                                    }`}
                                >
                                    Next 3 Weeks
                                </button>
                                <button
                                    onClick={() => { enableManualFilters(); setDatePreset('thismonth'); }}
                                    className={`px-3 py-1.5 text-sm rounded-lg font-medium transition ${
                                        exportFilters.dateRangePreset === 'thismonth' ?
                                            'bg-blue-600 text-white' :
                                            'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                                    }`}
                                >
                                    This Month
                                </button>
                                <button
                                    onClick={() => { enableManualFilters(); setDatePreset('custom'); }}
                                    className={`px-3 py-1.5 text-sm rounded-lg font-medium transition ${
                                        exportFilters.dateRangePreset === 'custom' ?
                                            'bg-blue-600 text-white' :
                                            'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                                    }`}
                                >
                                    Custom
                                </button>
                            </div>

                            {/* Custom Date Inputs */}
                            {exportFilters.dateRangePreset === 'custom' && (
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <input
                                        type="date"
                                        value={exportFilters.dateRangeStart ?
                                            exportFilters.dateRangeStart.toISOString().split('T')[0] : ''}
                                        onChange={(e) => setExportFilters({...exportFilters,
                                            dateRangeStart: e.target.value ? new Date(e.target.value) : null
                                        })}
                                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                    />
                                    <input
                                        type="date"
                                        value={exportFilters.dateRangeEnd ?
                                            exportFilters.dateRangeEnd.toISOString().split('T')[0] : ''}
                                        onChange={(e) => setExportFilters({...exportFilters,
                                            dateRangeEnd: e.target.value ? new Date(e.target.value) : null
                                        })}
                                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                            )}

                            {/* Overlap Toggle */}
                            {exportFilters.dateRangeStart && exportFilters.dateRangeEnd && (
                                <label className="flex items-center gap-2 mt-2 text-sm cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={exportFilters.includeOverlap}
                                        onChange={(e) => setExportFilters({...exportFilters, includeOverlap: e.target.checked})}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                                    />
                                    <span className="text-gray-700">Include activities that cross date range</span>
                                </label>
                            )}
                        </div>

                        {/* Other Filters - 2 Column Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contractor:</label>
                                <select
                                    value={exportFilters.contractor}
                                    onChange={(e) => { enableManualFilters(); setExportFilters({...exportFilters, contractor: e.target.value}); }}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                >
                                    <option value="">All</option>
                                    {uniqueContractors.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Area:</label>
                                <select
                                    value={exportFilters.area}
                                    onChange={(e) => { enableManualFilters(); setExportFilters({...exportFilters, area: e.target.value}); }}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                >
                                    <option value="">All</option>
                                    {uniqueAreas.map(a => (
                                        <option key={a} value={a}>{a}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Floor:</label>
                                <select
                                    value={exportFilters.floor}
                                    onChange={(e) => { enableManualFilters(); setExportFilters({...exportFilters, floor: e.target.value}); }}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                >
                                    <option value="">All</option>
                                    {uniqueFloors.map(f => (
                                        <option key={f} value={f}>{f}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Zone:</label>
                                <select
                                    value={exportFilters.zone}
                                    onChange={(e) => { enableManualFilters(); setExportFilters({...exportFilters, zone: e.target.value}); }}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                >
                                    <option value="">All</option>
                                    {uniqueZones.map(z => (
                                        <option key={z} value={z}>{z}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Activity Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Activity Name (contains):</label>
                            <input
                                type="text"
                                value={exportFilters.activityName}
                                onChange={(e) => { enableManualFilters(); setExportFilters({...exportFilters, activityName: e.target.value}); }}
                                placeholder="e.g., DRYWALL"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Sort Options */}
                <div className="border border-gray-300 rounded-lg p-4 mb-4 bg-white">
                    <label className="block font-semibold text-gray-800 mb-3">
                        <i className="fas fa-sort mr-2 text-purple-600"></i>
                        Sort Options
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By:</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                            >
                                <option value="id">Activity ID</option>
                                <option value="name">Activity Name</option>
                                <option value="contractor">Contractor</option>
                                <option value="area">Area</option>
                                <option value="floor">Floor</option>
                                <option value="zone">Zone</option>
                                <option value="start">Start Date</option>
                                <option value="finish">Finish Date</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Order:</label>
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                            >
                                <option value="asc">Ascending (A-Z, Oldest First)</option>
                                <option value="desc">Descending (Z-A, Newest First)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Summary */}
                <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 mb-4 text-sm text-gray-700">
                    <strong>Export Mode:</strong> {exportMode === 'layout' ? `Saved Layout: "${selectedLayout?.name}"` : 'Manual Filters'}
                    {exportMode === 'manual' && hasManualFilters && (
                        <div className="mt-1 text-xs">
                            {exportFilters.contractor && <span>• Contractor: {exportFilters.contractor} </span>}
                            {exportFilters.area && <span>• Area: {exportFilters.area} </span>}
                            {exportFilters.floor && <span>• Floor: {exportFilters.floor} </span>}
                            {exportFilters.zone && <span>• Zone: {exportFilters.zone} </span>}
                            {exportFilters.activityName && <span>• Name: "{exportFilters.activityName}" </span>}
                            {exportFilters.dateRangeStart && exportFilters.dateRangeEnd && (
                                <span>• Dates: {formatDate(exportFilters.dateRangeStart)} - {formatDate(exportFilters.dateRangeEnd)}</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg transition font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleExport}
                        className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium"
                    >
                        <i className="fas fa-file-excel mr-2"></i>
                        Export to Excel
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * ComparisonModal Component
 *
 * Complete schedule comparison with variance analysis, multiple visualization modes, and exports.
 *
 * Features:
 * - Select two updates for comparison (baseline vs current)
 * - Compare start dates, finish dates, or both
 * - Multiple visualization modes: stacked bars, arrow indicators, side-by-side
 * - Comprehensive variance metrics dashboard
 * - Filtered analysis views
 * - Export to Excel with variance report
 * - Export to PDF with charts
 */


function ComparisonModal({ onClose, updates }) {
    // State: Selected updates for comparison
    const [baselineUpdateId, setBaselineUpdateId] = useState(null);
    const [currentUpdateId, setCurrentUpdateId] = useState(null);

    // State: Comparison options
    const [compareType, setCompareType] = useState('both'); // 'start', 'finish', 'both'
    const [viewMode, setViewMode] = useState('side-by-side'); // 'stacked', 'arrows', 'side-by-side'
    const [workDaysPerWeek, setWorkDaysPerWeek] = useState(6); // 5 (Mon-Fri), 6 (Mon-Sat), or 7 (all days)

    // State: Filters
    const [filterType, setFilterType] = useState('all'); // 'all', 'delayed', 'advanced', 'duration_change', 'new', 'removed'

    // State: Comparison results
    const [comparisonResults, setComparisonResults] = useState(null);
    const [showResults, setShowResults] = useState(false);

    // Filter updates with activities
    const availableUpdates = useMemo(() => {
        return updates.filter(u => u.activities && u.activities.length > 0);
    }, [updates]);

    // Initialize with first two available updates
    useEffect(() => {
        if (availableUpdates.length >= 2) {
            setBaselineUpdateId(availableUpdates[0].id);
            setCurrentUpdateId(availableUpdates[1].id);
        } else if (availableUpdates.length === 1) {
            setBaselineUpdateId(availableUpdates[0].id);
        }
    }, [availableUpdates]);

    // Get selected updates
    const baselineUpdate = availableUpdates.find(u => u.id === baselineUpdateId);
    const currentUpdate = availableUpdates.find(u => u.id === currentUpdateId);

    // Validation
    const canCompare = baselineUpdate && currentUpdate && baselineUpdateId !== currentUpdateId;

    // Filtered activities
    const filteredActivities = useMemo(() => {
        if (!comparisonResults) return [];

        if (filterType === 'all') {
            return comparisonResults.allActivities;
        }

        if (filterType === 'delayed') {
            return comparisonResults.changes.filter(c => c.type === 'delayed');
        }

        if (filterType === 'advanced') {
            return comparisonResults.changes.filter(c => c.type === 'advanced');
        }

        if (filterType === 'duration_change') {
            return comparisonResults.changes.filter(c => c.type === 'duration_change');
        }

        if (filterType === 'new') {
            return comparisonResults.newActivities;
        }

        if (filterType === 'removed') {
            return comparisonResults.removedActivities;
        }

        return comparisonResults.allActivities;
    }, [comparisonResults, filterType]);

    /**
     * Generate comparison analysis
     */
    const handleGenerateComparison = () => {
        if (!canCompare) return;

        const results = window.compareUpdates(baselineUpdate, currentUpdate, compareType, workDaysPerWeek);
        setComparisonResults(results);
        setShowResults(true);
        setFilterType('all');
    };

    /**
     * Export to Excel with variance report
     */
    const handleExportToExcel = () => {
        if (!comparisonResults) return;

        const wb = XLSX.utils.book_new();

        // Sheet 1: Variance Summary
        const summaryData = [
            ['SCHEDULE VARIANCE ANALYSIS'],
            [''],
            ['Baseline Update:', comparisonResults.baselineUpdate.name],
            ['Current Update:', comparisonResults.currentUpdate.name],
            ['Comparison Type:', comparisonResults.compareType],
            ['Generated:', new Date().toLocaleString()],
            [''],
            ['METRICS'],
            ['Total Activities:', comparisonResults.metrics.totalActivities],
            ['Activities with Changes:', comparisonResults.metrics.totalChanges],
            ['On Track (No Change):', comparisonResults.metrics.onTrackCount],
            ['Schedule Health:', comparisonResults.metrics.scheduleHealth + '%'],
            [''],
            ['Delayed Activities:', comparisonResults.metrics.delayedCount],
            ['Average Delay:', comparisonResults.metrics.avgDelay + ' days'],
            ['Total Delay Days:', comparisonResults.metrics.totalDelayDays],
            [''],
            ['Advanced Activities:', comparisonResults.metrics.advancedCount],
            ['Average Advance:', comparisonResults.metrics.avgAdvance + ' days'],
            ['Total Advance Days:', comparisonResults.metrics.totalAdvanceDays],
            [''],
            ['Duration Changes:', comparisonResults.metrics.durationChangeCount],
            ['Avg Duration Delta:', comparisonResults.metrics.avgDurationDelta + ' days'],
            [''],
            ['New Activities:', comparisonResults.metrics.newActivitiesCount],
            ['Removed Activities:', comparisonResults.metrics.removedActivitiesCount]
        ];

        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

        // Sheet 2: Detailed Changes
        const detailsData = [
            ['Activity ID', 'Activity Name', 'Change Type', 'Impact', 'Baseline Start', 'Baseline Finish', 'Current Start', 'Current Finish', 'Start Delta', 'Finish Delta', 'Duration Delta', 'Description']
        ];

        comparisonResults.allActivities.forEach(item => {
            const activity = item.activity || item.baselineActivity;
            detailsData.push([
                activity.id || '',
                activity.name || '',
                item.type || '',
                formatImpact(item.impact || 0, item.type || ''),
                item.baselineDates ? formatDateShort(item.baselineDates.start) : 'N/A',
                item.baselineDates ? formatDateShort(item.baselineDates.finish) : 'N/A',
                item.currentDates ? formatDateShort(item.currentDates.start) : (item.type === 'new' ? formatDateShort(activity.start) : 'N/A'),
                item.currentDates ? formatDateShort(item.currentDates.finish) : (item.type === 'new' ? formatDateShort(activity.finish) : 'N/A'),
                item.startDelta || 0,
                item.finishDelta || 0,
                item.durationDelta || 0,
                item.description || item.type || ''
            ]);
        });

        const detailsSheet = XLSX.utils.aoa_to_sheet(detailsData);
        XLSX.utils.book_append_sheet(wb, detailsSheet, 'Detailed Changes');

        // Sheet 3: Delayed Activities Only
        const delayedData = [
            ['Activity ID', 'Activity Name', 'Delay (days)', 'Baseline Start', 'Current Start', 'Baseline Finish', 'Current Finish']
        ];

        comparisonResults.changes
            .filter(c => c.type === 'delayed')
            .forEach(item => {
                delayedData.push([
                    item.activity.id || '',
                    item.activity.name || '',
                    Math.abs(item.impact),
                    formatDateShort(item.baselineDates.start),
                    formatDateShort(item.currentDates.start),
                    formatDateShort(item.baselineDates.finish),
                    formatDateShort(item.currentDates.finish)
                ]);
            });

        if (delayedData.length > 1) {
            const delayedSheet = XLSX.utils.aoa_to_sheet(delayedData);
            XLSX.utils.book_append_sheet(wb, delayedSheet, 'Delayed Activities');
        }

        // Export file
        const fileName = `Comparison_${comparisonResults.baselineUpdate.name}_vs_${comparisonResults.currentUpdate.name}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    /**
     * Export to PDF (placeholder - requires jsPDF library)
     */
    const handleExportToPDF = () => {
        if (!comparisonResults) return;

        alert('📄 PDF Export\n\nPDF export requires jsPDF library.\n\nFor now, use Excel export which includes all variance data.\n\nWould you like to implement full PDF export with charts?');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full my-8">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <i className="fas fa-chart-line"></i>
                                Schedule Comparison & Variance Analysis
                            </h2>
                            <p className="text-blue-100 mt-1 text-sm">
                                Compare two updates to analyze delays, advances, and schedule changes
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-blue-800 rounded-full w-10 h-10 flex items-center justify-center transition"
                            title="Close"
                        >
                            <i className="fas fa-times text-xl"></i>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
                    {availableUpdates.length < 2 ? (
                        // Not enough updates
                        <div className="text-center py-12">
                            <i className="fas fa-exclamation-triangle text-6xl text-amber-500 mb-4"></i>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                Not Enough Updates
                            </h3>
                            <p className="text-gray-600 mb-6">
                                You need at least 2 updates with activities to perform comparison.
                            </p>
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition font-medium"
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Update Selection */}
                            <div className="bg-blue-50 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <i className="fas fa-calendar-alt text-blue-600"></i>
                                    Select Updates to Compare
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Baseline Update */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            📋 Baseline (Original):
                                        </label>
                                        <select
                                            value={baselineUpdateId || ''}
                                            onChange={(e) => {
                                                setBaselineUpdateId(parseInt(e.target.value));
                                                setShowResults(false);
                                            }}
                                            className="w-full px-4 py-3 rounded-lg border-2 border-blue-300 focus:border-blue-500 focus:outline-none font-medium bg-white"
                                        >
                                            {availableUpdates.map(update => (
                                                <option key={update.id} value={update.id}>
                                                    {update.name} ({update.activities.length} activities)
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">
                                            The reference schedule you want to compare against
                                        </p>
                                    </div>

                                    {/* Current Update */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            📋 Current (Revised):
                                        </label>
                                        <select
                                            value={currentUpdateId || ''}
                                            onChange={(e) => {
                                                setCurrentUpdateId(parseInt(e.target.value));
                                                setShowResults(false);
                                            }}
                                            className="w-full px-4 py-3 rounded-lg border-2 border-blue-300 focus:border-blue-500 focus:outline-none font-medium bg-white"
                                        >
                                            {availableUpdates.map(update => (
                                                <option key={update.id} value={update.id}>
                                                    {update.name} ({update.activities.length} activities)
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">
                                            The updated schedule you want to analyze
                                        </p>
                                    </div>
                                </div>

                                {/* Validation Warning */}
                                {baselineUpdateId === currentUpdateId && (
                                    <div className="mt-4 bg-amber-100 border-2 border-amber-400 rounded-lg p-3 flex items-start gap-3">
                                        <i className="fas fa-exclamation-triangle text-amber-600 mt-0.5"></i>
                                        <div className="flex-1">
                                            <p className="font-semibold text-amber-800">Same Update Selected</p>
                                            <p className="text-sm text-amber-700">
                                                Please select two different updates to compare.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Comparison Options */}
                            <div className="bg-gray-50 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <i className="fas fa-sliders-h text-gray-600"></i>
                                    Comparison Options
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Compare Type */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                                            🎯 Compare:
                                        </label>
                                        <div className="space-y-2">
                                            {[
                                                { value: 'start', label: 'Start Dates Only', desc: 'Compare when activities begin' },
                                                { value: 'finish', label: 'Finish Dates Only', desc: 'Compare when activities end' },
                                                { value: 'both', label: 'Both Start & Finish Dates', desc: 'Full analysis (recommended)' }
                                            ].map(option => (
                                                <label
                                                    key={option.value}
                                                    className={`flex items-center gap-3 p-3 bg-white rounded-lg border-2 cursor-pointer transition ${
                                                        compareType === option.value ? 'border-blue-400' : 'border-gray-200 hover:border-blue-300'
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="compareType"
                                                        value={option.value}
                                                        checked={compareType === option.value}
                                                        onChange={(e) => {
                                                            setCompareType(e.target.value);
                                                            setShowResults(false);
                                                        }}
                                                        className="w-4 h-4 text-blue-600"
                                                    />
                                                    <div className="flex-1">
                                                        <span className="font-medium">{option.label}</span>
                                                        <p className="text-xs text-gray-500">{option.desc}</p>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Duration Calculation */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                                            📅 Duration Calculation:
                                        </label>
                                        <div className="space-y-2">
                                            {[
                                                { value: 7, label: '7-Day Week', desc: 'All days (no rest - exploitative!)' },
                                                { value: 6, label: '6-Day Week', desc: 'Mon-Sat (Sunday rest)' },
                                                { value: 5, label: '5-Day Week', desc: 'Mon-Fri (weekend rest)' }
                                            ].map(option => (
                                                <label
                                                    key={option.value}
                                                    className={`flex items-center gap-3 p-3 bg-white rounded-lg border-2 cursor-pointer transition ${
                                                        workDaysPerWeek === option.value ? 'border-blue-400' : 'border-gray-200 hover:border-blue-300'
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="workDaysPerWeek"
                                                        value={option.value}
                                                        checked={workDaysPerWeek === option.value}
                                                        onChange={(e) => {
                                                            setWorkDaysPerWeek(parseInt(e.target.value));
                                                            setShowResults(false);
                                                        }}
                                                        className="w-4 h-4 text-blue-600"
                                                    />
                                                    <div className="flex-1">
                                                        <span className="font-medium">{option.label}</span>
                                                        <p className="text-xs text-gray-500">{option.desc}</p>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* View Mode */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                                            📊 Calendar View Mode:
                                        </label>
                                        <div className="space-y-2">
                                            {[
                                                { value: 'side-by-side', label: 'Side-by-Side Calendars', desc: 'Split view (recommended)' },
                                                { value: 'stacked', label: 'Stacked Bars', desc: 'Baseline top, Current bottom' },
                                                { value: 'arrows', label: 'Arrow Indicators', desc: 'Show shifts with arrows' }
                                            ].map(option => (
                                                <label
                                                    key={option.value}
                                                    className={`flex items-center gap-3 p-3 bg-white rounded-lg border-2 cursor-pointer transition ${
                                                        viewMode === option.value ? 'border-blue-400' : 'border-gray-200 hover:border-blue-300'
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="viewMode"
                                                        value={option.value}
                                                        checked={viewMode === option.value}
                                                        onChange={(e) => setViewMode(e.target.value)}
                                                        className="w-4 h-4 text-blue-600"
                                                    />
                                                    <div className="flex-1">
                                                        <span className="font-medium">{option.label}</span>
                                                        <p className="text-xs text-gray-500">{option.desc}</p>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {!showResults && (
                                <div className="flex items-center justify-between gap-4 pt-4">
                                    <button
                                        onClick={onClose}
                                        className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition font-semibold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleGenerateComparison}
                                        disabled={!canCompare}
                                        className={`px-8 py-3 rounded-lg transition font-semibold text-white ${
                                            canCompare
                                                ? 'bg-blue-600 hover:bg-blue-700'
                                                : 'bg-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        <i className="fas fa-chart-line mr-2"></i>
                                        Generate Comparison Report
                                    </button>
                                </div>
                            )}

                            {/* Results Section */}
                            {showResults && comparisonResults && (
                                <div className="space-y-6">
                                    {/* Metrics Dashboard */}
                                    <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl p-6 text-white">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xl font-bold flex items-center gap-2">
                                                <i className="fas fa-chart-bar"></i>
                                                Variance Metrics Dashboard
                                            </h3>
                                            <div className="text-xs bg-white bg-opacity-20 px-3 py-1 rounded-full">
                                                📅 {comparisonResults.workDaysPerWeek}-day week
                                                {comparisonResults.workDaysPerWeek === 7 ? '(all days - no rest)' :
                                                 comparisonResults.workDaysPerWeek === 6 ? '(Mon-Sat, Sunday rest)' :
                                                 '(Mon-Fri, weekend rest)'}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {/* Delayed */}
                                            <div className="bg-red-500 bg-opacity-20 backdrop-blur-sm rounded-lg p-4 border border-red-400">
                                                <div className="text-red-200 text-sm mb-1">🔴 Delayed</div>
                                                <div className="text-3xl font-bold">{comparisonResults.metrics.delayedCount}</div>
                                                <div className="text-xs text-red-200 mt-1">+{comparisonResults.metrics.avgDelay} days avg</div>
                                            </div>

                                            {/* Advanced */}
                                            <div className="bg-green-500 bg-opacity-20 backdrop-blur-sm rounded-lg p-4 border border-green-400">
                                                <div className="text-green-200 text-sm mb-1">🟢 Advanced</div>
                                                <div className="text-3xl font-bold">{comparisonResults.metrics.advancedCount}</div>
                                                <div className="text-xs text-green-200 mt-1">-{comparisonResults.metrics.avgAdvance} days avg</div>
                                            </div>

                                            {/* Duration Changes */}
                                            <div className="bg-amber-500 bg-opacity-20 backdrop-blur-sm rounded-lg p-4 border border-amber-400">
                                                <div className="text-amber-200 text-sm mb-1">🟡 Duration Δ</div>
                                                <div className="text-3xl font-bold">{comparisonResults.metrics.durationChangeCount}</div>
                                                <div className="text-xs text-amber-200 mt-1">{comparisonResults.metrics.avgDurationDelta > 0 ? '+' : ''}{comparisonResults.metrics.avgDurationDelta} days avg</div>
                                            </div>

                                            {/* Schedule Health */}
                                            <div className="bg-blue-500 bg-opacity-20 backdrop-blur-sm rounded-lg p-4 border border-blue-400">
                                                <div className="text-blue-200 text-sm mb-1">📊 On Track</div>
                                                <div className="text-3xl font-bold">{comparisonResults.metrics.scheduleHealth}%</div>
                                                <div className="text-xs text-blue-200 mt-1">{comparisonResults.metrics.onTrackCount} activities</div>
                                            </div>

                                            {/* New Activities */}
                                            <div className="bg-blue-500 bg-opacity-20 backdrop-blur-sm rounded-lg p-4 border border-blue-400">
                                                <div className="text-blue-200 text-sm mb-1">🔵 New</div>
                                                <div className="text-3xl font-bold">{comparisonResults.metrics.newActivitiesCount}</div>
                                                <div className="text-xs text-blue-200 mt-1">Added activities</div>
                                            </div>

                                            {/* Removed Activities */}
                                            <div className="bg-gray-500 bg-opacity-20 backdrop-blur-sm rounded-lg p-4 border border-gray-400">
                                                <div className="text-gray-200 text-sm mb-1">⚫ Removed</div>
                                                <div className="text-3xl font-bold">{comparisonResults.metrics.removedActivitiesCount}</div>
                                                <div className="text-xs text-gray-200 mt-1">Deleted activities</div>
                                            </div>

                                            {/* Total Changes */}
                                            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 border border-white border-opacity-30 col-span-2">
                                                <div className="text-gray-100 text-sm mb-1">📋 Total Activities</div>
                                                <div className="text-3xl font-bold">{comparisonResults.metrics.totalActivities}</div>
                                                <div className="text-xs text-gray-200 mt-1">{comparisonResults.metrics.totalChanges} with changes</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Filters */}
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-gray-700">Filter:</span>
                                            {[
                                                { value: 'all', label: 'All Changes', icon: '📋', count: comparisonResults.allActivities.length },
                                                { value: 'delayed', label: 'Delayed Only', icon: '🔴', count: comparisonResults.metrics.delayedCount },
                                                { value: 'advanced', label: 'Advanced Only', icon: '🟢', count: comparisonResults.metrics.advancedCount },
                                                { value: 'duration_change', label: 'Duration Δ', icon: '🟡', count: comparisonResults.metrics.durationChangeCount },
                                                { value: 'new', label: 'New', icon: '🔵', count: comparisonResults.metrics.newActivitiesCount },
                                                { value: 'removed', label: 'Removed', icon: '⚫', count: comparisonResults.metrics.removedActivitiesCount }
                                            ].map(filter => (
                                                <button
                                                    key={filter.value}
                                                    onClick={() => setFilterType(filter.value)}
                                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                                                        filterType === filter.value
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-white text-gray-700 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    {filter.icon} {filter.label} ({filter.count})
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Detailed Changes List */}
                                    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                                        <div className="bg-gray-50 p-4 border-b-2 border-gray-200">
                                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                                <i className="fas fa-list-ul"></i>
                                                Detailed Variance List ({filteredActivities.length} activities)
                                            </h3>
                                        </div>

                                        <div className="max-h-96 overflow-y-auto">
                                            {filteredActivities.length === 0 ? (
                                                <div className="text-center py-12 text-gray-500">
                                                    No activities match the selected filter.
                                                </div>
                                            ) : (
                                                <table className="w-full">
                                                    <thead className="bg-gray-100 sticky top-0">
                                                        <tr className="text-left text-sm font-semibold text-gray-700">
                                                            <th className="p-3">Status</th>
                                                            <th className="p-3">Activity ID</th>
                                                            <th className="p-3">Activity Name</th>
                                                            <th className="p-3">Impact</th>
                                                            <th className="p-3">Baseline Dates</th>
                                                            <th className="p-3">Current Dates</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {filteredActivities.map((item, index) => {
                                                            const activity = item.activity || item.baselineActivity;
                                                            return (
                                                                <tr
                                                                    key={index}
                                                                    className="border-b border-gray-100 hover:bg-gray-50 transition"
                                                                >
                                                                    <td className="p-3">
                                                                        <span className="text-2xl">{item.status}</span>
                                                                    </td>
                                                                    <td className="p-3 font-mono text-sm">{activity.id || 'N/A'}</td>
                                                                    <td className="p-3 font-medium">{activity.name || 'N/A'}</td>
                                                                    <td className="p-3">
                                                                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold text-white ${getImpactColor(item.impact || 0, item.type || '')}`}>
                                                                            {formatImpact(item.impact || 0, item.type || '')}
                                                                        </span>
                                                                    </td>
                                                                    <td className="p-3 text-sm">
                                                                        {item.baselineDates ? (
                                                                            <>
                                                                                <div>{formatDateShort(item.baselineDates.start)}</div>
                                                                                <div className="text-gray-500">to {formatDateShort(item.baselineDates.finish)}</div>
                                                                            </>
                                                                        ) : item.type === 'removed' ? (
                                                                            <>
                                                                                <div>{formatDateShort(activity.start)}</div>
                                                                                <div className="text-gray-500">to {formatDateShort(activity.finish)}</div>
                                                                            </>
                                                                        ) : (
                                                                            <span className="text-gray-400">N/A</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="p-3 text-sm">
                                                                        {item.currentDates ? (
                                                                            <>
                                                                                <div>{formatDateShort(item.currentDates.start)}</div>
                                                                                <div className="text-gray-500">to {formatDateShort(item.currentDates.finish)}</div>
                                                                            </>
                                                                        ) : item.type === 'new' ? (
                                                                            <>
                                                                                <div>{formatDateShort(activity.start)}</div>
                                                                                <div className="text-gray-500">to {formatDateShort(activity.finish)}</div>
                                                                            </>
                                                                        ) : (
                                                                            <span className="text-gray-400">N/A</span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </div>

                                    {/* Export and Action Buttons */}
                                    <div className="flex items-center justify-between gap-4 pt-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleExportToExcel}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium text-sm"
                                            >
                                                <i className="fas fa-file-excel mr-2"></i>
                                                Export to Excel
                                            </button>
                                            <button
                                                onClick={handleExportToPDF}
                                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium text-sm"
                                            >
                                                <i className="fas fa-file-pdf mr-2"></i>
                                                Export to PDF
                                            </button>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setShowResults(false)}
                                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition font-medium text-sm"
                                            >
                                                <i className="fas fa-redo mr-2"></i>
                                                New Comparison
                                            </button>
                                            <button
                                                onClick={onClose}
                                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

window.ComparisonModal = ComparisonModal;

/**
 * Configure Activity ID Codes Modal Component
 *
 * Allows users to customize Activity ID code meanings:
 * - Area codes (E, D, C, B, F, etc.) with name and color
 * - Floor codes (LL, 01, 02, RF, etc.) with custom names
 * - Zone codes (INT, K, BAT, etc.) with custom names
 *
 * Includes visual ID pattern diagram showing: E - LL - INT - 1230
 *
 * @param {Object} props
 * @param {Function} props.onClose - Callback to close modal
 * @param {Object} props.areaConfig - Area configuration object
 * @param {Object} props.idPatternConfig - ID pattern configuration (floors, zones)
 * @param {Function} props.onSave - Callback to save configuration
 */


function ConfigureCodesModal({ onClose, areaConfig, idPatternConfig, onSave }) {
    const [areas, setAreas] = useState({ ...areaConfig });
    const [floors, setFloors] = useState({ ...idPatternConfig.floors });
    const [zones, setZones] = useState({ ...idPatternConfig.zones });
    const [selectedTab, setSelectedTab] = useState('areas'); // 'areas', 'floors', 'zones'

    const handleSave = () => {
        onSave({
            areas,
            idPatternConfig: {
                floors,
                zones
            }
        });
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content glass rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-bold text-gray-800">
                        <i className="fas fa-cog mr-3 text-purple-600"></i>
                        Configure Activity ID Codes
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Info Banner with Visual ID Pattern */}
                <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-3 mb-4">
                    <div className="flex items-start gap-3">
                        <i className="fas fa-info-circle text-blue-600 text-lg mt-0.5"></i>
                        <div className="flex-1">
                            <p className="text-xs text-blue-800 mb-2">
                                Activity IDs follow this pattern - customize what each code means:
                            </p>
                            <div className="bg-white rounded-lg p-3 border border-blue-200">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <span className="text-xl font-bold text-purple-700 font-mono">E</span>
                                    <span className="text-xl font-bold text-gray-400">-</span>
                                    <span className="text-xl font-bold text-indigo-700 font-mono">LL</span>
                                    <span className="text-xl font-bold text-gray-400">-</span>
                                    <span className="text-xl font-bold text-teal-700 font-mono">INT</span>
                                    <span className="text-xl font-bold text-gray-400">-</span>
                                    <span className="text-xl font-bold text-gray-600 font-mono">1230</span>
                                </div>
                                <div className="flex items-start justify-center gap-6 text-[10px]">
                                    <div className="w-8 text-center">
                                        <div className="text-purple-600 font-bold mb-0.5">↑</div>
                                        <div className="text-purple-700 font-semibold leading-tight">Area</div>
                                    </div>
                                    <div className="w-10"></div>
                                    <div className="w-10 text-center">
                                        <div className="text-indigo-600 font-bold mb-0.5">↑</div>
                                        <div className="text-indigo-700 font-semibold leading-tight">Floor</div>
                                    </div>
                                    <div className="w-10"></div>
                                    <div className="w-12 text-center">
                                        <div className="text-teal-600 font-bold mb-0.5">↑</div>
                                        <div className="text-teal-700 font-semibold leading-tight">Zone</div>
                                    </div>
                                    <div className="w-10"></div>
                                    <div className="w-16 text-center">
                                        <div className="text-gray-600 font-bold mb-0.5">↑</div>
                                        <div className="text-gray-700 font-semibold leading-tight">Number</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b-2 border-gray-200">
                    <button
                        onClick={() => setSelectedTab('areas')}
                        className={`px-6 py-3 font-semibold transition ${
                            selectedTab === 'areas'
                                ? 'text-purple-600 border-b-4 border-purple-600 -mb-0.5'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <i className="fas fa-map-marker-alt mr-2"></i>
                        Areas
                    </button>
                    <button
                        onClick={() => setSelectedTab('floors')}
                        className={`px-6 py-3 font-semibold transition ${
                            selectedTab === 'floors'
                                ? 'text-purple-600 border-b-4 border-purple-600 -mb-0.5'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <i className="fas fa-layer-group mr-2"></i>
                        Floors
                    </button>
                    <button
                        onClick={() => setSelectedTab('zones')}
                        className={`px-6 py-3 font-semibold transition ${
                            selectedTab === 'zones'
                                ? 'text-purple-600 border-b-4 border-purple-600 -mb-0.5'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <i className="fas fa-th-large mr-2"></i>
                        Zones
                    </button>
                </div>

                {/* Areas Tab */}
                {selectedTab === 'areas' && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Area Codes</h3>
                        {Object.keys(areas).map(code => (
                            <div key={code} className="flex items-center gap-4 p-4 bg-white rounded-lg border-2 border-gray-200">
                                <div className="w-20 font-mono font-bold text-lg text-gray-800">{code}</div>
                                <i className="fas fa-arrow-right text-gray-400"></i>
                                <input
                                    type="text"
                                    value={areas[code].name}
                                    onChange={(e) => setAreas({
                                        ...areas,
                                        [code]: { ...areas[code], name: e.target.value }
                                    })}
                                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                                    placeholder="e.g., Area E, Dock, Loading Zone"
                                />
                                <input
                                    type="color"
                                    value={areas[code].color}
                                    onChange={(e) => setAreas({
                                        ...areas,
                                        [code]: { ...areas[code], color: e.target.value }
                                    })}
                                    className="w-16 h-10 rounded cursor-pointer"
                                    title="Choose color"
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Floors Tab */}
                {selectedTab === 'floors' && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Floor Codes</h3>
                        {Object.keys(floors).map(code => (
                            <div key={code} className="flex items-center gap-4 p-4 bg-white rounded-lg border-2 border-gray-200">
                                <div className="w-20 font-mono font-bold text-lg text-gray-800">{code}</div>
                                <i className="fas fa-arrow-right text-gray-400"></i>
                                <input
                                    type="text"
                                    value={floors[code]}
                                    onChange={(e) => setFloors({
                                        ...floors,
                                        [code]: e.target.value
                                    })}
                                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                                    placeholder="e.g., 1st Floor, Zone 1, Lower Level"
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Zones Tab */}
                {selectedTab === 'zones' && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Zone Codes</h3>
                        {Object.keys(zones).map(code => (
                            <div key={code} className="flex items-center gap-4 p-4 bg-white rounded-lg border-2 border-gray-200">
                                <div className="w-20 font-mono font-bold text-lg text-gray-800">{code}</div>
                                <i className="fas fa-arrow-right text-gray-400"></i>
                                <input
                                    type="text"
                                    value={zones[code]}
                                    onChange={(e) => setZones({
                                        ...zones,
                                        [code]: e.target.value
                                    })}
                                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                                    placeholder="e.g., Interior, Kitchen, Loading Zone"
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-8 pt-6 border-t-2 border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-gray-300 hover:bg-gray-400 rounded-lg transition font-medium"
                    >
                        <i className="fas fa-times mr-2"></i>
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium"
                    >
                        <i className="fas fa-save mr-2"></i>
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Import Wizard Modal Component
 *
 * 4-step wizard for importing Excel data:
 * 1. Upload Excel file
 * 2. Map columns to fields
 * 3. Configure keyword filters
 * 4. Preview and confirm import
 *
 * Features:
 * - Auto-parsing of Activity IDs to extract Area/Floor/Zone
 * - Saved filter presets per update
 * - Bulk keyword import
 * - Excel date conversion to MM/DD/YY format
 *
 * @param {Object} props
 * @param {Function} props.onClose - Callback to close modal
 * @param {Function} props.onComplete - Callback when import completes
 * @param {Object} props.currentUpdate - Current update object
 * @param {Function} props.onSaveFilters - Callback to save filter configuration
 */


// Import utilities that will be available globally
// These are defined in the main app or imported modules

function ImportWizard({ onClose, onComplete, currentUpdate, onSaveFilters, customHeaders, onSaveCustomHeaders }) {
    const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Filter, 4: Preview
    const [excelData, setExcelData] = useState(null);
    const [headers, setHeaders] = useState([]);
    const [columnMapping, setColumnMapping] = useState({});

    // Auto-load saved filters from current update
    const savedFilters = currentUpdate?.savedFilters;
    const [filterConfig, setFilterConfig] = useState(
        savedFilters || {
            field: 'name',
            keywords: []
        }
    );
    const [keywordInput, setKeywordInput] = useState('');
    const [bulkKeywordInput, setBulkKeywordInput] = useState('');
    const [previewData, setPreviewData] = useState([]);
    const fileInputRef = useRef(null);

    // Custom headers state (local copy that will be saved when mapping is complete)
    const [localCustomHeaders, setLocalCustomHeaders] = useState([...customHeaders]);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = new Uint8Array(evt.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

                if (jsonData.length > 0) {
                    const excelHeaders = jsonData[0];
                    setHeaders(excelHeaders);
                    setExcelData(jsonData.slice(1));

                    // Auto-detect column mapping based on keywords
                    const autoMapping = {};
                    FIELD_DEFINITIONS.forEach(field => {
                        const fieldKeywords = field.keywords || [field.key, field.label.toLowerCase()];

                        // Find matching Excel column
                        const matchedIndex = excelHeaders.findIndex(header => {
                            const headerLower = (header || '').toString().toLowerCase().trim();
                            return fieldKeywords.some(keyword =>
                                headerLower.includes(keyword.toLowerCase()) ||
                                keyword.toLowerCase().includes(headerLower)
                            );
                        });

                        if (matchedIndex !== -1) {
                            autoMapping[field.key] = matchedIndex;
                        }
                    });

                    setColumnMapping(autoMapping);
                    setStep(2);
                }
            } catch (error) {
                alert('Error reading file: ' + error.message);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleMappingComplete = () => {
        // Validate required fields are mapped
        const requiredFields = FIELD_DEFINITIONS.filter(f => f.required);
        const missingFields = requiredFields.filter(f => columnMapping[f.key] === undefined);

        if (missingFields.length > 0) {
            alert(`Please map required fields: ${missingFields.map(f => f.label).join(', ')}`);
            return;
        }

        // Save custom headers
        if (onSaveCustomHeaders) {
            onSaveCustomHeaders(localCustomHeaders);
        }

        // Continue to next step (restore original logic after save)
        const requiredFieldsCheck = FIELD_DEFINITIONS.filter(f => f.required);
        const missingFieldsCheck = requiredFieldsCheck.filter(f => columnMapping[f.key] === undefined);

        if (missingFieldsCheck.length > 0) {
            return; // Already alerted above
        }

        setStep(3);
    };

    const addKeyword = () => {
        if (keywordInput.trim() && !filterConfig.keywords.includes(keywordInput.trim())) {
            setFilterConfig({
                ...filterConfig,
                keywords: [...filterConfig.keywords, keywordInput.trim()]
            });
            setKeywordInput('');
        }
    };

    const removeKeyword = (keyword) => {
        setFilterConfig({
            ...filterConfig,
            keywords: filterConfig.keywords.filter(k => k !== keyword)
        });
    };

    const handleBulkAdd = () => {
        if (!bulkKeywordInput.trim()) return;

        // Robust cleaning: Handle Excel wrapped text with line breaks + multiple spaces
        // Converts ANY whitespace sequence (spaces, tabs, newlines) into single space
        const cleanedInput = bulkKeywordInput
            .replace(/\s+/g, ' ')  // Normalize all whitespace to single space
            .trim();               // Remove leading/trailing whitespace

        // Parse by comma or semicolon (primary separators)
        const allKeywords = cleanedInput
            .split(/[,;]+/)
            .map(k => k.trim())
            .filter(k => k.length > 0);

        // Filter out duplicates (only add new keywords)
        const newKeywords = allKeywords.filter(k => !filterConfig.keywords.includes(k));
        const duplicateCount = allKeywords.length - newKeywords.length;

        if (newKeywords.length > 0) {
            setFilterConfig({
                ...filterConfig,
                keywords: [...filterConfig.keywords, ...newKeywords]
            });
            setBulkKeywordInput('');

            // Smart notification message
            if (duplicateCount > 0) {
                alert(`✅ Added ${newKeywords.length} new keywords successfully!\n\n` +
                      `ℹ️ Skipped ${duplicateCount} duplicates (already in list)`);
            } else {
                alert(`✅ Added ${newKeywords.length} keywords successfully!`);
            }
        } else {
            alert('⚠️ No new keywords to add.\n\n' +
                  'All keywords are already in the list (same update = no duplicates).\n' +
                  'If you\'re working on a NEW update, create it first!');
        }
    };

    // Convert Excel serial date to MM/DD/YY format
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

    const applyFiltersAndPreview = () => {
        // Check if user typed keywords but didn't click "Add All Keywords"
        if (bulkKeywordInput.trim().length > 0 && filterConfig.keywords.length === 0) {
            const confirmed = confirm(
                '⚠️ ATENCIÓN: Escribiste keywords en el textarea pero NO hiciste click en "Add All Keywords".\n\n' +
                'Si continúas SIN agregar filtros, se importarán TODAS las actividades del Excel.\n\n' +
                '¿Quieres continuar sin filtros y ver TODAS las actividades?'
            );
            if (!confirmed) {
                return; // User wants to go back and add the keywords
            }
        }

        // Check if user typed a single keyword but didn't click "Add"
        if (keywordInput.trim().length > 0 && filterConfig.keywords.length === 0) {
            const confirmed = confirm(
                '⚠️ ATENCIÓN: Escribiste un keyword pero NO hiciste click en "Add".\n\n' +
                'Si continúas SIN agregar filtros, se importarán TODAS las actividades del Excel.\n\n' +
                '¿Quieres continuar sin filtros y ver TODAS las actividades?'
            );
            if (!confirmed) {
                return; // User wants to go back and add the keyword
            }
        }

        // Convert excel data to activities
        const activities = excelData.map((row, idx) => {
            const activity = {
                _originalIndex: idx,
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

                // Set value
                activity[fieldKey] = value;
            });

            // 🆕 AUTO-PARSE ACTIVITY ID to extract Area, Floor, Zone
            if (activity.id) {
                const parsed = parseActivityID(activity.id);

                // Apply parsed values (parsed area always overrides default)
                if (parsed.area) {
                    activity.area = parsed.area;
                }
                if (parsed.floor) {
                    activity.floor = parsed.floor; // Decoded (e.g., "Lower Level")
                    activity.rawFloor = parsed.rawFloor; // Raw (e.g., "LL")
                }
                if (parsed.zone) {
                    activity.zone = parsed.zone; // Decoded (e.g., "Interior")
                    activity.rawZone = parsed.rawZone; // Raw (e.g., "INT")
                }
                if (parsed.number) {
                    activity.activityNumber = parsed.number; // Activity number
                }
            }

            return activity;
        }).filter(activity => {
            // Only require ID and Name - dates are optional
            return activity.id && activity.name;
        });

        // Apply keyword filters
        let filtered = activities;
        if (filterConfig.keywords.length > 0) {
            console.log('🔍 Filtering with config:', {
                field: filterConfig.field,
                keywords: filterConfig.keywords,
                totalActivities: activities.length
            });

            filtered = activities.filter(activity => {
                const fieldValue = String(activity[filterConfig.field] || '').toLowerCase();
                const matches = filterConfig.keywords.some(keyword =>
                    fieldValue.includes(keyword.toLowerCase())
                );

                // Debug first 3 activities
                if (activities.indexOf(activity) < 3) {
                    console.log(`Activity ${activity.id}:`, {
                        fieldValue,
                        matches
                    });
                }

                return matches;
            });

            console.log(`✅ Filtered: ${filtered.length} of ${activities.length} activities match`);
        }

        setPreviewData(filtered);
        setStep(4);
    };

    const handleConfirmImport = () => {
        // Save filters used for this import
        if (filterConfig.keywords.length > 0 && onSaveFilters) {
            onSaveFilters(filterConfig);
        }

        onComplete(previewData, currentUpdate.id);
        onClose();
    };

    const handleRetry = () => {
        setStep(3);
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content glass rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
                {/* Step Indicator */}
                <div className="step-indicator mb-8">
                    <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                        <div className="step-circle">
                            {step > 1 ? <i className="fas fa-check"></i> : '1'}
                        </div>
                        <div className="text-sm font-medium">Upload</div>
                        {step < 4 && <div className="step-line"></div>}
                    </div>
                    <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                        <div className="step-circle">
                            {step > 2 ? <i className="fas fa-check"></i> : '2'}
                        </div>
                        <div className="text-sm font-medium">Map Columns</div>
                        {step < 4 && <div className="step-line"></div>}
                    </div>
                    <div className={`step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
                        <div className="step-circle">
                            {step > 3 ? <i className="fas fa-check"></i> : '3'}
                        </div>
                        <div className="text-sm font-medium">Filter</div>
                        {step < 4 && <div className="step-line"></div>}
                    </div>
                    <div className={`step ${step >= 4 ? 'active' : ''}`}>
                        <div className="step-circle">4</div>
                        <div className="text-sm font-medium">Preview</div>
                    </div>
                </div>

                {/* Step 1: Upload */}
                {step === 1 && (
                    <div className="fade-in">
                        <h2 className="text-2xl font-bold mb-6">
                            <i className="fas fa-upload mr-3 text-slate-600"></i>
                            Import Excel File
                        </h2>
                        <div
                            className="border-4 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-slate-500 transition"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <i className="fas fa-file-excel text-6xl text-green-600 mb-4"></i>
                            <p className="text-lg font-semibold mb-2">Click to select Excel file</p>
                            <p className="text-sm text-gray-500">Supports .xlsx, .xls</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </div>
                        <div className="flex justify-end mt-6">
                            <button onClick={onClose} className="px-6 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg transition">
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Column Mapping */}
                {step === 2 && (
                    <div className="fade-in">
                        <h2 className="text-2xl font-bold mb-6">
                            <i className="fas fa-columns mr-3 text-slate-600"></i>
                            Map Columns
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Map your Excel columns to system fields
                        </p>

                        {/* Preset Fields Mapping */}
                        <div className="space-y-4 max-h-96 overflow-y-auto mb-6">
                            {FIELD_DEFINITIONS.map(field => (
                                <div key={field.key} className="flex items-center gap-4">
                                    <div className="w-48 font-semibold text-gray-700">
                                        {field.label}
                                        {field.required && <span className="text-red-500 ml-1">*</span>}
                                    </div>
                                    <select
                                        value={columnMapping[field.key] ?? ''}
                                        onChange={(e) => setColumnMapping({
                                            ...columnMapping,
                                            [field.key]: e.target.value !== '' ? parseInt(e.target.value) : undefined
                                        })}
                                        className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-slate-500 focus:outline-none"
                                    >
                                        <option value="">-- Select column --</option>
                                        {headers.map((header, idx) => (
                                            <option key={idx} value={idx}>{header}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>

                        {/* Unmapped Columns Section */}
                        {(() => {
                            // Get all mapped column indices
                            const mappedIndices = new Set(Object.values(columnMapping).filter(v => v !== undefined));

                            // Get unmapped Excel columns
                            const unmappedColumns = headers
                                .map((header, idx) => ({ header, idx }))
                                .filter(({ idx }) => !mappedIndices.has(idx));

                            if (unmappedColumns.length > 0) {
                                return (
                                    <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6 mb-6">
                                        <h3 className="text-lg font-bold text-gray-800 mb-4">
                                            <i className="fas fa-question-circle mr-2 text-purple-600"></i>
                                            Unmapped Excel Columns ({unmappedColumns.length})
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-4">
                                            These columns from your Excel file aren't mapped to any preset field. You can add them as custom columns for filtering.
                                        </p>

                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {unmappedColumns.map(({ header, idx }) => {
                                                const isAdded = localCustomHeaders.some(h => h.key === header.toLowerCase().replace(/\s+/g, '_'));

                                                return (
                                                    <div key={idx} className="flex items-center justify-between bg-white border-2 border-purple-200 rounded-lg p-3">
                                                        <div className="flex-1">
                                                            <div className="font-semibold text-gray-800">{header}</div>
                                                            <div className="text-xs text-gray-500">
                                                                Excel Column {String.fromCharCode(65 + idx)}
                                                            </div>
                                                        </div>

                                                        {!isAdded ? (
                                                            <button
                                                                onClick={() => {
                                                                    const newHeader = {
                                                                        key: header.toLowerCase().replace(/\s+/g, '_'),
                                                                        label: header
                                                                    };
                                                                    setLocalCustomHeaders([...localCustomHeaders, newHeader]);

                                                                    // Also add to column mapping automatically
                                                                    setColumnMapping({
                                                                        ...columnMapping,
                                                                        [newHeader.key]: idx
                                                                    });
                                                                }}
                                                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition"
                                                            >
                                                                <i className="fas fa-plus mr-2"></i>
                                                                Add Column
                                                            </button>
                                                        ) : (
                                                            <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                                                                <i className="fas fa-check mr-2"></i>
                                                                Added
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        })()}

                        {/* Current Custom Headers */}
                        {localCustomHeaders.length > 0 && (
                            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">
                                    <i className="fas fa-list mr-2 text-blue-600"></i>
                                    Custom Columns ({localCustomHeaders.length})
                                </h3>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {localCustomHeaders.map((header) => (
                                        <div key={header.key} className="flex items-center justify-between bg-white border-2 border-blue-200 rounded-lg p-3">
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-800">{header.label}</div>
                                                <div className="text-xs text-gray-500">
                                                    Key: <code className="bg-gray-100 px-2 py-0.5 rounded">{header.key}</code>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setLocalCustomHeaders(localCustomHeaders.filter(h => h.key !== header.key));
                                                    // Remove from column mapping
                                                    const newMapping = { ...columnMapping };
                                                    delete newMapping[header.key];
                                                    setColumnMapping(newMapping);
                                                }}
                                                className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between mt-6">
                            <button onClick={() => setStep(1)} className="px-6 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg transition">
                                <i className="fas fa-arrow-left mr-2"></i>
                                Back
                            </button>
                            <button onClick={handleMappingComplete} className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition">
                                Continue
                                <i className="fas fa-arrow-right ml-2"></i>
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Filter Configuration - PARTE 1 */}
                {step === 3 && (
                    <div className="fade-in">
                        <h2 className="text-2xl font-bold mb-4">
                            <i className="fas fa-filter mr-3 text-slate-600"></i>
                            Configure Filters
                        </h2>

                        {/* Saved Filters Indicator */}
                        {savedFilters && savedFilters.keywords.length > 0 && (
                            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-4">
                                <div className="flex items-start">
                                    <i className="fas fa-magic text-blue-600 text-xl mr-3 mt-1"></i>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-800 mb-1">
                                            🎯 Filters Auto-Loaded from {currentUpdate.name}
                                        </h4>
                                        <p className="text-sm text-gray-700 mb-2">
                                            We've automatically loaded the filters you used last time to save you time!
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="text-xs text-gray-600">Field:</span>
                                            <span className="px-2 py-0.5 bg-blue-200 text-blue-800 rounded text-xs font-medium">
                                                {FIELD_DEFINITIONS.find(f => f.key === savedFilters.field)?.label}
                                            </span>
                                            <span className="text-xs text-gray-600 ml-2">Keywords:</span>
                                            {savedFilters.keywords.map((kw, idx) => (
                                                <span key={idx} className="px-2 py-0.5 bg-blue-200 text-blue-800 rounded text-xs font-medium">
                                                    {kw}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <p className="text-gray-600 mb-6">
                            Filter activities by keywords (optional - leave empty to import all)
                        </p>

                        <div className="mb-6">
                            <label className="block font-semibold mb-2">Field to filter:</label>
                            <select
                                value={filterConfig.field}
                                onChange={(e) => setFilterConfig({ ...filterConfig, field: e.target.value })}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-slate-500 focus:outline-none"
                            >
                                {FIELD_DEFINITIONS.filter(f => columnMapping[f.key] !== undefined).map(field => (
                                    <option key={field.key} value={field.key}>{field.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-6">
                            <label className="block font-semibold mb-2">Keywords:</label>

                            {/* Single Keyword Input */}
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={keywordInput}
                                    onChange={(e) => setKeywordInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                                    placeholder="Type a keyword..."
                                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-slate-500 focus:outline-none"
                                />
                                <button
                                    onClick={addKeyword}
                                    className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition"
                                >
                                    <i className="fas fa-plus mr-2"></i>
                                    Add
                                </button>
                            </div>

                            {/* Bulk Keyword Input */}
                            <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <i className="fas fa-layer-group mr-2 text-blue-600"></i>
                                    Or paste multiple keywords (separated by COMMA):
                                </label>
                                <textarea
                                    value={bulkKeywordInput}
                                    onChange={(e) => setBulkKeywordInput(e.target.value)}
                                    placeholder="Example: DROP CEILING TILE, INSTALL CEILING GRID, FRAME HARD CEILINGS, PRIME/FIRST COAT PAINT"
                                    rows="4"
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none font-mono text-sm"
                                />
                                <button
                                    onClick={handleBulkAdd}
                                    className="mt-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                                >
                                    <i className="fas fa-layer-group mr-2"></i>
                                    Add All Keywords
                                </button>
                            </div>

                            {filterConfig.keywords.length > 0 && (
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-gray-600 font-medium">
                                            {filterConfig.keywords.length} keyword(s) added
                                        </span>
                                        <button
                                            onClick={() => setFilterConfig({ ...filterConfig, keywords: [] })}
                                            className="text-xs px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded transition"
                                        >
                                            <i className="fas fa-trash mr-1"></i>
                                            Clear All
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {filterConfig.keywords.map((keyword, idx) => (
                                            <div key={idx} className="keyword-badge">
                                                {keyword}
                                                <button onClick={() => removeKeyword(keyword)}>
                                                    <i className="fas fa-times"></i>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <i className="fas fa-info-circle text-blue-600 mr-2"></i>
                            <span className="text-sm text-blue-800">
                                Activities containing <strong>any</strong> of these keywords in "{FIELD_DEFINITIONS.find(f => f.key === filterConfig.field)?.label}" will be imported.
                                {filterConfig.keywords.length === 0 && " No filters will import ALL activities."}
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <button onClick={() => setStep(2)} className="px-6 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg transition">
                                <i className="fas fa-arrow-left mr-2"></i>
                                Back
                            </button>
                            <button onClick={applyFiltersAndPreview} className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition">
                                Preview
                                <i className="fas fa-arrow-right ml-2"></i>
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Preview */}
                {step === 4 && (
                    <div className="fade-in">
                        <h2 className="text-2xl font-bold mb-6">
                            <i className="fas fa-eye mr-3 text-slate-600"></i>
                            Import Preview
                        </h2>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <i className="fas fa-check-circle text-green-600 mr-2"></i>
                                    <span className="font-semibold text-green-800">
                                        {previewData.length} activities will be imported
                                    </span>
                                </div>
                                {filterConfig.keywords.length > 0 && (
                                    <div className="text-sm text-green-700">
                                        Filtered by: {filterConfig.keywords.join(', ')}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="max-h-96 overflow-auto border-2 border-gray-200 rounded-lg">
                            <table className="w-full">
                                <thead className="bg-gray-100 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-sm font-semibold">#</th>
                                        <th className="px-4 py-2 text-left text-sm font-semibold">ID</th>
                                        <th className="px-4 py-2 text-left text-sm font-semibold">Name</th>
                                        <th className="px-4 py-2 text-left text-sm font-semibold">Start</th>
                                        <th className="px-4 py-2 text-left text-sm font-semibold">Finish</th>
                                        <th className="px-4 py-2 text-left text-sm font-semibold">Duration</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.slice(0, 50).map((activity, idx) => (
                                        <tr key={idx} className="border-t hover:bg-gray-50">
                                            <td className="px-4 py-2 text-sm">{idx + 1}</td>
                                            <td className="px-4 py-2 text-sm font-mono">{activity.id}</td>
                                            <td className="px-4 py-2 text-sm">{activity.name}</td>
                                            <td className="px-4 py-2 text-sm">{activity.start}</td>
                                            <td className="px-4 py-2 text-sm">{activity.finish}</td>
                                            <td className="px-4 py-2 text-sm">{activity.rem_duration || activity.original_duration}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {previewData.length > 50 && (
                                <div className="bg-gray-100 p-3 text-center text-sm text-gray-600">
                                    Showing 50 of {previewData.length} activities...
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between mt-6">
                            <button onClick={handleRetry} className="px-6 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg transition">
                                <i className="fas fa-redo mr-2"></i>
                                Retry Filters
                            </button>
                            <button onClick={handleConfirmImport} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-semibold">
                                <i className="fas fa-check mr-2"></i>
                                Confirm & Import
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Marker Legend Component - Compact Version
 * Simple horizontal legend showing marker types
 */

function MarkerLegend() {
    const markerTypes = [
        { name: 'Milestone', icon: 'fas fa-gem', color: '#f59e0b' },
        { name: 'Critical Path', icon: 'fas fa-exclamation-triangle', color: '#ef4444' },
        { name: 'Inspection Point', icon: 'fas fa-clipboard-check', color: '#10b981' },
        { name: 'Key Deliverable', icon: 'fas fa-flag-checkered', color: '#3b82f6' },
        { name: 'Deadline', icon: 'fas fa-clock', color: '#f97316' }
    ];

    return (
        <div className="flex items-center justify-center gap-6 py-3 text-sm text-gray-700 flex-wrap">
            {markerTypes.map((marker, idx) => (
                <div key={idx} className="flex items-center gap-2">
                    <i
                        className={`${marker.icon}`}
                        style={{ color: marker.color }}
                    ></i>
                    <span>{marker.name}</span>
                </div>
            ))}
        </div>
    );
}

/**
 * Save Filter Layout Modal Component
 *
 * Allows users to save current filter configuration with a custom name
 * for quick reuse later. Saves time when dealing with complex filter
 * combinations (e.g., 10 specific Activity IDs + 15 Activity Names).
 *
 * @param {Object} props
 * @param {Function} props.onClose - Callback to close modal
 * @param {Function} props.onSave - Callback to save layout with name
 * @param {Array} props.activeFilters - Current active filters to save
 */


function SaveFilterLayoutModal({ onClose, onSave, activeFilters }) {
    const [layoutName, setLayoutName] = useState('');

    const handleSave = () => {
        if (!layoutName.trim()) {
            alert('Please enter a name for this filter layout');
            return;
        }

        if (activeFilters.length === 0) {
            alert('No active filters to save');
            return;
        }

        onSave(layoutName.trim());
        onClose();
    };

    // Count total selected values across all filters
    const totalSelections = activeFilters.reduce((sum, filter) => {
        return sum + (filter.values?.length || 0);
    }, 0);

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="glass rounded-2xl p-6 max-w-md w-full">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">
                    <i className="fas fa-save mr-3 text-blue-600"></i>
                    Save Filter Layout
                </h2>

                <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800">
                        <i className="fas fa-info-circle mr-2"></i>
                        Save your current filter configuration to quickly apply it later.
                    </p>
                </div>

                {/* Current Filter Summary */}
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 mb-4">
                    <p className="text-sm font-semibold text-gray-800 mb-2">
                        Current Configuration:
                    </p>
                    <div className="space-y-1 text-xs text-gray-700">
                        {activeFilters.map((filter, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <i className="fas fa-filter text-gray-500"></i>
                                <span className="font-medium">{filter.column}:</span>
                                <span className="text-gray-600">{filter.values?.length || 0} selected</span>
                            </div>
                        ))}
                        <div className="border-t border-gray-300 mt-2 pt-2">
                            <span className="font-bold text-gray-800">
                                Total: {totalSelections} selections across {activeFilters.length} filters
                            </span>
                        </div>
                    </div>
                </div>

                {/* Layout Name Input */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold mb-2 text-gray-800">
                        Layout Name *
                    </label>
                    <input
                        type="text"
                        value={layoutName}
                        onChange={(e) => setLayoutName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-base"
                        placeholder="e.g., Area A - Critical Items"
                        autoFocus
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Choose a descriptive name to easily identify this layout later
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg transition font-medium"
                    >
                        <i className="fas fa-times mr-2"></i>
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
                    >
                        <i className="fas fa-save mr-2"></i>
                        Save Layout
                    </button>
                </div>
            </div>
        </div>
    );
}

// ========== MAIN APP ==========
/**
 * Crown HS Schedule Calendar - Main Application
 *
 * Main orchestrator component that coordinates all UI components,
 * state management, and data persistence.
 *
 * Features:
 * - Multi-update management with LocalStorage persistence
 * - Excel import/export with advanced filtering
 * - Interactive calendar with activity visualization
 * - Bulk operations (contractor assignment, filtering)
 * - Customizable area/floor/zone codes
 * - Activity editing with date validation
 */


// Import all components

// Import utilities

// TODAY constant
const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

/**
 * Main Calendar Component
 *
 * Manages the entire application state including:
 * - Multiple updates with activities
 * - Filters (area, floor, zone, work type)
 * - Modal visibility states
 * - LocalStorage persistence
 * - Custom configurations
 */
function CalendarScheduleViewer() {
    // State: Updates management
    const [updates, setUpdates] = useState([
        {
            id: 12,
            name: 'Update 12',
            activities: [],
            loaded: false,
            savedFilters: null // { field: 'name', keywords: ['piso', 'madera', 'pared'] }
        }
    ]);
    const [currentUpdateId, setCurrentUpdateId] = useState(12);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State: Calendar navigation
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(TODAY);

    // State: Dynamic Filters (user can add/remove any column filter)
    const [activeFilters, setActiveFilters] = useState([]);
    // Each filter: { id: uniqueId, column: 'area', values: [] }

    // State: Track last clicked index for Shift+Click range selection
    const [lastClickedIndex, setLastClickedIndex] = useState({});
    // { filterId: lastIndex }

    // State: Filter search terms (for searching within filter values)
    const [filterSearchTerms, setFilterSearchTerms] = useState({});
    // { filterId: 'search term' }

    // State: Expanded filter (accordion - only one filter expanded at a time)
    const [expandedFilterId, setExpandedFilterId] = useState(null);

    // State: Saved Filter Layouts (persisted in localStorage)
    const [savedFilterLayouts, setSavedFilterLayouts] = useState(() => {
        const saved = localStorage.getItem('crownSchedule_filterLayouts');
        return saved ? JSON.parse(saved) : [];
    });

    // State: Show Save Filter Layout Modal
    const [showSaveLayoutModal, setShowSaveLayoutModal] = useState(false);

    // State: Assign contractor section expanded/collapsed
    const [isAssignExpanded, setIsAssignExpanded] = useState(false);

    // State: Day activities search
    const [daySearchTerm, setDaySearchTerm] = useState('');

    // State: Modal visibility
    const [showImportWizard, setShowImportWizard] = useState(false);
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showBulkContractorModal, setShowBulkContractorModal] = useState(false);
    const [showConfigureCodesModal, setShowConfigureCodesModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showComparisonModal, setShowComparisonModal] = useState(false);
    const [editingActivity, setEditingActivity] = useState(null);
    const [toast, setToast] = useState(null);

    // State: Project configuration (persisted in LocalStorage)
    const [projectName, setProjectName] = useState(() => {
        const saved = localStorage.getItem('projectName');
        return saved || 'Crown HS Schedule Calendar';
    });

    // State: Code configuration (can be customized by user)
    const [customAreaConfig, setCustomAreaConfig] = useState(() => {
        const saved = localStorage.getItem('customAreaConfig');
        return saved ? JSON.parse(saved) : areaConfig;
    });
    const [customIdPatternConfig, setCustomIdPatternConfig] = useState(() => {
        const saved = localStorage.getItem('customIdPatternConfig');
        return saved ? JSON.parse(saved) : ID_PATTERN_CONFIG;
    });

    // State: Custom Headers (user-defined columns)
    const [customHeaders, setCustomHeaders] = useState(() => {
        const saved = localStorage.getItem('customHeaders');
        return saved ? JSON.parse(saved) : [];
    });

    // Current update helper
    const currentUpdate = updates.find(u => u.id === currentUpdateId);

    /**
     * Show toast notification
     */
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    /**
     * Effect: Load data from LocalStorage on mount
     * Falls back to JSON file for backward compatibility
     */
    useEffect(() => {
        console.log('🔍 Loading data from LocalStorage...');
        setLoading(true);

        try {
            const savedData = localStorage.getItem('crownScheduleData');

            if (savedData) {
                const parsed = JSON.parse(savedData);
                console.log('✅ Loaded from LocalStorage:', parsed.updates.length, 'updates');

                // 🧹 CLEANUP: Trim whitespace from area, floor, zone fields
                const cleanedUpdates = parsed.updates.map(update => ({
                    ...update,
                    activities: update.activities.map(activity => ({
                        ...activity,
                        area: activity.area ? activity.area.trim() : activity.area,
                        floor: activity.floor ? activity.floor.trim() : activity.floor,
                        zone: activity.zone ? activity.zone.trim() : activity.zone,
                        id: activity.id ? activity.id.trim() : activity.id
                    }))
                }));

                setUpdates(cleanedUpdates);
                setCurrentUpdateId(parsed.currentUpdateId);
                setLoading(false);
                return;
            }
        } catch (error) {
            console.error('❌ Error loading from LocalStorage:', error);
        }

        // Fallback: Try to load Update 12 from JSON (backward compatibility)
        fetch('/crown-hs-schedule-update12.json')
            .then(res => {
                if (!res.ok) throw new Error('File not found');
                return res.json();
            })
            .then(data => {
                console.log('✅ Data loaded from JSON:', data.total_activities, 'activities');
                setUpdates(prev => prev.map(u =>
                    u.id === 12 ? { ...u, activities: data.activities, loaded: true } : u
                ));
                setLoading(false);
            })
            .catch(err => {
                console.log('ℹ️ No existing data, starting fresh');
                setLoading(false);
            });
    }, []);

    /**
     * Effect: Save data to LocalStorage whenever updates change
     */
    useEffect(() => {
        if (!loading && updates.length > 0) {
            try {
                const dataToSave = {
                    updates,
                    currentUpdateId,
                    lastSaved: new Date().toISOString()
                };
                localStorage.setItem('crownScheduleData', JSON.stringify(dataToSave));
                console.log('💾 Data saved to LocalStorage');
            } catch (error) {
                console.error('❌ Error saving to LocalStorage:', error);
                showToast('Error saving data', 'error');
            }
        }
    }, [updates, currentUpdateId, loading]);

    /**
     * Handler: Create new update
     */
    const handleCreateNewUpdate = () => {
        const maxId = Math.max(...updates.map(u => u.id));
        // Copy savedFilters from current update to new update
        const currentFilters = currentUpdate?.savedFilters || null;
        const newUpdate = {
            id: maxId + 1,
            name: `Update ${maxId + 1}`,
            activities: [],
            loaded: false,
            savedFilters: currentFilters // Inherit filters from current update
        };
        setUpdates([...updates, newUpdate]);
        setCurrentUpdateId(newUpdate.id);

        const filterMsg = currentFilters ? ' (filters copied)' : '';
        showToast(`Created ${newUpdate.name}${filterMsg}`, 'success');
    };

    /**
     * Handler: Rename update
     */
    const handleRenameUpdate = (updateId, newName) => {
        setUpdates(prev => prev.map(u =>
            u.id === updateId ? { ...u, name: newName } : u
        ));
        showToast('Update renamed successfully', 'success');
    };

    /**
     * Handler: Delete update
     */
    const handleDeleteUpdate = () => {
        if (updates.length === 1) {
            showToast('Cannot delete the only update', 'error');
            return;
        }

        const updateToDelete = currentUpdate;
        const remainingUpdates = updates.filter(u => u.id !== currentUpdateId);
        setUpdates(remainingUpdates);
        setCurrentUpdateId(remainingUpdates[0].id);
        setShowDeleteModal(false);
        showToast(`Deleted ${updateToDelete.name}`, 'success');
    };

    /**
     * Handler: Import complete (from Excel or Manual Entry)
     * Auto-copies contractors from previous updates based on Activity ID
     * Prevents duplicate activities in the SAME update
     */
    const handleImportComplete = (activities, updateId) => {
        // Get current update's existing activities
        const currentUpdateActivities = updates.find(u => u.id === updateId)?.activities || [];

        // Create a Set of existing Activity IDs in current update for fast lookup
        const existingActivityIds = new Set(currentUpdateActivities.map(act => act.id));

        // Filter out duplicates (activities with same ID already in this update)
        let duplicateCount = 0;
        const newActivitiesOnly = activities.filter(newAct => {
            if (existingActivityIds.has(newAct.id)) {
                duplicateCount++;
                return false; // Skip duplicate
            }
            return true; // Keep new activity
        });

        // If all activities are duplicates, show message and exit
        if (newActivitiesOnly.length === 0) {
            showToast(`⚠️ All ${activities.length} activities already exist in this update. No duplicates added.`, 'error');
            return;
        }

        // Auto-copy contractors from previous updates
        const previousUpdates = updates.filter(u => u.id !== updateId && u.activities.length > 0);

        if (previousUpdates.length > 0) {
            // Create a map of Activity ID → Contractor from ALL previous updates
            const contractorMap = {};
            previousUpdates.forEach(prevUpdate => {
                prevUpdate.activities.forEach(act => {
                    if (act.id && act.contractor) {
                        // Use Activity ID as key, store most recent contractor
                        contractorMap[act.id] = act.contractor;
                    }
                });
            });

            // Apply contractors to new activities
            let copiedCount = 0;
            const activitiesWithContractors = newActivitiesOnly.map(newAct => {
                // If activity doesn't have contractor but exists in previous updates
                if (!newAct.contractor && newAct.id && contractorMap[newAct.id]) {
                    copiedCount++;
                    return {
                        ...newAct,
                        contractor: contractorMap[newAct.id]
                    };
                }
                return newAct;
            });

            // Update activities with auto-copied contractors
            setUpdates(prev => prev.map(u =>
                u.id === updateId ? { ...u, activities: [...u.activities, ...activitiesWithContractors], loaded: true } : u
            ));

            // Show toast with comprehensive stats
            let message = `✅ Imported ${newActivitiesOnly.length} new activities.`;
            if (copiedCount > 0) {
                message += ` Auto-copied ${copiedCount} contractors! 🎯`;
            }
            if (duplicateCount > 0) {
                message += `\n\nℹ️ Skipped ${duplicateCount} duplicates (already in this update).`;
            }
            showToast(message, 'success');
        } else {
            // No previous updates, just import with duplicate check
            setUpdates(prev => prev.map(u =>
                u.id === updateId ? { ...u, activities: [...u.activities, ...newActivitiesOnly], loaded: true } : u
            ));

            let message = `✅ Imported ${newActivitiesOnly.length} activities.`;
            if (duplicateCount > 0) {
                message += `\n\nℹ️ Skipped ${duplicateCount} duplicates (already in this update).`;
            }
            showToast(message, 'success');
        }
    };

    /**
     * Handler: Edit activity
     */
    const handleEditActivity = (editedActivity, applyToAllWithSameName = false) => {
        if (applyToAllWithSameName && editedActivity.contractor) {
            // Bulk update: Apply contractor to all activities with same name
            let updatedCount = 0;

            setUpdates(prev => prev.map(u => {
                if (u.id === currentUpdateId) {
                    const updatedActivities = u.activities.map(act => {
                        if (act.name === editedActivity.name) {
                            updatedCount++;
                            return { ...act, contractor: editedActivity.contractor };
                        }
                        // Still update the edited activity with all its changes
                        if (act.id === editedActivity.id && act.name === editedActivity.name) {
                            return editedActivity;
                        }
                        return act;
                    });
                    return { ...u, activities: updatedActivities };
                }
                return u;
            }));

            setEditingActivity(null);
            showToast(
                `Contractor "${editedActivity.contractor}" assigned to ${updatedCount} activities with name "${editedActivity.name}"`,
                'success'
            );
        } else {
            // Single activity update (original behavior)
            setUpdates(prev => prev.map(u => {
                if (u.id === currentUpdateId) {
                    // Find and replace the activity
                    const updatedActivities = u.activities.map(act =>
                        act.id === editedActivity.id && act.name === editedActivity.name
                            ? editedActivity
                            : act
                    );
                    return { ...u, activities: updatedActivities };
                }
                return u;
            }));
            setEditingActivity(null);
            showToast('Activity updated successfully', 'success');
        }
    };

    /**
     * Memo: Build activity map by date
     * Maps each date to all activities occurring on that date
     */
    const activityMap = useMemo(() => {
        if (!currentUpdate || currentUpdate.activities.length === 0) return {};

        const map = {};
        currentUpdate.activities.forEach(activity => {
            const startDate = formatDate(activity.start);
            const finishDate = formatDate(activity.finish);

            if (!startDate || !finishDate) return;

            const currentDate = new Date(startDate);
            while (currentDate <= finishDate) {
                const dateKey = dateToString(currentDate);
                if (!map[dateKey]) map[dateKey] = [];
                map[dateKey].push(activity);
                currentDate.setDate(currentDate.getDate() + 1);
            }
        });

        return map;
    }, [currentUpdate]);

    /**
     * Column name mapping (internal property → Excel header)
     * These are the preset column names that cannot be deleted
     */
    const columnNameMapping = {
        'id': 'Activity ID',
        'name': 'Activity Name',
        'contractor': 'Contractor / Sub',
        'original_duration': 'Original Duration',
        'start': 'Start Date',
        'finish': 'Finish Date',
        'actual_start': 'Actual Start',
        'actual_finish': 'Actual Finish',
        'comments': 'Comments',
        'area': 'Area',
        'marker': 'Marker Type',
        // These are additional detected columns
        'floor': 'Floor',
        'zone': 'Zone',
        'new_rem_duration': 'New Rem Duration',
        'raw_floor': 'Raw Floor',
        'activity_number': 'Activity Number',
        '_original_index': 'Original Index'
    };

    /**
     * Memo: Get available columns for filtering (preset + detected + custom headers)
     */
    const availableColumns = useMemo(() => {
        if (!currentUpdate || currentUpdate.activities.length === 0) return [];

        // Helper function to normalize keys for comparison (lowercase, no underscores/spaces)
        const normalizeKey = (key) => key.toLowerCase().replace(/[_\s-]/g, '');

        // Start with ALL preset columns from mapping (always available)
        const presetColumns = Object.entries(columnNameMapping).map(([key, label]) => ({
            value: key,
            label: label,
            normalizedKey: normalizeKey(key),
            isPreset: true
        }));

        // Create a Set of normalized preset keys to avoid duplicates
        const presetNormalizedKeys = new Set(presetColumns.map(col => col.normalizedKey));

        // Get detected columns from activities (may include unmapped columns)
        const sampleActivity = currentUpdate.activities[0];
        const detectedKeys = Object.keys(sampleActivity)
            .filter(key => key !== 'uniqueId'); // Exclude internal keys

        const detectedColumns = detectedKeys
            .filter(key => !presetNormalizedKeys.has(normalizeKey(key))) // Only non-preset columns
            .map(key => ({
                value: key,
                label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
                normalizedKey: normalizeKey(key),
                isDetected: true
            }));

        // Add user-defined custom headers
        const customColumns = customHeaders.map(header => ({
            value: header.key,
            label: header.label,
            normalizedKey: normalizeKey(header.key),
            isCustom: true
        }));

        // Combine all columns
        const allColumns = [...presetColumns, ...detectedColumns, ...customColumns];

        // Remove duplicates by value (unique keys only)
        const uniqueColumns = [];
        const seenValues = new Set();

        for (const column of allColumns) {
            if (!seenValues.has(column.value)) {
                seenValues.add(column.value);
                uniqueColumns.push(column);
            }
        }

        // Sort alphabetically by label
        return uniqueColumns.sort((a, b) => a.label.localeCompare(b.label));
    }, [currentUpdate, customHeaders]);

    /**
     * Format marker type names for display
     */
    const formatMarkerName = (markerType) => {
        const markerNames = {
            'milestone': 'Milestone',
            'critical': 'Critical Path',
            'inspection': 'Inspection Point',
            'deliverable': 'Key Deliverable',
            'deadline': 'Deadline'
        };
        return markerNames[markerType] || markerType;
    };

    /**
     * Get unique values for a specific column
     */
    const getUniqueValuesForColumn = (column) => {
        if (!currentUpdate) return [];

        const values = new Set();
        currentUpdate.activities.forEach(activity => {
            // Special handling for marker (extract marker.type)
            if (column === 'marker') {
                const markerType = activity.marker?.type;
                if (markerType && markerType !== 'none') {
                    values.add(markerType);
                }
            } else {
                const value = activity[column];
                if (value !== null && value !== undefined && value !== '') {
                    values.add(String(value));
                }
            }
        });

        return Array.from(values).sort();
    };

    /**
     * Apply dynamic filters to activities
     */
    const applyDynamicFilters = (activities, filters = null) => {
        // Use provided filters or fall back to activeFilters from state
        const filtersToUse = filters || activeFilters;

        if (filtersToUse.length === 0) return activities;

        return activities.filter(activity => {
            // Activity must match ALL active filters (AND logic between filters)
            return filtersToUse.every(filter => {
                // Skip filters with no values selected
                if (!filter.values || filter.values.length === 0) return true;

                // Special handling for marker filter
                if (filter.column === 'marker') {
                    const markerType = activity.marker?.type;
                    if (!markerType || markerType === 'none') return false;

                    // Match ANY of the selected marker types (OR logic within filter)
                    return filter.values.some(filterValue =>
                        markerType === filterValue
                    );
                }

                // Standard filtering for other columns
                const activityValue = activity[filter.column];
                if (!activityValue) return false;

                // Match ANY of the selected values (OR logic within filter)
                return filter.values.some(filterValue =>
                    String(activityValue) === String(filterValue)
                );
            });
        });
    };

    /**
     * Memo: Filter activities based on dynamic filters
     */
    const filteredActivities = useMemo(() => {
        if (!currentUpdate) return [];
        return applyDynamicFilters(currentUpdate.activities);
    }, [currentUpdate, activeFilters]);

    /**
     * Memo: Get activities without dates (missing start or finish)
     */
    const activitiesWithoutDates = useMemo(() => {
        if (!currentUpdate) return [];

        return filteredActivities.filter(activity => {
            return !activity.start || !activity.finish;
        });
    }, [filteredActivities]);

    /**
     * Memo: Get activities for selected date (with search filter)
     */
    const selectedDateActivities = useMemo(() => {
        const dateKey = dateToString(selectedDate);
        const activities = activityMap[dateKey] || [];

        // Apply dynamic filters
        let filteredActivities = applyDynamicFilters(activities);

        // Apply day search filter
        if (daySearchTerm.trim()) {
            const searchLower = daySearchTerm.toLowerCase().trim();
            filteredActivities = filteredActivities.filter(activity => {
                // Search in multiple fields
                const searchableFields = [
                    activity.id,
                    activity.name,
                    activity.contractor,
                    activity.area,
                    activity.floor,
                    activity.zone,
                    activity.comments
                ];

                return searchableFields.some(field =>
                    field && String(field).toLowerCase().includes(searchLower)
                );
            });
        }

        return filteredActivities;
    }, [activityMap, selectedDate, activeFilters, daySearchTerm]);

    /**
     * Memo: Generate calendar days for current month
     */
    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const days = [];
        const startDay = firstDay.getDay();

        for (let i = 0; i < startDay; i++) {
            days.push(null);
        }

        for (let day = 1; day <= lastDay.getDate(); day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    }, [currentMonth]);

    /**
     * Handler: Navigate month (prev/next)
     */
    const navigateMonth = (direction) => {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() + direction);
        setCurrentMonth(newMonth);
    };

    /**
     * Handler: Add new dynamic filter (multi-select)
     */
    const handleAddFilter = (column) => {
        const uniqueValues = getUniqueValuesForColumn(column);
        if (uniqueValues.length === 0) {
            showToast(`No values available for ${column}`, 'error');
            return;
        }

        const newFilter = {
            id: Date.now(),
            column,
            values: [] // Start with no values selected (user will select)
        };

        setActiveFilters([...activeFilters, newFilter]);

        // Auto-expand the newly added filter (accordion behavior)
        setExpandedFilterId(newFilter.id);
    };

    /**
     * Handler: Remove filter
     */
    const handleRemoveFilter = (filterId) => {
        setActiveFilters(activeFilters.filter(f => f.id !== filterId));

        // Clean up associated state
        setFilterSearchTerms(prev => {
            const newTerms = { ...prev };
            delete newTerms[filterId];
            return newTerms;
        });

        setLastClickedIndex(prev => {
            const newIndices = { ...prev };
            delete newIndices[filterId];
            return newIndices;
        });

        // If removing the expanded filter, collapse it
        if (expandedFilterId === filterId) {
            setExpandedFilterId(null);
        }
    };

    /**
     * Handler: Update search term for a specific filter
     */
    const handleFilterSearchChange = (filterId, searchTerm) => {
        setFilterSearchTerms(prev => ({
            ...prev,
            [filterId]: searchTerm
        }));
    };

    /**
     * Handler: Toggle filter value with Shift+Click range selection support
     * visibleValues: the currently visible/filtered values array
     */
    const handleToggleFilterValue = (filterId, value, currentIndex, shiftKey, visibleValues) => {
        const filter = activeFilters.find(f => f.id === filterId);
        if (!filter) return;

        const values = filter.values || [];

        let newValues;

        // Shift+Click: Select range between last clicked and current in the VISIBLE array
        if (shiftKey && lastClickedIndex[filterId] !== undefined) {
            const lastIdx = lastClickedIndex[filterId];
            const startIdx = Math.min(lastIdx, currentIndex);
            const endIdx = Math.max(lastIdx, currentIndex);

            // Get all values in the range from the VISIBLE array
            const rangeValues = visibleValues.slice(startIdx, endIdx + 1);

            // Determine if we're selecting or deselecting based on current value
            const isCurrentSelected = values.includes(value);

            // If current is selected, deselect the range; otherwise, select the range
            if (isCurrentSelected) {
                // Deselect all values in range
                newValues = values.filter(v => !rangeValues.includes(v));
            } else {
                // Select all values in range (add only new ones)
                const valuesToAdd = rangeValues.filter(v => !values.includes(v));
                newValues = [...values, ...valuesToAdd];
            }
        } else {
            // Normal click: toggle single value
            const isSelected = values.includes(value);
            newValues = isSelected
                ? values.filter(v => v !== value)
                : [...values, value];
        }

        // Update filter values
        setActiveFilters(activeFilters.map(f =>
            f.id === filterId ? { ...f, values: newValues } : f
        ));

        // Always update last clicked index for next shift+click
        setLastClickedIndex(prev => ({
            ...prev,
            [filterId]: currentIndex
        }));
    };

    /**
     * Handler: Select all values for a filter
     */
    const handleSelectAllFilterValues = (filterId) => {
        setActiveFilters(activeFilters.map(f => {
            if (f.id === filterId) {
                const uniqueValues = getUniqueValuesForColumn(f.column);
                return { ...f, values: [...uniqueValues] };
            }
            return f;
        }));
    };

    /**
     * Handler: Clear all values for a filter
     */
    const handleClearFilterValues = (filterId) => {
        setActiveFilters(activeFilters.map(f => {
            if (f.id === filterId) {
                return { ...f, values: [] };
            }
            return f;
        }));
    };

    /**
     * Handler: Clear all filters
     */
    const handleClearAllFilters = () => {
        setActiveFilters([]);
    };

    /**
     * Handler: Save current filter layout with a name
     */
    const handleSaveFilterLayout = (layoutName) => {
        const newLayout = {
            id: Date.now().toString(),
            name: layoutName,
            timestamp: new Date().toISOString(),
            filters: activeFilters.map(f => ({
                id: f.id,
                column: f.column,
                values: [...(f.values || [])]
            }))
        };

        const updatedLayouts = [...savedFilterLayouts, newLayout];
        setSavedFilterLayouts(updatedLayouts);
        localStorage.setItem('crownSchedule_filterLayouts', JSON.stringify(updatedLayouts));

        showToast(`Filter layout "${layoutName}" saved successfully!`, 'success');
    };

    /**
     * Handler: Load a saved filter layout
     */
    const handleLoadFilterLayout = (layout) => {
        // Clear current filters and filter search terms
        setFilterSearchTerms({});
        setExpandedFilterId(null);

        // Apply the saved filters
        setActiveFilters(layout.filters.map(f => ({
            id: Date.now().toString() + Math.random(), // New unique ID
            column: f.column,
            values: [...f.values]
        })));

        showToast(`Filter layout "${layout.name}" loaded successfully!`, 'success');
    };

    /**
     * Handler: Delete a saved filter layout
     */
    const handleDeleteFilterLayout = (layoutId) => {
        if (!confirm('Are you sure you want to delete this filter layout?')) return;

        const updatedLayouts = savedFilterLayouts.filter(l => l.id !== layoutId);
        setSavedFilterLayouts(updatedLayouts);
        localStorage.setItem('crownSchedule_filterLayouts', JSON.stringify(updatedLayouts));

        showToast('Filter layout deleted', 'success');
    };

    /**
     * Handler: Save custom headers
     */
    const handleSaveCustomHeaders = (newHeaders) => {
        setCustomHeaders(newHeaders);
        localStorage.setItem('customHeaders', JSON.stringify(newHeaders));
        showToast(`Custom headers saved successfully (${newHeaders.length} columns)`, 'success');
    };

    /**
     * Handler: Export data as JSON backup
     */
    const handleExportData = () => {
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

            showToast('Data exported successfully', 'success');
        } catch (error) {
            showToast('Error exporting data', 'error');
        }
    };

    /**
     * Handler: Export to Excel with filters and sorting
     */
    const handleExportToExcel = (filters, sortBy, sortOrder, selectedLayout = null) => {
        try {
            let activities = [...currentUpdate.activities];

            if (activities.length === 0) {
                showToast('No activities to export', 'error');
                return;
            }

            // STEP 1A: Apply Saved Layout Filters First (if selected)
            if (selectedLayout && selectedLayout.filters && selectedLayout.filters.length > 0) {
                activities = applyDynamicFilters(activities, selectedLayout.filters);
                console.log(`Applied saved layout "${selectedLayout.name}": ${activities.length} activities remaining`);
            }

            // STEP 1B: Apply Traditional Export Filters
            if (filters.contractor) {
                activities = activities.filter(a => a.contractor === filters.contractor);
            }
            if (filters.area) {
                activities = activities.filter(a => a.area === filters.area);
            }
            if (filters.floor) {
                activities = activities.filter(a => a.floor === filters.floor);
            }
            if (filters.zone) {
                activities = activities.filter(a => a.zone === filters.zone);
            }
            if (filters.activityName) {
                activities = activities.filter(a =>
                    a.name && a.name.toLowerCase().includes(filters.activityName.toLowerCase())
                );
            }
            // Date Range Filter (for 2-week/3-week look-ahead)
            if (filters.dateRangeStart && filters.dateRangeEnd) {
                const rangeStart = new Date(filters.dateRangeStart);
                rangeStart.setHours(0, 0, 0, 0);
                const rangeEnd = new Date(filters.dateRangeEnd);
                rangeEnd.setHours(0, 0, 0, 0);

                if (filters.includeOverlap) {
                    // Bidirectional overlap: Include any activity that touches the range
                    // Activity overlaps if: (start <= rangeEnd) && (finish >= rangeStart)
                    activities = activities.filter(a => {
                        if (!a.start || !a.finish) return false; // Exclude activities without dates

                        const activityStart = new Date(a.start);
                        activityStart.setHours(0, 0, 0, 0);
                        const activityFinish = new Date(a.finish);
                        activityFinish.setHours(0, 0, 0, 0);

                        // Check for overlap
                        return activityStart <= rangeEnd && activityFinish >= rangeStart;
                    });
                } else {
                    // Original behavior: Only activities that START in the range
                    activities = activities.filter(a => {
                        if (!a.start) return false;
                        const activityStart = new Date(a.start);
                        activityStart.setHours(0, 0, 0, 0);
                        return activityStart >= rangeStart && activityStart <= rangeEnd;
                    });
                }
            }

            if (activities.length === 0) {
                showToast('No activities match the filters', 'error');
                return;
            }

            // STEP 2: Sort Activities
            activities.sort((a, b) => {
                let aVal = a[sortBy] || '';
                let bVal = b[sortBy] || '';

                // For date fields, compare as actual Date objects
                const dateFields = ['start', 'finish', 'actual_start', 'actual_finish'];
                if (dateFields.includes(sortBy)) {
                    // Handle empty dates (push to end)
                    if (!aVal && !bVal) return 0;
                    if (!aVal) return sortOrder === 'asc' ? 1 : -1;  // Empty dates go to end
                    if (!bVal) return sortOrder === 'asc' ? -1 : 1;

                    // Convert to Date objects for proper comparison
                    const dateA = new Date(aVal);
                    const dateB = new Date(bVal);

                    // Handle invalid dates
                    if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
                    if (isNaN(dateA.getTime())) return sortOrder === 'asc' ? 1 : -1;
                    if (isNaN(dateB.getTime())) return sortOrder === 'asc' ? -1 : 1;

                    // Compare as timestamps
                    if (sortOrder === 'asc') {
                        return dateA.getTime() - dateB.getTime();
                    } else {
                        return dateB.getTime() - dateA.getTime();
                    }
                }

                // For non-date fields, compare as strings
                aVal = String(aVal).toLowerCase();
                bVal = String(bVal).toLowerCase();

                if (sortOrder === 'asc') {
                    return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                } else {
                    return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
                }
            });

            // Helper function: Calculate Range Status for overlap analysis
            const getRangeStatus = (activity) => {
                if (!filters.includeOverlap || !filters.dateRangeStart || !filters.dateRangeEnd) {
                    return ''; // No range status if overlap is disabled
                }

                const rangeStart = new Date(filters.dateRangeStart);
                rangeStart.setHours(0, 0, 0, 0);
                const rangeEnd = new Date(filters.dateRangeEnd);
                rangeEnd.setHours(0, 0, 0, 0);

                const activityStart = new Date(activity.start);
                activityStart.setHours(0, 0, 0, 0);
                const activityFinish = new Date(activity.finish);
                activityFinish.setHours(0, 0, 0, 0);

                const startsInRange = activityStart >= rangeStart && activityStart <= rangeEnd;
                const endsInRange = activityFinish >= rangeStart && activityFinish <= rangeEnd;

                if (startsInRange && endsInRange) {
                    return 'Within range';
                } else if (startsInRange && !endsInRange) {
                    return 'Starts in range';
                } else if (!startsInRange && endsInRange) {
                    return 'Ends in range';
                } else {
                    return 'Ongoing (crosses range)';
                }
            };

            // Helper function: Calculate days between two dates
            const calculateDaysDifference = (date1, date2) => {
                if (!date1 || !date2) return '';
                const d1 = new Date(date1);
                const d2 = new Date(date2);
                if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return '';

                const diffTime = d2.getTime() - d1.getTime();
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

                // Format with + or - sign
                if (diffDays > 0) return `+${diffDays}`;
                if (diffDays < 0) return `${diffDays}`;
                return '0';
            };

            // Prepare data for Excel with all fields
            const excelData = activities.map(activity => {
                // Calculate variances
                const startVariance = calculateDaysDifference(activity.start, activity.actual_start);
                const finishVariance = calculateDaysDifference(activity.finish, activity.actual_finish);
                const actualDuration = calculateDaysDifference(activity.actual_start, activity.actual_finish);

                const baseData = {
                    'ID': activity.id || '',
                    'Activity Name': activity.name || '',
                    'Contractor': activity.contractor || '',
                    'Area': customAreaConfig[activity.area]?.name || activity.area || '',
                    'Floor': customIdPatternConfig.floors[activity.floor] || activity.floor || '',
                    'Zone': customIdPatternConfig.zones[activity.zone] || activity.zone || '',
                    'Start Date': activity.start || '',
                    'Finish Date': activity.finish || '',
                    'Original Duration': activity.original_duration || '',
                    'Remaining Duration': activity.rem_duration || '',
                    'Actual Start': activity.actual_start || '',
                    'Actual Finish': activity.actual_finish || '',
                    'Start Variance (days)': startVariance,
                    'Finish Variance (days)': finishVariance,
                    'Actual Duration (days)': actualDuration,
                    'Percent Complete': activity.percent_complete || '0',
                    'Comments': activity.comments || ''
                };

                // Add Range Status column if overlap is enabled (Saber es Poder)
                if (filters.includeOverlap && filters.dateRangeStart && filters.dateRangeEnd) {
                    baseData['Range Status'] = getRangeStatus(activity);
                }

                return baseData;
            });

            // Create worksheet
            const ws = XLSX.utils.json_to_sheet(excelData);

            // Set column widths for 11x17 landscape (optimal widths)
            const columnWidths = [
                { wch: 15 },  // ID
                { wch: 35 },  // Activity Name
                { wch: 15 },  // Contractor
                { wch: 10 },  // Area
                { wch: 15 },  // Floor
                { wch: 15 },  // Zone
                { wch: 12 },  // Start Date
                { wch: 12 },  // Finish Date
                { wch: 12 },  // Original Duration
                { wch: 12 },  // Remaining Duration
                { wch: 12 },  // Actual Start
                { wch: 12 },  // Actual Finish
                { wch: 14 },  // Start Variance (days)
                { wch: 14 },  // Finish Variance (days)
                { wch: 14 },  // Actual Duration (days)
                { wch: 12 },  // Percent Complete
                { wch: 25 }   // Comments
            ];

            // Add Range Status column width if overlap is enabled
            if (filters.includeOverlap && filters.dateRangeStart && filters.dateRangeEnd) {
                columnWidths.push({ wch: 25 }); // Range Status
            }

            ws['!cols'] = columnWidths;

            // Create workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, currentUpdate.name);

            // Generate filename with date
            const today = new Date().toISOString().split('T')[0];
            const filename = `${currentUpdate.name}_Export_${today}.xlsx`;

            // Download
            XLSX.writeFile(wb, filename);

            showToast(`Exported ${activities.length} activities to Excel!`, 'success');
        } catch (error) {
            console.error('Excel export failed:', error);
            showToast('Excel export failed: ' + error.message, 'error');
        }
    };

    /**
     * Handler: Bulk contractor assignment
     */
    const handleBulkContractorAssignment = (selectedActivities, contractorName) => {
        try {
            // Update the contractor field for all selected activities
            const updatedActivities = currentUpdate.activities.map(activity => {
                const isSelected = selectedActivities.some(selected => selected.id === activity.id);
                if (isSelected) {
                    return { ...activity, contractor: contractorName };
                }
                return activity;
            });

            // Update the current update with new activities
            setUpdates(prev => prev.map(u =>
                u.id === currentUpdateId
                    ? { ...u, activities: updatedActivities }
                    : u
            ));

            showToast(`Successfully assigned "${contractorName}" to ${selectedActivities.length} ${selectedActivities.length === 1 ? 'activity' : 'activities'}!`, 'success');
        } catch (error) {
            console.error('Bulk contractor assignment failed:', error);
            showToast('Bulk assignment failed: ' + error.message, 'error');
        }
    };

    /**
     * Handler: Save code configuration
     */
    const handleSaveCodeConfiguration = (config) => {
        setCustomAreaConfig(config.areas);
        setCustomIdPatternConfig(config.idPatternConfig);

        // Save to LocalStorage for persistence
        localStorage.setItem('customAreaConfig', JSON.stringify(config.areas));
        localStorage.setItem('customIdPatternConfig', JSON.stringify(config.idPatternConfig));

        showToast('Code configuration saved successfully!', 'success');
    };

    /**
     * Handler: Save project name
     */
    const handleSaveProjectName = (newName) => {
        setProjectName(newName);
        localStorage.setItem('projectName', newName);
        showToast('Project name updated successfully!', 'success');
    };

    /**
     * Handler: Import data from JSON backup
     */
    const handleImportData = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                setUpdates(imported.updates);
                setCurrentUpdateId(imported.currentUpdateId);
                showToast(`Imported ${imported.updates.length} updates`, 'success');
            } catch (error) {
                showToast('Error importing data - invalid file', 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    /**
     * Handler: Clear all data
     */
    const handleClearAllData = () => {
        if (confirm('⚠️ WARNING: This will delete ALL data permanently. Are you sure?')) {
            localStorage.removeItem('crownScheduleData');
            setUpdates([{ id: 1, name: 'Update 1', activities: [], loaded: false }]);
            setCurrentUpdateId(1);
            showToast('All data cleared', 'success');
        }
    };

    // Loading screen
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-white text-2xl">
                    <i className="fas fa-spinner fa-spin mr-3"></i>
                    Loading calendar...
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="glass rounded-2xl p-6 mb-6 shadow-xl">
                <div className="flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-gray-900">
                                <i className="fas fa-calendar-alt mr-3 text-slate-600"></i>
                                {projectName}
                            </h1>
                            <button
                                onClick={() => setShowSettingsModal(true)}
                                className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition text-sm"
                                title="Settings"
                            >
                                <i className="fas fa-cog"></i>
                            </button>
                        </div>
                        <p className="text-gray-600">
                            {currentUpdate?.name} | {currentUpdate?.activities.length || 0} Activities
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3 items-center">
                        {/* Responsive Buttons - Wrap on small screens, show icons only on mobile */}
                        <button
                            onClick={() => setShowBulkContractorModal(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition text-sm font-semibold"
                            title="Assign contractor to multiple activities at once"
                        >
                            <i className="fas fa-users-cog"></i>
                            <span className="hidden sm:inline">Assign Contractor</span>
                        </button>
                        <button
                            onClick={() => setShowConfigureCodesModal(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition text-sm font-semibold"
                            title="Configure what each Activity ID code means in your project"
                        >
                            <i className="fas fa-cog"></i>
                            <span className="hidden sm:inline">Configure Codes</span>
                        </button>
                        <button
                            onClick={() => setShowExportModal(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm font-semibold"
                            title="Export current update to Excel with filters and sorting"
                        >
                            <i className="fas fa-file-excel"></i>
                            <span className="hidden sm:inline">Export to Excel</span>
                        </button>
                        <button
                            onClick={() => setShowComparisonModal(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-semibold"
                            title="Compare two schedule updates to analyze variance and delays"
                        >
                            <i className="fas fa-chart-line"></i>
                            <span className="hidden sm:inline">Schedule Comparison</span>
                        </button>
                        <button
                            onClick={handleClearAllData}
                            className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition text-sm"
                            title="Clear all data"
                        >
                            <i className="fas fa-trash-alt"></i>
                        </button>

                        {/* Stats - Stack on small screens */}
                        <div className="flex gap-4 ml-auto border-l border-gray-300 pl-4">
                            <div className="text-center">
                                <div className="text-xs text-gray-500">TODAY</div>
                                <div className="text-xl font-bold text-amber-600">{TODAY.getDate()}</div>
                                <div className="text-xs text-gray-500">{TODAY.toLocaleDateString('en-US', { month: 'short' })}</div>
                            </div>
                            <div className="text-center border-l border-gray-300 pl-4">
                                <div className="text-xs text-gray-500">Total</div>
                                <div className="text-xl font-bold text-slate-600">{filteredActivities.length}</div>
                                <div className="text-xs text-gray-500">activities</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Update Management Bar */}
            <div className="glass rounded-2xl p-6 mb-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Update Selector Row */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2">
                            <i className="fas fa-sync-alt text-slate-600"></i>
                            <span className="font-semibold text-gray-700">Update:</span>
                        </div>

                        <select
                            value={currentUpdateId}
                            onChange={(e) => setCurrentUpdateId(parseInt(e.target.value))}
                            className="px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-slate-500 focus:outline-none font-medium"
                        >
                            {updates.map(update => (
                                <option key={update.id} value={update.id}>
                                    {update.name} ({update.activities.length} activities)
                                </option>
                            ))}
                        </select>

                        <button
                            onClick={() => setShowRenameModal(true)}
                            className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition"
                            title="Rename current update"
                        >
                            <i className="fas fa-edit"></i>
                        </button>

                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition"
                            title="Delete current update"
                        >
                            <i className="fas fa-trash"></i>
                        </button>
                    </div>

                    {/* Action Buttons Row - Wrap and stack on small screens */}
                    <div className="flex flex-wrap gap-2 sm:ml-auto">
                        <button
                            onClick={handleCreateNewUpdate}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium"
                        >
                            <i className="fas fa-plus"></i>
                            <span className="hidden sm:inline">New Update</span>
                        </button>

                        <button
                            onClick={() => setShowImportWizard(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition font-medium"
                        >
                            <i className="fas fa-file-import"></i>
                            <span className="hidden sm:inline">Import Excel</span>
                        </button>

                        <button
                            onClick={() => setShowManualEntry(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
                        >
                            <i className="fas fa-plus-circle"></i>
                            <span className="hidden sm:inline">Manual Entry</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Dynamic Filters */}
            <div className="glass rounded-2xl p-6 mb-6 shadow-xl">
                <div className="space-y-4">
                    {/* Activity Count - Shows filtered results */}
                    {currentUpdate && (
                        <div className="bg-gray-100 border border-gray-300 rounded px-3 py-2">
                            <div className="flex items-center gap-2">
                                <i className="fas fa-eye text-gray-600 text-sm"></i>
                                <span className="text-sm text-gray-700">
                                    Viewing{' '}
                                    <span className="font-semibold text-gray-900">{filteredActivities.length}</span>
                                    {activeFilters.length > 0 && (
                                        <>
                                            {' '}of{' '}
                                            <span className="font-semibold text-gray-900">{currentUpdate.activities.length}</span>
                                        </>
                                    )}
                                    {' '}activities
                                    {activeFilters.length > 0 && (
                                        <span className="text-xs text-gray-500 ml-1">
                                            ({Math.round((filteredActivities.length / currentUpdate.activities.length) * 100)}%)
                                        </span>
                                    )}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <i className="fas fa-filter text-slate-600"></i>
                            <span className="font-semibold text-gray-700">Filters:</span>
                            <span className="text-sm text-gray-500">
                                ({activeFilters.length} active)
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {/* Add Filter Dropdown */}
                            <select
                                onChange={(e) => {
                                    if (e.target.value) {
                                        handleAddFilter(e.target.value);
                                        e.target.value = ''; // Reset
                                    }
                                }}
                                className="px-3 py-1.5 rounded-lg border-2 border-blue-300 focus:border-blue-500 focus:outline-none text-sm bg-white"
                                disabled={availableColumns.length === 0}
                            >
                                <option value="">+ Add Filter</option>
                                {availableColumns.map(col => (
                                    <option key={col.value} value={col.value}>
                                        {col.label}
                                    </option>
                                ))}
                            </select>

                            {/* Save Layout Button */}
                            {activeFilters.length > 0 && (
                                <button
                                    onClick={() => setShowSaveLayoutModal(true)}
                                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
                                    title="Save current filter layout for quick reuse"
                                >
                                    <i className="fas fa-save mr-2"></i>
                                    Save Layout
                                </button>
                            )}

                            {/* Load Layout Dropdown */}
                            {savedFilterLayouts.length > 0 && (
                                <select
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            const layout = savedFilterLayouts.find(l => l.id === e.target.value);
                                            if (layout) {
                                                handleLoadFilterLayout(layout);
                                            }
                                            e.target.value = ''; // Reset
                                        }
                                    }}
                                    className="px-3 py-1.5 rounded-lg border-2 border-green-300 focus:border-green-500 focus:outline-none text-sm bg-white"
                                >
                                    <option value="">📁 Load Layout</option>
                                    {savedFilterLayouts.map(layout => (
                                        <option key={layout.id} value={layout.id}>
                                            {layout.name} ({layout.filters.length} filters)
                                        </option>
                                    ))}
                                </select>
                            )}

                            {/* Clear All Button */}
                            {activeFilters.length > 0 && (
                                <button
                                    onClick={handleClearAllFilters}
                                    className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition"
                                >
                                    <i className="fas fa-times mr-2"></i>
                                    Clear All
                                </button>
                            )}

                            {/* Manage Layouts Button */}
                            {savedFilterLayouts.length > 0 && (
                                <button
                                    onClick={() => {
                                        // Show simple alert with layouts list
                                        const layoutsList = savedFilterLayouts.map((layout, idx) =>
                                            `${idx + 1}. ${layout.name} (${layout.filters.length} filters)`
                                        ).join('\n');
                                        if (confirm(`Saved Layouts:\n\n${layoutsList}\n\nClick OK to manage layouts (delete)`)) {
                                            const layoutToDelete = prompt('Enter layout number to delete (1, 2, etc.):');
                                            const index = parseInt(layoutToDelete) - 1;
                                            if (index >= 0 && index < savedFilterLayouts.length) {
                                                handleDeleteFilterLayout(savedFilterLayouts[index].id);
                                            }
                                        }
                                    }}
                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition"
                                    title="Manage saved layouts"
                                >
                                    <i className="fas fa-cog"></i>
                                </button>
                            )}
                        </div>

                        {/* Assign to Contractor/Sub - Collapsible Accordion */}
                        {activeFilters.length > 0 && filteredActivities.length > 0 && (
                            <div className="mt-2 bg-gray-50 border border-gray-300 rounded p-2">
                                {/* Clickable Header - Accordion */}
                                <div
                                    className="flex items-center justify-between cursor-pointer hover:bg-gray-100 -m-2 p-2 rounded transition"
                                    onClick={() => setIsAssignExpanded(!isAssignExpanded)}
                                >
                                    <div className="flex items-center gap-1.5">
                                        {/* Expand/Collapse Icon */}
                                        <i className={`fas fa-chevron-${isAssignExpanded ? 'down' : 'right'} text-gray-600 text-xs`}></i>
                                        <i className="fas fa-user-check text-gray-700 text-sm"></i>
                                        <span className="text-xs font-semibold text-gray-800">
                                            Assign ({filteredActivities.length})
                                        </span>
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {isAssignExpanded && (
                                    <div className="mt-2 space-y-2">
                                        {/* New Contractor Input */}
                                        <div>
                                            <input
                                                type="text"
                                                placeholder="New contractor (press Enter)..."
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && e.target.value.trim()) {
                                                        const newContractor = e.target.value.trim();
                                                        const confirmed = confirm(
                                                            `Assign "${newContractor}" to ${filteredActivities.length} filtered activities?`
                                                        );
                                                        if (confirmed) {
                                                            const currentUpdate = updates.find(u => u.id === currentUpdateId);
                                                            if (!currentUpdate) return;

                                                            const updatedActivities = currentUpdate.activities.map(activity => {
                                                                const isFiltered = filteredActivities.some(fa => fa.id === activity.id);
                                                                if (isFiltered) {
                                                                    return { ...activity, contractor: newContractor };
                                                                }
                                                                return activity;
                                                            });

                                                            const updatedUpdates = updates.map(u =>
                                                                u.id === currentUpdateId
                                                                    ? { ...u, activities: updatedActivities }
                                                                    : u
                                                            );

                                                            setUpdates(updatedUpdates);
                                                            showToast(
                                                                `✅ Assigned "${newContractor}" to ${filteredActivities.length} activities`,
                                                                'success'
                                                            );
                                                            e.target.value = '';
                                                        }
                                                    }
                                                }}
                                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:border-gray-500 focus:outline-none"
                                            />
                                        </div>

                                        {/* Existing Contractors */}
                                        {(() => {
                                            const existingContractors = getUniqueValuesForColumn('contractor').filter(c => c);
                                            if (existingContractors.length > 0) {
                                                return (
                                                    <div>
                                                        <div className="text-xs text-gray-600 mb-1 font-medium">Or select existing:</div>
                                                        <div className="max-h-20 overflow-y-auto space-y-0.5">
                                                            {existingContractors.map(contractor => (
                                                                <label
                                                                    key={contractor}
                                                                    className="flex items-center gap-1.5 px-1.5 py-0.5 hover:bg-gray-200 rounded cursor-pointer transition"
                                                                >
                                                                    <input
                                                                        type="radio"
                                                                        name="contractor-assign"
                                                                        onChange={(e) => {
                                                                            if (e.target.checked) {
                                                                                const confirmed = confirm(
                                                                                    `Assign "${contractor}" to ${filteredActivities.length} filtered activities?`
                                                                                );
                                                                                if (confirmed) {
                                                                                    const currentUpdate = updates.find(u => u.id === currentUpdateId);
                                                                                    if (!currentUpdate) return;

                                                                                    const updatedActivities = currentUpdate.activities.map(activity => {
                                                                                        const isFiltered = filteredActivities.some(fa => fa.id === activity.id);
                                                                                        if (isFiltered) {
                                                                                            return { ...activity, contractor };
                                                                                        }
                                                                                        return activity;
                                                                                    });

                                                                                    const updatedUpdates = updates.map(u =>
                                                                                        u.id === currentUpdateId
                                                                                            ? { ...u, activities: updatedActivities }
                                                                                            : u
                                                                                    );

                                                                                    setUpdates(updatedUpdates);
                                                                                    showToast(
                                                                                        `✅ Assigned "${contractor}" to ${filteredActivities.length} activities`,
                                                                                        'success'
                                                                                    );
                                                                                    e.target.checked = false; // Reset
                                                                                } else {
                                                                                    e.target.checked = false; // Cancel
                                                                                }
                                                                            }
                                                                        }}
                                                                        className="w-3 h-3 text-gray-600"
                                                                    />
                                                                    <span className="text-xs text-gray-700 truncate flex-1">
                                                                        {contractor}
                                                                    </span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Active Filters List - Compact Multi-Select */}
                    {activeFilters.length > 0 && (
                        <div className="space-y-2">
                            {activeFilters.map(filter => {
                                const columnLabel = availableColumns.find(c => c.value === filter.column)?.label || filter.column;
                                const allUniqueValues = getUniqueValuesForColumn(filter.column);

                                // Filter values based on search term
                                const searchTerm = filterSearchTerms[filter.id] || '';
                                const uniqueValues = searchTerm
                                    ? allUniqueValues.filter(val =>
                                        String(val).toLowerCase().includes(searchTerm.toLowerCase())
                                    )
                                    : allUniqueValues;

                                const selectedCount = filter.values?.length || 0;
                                const isExpanded = expandedFilterId === filter.id;

                                return (
                                    <div
                                        key={filter.id}
                                        className="bg-gray-50 border border-gray-300 rounded p-2"
                                    >
                                        {/* Compact Clickable Header - Accordion */}
                                        <div
                                            className="flex items-center justify-between cursor-pointer hover:bg-gray-100 -m-2 p-2 rounded transition"
                                            onClick={() => setExpandedFilterId(isExpanded ? null : filter.id)}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                {/* Expand/Collapse Icon */}
                                                <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'} text-gray-600 text-xs`}></i>

                                                <span className="text-xs font-semibold text-gray-800">
                                                    {columnLabel}
                                                </span>
                                                <span className="px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded-full text-xs font-medium">
                                                    {selectedCount}
                                                </span>
                                            </div>

                                            {/* Remove Filter Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Prevent accordion toggle
                                                    handleRemoveFilter(filter.id);
                                                }}
                                                className="text-red-600 hover:text-red-700 transition"
                                                title="Remove filter"
                                            >
                                                <i className="fas fa-trash text-xs"></i>
                                            </button>
                                        </div>

                                        {/* Filter Content - Only shown when expanded (Accordion) */}
                                        {isExpanded && (
                                            <div className="mt-2">
                                                {/* Compact Buttons */}
                                                <div className="flex gap-1.5 mb-1.5">
                                            <button
                                                onClick={() => {
                                                    setActiveFilters(activeFilters.map(f => {
                                                        if (f.id === filter.id) {
                                                            const currentValues = f.values || [];
                                                            const newValues = [...new Set([...currentValues, ...uniqueValues])];
                                                            return { ...f, values: newValues };
                                                        }
                                                        return f;
                                                    }));
                                                }}
                                                className="px-2 py-0.5 bg-green-100 hover:bg-green-200 text-green-700 rounded text-xs transition"
                                            >
                                                <i className="fas fa-check-double mr-1"></i>
                                                All {searchTerm && `(${uniqueValues.length})`}
                                            </button>
                                            <button
                                                onClick={() => handleClearFilterValues(filter.id)}
                                                className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs transition"
                                            >
                                                <i className="fas fa-times mr-1"></i>
                                                Clear
                                            </button>
                                        </div>

                                        {/* Compact Search */}
                                        <div className="mb-1.5">
                                            <div className="relative">
                                                <i className="fas fa-search absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" style={{fontSize: '10px'}}></i>
                                                <input
                                                    type="text"
                                                    placeholder={`Search ${allUniqueValues.length}...`}
                                                    value={searchTerm}
                                                    onChange={(e) => handleFilterSearchChange(filter.id, e.target.value)}
                                                    className="w-full pl-7 pr-6 py-1 border border-gray-300 rounded focus:border-blue-500 focus:outline-none text-xs"
                                                />
                                                {searchTerm && (
                                                    <button
                                                        onClick={() => handleFilterSearchChange(filter.id, '')}
                                                        className="absolute right-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                        title="Clear"
                                                    >
                                                        <i className="fas fa-times" style={{fontSize: '9px'}}></i>
                                                    </button>
                                                )}
                                            </div>
                                            {searchTerm && (
                                                <p className="text-xs text-gray-600 mt-0.5">
                                                    {uniqueValues.length} of {allUniqueValues.length}
                                                </p>
                                            )}
                                        </div>

                                        {/* Compact Checkboxes */}
                                        <div className="max-h-32 overflow-y-auto space-y-0.5">
                                            {uniqueValues.length === 0 ? (
                                                <div className="text-center py-2 text-gray-500">
                                                    <i className="fas fa-search text-lg mb-1"></i>
                                                    <p className="text-xs">No results</p>
                                                </div>
                                            ) : (
                                                uniqueValues.map((value, index) => {
                                                    const isChecked = filter.values?.includes(value) || false;

                                                    return (
                                                        <label
                                                            key={value}
                                                            className="flex items-center gap-1.5 px-1.5 py-1 hover:bg-blue-100 rounded cursor-pointer transition"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onClick={(e) => {
                                                                    handleToggleFilterValue(filter.id, value, index, e.shiftKey, uniqueValues);
                                                                }}
                                                                onChange={() => {}}
                                                                className="w-3.5 h-3.5 text-blue-600 rounded"
                                                            />
                                                            <span className="text-xs text-gray-700 flex-1 truncate" title={value}>
                                                                {filter.column === 'marker' ? formatMarkerName(value) : value}
                                                            </span>
                                                        </label>
                                                    );
                                                })
                                            )}
                                        </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Empty State */}
                    {activeFilters.length === 0 && (
                        <div className="text-center py-4 text-gray-500 text-sm">
                            <i className="fas fa-info-circle mr-2"></i>
                            No filters active. Click "+ Add Filter" to filter activities by any column.
                        </div>
                    )}
                </div>
            </div>

            {/* Calendar and Activities Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar */}
                <div className="lg:col-span-2">
                    <div className="glass rounded-2xl p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <button
                                onClick={() => navigateMonth(-1)}
                                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition"
                            >
                                <i className="fas fa-chevron-left"></i>
                            </button>
                            <div className="flex items-center gap-4">
                                <h2 className="text-2xl font-bold text-gray-800">
                                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </h2>
                                {/* Only show Today button if not in current month */}
                                {(currentMonth.getMonth() !== TODAY.getMonth() || currentMonth.getFullYear() !== TODAY.getFullYear()) && (
                                    <button
                                        onClick={() => {
                                            setCurrentMonth(new Date());
                                            setSelectedDate(TODAY);
                                        }}
                                        className="px-3 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition text-sm font-semibold"
                                        title="Go to today"
                                    >
                                        <i className="fas fa-calendar-day mr-1"></i>
                                        Today
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => navigateMonth(1)}
                                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition"
                            >
                                <i className="fas fa-chevron-right"></i>
                            </button>
                        </div>

                        <div className="grid grid-cols-7 gap-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="text-center font-semibold text-gray-600 py-2">
                                    {day}
                                </div>
                            ))}

                            {calendarDays.map((date, idx) => {
                                if (!date) {
                                    return <div key={`empty-${idx}`} className="aspect-square"></div>;
                                }

                                const dateKey = dateToString(date);
                                const allDayActivities = activityMap[dateKey] || [];

                                // Apply filters to day activities (for dots)
                                const dayActivities = applyDynamicFilters(allDayActivities);

                                const hasActivities = dayActivities.length > 0;
                                const isToday = date.toDateString() === TODAY.toDateString();
                                const isSelected = date.toDateString() === selectedDate.toDateString();

                                // Check for markers on this specific day
                                const dayMarkers = allDayActivities
                                    .filter(act => {
                                        if (!act.marker || act.marker.type === 'none') return false;

                                        // Check if this day matches the marker's target date
                                        const markerDate = act.marker.applyTo === 'start' ? act.start : act.finish;

                                        // Only show marker if this day matches the marker's target date
                                        return markerDate === dateKey;
                                    })
                                    .map(act => ({
                                        ...act.marker,
                                        activity: act
                                    }));

                                // Marker type configurations
                                const markerConfig = {
                                    milestone: { icon: 'fas fa-gem', color: '#f59e0b' },
                                    critical: { icon: 'fas fa-exclamation-triangle', color: '#ef4444' },
                                    inspection: { icon: 'fas fa-clipboard-check', color: '#10b981' },
                                    deliverable: { icon: 'fas fa-flag-checkered', color: '#3b82f6' },
                                    deadline: { icon: 'fas fa-clock', color: '#f97316' }
                                };

                                return (
                                    <div
                                        key={dateKey}
                                        onClick={() => setSelectedDate(date)}
                                        className={`
                                            calendar-day aspect-square p-2 rounded-lg text-center relative
                                            ${isToday ? 'today' : ''}
                                            ${isSelected ? 'selected' : 'bg-white'}
                                            ${hasActivities && !isToday && !isSelected ? 'has-activities' : ''}
                                        `}
                                    >
                                        {/* Day number */}
                                        <div className="font-semibold">{date.getDate()}</div>

                                        {/* Markers - displayed prominently */}
                                        {dayMarkers.length > 0 && (
                                            <div className="flex justify-center items-center gap-1 mt-1">
                                                {dayMarkers.slice(0, 2).map((marker, i) => (
                                                    <i
                                                        key={i}
                                                        className={`${markerConfig[marker.type]?.icon || ''} text-sm`}
                                                        style={{
                                                            color: markerConfig[marker.type]?.color || '#000',
                                                            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
                                                        }}
                                                        title={`${marker.activity.name} - ${marker.type}`}
                                                    ></i>
                                                ))}
                                            </div>
                                        )}

                                        {/* Activity dots */}
                                        {hasActivities && (
                                            <div className="mt-1">
                                                {dayActivities.slice(0, 3).map((act, i) => (
                                                    <div
                                                        key={i}
                                                        className="activity-dot"
                                                        style={{ backgroundColor: areaConfig[act.area]?.color || '#94a3b8' }}
                                                    ></div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Marker Legend - Compact */}
                        <MarkerLegend />
                    </div>
                </div>

                {/* Activities List */}
                <div className="lg:col-span-1">
                    <div className="glass rounded-2xl p-6 shadow-xl">
                        {/* Header with Search */}
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xl font-bold text-gray-800">
                                    <i className="fas fa-tasks mr-2 text-slate-600"></i>
                                    Activities on {selectedDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                                </h3>
                            </div>

                            {/* Search Input */}
                            <div className="relative">
                                <input
                                    type="text"
                                    value={daySearchTerm}
                                    onChange={(e) => setDaySearchTerm(e.target.value)}
                                    placeholder="Search activities on this day..."
                                    className="w-full px-4 py-2 pl-10 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                                />
                                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                {daySearchTerm && (
                                    <button
                                        onClick={() => setDaySearchTerm('')}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                )}
                            </div>
                        </div>

                        {selectedDateActivities.length === 0 ? (
                            <div className="text-center py-8">
                                {daySearchTerm ? (
                                    <>
                                        <i className="fas fa-search text-4xl mb-3 opacity-50 text-gray-400"></i>
                                        <p className="text-gray-500 mb-2">No activities match "{daySearchTerm}"</p>
                                        <button
                                            onClick={() => setDaySearchTerm('')}
                                            className="text-blue-600 hover:text-blue-700 text-sm"
                                        >
                                            Clear search
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-calendar-times text-4xl mb-3 opacity-50 text-gray-400"></i>
                                        <p className="text-gray-500 mb-4">No activities on this day</p>
                                        <button
                                            onClick={() => setShowManualEntry(true)}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium text-sm"
                                        >
                                            <i className="fas fa-plus-circle mr-2"></i>
                                            Add Activity
                                        </button>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                {selectedDateActivities.map((activity, idx) => {
                                    // Marker configuration
                                    const markerConfig = {
                                        milestone: { icon: 'fas fa-gem', color: '#f59e0b' },
                                        critical: { icon: 'fas fa-exclamation-triangle', color: '#ef4444' },
                                        inspection: { icon: 'fas fa-clipboard-check', color: '#10b981' },
                                        deliverable: { icon: 'fas fa-flag-checkered', color: '#3b82f6' },
                                        deadline: { icon: 'fas fa-clock', color: '#f97316' }
                                    };

                                    return (
                                        <div
                                            key={idx}
                                            className="activity-card p-4 bg-white rounded-lg shadow-sm border-l-4 relative"
                                            style={{ borderColor: customAreaConfig[activity.area]?.color || '#94a3b8' }}
                                        >
                                            {/* Edit Button */}
                                            <button
                                                onClick={() => setEditingActivity(activity)}
                                                className="absolute top-2 right-2 px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded text-xs transition"
                                                title="Edit activity"
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>

                                        <div className="font-bold text-gray-800 mb-1 flex items-center gap-2">
                                            {activity.id}
                                            {/* Marker Icon - After Activity ID */}
                                            {activity.marker && activity.marker.type !== 'none' && (
                                                <i
                                                    className={`${markerConfig[activity.marker.type]?.icon || ''}`}
                                                    style={{
                                                        color: markerConfig[activity.marker.type]?.color || '#000',
                                                        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
                                                    }}
                                                    title={`${activity.marker.type} marker`}
                                                ></i>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-600 mb-2">{activity.name}</div>
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>
                                                <i className="fas fa-map-marker-alt mr-1"></i>
                                                {customAreaConfig[activity.area]?.name || activity.area}
                                            </span>
                                            <span>
                                                <i className="fas fa-clock mr-1"></i>
                                                {activity.rem_duration || activity.original_duration}d
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-2">
                                            {activity.start} → {activity.finish}
                                        </div>

                                        {/* Floor and Zone Display */}
                                        {(activity.floor || activity.zone) && (
                                            <div className="flex gap-2 mt-2">
                                                {activity.floor && (
                                                    <div className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                                        <i className="fas fa-layer-group mr-1"></i>
                                                        <strong>Floor:</strong> {customIdPatternConfig.floors[activity.floor] || activity.floor}
                                                    </div>
                                                )}
                                                {activity.zone && (
                                                    <div className="text-xs text-teal-600 bg-teal-50 px-2 py-1 rounded">
                                                        <i className="fas fa-th-large mr-1"></i>
                                                        <strong>Zone:</strong> {customIdPatternConfig.zones[activity.zone] || activity.zone}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {activity.contractor && (
                                            <div className="text-xs text-gray-700 mt-2 bg-gray-100 p-2 rounded">
                                                <i className="fas fa-hard-hat mr-1"></i>
                                                <strong>Contractor:</strong> {activity.contractor}
                                            </div>
                                        )}
                                        {activity.comments && (
                                            <div className="text-xs text-gray-700 mt-2 bg-gray-100 p-2 rounded">
                                                <i className="fas fa-comment mr-1"></i>
                                                <strong>Comments:</strong> {activity.comments}
                                            </div>
                                        )}
                                        {!activity.comments && (
                                            <div className="text-xs text-gray-400 mt-2 italic">
                                                <i className="fas fa-comment-slash mr-1"></i>
                                                No comments
                                            </div>
                                        )}
                                    </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Activities Without Dates Section */}
            {activitiesWithoutDates.length > 0 && (
                <div className="glass rounded-2xl p-6 mt-6 shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                        <i className="fas fa-exclamation-triangle text-yellow-600 text-2xl"></i>
                        <h3 className="text-2xl font-bold text-gray-800">
                            Activities Without Dates
                        </h3>
                        <span className="ml-auto text-sm text-gray-600">
                            {activitiesWithoutDates.length} {activitiesWithoutDates.length === 1 ? 'activity' : 'activities'}
                        </span>
                    </div>

                    <div className="text-sm text-gray-700 mb-4 bg-gray-100 border-l-4 border-gray-400 p-4 rounded">
                        <i className="fas fa-info-circle mr-2"></i>
                        These activities are missing Start and/or Finish dates. Add dates to move them to the calendar.
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activitiesWithoutDates.map((activity, idx) => {
                            const missingStart = !activity.start;
                            const missingFinish = !activity.finish;
                            const missingBoth = missingStart && missingFinish;

                            return (
                                <div
                                    key={idx}
                                    className="activity-card p-4 bg-white rounded-lg shadow-sm border-2 border-yellow-300"
                                >
                                    <div className="font-bold text-gray-800 mb-1 text-lg">{activity.id}</div>
                                    <div className="text-sm text-gray-600 mb-3">{activity.name}</div>

                                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                        <span>
                                            <i className="fas fa-map-marker-alt mr-1"></i>
                                            {customAreaConfig[activity.area]?.name || activity.area}
                                        </span>
                                        {activity.original_duration && (
                                            <span>
                                                <i className="fas fa-clock mr-1"></i>
                                                {activity.original_duration}d
                                            </span>
                                        )}
                                    </div>

                                    {/* Floor and Zone Display */}
                                    {(activity.floor || activity.zone) && (
                                        <div className="flex gap-2 mb-3">
                                            {activity.floor && (
                                                <div className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                                    <i className="fas fa-layer-group mr-1"></i>
                                                    <strong>Floor:</strong> {customIdPatternConfig.floors[activity.floor] || activity.floor}
                                                </div>
                                            )}
                                            {activity.zone && (
                                                <div className="text-xs text-teal-600 bg-teal-50 px-2 py-1 rounded">
                                                    <i className="fas fa-th-large mr-1"></i>
                                                    <strong>Zone:</strong> {customIdPatternConfig.zones[activity.zone] || activity.zone}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="bg-red-50 border border-red-200 rounded p-2 mb-3 text-xs">
                                        <i className="fas fa-calendar-times text-red-600 mr-2"></i>
                                        <span className="text-red-700 font-medium">
                                            {missingBoth ? 'Missing both Start & Finish dates' :
                                             missingStart ? 'Missing Start date' :
                                             'Missing Finish date'}
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => setEditingActivity(activity)}
                                        className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium"
                                    >
                                        <i className="fas fa-edit mr-2"></i>
                                        Edit & Add Dates
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Modals */}
            {showExportModal && (
                <ExportOptionsModal
                    onClose={() => setShowExportModal(false)}
                    currentUpdate={currentUpdate}
                    onExport={handleExportToExcel}
                    savedFilterLayouts={savedFilterLayouts}
                />
            )}

            {showComparisonModal && (
                <ComparisonModal
                    onClose={() => setShowComparisonModal(false)}
                    updates={updates}
                />
            )}

            {showBulkContractorModal && (
                <BulkContractorModal
                    onClose={() => setShowBulkContractorModal(false)}
                    currentUpdate={currentUpdate}
                    onAssign={handleBulkContractorAssignment}
                />
            )}

            {showConfigureCodesModal && (
                <ConfigureCodesModal
                    onClose={() => setShowConfigureCodesModal(false)}
                    areaConfig={customAreaConfig}
                    idPatternConfig={customIdPatternConfig}
                    onSave={handleSaveCodeConfiguration}
                />
            )}

            {showSettingsModal && (
                <SettingsModal
                    onClose={() => setShowSettingsModal(false)}
                    projectName={projectName}
                    onSaveProjectName={handleSaveProjectName}
                />
            )}

            {showSaveLayoutModal && (
                <SaveFilterLayoutModal
                    onClose={() => setShowSaveLayoutModal(false)}
                    onSave={handleSaveFilterLayout}
                    activeFilters={activeFilters}
                />
            )}

            {showImportWizard && (
                <ImportWizard
                    onClose={() => setShowImportWizard(false)}
                    onComplete={handleImportComplete}
                    currentUpdate={currentUpdate}
                    customHeaders={customHeaders}
                    onSaveCustomHeaders={handleSaveCustomHeaders}
                    onSaveFilters={(filters) => {
                        // Save filters to current update
                        setUpdates(prev => prev.map(u =>
                            u.id === currentUpdateId ? { ...u, savedFilters: filters } : u
                        ));
                    }}
                />
            )}

            {showManualEntry && (
                <ManualEntryModal
                    onClose={() => setShowManualEntry(false)}
                    onAdd={handleImportComplete}
                    currentUpdate={currentUpdateId}
                    prefilledDate={selectedDate}
                />
            )}

            {showRenameModal && currentUpdate && (
                <RenameUpdateModal
                    update={currentUpdate}
                    onClose={() => setShowRenameModal(false)}
                    onRename={handleRenameUpdate}
                />
            )}

            {showDeleteModal && currentUpdate && (
                <DeleteConfirmModal
                    update={currentUpdate}
                    onClose={() => setShowDeleteModal(false)}
                    onConfirm={handleDeleteUpdate}
                />
            )}

            {editingActivity && (
                <EditActivityModal
                    activity={editingActivity}
                    onClose={() => setEditingActivity(null)}
                    onSave={handleEditActivity}
                    customAreaConfig={customAreaConfig}
                    customIdPatternConfig={customIdPatternConfig}
                />
            )}

            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Footer */}
            <footer className="mt-8 py-6 border-t-2 border-gray-200">
                <div className="text-center text-gray-600">
                    <p className="text-sm">
                        Created by <span className="font-semibold text-gray-800">Lucio Aguilar</span>
                    </p>
                    <p className="text-xs mt-1">
                        © 2022 - {new Date().getFullYear()} All Rights Reserved
                    </p>
                </div>
            </footer>
        </div>
    );
}

