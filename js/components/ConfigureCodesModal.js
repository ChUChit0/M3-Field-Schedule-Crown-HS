/**
 * Configure Activity ID Codes Modal Component
 *
 * Allows users to customize Activity ID code meanings:
 * - Area codes (E, D, C, B, F, etc.) with name and color
 * - Floor codes (LL, 01, 02, RF, etc.) with custom names
 * - Zone codes (INT, K, BAT, etc.) with custom names
 *
 * Includes visual ID pattern diagram showing: E - LL - INT - 1230
 *
 * @param {Object} props
 * @param {Function} props.onClose - Callback to close modal
 * @param {Object} props.areaConfig - Area configuration object
 * @param {Object} props.idPatternConfig - ID pattern configuration (floors, zones)
 * @param {Function} props.onSave - Callback to save configuration
 */

const { useState } = React;

export function ConfigureCodesModal({ onClose, areaConfig, idPatternConfig, onSave }) {
    const [areas, setAreas] = useState({ ...areaConfig });
    const [floors, setFloors] = useState({ ...idPatternConfig.floors });
    const [zones, setZones] = useState({ ...idPatternConfig.zones });
    const [selectedTab, setSelectedTab] = useState('areas'); // 'areas', 'floors', 'zones'

    const handleSave = () => {
        onSave({
            areas,
            idPatternConfig: {
                floors,
                zones
            }
        });
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content glass rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-bold text-gray-800">
                        <i className="fas fa-cog mr-3 text-purple-600"></i>
                        Configure Activity ID Codes
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Info Banner with Visual ID Pattern */}
                <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-3 mb-4">
                    <div className="flex items-start gap-3">
                        <i className="fas fa-info-circle text-blue-600 text-lg mt-0.5"></i>
                        <div className="flex-1">
                            <p className="text-xs text-blue-800 mb-2">
                                Activity IDs follow this pattern - customize what each code means:
                            </p>
                            <div className="bg-white rounded-lg p-3 border border-blue-200">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <span className="text-xl font-bold text-purple-700 font-mono">E</span>
                                    <span className="text-xl font-bold text-gray-400">-</span>
                                    <span className="text-xl font-bold text-indigo-700 font-mono">LL</span>
                                    <span className="text-xl font-bold text-gray-400">-</span>
                                    <span className="text-xl font-bold text-teal-700 font-mono">INT</span>
                                    <span className="text-xl font-bold text-gray-400">-</span>
                                    <span className="text-xl font-bold text-gray-600 font-mono">1230</span>
                                </div>
                                <div className="flex items-start justify-center gap-6 text-[10px]">
                                    <div className="w-8 text-center">
                                        <div className="text-purple-600 font-bold mb-0.5">↑</div>
                                        <div className="text-purple-700 font-semibold leading-tight">Area</div>
                                    </div>
                                    <div className="w-10"></div>
                                    <div className="w-10 text-center">
                                        <div className="text-indigo-600 font-bold mb-0.5">↑</div>
                                        <div className="text-indigo-700 font-semibold leading-tight">Floor</div>
                                    </div>
                                    <div className="w-10"></div>
                                    <div className="w-12 text-center">
                                        <div className="text-teal-600 font-bold mb-0.5">↑</div>
                                        <div className="text-teal-700 font-semibold leading-tight">Zone</div>
                                    </div>
                                    <div className="w-10"></div>
                                    <div className="w-16 text-center">
                                        <div className="text-gray-600 font-bold mb-0.5">↑</div>
                                        <div className="text-gray-700 font-semibold leading-tight">Number</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b-2 border-gray-200">
                    <button
                        onClick={() => setSelectedTab('areas')}
                        className={`px-6 py-3 font-semibold transition ${
                            selectedTab === 'areas'
                                ? 'text-purple-600 border-b-4 border-purple-600 -mb-0.5'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <i className="fas fa-map-marker-alt mr-2"></i>
                        Areas
                    </button>
                    <button
                        onClick={() => setSelectedTab('floors')}
                        className={`px-6 py-3 font-semibold transition ${
                            selectedTab === 'floors'
                                ? 'text-purple-600 border-b-4 border-purple-600 -mb-0.5'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <i className="fas fa-layer-group mr-2"></i>
                        Floors
                    </button>
                    <button
                        onClick={() => setSelectedTab('zones')}
                        className={`px-6 py-3 font-semibold transition ${
                            selectedTab === 'zones'
                                ? 'text-purple-600 border-b-4 border-purple-600 -mb-0.5'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <i className="fas fa-th-large mr-2"></i>
                        Zones
                    </button>
                </div>

                {/* Areas Tab */}
                {selectedTab === 'areas' && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Area Codes</h3>
                        {Object.keys(areas).map(code => (
                            <div key={code} className="flex items-center gap-4 p-4 bg-white rounded-lg border-2 border-gray-200">
                                <div className="w-20 font-mono font-bold text-lg text-gray-800">{code}</div>
                                <i className="fas fa-arrow-right text-gray-400"></i>
                                <input
                                    type="text"
                                    value={areas[code].name}
                                    onChange={(e) => setAreas({
                                        ...areas,
                                        [code]: { ...areas[code], name: e.target.value }
                                    })}
                                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                                    placeholder="e.g., Area E, Dock, Loading Zone"
                                />
                                <input
                                    type="color"
                                    value={areas[code].color}
                                    onChange={(e) => setAreas({
                                        ...areas,
                                        [code]: { ...areas[code], color: e.target.value }
                                    })}
                                    className="w-16 h-10 rounded cursor-pointer"
                                    title="Choose color"
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Floors Tab */}
                {selectedTab === 'floors' && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Floor Codes</h3>
                        {Object.keys(floors).map(code => (
                            <div key={code} className="flex items-center gap-4 p-4 bg-white rounded-lg border-2 border-gray-200">
                                <div className="w-20 font-mono font-bold text-lg text-gray-800">{code}</div>
                                <i className="fas fa-arrow-right text-gray-400"></i>
                                <input
                                    type="text"
                                    value={floors[code]}
                                    onChange={(e) => setFloors({
                                        ...floors,
                                        [code]: e.target.value
                                    })}
                                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                                    placeholder="e.g., 1st Floor, Zone 1, Lower Level"
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Zones Tab */}
                {selectedTab === 'zones' && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Zone Codes</h3>
                        {Object.keys(zones).map(code => (
                            <div key={code} className="flex items-center gap-4 p-4 bg-white rounded-lg border-2 border-gray-200">
                                <div className="w-20 font-mono font-bold text-lg text-gray-800">{code}</div>
                                <i className="fas fa-arrow-right text-gray-400"></i>
                                <input
                                    type="text"
                                    value={zones[code]}
                                    onChange={(e) => setZones({
                                        ...zones,
                                        [code]: e.target.value
                                    })}
                                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                                    placeholder="e.g., Interior, Kitchen, Loading Zone"
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-8 pt-6 border-t-2 border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-gray-300 hover:bg-gray-400 rounded-lg transition font-medium"
                    >
                        <i className="fas fa-times mr-2"></i>
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium"
                    >
                        <i className="fas fa-save mr-2"></i>
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );
}
