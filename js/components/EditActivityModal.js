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

const { useState } = React;

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
