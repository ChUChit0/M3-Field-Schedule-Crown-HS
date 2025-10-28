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
