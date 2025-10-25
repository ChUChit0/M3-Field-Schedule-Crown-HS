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
