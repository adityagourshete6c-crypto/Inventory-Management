/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { InventoryItem, Invoice, InvoiceItem, BusinessDetails } from '../types';
import { Search, Plus, Trash2, Printer, Check, Info, FileText, Landmark, FileCheck } from 'lucide-react';

interface BillingManagerProps {
  inventory: InventoryItem[];
  businessDetails: BusinessDetails;
  invoices: Invoice[];
  onUpdateInvoices: (newInvoices: Invoice[]) => void;
  onUpdateInventory: (newInventory: InventoryItem[]) => void;
}

export default function BillingManager({
  inventory,
  businessDetails,
  invoices,
  onUpdateInvoices,
  onUpdateInventory,
}: BillingManagerProps) {
  // Invoice state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [isInterstate, setIsInterstate] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Due'>('Cash');
  const [discount, setDiscount] = useState(0);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  // Selected items in current cart
  const [cartItems, setCartItems] = useState<{
    itemId: string;
    quantity: number;
    sellingPrice: number;
    useRate: boolean; // toggle sellingPrice vs rate
  }[]>([]);

  // Item Selector Row
  const [selItemId, setSelItemId] = useState('');
  const [selQty, setSelQty] = useState(1);
  const [selUseRate, setSelUseRate] = useState(false);

  // Active view: 'billing' | 'history' | 'print'
  const [activeView, setActiveView] = useState<'billing' | 'history' | 'print'>('billing');
  const [viewingInvoiceId, setViewingInvoiceId] = useState<string | null>(null);
  const [invoiceSearch, setInvoiceSearch] = useState('');

  // Auto-increment Invoice Number
  const getNextInvoiceNo = () => {
    const year = new Date().getFullYear();
    const count = invoices.length + 1;
    return `INV-${year}-${String(count).padStart(3, '0')}`;
  };
  const [invoiceNo, setInvoiceNo] = useState(getNextInvoiceNo());

  useEffect(() => {
    setInvoiceNo(getNextInvoiceNo());
  }, [invoices]);

  const handleAddItemToCart = () => {
    if (!selItemId) return;
    const item = inventory.find(i => i.id === selItemId);
    if (!item) return;

    // Check if stock is sufficient
    const existingCartItem = cartItems.find(c => c.itemId === selItemId);
    const existingQtyInCart = existingCartItem ? existingCartItem.quantity : 0;
    const requestedQty = existingQtyInCart + selQty;

    if (requestedQty > item.quantity) {
      alert(`Warning: Only ${item.quantity} units available in stock. Proceeding with maximum stock.`);
      const finalQty = Math.max(0, item.quantity);
      if (finalQty <= 0) return;
      
      if (existingCartItem) {
        setCartItems(cartItems.map(c => c.itemId === selItemId ? { ...c, quantity: finalQty } : c));
      } else {
        setCartItems([...cartItems, { itemId: selItemId, quantity: finalQty, sellingPrice: item.sellingPrice, useRate: selUseRate }]);
      }
    } else {
      if (existingCartItem) {
        setCartItems(cartItems.map(c => c.itemId === selItemId ? { ...c, quantity: requestedQty } : c));
      } else {
        setCartItems([...cartItems, { itemId: selItemId, quantity: selQty, sellingPrice: item.sellingPrice, useRate: selUseRate }]);
      }
    }

    // Reset row selector
    setSelItemId('');
    setSelQty(1);
    setSelUseRate(false);
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCartItems(cartItems.filter(c => c.itemId !== itemId));
  };

  const handleCartQtyChange = (itemId: string, newQty: number) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;
    
    const finalQty = Math.min(item.quantity, Math.max(1, newQty));
    setCartItems(cartItems.map(c => c.itemId === itemId ? { ...c, quantity: finalQty } : c));
  };

  const handleTogglePriceMode = (itemId: string) => {
    setCartItems(cartItems.map(c => c.itemId === itemId ? { ...c, useRate: !c.useRate } : c));
  };

  // Calculations for current active bill
  const calculateBill = () => {
    const items: InvoiceItem[] = cartItems.map(cart => {
      const dbItem = inventory.find(i => i.id === cart.itemId)!;
      const price = cart.useRate ? dbItem.rate : dbItem.sellingPrice;
      const taxableAmount = cart.quantity * price;
      const gstAmount = taxableAmount * (dbItem.gstPercentage / 100);
      const totalAmount = taxableAmount + gstAmount;

      return {
        itemId: dbItem.id,
        name: dbItem.name,
        quantity: cart.quantity,
        sellingPrice: dbItem.sellingPrice,
        rate: dbItem.rate,
        hsnCode: dbItem.hsnCode,
        gstPercentage: dbItem.gstPercentage,
        taxableAmount,
        gstAmount,
        totalAmount,
      };
    });

    const subTotal = items.reduce((sum, i) => sum + i.taxableAmount, 0);
    const gstTotal = items.reduce((sum, i) => sum + i.gstAmount, 0);
    const cgst = isInterstate ? 0 : gstTotal / 2;
    const sgst = isInterstate ? 0 : gstTotal / 2;
    const grandTotal = Math.max(0, subTotal + gstTotal - discount);

    return {
      items,
      subTotal,
      gstTotal,
      cgst,
      sgst,
      grandTotal,
    };
  };

  const bill = calculateBill();

  const handleSaveInvoice = () => {
    if (cartItems.length === 0) {
      alert('Please add at least one product item to the invoice.');
      return;
    }
    if (!customerName.trim()) {
      alert('Please enter a Customer Name to generate a valid GST invoice.');
      return;
    }

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNo,
      date: invoiceDate,
      customerName,
      customerPhone,
      customerGstin,
      customerAddress,
      items: bill.items,
      subTotal: bill.subTotal,
      gstTotal: bill.gstTotal,
      cgst: bill.cgst,
      sgst: bill.sgst,
      discount,
      grandTotal: bill.grandTotal,
      paymentMode,
      notes,
      isInterstate,
    };

    // Deduct inventory stock levels
    const updatedInventory = inventory.map(dbItem => {
      const cartItem = cartItems.find(c => c.itemId === dbItem.id);
      if (cartItem) {
        return {
          ...dbItem,
          quantity: Math.max(0, dbItem.quantity - cartItem.quantity)
        };
      }
      return dbItem;
    });

    onUpdateInventory(updatedInventory);
    onUpdateInvoices([...invoices, newInvoice]);

    // Reset billing fields
    setCustomerName('');
    setCustomerPhone('');
    setCustomerGstin('');
    setCustomerAddress('');
    setCartItems([]);
    setDiscount(0);
    setNotes('');

    // Launch printable copy
    setViewingInvoiceId(newInvoice.id);
    setActiveView('print');
  };

  const activeInvoice = invoices.find(inv => inv.id === viewingInvoiceId);

  const handlePrint = () => {
    window.print();
  };

  const numberToWords = (num: number): string => {
    // Basic number to words converter for invoices
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    const convert = (n: number): string => {
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100) : '');
      if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
      return '';
    };

    const rounded = Math.round(num);
    if (rounded === 0) return 'Zero Rupees Only';
    return convert(rounded) + ' Rupees Only';
  };

  return (
    <div className="space-y-4" id="billing-manager-container">
      
      {/* Navigation sub-tabs */}
      <div className="flex bg-slate-100 rounded-lg p-1 text-xs font-bold text-slate-600 self-start max-w-xs">
        <button
          onClick={() => setActiveView('billing')}
          className={`flex-1 py-2 px-4 rounded-md transition-colors text-center ${
            activeView === 'billing' ? 'bg-white text-slate-800 shadow-3xs' : 'hover:text-slate-900'
          }`}
        >
          Bill Maker
        </button>
        <button
          onClick={() => setActiveView('history')}
          className={`flex-1 py-2 px-4 rounded-md transition-colors text-center ${
            activeView === 'history' ? 'bg-white text-slate-800 shadow-3xs' : 'hover:text-slate-900'
          }`}
        >
          Invoices Log
        </button>
      </div>

      {activeView === 'billing' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT AREA: Invoice Details & Products Selector (Col 2) */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Customer Details Block */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Customer & Bill metadata</h3>
                <span className="text-xs font-semibold text-blue-600 font-mono">{invoiceNo}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Customer / Client Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    placeholder="Company or Individual"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Customer Phone Number</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    placeholder="Contact mobile"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Customer GSTIN (Tax No)</label>
                  <input
                    type="text"
                    maxLength={15}
                    value={customerGstin}
                    onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-lg p-2 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    placeholder="15-char GSTIN ID"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Billing & Delivery Address</label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    placeholder="Customer billing details..."
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Invoice Date</label>
                  <input
                    type="date"
                    required
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Product Cart Builder */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-800 text-xs uppercase border-b border-slate-100 pb-2 tracking-wider">Log items delivered</h3>
              
              {/* Item Selector Form Row */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col md:flex-row items-end gap-3">
                <div className="flex-1">
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Search Catalog Product</label>
                  <select
                    value={selItemId}
                    onChange={(e) => setSelItemId(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-xs rounded-md p-1.5 focus:outline-hidden"
                  >
                    <option value="">-- Choose item from stock --</option>
                    {inventory.map(item => (
                      <option key={item.id} value={item.id} disabled={item.quantity <= 0}>
                        {item.name} (Qty Available: {item.quantity}) {item.quantity <= 0 ? '[OUT OF STOCK]' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-24">
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={selQty}
                    onChange={(e) => setSelQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-white border border-slate-200 text-xs rounded-md p-1.5 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-1.5 h-9">
                  <input
                    type="checkbox"
                    id="selUseRate"
                    checked={selUseRate}
                    onChange={(e) => setSelUseRate(e.target.checked)}
                    className="rounded-sm"
                  />
                  <label htmlFor="selUseRate" className="text-[10px] text-slate-600 font-semibold cursor-pointer">
                    Apply Wholesale Rate
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleAddItemToCart}
                  disabled={!selItemId}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md disabled:opacity-50 transition-colors flex items-center gap-1 shrink-0 h-8"
                >
                  <Plus size={12} /> Add
                </button>
              </div>

              {/* Cart Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2">Item Description</th>
                      <th className="px-3 py-2 text-center">HSN</th>
                      <th className="px-3 py-2 text-center">GST %</th>
                      <th className="px-3 py-2 text-right">Price Mode</th>
                      <th className="px-3 py-2 text-right">Unit Price</th>
                      <th className="px-3 py-2 text-center w-24">Qty Delivered</th>
                      <th className="px-3 py-2 text-right">Taxable Amt</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cartItems.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                          Your active bill cart is empty. Choose products above to compile.
                        </td>
                      </tr>
                    ) : (
                      cartItems.map(cart => {
                        const dbItem = inventory.find(i => i.id === cart.itemId)!;
                        const price = cart.useRate ? dbItem.rate : dbItem.sellingPrice;
                        return (
                          <tr key={cart.itemId} className="hover:bg-slate-50/20">
                            <td className="px-4 py-2 font-medium text-slate-800">{dbItem.name}</td>
                            <td className="px-3 py-2 text-center font-mono text-[10px] text-slate-400">{dbItem.hsnCode}</td>
                            <td className="px-3 py-2 text-center font-semibold text-slate-600">{dbItem.gstPercentage}%</td>
                            <td className="px-3 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => handleTogglePriceMode(cart.itemId)}
                                className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  cart.useRate 
                                    ? 'bg-purple-100 text-purple-800 hover:bg-purple-200' 
                                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                }`}
                              >
                                {cart.useRate ? 'Wholesale' : 'Retail'}
                              </button>
                            </td>
                            <td className="px-3 py-2 text-right text-slate-700 font-semibold">₹{price.toFixed(2)}</td>
                            <td className="px-3 py-2 text-center">
                              <input
                                type="number"
                                min={1}
                                max={dbItem.quantity}
                                value={cart.quantity}
                                onChange={(e) => handleCartQtyChange(cart.itemId, parseInt(e.target.value) || 1)}
                                className="w-16 border border-slate-200 text-center rounded-md p-1 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-bold"
                              />
                            </td>
                            <td className="px-3 py-2 text-right text-slate-900 font-bold">
                              ₹{(cart.quantity * price).toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-right">
                              <button
                                onClick={() => handleRemoveFromCart(cart.itemId)}
                                className="text-slate-400 hover:text-red-600 p-1"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

            </div>

          </div>

          {/* RIGHT COLUMN: Bill Calculations & Invoice Save Controls (Col 1) */}
          <div className="space-y-4">
            
            {/* Calculation summary block */}
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
              <h3 className="font-bold text-slate-800 text-xs border-b border-slate-100 pb-2 tracking-wider">Tax & Invoice Calculations</h3>

              <div className="space-y-2 text-xs">
                
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Taxable Sub-Total:</span>
                  <span className="text-slate-800 font-semibold">₹{bill.subTotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center text-slate-500">
                  <div className="flex items-center gap-1">
                    <span>IGST Interstate Toggle:</span>
                    <input
                      type="checkbox"
                      checked={isInterstate}
                      onChange={(e) => setIsInterstate(e.target.checked)}
                      className="rounded-sm"
                    />
                  </div>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold">
                    {isInterstate ? 'IGST Applicable' : 'CGST + SGST splitting'}
                  </span>
                </div>

                {isInterstate ? (
                  <div className="flex justify-between text-slate-500">
                    <span>IGST collected:</span>
                    <span className="text-slate-800 font-semibold">₹{bill.gstTotal.toFixed(2)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-slate-500">
                      <span>CGST (half portion):</span>
                      <span className="text-slate-800 font-semibold">₹{bill.cgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>SGST (half portion):</span>
                      <span className="text-slate-800 font-semibold">₹{bill.sgst.toFixed(2)}</span>
                    </div>
                  </>
                )}

                {/* Discount input row */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-slate-500">Invoice Cash Discount (₹):</span>
                  <input
                    type="number"
                    min={0}
                    value={discount || ''}
                    onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-24 border border-slate-200 text-right rounded-md p-1 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-bold"
                    placeholder="₹ 0.00"
                  />
                </div>

                {/* GRAND TOTAL */}
                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="font-bold text-slate-800 text-sm">Invoice Grand Total:</span>
                  <span className="font-black text-xl text-blue-600">₹{bill.grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment details configuration */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Invoice Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:outline-hidden"
                  >
                    <option value="Cash">Cash Handover</option>
                    <option value="UPI">UPI Payment (GPay/Paytm)</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Bank Transfer">Bank NEFT/RTGS</option>
                    <option value="Due">Invoice Outstanding (Due Later)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Internal Billing Remarks</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:outline-hidden"
                    placeholder="e.g. Delivered by Karan Singh"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveInvoice}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors shadow-xs flex items-center justify-center gap-2"
                >
                  <FileCheck size={16} />
                  Compile & Save GST Invoice
                </button>
              </div>
            </div>

            {/* Quick stock warning help */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-start gap-2">
              <Info size={16} className="text-slate-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-500 leading-normal">
                Saving this invoice will automatically subtract quantities from current catalog stock. Invoices are logged with the business logo config on the database profile.
              </p>
            </div>
          </div>

        </div>
      )}

      {activeView === 'history' && (
        <div className="space-y-4">
          
          <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search invoice number, client name..."
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg pl-8 pr-3 py-2 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Historical Logs List */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-semibold">
                  <tr>
                    <th className="px-5 py-3">Invoice No</th>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Customer / Client</th>
                    <th className="px-3 py-3 text-center">Tax Split Mode</th>
                    <th className="px-3 py-3 text-center">Payment Mode</th>
                    <th className="px-3 py-3 text-right">Taxable Amt</th>
                    <th className="px-3 py-3 text-right">Tax Value</th>
                    <th className="px-3 py-3 text-right">Invoice Total</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.filter(inv => 
                    inv.invoiceNo.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
                    inv.customerName.toLowerCase().includes(invoiceSearch.toLowerCase())
                  ).length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-5 py-8 text-center text-slate-400">
                        No billing transactions logged.
                      </td>
                    </tr>
                  ) : (
                    invoices.filter(inv => 
                      inv.invoiceNo.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
                      inv.customerName.toLowerCase().includes(invoiceSearch.toLowerCase())
                    ).map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50/20">
                        <td className="px-5 py-3 font-bold text-blue-600 font-mono">{inv.invoiceNo}</td>
                        <td className="px-3 py-3 text-slate-500">{inv.date}</td>
                        <td className="px-3 py-3">
                          <div className="font-bold text-slate-800">{inv.customerName}</div>
                          {inv.customerPhone && <div className="text-[10px] text-slate-400">{inv.customerPhone}</div>}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-sm text-[9px] font-semibold ${inv.isInterstate ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                            {inv.isInterstate ? 'IGST' : 'CGST + SGST'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium text-[9px]">
                            {inv.paymentMode}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right font-medium text-slate-700">₹{inv.subTotal.toFixed(2)}</td>
                        <td className="px-3 py-3 text-right font-medium text-slate-600">₹{inv.gstTotal.toFixed(2)}</td>
                        <td className="px-3 py-3 text-right font-bold text-slate-900">₹{inv.grandTotal.toFixed(2)}</td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => {
                              setViewingInvoiceId(inv.id);
                              setActiveView('print');
                            }}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-semibold flex items-center gap-1 shrink-0 inline-flex transition-colors cursor-pointer"
                          >
                            <Printer size={10} /> View & Print
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* VIEW 3: Beautiful, authentic Indian GST Printable Invoice Copy */}
      {activeView === 'print' && activeInvoice && (
        <div className="space-y-4 max-w-3xl mx-auto">
          
          <div className="flex justify-between items-center bg-slate-50 p-4 border border-slate-200 rounded-xl no-print">
            <button
              onClick={() => setActiveView('billing')}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              ← Back to Bill Maker
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveView('history')}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Invoices Log
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Printer size={14} /> Print Tax Invoice
              </button>
            </div>
          </div>

          {/* PRINT CANVAS */}
          <div className="bg-white border border-slate-300 p-8 shadow-xs rounded-xl text-slate-800 font-sans print:border-none print:shadow-none print:p-0" id="gst-invoice-print">
            
            {/* Header / Brand Details */}
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-sm">Tax Invoice</span>
                <h1 className="text-2xl font-black text-slate-900 leading-tight">{businessDetails.name}</h1>
                <p className="text-xs text-slate-500 italic font-medium">{businessDetails.tagline}</p>
                <p className="text-[10px] text-slate-500 font-medium max-w-md mt-1">{businessDetails.address}</p>
                <p className="text-[10px] text-slate-500 font-semibold">Phone: {businessDetails.phone} | Email: {businessDetails.email}</p>
              </div>

              <div className="text-right space-y-1 font-mono text-[10px]">
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-left">
                  <p className="text-slate-400 font-sans uppercase font-bold text-[8px] tracking-wider">GSTIN NUMBER</p>
                  <p className="font-bold text-slate-800 text-xs">{businessDetails.gstin}</p>
                  <p className="text-[9px] text-slate-500 font-sans mt-0.5">State Code: {businessDetails.stateCode}</p>
                </div>
              </div>
            </div>

            {/* Bill details split */}
            <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-150">
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">BILLED TO (BUYER):</p>
                <p className="font-bold text-slate-800 text-xs">{activeInvoice.customerName}</p>
                {activeInvoice.customerAddress && <p className="text-[10px] text-slate-500 leading-relaxed">{activeInvoice.customerAddress}</p>}
                {activeInvoice.customerPhone && <p className="text-[10px] text-slate-500">Phone: {activeInvoice.customerPhone}</p>}
                {activeInvoice.customerGstin ? (
                  <p className="text-[10px] font-semibold text-slate-700 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-sm inline-block font-mono mt-1">
                    GSTIN: {activeInvoice.customerGstin}
                  </p>
                ) : (
                  <p className="text-[9px] text-slate-400">UNREGISTERED CONSUMER (B2C)</p>
                )}
              </div>

              <div className="text-right space-y-1 text-xs">
                <div className="inline-block text-left space-y-1 border-l border-slate-200 pl-4">
                  <p className="text-slate-500"><strong>Invoice No:</strong> <strong className="text-blue-600 font-mono text-sm">{activeInvoice.invoiceNo}</strong></p>
                  <p className="text-slate-500"><strong>Invoice Date:</strong> <strong className="text-slate-800">{activeInvoice.date}</strong></p>
                  <p className="text-slate-500"><strong>Place of Supply:</strong> {activeInvoice.isInterstate ? 'Interstate' : 'Intrastate (Local)'}</p>
                  <p className="text-slate-500"><strong>Payment Mode:</strong> <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold text-[9px] text-slate-700">{activeInvoice.paymentMode}</span></p>
                </div>
              </div>
            </div>

            {/* Structured Item List with detailed GST breakup */}
            <div className="py-4">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-800 bg-slate-50 text-[10px] text-slate-600 uppercase font-bold">
                    <th className="py-2 pl-2">#</th>
                    <th className="py-2">Item Description</th>
                    <th className="py-2 text-center">HSN</th>
                    <th className="py-2 text-right">Qty</th>
                    <th className="py-2 text-right">Rate (₹)</th>
                    <th className="py-2 text-right">Taxable Amt</th>
                    {activeInvoice.isInterstate ? (
                      <>
                        <th className="py-2 text-right">IGST %</th>
                        <th className="py-2 text-right">IGST Amt</th>
                      </>
                    ) : (
                      <>
                        <th className="py-2 text-right">CGST %</th>
                        <th className="py-2 text-right">CGST Amt</th>
                        <th className="py-2 text-right">SGST %</th>
                        <th className="py-2 text-right">SGST Amt</th>
                      </>
                    )}
                    <th className="py-2 pr-2 text-right">Net Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {activeInvoice.items.map((item, idx) => {
                    const basePrice = item.taxableAmount / item.quantity;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/20">
                        <td className="py-2 pl-2 text-slate-400">{idx + 1}</td>
                        <td className="py-2 font-bold text-slate-800">{item.name}</td>
                        <td className="py-2 text-center font-mono text-[10px] text-slate-500">{item.hsnCode}</td>
                        <td className="py-2 text-right font-semibold">{item.quantity}</td>
                        <td className="py-2 text-right font-semibold">₹{basePrice.toFixed(2)}</td>
                        <td className="py-2 text-right">₹{item.taxableAmount.toFixed(2)}</td>
                        {activeInvoice.isInterstate ? (
                          <>
                            <td className="py-2 text-right">{item.gstPercentage}%</td>
                            <td className="py-2 text-right">₹{item.gstAmount.toFixed(2)}</td>
                          </>
                        ) : (
                          <>
                            <td className="py-2 text-right">{item.gstPercentage / 2}%</td>
                            <td className="py-2 text-right">₹{(item.gstAmount / 2).toFixed(2)}</td>
                            <td className="py-2 text-right">{item.gstPercentage / 2}%</td>
                            <td className="py-2 text-right">₹{(item.gstAmount / 2).toFixed(2)}</td>
                          </>
                        )}
                        <td className="py-2 pr-2 text-right font-bold text-slate-900">₹{item.totalAmount.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Calculations Blocks */}
            <div className="grid grid-cols-2 gap-6 pt-4 border-t-2 border-slate-800">
              {/* Left Details (Words, bank details) */}
              <div className="space-y-4 text-[10px]">
                <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                  <p className="text-slate-400 uppercase font-bold text-[8px] tracking-wider mb-0.5">Amount Chargeable (in Words)</p>
                  <p className="font-semibold text-slate-700 capitalize">{numberToWords(activeInvoice.grandTotal)}</p>
                </div>

                {/* Bank nets transfer details */}
                {businessDetails.bankName && (
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-100 space-y-1">
                    <p className="text-slate-400 uppercase font-bold text-[8px] tracking-wider flex items-center gap-1">
                      <Landmark size={10} className="text-blue-600" />
                      Remittance / Bank Account Details
                    </p>
                    <div className="grid grid-cols-2 text-slate-600 font-medium leading-relaxed gap-x-2">
                      <span><strong>Bank Name:</strong> {businessDetails.bankName}</span>
                      <span><strong>IFSC Code:</strong> <strong className="font-mono text-slate-700">{businessDetails.bankIfsc}</strong></span>
                      <span className="col-span-2"><strong>A/c Number:</strong> <strong className="font-mono text-blue-600">{businessDetails.bankAccountNo}</strong></span>
                    </div>
                  </div>
                )}

                {activeInvoice.notes && (
                  <p className="text-[10px] text-slate-400 italic"><strong>Billing Remarks:</strong> "{activeInvoice.notes}"</p>
                )}
              </div>

              {/* Right Totals summary */}
              <div className="text-right space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-100 pb-1.5 text-slate-500 font-medium">
                  <span>Total Taxable Value:</span>
                  <span className="text-slate-800 font-bold">₹{activeInvoice.subTotal.toFixed(2)}</span>
                </div>

                {activeInvoice.isInterstate ? (
                  <div className="flex justify-between border-b border-slate-100 pb-1.5 text-slate-500 font-medium">
                    <span>Integrated Tax (IGST):</span>
                    <span className="text-slate-800 font-bold">₹{activeInvoice.gstTotal.toFixed(2)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-slate-500 font-medium">
                      <span>Central Tax (CGST):</span>
                      <span className="text-slate-800 font-bold">₹{activeInvoice.cgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5 text-slate-500 font-medium">
                      <span>State Tax (SGST):</span>
                      <span className="text-slate-800 font-bold">₹{activeInvoice.sgst.toFixed(2)}</span>
                    </div>
                  </>
                )}

                {activeInvoice.discount > 0 && (
                  <div className="flex justify-between border-b border-slate-100 pb-1.5 text-slate-500 font-medium">
                    <span>Discount Allowed:</span>
                    <span className="text-emerald-700 font-bold">- ₹{activeInvoice.discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between pt-1.5 items-baseline">
                  <span className="font-black text-slate-800 text-sm">Grand Net Payable:</span>
                  <span className="font-black text-lg text-slate-900 border-b-2 border-double border-slate-800">
                    ₹{activeInvoice.grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Terms and signature */}
            <div className="grid grid-cols-2 gap-4 pt-6 mt-6 border-t border-slate-150 text-[9px] text-slate-400 leading-normal">
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wide text-[8px] mb-1">Terms & Conditions:</p>
                <div className="whitespace-pre-line text-slate-400 italic">
                  {businessDetails.termsAndConditions}
                </div>
              </div>

              <div className="text-right flex flex-col justify-end items-end h-24">
                <p className="text-[10px] font-bold text-slate-700">For {businessDetails.name}</p>
                <div className="flex-1"></div>
                <div className="border-t border-slate-300 w-44 pt-1 mt-4">
                  <p className="text-[8px] font-semibold text-slate-500 uppercase">Authorized Signatory</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
