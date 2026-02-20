/**
 * WorkLedger - Layout Preview Component
 * 
 * Preview the layout with sample data to see how it will look
 * when generating actual reports.
 * 
 * @component
 * @created February 12, 2026 - Session 8
 */

import { useState } from 'react';

export default function LayoutPreview({ layout, onClose }) {
  const [sampleData, setSampleData] = useState(getDefaultSampleData());

  /**
   * Render preview based on schema
   */
  const renderPreview = () => {
    const schema = layout.layout_schema || layout;
    
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        {/* Page Header */}
        <div className="mb-6 pb-4 border-b-2 border-gray-300">
          <div className="text-sm text-gray-600 mb-2">
            Preview: {layout.layout_name || 'Untitled Layout'}
          </div>
          <div className="text-xs text-gray-500">
            {schema.page?.size} • {schema.page?.orientation} • {schema.sections?.length || 0} sections
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {schema.sections?.map((section, index) => (
            <SectionPreview
              key={index}
              section={section}
              sampleData={sampleData}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-300 text-xs text-gray-500 text-center">
          Generated with WorkLedger
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-100 rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Layout Preview</h2>
              <p className="text-sm text-gray-600 mt-1">
                Preview how this layout will look with sample data
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderPreview()}
        </div>

        {/* Actions */}
        <div className="bg-white border-t border-gray-200 px-6 py-4 rounded-b-lg">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              💡 This is how your layout will appear in generated reports
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Close Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Section Preview Component
 */
function SectionPreview({ section, sampleData }) {
  const renderSection = () => {
    switch (section.block_type) {
      case 'header':
        return <HeaderPreview section={section} data={sampleData} />;
      case 'detail_entry':
        return <DetailEntryPreview section={section} data={sampleData} />;
      case 'text_section':
        return <TextSectionPreview section={section} data={sampleData} />;
      case 'checklist':
        return <ChecklistPreview section={section} data={sampleData} />;
      case 'table':
        return <TablePreview section={section} data={sampleData} />;
      case 'photo_grid':
        return <PhotoGridPreview section={section} data={sampleData} />;
      case 'signature_box':
        return <SignatureBoxPreview section={section} data={sampleData} />;
      case 'metrics_cards':
        return <MetricsCardsPreview section={section} data={sampleData} />;
      default:
        return <UnknownBlockPreview section={section} />;
    }
  };

  return (
    <div className="border-l-4 border-blue-500 pl-4">
      {renderSection()}
    </div>
  );
}

/**
 * Header Block Preview
 */
function HeaderPreview({ section, data }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        {section.content?.title || data.project?.name || 'Work Report'}
      </h1>
      {section.content?.subtitle && (
        <p className="text-lg text-gray-600">{section.content.subtitle}</p>
      )}
      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Date:</span>
          <span className="ml-2 font-medium">{data.entry?.date}</span>
        </div>
        <div>
          <span className="text-gray-600">Project:</span>
          <span className="ml-2 font-medium">{data.project?.name}</span>
        </div>
        <div>
          <span className="text-gray-600">Worker:</span>
          <span className="ml-2 font-medium">{data.worker?.name}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Detail Entry Preview
 */
function DetailEntryPreview({ section, data }) {
  const columns = section.options?.columns || 2;
  
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        {section.section_id.replace(/_/g, ' ').toUpperCase()}
      </h3>
      <div className={`grid grid-cols-${columns} gap-4`}>
        {Object.entries(data.details).map(([key, value]) => (
          <div key={key} className="border-b border-gray-200 pb-2">
            <div className="text-sm text-gray-600">{key}</div>
            <div className="font-medium text-gray-900">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Text Section Preview
 */
function TextSectionPreview({ section, data }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        {section.options?.title || section.section_id.replace(/_/g, ' ').toUpperCase()}
      </h3>
      <p className="text-gray-700 whitespace-pre-wrap">
        {data.observations || 'No observations recorded.'}
      </p>
    </div>
  );
}

/**
 * Checklist Preview
 */
function ChecklistPreview({ section, data }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        Task Checklist
      </h3>
      <div className="space-y-2">
        {data.tasks.map((task, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <span className={`text-xl ${task.completed ? '✅' : '⬜'}`}>
              {task.completed ? '✅' : '⬜'}
            </span>
            <span className={task.completed ? 'line-through text-gray-500' : 'text-gray-900'}>
              {task.name}
            </span>
            {section.options?.showStatus && (
              <span className={`ml-auto text-xs px-2 py-1 rounded ${
                task.completed 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {task.completed ? 'Completed' : 'Pending'}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Table Preview
 */
function TablePreview({ section, data }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        Equipment List
      </h3>
      <table className="w-full border border-gray-300">
        {section.options?.showHeaders && (
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-4 py-2 text-left">Item</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Quantity</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
        )}
        <tbody>
          {data.equipment.map((item, idx) => (
            <tr key={idx}>
              <td className="border border-gray-300 px-4 py-2">{item.name}</td>
              <td className="border border-gray-300 px-4 py-2">{item.quantity}</td>
              <td className="border border-gray-300 px-4 py-2">{item.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Photo Grid Preview
 */
function PhotoGridPreview({ section, data }) {
  const columns = section.options?.columns || 2;
  
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        Photo Evidence
      </h3>
      <div className={`grid grid-cols-${columns} gap-4`}>
        {data.photos.map((photo, idx) => (
          <div key={idx} className="border border-gray-300 rounded overflow-hidden">
            <div className="bg-gray-200 h-48 flex items-center justify-center">
              <span className="text-4xl">📷</span>
            </div>
            {section.options?.showCaptions && (
              <div className="p-2 bg-white">
                <div className="text-sm text-gray-900">{photo.caption}</div>
                {section.options?.showTimestamps && (
                  <div className="text-xs text-gray-500 mt-1">{photo.timestamp}</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Signature Box Preview
 */
function SignatureBoxPreview({ section, data }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        {section.options?.title || 'Signatures'}
      </h3>
      <div className="grid grid-cols-2 gap-6">
        {data.signatures.map((sig, idx) => (
          <div key={idx} className="border border-gray-300 rounded p-4">
            <div className="bg-gray-100 h-24 mb-3 flex items-center justify-center rounded">
              <span className="text-2xl">✍️</span>
            </div>
            <div className="text-sm">
              <div className="font-medium text-gray-900">{sig.name}</div>
              <div className="text-gray-600">{sig.role}</div>
              <div className="text-gray-500 text-xs mt-1">{sig.date}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Metrics Cards Preview
 */
function MetricsCardsPreview({ section, data }) {
  const columns = section.options?.columns || 3;
  
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        Summary Metrics
      </h3>
      <div className={`grid grid-cols-${columns} gap-4`}>
        {data.metrics.map((metric, idx) => (
          <div key={idx} className="bg-blue-50 border border-blue-200 rounded p-4">
            <div className="text-sm text-blue-600 mb-1">{metric.label}</div>
            <div className="text-2xl font-bold text-blue-900">{metric.value}</div>
            <div className="text-xs text-blue-600 mt-1">{metric.unit}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Unknown Block Preview
 */
function UnknownBlockPreview({ section }) {
  return (
    <div className="bg-yellow-50 border border-yellow-300 rounded p-4">
      <div className="text-yellow-800 font-medium">
        Unknown block type: {section.block_type}
      </div>
      <div className="text-sm text-yellow-600 mt-1">
        Section ID: {section.section_id}
      </div>
    </div>
  );
}

/**
 * Get default sample data
 */
function getDefaultSampleData() {
  return {
    project: {
      name: 'Sunway Tower Maintenance',
      location: 'Kuala Lumpur, Malaysia'
    },
    entry: {
      date: '12 Feb 2026',
      time: '14:30'
    },
    worker: {
      name: 'Ahmad bin Abdullah',
      role: 'Maintenance Technician'
    },
    details: {
      'Equipment ID': 'HVAC-001',
      'Location': 'Level 5, North Wing',
      'Work Type': 'Preventive Maintenance',
      'Duration': '2 hours',
      'Status': 'Completed',
      'Next Service': '12 Mar 2026'
    },
    observations: 'Equipment operating normally. Filters replaced as per schedule. No abnormal vibrations or noise detected. Temperature readings within acceptable range (22-24°C). Coolant levels checked and topped up.',
    tasks: [
      { name: 'Visual inspection', completed: true },
      { name: 'Filter replacement', completed: true },
      { name: 'Coolant check', completed: true },
      { name: 'Temperature reading', completed: true },
      { name: 'System test', completed: false }
    ],
    equipment: [
      { name: 'Air Filter', quantity: 2, status: 'Replaced' },
      { name: 'Coolant', quantity: '1L', status: 'Added' },
      { name: 'Cleaning Solution', quantity: '500ml', status: 'Used' }
    ],
    photos: [
      { caption: 'Before maintenance', timestamp: '14:00' },
      { caption: 'Filter replacement', timestamp: '14:30' },
      { caption: 'After maintenance', timestamp: '15:45' }
    ],
    signatures: [
      { name: 'Ahmad bin Abdullah', role: 'Technician', date: '12 Feb 2026, 16:00' },
      { name: 'Siti Nurhaliza', role: 'Supervisor', date: '12 Feb 2026, 16:15' }
    ],
    metrics: [
      { label: 'Tasks Completed', value: '4', unit: 'of 5' },
      { label: 'Time Spent', value: '2.5', unit: 'hours' },
      { label: 'Efficiency', value: '95', unit: '%' }
    ]
  };
}
