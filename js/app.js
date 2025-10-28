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

const { useState, useEffect, useMemo } = React;

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
