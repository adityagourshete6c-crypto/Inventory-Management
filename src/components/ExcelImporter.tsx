/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Check, RefreshCw, AlertCircle, FileText, Info } from 'lucide-react';
import { InventoryItem } from '../types';

interface ExcelImporterProps {
  onImportComplete: (newItems: InventoryItem[], mergeOption: 'merge' | 'replace') => void;
  onClose: () => void;
}

interface ParsedRow {
  [key: string]: string;
}

export default function ExcelImporter({ onImportComplete, onClose }: ExcelImporterProps) {
  const [pasteText, setPasteText] = useState('');
  const [fileData, setFileData] = useState<string[][]>([]);
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, number>>({
    name: -1,
    quantity: -1,
    buyingPrice: -1,
    sellingPrice: -1,
    rate: -1,
    category: -1,
    hsnCode: -1,
    gstPercentage: -1,
  });
  const [mergeOption, setMergeOption] = useState<'merge' | 'replace'>('merge');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        parseRawText(text, ',');
      } catch (err) {
        setError('Failed to read CSV file. Please make sure it is a valid format.');
      }
    };
    reader.readAsText(file);
  };

  const parseRawText = (text: string, delimiter: string) => {
    // Basic CSV/TSV parser that respects quotes
    const rows: string[][] = [];
    const lines = text.split(/\r?\n/);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      let row: string[] = [];
      if (delimiter === ',') {
        // Regex to parse CSV lines with double quotes
        let inQuotes = false;
        let cell = '';
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            row.push(cell.trim());
            cell = '';
          } else {
            cell += char;
          }
        }
        row.push(cell.trim());
      } else {
        // TSV for excel copy-paste
        row = line.split('\t').map(c => c.trim().replace(/^"|"$/g, ''));
      }
      rows.push(row);
    }

    if (rows.length === 0) {
      setError('No data found in the input.');
      return;
    }

    const firstRow = rows[0];
    setHeaders(firstRow);
    setParsedRows(rows.slice(1));
    
    // Auto map column indices based on header names
    const newMapping = { ...columnMapping };
    firstRow.forEach((hdr, idx) => {
      const h = hdr.toLowerCase();
      if (h.includes('name') || h.includes('item') || h.includes('title') || h.includes('product')) {
        newMapping.name = idx;
      } else if (h.includes('qty') || h.includes('quantity') || h.includes('stock') || h.includes('count')) {
        newMapping.quantity = idx;
      } else if (h.includes('buy') || h.includes('cost') || h.includes('purchase') || h.includes('buying')) {
        newMapping.buyingPrice = idx;
      } else if (h.includes('sell') || h.includes('price') || h.includes('selling') || h.includes('mrp')) {
        newMapping.sellingPrice = idx;
      } else if (h.includes('rate') || h.includes('wholesale')) {
        newMapping.rate = idx;
      } else if (h.includes('category') || h.includes('type') || h.includes('dept')) {
        newMapping.category = idx;
      } else if (h.includes('hsn') || h.includes('code')) {
        newMapping.hsnCode = idx;
      } else if (h.includes('gst') || h.includes('tax') || h.includes('percentage')) {
        newMapping.gstPercentage = idx;
      }
    });
    setColumnMapping(newMapping);
  };

  const handlePasteProcess = () => {
    setError(null);
    if (!pasteText.trim()) {
      setError('Please paste some Excel cells first.');
      return;
    }
    parseRawText(pasteText, '\t');
  };

  const handleMappingChange = (field: string, index: number) => {
    setColumnMapping(prev => ({
      ...prev,
      [field]: index
    }));
  };

  const handleClear = () => {
    setPasteText('');
    setFileData([]);
    setFileName('');
    setParsedRows([]);
    setHeaders([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImportSubmit = () => {
    // Validate mapping
    if (columnMapping.name === -1) {
      setError('Please map the "Item Name" column. It is required.');
      return;
    }

    const finalItems: InventoryItem[] = [];
    let skippedRows = 0;

    parsedRows.forEach((row, rowIndex) => {
      const getName = () => {
        const idx = columnMapping.name;
        return idx !== -1 && row[idx] ? row[idx].trim() : '';
      };

      const name = getName();
      if (!name) {
        skippedRows++;
        return; // skip rows without name
      }

      const getNum = (field: string, fallback: number) => {
        const idx = columnMapping[field];
        if (idx === -1 || !row[idx]) return fallback;
        const val = parseFloat(row[idx].replace(/[^0-9.-]/g, ''));
        return isNaN(val) ? fallback : val;
      };

      const getStr = (field: string, fallback: string) => {
        const idx = columnMapping[field];
        if (idx === -1 || !row[idx]) return fallback;
        return row[idx].trim();
      };

      const quantity = getNum('quantity', 0);
      const buyingPrice = getNum('buyingPrice', 0);
      const sellingPrice = getNum('sellingPrice', 0);
      const rate = getNum('rate', sellingPrice); // default rate to sellingPrice if empty
      const category = getStr('category', 'General');
      const hsnCode = getStr('hsnCode', '0000');
      const gstPercentage = getNum('gstPercentage', 18); // default to 18%

      finalItems.push({
        id: `imported-${Date.now()}-${rowIndex}-${Math.random().toString(36).substr(2, 4)}`,
        name,
        quantity,
        buyingPrice,
        sellingPrice,
        rate,
        category,
        hsnCode,
        gstPercentage
      });
    });

    if (finalItems.length === 0) {
      setError('No valid items found to import.');
      return;
    }

    onImportComplete(finalItems, mergeOption);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Import Items from Excel / Sheets</h2>
              <p className="text-xs text-slate-500">Fast bulk upload for inventory, pricing, and tax details</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors text-sm font-medium px-2 py-1 rounded-md"
          >
            Cancel
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-md flex items-start gap-2">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {parsedRows.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Copy Paste Option */}
              <div className="border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-all flex flex-col bg-slate-50/50">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold">1</div>
                  <h3 className="font-semibold text-slate-700 text-sm">Copy & Paste from Excel</h3>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Open your spreadsheet, highlight the rows and columns, copy them (Ctrl+C), and paste them in the box below.
                </p>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Paste cells copied from Excel here...&#10;Example:&#10;Product Name	Qty	Buying Price	Selling Price	Rate	HSN	GST %&#10;Premium Wire	100	800	1100	1050	8544	18"
                  className="w-full h-44 text-xs font-mono p-3 border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none placeholder:text-slate-300"
                />
                <button
                  onClick={handlePasteProcess}
                  disabled={!pasteText.trim()}
                  className="mt-4 w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <FileText size={14} />
                  Analyze Copied Cells
                </button>
              </div>

              {/* CSV Upload Option */}
              <div className="border border-dashed border-slate-300 hover:border-slate-400 rounded-xl p-5 transition-all flex flex-col items-center justify-center text-center bg-slate-50/50">
                <div className="flex items-center gap-2 mb-3 self-start">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold">2</div>
                  <h3 className="font-semibold text-slate-700 text-sm">Upload CSV File</h3>
                </div>
                <p className="text-xs text-slate-500 mb-6 max-w-xs">
                  Save your Excel workbook as CSV (Comma Separated Values) format and drag/upload it here.
                </p>

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-10 border border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center bg-white"
                >
                  <Upload size={32} className="text-slate-400 mb-2" />
                  <span className="text-xs font-medium text-slate-600">Click to browse or drop file here</span>
                  <span className="text-[10px] text-slate-400 mt-1">Supports standard .csv format</span>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleCsvFileChange}
                  accept=".csv"
                  className="hidden"
                />
              </div>

              {/* Template Info Card */}
              <div className="md:col-span-2 bg-slate-50 border border-slate-150 p-4 rounded-xl flex items-start gap-3">
                <Info size={18} className="text-slate-500 mt-0.5 shrink-0" />
                <div className="text-xs text-slate-600 space-y-1">
                  <span className="font-semibold text-slate-700">Excel Column Guide:</span>
                  <p>Your sheet can have headers in any order. Our smart mapper will try to automatically identify matching columns for you. Only the <strong className="text-slate-800">Item Name</strong> is strictly required; other missing values will default automatically.</p>
                </div>
              </div>

            </div>
          ) : (
            // Mapping Step
            <div className="space-y-6">
              
              <div className="flex justify-between items-center">
                <div className="text-xs text-slate-500">
                  Detected <span className="font-semibold text-slate-700">{headers.length}</span> columns and <span className="font-semibold text-slate-700">{parsedRows.length}</span> items from <span className="font-semibold text-slate-700">{fileName || 'Copied Excel cells'}</span>.
                </div>
                <button
                  onClick={handleClear}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                >
                  <RefreshCw size={12} />
                  Start Over
                </button>
              </div>

              {/* Column Mapping Form */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Check size={16} className="text-emerald-500" />
                  Map Excel Columns to Database Fields
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Match each system field on the left with the correct column header from your Excel sheet on the right.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Name field */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Item Name <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={columnMapping.name}
                      onChange={(e) => handleMappingChange('name', parseInt(e.target.value))}
                      className="w-full bg-white border border-slate-200 text-xs rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                    >
                      <option value={-1}>-- Select Column --</option>
                      {headers.map((hdr, idx) => (
                        <option key={idx} value={idx}>{hdr}</option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Stock / Qty</label>
                    <select
                      value={columnMapping.quantity}
                      onChange={(e) => handleMappingChange('quantity', parseInt(e.target.value))}
                      className="w-full bg-white border border-slate-200 text-xs rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                    >
                      <option value={-1}>-- Default (0) --</option>
                      {headers.map((hdr, idx) => (
                        <option key={idx} value={idx}>{hdr}</option>
                      ))}
                    </select>
                  </div>

                  {/* Buying Price */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Buying Price</label>
                    <select
                      value={columnMapping.buyingPrice}
                      onChange={(e) => handleMappingChange('buyingPrice', parseInt(e.target.value))}
                      className="w-full bg-white border border-slate-200 text-xs rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                    >
                      <option value={-1}>-- Default (0) --</option>
                      {headers.map((hdr, idx) => (
                        <option key={idx} value={idx}>{hdr}</option>
                      ))}
                    </select>
                  </div>

                  {/* Selling Price */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Selling Price</label>
                    <select
                      value={columnMapping.sellingPrice}
                      onChange={(e) => handleMappingChange('sellingPrice', parseInt(e.target.value))}
                      className="w-full bg-white border border-slate-200 text-xs rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                    >
                      <option value={-1}>-- Default (0) --</option>
                      {headers.map((hdr, idx) => (
                        <option key={idx} value={idx}>{hdr}</option>
                      ))}
                    </select>
                  </div>

                  {/* Rate */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Rate (Wholesale)</label>
                    <select
                      value={columnMapping.rate}
                      onChange={(e) => handleMappingChange('rate', parseInt(e.target.value))}
                      className="w-full bg-white border border-slate-200 text-xs rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                    >
                      <option value={-1}>-- Same as Selling Price --</option>
                      {headers.map((hdr, idx) => (
                        <option key={idx} value={idx}>{hdr}</option>
                      ))}
                    </select>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Category</label>
                    <select
                      value={columnMapping.category}
                      onChange={(e) => handleMappingChange('category', parseInt(e.target.value))}
                      className="w-full bg-white border border-slate-200 text-xs rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                    >
                      <option value={-1}>-- Default (General) --</option>
                      {headers.map((hdr, idx) => (
                        <option key={idx} value={idx}>{hdr}</option>
                      ))}
                    </select>
                  </div>

                  {/* HSN Code */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">HSN Code (GST)</label>
                    <select
                      value={columnMapping.hsnCode}
                      onChange={(e) => handleMappingChange('hsnCode', parseInt(e.target.value))}
                      className="w-full bg-white border border-slate-200 text-xs rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                    >
                      <option value={-1}>-- Default (0000) --</option>
                      {headers.map((hdr, idx) => (
                        <option key={idx} value={idx}>{hdr}</option>
                      ))}
                    </select>
                  </div>

                  {/* GST % */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">GST Percentage</label>
                    <select
                      value={columnMapping.gstPercentage}
                      onChange={(e) => handleMappingChange('gstPercentage', parseInt(e.target.value))}
                      className="w-full bg-white border border-slate-200 text-xs rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                    >
                      <option value={-1}>-- Default (18%) --</option>
                      {headers.map((hdr, idx) => (
                        <option key={idx} value={idx}>{hdr}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Data Import Preview */}
              <div>
                <h4 className="text-xs font-semibold text-slate-700 mb-2">Data Preview (First 4 rows)</h4>
                <div className="border border-slate-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        {headers.map((hdr, idx) => (
                          <th key={idx} className="px-3 py-2 font-semibold border-b border-slate-200 whitespace-nowrap">
                            {hdr}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRows.slice(0, 4).map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50/50">
                          {headers.map((_, cIdx) => (
                            <td key={cIdx} className="px-3 py-2 whitespace-nowrap">
                              {row[cIdx] || <span className="text-slate-300">-</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Merge Options */}
              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 mb-0.5">Import Action Strategy</h4>
                  <p className="text-[11px] text-slate-500">Choose how to handle the items relative to existing stock.</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setMergeOption('merge')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      mergeOption === 'merge'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Add / Merge to Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => setMergeOption('replace')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      mergeOption === 'replace'
                        ? 'bg-red-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Replace Entire Inventory
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        {parsedRows.length > 0 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-150 flex justify-between items-center">
            <button
              onClick={handleClear}
              className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              Start Over
            </button>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImportSubmit}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Check size={14} />
                Bulk Import {parsedRows.length} Items
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
