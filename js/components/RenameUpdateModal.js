/**
 * Rename Update Modal Component
 *
 * Simple modal for renaming an update (e.g., "Update 12" → "Week 3 Update").
 *
 * @param {Object} props
 * @param {Object} props.update - Update to rename
 * @param {Function} props.onClose - Callback to close modal
 * @param {Function} props.onRename - Callback to rename update (updateId, newName)
 */

const { useState } = React;

function RenameUpdateModal({ update, onClose, onRename }) {
    const [newName, setNewName] = useState(update.name);

    const handleSubmit = () => {
        if (newName.trim()) {
            onRename(update.id, newName.trim());
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="glass rounded-2xl p-8 max-w-md w-full">
                <h2 className="text-2xl font-bold mb-6">
                    <i className="fas fa-edit mr-3 text-slate-600"></i>
                    Rename Update
                </h2>
                <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-slate-500 focus:outline-none mb-6"
                    placeholder="Update name..."
                    autoFocus
                />
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg transition">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition">
                        <i className="fas fa-save mr-2"></i>
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
