/**
 * Marker Legend Component - Compact Version
 * Simple horizontal legend showing marker types
 */

function MarkerLegend() {
    const markerTypes = [
        { name: 'Milestone', icon: 'fas fa-gem', color: '#f59e0b' },
        { name: 'Critical Path', icon: 'fas fa-exclamation-triangle', color: '#ef4444' },
        { name: 'Inspection Point', icon: 'fas fa-clipboard-check', color: '#10b981' },
        { name: 'Key Deliverable', icon: 'fas fa-flag-checkered', color: '#3b82f6' },
        { name: 'Deadline', icon: 'fas fa-clock', color: '#f97316' }
    ];

    return (
        <div className="flex items-center justify-center gap-6 py-3 text-sm text-gray-700 flex-wrap">
            {markerTypes.map((marker, idx) => (
                <div key={idx} className="flex items-center gap-2">
                    <i
                        className={`${marker.icon}`}
                        style={{ color: marker.color }}
                    ></i>
                    <span>{marker.name}</span>
                </div>
            ))}
        </div>
    );
}
