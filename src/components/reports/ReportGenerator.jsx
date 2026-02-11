/**
 * WorkLedger - Report Generator Component (Per-Entry Field Selection)
 * 
 * When a work entry is ticked, it expands to show every field as an
 * individual checkbox. Users choose exactly which fields to include
 * per entry. The PDF only renders selected fields.
 * 
 * Layout:
 *   1. Select Work Entries (checkbox per entry)
 *      └─ Entry Details (expandable per entry)
 *         ☐ Include Logo
 *         ☐ Field Name: value
 *         ☐ Photos before:
 *         ☐ Worker signature
 *         ...
 *   2. Report Options (Orientation, Page Size, Output)
 *   3. Generate PDF button
 * 
 * @module components/reports/ReportGenerator
 * @created February 5, 2026 - Session 18
 * @updated February 6, 2026 - Per-entry granular field selection
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase/client';
import { reportService } from '../../services/api/reportService';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import ReportPreview from './ReportPreview';

export default function ReportGenerator({ contractId, onReportGenerated }) {
  // ============================================
  // STATE
  // ============================================
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [contract, setContract] = useState(null);
  const [workEntries, setWorkEntries] = useState([]);
  
  /**
   * Per-entry selections map
   * {
   *   'entry-uuid': {
   *     selected: true,
   *     expanded: true,
   *     includeLogo: true,
   *     fields: {
   *       'section_id.field_id': true/false,
   *       ...
   *     }
   *   }
   * }
   */
  const [entrySelections, setEntrySelections] = useState({});

  // Page options (how the report looks)
  const [pageOptions, setPageOptions] = useState({
    orientation: 'portrait',
    pageSize: 'a4',
    output: 'download'
  });
  
  const [pdfBlob, setPdfBlob] = useState(null);
  const [pdfFilename, setPdfFilename] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // ============================================
  // DERIVED STATE
  // ============================================
  const selectedEntryIds = Object.keys(entrySelections).filter(
    id => entrySelections[id]?.selected
  );
  const hasSelection = selectedEntryIds.length > 0;
  
  // ============================================
  // DATA LOADING
  // ============================================
  useEffect(() => {
    loadData();
  }, [contractId]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load contract
      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .select(`
          *,
          project:projects(id, project_name, client_name)
        `)
        .eq('id', contractId)
        .single();
      
      if (contractError) throw contractError;
      setContract(contractData);
      
      // Load work entries WITH template (for field labels)
      const { data: entriesData, error: entriesError } = await supabase
        .from('work_entries')
        .select(`
          *,
          template:templates(id, template_name, fields_schema, pdf_layout)
        `)
        .eq('contract_id', contractId)
        .in('status', ['draft', 'submitted', 'approved'])
        .order('entry_date', { ascending: false })
        .limit(50);
      
      if (entriesError) throw entriesError;
      setWorkEntries(entriesData || []);
      
    } catch (err) {
      console.error('❌ Failed to load data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // FIELD EXTRACTION FROM ENTRY
  // ============================================

  /**
   * Get displayable fields for an entry
   * Uses template fields_schema for labels, falls back to raw data keys
   * 
   * Returns: [{ key, label, value, type, section }]
   */
  const getFieldsForEntry = (entry) => {
    const fields = [];
    const data = entry.data || {};
    const template = entry.template;

    if (template?.fields_schema?.sections) {
      // Template-driven: use field labels from schema
      template.fields_schema.sections.forEach(section => {
        section.fields?.forEach(field => {
          const key = `${section.section_id}.${field.field_id}`;
          const value = data[key];
          fields.push({
            key,
            label: field.field_name,
            value,
            type: field.field_type || 'text',
            section: section.section_name
          });
        });
      });
    } else {
      // Fallback: use raw data keys, format as labels
      Object.entries(data).forEach(([key, value]) => {
        const label = key.split('.').pop()
          .replace(/_/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());
        
        fields.push({
          key,
          label,
          value,
          type: guessFieldType(key, value),
          section: null
        });
      });
    }

    return fields;
  };

  /**
   * Guess field type from key name and value
   */
  const guessFieldType = (key, value) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('photo') || lowerKey.includes('image')) return 'photo';
    if (lowerKey.includes('signature')) return 'signature';
    if (typeof value === 'boolean') return 'checkbox';
    if (typeof value === 'number') return 'number';
    return 'text';
  };

  // ============================================
  // ENTRY SELECTION HANDLERS
  // ============================================

  /**
   * Toggle entry selection — when checked, auto-expand and select all fields
   */
  const toggleEntry = (entryId) => {
    setEntrySelections(prev => {
      if (prev[entryId]?.selected) {
        // Uncheck — remove entry
        const next = { ...prev };
        delete next[entryId];
        return next;
      } else {
        // Check — initialize with all fields selected
        const entry = workEntries.find(e => e.id === entryId);
        const fields = getFieldsForEntry(entry);
        const fieldMap = {};
        fields.forEach(f => { fieldMap[f.key] = true; });
        
        return {
          ...prev,
          [entryId]: {
            selected: true,
            expanded: true,
            includeLogo: true,
            fields: fieldMap
          }
        };
      }
    });
  };

  /**
   * Select all entries with all fields
   */
  const selectAll = () => {
    const selections = {};
    workEntries.forEach(entry => {
      const fields = getFieldsForEntry(entry);
      const fieldMap = {};
      fields.forEach(f => { fieldMap[f.key] = true; });
      selections[entry.id] = {
        selected: true,
        expanded: false, // don't auto-expand all
        includeLogo: true,
        fields: fieldMap
      };
    });
    setEntrySelections(selections);
  };

  /**
   * Deselect all entries
   */
  const deselectAll = () => {
    setEntrySelections({});
  };

  /**
   * Toggle expand/collapse for an entry's details
   */
  const toggleExpand = (entryId) => {
    setEntrySelections(prev => ({
      ...prev,
      [entryId]: {
        ...prev[entryId],
        expanded: !prev[entryId]?.expanded
      }
    }));
  };

  /**
   * Toggle Include Logo for an entry
   */
  const toggleLogo = (entryId) => {
    setEntrySelections(prev => ({
      ...prev,
      [entryId]: {
        ...prev[entryId],
        includeLogo: !prev[entryId]?.includeLogo
      }
    }));
  };

  /**
   * Toggle a single field for an entry
   */
  const toggleField = (entryId, fieldKey) => {
    setEntrySelections(prev => ({
      ...prev,
      [entryId]: {
        ...prev[entryId],
        fields: {
          ...prev[entryId]?.fields,
          [fieldKey]: !prev[entryId]?.fields?.[fieldKey]
        }
      }
    }));
  };

  /**
   * Select all fields for an entry
   */
  const selectAllFields = (entryId) => {
    const entry = workEntries.find(e => e.id === entryId);
    const fields = getFieldsForEntry(entry);
    const fieldMap = {};
    fields.forEach(f => { fieldMap[f.key] = true; });
    
    setEntrySelections(prev => ({
      ...prev,
      [entryId]: {
        ...prev[entryId],
        includeLogo: true,
        fields: fieldMap
      }
    }));
  };

  /**
   * Deselect all fields for an entry
   */
  const deselectAllFields = (entryId) => {
    const entry = workEntries.find(e => e.id === entryId);
    const fields = getFieldsForEntry(entry);
    const fieldMap = {};
    fields.forEach(f => { fieldMap[f.key] = false; });
    
    setEntrySelections(prev => ({
      ...prev,
      [entryId]: {
        ...prev[entryId],
        includeLogo: false,
        fields: fieldMap
      }
    }));
  };

  // ============================================
  // PDF GENERATION
  // ============================================

  const handleGenerate = async () => {
    if (selectedEntryIds.length === 0) {
      setError('Please select at least one entry');
      return;
    }
    
    try {
      setGenerating(true);
      setError(null);
      setSuccess(null);
      
      // Build options with per-entry field selections
      const mergedOptions = {
        ...pageOptions,
        entrySelections // pass the full per-entry map
      };
      
      console.log('📄 Generating PDF for', selectedEntryIds.length, 'entries');
      console.log('📋 Per-entry selections:', entrySelections);
      
      const result = await reportService.generateReport(selectedEntryIds, mergedOptions);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      console.log('✅ PDF generated successfully');

      // Notify parent to save to report history
      if (onReportGenerated) {

      onReportGenerated(selectedEntryIds, mergedOptions);

      }

      setPdfBlob(result.blob);
      setPdfFilename(result.filename);
      
      switch (pageOptions.output) {
        case 'download':
          reportService.downloadPDF(result.blob, result.filename);
          setSuccess(`PDF downloaded: ${result.filename}`);
          break;
        case 'newtab':
          reportService.openPDFInNewTab(result.blob);
          setSuccess('PDF opened in new tab');
          break;
        case 'preview':
          setShowPreview(true);
          setSuccess('PDF ready for preview');
          break;
        default:
          reportService.downloadPDF(result.blob, result.filename);
          setSuccess(`PDF downloaded: ${result.filename}`);
      }
      
    } catch (err) {
      console.error('❌ Failed to generate PDF:', err);
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (pdfBlob && pdfFilename) {
      reportService.downloadPDF(pdfBlob, pdfFilename);
      setSuccess(`PDF downloaded: ${pdfFilename}`);
    }
  };

  // ============================================
  // DISPLAY HELPERS
  // ============================================

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  const getStatusBadge = (status) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-700',
      submitted: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  /**
   * Format field value for display in the checkbox list
   */
  const formatFieldDisplay = (value, type) => {
    if (value === null || value === undefined || value === '') return '';
    if (type === 'photo' || type === 'signature' || type === 'file') return '';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  /**
   * Get field type icon/indicator
   */
  const getFieldTypeIndicator = (type) => {
    switch (type) {
      case 'photo': return '📷';
      case 'signature': return '✍️';
      case 'file': return '📎';
      default: return null;
    }
  };

  /**
   * Count selected fields for an entry
   */
  const getSelectedFieldCount = (entryId) => {
    const selection = entrySelections[entryId];
    if (!selection?.fields) return 0;
    const logoCount = selection.includeLogo ? 1 : 0;
    const fieldCount = Object.values(selection.fields).filter(Boolean).length;
    return logoCount + fieldCount;
  };

  /**
   * Get total field count for an entry
   */
  const getTotalFieldCount = (entry) => {
    const fields = getFieldsForEntry(entry);
    return fields.length + 1; // +1 for logo
  };

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-green-900">{success}</p>
          </div>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-900">{error}</p>
        </div>
      )}
      
      {/* ============================================ */}
      {/* SECTION 1: Select Work Entries               */}
      {/* ============================================ */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Select Work Entries
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={selectAll}
              disabled={generating || workEntries.length === 0}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={deselectAll}
              disabled={generating || selectedEntryIds.length === 0}
            >
              Deselect All
            </Button>
          </div>
        </div>
        
        {/* Entry List */}
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          {workEntries.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-2 text-sm text-gray-500">No work entries found for this contract</p>
              <p className="text-xs text-gray-400 mt-1">Create work entries first, then come back to generate reports</p>
            </div>
          ) : (
            workEntries.map(entry => {
              const isSelected = entrySelections[entry.id]?.selected;
              const isExpanded = entrySelections[entry.id]?.expanded;
              const selection = entrySelections[entry.id];
              const entryFields = getFieldsForEntry(entry);
              
              return (
                <div
                  key={entry.id}
                  className={`border rounded-lg transition-colors ${
                    isSelected
                      ? 'border-primary-300 bg-primary-50/30'
                      : 'border-gray-200'
                  }`}
                >
                  {/* Entry Row (checkbox + date + status) */}
                  <label className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50/50">
                    <input
                      type="checkbox"
                      checked={!!isSelected}
                      onChange={() => toggleEntry(entry.id)}
                      disabled={generating}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">
                          {formatDate(entry.entry_date)}
                        </span>
                        <div className="flex items-center gap-2">
                          {isSelected && (
                            <span className="text-xs text-gray-500">
                              {getSelectedFieldCount(entry.id)}/{getTotalFieldCount(entry)} fields
                            </span>
                          )}
                          <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusBadge(entry.status)}`}>
                            {entry.status}
                          </span>
                        </div>
                      </div>
                      {entry.shift && (
                        <span className="text-sm text-gray-600">Shift: {entry.shift}</span>
                      )}
                    </div>
                  </label>
                  
                  {/* Expandable Entry Details (shown when selected) */}
                  {isSelected && (
                    <div className="border-t border-gray-200">
                      {/* Expand/Collapse Toggle */}
                      <button
                        onClick={() => toggleExpand(entry.id)}
                        className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Entry Details
                        </span>
                        <svg
                          className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {/* Field Checkboxes */}
                      {isExpanded && (
                        <div className="px-4 py-3 space-y-1">
                          {/* Select All / Deselect All Fields */}
                          <div className="flex gap-2 mb-3">
                            <button
                              onClick={() => selectAllFields(entry.id)}
                              disabled={generating}
                              className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                            >
                              Select All
                            </button>
                            <span className="text-xs text-gray-300">|</span>
                            <button
                              onClick={() => deselectAllFields(entry.id)}
                              disabled={generating}
                              className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                            >
                              Deselect All
                            </button>
                          </div>
                          
                          {/* Include Logo */}
                          <label className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${
                            selection?.includeLogo ? 'bg-primary-50' : 'hover:bg-gray-50'
                          }`}>
                            <input
                              type="checkbox"
                              checked={!!selection?.includeLogo}
                              onChange={() => toggleLogo(entry.id)}
                              disabled={generating}
                              className="w-3.5 h-3.5 text-primary-600 rounded focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-800 font-medium">Include Logo</span>
                          </label>
                          
                          {/* Divider */}
                          <div className="border-t border-gray-100 my-2" />
                          
                          {/* Entry Fields */}
                          {entryFields.map(field => {
                            const isFieldSelected = selection?.fields?.[field.key] ?? true;
                            const displayValue = formatFieldDisplay(field.value, field.type);
                            const typeIndicator = getFieldTypeIndicator(field.type);
                            
                            return (
                              <label
                                key={field.key}
                                className={`flex items-start gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${
                                  isFieldSelected ? 'bg-primary-50' : 'hover:bg-gray-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isFieldSelected}
                                  onChange={() => toggleField(entry.id, field.key)}
                                  disabled={generating}
                                  className="w-3.5 h-3.5 text-primary-600 rounded focus:ring-primary-500 mt-0.5 flex-shrink-0"
                                />
                                <span className="text-sm text-gray-800 break-words">
                                  {typeIndicator && (
                                    <span className="mr-1">{typeIndicator}</span>
                                  )}
                                  <span className="font-medium">{field.label}</span>
                                  {displayValue && (
                                    <span className="text-gray-500">: {displayValue}</span>
                                  )}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        
        {/* Selection Summary */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {selectedEntryIds.length} of {workEntries.length} entries selected
          </span>
          {hasSelection && (
            <span className="text-xs text-primary-600 font-medium">
              ✓ Ready to configure
            </span>
          )}
        </div>
      </div>
      
      {/* ============================================ */}
      {/* SECTION 2: Report Options (Page Settings)    */}
      {/* ============================================ */}
      {hasSelection && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Report Options
          </h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Orientation
              </label>
              <select
                value={pageOptions.orientation}
                onChange={(e) => setPageOptions(prev => ({ ...prev, orientation: e.target.value }))}
                disabled={generating}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Page Size
              </label>
              <select
                value={pageOptions.pageSize}
                onChange={(e) => setPageOptions(prev => ({ ...prev, pageSize: e.target.value }))}
                disabled={generating}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="a4">A4</option>
                <option value="letter">Letter</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Output
              </label>
              <select
                value={pageOptions.output}
                onChange={(e) => setPageOptions(prev => ({ ...prev, output: e.target.value }))}
                disabled={generating}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="download">📥 Download</option>
                <option value="newtab">🔗 Open in New Tab</option>
                <option value="preview">👁️ Preview First</option>
              </select>
            </div>
          </div>
          
          <div className="mt-3 text-xs text-gray-500">
            {pageOptions.output === 'download' && '📥 PDF will download automatically to your Downloads folder'}
            {pageOptions.output === 'newtab' && '🔗 PDF will open in a new browser tab for viewing'}
            {pageOptions.output === 'preview' && '👁️ PDF will show in preview modal, then you can download'}
          </div>
        </div>
      )}
      
      {/* ============================================ */}
      {/* SECTION 3: Generate Button                   */}
      {/* ============================================ */}
      {hasSelection && (
        <div className="flex gap-3">
          <Button
            onClick={handleGenerate}
            disabled={generating || selectedEntryIds.length === 0}
            className="flex-1"
          >
            {generating ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Generating PDF...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generate PDF ({selectedEntryIds.length} {selectedEntryIds.length === 1 ? 'entry' : 'entries'})
              </>
            )}
          </Button>
        </div>
      )}
      
      {/* Preview Modal */}
      {showPreview && pdfBlob && (
        <ReportPreview
          blob={pdfBlob}
          filename={pdfFilename}
          onClose={() => setShowPreview(false)}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
}
