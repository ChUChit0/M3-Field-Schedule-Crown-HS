/**
 * Manual Entry Modal Component
 *
 * Form for manually adding a new activity with all fields.
 * Features auto-parsing of Activity ID to extract Area/Floor/Zone.
 * Supports pre-filling date when clicking on a calendar day.
 *
 * @param {Object} props
 * @param {Function} props.onClose - Callback to close modal
 * @param {Function} props.onAdd - Callback to add activity (activities, update)
 * @param {Object} props.currentUpdate - Current update object
 * @param {Date} props.prefilledDate - Optional prefilled date from calendar
 */

const { useState } = React;

function ManualEntryModal({ onClose, onAdd, currentUpdate, prefilledDate = null }) {
    const [activity, setActivity] = useState({
        id: '',
        name: '',
        area: 'A',
        floor: '',
        zone: '',
        contractor: '',
        original_duration: '',
        start: prefilledDate ? dateToString(prefilledDate) : '',
        finish: prefilledDate ? dateToString(prefilledDate) : '',
        actual_start: '',
        actual_finish: '',
        rem_duration: '',
        comments: ''
    });

    // 🆕 Auto-parse Activity ID when user types it
    const handleIdChange = (newId) => {
        const parsed = parseActivityID(newId);

        setActivity({
            ...activity,
            id: newId,
            // Auto-fill from parsed ID (parsed values override defaults)
            area: parsed.area || activity.area,
            floor: parsed.floor || activity.floor,
            zone: parsed.zone || activity.zone
        });
    };

    const handleSubmit = () => {
        if (!activity.id || !activity.name || !activity.start || !activity.finish) {
            alert('Please complete required fields: ID, Name, Start, Finish');
            return;
        }
        onAdd([activity], currentUpdate);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="glass rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6">
                    <i className="fas fa-plus-circle mr-3 text-slate-600"></i>
                    Add Activity Manually
                </h2>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold mb-1">Activity ID *</label>
                        <input
                            type="text"
                            value={activity.id}
                            onChange={(e) => handleIdChange(e.target.value)}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-slate-500 focus:outline-none"
                            placeholder="e.g., D-LL-INT-1230"
                        />
                        {activity.id && (activity.floor || activity.zone) && (
                            <div className="text-xs text-green-600 mt-1">
                                <i className="fas fa-check-circle mr-1"></i>
                                Auto-detected: {activity.floor && `Floor: ${activity.floor}`}{activity.floor && activity.zone && ', '}{activity.zone && `Zone: ${activity.zone}`}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-1">Area</label>
                        <select
                            value={activity.area}
                            onChange={(e) => setActivity({...activity, area: e.target.value})}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-slate-500 focus:outline-none"
                        >
                            {Object.keys(areaConfig).map(area => (
                                <option key={area} value={area}>{areaConfig[area].name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-1">Floor</label>
                        <input
                            type="text"
                            value={activity.floor}
                            onChange={(e) => setActivity({...activity, floor: e.target.value})}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-slate-500 focus:outline-none"
                            placeholder="e.g., Lower Level, 1st Floor..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-1">Zone</label>
                        <input
                            type="text"
                            value={activity.zone}
                            onChange={(e) => setActivity({...activity, zone: e.target.value})}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-slate-500 focus:outline-none"
                            placeholder="e.g., Interior, Kitchen..."
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-semibold mb-1">Contractor</label>
                        <input
                            type="text"
                            value={activity.contractor}
                            onChange={(e) => setActivity({...activity, contractor: e.target.value})}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-slate-500 focus:outline-none"
                            placeholder="e.g., M3, ACME, XYZ Corp..."
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-semibold mb-1">Activity Name *</label>
                        <input
                            type="text"
                            value={activity.name}
                            onChange={(e) => setActivity({...activity, name: e.target.value})}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-slate-500 focus:outline-none"
                            placeholder="Install Structural Steel"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-1">Start Date *</label>
                        <input
                            type="text"
                            value={activity.start}
                            onChange={(e) => setActivity({...activity, start: e.target.value})}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-slate-500 focus:outline-none"
                            placeholder="01/15/25"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-1">Finish Date *</label>
                        <input
                            type="text"
                            value={activity.finish}
                            onChange={(e) => setActivity({...activity, finish: e.target.value})}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-slate-500 focus:outline-none"
                            placeholder="01/20/25"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-1">Original Duration</label>
                        <input
                            type="text"
                            value={activity.original_duration}
                            onChange={(e) => setActivity({...activity, original_duration: e.target.value})}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-slate-500 focus:outline-none"
                            placeholder="5"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-1">New Rem Duration</label>
                        <input
                            type="text"
                            value={activity.rem_duration}
                            onChange={(e) => setActivity({...activity, rem_duration: e.target.value})}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-slate-500 focus:outline-none"
                            placeholder="3"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-1">Actual Start</label>
                        <input
                            type="text"
                            value={activity.actual_start}
                            onChange={(e) => setActivity({...activity, actual_start: e.target.value})}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-slate-500 focus:outline-none"
                            placeholder="01/16/25"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-1">Actual Finish</label>
                        <input
                            type="text"
                            value={activity.actual_finish}
                            onChange={(e) => setActivity({...activity, actual_finish: e.target.value})}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-slate-500 focus:outline-none"
                            placeholder="01/19/25"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-semibold mb-1">Comments</label>
                        <textarea
                            value={activity.comments}
                            onChange={(e) => setActivity({...activity, comments: e.target.value})}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-slate-500 focus:outline-none"
                            rows="3"
                            placeholder="Additional notes..."
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg transition">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition">
                        <i className="fas fa-plus mr-2"></i>
                        Add Activity
                    </button>
                </div>
            </div>
        </div>
    );
}
