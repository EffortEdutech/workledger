/**
 * WorkLedger - Report Generator Component (COMPLETE)
 * 
 * Complete implementation with:
 * - Work entries loading from contract
 * - Multi-select with checkboxes
 * - Assigned layouts loading
 * - Default layout pre-selection
 * - PDF/HTML generation
 * 
 * @component
 * @created February 13, 2026
 */

import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase/client';
import { contractLayoutService } from '../../services/api/contractLayoutService';
import { reportService } from '../../services/api/reportService';
import LoadingSpinner from '../common/LoadingSpinner';

export default function ReportGenerator({ contractId, onReportGenerated }) {
  // Work Entries State
  const [workEntries, setWorkEntries] = useState([]);
  const [selectedEntries, setSelectedEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  
  // Layout State
  const [availableLayouts, setAvailableLayouts] = useState([]);
  const [selectedLayout, setSelectedLayout] = useState(null);
  const [defaultLayoutId, setDefaultLayoutId] = useState(null);
  const [loadingLayouts, setLoadingLayouts] = useState(false);
  
  // Generation State
  const [generating, setGenerating] = useState(false);
  
  // Filter State
  const [dateFilter, setDateFilter] = useState('all'); // all, week, month, custom
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, draft, submitted, approved

  /**
   * Load work entries when contractId changes
   */
  useEffect(() => {
    if (contractId) {
      loadWorkEntries();
    }
  }, [contractId]);

  /**
   * Load layouts when entries are selected
   */
  useEffect(() => {
    if (selectedEntries.length > 0 && contractId) {
      loadContractLayouts();
    }
  }, [selectedEntries.length > 0]); // Only trigger when we have entries

  /**
   * Load work entries for the contract
   */
  const loadWorkEntries = async () => {
    try {
      setLoadingEntries(true);
      console.log('📥 Loading work entries for contract:', contractId);
      
      let query = supabase
        .from('work_entries')
        .select(`
          id,
          entry_date,
          shift,
          status,
          data,
          created_at,
          template:templates!work_entries_template_id_fkey(
            id,
            template_name,
            contract_category
          ),
          created_by_profile:user_profiles!work_entries_created_by_fkey(
            full_name
          )
        `)
        .eq('contract_id', contractId)
        .is('deleted_at', null)
        .order('entry_date', { ascending: false });
      
      // Apply filters
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte('entry_date', weekAgo.toISOString().split('T')[0]);
      } else if (dateFilter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query = query.gte('entry_date', monthAgo.toISOString().split('T')[0]);
      } else if (dateFilter === 'custom' && customStartDate && customEndDate) {
        query = query
          .gte('entry_date', customStartDate)
          .lte('entry_date', customEndDate);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      console.log(`✅ Loaded ${data?.length || 0} work entries`);
      setWorkEntries(data || []);
      
    } catch (error) {
      console.error('❌ Failed to load work entries:', error);
      alert('Failed to load work entries');
    } finally {
      setLoadingEntries(false);
    }
  };

  /**
   * Load layouts assigned to the contract
   */
  const loadContractLayouts = async () => {
    try {
      setLoadingLayouts(true);
      console.log('📥 Loading layouts for contract:', contractId);
      
      // Load assigned layouts
      const layouts = await contractLayoutService.getAssignedLayouts(contractId);
      setAvailableLayouts(layouts);
      
      // Load default layout
      const defaultLayout = await contractLayoutService.getDefaultLayout(contractId);
      setDefaultLayoutId(defaultLayout?.id);
      
      // Pre-select default layout
      if (defaultLayout) {
        setSelectedLayout(defaultLayout.id);
      } else if (layouts.length > 0) {
        setSelectedLayout(layouts[0].id);
      }
      
      console.log(`✅ Loaded ${layouts.length} layouts`);
      console.log(`🎯 Default layout: ${defaultLayout?.layout_name || 'None'}`);
      
    } catch (error) {
      console.error('❌ Failed to load contract layouts:', error);
      alert('Failed to load layouts for this contract');
    } finally {
      setLoadingLayouts(false);
    }
  };

  /**
   * Handle entry selection toggle
   */
  const handleEntryToggle = (entryId) => {
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
  const handleSelectAll = () => {
    setSelectedEntries(workEntries.map(e => e.id));
  };

  /**
   * Deselect all entries
   */
  const handleDeselectAll = () => {
    setSelectedEntries([]);
  };

  /**
   * Generate report
   */
  const handleGenerateReport = async (outputFormat = 'pdf') => {
    try {
      if (!selectedLayout) {
        alert('Please select a layout');
        return;
      }
      
      if (selectedEntries.length === 0) {
        alert('Please select at least one work entry');
        return;
      }
      
      setGenerating(true);
      console.log('📄 Generating report...');
      console.log('  Entries:', selectedEntries.length);
      console.log('  Layout:', selectedLayout);
      console.log('  Format:', outputFormat);
      
      const result = await reportService.generateReport(selectedEntries, {
        layoutId: selectedLayout,
        outputFormat: outputFormat
      });
      
      if (result.success) {
        if (outputFormat === 'pdf') {
          reportService.downloadPDF(result.blob, result.filename);
          alert('✅ PDF downloaded successfully!');
        } else if (outputFormat === 'html') {
          // Open HTML in new tab
          const htmlWindow = window.open('', '_blank');
          htmlWindow.document.write(result.html);
          htmlWindow.document.close();
          alert('✅ HTML preview opened in new tab!');
        }
        
        // Callback to parent
        if (onReportGenerated) {
          onReportGenerated(selectedEntries, { layoutId: selectedLayout, outputFormat });
        }
        
      } else {
        alert(`❌ Generation failed: ${result.error}`);
      }
      
    } catch (error) {
      console.error('❌ Report generation failed:', error);
      alert('Failed to generate report. Check console for details.');
    } finally {
      setGenerating(false);
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  /**
   * Get status badge color
   */
  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // ============================================
  // RENDER
  // ============================================
  
  return (
    <div className="space-y-6">
      {/* 1. SELECT WORK ENTRIES */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">1. Select Work Entries</h3>
          <p className="text-sm text-gray-600 mt-1">
            Choose work entries to include in the report
          </p>
        </div>
        
        <div className="p-6">
          {/* Filters */}
          <div className="mb-4 flex flex-wrap gap-3">
            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Dates</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
            
            {/* Custom Date Range */}
            {dateFilter === 'custom' && (
              <>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <span className="flex items-center text-gray-500">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <button
                  onClick={loadWorkEntries}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Apply
                </button>
              </>
            )}
            
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
            </select>
            
            {/* Refresh Button */}
            <button
              onClick={loadWorkEntries}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
            >
              🔄 Refresh
            </button>
          </div>
          
          {/* Selection Controls */}
          {workEntries.length > 0 && (
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {selectedEntries.length} of {workEntries.length} selected
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={handleDeselectAll}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Deselect All
                </button>
              </div>
            </div>
          )}
          
          {/* Work Entries List */}
          {loadingEntries ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : workEntries.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-gray-900 font-medium">No work entries found</p>
              <p className="text-sm text-gray-600 mt-1">
                {dateFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create work entries for this contract first'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {workEntries.map((entry) => (
                <label
                  key={entry.id}
                  className={`
                    flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all
                    ${selectedEntries.includes(entry.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={selectedEntries.includes(entry.id)}
                    onChange={() => handleEntryToggle(entry.id)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900">
                        {formatDate(entry.entry_date)}
                      </span>
                      {entry.shift && (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                          {entry.shift}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-1 rounded font-medium ${getStatusColor(entry.status)}`}>
                        {entry.status}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mt-1">
                      {entry.template?.template_name || 'Unknown Template'}
                      {' • '}
                      {entry.created_by_profile?.full_name || 'Unknown User'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. SELECT LAYOUT */}
      {selectedEntries.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">2. Select Report Layout</h3>
            <p className="text-sm text-gray-600 mt-1">
              Choose how the report should be formatted
            </p>
          </div>
          
          <div className="p-6">
            {loadingLayouts ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
                <p className="text-gray-600 mt-2">Loading layouts...</p>
              </div>
            ) : availableLayouts.length === 0 ? (
              <div className="text-center py-8 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-4xl mb-3">⚠️</div>
                <p className="text-gray-900 font-medium">No layouts assigned to this contract</p>
                <p className="text-sm text-gray-600 mt-1">
                  Please assign layouts in the contract settings first
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableLayouts.map((layout) => (
                  <label
                    key={layout.id}
                    className={`
                      flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all
                      ${selectedLayout === layout.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="layout"
                      value={layout.id}
                      checked={selectedLayout === layout.id}
                      onChange={(e) => setSelectedLayout(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">
                          {layout.layout_name}
                        </span>
                        {layout.id === defaultLayoutId && (
                          <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded">
                            ★ DEFAULT
                          </span>
                        )}
                      </div>
                      {layout.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {layout.description}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. GENERATE REPORT */}
      {selectedEntries.length > 0 && selectedLayout && (
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">3. Generate Report</h3>
          </div>
          
          <div className="p-6">
            <div className="flex gap-3">
              <button
                onClick={() => handleGenerateReport('pdf')}
                disabled={generating}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
              >
                {generating ? 'Generating...' : '📄 Generate PDF'}
              </button>
              
              <button
                onClick={() => handleGenerateReport('html')}
                disabled={generating}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition-colors"
              >
                {generating ? 'Generating...' : '👁️ Preview HTML'}
              </button>
            </div>
            
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-700">
                <strong>Summary:</strong>
                <ul className="mt-2 space-y-1">
                  <li>• {selectedEntries.length} work {selectedEntries.length === 1 ? 'entry' : 'entries'}</li>
                  <li>• Layout: {availableLayouts.find(l => l.id === selectedLayout)?.layout_name}</li>
                  <li>• Format: PDF & HTML preview available</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
