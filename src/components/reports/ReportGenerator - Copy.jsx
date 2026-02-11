/**
 * WorkLedger - Report Generator Component
 * 
 * UI for selecting work entries and generating PDF reports.
 * Includes output options: Download, New Tab, or Preview.
 * 
 * @module components/reports/ReportGenerator
 * @created February 5, 2026 - Session 18
 * @updated February 5, 2026 - Added output options and fixed PDF generation
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase/client';
import { reportService } from '../../services/api/reportService';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import ReportPreview from './ReportPreview';

export default function ReportGenerator({ contractId }) {
  // State
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [contract, setContract] = useState(null);
  const [workEntries, setWorkEntries] = useState([]);
  const [selectedEntries, setSelectedEntries] = useState([]);
  
  const [options, setOptions] = useState({
    includeLogo: true,
    includePhotos: true,
    includeSignatures: true,
    orientation: 'portrait',
    pageSize: 'a4',
    output: 'download' // NEW: download, newtab, preview
  });
  
  const [pdfBlob, setPdfBlob] = useState(null);
  const [pdfFilename, setPdfFilename] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  
  /**
   * Load contract and work entries
   */
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
          project:projects(
            id,
            project_name,
            client_name
          )
        `)
        .eq('id', contractId)
        .single();
      
      if (contractError) throw contractError;
      
      setContract(contractData);
      
      // Load work entries
      // NOTE: Including 'draft' status for testing - remove in production
      const { data: entriesData, error: entriesError } = await supabase
        .from('work_entries')
        .select('*')
        .eq('contract_id', contractId)
        .in('status', ['draft', 'submitted', 'approved']) // Include draft for testing
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
  
  /**
   * Toggle entry selection
   */
  const toggleEntry = (entryId) => {
    setSelectedEntries(prev => {
      if (prev.includes(entryId)) {
        return prev.filter(id => id !== entryId);
      } else {
        return [...prev, entryId];
      }
    });
  };
  
  /**
   * Select all entries
   */
  const selectAll = () => {
    setSelectedEntries(workEntries.map(e => e.id));
  };
  
  /**
   * Deselect all entries
   */
  const deselectAll = () => {
    setSelectedEntries([]);
  };
  
  /**
   * Generate PDF with selected output option
   */
  const handleGenerate = async () => {
    if (selectedEntries.length === 0) {
      setError('Please select at least one entry');
      return;
    }
    
    try {
      setGenerating(true);
      setError(null);
      setSuccess(null);
      
      console.log('📄 Generating PDF for', selectedEntries.length, 'entries');
      console.log('📋 Options:', options);
      
      const result = await reportService.generateReport(selectedEntries, options);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      console.log('✅ PDF generated successfully');
      
      // Store PDF data
      setPdfBlob(result.blob);
      setPdfFilename(result.filename);
      
      // Handle output based on selected option
      switch (options.output) {
        case 'download':
          // Download immediately
          reportService.downloadPDF(result.blob, result.filename);
          setSuccess(`PDF downloaded: ${result.filename}`);
          break;
          
        case 'newtab':
          // Open in new tab
          reportService.openPDFInNewTab(result.blob);
          setSuccess('PDF opened in new tab');
          break;
          
        case 'preview':
          // Show preview modal
          setShowPreview(true);
          setSuccess('PDF ready for preview');
          break;
          
        default:
          // Default to download
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
  
  /**
   * Download PDF (when preview is shown)
   */
  const handleDownload = () => {
    if (pdfBlob && pdfFilename) {
      reportService.downloadPDF(pdfBlob, pdfFilename);
      setSuccess(`PDF downloaded: ${pdfFilename}`);
    }
  };
  
  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };
  
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
      
      {/* Work Entries Selection */}
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
              disabled={generating}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={deselectAll}
              disabled={generating}
            >
              Deselect All
            </Button>
          </div>
        </div>
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {workEntries.length === 0 ? (
            <p className="text-sm text-gray-500">No work entries available</p>
          ) : (
            workEntries.map(entry => (
              <label
                key={entry.id}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedEntries.includes(entry.id)}
                  onChange={() => toggleEntry(entry.id)}
                  disabled={generating}
                  className="w-4 h-4 text-primary-600"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">
                      {formatDate(entry.entry_date)}
                    </span>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      entry.status === 'approved' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {entry.status}
                    </span>
                  </div>
                  {entry.shift && (
                    <span className="text-sm text-gray-600">
                      Shift: {entry.shift}
                    </span>
                  )}
                </div>
              </label>
            ))
          )}
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          {selectedEntries.length} of {workEntries.length} entries selected
        </div>
      </div>
      
      {/* Report Options */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Report Options
        </h3>
        
        <div className="space-y-4">
          {/* Include Options */}
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={options.includeLogo}
                onChange={(e) => setOptions({ ...options, includeLogo: e.target.checked })}
                disabled={generating}
                className="w-4 h-4 text-primary-600"
              />
              <span className="text-sm text-gray-700">Include Logo</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={options.includePhotos}
                onChange={(e) => setOptions({ ...options, includePhotos: e.target.checked })}
                disabled={generating}
                className="w-4 h-4 text-primary-600"
              />
              <span className="text-sm text-gray-700">Include Photos</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={options.includeSignatures}
                onChange={(e) => setOptions({ ...options, includeSignatures: e.target.checked })}
                disabled={generating}
                className="w-4 h-4 text-primary-600"
              />
              <span className="text-sm text-gray-700">Include Signatures</span>
            </label>
          </div>
          
          {/* Page Options */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Orientation
              </label>
              <select
                value={options.orientation}
                onChange={(e) => setOptions({ ...options, orientation: e.target.value })}
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
                value={options.pageSize}
                onChange={(e) => setOptions({ ...options, pageSize: e.target.value })}
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
                value={options.output}
                onChange={(e) => setOptions({ ...options, output: e.target.value })}
                disabled={generating}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="download">Download</option>
                <option value="newtab">New Tab</option>
                <option value="preview">Preview</option>
              </select>
            </div>
          </div>
          
          {/* Output Option Description */}
          <div className="mt-2 text-xs text-gray-500">
            {options.output === 'download' && '📥 PDF will download automatically to your Downloads folder'}
            {options.output === 'newtab' && '🔗 PDF will open in a new browser tab'}
            {options.output === 'preview' && '👁️ PDF will show in preview modal, then you can download'}
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleGenerate}
          disabled={generating || selectedEntries.length === 0}
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
              Generate PDF
            </>
          )}
        </Button>
      </div>
      
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
