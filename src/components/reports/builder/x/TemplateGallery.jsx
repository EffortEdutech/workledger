/**
 * WorkLedger - Template Gallery Modal
 * 
 * Modal component that displays pre-built layout templates
 * Users can browse, preview, and select templates to clone.
 * 
 * @component
 * @created February 12, 2026 - Session 8
 */

import { useState } from 'react';
import { 
  LAYOUT_TEMPLATES, 
  TEMPLATE_CATEGORIES, 
  getTemplatesByCategory 
} from '../../../utils/layoutTemplates';

export default function TemplateGallery({ onSelect, onClose }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [previewTemplate, setPreviewTemplate] = useState(null);

  // Get filtered templates
  const templates = getTemplatesByCategory(selectedCategory);

  /**
   * Handle template selection
   */
  const handleSelect = (template) => {
    onSelect(template);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Template Gallery</h2>
              <p className="text-sm text-gray-600 mt-1">
                Choose a pre-built layout template to get started quickly
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Categories */}
          <div className="flex gap-2 mt-4 overflow-x-auto">
            {TEMPLATE_CATEGORIES.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`
                  px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors
                  ${selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                <span className="mr-2">{category.icon}</span>
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Template Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={() => handleSelect(template)}
                onPreview={() => setPreviewTemplate(template)}
              />
            ))}
          </div>

          {templates.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-gray-600">No templates in this category</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              💡 Templates can be customized after selection
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          onSelect={() => handleSelect(previewTemplate)}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </div>
  );
}

/**
 * Template Card Component
 */
function TemplateCard({ template, onSelect, onPreview }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      {/* Card Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-center">
        <div className="text-5xl mb-2">{template.icon}</div>
        <h3 className="text-white font-semibold">{template.name}</h3>
      </div>

      {/* Card Body */}
      <div className="p-4">
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {template.description}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
          <span>📦 {template.schema.sections.length} sections</span>
          <span>📄 {template.schema.page.size}</span>
        </div>

        {/* Compatible Types */}
        <div className="mb-4">
          <div className="text-xs text-gray-600 mb-1">Compatible with:</div>
          <div className="flex flex-wrap gap-1">
            {template.compatible_types.slice(0, 3).map(type => (
              <span
                key={type}
                className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded"
              >
                {type}
              </span>
            ))}
            {template.compatible_types.length > 3 && (
              <span className="text-xs text-gray-500">
                +{template.compatible_types.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onSelect}
            className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            Use Template
          </button>
          <button
            onClick={onPreview}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
            title="Preview"
          >
            👁️
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Template Preview Modal
 */
function TemplatePreviewModal({ template, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{template.icon}</span>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {template.name}
                </h3>
                <p className="text-sm text-gray-600">{template.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl mx-auto">
            {/* Schema Preview */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>📄 {template.schema.page.size}</span>
                <span>•</span>
                <span>{template.schema.page.orientation}</span>
                <span>•</span>
                <span>{template.schema.sections.length} sections</span>
              </div>

              {/* Sections List */}
              <div className="space-y-2">
                {template.schema.sections.map((section, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="text-2xl">
                      {getSectionIcon(section.block_type)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {section.section_id.replace(/_/g, ' ')}
                      </div>
                      <div className="text-sm text-gray-600">
                        {section.block_type.replace(/_/g, ' ')}
                      </div>
                    </div>
                    {Object.keys(section.options || {}).length > 0 && (
                      <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {Object.keys(section.options).length} options
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              This template includes {template.schema.sections.length} pre-configured sections
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
              <button
                onClick={onSelect}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Use This Template
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Get icon for section type
 */
function getSectionIcon(blockType) {
  const icons = {
    header: '📌',
    detail_entry: '📋',
    text_section: '📝',
    checklist: '✅',
    table: '📊',
    photo_grid: '📷',
    signature_box: '✍️',
    metrics_cards: '📈'
  };
  return icons[blockType] || '📦';
}
