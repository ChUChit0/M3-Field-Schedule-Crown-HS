// Area Configuration
export const areaConfig = {
    "E": { name: "Area E", color: "#475569" },
    "D": { name: "Area D", color: "#64748b" },
    "C": { name: "Area C", color: "#94a3b8" },
    "B": { name: "Area B", color: "#64748b" },
    "A": { name: "Area A", color: "#475569" },
    "F": { name: "Area F", color: "#94a3b8" }
};

// Field definitions for Excel mapping
export const FIELD_DEFINITIONS = [
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
