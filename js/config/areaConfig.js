// Area Configuration
window.areaConfig = {
    "E": { name: "Area E", color: "#475569" },
    "D": { name: "Area D", color: "#64748b" },
    "C": { name: "Area C", color: "#94a3b8" },
    "B": { name: "Area B", color: "#64748b" },
    "A": { name: "Area A", color: "#475569" },
    "F": { name: "Area F", color: "#94a3b8" }
};

// Field definitions for Excel mapping
window.FIELD_DEFINITIONS = [
    { key: 'id', label: 'Activity ID', required: true },
    { key: 'name', label: 'Activity Name', required: true },
    { key: 'original_duration', label: 'Original Duration', required: false },
    { key: 'start', label: 'Start Date', required: true },
    { key: 'finish', label: 'Finish Date', required: true },
    { key: 'actual_start', label: 'Actual Start', required: false },
    { key: 'actual_finish', label: 'Actual Finish', required: false },
    { key: 'rem_duration', label: 'New Rem Duration', required: false },
    { key: 'comments', label: 'Comments', required: false },
    { key: 'area', label: 'Area', required: false }
];

// ID Pattern Configuration for parsing activity IDs
const ID_PATTERN_CONFIG = {
    floors: {
        'LL': 'Lower Level',
        'ML': 'Mezzanine Level',
        '01': '1st Floor',
        '02': '2nd Floor',
        '03': '3rd Floor',
        '04': '4th Floor',
        '05': '5th Floor',
        'RF': 'Roof'
    },
    zones: {
        'INT': 'Interior',
        'K': 'Kitchen',
        'BAT': 'Bathroom',
        'COR': 'Corridor',
        'LBY': 'Lobby',
        'OFF': 'Office',
        'MEC': 'Mechanical',
        'ELE': 'Electrical',
        'EXT': 'Exterior'
    }
};

// Parse Activity ID to extract Area, Floor, Zone
const parseActivityID = (activityID) => {
    if (!activityID) return { area: null, floor: null, zone: null, number: null };

    // Pattern: AREA-FLOOR-ZONE-NUMBER (e.g., D-LL-INT-1230 or C-01-K-1190)
    const parts = activityID.split('-');

    if (parts.length >= 2) {
        const area = parts[0].trim(); // First part is Area (A, B, C, D, E, F) - trim spaces
        const floor = parts.length >= 3 ? parts[1].trim() : null; // Second part is Floor (LL, 01, 02, etc.)
        const zone = parts.length >= 4 ? parts[2].trim() : null; // Third part is Zone (INT, K, BAT, etc.)
        const number = parts.length >= 4 ? parts[3].trim() : (parts.length >= 3 ? parts[2].trim() : parts[1].trim()); // Last part is number

        return {
            area: area,
            floor: floor ? (ID_PATTERN_CONFIG.floors[floor] || floor) : null,
            zone: zone ? (ID_PATTERN_CONFIG.zones[zone] || zone) : null,
            number: number,
            rawFloor: floor,
            rawZone: zone
        };
    }

    return { area: null, floor: null, zone: null, number: null };
};
