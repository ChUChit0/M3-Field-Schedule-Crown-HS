/**
 * Import Wizard Modal Component
 *
 * 4-step wizard for importing Excel data:
 * 1. Upload Excel file
 * 2. Map columns to fields
 * 3. Configure keyword filters
 * 4. Preview and confirm import
 *
 * Features:
 * - Auto-parsing of Activity IDs to extract Area/Floor/Zone
 * - Saved filter presets per update
 * - Bulk keyword import
 * - Excel date conversion to MM/DD/YY format
 *
 * @param {Object} props
 * @param {Function} props.onClose - Callback to close modal
 * @param {Function} props.onComplete - Callback when import completes
 * @param {Object} props.currentUpdate - Current update object
 * @param {Function} props.onSaveFilters - Callback to save filter configuration
 */

const { useState, useRef } = React;

// Import utilities that will be available globally
// These are defined in the main app or imported modules

function ImportWizard({ onClose, onComplete, currentUpdate, onSaveFilters}) {
    const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Filter, 4: Preview
    const [excelData, setExcelData] = useState(null);
    const [headers, setHeaders] = useState([]);
    const [columnMapping, setColumnMapping] = useState({});

    // Auto-load saved filters from current update
    const savedFilters = currentUpdate?.savedFilters;
    const [filterConfig, setFilterConfig] = useState(
        savedFilters || {
            field: 'name',
            keywords: []
        }
    );
    const [keywordInput, setKeywordInput] = useState('');
    const [bulkKeywordInput, setBulkKeywordInput] = useState('');
    const [previewData, setPreviewData] = useState([]);
    const fileInputRef = useRef(null);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = new Uint8Array(evt.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

                if (jsonData.length > 0) {
                    setHeaders(jsonData[0]);
                    setExcelData(jsonData.slice(1));
                    setStep(2);
                }
            } catch (error) {
                alert('Error reading file: ' + error.message);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleMappingComplete = () => {
        // Validate required fields are mapped
        const requiredFields = FIELD_DEFINITIONS.filter(f => f.required);
        const missingFields = requiredFields.filter(f => columnMapping[f.key] === undefined);

        if (missingFields.length > 0) {
            alert(`Please map required fields: ${missingFields.map(f => f.label).join(', ')}`);
            return;
        }

        setStep(3);
    };

    const addKeyword = () => {
        if (keywordInput.trim() && !filterConfig.keywords.includes(keywordInput.trim())) {
            setFilterConfig({
                ...filterConfig,
                keywords: [...filterConfig.keywords, keywordInput.trim()]
            });
            setKeywordInput('');
        }
    };

    const removeKeyword = (keyword) => {
        setFilterConfig({
            ...filterConfig,
            keywords: filterConfig.keywords.filter(k => k !== keyword)
        });
    };

    const handleBulkAdd = () => {
        if (!bulkKeywordInput.trim()) return;

        // First, replace all newlines with spaces to handle wrapped text
        const cleanedInput = bulkKeywordInput.replace(/\n/g, ' ');

        // Parse by comma or semicolon (primary separators)
        const keywords = cleanedInput
            .split(/[,;]+/)
            .map(k => k.trim())
            .filter(k => k.length > 0)
            .filter(k => !filterConfig.keywords.includes(k)); // Only add unique keywords

        if (keywords.length > 0) {
            setFilterConfig({
                ...filterConfig,
                keywords: [...filterConfig.keywords, ...keywords]
            });
            setBulkKeywordInput('');
            alert(`✅ Added ${keywords.length} keywords successfully!`);
        } else {
            alert('No new keywords to add (duplicates or empty input)');
        }
    };

    // Convert Excel serial date to MM/DD/YY format
    const excelDateToString = (serial) => {
        if (!serial || serial === '') return '';

        // If it's already a string date, return it
        if (typeof serial === 'string' && serial.includes('/')) return serial;

        // Convert Excel serial number to date
        if (typeof serial === 'number') {
            const utc_days = Math.floor(serial - 25569);
            const utc_value = utc_days * 86400;
            const date_info = new Date(utc_value * 1000);

            const month = String(date_info.getUTCMonth() + 1).padStart(2, '0');
            const day = String(date_info.getUTCDate()).padStart(2, '0');
            const year = String(date_info.getUTCFullYear()).slice(-2);

            return `${month}/${day}/${year}`;
        }

        return '';
    };

    const applyFiltersAndPreview = () => {
        // Check if user typed keywords but didn't click "Add All Keywords"
        if (bulkKeywordInput.trim().length > 0 && filterConfig.keywords.length === 0) {
            const confirmed = confirm(
                '⚠️ ATENCIÓN: Escribiste keywords en el textarea pero NO hiciste click en "Add All Keywords".\n\n' +
                'Si continúas SIN agregar filtros, se importarán TODAS las actividades del Excel.\n\n' +
                '¿Quieres continuar sin filtros y ver TODAS las actividades?'
            );
            if (!confirmed) {
                return; // User wants to go back and add the keywords
            }
        }

        // Check if user typed a single keyword but didn't click "Add"
        if (keywordInput.trim().length > 0 && filterConfig.keywords.length === 0) {
            const confirmed = confirm(
                '⚠️ ATENCIÓN: Escribiste un keyword pero NO hiciste click en "Add".\n\n' +
                'Si continúas SIN agregar filtros, se importarán TODAS las actividades del Excel.\n\n' +
                '¿Quieres continuar sin filtros y ver TODAS las actividades?'
            );
            if (!confirmed) {
                return; // User wants to go back and add the keyword
            }
        }

        // Convert excel data to activities
        const activities = excelData.map((row, idx) => {
            const activity = {
                _originalIndex: idx,
                area: 'A' // Default area
            };

            Object.keys(columnMapping).forEach(fieldKey => {
                const colIndex = columnMapping[fieldKey];
                let value = row[colIndex];

                // Skip empty/undefined values
                if (value === '' || value === null || value === undefined) {
                    return;
                }

                // Convert dates (start, finish, actual_start, actual_finish)
                if (['start', 'finish', 'actual_start', 'actual_finish'].includes(fieldKey)) {
                    value = excelDateToString(value);
                    // If conversion failed, skip this field
                    if (!value) return;
                }

                // Set value
                activity[fieldKey] = value;
            });

            // 🆕 AUTO-PARSE ACTIVITY ID to extract Area, Floor, Zone
            if (activity.id) {
                const parsed = parseActivityID(activity.id);

                // Apply parsed values (parsed area always overrides default)
                if (parsed.area) {
                    activity.area = parsed.area;
                }
                if (parsed.floor) {
                    activity.floor = parsed.floor; // Decoded (e.g., "Lower Level")
                    activity.rawFloor = parsed.rawFloor; // Raw (e.g., "LL")
                }
                if (parsed.zone) {
                    activity.zone = parsed.zone; // Decoded (e.g., "Interior")
                    activity.rawZone = parsed.rawZone; // Raw (e.g., "INT")
                }
                if (parsed.number) {
                    activity.activityNumber = parsed.number; // Activity number
                }
            }

            return activity;
        }).filter(activity => {
            // Only require ID and Name - dates are optional
            return activity.id && activity.name;
        });

        // Apply keyword filters
        let filtered = activities;
        if (filterConfig.keywords.length > 0) {
            console.log('🔍 Filtering with config:', {
                field: filterConfig.field,
                keywords: filterConfig.keywords,
                totalActivities: activities.length
            });

            filtered = activities.filter(activity => {
                const fieldValue = String(activity[filterConfig.field] || '').toLowerCase();
                const matches = filterConfig.keywords.some(keyword =>
                    fieldValue.includes(keyword.toLowerCase())
                );

                // Debug first 3 activities
                if (activities.indexOf(activity) < 3) {
                    console.log(`Activity ${activity.id}:`, {
                        fieldValue,
                        matches
                    });
                }

                return matches;
            });

            console.log(`✅ Filtered: ${filtered.length} of ${activities.length} activities match`);
        }

        setPreviewData(filtered);
        setStep(4);
    };

    const handleConfirmImport = () => {
        // Save filters used for this import
        if (filterConfig.keywords.length > 0 && onSaveFilters) {
            onSaveFilters(filterConfig);
        }

        onComplete(previewData, currentUpdate.id);
        onClose();
    };

    const handleRetry = () => {
        setStep(3);
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content glass rounded-2xl p-8">
                {/* Step Indicator */}
                <div className="step-indicator mb-8">
                    <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                        <div className="step-circle">
                            {step > 1 ? <i className="fas fa-check"></i> : '1'}
                        </div>
                        <div className="text-sm font-medium">Upload</div>
                        {step < 4 && <div className="step-line"></div>}
                    </div>
                    <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                        <div className="step-circle">
                            {step > 2 ? <i className="fas fa-check"></i> : '2'}
                        </div>
                        <div className="text-sm font-medium">Map Columns</div>
                        {step < 4 && <div className="step-line"></div>}
                    </div>
                    <div className={`step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
                        <div className="step-circle">
                            {step > 3 ? <i className="fas fa-check"></i> : '3'}
                        </div>
                        <div className="text-sm font-medium">Filter</div>
                        {step < 4 && <div className="step-line"></div>}
                    </div>
                    <div className={`step ${step >= 4 ? 'active' : ''}`}>
                        <div className="step-circle">4</div>
                        <div className="text-sm font-medium">Preview</div>
                    </div>
                </div>

                {/* Step 1: Upload */}
                {step === 1 && (
                    <div className="fade-in">
                        <h2 className="text-2xl font-bold mb-6">
                            <i className="fas fa-upload mr-3 text-slate-600"></i>
                            Import Excel File
                        </h2>
                        <div
                            className="border-4 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-slate-500 transition"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <i className="fas fa-file-excel text-6xl text-green-600 mb-4"></i>
                            <p className="text-lg font-semibold mb-2">Click to select Excel file</p>
                            <p className="text-sm text-gray-500">Supports .xlsx, .xls</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </div>
                        <div className="flex justify-end mt-6">
                            <button onClick={onClose} className="px-6 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg transition">
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Column Mapping */}
                {step === 2 && (
                    <div className="fade-in">
                        <h2 className="text-2xl font-bold mb-6">
                            <i className="fas fa-columns mr-3 text-slate-600"></i>
                            Map Columns
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Map your Excel columns to system fields
                        </p>
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {FIELD_DEFINITIONS.map(field => (
                                <div key={field.key} className="flex items-center gap-4">
                                    <div className="w-48 font-semibold text-gray-700">
                                        {field.label}
                                        {field.required && <span className="text-red-500 ml-1">*</span>}
                                    </div>
                                    <select
                                        value={columnMapping[field.key] ?? ''}
                                        onChange={(e) => setColumnMapping({
                                            ...columnMapping,
                                            [field.key]: e.target.value !== '' ? parseInt(e.target.value) : undefined
                                        })}
                                        className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-slate-500 focus:outline-none"
                                    >
                                        <option value="">-- Select column --</option>
                                        {headers.map((header, idx) => (
                                            <option key={idx} value={idx}>{header}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-6">
                            <button onClick={() => setStep(1)} className="px-6 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg transition">
                                <i className="fas fa-arrow-left mr-2"></i>
                                Back
                            </button>
                            <button onClick={handleMappingComplete} className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition">
                                Continue
                                <i className="fas fa-arrow-right ml-2"></i>
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Filter Configuration - PARTE 1 */}
                {step === 3 && (
                    <div className="fade-in">
                        <h2 className="text-2xl font-bold mb-4">
                            <i className="fas fa-filter mr-3 text-slate-600"></i>
                            Configure Filters
                        </h2>

                        {/* Saved Filters Indicator */}
                        {savedFilters && savedFilters.keywords.length > 0 && (
                            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-4">
                                <div className="flex items-start">
                                    <i className="fas fa-magic text-blue-600 text-xl mr-3 mt-1"></i>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-800 mb-1">
                                            🎯 Filters Auto-Loaded from {currentUpdate.name}
                                        </h4>
                                        <p className="text-sm text-gray-700 mb-2">
                                            We've automatically loaded the filters you used last time to save you time!
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="text-xs text-gray-600">Field:</span>
                                            <span className="px-2 py-0.5 bg-blue-200 text-blue-800 rounded text-xs font-medium">
                                                {FIELD_DEFINITIONS.find(f => f.key === savedFilters.field)?.label}
                                            </span>
                                            <span className="text-xs text-gray-600 ml-2">Keywords:</span>
                                            {savedFilters.keywords.map((kw, idx) => (
                                                <span key={idx} className="px-2 py-0.5 bg-blue-200 text-blue-800 rounded text-xs font-medium">
                                                    {kw}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <p className="text-gray-600 mb-6">
                            Filter activities by keywords (optional - leave empty to import all)
                        </p>

                        <div className="mb-6">
                            <label className="block font-semibold mb-2">Field to filter:</label>
                            <select
                                value={filterConfig.field}
                                onChange={(e) => setFilterConfig({ ...filterConfig, field: e.target.value })}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-slate-500 focus:outline-none"
                            >
                                {FIELD_DEFINITIONS.filter(f => columnMapping[f.key] !== undefined).map(field => (
                                    <option key={field.key} value={field.key}>{field.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-6">
                            <label className="block font-semibold mb-2">Keywords:</label>

                            {/* Single Keyword Input */}
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={keywordInput}
                                    onChange={(e) => setKeywordInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                                    placeholder="Type a keyword..."
                                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-slate-500 focus:outline-none"
                                />
                                <button
                                    onClick={addKeyword}
                                    className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition"
                                >
                                    <i className="fas fa-plus mr-2"></i>
                                    Add
                                </button>
                            </div>

                            {/* Bulk Keyword Input */}
                            <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <i className="fas fa-layer-group mr-2 text-blue-600"></i>
                                    Or paste multiple keywords (separated by COMMA):
                                </label>
                                <textarea
                                    value={bulkKeywordInput}
                                    onChange={(e) => setBulkKeywordInput(e.target.value)}
                                    placeholder="Example: DROP CEILING TILE, INSTALL CEILING GRID, FRAME HARD CEILINGS, PRIME/FIRST COAT PAINT"
                                    rows="4"
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none font-mono text-sm"
                                />
                                <button
                                    onClick={handleBulkAdd}
                                    className="mt-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                                >
                                    <i className="fas fa-layer-group mr-2"></i>
                                    Add All Keywords
                                </button>
                            </div>

                            {filterConfig.keywords.length > 0 && (
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-gray-600 font-medium">
                                            {filterConfig.keywords.length} keyword(s) added
                                        </span>
                                        <button
                                            onClick={() => setFilterConfig({ ...filterConfig, keywords: [] })}
                                            className="text-xs px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded transition"
                                        >
                                            <i className="fas fa-trash mr-1"></i>
                                            Clear All
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {filterConfig.keywords.map((keyword, idx) => (
                                            <div key={idx} className="keyword-badge">
                                                {keyword}
                                                <button onClick={() => removeKeyword(keyword)}>
                                                    <i className="fas fa-times"></i>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <i className="fas fa-info-circle text-blue-600 mr-2"></i>
                            <span className="text-sm text-blue-800">
                                Activities containing <strong>any</strong> of these keywords in "{FIELD_DEFINITIONS.find(f => f.key === filterConfig.field)?.label}" will be imported.
                                {filterConfig.keywords.length === 0 && " No filters will import ALL activities."}
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <button onClick={() => setStep(2)} className="px-6 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg transition">
                                <i className="fas fa-arrow-left mr-2"></i>
                                Back
                            </button>
                            <button onClick={applyFiltersAndPreview} className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition">
                                Preview
                                <i className="fas fa-arrow-right ml-2"></i>
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Preview */}
                {step === 4 && (
                    <div className="fade-in">
                        <h2 className="text-2xl font-bold mb-6">
                            <i className="fas fa-eye mr-3 text-slate-600"></i>
                            Import Preview
                        </h2>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <i className="fas fa-check-circle text-green-600 mr-2"></i>
                                    <span className="font-semibold text-green-800">
                                        {previewData.length} activities will be imported
                                    </span>
                                </div>
                                {filterConfig.keywords.length > 0 && (
                                    <div className="text-sm text-green-700">
                                        Filtered by: {filterConfig.keywords.join(', ')}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="max-h-96 overflow-auto border-2 border-gray-200 rounded-lg">
                            <table className="w-full">
                                <thead className="bg-gray-100 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-sm font-semibold">#</th>
                                        <th className="px-4 py-2 text-left text-sm font-semibold">ID</th>
                                        <th className="px-4 py-2 text-left text-sm font-semibold">Name</th>
                                        <th className="px-4 py-2 text-left text-sm font-semibold">Start</th>
                                        <th className="px-4 py-2 text-left text-sm font-semibold">Finish</th>
                                        <th className="px-4 py-2 text-left text-sm font-semibold">Duration</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.slice(0, 50).map((activity, idx) => (
                                        <tr key={idx} className="border-t hover:bg-gray-50">
                                            <td className="px-4 py-2 text-sm">{idx + 1}</td>
                                            <td className="px-4 py-2 text-sm font-mono">{activity.id}</td>
                                            <td className="px-4 py-2 text-sm">{activity.name}</td>
                                            <td className="px-4 py-2 text-sm">{activity.start}</td>
                                            <td className="px-4 py-2 text-sm">{activity.finish}</td>
                                            <td className="px-4 py-2 text-sm">{activity.rem_duration || activity.original_duration}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {previewData.length > 50 && (
                                <div className="bg-gray-100 p-3 text-center text-sm text-gray-600">
                                    Showing 50 of {previewData.length} activities...
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between mt-6">
                            <button onClick={handleRetry} className="px-6 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg transition">
                                <i className="fas fa-redo mr-2"></i>
                                Retry Filters
                            </button>
                            <button onClick={handleConfirmImport} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-semibold">
                                <i className="fas fa-check mr-2"></i>
                                Confirm & Import
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
