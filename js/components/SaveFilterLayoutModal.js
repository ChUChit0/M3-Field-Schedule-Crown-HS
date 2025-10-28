/**
 * Save Filter Layout Modal Component
 *
 * Allows users to save current filter configuration with a custom name
 * for quick reuse later. Saves time when dealing with complex filter
 * combinations (e.g., 10 specific Activity IDs + 15 Activity Names).
 *
 * @param {Object} props
 * @param {Function} props.onClose - Callback to close modal
 * @param {Function} props.onSave - Callback to save layout with name
 * @param {Array} props.activeFilters - Current active filters to save
 */

const { useState } = React;

function SaveFilterLayoutModal({ onClose, onSave, activeFilters }) {
    const [layoutName, setLayoutName] = useState('');

    const handleSave = () => {
        if (!layoutName.trim()) {
            alert('Please enter a name for this filter layout');
            return;
        }

        if (activeFilters.length === 0) {
            alert('No active filters to save');
            return;
        }

        onSave(layoutName.trim());
        onClose();
    };

    // Count total selected values across all filters
    const totalSelections = activeFilters.reduce((sum, filter) => {
        return sum + (filter.values?.length || 0);
    }, 0);

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="glass rounded-2xl p-6 max-w-md w-full">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">
                    <i className="fas fa-save mr-3 text-blue-600"></i>
                    Save Filter Layout
                </h2>

                <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800">
                        <i className="fas fa-info-circle mr-2"></i>
                        Save your current filter configuration to quickly apply it later.
                    </p>
                </div>

                {/* Current Filter Summary */}
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 mb-4">
                    <p className="text-sm font-semibold text-gray-800 mb-2">
                        Current Configuration:
                    </p>
                    <div className="space-y-1 text-xs text-gray-700">
                        {activeFilters.map((filter, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <i className="fas fa-filter text-gray-500"></i>
                                <span className="font-medium">{filter.column}:</span>
                                <span className="text-gray-600">{filter.values?.length || 0} selected</span>
                            </div>
                        ))}
                        <div className="border-t border-gray-300 mt-2 pt-2">
                            <span className="font-bold text-gray-800">
                                Total: {totalSelections} selections across {activeFilters.length} filters
                            </span>
                        </div>
                    </div>
                </div>

                {/* Layout Name Input */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold mb-2 text-gray-800">
                        Layout Name *
                    </label>
                    <input
                        type="text"
                        value={layoutName}
                        onChange={(e) => setLayoutName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-base"
                        placeholder="e.g., Area A - Critical Items"
                        autoFocus
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Choose a descriptive name to easily identify this layout later
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg transition font-medium"
                    >
                        <i className="fas fa-times mr-2"></i>
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
                    >
                        <i className="fas fa-save mr-2"></i>
                        Save Layout
                    </button>
                </div>
            </div>
        </div>
    );
}
