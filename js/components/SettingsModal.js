/**
 * Settings Modal Component
 *
 * Allows users to configure project settings including:
 * - Project name customization
 * - Version information
 * - Release notes
 *
 * @param {Object} props
 * @param {Function} props.onClose - Callback to close modal
 * @param {string} props.projectName - Current project name
 * @param {Function} props.onSaveProjectName - Callback to save new project name
 */

const { useState } = React;

function SettingsModal({ onClose, projectName, onSaveProjectName }) {
    const APP_VERSION = "1.3.0";
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
            <div className="glass rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800">
                            <i className="fas fa-cog mr-3 text-gray-600"></i>
                            Settings
                        </h2>
                        <p className="text-sm text-gray-500 mt-1 ml-12">Version {APP_VERSION}</p>
                    </div>
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

                {/* Release Notes Section */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">
                        Release Notes
                    </h3>
                    <div className="bg-gray-50 rounded p-4 space-y-4 max-h-64 overflow-y-auto">
                        {/* Version 1.3.0 */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-gray-800">v1.3.0</span>
                                <span className="text-xs text-gray-500">October 2025</span>
                            </div>
                            <ul className="space-y-1 text-sm text-gray-700 ml-4">
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400">•</span>
                                    <span>Multi-select filters with Shift+Click range selection</span>
                                </li>
                            </ul>
                        </div>

                        {/* Version 1.2.0 */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-gray-800">v1.2.0</span>
                                <span className="text-xs text-gray-500">April 2025</span>
                            </div>
                            <ul className="space-y-1 text-sm text-gray-700 ml-4">
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400">•</span>
                                    <span>Collapsible accordion interface for space optimization</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400">•</span>
                                    <span>Mass contractor assignment to filtered activities</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400">•</span>
                                    <span>Real-time activity counter with search functionality</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400">•</span>
                                    <span>Professional styling and UI improvements</span>
                                </li>
                            </ul>
                        </div>

                        {/* Version 1.1.0 */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-gray-800">v1.1.0</span>
                                <span className="text-xs text-gray-500">October 2024</span>
                            </div>
                            <ul className="space-y-1 text-sm text-gray-700 ml-4">
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400">•</span>
                                    <span>Modular architecture with build system</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400">•</span>
                                    <span>Enhanced column mapping and validation</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400">•</span>
                                    <span>Import Wizard preview improvements</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400">•</span>
                                    <span>Performance optimizations and bug fixes</span>
                                </li>
                            </ul>
                        </div>

                        {/* Version 1.0.0 */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-gray-800">v1.0.0</span>
                                <span className="text-xs text-gray-500">September 2022</span>
                            </div>
                            <ul className="space-y-1 text-sm text-gray-700 ml-4">
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400">•</span>
                                    <span>Initial production release</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400">•</span>
                                    <span>Interactive calendar with activity scheduling</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400">•</span>
                                    <span>Excel import/export with column mapping</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400">•</span>
                                    <span>Intelligent duplicate detection</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400">•</span>
                                    <span>Multi-update management and version control</span>
                                </li>
                            </ul>
                        </div>
                    </div>
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
