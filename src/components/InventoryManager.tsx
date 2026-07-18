/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { Search, Plus, Edit2, Trash2, FileSpreadsheet, Download, RefreshCw, Layers } from 'lucide-react';
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

  return (
    <div className="space-y-4" id="inventory-manager-container">
      
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search items by name or HSN code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 text-xs rounded-lg pl-9 pr-4 py-2.5 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white border border-slate-200 text-xs rounded-lg px-3 py-2.5 focus:outline-hidden focus:ring-1 focus:ring-blue-500 max-w-[150px]"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCsv}
            title="Export all stock to CSV"
            className="p-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
          >
            <Download size={14} />
            Export CSV
          </button>
          
          <button
            onClick={() => setIsImportOpen(true)}
            className="p-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet size={14} />
            Excel Import
          </button>

          <button
            onClick={handleOpenAddForm}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Plus size={14} />
            Add New Item
          </button>
        </div>
      </div>

      {/* Stock Cards Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Unique Products</p>
          <p className="text-xl font-bold text-slate-800 mt-0.5">{inventory.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Stock Quantity</p>
          <p className="text-xl font-bold text-blue-600 mt-0.5">
            {inventory.reduce((sum, item) => sum + item.quantity, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Stock Valuation (Cost)</p>
          <p className="text-xl font-bold text-slate-800 mt-0.5">
            ₹{inventory.reduce((sum, item) => sum + (item.quantity * item.buyingPrice), 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Projected Revenue (MRP)</p>
          <p className="text-xl font-bold text-emerald-600 mt-0.5">
            ₹{inventory.reduce((sum, item) => sum + (item.quantity * item.sellingPrice), 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl shadow-2xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 text-left">Item Name & Category</th>
                <th className="px-3 py-3 text-center">HSN Code</th>
                <th className="px-3 py-3 text-center">GST %</th>
                <th className="px-3 py-3 text-right">Buying Price</th>
                <th className="px-3 py-3 text-right">Selling Price</th>
                <th className="px-3 py-3 text-right">Rate (Wholesale)</th>
                <th className="px-3 py-3 text-center">Stock Quantity</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                    No items found matching the search criteria. Click "Add New Item" or "Excel Import" to start.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-semibold text-slate-800">{item.name}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Layers size={10} />
                        {item.category || 'General'}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center text-slate-500 font-mono">
                      {item.hsnCode || '0000'}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-sm font-medium text-[10px]">
                        {item.gstPercentage}%
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-slate-700">
                      ₹{item.buyingPrice.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-slate-900">
                      ₹{item.sellingPrice.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-blue-600">
                      ₹{item.rate.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full font-bold text-[10px] ${
                        item.quantity <= 0 
                          ? 'bg-red-100 text-red-800' 
                          : item.quantity <= 10 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-blue-50 text-blue-800'
                      }`}>
                        {item.quantity} units
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditForm(item)}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-sm transition-colors"
                          title="Edit Item"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-50 rounded-sm transition-colors"
                          title="Delete Item"
                        >
                          <Trash2 size={14} />
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 text-sm">
                {editingItem ? 'Edit Product Item' : 'Add New Product Item'}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)} 
                className="text-slate-400 hover:text-slate-600 text-sm font-medium"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveItem} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Product Description / Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. Copper wire 2.5mm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Item Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g. Cables"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">HSN Code (GST)</label>
                  <input
                    type="text"
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g. 8544"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Initial Stock Qty</label>
                  <input
                    type="number"
                    min={0}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">GST Tax Percentage</label>
                  <select
                    value={gstPercentage}
                    onChange={(e) => setGstPercentage(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
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
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Buying Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={buyingPrice}
                    onChange={(e) => setBuyingPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Wholesale Rate (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={rate}
                    onChange={(e) => setRate(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="px-6 py-4 -mx-6 -mb-6 bg-slate-50 border-t border-slate-150 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
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
