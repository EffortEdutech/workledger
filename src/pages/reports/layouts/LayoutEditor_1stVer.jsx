/**
 * WorkLedger - Layout Editor Page
 * 
 * Create/Edit report layouts with 3 editing modes:
 * 1. Form Mode - Basic settings and section management
 * 2. Visual Mode - Live preview with block palette
 * 3. JSON Mode - Direct JSON editing with validation
 * 
 * @page /reports/layouts/new
 * @page /reports/layouts/:id
 * @created February 12, 2026 - Session 6
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { layoutService, BLOCK_TYPES } from '../../services/api/layoutService';

export default function LayoutEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // State
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('form'); // form | visual | json

  // Form state
  const [layoutName, setLayoutName] = useState('');
  const [layoutDescription, setLayoutDescription] = useState('');
  const [compatibleTypes, setCompatibleTypes] = useState([]);
  const [pageSize, setPageSize] = useState('A4');
  const [pageOrientation, setPageOrientation] = useState('portrait');
  const [sections, setSections] = useState([]);
  
  // JSON state
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');

  // Load existing layout for edit mode
  useEffect(() => {
    if (isEditMode) {
      loadLayout();
    } else {
      // Initialize empty layout
      const emptySchema = layoutService.getEmptySchema();
      setSections(emptySchema.sections);
      setJsonText(JSON.stringify(emptySchema, null, 2));
    }
  }, [id]);

  const loadLayout = async () => {
    try {
      setLoading(true);
      const layout = await layoutService.getLayout(id);
      
      // Set form fields
      setLayoutName(layout.layout_name);
      setLayoutDescription(layout.layout_description || '');
      setCompatibleTypes(layout.compatible_template_types || []);
      setPageSize(layout.layout_schema.page.size);
      setPageOrientation(layout.layout_schema.page.orientation);
      setSections(layout.layout_schema.sections || []);
      
      // Set JSON
      setJsonText(JSON.stringify(layout.layout_schema, null, 2));
      
    } catch (error) {
      console.error('❌ Error loading layout:', error);
      alert('Failed to load layout');
      navigate('/reports/layouts');
    } finally {
      setLoading(false);
    }
  };

  // Build schema from form fields
  const buildSchema = () => {
    return {
      page: {
        size: pageSize,
        orientation: pageOrientation,
        margins: { top: 20, bottom: 20, left: 20, right: 20 }
      },
      sections: sections
    };
  };

  // Save layout
  const handleSave = async () => {
    try {
      // Validate required fields
      if (!layoutName.trim()) {
        alert('Please enter a layout name');
        return;
      }

      if (compatibleTypes.length === 0) {
        alert('Please select at least one compatible template type');
        return;
      }

      setSaving(true);

      // Build layout schema based on active tab
      let schema;
      if (activeTab === 'json') {
        // Parse JSON
        try {
          schema = JSON.parse(jsonText);
        } catch (error) {
          alert('Invalid JSON syntax');
          return;
        }
      } else {
        // Build from form
        schema = buildSchema();
      }

      // Validate schema
      try {
        layoutService.validateLayoutSchema(schema);
      } catch (error) {
        alert(`Schema validation failed:\n${error.message}`);
        return;
      }

      // Prepare data
      const layoutData = {
        layout_name: layoutName,
        layout_description: layoutDescription,
        layout_schema: schema,
        compatible_template_types: compatibleTypes,
        is_active: true
      };

      // Create or update
      if (isEditMode) {
        await layoutService.updateLayout(id, layoutData);
        alert('✅ Layout updated successfully!');
      } else {
        const created = await layoutService.createLayout(layoutData);
        alert('✅ Layout created successfully!');
        navigate(`/reports/layouts/${created.id}`);
      }

    } catch (error) {
      console.error('❌ Error saving layout:', error);
      alert(`Failed to save layout: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Handle JSON text change
  const handleJsonChange = (value) => {
    setJsonText(value);
    setJsonError('');

    // Try to parse and update form fields
    try {
      const parsed = JSON.parse(value);
      if (parsed.page) {
        setPageSize(parsed.page.size || 'A4');
        setPageOrientation(parsed.page.orientation || 'portrait');
      }
      if (parsed.sections) {
        setSections(parsed.sections);
      }
    } catch (error) {
      setJsonError(error.message);
    }
  };

  // Sync form to JSON
  const syncFormToJson = () => {
    const schema = buildSchema();
    setJsonText(JSON.stringify(schema, null, 2));
  };

  // Template type options
  const templateTypeOptions = [
    { value: 'PMC', label: 'PMC - Preventive Maintenance' },
    { value: 'CMC', label: 'CMC - Comprehensive Maintenance' },
    { value: 'AMC', label: 'AMC - Annual Maintenance' },
    { value: 'SLA', label: 'SLA - Service Level Agreement' },
    { value: 'CORRECTIVE', label: 'Corrective Maintenance' },
    { value: 'EMERGENCY', label: 'Emergency On-Call' },
    { value: 'T_AND_M', label: 'Time & Material' },
    { value: 'CONSTRUCTION', label: 'Construction Daily Diary' }
  ];

  // Toggle template type
  const toggleTemplateType = (type) => {
    if (compatibleTypes.includes(type)) {
      setCompatibleTypes(compatibleTypes.filter(t => t !== type));
    } else {
      setCompatibleTypes([...compatibleTypes, type]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading layout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Layout' : 'Create New Layout'}
          </h1>
          {isEditMode && (
            <p className="text-sm text-gray-600 mt-1">{layoutName}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/reports/layouts')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : isEditMode ? 'Update Layout' : 'Create Layout'}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-t-lg shadow border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('form')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'form'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📝 Form Mode
          </button>
          
          <button
            onClick={() => {
              syncFormToJson();
              setActiveTab('visual');
            }}
            className={`px-6 py-3 font-medium ${
              activeTab === 'visual'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🎨 Visual Mode
          </button>
          
          <button
            onClick={() => {
              syncFormToJson();
              setActiveTab('json');
            }}
            className={`px-6 py-3 font-medium ${
              activeTab === 'json'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            💻 JSON Mode
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-b-lg shadow p-6">
        {/* Form Mode */}
        {activeTab === 'form' && (
          <FormMode
            layoutName={layoutName}
            setLayoutName={setLayoutName}
            layoutDescription={layoutDescription}
            setLayoutDescription={setLayoutDescription}
            compatibleTypes={compatibleTypes}
            toggleTemplateType={toggleTemplateType}
            templateTypeOptions={templateTypeOptions}
            pageSize={pageSize}
            setPageSize={setPageSize}
            pageOrientation={pageOrientation}
            setPageOrientation={setPageOrientation}
            sections={sections}
            setSections={setSections}
          />
        )}

        {/* Visual Mode */}
        {activeTab === 'visual' && (
          <VisualMode
            sections={sections}
            setSections={setSections}
          />
        )}

        {/* JSON Mode */}
        {activeTab === 'json' && (
          <JsonMode
            jsonText={jsonText}
            setJsonText={handleJsonChange}
            jsonError={jsonError}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Form Mode Component
 */
function FormMode({
  layoutName,
  setLayoutName,
  layoutDescription,
  setLayoutDescription,
  compatibleTypes,
  toggleTemplateType,
  templateTypeOptions,
  pageSize,
  setPageSize,
  pageOrientation,
  setPageOrientation,
  sections,
  setSections
}) {
  // Add section
  const addSection = () => {
    const newSection = {
      section_id: `section_${sections.length + 1}`,
      block_type: 'header',
      content: {},
      binding_rules: {},
      options: {}
    };
    setSections([...sections, newSection]);
  };

  // Remove section
  const removeSection = (index) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  // Move section
  const moveSection = (index, direction) => {
    const newSections = [...sections];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= sections.length) return;
    
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
    setSections(newSections);
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Layout Name *
            </label>
            <input
              type="text"
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              placeholder="e.g., Standard Layout, Photo Report"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={layoutDescription}
              onChange={(e) => setLayoutDescription(e.target.value)}
              placeholder="Brief description of this layout"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Compatible Template Types */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Compatible Template Types *</h3>
        
        <div className="grid grid-cols-2 gap-3">
          {templateTypeOptions.map(option => (
            <label
              key={option.value}
              className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={compatibleTypes.includes(option.value)}
                onChange={() => toggleTemplateType(option.value)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-900">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Page Settings */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Page Settings</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Page Size
            </label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="A4">A4</option>
              <option value="A3">A3</option>
              <option value="Letter">Letter</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Orientation
            </label>
            <select
              value={pageOrientation}
              onChange={(e) => setPageOrientation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Sections ({sections.length})
          </h3>
          <button
            onClick={addSection}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            ➕ Add Section
          </button>
        </div>

        {sections.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-600 mb-2">No sections yet</p>
            <button
              onClick={addSection}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Add your first section
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {sections.map((section, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                {/* Section Info */}
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {section.section_id || `Section ${index + 1}`}
                  </div>
                  <div className="text-sm text-gray-600">
                    Type: {section.block_type}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveSection(index, 'up')}
                    disabled={index === 0}
                    className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    ⬆️
                  </button>
                  
                  <button
                    onClick={() => moveSection(index, 'down')}
                    disabled={index === sections.length - 1}
                    className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    ⬇️
                  </button>
                  
                  <button
                    onClick={() => removeSection(index)}
                    className="p-2 text-red-600 hover:text-red-700"
                    title="Remove"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Visual Mode Component (Simplified for Session 6)
 */
function VisualMode({ sections, setSections }) {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm">
          🎨 <strong>Visual Mode coming in Session 7!</strong><br />
          For now, use Form Mode or JSON Mode to build your layout.
        </p>
      </div>

      {/* Preview */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Section Preview</h3>
        <div className="border border-gray-300 rounded-lg p-4 bg-white">
          {sections.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No sections to preview</p>
          ) : (
            <div className="space-y-3">
              {sections.map((section, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded border border-gray-200">
                  <div className="font-medium">{section.section_id}</div>
                  <div className="text-sm text-gray-600">Type: {section.block_type}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * JSON Mode Component
 */
function JsonMode({ jsonText, setJsonText, jsonError }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Layout Schema (JSON)</h3>
        
        <div className="flex gap-2">
          <button
            onClick={() => {
              try {
                const parsed = JSON.parse(jsonText);
                setJsonText(JSON.stringify(parsed, null, 2));
              } catch (error) {
                alert('Invalid JSON');
              }
            }}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Format JSON
          </button>
          
          <button
            onClick={() => navigator.clipboard.writeText(jsonText)}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            📋 Copy
          </button>
        </div>
      </div>

      {jsonError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm font-medium">⚠️ JSON Error:</p>
          <p className="text-red-700 text-sm mt-1">{jsonError}</p>
        </div>
      )}

      <textarea
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
        className="w-full h-[500px] px-3 py-2 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        spellCheck={false}
      />

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <p className="text-sm text-gray-700">
          <strong>Tip:</strong> Edit the JSON directly for advanced customization. 
          The schema will be validated when you save.
        </p>
      </div>
    </div>
  );
}
