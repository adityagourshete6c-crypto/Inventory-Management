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
    const rows: string[][] = [];
    const lines = text.split(/\r?\n/);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      let row: string[] = [];
      if (delimiter === ',') {
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
        return;
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
      const rate = getNum('rate', sellingPrice);
      const category = getStr('category', 'General');
      const hsnCode = getStr('hsnCode', '0000');
      const gstPercentage = getNum('gstPercentage', 18);

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
      <div className="bg-white border-2 border-[#1A1A1A] max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden rounded-none shadow-none">
        
        {/* Header */}
        <div className="px-6 py-5 bg-[#F9F9F7] border-b-2 border-[#1A1A1A] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black text-white rounded-none">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h2 className="text-base font-black italic uppercase tracking-widest text-[#1A1A1A] font-display">
                Excel & Sheets Direct Importer
              </h2>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Bulk ledger uploads & quantity merges
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-black hover:opacity-75 font-black text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border-2 border-red-600 text-red-800 text-xs font-bold uppercase tracking-wide flex items-start gap-2 rounded-none">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {parsedRows.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Copy Paste Option */}
              <div className="border-2 border-[#1A1A1A] rounded-none p-5 flex flex-col bg-white">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-7 h-7 bg-black text-white flex items-center justify-center text-xs font-black font-mono">1</div>
                  <h3 className="font-bold uppercase tracking-wider text-xs text-[#1A1A1A]">Copy & Paste Columns</h3>
                </div>
                <p className="text-[11px] text-slate-500 mb-4 leading-normal">
                  Select database cells in Excel, press <kbd className="bg-slate-100 border px-1 py-0.5 text-[10px] font-mono">Ctrl+C</kbd>, then paste them in the zone below:
                </p>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Paste cells here...&#10;Columns separated by tab (Standard Excel Copy).&#10;Include column header labels in the first row!"
                  className="w-full h-44 text-xs font-mono p-3 border border-black rounded-none bg-white focus:outline-none resize-none placeholder:text-slate-300"
                />
                <button
                  onClick={handlePasteProcess}
                  disabled={!pasteText.trim()}
                  className="mt-4 w-full py-3 bg-[#1A1A1A] hover:bg-white hover:text-black border border-black text-white text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-none cursor-pointer"
                >
                  <FileText size={14} />
                  Analyze Copied Cells
                </button>
              </div>

              {/* CSV Upload Option */}
              <div className="border-2 border-dashed border-[#1A1A1A] rounded-none p-5 flex flex-col items-center justify-center text-center bg-[#F9F9F7]">
                <div className="flex items-center gap-2.5 mb-3 self-start">
                  <div className="w-7 h-7 bg-black text-white flex items-center justify-center text-xs font-black font-mono">2</div>
                  <h3 className="font-bold uppercase tracking-wider text-xs text-[#1A1A1A]">Upload CSV File</h3>
                </div>
                <p className="text-[11px] text-slate-500 mb-6 max-w-xs leading-normal">
                  Export your workbook as Comma Separated CSV, then drop or choose the file here.
                </p>

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-12 border border-dashed border-[#1A1A1A] bg-white hover:bg-slate-50 transition-all cursor-pointer flex flex-col items-center justify-center rounded-none"
                >
                  <Upload size={32} className="text-[#1A1A1A] mb-2" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">Select CSV Document</span>
                  <span className="text-[9px] font-mono text-slate-400 mt-1">Supports UTF-8 CSV sheets</span>
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
              <div className="md:col-span-2 bg-[#F9F9F7] border border-black p-4 rounded-none flex items-start gap-3">
                <Info size={18} className="text-black mt-0.5 shrink-0" />
                <div className="text-[11px] text-slate-600 space-y-1">
                  <span className="font-bold uppercase text-[#1A1A1A] tracking-wider">Excel Format Checklist:</span>
                  <p>Our intelligent system matches headers automatically (e.g. <em>Quantity, Rate, buying price, GST %, selling price, HSN</em>). Only the <strong>Item Name</strong> field is strictly required; remaining cells default seamlessly.</p>
                </div>
              </div>

            </div>
          ) : (
            // Mapping Step
            <div className="space-y-6">
              
              <div className="flex justify-between items-center border-b border-black pb-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                  Detected <span className="font-mono">{headers.length}</span> Columns and <span className="font-mono">{parsedRows.length}</span> Items from <span className="underline font-mono">{fileName || 'Excel paste'}</span>.
                </div>
                <button
                  onClick={handleClear}
                  className="text-xs text-black font-black uppercase tracking-widest hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw size={12} />
                  Start Over
                </button>
              </div>

              {/* Column Mapping Form */}
              <div className="bg-[#F9F9F7] p-5 border border-black rounded-none">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#1A1A1A] mb-3 flex items-center gap-2 font-display italic">
                  <Check size={16} className="text-black" />
                  Map System Fields to Excel Headers
                </h3>
                <p className="text-[11px] text-slate-500 mb-4 leading-normal">
                  Ensure the column headers of your excel table (right) correctly feed into the appropriate software fields (left).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Name field */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] mb-1">
                      Item Name <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={columnMapping.name}
                      onChange={(e) => handleMappingChange('name', parseInt(e.target.value))}
                      className="w-full bg-white border border-black text-xs p-2 focus:ring-1 focus:ring-black focus:outline-none"
                    >
                      <option value={-1}>-- Select Column --</option>
                      {headers.map((hdr, idx) => (
                        <option key={idx} value={idx}>{hdr}</option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] mb-1">Stock / Qty</label>
                    <select
                      value={columnMapping.quantity}
                      onChange={(e) => handleMappingChange('quantity', parseInt(e.target.value))}
                      className="w-full bg-white border border-black text-xs p-2 focus:ring-1 focus:ring-black focus:outline-none"
                    >
                      <option value={-1}>-- Default (0) --</option>
                      {headers.map((hdr, idx) => (
                        <option key={idx} value={idx}>{hdr}</option>
                      ))}
                    </select>
                  </div>

                  {/* Buying Price */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] mb-1">Buying Price</label>
                    <select
                      value={columnMapping.buyingPrice}
                      onChange={(e) => handleMappingChange('buyingPrice', parseInt(e.target.value))}
                      className="w-full bg-white border border-black text-xs p-2 focus:ring-1 focus:ring-black focus:outline-none"
                    >
                      <option value={-1}>-- Default (0) --</option>
                      {headers.map((hdr, idx) => (
                        <option key={idx} value={idx}>{hdr}</option>
                      ))}
                    </select>
                  </div>

                  {/* Selling Price */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] mb-1">Selling Price</label>
                    <select
                      value={columnMapping.sellingPrice}
                      onChange={(e) => handleMappingChange('sellingPrice', parseInt(e.target.value))}
                      className="w-full bg-white border border-black text-xs p-2 focus:ring-1 focus:ring-black focus:outline-none"
                    >
                      <option value={-1}>-- Default (0) --</option>
                      {headers.map((hdr, idx) => (
                        <option key={idx} value={idx}>{hdr}</option>
                      ))}
                    </select>
                  </div>

                  {/* Rate */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] mb-1">Rate (Wholesale)</label>
                    <select
                      value={columnMapping.rate}
                      onChange={(e) => handleMappingChange('rate', parseInt(e.target.value))}
                      className="w-full bg-white border border-black text-xs p-2 focus:ring-1 focus:ring-black focus:outline-none"
                    >
                      <option value={-1}>-- Same as Selling --</option>
                      {headers.map((hdr, idx) => (
                        <option key={idx} value={idx}>{hdr}</option>
                      ))}
                    </select>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] mb-1">Category</label>
                    <select
                      value={columnMapping.category}
                      onChange={(e) => handleMappingChange('category', parseInt(e.target.value))}
                      className="w-full bg-white border border-black text-xs p-2 focus:ring-1 focus:ring-black focus:outline-none"
                    >
                      <option value={-1}>-- Default (General) --</option>
                      {headers.map((hdr, idx) => (
                        <option key={idx} value={idx}>{hdr}</option>
                      ))}
                    </select>
                  </div>

                  {/* HSN Code */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] mb-1">HSN Code (GST)</label>
                    <select
                      value={columnMapping.hsnCode}
                      onChange={(e) => handleMappingChange('hsnCode', parseInt(e.target.value))}
                      className="w-full bg-white border border-black text-xs p-2 focus:ring-1 focus:ring-black focus:outline-none"
                    >
                      <option value={-1}>-- Default (0000) --</option>
                      {headers.map((hdr, idx) => (
                        <option key={idx} value={idx}>{hdr}</option>
                      ))}
                    </select>
                  </div>

                  {/* GST % */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] mb-1">GST Percentage</label>
                    <select
                      value={columnMapping.gstPercentage}
                      onChange={(e) => handleMappingChange('gstPercentage', parseInt(e.target.value))}
                      className="w-full bg-white border border-black text-xs p-2 focus:ring-1 focus:ring-black focus:outline-none"
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
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Data Preview (First 4 rows)</h4>
                <div className="border border-black rounded-none overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#1A1A1A]">
                    <thead className="bg-[#F9F9F7] text-black font-bold uppercase tracking-wider border-b border-black">
                      <tr>
                        {headers.map((hdr, idx) => (
                          <th key={idx} className="px-3 py-2 border-r last:border-0 border-black font-semibold whitespace-nowrap">
                            {hdr}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black">
                      {parsedRows.slice(0, 4).map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-[#F9F9F7]">
                          {headers.map((_, cIdx) => (
                            <td key={cIdx} className="px-3 py-2 border-r last:border-0 border-black font-mono font-medium whitespace-nowrap">
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
              <div className="p-5 bg-[#F9F9F7] border-2 border-black rounded-none flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#1A1A1A] mb-1">Import Action Strategy</h4>
                  <p className="text-[11px] text-slate-500">How would you like to compile this data with current listings?</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setMergeOption('merge')}
                    className={`px-4 py-2 border border-black text-xs font-bold uppercase tracking-wider transition-all cursor-pointer rounded-none ${
                      mergeOption === 'merge'
                        ? 'bg-[#1A1A1A] text-white'
                        : 'bg-white text-black hover:bg-slate-50'
                    }`}
                  >
                    Add / Merge to Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => setMergeOption('replace')}
                    className={`px-4 py-2 border border-red-600 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer rounded-none ${
                      mergeOption === 'replace'
                        ? 'bg-red-600 text-white'
                        : 'bg-white text-red-600 hover:bg-red-50'
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
          <div className="px-6 py-4 bg-[#F9F9F7] border-t-2 border-[#1A1A1A] flex justify-between items-center">
            <button
              onClick={handleClear}
              className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-black transition-colors cursor-pointer"
            >
              Start Over
            </button>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2 border-2 border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-bold uppercase tracking-widest rounded-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleImportSubmit}
                className="px-6 py-2 bg-black hover:bg-white hover:text-black border-2 border-black text-white text-xs font-black uppercase tracking-widest transition-all rounded-none cursor-pointer flex items-center gap-1.5"
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
