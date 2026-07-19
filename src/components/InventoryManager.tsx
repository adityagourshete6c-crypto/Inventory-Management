/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { Search, Plus, Edit2, Trash2, FileSpreadsheet, Download, RefreshCw, Layers, Printer } from 'lucide-react';
import ExcelImporter from './ExcelImporter';

interface InventoryManagerProps {
  inventory: InventoryItem[];
  onUpdateInventory: (newInventory: InventoryItem[]) => void;
}

export default function InventoryManager({ inventory, onUpdateInventory }: InventoryManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isPrintView, setIsPrintView] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [buyingPrice, setBuyingPrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [rate, setRate] = useState(0);
  const [category, setCategory] = useState('');
  const [hsnCode, setHsnCode] = useState('');
  const [gstPercentage, setGstPercentage] = useState(18);

  const categories = ['All', ...Array.from(new Set(inventory.map(item => item.category || 'General')))];

  const filteredItems = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.hsnCode && item.hsnCode.includes(searchTerm));
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenAddForm = () => {
    setEditingItem(null);
    setName('');
    setQuantity(0);
    setBuyingPrice(0);
    setSellingPrice(0);
    setRate(0);
    setCategory('General');
    setHsnCode('8544'); // common default
    setGstPercentage(18);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (item: InventoryItem) => {
    setEditingItem(item);
    setName(item.name);
    setQuantity(item.quantity);
    setBuyingPrice(item.buyingPrice);
    setSellingPrice(item.sellingPrice);
    setRate(item.rate);
    setCategory(item.category || 'General');
    setHsnCode(item.hsnCode || '0000');
    setGstPercentage(item.gstPercentage);
    setIsFormOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingItem) {
      // Edit mode
      const updated = inventory.map(item => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            name,
            quantity,
            buyingPrice,
            sellingPrice,
            rate,
            category,
            hsnCode,
            gstPercentage,
          };
        }
        return item;
      });
      onUpdateInventory(updated);
    } else {
      // Add mode
      const newItem: InventoryItem = {
        id: `item-${Date.now()}`,
        name,
        quantity,
        buyingPrice,
        sellingPrice,
        rate,
        category: category || 'General',
        hsnCode: hsnCode || '0000',
        gstPercentage,
      };
      onUpdateInventory([...inventory, newItem]);
    }
    setIsFormOpen(false);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      onUpdateInventory(inventory.filter(item => item.id !== id));
    }
  };

  const handleImportComplete = (importedItems: InventoryItem[], mergeOption: 'merge' | 'replace') => {
    if (mergeOption === 'replace') {
      onUpdateInventory(importedItems);
    } else {
      // Merge: if item with exact same name exists, update stock qty and prices, else add new
      const currentInventory = [...inventory];
      importedItems.forEach(newItem => {
        const existingIdx = currentInventory.findIndex(
          item => item.name.toLowerCase().trim() === newItem.name.toLowerCase().trim()
        );
        if (existingIdx !== -1) {
          // Update existing
          currentInventory[existingIdx] = {
            ...currentInventory[existingIdx],
            quantity: currentInventory[existingIdx].quantity + newItem.quantity,
            buyingPrice: newItem.buyingPrice > 0 ? newItem.buyingPrice : currentInventory[existingIdx].buyingPrice,
            sellingPrice: newItem.sellingPrice > 0 ? newItem.sellingPrice : currentInventory[existingIdx].sellingPrice,
            rate: newItem.rate > 0 ? newItem.rate : currentInventory[existingIdx].rate,
            hsnCode: newItem.hsnCode !== '0000' ? newItem.hsnCode : currentInventory[existingIdx].hsnCode,
            gstPercentage: newItem.gstPercentage,
          };
        } else {
          currentInventory.push(newItem);
        }
      });
      onUpdateInventory(currentInventory);
    }
  };

  const handleExportCsv = () => {
    const headers = 'Item ID,Item Name,Stock Qty,Buying Price,Selling Price,Rate (Wholesale),Category,HSN Code,GST %';
    const rows = inventory.map(item => 
      `"${item.id}","${item.name.replace(/"/g, '""')}",${item.quantity},${item.buyingPrice},${item.sellingPrice},${item.rate},"${item.category || 'General'}","${item.hsnCode || '0000'}",${item.gstPercentage}`
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Inventory_Stock_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isPrintView) {
    const totalQty = filteredItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalWholesaleValue = filteredItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const totalMrpValue = filteredItems.reduce((sum, item) => sum + (item.quantity * item.sellingPrice), 0);

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Navigation control bar - Hidden during print */}
        <div className="flex justify-between items-center bg-[#F9F9F7] p-5 border-2 border-[#1A1A1A] rounded-none no-print">
          <button
            onClick={() => setIsPrintView(false)}
            className="px-4 py-2.5 bg-white border-2 border-[#1A1A1A] text-black text-xs font-bold uppercase tracking-wider hover:bg-slate-100 transition-colors rounded-none cursor-pointer"
          >
            ← Back to Inventory List
          </button>
          
          <button
            onClick={() => window.print()}
            className="px-5 py-2.5 bg-black hover:bg-white hover:text-black border-2 border-black text-white text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1.5 rounded-none cursor-pointer"
          >
            <Printer size={14} /> Print Item List (A4)
          </button>
        </div>

        {/* PRINT CANVAS */}
        <div className="bg-white border-2 border-black p-8 text-black font-sans print:border-none print:p-0 rounded-none print-canvas" id="item-list-print">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-black pb-5">
            <div className="space-y-1">
              <span className="text-[9px] font-black text-white bg-black uppercase tracking-widest px-2 py-1 rounded-none inline-block">Official Stock Report</span>
              <h1 className="text-2xl font-black text-[#1A1A1A] leading-tight font-display tracking-tight uppercase mt-2">METRO WHOLESALE & SUPPLY</h1>
              <p className="text-xs text-slate-500 italic font-bold uppercase tracking-wider">A4 FORMATTED STOCK VALUATION & CURRENT INVENTORY LIST</p>
              <p className="text-[10px] text-slate-600 font-medium">Generated on: {new Date().toLocaleDateString('en-IN')} | Filter: Category [{selectedCategory}]</p>
            </div>
            <div className="text-right space-y-1 text-xs">
              <p className="text-slate-500"><strong>Report ID:</strong> <span className="font-mono font-bold text-black uppercase">SR-{Date.now().toString().slice(-6)}</span></p>
              <p className="text-slate-500"><strong>Status:</strong> <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 font-bold text-[9px] uppercase">Verified Stock</span></p>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-4 gap-4 py-5 border-b-2 border-black">
            <div className="p-3 bg-[#F9F9F7] border border-black">
              <p className="text-slate-500 font-sans uppercase font-black text-[8px] tracking-widest">Total Unique Products</p>
              <p className="font-black text-black text-lg font-mono">{filteredItems.length}</p>
            </div>
            <div className="p-3 bg-[#F9F9F7] border border-black">
              <p className="text-slate-500 font-sans uppercase font-black text-[8px] tracking-widest">Aggregate Quantity</p>
              <p className="font-black text-black text-lg font-mono">{totalQty} units</p>
            </div>
            <div className="p-3 bg-[#F9F9F7] border border-black">
              <p className="text-slate-500 font-sans uppercase font-black text-[8px] tracking-widest">Valuation (Wholesale Rate)</p>
              <p className="font-black text-emerald-700 text-lg font-mono">₹{totalWholesaleValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
            </div>
            <div className="p-3 bg-[#F9F9F7] border border-black">
              <p className="text-slate-500 font-sans uppercase font-black text-[8px] tracking-widest">Valuation (MRP Total)</p>
              <p className="font-black text-black text-lg font-mono">₹{totalMrpValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-4">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="border-b-2 border-black bg-[#F9F9F7] text-[9px] text-[#1A1A1A] uppercase font-black tracking-wider">
                  <th className="py-3 pl-2">#</th>
                  <th className="py-3 font-bold">Product Name & Category</th>
                  <th className="py-3 text-center">HSN Code</th>
                  <th className="py-3 text-center">GST %</th>
                  <th className="py-3 text-right">Wholesale Rate (₹)</th>
                  <th className="py-3 text-right">Selling Price (MRP) (₹)</th>
                  <th className="py-3 text-center">Stock Qty</th>
                  <th className="py-3 pr-2 text-right">Stock Value (Wholesale)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black font-semibold text-black">
                {filteredItems.map((item, idx) => {
                  const itemValue = item.quantity * item.rate;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/20">
                      <td className="py-3 pl-2 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-3">
                        <p className="font-bold text-black">{item.name}</p>
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold font-mono">{item.category || 'General'}</p>
                      </td>
                      <td className="py-3 text-center font-mono text-slate-500">{item.hsnCode || 'N/A'}</td>
                      <td className="py-3 text-center font-mono">{item.gstPercentage}%</td>
                      <td className="py-3 text-right font-mono">₹{item.rate.toFixed(2)}</td>
                      <td className="py-3 text-right font-mono">₹{item.sellingPrice.toFixed(2)}</td>
                      <td className="py-3 text-center font-mono font-bold">
                        {item.quantity <= 0 ? (
                          <span className="text-red-600 font-black">OUT OF STOCK</span>
                        ) : (
                          <span>{item.quantity} units</span>
                        )}
                      </td>
                      <td className="py-3 pr-2 text-right font-black font-mono text-black">₹{itemValue.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer Receiver block */}
          <div className="grid grid-cols-2 gap-4 pt-12 mt-12 border-t-2 border-black text-[10px] text-slate-400">
            <div>
              <p className="font-black text-slate-500 uppercase tracking-widest text-[8px] mb-1">Office Inventory Directives:</p>
              <p className="italic text-slate-500 leading-normal">This stock ledger sheet was formatted automatically for registered printer outputs. Stock quantities must be verified physically on a weekly cycle.</p>
            </div>
            <div className="text-right flex flex-col justify-end items-end h-24">
              <p className="font-bold text-slate-700">Metro Warehouse Supervisor Signature</p>
              <div className="flex-1"></div>
              <div className="border-t border-slate-400 w-48 pt-1 mt-4">
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Warehouse Head</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="inventory-manager-container">
      
      {/* Search and Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <div className="flex-1 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-[#1A1A1A]" />
            <input
              type="text"
              placeholder="Search items by name or HSN code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border-2 border-[#1A1A1A] text-xs pl-10 pr-4 py-3 focus:outline-none rounded-none"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white border-2 border-[#1A1A1A] text-xs px-4 py-3 focus:outline-none rounded-none max-w-[150px] font-bold"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsPrintView(true)}
            className="px-4 py-3 border-2 border-black hover:bg-slate-100 bg-[#F9F9F7] text-black text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2 rounded-none cursor-pointer"
          >
            <Printer size={14} />
            Print A4 List
          </button>

          <button
            onClick={handleExportCsv}
            className="px-4 py-3 border-2 border-[#1A1A1A] hover:bg-slate-100 bg-white text-[#1A1A1A] text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 rounded-none cursor-pointer"
          >
            <Download size={14} />
            Export CSV
          </button>
          
          <button
            onClick={() => setIsImportOpen(true)}
            className="px-4 py-3 border-2 border-[#1A1A1A] hover:bg-slate-100 bg-[#F9F9F7] text-[#1A1A1A] text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 rounded-none cursor-pointer"
          >
            <FileSpreadsheet size={14} />
            Excel Import
          </button>

          <button
            onClick={handleOpenAddForm}
            className="px-5 py-3 bg-[#1A1A1A] hover:bg-white hover:text-[#1A1A1A] border-2 border-[#1A1A1A] text-white text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2 rounded-none cursor-pointer"
          >
            <Plus size={14} />
            Add New Item
          </button>
        </div>
      </div>

      {/* Stock Cards Info - Editorial Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 border-2 border-[#1A1A1A] rounded-none">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Unique Products</p>
          <p className="text-2xl font-black italic mt-1 font-display text-[#1A1A1A]">{inventory.length}</p>
        </div>
        <div className="bg-[#F9F9F7] p-5 border-2 border-[#1A1A1A] rounded-none">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Stock Quantity</p>
          <p className="text-2xl font-black italic mt-1 font-display text-black">
            {inventory.reduce((sum, item) => sum + item.quantity, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-5 border-2 border-[#1A1A1A] rounded-none">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Valuation (Cost)</p>
          <p className="text-2xl font-black italic mt-1 font-display text-[#1A1A1A]">
            ₹{inventory.reduce((sum, item) => sum + (item.quantity * item.buyingPrice), 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white p-5 border-2 border-[#1A1A1A] rounded-none">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Projected Revenue (MRP)</p>
          <p className="text-2xl font-black italic mt-1 font-display text-black">
            ₹{inventory.reduce((sum, item) => sum + (item.quantity * item.sellingPrice), 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Items Table - Block Editorial */}
      <div className="bg-white border-2 border-[#1A1A1A] rounded-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F9F9F7] text-[#1A1A1A] border-b-2 border-[#1A1A1A] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-4 text-left">Item Name & Category</th>
                <th className="px-3 py-4 text-center">HSN Code</th>
                <th className="px-3 py-4 text-center">GST %</th>
                <th className="px-3 py-4 text-right">Buying Price</th>
                <th className="px-3 py-4 text-right">Selling Price</th>
                <th className="px-3 py-4 text-right">Rate (Wholesale)</th>
                <th className="px-3 py-4 text-center">Stock Quantity</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400 font-medium">
                    No items found matching the search criteria. Click "Add New Item" or "Excel Import" to start.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-[#F9F9F7]/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-[#1A1A1A]">{item.name}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1 mt-1">
                        <Layers size={10} />
                        {item.category || 'General'}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center text-[#1A1A1A] font-mono font-medium">
                      {item.hsnCode || '0000'}
                    </td>
                    <td className="px-3 py-4 text-center">
                      <span className="border border-black bg-slate-100 text-black px-2.5 py-0.5 font-bold text-[10px]">
                        {item.gstPercentage}%
                      </span>
                    </td>
                    <td className="px-3 py-4 text-right font-mono font-bold text-slate-600">
                      ₹{item.buyingPrice.toFixed(2)}
                    </td>
                    <td className="px-3 py-4 text-right font-mono font-bold text-black">
                      ₹{item.sellingPrice.toFixed(2)}
                    </td>
                    <td className="px-3 py-4 text-right font-mono font-bold text-[#1A1A1A]">
                      ₹{item.rate.toFixed(2)}
                    </td>
                    <td className="px-3 py-4 text-center">
                      <span className={`px-3 py-1 font-bold text-[10px] uppercase border ${
                        item.quantity <= 0 
                          ? 'border-red-600 bg-red-50 text-red-700' 
                          : item.quantity <= 10 
                            ? 'border-amber-500 bg-amber-50 text-amber-700' 
                            : 'border-black bg-white text-black'
                      }`}>
                        {item.quantity} units
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditForm(item)}
                          className="p-1.5 border border-black hover:bg-black hover:text-white transition-colors cursor-pointer"
                          title="Edit Item"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 border border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                          title="Delete Item"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-40">
          <div className="bg-white border-2 border-[#1A1A1A] rounded-none max-w-lg w-full overflow-hidden shadow-none">
            <div className="px-6 py-5 bg-[#F9F9F7] border-b-2 border-[#1A1A1A] flex justify-between items-center">
              <h3 className="font-black italic uppercase tracking-widest text-[#1A1A1A] text-sm font-display">
                {editingItem ? 'Edit Product Item' : 'Add New Product Item'}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)} 
                className="text-[#1A1A1A] hover:opacity-70 text-lg font-black cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveItem} className="p-6 space-y-5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] mb-1.5">Product Description / Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-[#1A1A1A] p-3 text-xs focus:ring-1 focus:ring-black focus:outline-none"
                  placeholder="e.g. Copper wire 2.5mm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] mb-1.5">Item Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white border border-[#1A1A1A] p-3 text-xs focus:ring-1 focus:ring-black focus:outline-none"
                    placeholder="e.g. Cables"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] mb-1.5">HSN Code (GST)</label>
                  <input
                    type="text"
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                    className="w-full bg-white border border-[#1A1A1A] p-3 text-xs focus:ring-1 focus:ring-black focus:outline-none"
                    placeholder="e.g. 8544"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] mb-1.5">Initial Stock Qty</label>
                  <input
                    type="number"
                    min={0}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-white border border-[#1A1A1A] p-3 text-xs focus:ring-1 focus:ring-black focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] mb-1.5">GST Tax Percentage</label>
                  <select
                    value={gstPercentage}
                    onChange={(e) => setGstPercentage(parseInt(e.target.value))}
                    className="w-full bg-white border border-[#1A1A1A] p-3 text-xs focus:ring-1 focus:ring-black focus:outline-none font-bold"
                  >
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18% (Standard)</option>
                    <option value={28}>28% (Luxury)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] mb-1">Buying Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={buyingPrice}
                    onChange={(e) => setBuyingPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-white border border-[#1A1A1A] p-3 text-xs focus:ring-1 focus:ring-black focus:outline-none font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-white border border-[#1A1A1A] p-3 text-xs focus:ring-1 focus:ring-black focus:outline-none font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] mb-1">Wholesale Rate (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={rate}
                    onChange={(e) => setRate(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-white border border-[#1A1A1A] p-3 text-xs focus:ring-1 focus:ring-black focus:outline-none font-bold font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-6 py-3 border-2 border-slate-300 text-slate-700 text-xs font-bold uppercase tracking-widest hover:bg-slate-100 transition-colors rounded-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#1A1A1A] hover:bg-white hover:text-[#1A1A1A] border-2 border-[#1A1A1A] text-white text-xs font-black uppercase tracking-widest transition-colors rounded-none cursor-pointer"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Import Dialog */}
      {isImportOpen && (
        <ExcelImporter
          onClose={() => setIsImportOpen(false)}
          onImportComplete={handleImportComplete}
        />
      )}

    </div>
  );
}
