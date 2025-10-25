/**
 * Settings Modal Component
 *
 * Allows users to configure project settings including:
 * - Project name customization
 * - Future expandable settings sections
 *
 * @param {Object} props
 * @param {Function} props.onClose - Callback to close modal
 * @param {string} props.projectName - Current project name
 * @param {Function} props.onSaveProjectName - Callback to save new project name
 */

const { useState } = React;

function SettingsModal({ onClose, projectName, onSaveProjectName }) {
    const [name, setName] = useState(projectName);

    const handleSave = () => {
        if (name.trim()) {
            onSaveProjectName(name.trim());
            onClose();
        } else {
            alert('Project name cannot be empty');
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="glass rounded-2xl p-8 max-w-2xl w-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-bold text-gray-800">
                        <i className="fas fa-cog mr-3 text-gray-600"></i>
                        Settings
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl transition"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Project Name Section */}
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                        <i className="fas fa-project-diagram mr-2 text-blue-600"></i>
                        Project Name
                    </h3>
                    <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-4">
                        <p className="text-sm text-blue-800">
                            <i className="fas fa-info-circle mr-2"></i>
                            This name will appear in the header and will help you identify your project.
                        </p>
                    </div>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                        placeholder="e.g., Crown HS Schedule, Building A Construction, etc."
                    />
                </div>

                {/* Future sections placeholder */}
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500 mb-6">
                    <i className="fas fa-plus-circle text-3xl mb-2"></i>
                    <p className="text-sm">More settings will be added here in the future</p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-6 border-t-2 border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-gray-300 hover:bg-gray-400 rounded-lg transition font-medium"
                    >
                        <i className="fas fa-times mr-2"></i>
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
                    >
                        <i className="fas fa-save mr-2"></i>
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
}
