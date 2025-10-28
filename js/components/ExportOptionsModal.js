/**
 * Export Options Modal Component - Redesigned
 *
 * Two main export modes:
 * - Quick Export: Load saved filter layout
 * - Manual Export: Configure filters manually
 *
 * Modes are mutually exclusive for clarity
 */

const { useState, useMemo } = React;

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
