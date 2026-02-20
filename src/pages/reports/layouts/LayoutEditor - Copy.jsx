/**
 * WorkLedger - Layout Editor (WITH APPLAYOUT + TEMPLATE AUTOMATION)
 * 
 * Visual layout builder with:
 * - AppLayout wrapper (breadcrumbs, sidebar, header)
 * - Template automation (Create from Template)
 * - Visual builder with drag-drop
 * - JSON editing
 * - Live preview
 * 
 * @updated February 17, 2026 - Session 8: Added AppLayout wrapper
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../../../components/layout/AppLayout';
import { layoutService } from '../../../services/api/layoutService';
import BlockPalette from '../../../components/reports/builder/BlockPalette';
import LayoutCanvas from '../../../components/reports/builder/LayoutCanvas';
import SectionEditorPanel from '../../../components/reports/builder/SectionEditorPanel';
import TemplateSelector from '../../../components/reports/builder/TemplateSelector';
import { generateLayoutFromTemplate } from '../../../services/api/layoutGenerator';

export default function LayoutEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('form');
  const [layoutName, setLayoutName] = useState('');
  const [layoutDescription, setLayoutDescription] = useState('');
  const [compatibleTypes, setCompatibleTypes] = useState([]);
  const [pageSize, setPageSize] = useState('A4');
  const [pageOrientation, setPageOrientation] = useState('portrait');
  const [sections, setSections] = useState([]);
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(null);
  
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');
  
  // Template automation
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [generatedFromTemplate, setGeneratedFromTemplate] = useState(null);

  useEffect(() => {
    if (isEditMode) {
      loadLayout();
    } else {
      // Initialize with empty schema
      const emptySchema = {
        page: {
          size: 'A4',
          orientation: 'portrait',
          margins: { top: 20, left: 20, right: 20, bottom: 20 }
        },
        sections: []
      };
      setSections([]);
      setJsonText(JSON.stringify(emptySchema, null, 2));
    }
  }, [id]);

  // Debug: Log sections whenever they change
  useEffect(() => {
    console.log('🔍 Sections state changed:', sections);
    console.log('🔍 Sections count:', sections.length);
    sections.forEach((section, idx) => {
      console.log(`🔍 Section ${idx}:`, {
        section_id: section.section_id,
        block_type: section.block_type,
        block_type_type: typeof section.block_type
      });
    });
  }, [sections]);

  const loadLayout = async () => {
    try {
      setLoading(true);
      const layout = await layoutService.getLayout(id);
      
      setLayoutName(layout.layout_name);
      setLayoutDescription(layout.layout_description || '');
      setCompatibleTypes(layout.compatible_template_types || []);
      setPageSize(layout.layout_schema.page.size);
      setPageOrientation(layout.layout_schema.page.orientation);
      setSections(layout.layout_schema.sections);
      setJsonText(JSON.stringify(layout.layout_schema, null, 2));
    } catch (error) {
      console.error('Failed to load layout:', error);
    } finally {
      setLoading(false);
    }
  };

  // Template automation handler
  const handleTemplateSelected = ({ template, layoutData }) => {
    setLayoutName(layoutData.suggestedName);
    setLayoutDescription(layoutData.suggestedDescription);
    if (template.contract_category) {
      setCompatibleTypes([template.contract_category]);
    }
    setSections(layoutData.sections);
    
    const schema = {
      page: { size: pageSize, orientation: pageOrientation, margins: { top: 20, left: 20, right: 20, bottom: 20 } },
      sections: layoutData.sections
    };
    setJsonText(JSON.stringify(schema, null, 2));
    
    setGeneratedFromTemplate({
      template_id: template.template_id,
      template_name: template.template_name,
      generated_at: new Date().toISOString()
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const layoutSchema = {
        page: {
          size: pageSize,
          orientation: pageOrientation,
          margins: { top: 20, left: 20, right: 20, bottom: 20 }
        },
        sections
      };

      const layoutData = {
        layout_name: layoutName,
        layout_description: layoutDescription,
        compatible_template_types: compatibleTypes,
        layout_schema: layoutSchema,
        binding_rules: generatedFromTemplate ? {
          generated_from_template: generatedFromTemplate.template_id,
          generated_at: generatedFromTemplate.generated_at
        } : {}
      };

      let result;
      if (isEditMode) {
        result = await layoutService.updateLayout(id, layoutData);
      } else {
        result = await layoutService.createLayout(layoutData);
      }

      if (result.success) {
        navigate('/reports/layouts');
      } else {
        alert('Failed to save: ' + result.error);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Helper function to create a new section based on block type
  const createSection = (blockType, index) => {
    console.log('🔍 createSection called with:', { blockType, type: typeof blockType, index });
    
    // Ensure blockType is a string
    if (!blockType || typeof blockType !== 'string') {
      console.error('❌ Invalid blockType:', blockType);
      return null;
    }
    
    const sectionId = `section_${index}_${Date.now()}`;
    
    const baseSection = {
      section_id: sectionId,
      block_type: String(blockType), // Ensure it's a string
      options: {},
      binding_rules: {}
    };

    console.log('✅ Created baseSection:', baseSection);

    // Add default options based on block type
    switch (blockType) {
      case 'header':
        return {
          ...baseSection,
          content: {
            title: 'Work Report'
          }
        };
      
      case 'detail_entry':
        return {
          ...baseSection,
          options: {
            title: 'Section Details',
            columns: 2
          },
          binding_rules: {
            mode: 'auto_extract_all'
          }
        };
      
      case 'photo_grid':
        return {
          ...baseSection,
          options: {
            title: 'Photos',
            columns: 2,
            showCaptions: true,
            showTimestamps: true
          },
          binding_rules: {
            filter_by_field: 'photos'
          }
        };
      
      case 'signature_box':
        return {
          ...baseSection,
          options: {
            title: 'Signatures & Acknowledgment',
            layout: 'two_column'
          }
        };
      
      case 'text_section':
        return {
          ...baseSection,
          options: {
            title: 'Notes'
          },
          binding_rules: {
            source: 'data.notes'
          }
        };
      
      default:
        console.warn('⚠️ Unknown block type, using base section:', blockType);
        return baseSection;
    }
  };

  const handleAddSection = (blockTypeOrSection) => {
    console.log('🔍 handleAddSection called with:', blockTypeOrSection);
    console.log('🔍 Type:', typeof blockTypeOrSection);
    
    let newSection;
    
    // Check if BlockPalette passed a complete section object or just a string
    if (typeof blockTypeOrSection === 'object' && blockTypeOrSection !== null) {
      // BlockPalette already created the complete section - just use it!
      console.log('✅ Using pre-built section from BlockPalette');
      newSection = blockTypeOrSection;
    } else if (typeof blockTypeOrSection === 'string') {
      // BlockPalette passed just the block type string - create section ourselves
      console.log('✅ Creating section from block type string');
      newSection = createSection(blockTypeOrSection, sections.length);
    } else {
      console.error('❌ Invalid input to handleAddSection:', blockTypeOrSection);
      return;
    }
    
    if (!newSection) {
      console.error('❌ Failed to create section');
      return;
    }
    
    console.log('✅ Adding section to state:', newSection);
    setSections([...sections, newSection]);
  };

  const handleSectionMove = (fromIdx, toIdx) => {
    const newSections = [...sections];
    const [moved] = newSections.splice(fromIdx, 1);
    newSections.splice(toIdx, 0, moved);
    setSections(newSections);
    setSelectedSectionIndex(toIdx);
  };

  const handleSectionRemove = (idx) => {
    setSections(sections.filter((_, i) => i !== idx));
    setSelectedSectionIndex(null);
  };

  const handleSectionUpdate = (updatedSection) => {
    const newSections = [...sections];
    newSections[selectedSectionIndex] = updatedSection;
    setSections(newSections);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? 'Edit Layout' : 'Create New Layout'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {isEditMode 
                ? 'Modify the visual layout structure for report generation'
                : 'Create a new visual layout template for generating professional reports'
              }
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex gap-4">
            {['form', 'builder', 'json'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  px-4 py-2 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                {tab === 'form' && '📝 Basic Info'}
                {tab === 'builder' && '🔧 Visual Builder'}
                {tab === 'json' && '📄 JSON Editor'}
              </button>
            ))}
          </div>
        </div>

        {/* Editor Content */}
        
        {/* FORM TAB - Basic Layout Settings */}
        {activeTab === 'form' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="max-w-3xl space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Layout Information</h3>
                
                {/* Layout Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Layout Name *
                  </label>
                  <input
                    type="text"
                    value={layoutName}
                    onChange={(e) => setLayoutName(e.target.value)}
                    placeholder="e.g., Construction Daily Diary - Layout"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    A descriptive name for this layout template
                  </p>
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={layoutDescription}
                    onChange={(e) => setLayoutDescription(e.target.value)}
                    placeholder="Brief description of this layout and when to use it..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Compatible Template Types */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Compatible Template Types (Optional)
                  </label>
                  <input
                    type="text"
                    value={compatibleTypes.join(', ')}
                    onChange={(e) => setCompatibleTypes(
                      e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                    )}
                    placeholder="e.g., PMC, CMC, construction-daily-diary"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Comma-separated list of template types this layout works with
                  </p>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Page Settings</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Page Size */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Page Size
                    </label>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="A4">A4 (210 × 297 mm)</option>
                      <option value="Letter">Letter (8.5 × 11 in)</option>
                    </select>
                  </div>

                  {/* Orientation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Orientation
                    </label>
                    <select
                      value={pageOrientation}
                      onChange={(e) => setPageOrientation(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="portrait">Portrait (Vertical)</option>
                      <option value="landscape">Landscape (Horizontal)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Generation Info */}
              {generatedFromTemplate && (
                <div className="border-t pt-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">✓</span>
                      <div>
                        <h4 className="font-medium text-green-900 mb-1">
                          Generated from Template
                        </h4>
                        <p className="text-sm text-green-800">
                          {generatedFromTemplate.template_name}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          {new Date(generatedFromTemplate.generated_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-gray-600">
                  {sections.length} section{sections.length !== 1 ? 's' : ''} configured
                </div>
                <div className="flex gap-3">
                  {!isEditMode && (
                    <button
                      onClick={() => setShowTemplateSelector(true)}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <span>🎯</span>
                      Generate from Template
                    </button>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={saving || !layoutName}
                    className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : isEditMode ? 'Update Layout' : 'Create Layout'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BUILDER TAB - Visual Builder */}
        {activeTab === 'builder' && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex" style={{ height: '600px' }}>
              {/* Left: Block Palette */}
              <div className="w-64 border-r border-gray-200 overflow-y-auto">
                <BlockPalette onAddBlock={handleAddSection} />
              </div>

              {/* Middle: Canvas */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                <LayoutCanvas
                  sections={sections}
                  selectedIndex={selectedSectionIndex}
                  onSelectSection={setSelectedSectionIndex}
                  onSectionMove={handleSectionMove}
                  onSectionRemove={handleSectionRemove}
                />
              </div>

              {/* Right: Properties Panel */}
              {selectedSectionIndex !== null && (
                <div className="w-80 border-l border-gray-200 overflow-y-auto">
                  <SectionEditorPanel
                    section={sections[selectedSectionIndex]}
                    sectionIndex={selectedSectionIndex}
                    onUpdate={handleSectionUpdate}
                    onClose={() => setSelectedSectionIndex(null)}
                  />
                </div>
              )}
            </div>
            
            {/* Save Button Footer */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {sections.length} section{sections.length !== 1 ? 's' : ''} in layout
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab('form')}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  ← Basic Info
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !layoutName}
                  className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : isEditMode ? 'Update Layout' : 'Create Layout'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* JSON TAB - JSON Editor */}
        {activeTab === 'json' && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Layout Schema (JSON)
                </label>
                <button
                  onClick={() => {
                    try {
                      const parsed = JSON.parse(jsonText);
                      setSections(parsed.sections);
                      setJsonError('');
                      alert('✓ JSON loaded successfully');
                    } catch (err) {
                      setJsonError('Invalid JSON: ' + err.message);
                    }
                  }}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Apply JSON
                </button>
              </div>
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                className="w-full h-96 p-3 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                spellCheck={false}
              />
              {jsonError && (
                <p className="text-xs text-red-600 mt-1">⚠️ {jsonError}</p>
              )}
            </div>
            
            {/* Save Button Footer */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Direct JSON editing • {sections.length} section{sections.length !== 1 ? 's' : ''}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab('form')}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  ← Basic Info
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !layoutName}
                  className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : isEditMode ? 'Update Layout' : 'Create Layout'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <TemplateSelector
          onSelect={handleTemplateSelected}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}
    </AppLayout>
  );
}
