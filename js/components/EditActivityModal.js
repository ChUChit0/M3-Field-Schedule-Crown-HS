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

export function EditActivityModal({ activity, onClose, onSave, customAreaConfig, customIdPatternConfig }) {
    const [editedActivity, setEditedActivity] = useState({
        ...activity
    });

    const handleSave = () => {
        if (!editedActivity.id || !editedActivity.name) {
            alert('Activity ID and Name are required');
            return;
        }

        if (!editedActivity.start || !editedActivity.finish) {
            alert('Please provide both Start and Finish dates to move this activity to the calendar');
            return;
        }

        onSave(editedActivity);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="glass rounded-2xl p-8 max-w-2xl w-full">
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
