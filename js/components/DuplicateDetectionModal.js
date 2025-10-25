// Duplicate Detection Modal Component
// Intelligent modal for handling duplicate activities during import

import { getNextUpdateNumber } from '../utils/duplicateDetection.js';

export function DuplicateDetectionModal({
    analysis,
    currentUpdate,
    allUpdates,
    onCancel,
    onImportNewOnly,
    onReplaceAndImport,
    onCreateNewUpdate
}) {
    const { duplicates, updates, newActivities, statistics, recommendation } = analysis;
    const [selectedOption, setSelectedOption] = React.useState(null);
    const [showDetails, setShowDetails] = React.useState(false);

    const nextUpdateNumber = getNextUpdateNumber(allUpdates);

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
            <div className="modal-content glass rounded-2xl p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-bold text-gray-800">
                        <i className="fas fa-search-plus mr-3 text-blue-600"></i>
                        Duplicate Detection Analysis
                    </h2>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Statistics Dashboard */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="glass rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-blue-600">{statistics.total}</div>
                        <div className="text-sm text-gray-600 mt-1">Total Activities</div>
                    </div>
                    <div className="glass rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-green-600">{statistics.newCount}</div>
                        <div className="text-sm text-gray-600 mt-1">New Activities</div>
                    </div>
                    <div className="glass rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-yellow-600">{statistics.updateCount}</div>
                        <div className="text-sm text-gray-600 mt-1">With Changes</div>
                    </div>
                    <div className="glass rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-red-600">{statistics.duplicateCount}</div>
                        <div className="text-sm text-gray-600 mt-1">Exact Duplicates</div>
                    </div>
                </div>

                {/* AI Recommendation */}
                <div className={`bg-${recommendation.color}-50 border-l-4 border-${recommendation.color}-500 rounded-lg p-6 mb-6`}>
                    <div className="flex items-start">
                        <i className={`fas ${recommendation.icon} text-${recommendation.color}-600 text-3xl mr-4 mt-1`}></i>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-800 mb-2">
                                <i className="fas fa-robot mr-2"></i>
                                AI Recommendation: {recommendation.title}
                            </h3>
                            <p className="text-gray-700 mb-2">{recommendation.message}</p>
                            <p className="text-gray-600 text-sm italic">{recommendation.suggestion}</p>
                        </div>
                    </div>
                </div>

                {/* Options */}
                <div className="space-y-4 mb-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                        <i className="fas fa-tasks mr-2"></i>
                        Choose Import Strategy:
                    </h3>

                    {/* Option 1: Create New Update (if recommended) */}
                    {recommendation.type === 'CREATE_NEW_UPDATE' && (
                        <button
                            onClick={() => setSelectedOption('new-update')}
                            className={`w-full text-left p-4 rounded-xl border-2 transition ${
                                selectedOption === 'new-update'
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-300 hover:border-blue-300'
                            }`}
                        >
                            <div className="flex items-start">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 mt-1 ${
                                    selectedOption === 'new-update' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                                }`}>
                                    {selectedOption === 'new-update' && <i className="fas fa-check text-white text-xs"></i>}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-800 mb-1">
                                        <i className="fas fa-plus-square text-blue-600 mr-2"></i>
                                        Create Update {nextUpdateNumber} (Recommended)
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                        Create a new update version with all {statistics.total} activities.
                                        This preserves historical data and allows you to track changes over time.
                                        Your current update ({currentUpdate.name}) will remain unchanged.
                                    </p>
                                </div>
                            </div>
                        </button>
                    )}

                    {/* Option 2: Import New Only */}
                    <button
                        onClick={() => setSelectedOption('new-only')}
                        className={`w-full text-left p-4 rounded-xl border-2 transition ${
                            selectedOption === 'new-only'
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-300 hover:border-green-300'
                        }`}
                    >
                        <div className="flex items-start">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 mt-1 ${
                                selectedOption === 'new-only' ? 'border-green-500 bg-green-500' : 'border-gray-300'
                            }`}>
                                {selectedOption === 'new-only' && <i className="fas fa-check text-white text-xs"></i>}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-800 mb-1">
                                    <i className="fas fa-plus-circle text-green-600 mr-2"></i>
                                    Import {statistics.newCount} New Activities Only
                                </h4>
                                <p className="text-sm text-gray-600">
                                    Add only new activities to {currentUpdate.name}.
                                    Skip all duplicates ({statistics.duplicateCount}) and activities with changes ({statistics.updateCount}).
                                </p>
                            </div>
                        </div>
                    </button>

                    {/* Option 3: Replace and Import */}
                    {statistics.updateCount > 0 && (
                        <button
                            onClick={() => setSelectedOption('replace-and-import')}
                            className={`w-full text-left p-4 rounded-xl border-2 transition ${
                                selectedOption === 'replace-and-import'
                                    ? 'border-yellow-500 bg-yellow-50'
                                    : 'border-gray-300 hover:border-yellow-300'
                            }`}
                        >
                            <div className="flex items-start">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 mt-1 ${
                                    selectedOption === 'replace-and-import' ? 'border-yellow-500 bg-yellow-500' : 'border-gray-300'
                                }`}>
                                    {selectedOption === 'replace-and-import' && <i className="fas fa-check text-white text-xs"></i>}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-800 mb-1">
                                        <i className="fas fa-sync-alt text-yellow-600 mr-2"></i>
                                        Replace {statistics.updateCount} Activities + Import {statistics.newCount} New
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                        Update existing activities with new data and add new activities.
                                        Skip exact duplicates ({statistics.duplicateCount}).
                                        <span className="text-yellow-700 font-semibold ml-1">Warning: This will modify {currentUpdate.name}.</span>
                                    </p>
                                </div>
                            </div>
                        </button>
                    )}
                </div>

                {/* Details Toggle */}
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="w-full text-left px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition mb-4"
                >
                    <i className={`fas fa-chevron-${showDetails ? 'up' : 'down'} mr-2`}></i>
                    {showDetails ? 'Hide' : 'Show'} Detailed Activity Breakdown
                </button>

                {/* Detailed Breakdown */}
                {showDetails && (
                    <div className="space-y-6 mb-6">
                        {/* New Activities */}
                        {newActivities.length > 0 && (
                            <div className="glass rounded-xl p-4">
                                <h4 className="font-bold text-gray-800 mb-3">
                                    <i className="fas fa-plus-circle text-green-600 mr-2"></i>
                                    New Activities ({newActivities.length})
                                </h4>
                                <div className="max-h-60 overflow-y-auto space-y-2">
                                    {newActivities.slice(0, 20).map((act, idx) => (
                                        <div key={idx} className="p-3 bg-white rounded-lg border border-green-200 text-sm">
                                            <div className="font-mono font-semibold text-gray-800">{act.id}</div>
                                            <div className="text-gray-600">{act.name}</div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {act.start} → {act.finish}
                                            </div>
                                        </div>
                                    ))}
                                    {newActivities.length > 20 && (
                                        <div className="text-center text-sm text-gray-500 py-2">
                                            And {newActivities.length - 20} more...
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Activities with Changes */}
                        {updates.length > 0 && (
                            <div className="glass rounded-xl p-4">
                                <h4 className="font-bold text-gray-800 mb-3">
                                    <i className="fas fa-sync-alt text-yellow-600 mr-2"></i>
                                    Activities with Changes ({updates.length})
                                </h4>
                                <div className="max-h-60 overflow-y-auto space-y-2">
                                    {updates.slice(0, 10).map((update, idx) => (
                                        <div key={idx} className="p-3 bg-white rounded-lg border border-yellow-200 text-sm">
                                            <div className="font-mono font-semibold text-gray-800">{update.activity.id}</div>
                                            <div className="text-gray-600">{update.activity.name}</div>
                                            <div className="mt-2 space-y-1">
                                                {update.differences.map((diff, i) => (
                                                    <div key={i} className="flex items-center text-xs">
                                                        <span className="text-gray-500 capitalize w-20">{diff.field}:</span>
                                                        <span className="text-red-600 line-through mr-2">{diff.oldValue || '(empty)'}</span>
                                                        <i className="fas fa-arrow-right text-gray-400 mr-2"></i>
                                                        <span className="text-green-600">{diff.newValue || '(empty)'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {updates.length > 10 && (
                                        <div className="text-center text-sm text-gray-500 py-2">
                                            And {updates.length - 10} more...
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Exact Duplicates */}
                        {duplicates.length > 0 && (
                            <div className="glass rounded-xl p-4">
                                <h4 className="font-bold text-gray-800 mb-3">
                                    <i className="fas fa-copy text-red-600 mr-2"></i>
                                    Exact Duplicates ({duplicates.length})
                                </h4>
                                <div className="max-h-60 overflow-y-auto space-y-2">
                                    {duplicates.slice(0, 10).map((dup, idx) => (
                                        <div key={idx} className="p-3 bg-white rounded-lg border border-red-200 text-sm">
                                            <div className="font-mono font-semibold text-gray-800">{dup.activity.id}</div>
                                            <div className="text-gray-600">{dup.activity.name}</div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {dup.activity.start} → {dup.activity.finish}
                                            </div>
                                        </div>
                                    ))}
                                    {duplicates.length > 10 && (
                                        <div className="text-center text-sm text-gray-500 py-2">
                                            And {duplicates.length - 10} more...
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t-2 border-gray-200">
                    <button
                        onClick={onCancel}
                        className="px-6 py-3 bg-gray-300 hover:bg-gray-400 rounded-lg transition font-medium"
                    >
                        <i className="fas fa-times mr-2"></i>
                        Cancel Import
                    </button>

                    {selectedOption === 'new-update' && (
                        <button
                            onClick={() => onCreateNewUpdate(newActivities, updates, duplicates)}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
                        >
                            <i className="fas fa-plus-square mr-2"></i>
                            Create Update {nextUpdateNumber}
                        </button>
                    )}

                    {selectedOption === 'new-only' && (
                        <button
                            onClick={() => onImportNewOnly(newActivities)}
                            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium"
                        >
                            <i className="fas fa-plus-circle mr-2"></i>
                            Import {statistics.newCount} New Activities
                        </button>
                    )}

                    {selectedOption === 'replace-and-import' && (
                        <button
                            onClick={() => onReplaceAndImport(newActivities, updates)}
                            className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition font-medium"
                        >
                            <i className="fas fa-sync-alt mr-2"></i>
                            Replace & Import ({statistics.updateCount + statistics.newCount} activities)
                        </button>
                    )}

                    {!selectedOption && (
                        <button
                            disabled
                            className="px-6 py-3 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
                        >
                            Select an Option Above
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
