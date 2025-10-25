/**
 * Delete Confirmation Modal Component
 *
 * Confirmation dialog before deleting an update.
 * Shows warning about permanent deletion and activity count.
 *
 * @param {Object} props
 * @param {Object} props.update - Update to delete
 * @param {Function} props.onClose - Callback to close modal
 * @param {Function} props.onConfirm - Callback to confirm deletion
 */

function DeleteConfirmModal({ update, onClose, onConfirm }) {
    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="glass rounded-2xl p-8 max-w-md w-full">
                <h2 className="text-2xl font-bold mb-4 text-red-600">
                    <i className="fas fa-exclamation-triangle mr-3"></i>
                    Delete Update?
                </h2>
                <p className="text-gray-700 mb-2">
                    Are you sure you want to delete <strong>{update.name}</strong>?
                </p>
                <p className="text-gray-600 text-sm mb-6">
                    This will permanently delete {update.activities.length} activities. This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg transition">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition">
                        <i className="fas fa-trash mr-2"></i>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}
