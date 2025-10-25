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

    // State: Filters
    const [filters, setFilters] = useState({
        area: 'all',
        floor: '',
        zone: '',
        workType: 'all'
    });

    // State: Modal visibility
    const [showImportWizard, setShowImportWizard] = useState(false);
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showBulkContractorModal, setShowBulkContractorModal] = useState(false);
    const [showConfigureCodesModal, setShowConfigureCodesModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
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
     */
    const handleImportComplete = (activities, updateId) => {
        setUpdates(prev => prev.map(u =>
            u.id === updateId ? { ...u, activities: [...u.activities, ...activities], loaded: true } : u
        ));
        showToast(`Imported ${activities.length} activities`, 'success');
    };

    /**
     * Handler: Edit activity
     */
    const handleEditActivity = (editedActivity) => {
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
     * Memo: Filter activities based on current filter settings
     */
    const filteredActivities = useMemo(() => {
        if (!currentUpdate) return [];

        return currentUpdate.activities.filter(activity => {
            if (filters.area !== 'all' && activity.area !== filters.area) return false;
            if (filters.floor && activity.floor !== filters.floor) return false;
            if (filters.zone && activity.zone !== filters.zone) return false;
            if (filters.workType !== 'all' && activity.name !== filters.workType) return false;
            return true;
        });
    }, [currentUpdate, filters]);

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
     * Memo: Get unique work types
     */
    const workTypes = useMemo(() => {
        if (!currentUpdate) return [];
        const types = new Set(currentUpdate.activities.map(a => a.name));
        return Array.from(types).sort();
    }, [currentUpdate]);

    /**
     * Memo: Get activities for selected date
     */
    const selectedDateActivities = useMemo(() => {
        const dateKey = dateToString(selectedDate);
        const activities = activityMap[dateKey] || [];

        return activities.filter(activity => {
            if (filters.area !== 'all' && activity.area !== filters.area) return false;
            if (filters.floor && activity.floor !== filters.floor) return false;
            if (filters.zone && activity.zone !== filters.zone) return false;
            if (filters.workType !== 'all' && activity.name !== filters.workType) return false;
            return true;
        });
    }, [activityMap, selectedDate, filters]);

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
    const handleExportToExcel = (filters, sortBy, sortOrder) => {
        try {
            let activities = [...currentUpdate.activities];

            if (activities.length === 0) {
                showToast('No activities to export', 'error');
                return;
            }

            // STEP 1: Apply Filters
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

            if (activities.length === 0) {
                showToast('No activities match the filters', 'error');
                return;
            }

            // STEP 2: Sort Activities
            activities.sort((a, b) => {
                let aVal = a[sortBy] || '';
                let bVal = b[sortBy] || '';

                // For date fields, compare as dates (format: YYYY-MM-DD)
                const dateFields = ['start', 'finish', 'actual_start', 'actual_finish'];
                if (dateFields.includes(sortBy)) {
                    // Handle empty dates (push to end)
                    if (!aVal && !bVal) return 0;
                    if (!aVal) return 1;  // Empty dates go to end
                    if (!bVal) return -1;

                    // Compare dates as YYYY-MM-DD strings (works correctly)
                    if (sortOrder === 'asc') {
                        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                    } else {
                        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
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

            // Prepare data for Excel with all fields
            const excelData = activities.map(activity => ({
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
                'Percent Complete': activity.percent_complete || '0',
                'Comments': activity.comments || ''
            }));

            // Create worksheet
            const ws = XLSX.utils.json_to_sheet(excelData);

            // Set column widths for 11x17 landscape (optimal widths)
            ws['!cols'] = [
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
                { wch: 12 },  // Percent Complete
                { wch: 25 }   // Comments
            ];

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
                    <div className="flex gap-4 items-center">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowBulkContractorModal(true)}
                                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition text-sm font-semibold"
                                title="Assign contractor to multiple activities at once"
                            >
                                <i className="fas fa-users-cog mr-2"></i>
                                Assign Contractor
                            </button>
                            <button
                                onClick={() => setShowConfigureCodesModal(true)}
                                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition text-sm font-semibold"
                                title="Configure what each Activity ID code means in your project"
                            >
                                <i className="fas fa-cog mr-2"></i>
                                Configure Codes
                            </button>
                            <button
                                onClick={() => setShowExportModal(true)}
                                className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm font-semibold"
                                title="Export current update to Excel with filters and sorting"
                            >
                                <i className="fas fa-file-excel mr-2"></i>
                                Export to Excel
                            </button>
                            <button
                                onClick={handleClearAllData}
                                className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition text-sm"
                                title="Clear all data"
                            >
                                <i className="fas fa-trash-alt"></i>
                            </button>
                        </div>
                        <div className="text-center border-l border-gray-300 pl-4">
                            <div className="text-sm text-gray-500">TODAY</div>
                            <div className="text-2xl font-bold text-amber-600">{TODAY.getDate()}</div>
                            <div className="text-xs text-gray-500">{TODAY.toLocaleDateString('en-US', { month: 'short' })}</div>
                        </div>
                        <div className="text-center px-4 border-l border-gray-300">
                            <div className="text-sm text-gray-500">Total</div>
                            <div className="text-2xl font-bold text-slate-600">{filteredActivities.length}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Update Management Bar */}
            <div className="glass rounded-2xl p-6 mb-6 shadow-xl">
                <div className="flex items-center gap-4">
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

                    <button
                        onClick={handleCreateNewUpdate}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium"
                    >
                        <i className="fas fa-plus mr-2"></i>
                        New Update
                    </button>

                    <div className="ml-auto flex gap-3">
                        <button
                            onClick={() => setShowImportWizard(true)}
                            className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition font-medium"
                        >
                            <i className="fas fa-file-import mr-2"></i>
                            Import Excel
                        </button>

                        <button
                            onClick={() => setShowManualEntry(true)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
                        >
                            <i className="fas fa-plus-circle mr-2"></i>
                            Manual Entry
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="glass rounded-2xl p-6 mb-6 shadow-xl">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <i className="fas fa-filter text-slate-600"></i>
                        <span className="font-semibold text-gray-700">Filters:</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Area:</label>
                        <select
                            value={filters.area}
                            onChange={(e) => setFilters({...filters, area: e.target.value})}
                            className="px-3 py-1.5 rounded-lg border-2 border-gray-300 focus:border-slate-500 focus:outline-none text-sm"
                        >
                            <option value="all">All</option>
                            {Object.keys(areaConfig).map(area => (
                                <option key={area} value={area}>{area}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Floor:</label>
                        <select
                            value={filters.floor || 'all'}
                            onChange={(e) => setFilters({...filters, floor: e.target.value === 'all' ? '' : e.target.value})}
                            className="px-3 py-1.5 rounded-lg border-2 border-gray-300 focus:border-slate-500 focus:outline-none text-sm"
                        >
                            <option value="all">All</option>
                            {[...new Set(currentUpdate?.activities.map(a => a.floor).filter(Boolean))].sort().map(floor => (
                                <option key={floor} value={floor}>{floor}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Zone:</label>
                        <select
                            value={filters.zone || 'all'}
                            onChange={(e) => setFilters({...filters, zone: e.target.value === 'all' ? '' : e.target.value})}
                            className="px-3 py-1.5 rounded-lg border-2 border-gray-300 focus:border-slate-500 focus:outline-none text-sm"
                        >
                            <option value="all">All</option>
                            {[...new Set(currentUpdate?.activities.map(a => a.zone).filter(Boolean))].sort().map(zone => (
                                <option key={zone} value={zone}>{zone}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Work Type:</label>
                        <select
                            value={filters.workType}
                            onChange={(e) => setFilters({...filters, workType: e.target.value})}
                            className="px-3 py-1.5 rounded-lg border-2 border-gray-300 focus:border-slate-500 focus:outline-none text-sm"
                        >
                            <option value="all">All</option>
                            {workTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => setFilters({ area: 'all', floor: '', zone: '', workType: 'all' })}
                        className="ml-auto px-4 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition"
                    >
                        <i className="fas fa-times mr-2"></i>
                        Clear
                    </button>
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
                                const dayActivities = allDayActivities.filter(activity => {
                                    if (filters.area !== 'all' && activity.area !== filters.area) return false;
                                    if (filters.floor && activity.floor !== filters.floor) return false;
                                    if (filters.zone && activity.zone !== filters.zone) return false;
                                    if (filters.workType !== 'all' && activity.name !== filters.workType) return false;
                                    return true;
                                });

                                const hasActivities = dayActivities.length > 0;
                                const isToday = date.toDateString() === TODAY.toDateString();
                                const isSelected = date.toDateString() === selectedDate.toDateString();

                                return (
                                    <div
                                        key={dateKey}
                                        onClick={() => setSelectedDate(date)}
                                        className={`
                                            calendar-day aspect-square p-2 rounded-lg text-center
                                            ${isToday ? 'today' : ''}
                                            ${isSelected ? 'selected' : 'bg-white'}
                                            ${hasActivities && !isToday && !isSelected ? 'has-activities' : ''}
                                        `}
                                    >
                                        <div className="font-semibold">{date.getDate()}</div>
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
                    </div>
                </div>

                {/* Activities List */}
                <div className="lg:col-span-1">
                    <div className="glass rounded-2xl p-6 shadow-xl">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">
                            <i className="fas fa-tasks mr-2 text-slate-600"></i>
                            Activities on {selectedDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                        </h3>

                        {selectedDateActivities.length === 0 ? (
                            <div className="text-center py-8">
                                <i className="fas fa-calendar-times text-4xl mb-3 opacity-50 text-gray-400"></i>
                                <p className="text-gray-500 mb-4">No activities on this day</p>
                                <button
                                    onClick={() => setShowManualEntry(true)}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium text-sm"
                                >
                                    <i className="fas fa-plus-circle mr-2"></i>
                                    Add Activity
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                {selectedDateActivities.map((activity, idx) => (
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

                                        <div className="font-bold text-gray-800 mb-1">{activity.id}</div>
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
                                            <div className="text-xs text-purple-600 mt-2 bg-purple-50 p-2 rounded">
                                                <i className="fas fa-hard-hat mr-1"></i>
                                                <strong>Contractor:</strong> {activity.contractor}
                                            </div>
                                        )}
                                        {activity.comments && (
                                            <div className="text-xs text-blue-600 mt-2 bg-blue-50 p-2 rounded">
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
                                ))}
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

                    <div className="text-sm text-gray-600 mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
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

            {showImportWizard && (
                <ImportWizard
                    onClose={() => setShowImportWizard(false)}
                    onComplete={handleImportComplete}
                    currentUpdate={currentUpdate}
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
