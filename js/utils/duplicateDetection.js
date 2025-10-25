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
