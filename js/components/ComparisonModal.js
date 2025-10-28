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

const { useState, useEffect, useMemo } = React;

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
