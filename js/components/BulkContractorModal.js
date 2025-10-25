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

const { useState } = React;

export function BulkContractorModal({ onClose, currentUpdate, onAssign }) {
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
            <div className="modal-content glass rounded-2xl p-8 max-w-4xl w-full">
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
