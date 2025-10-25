/**
 * Export Options Modal Component
 *
 * Provides filtering and sorting options for Excel export:
 * - Filter by contractor, area, floor, zone, activity name
 * - Sort by any field (ID, name, dates, etc.)
 * - Sort order (ascending/descending)
 *
 * @param {Object} props
 * @param {Function} props.onClose - Callback to close modal
 * @param {Object} props.currentUpdate - Current update with activities
 * @param {Function} props.onExport - Callback to export with filters and sorting
 */

const { useState } = React;

export function ExportOptionsModal({ onClose, currentUpdate, onExport }) {
    const [exportFilters, setExportFilters] = useState({
        contractor: '',
        area: '',
        floor: '',
        zone: '',
        activityName: ''
    });
    const [sortBy, setSortBy] = useState('start'); // Default: sort by Start Date
    const [sortOrder, setSortOrder] = useState('asc'); // asc or desc

    const handleExport = () => {
        onExport(exportFilters, sortBy, sortOrder);
        onClose();
    };

    // Get unique contractors, areas, floors, and zones for dropdowns
    const uniqueContractors = [...new Set(currentUpdate.activities.map(a => a.contractor).filter(Boolean))].sort();
    const uniqueAreas = [...new Set(currentUpdate.activities.map(a => a.area).filter(Boolean))].sort();
    const uniqueFloors = [...new Set(currentUpdate.activities.map(a => a.floor).filter(Boolean))].sort();
    const uniqueZones = [...new Set(currentUpdate.activities.map(a => a.zone).filter(Boolean))].sort();

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content glass rounded-2xl p-8 max-w-3xl w-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-bold text-gray-800">
                        <i className="fas fa-file-export mr-3 text-green-600"></i>
                        Export Options
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* STEP 1: Filters */}
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                        <i className="fas fa-filter mr-2 text-blue-600"></i>
                        Step 1: Filter Data (Optional)
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">Leave empty to export all activities</p>

                    <div className="space-y-4">
                        {/* Contractor Filter */}
                        <div>
                            <label className="block font-semibold mb-2">Filter by Contractor:</label>
                            <select
                                value={exportFilters.contractor}
                                onChange={(e) => setExportFilters({...exportFilters, contractor: e.target.value})}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            >
                                <option value="">All Contractors</option>
                                {uniqueContractors.map(contractor => (
                                    <option key={contractor} value={contractor}>{contractor}</option>
                                ))}
                            </select>
                        </div>

                        {/* Area Filter */}
                        <div>
                            <label className="block font-semibold mb-2">Filter by Area:</label>
                            <select
                                value={exportFilters.area}
                                onChange={(e) => setExportFilters({...exportFilters, area: e.target.value})}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            >
                                <option value="">All Areas</option>
                                {uniqueAreas.map(area => (
                                    <option key={area} value={area}>{area}</option>
                                ))}
                            </select>
                        </div>

                        {/* Floor Filter */}
                        <div>
                            <label className="block font-semibold mb-2">Filter by Floor:</label>
                            <select
                                value={exportFilters.floor}
                                onChange={(e) => setExportFilters({...exportFilters, floor: e.target.value})}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            >
                                <option value="">All Floors</option>
                                {uniqueFloors.map(floor => (
                                    <option key={floor} value={floor}>{floor}</option>
                                ))}
                            </select>
                        </div>

                        {/* Zone Filter */}
                        <div>
                            <label className="block font-semibold mb-2">Filter by Zone:</label>
                            <select
                                value={exportFilters.zone}
                                onChange={(e) => setExportFilters({...exportFilters, zone: e.target.value})}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            >
                                <option value="">All Zones</option>
                                {uniqueZones.map(zone => (
                                    <option key={zone} value={zone}>{zone}</option>
                                ))}
                            </select>
                        </div>

                        {/* Activity Name Filter */}
                        <div>
                            <label className="block font-semibold mb-2">Filter by Activity Name (contains):</label>
                            <input
                                type="text"
                                value={exportFilters.activityName}
                                onChange={(e) => setExportFilters({...exportFilters, activityName: e.target.value})}
                                placeholder="e.g., DRYWALL, FRAME, PAINT..."
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* STEP 2: Sort Options */}
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                        <i className="fas fa-sort mr-2 text-purple-600"></i>
                        Step 2: Sort Data
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Sort By Field */}
                        <div>
                            <label className="block font-semibold mb-2">Sort By:</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
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

                        {/* Sort Order */}
                        <div>
                            <label className="block font-semibold mb-2">Order:</label>
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                            >
                                <option value="asc">Ascending (A-Z, 0-9, Oldest First)</option>
                                <option value="desc">Descending (Z-A, 9-0, Newest First)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Preview Info */}
                <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-6">
                    <i className="fas fa-info-circle text-blue-600 mr-2"></i>
                    <span className="text-sm text-blue-800">
                        Export will include all filtered activities, sorted by <strong>{sortBy}</strong> in <strong>{sortOrder === 'asc' ? 'ascending' : 'descending'}</strong> order.
                    </span>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-gray-300 hover:bg-gray-400 rounded-lg transition font-medium"
                    >
                        <i className="fas fa-times mr-2"></i>
                        Cancel
                    </button>
                    <button
                        onClick={handleExport}
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium"
                    >
                        <i className="fas fa-file-excel mr-2"></i>
                        Export to Excel
                    </button>
                </div>
            </div>
        </div>
    );
}
