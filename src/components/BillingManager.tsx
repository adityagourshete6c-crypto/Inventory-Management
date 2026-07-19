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
      
      {/* Navigation sub-tabs - Editorial Aesthetic */}
      <div className="flex border-b border-[#1A1A1A] text-xs font-bold text-[#1A1A1A] self-start w-full no-print">
        <button
          onClick={() => setActiveView('billing')}
          className={`py-3 px-6 border-t border-l border-r border-[#1A1A1A] mr-1 font-display font-bold uppercase tracking-widest transition-colors cursor-pointer ${
            activeView === 'billing' ? 'bg-[#1A1A1A] text-white' : 'bg-transparent text-[#1A1A1A] hover:bg-slate-100'
          }`}
        >
          Bill Maker
        </button>
        <button
          onClick={() => setActiveView('history')}
          className={`py-3 px-6 border-t border-l border-r border-[#1A1A1A] font-display font-bold uppercase tracking-widest transition-colors cursor-pointer ${
            activeView === 'history' ? 'bg-[#1A1A1A] text-white' : 'bg-transparent text-[#1A1A1A] hover:bg-slate-100'
          }`}
        >
          Invoices Log
        </button>
      </div>

      {activeView === 'billing' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT AREA: Invoice Details & Products Selector (Col 2) */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Customer Details Block - Editorial Aesthetic */}
            <div className="bg-white p-6 rounded-none border-2 border-[#1A1A1A] space-y-4">
              <div className="flex justify-between items-center border-b border-[#1A1A1A] pb-2">
                <h3 className="font-black font-display text-xs uppercase tracking-widest text-[#1A1A1A]">Customer & Invoice Metadata</h3>
                <span className="text-xs font-bold text-[#1A1A1A] font-mono border border-black bg-slate-100 px-2 py-0.5">{invoiceNo}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1A1A1A] mb-1">Customer / Client Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-white border border-[#1A1A1A] text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder="Company or Individual"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1A1A1A] mb-1">Customer Phone Number</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-white border border-[#1A1A1A] text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder="Contact mobile"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1A1A1A] mb-1">Customer GSTIN (Tax No)</label>
                  <input
                    type="text"
                    maxLength={15}
                    value={customerGstin}
                    onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())}
                    className="w-full bg-white border border-[#1A1A1A] text-xs font-mono p-2.5 focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder="15-char GSTIN ID"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1A1A1A] mb-1">Billing & Delivery Address</label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full bg-white border border-[#1A1A1A] text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder="Customer billing details..."
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1A1A1A] mb-1">Invoice Date</label>
                  <input
                    type="date"
                    required
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full bg-white border border-[#1A1A1A] text-xs p-2.5 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Product Cart Builder - Editorial Aesthetic */}
            <div className="bg-white p-6 rounded-none border-2 border-[#1A1A1A] space-y-4">
              <h3 className="font-black font-display text-xs uppercase border-b border-[#1A1A1A] pb-2 tracking-widest text-[#1A1A1A]">Log Items Delivered</h3>
              
              {/* Item Selector Form Row */}
              <div className="bg-[#F9F9F7] p-4 rounded-none border border-[#1A1A1A] flex flex-col md:flex-row items-end gap-3">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Search Catalog Product</label>
                  <select
                    value={selItemId}
                    onChange={(e) => setSelItemId(e.target.value)}
                    className="w-full bg-white border border-[#1A1A1A] text-xs p-2 focus:outline-none focus:ring-1 focus:ring-black"
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
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={selQty}
                    onChange={(e) => setSelQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-white border border-[#1A1A1A] text-xs p-2 focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div className="flex items-center gap-1.5 h-9">
                  <input
                    type="checkbox"
                    id="selUseRate"
                    checked={selUseRate}
                    onChange={(e) => setSelUseRate(e.target.checked)}
                    className="w-4 h-4 border border-black focus:ring-0"
                  />
                  <label htmlFor="selUseRate" className="text-[10px] text-[#1A1A1A] font-bold uppercase tracking-wider cursor-pointer">
                    Wholesale Rate
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleAddItemToCart}
                  disabled={!selItemId}
                  className="px-6 py-2 bg-[#1A1A1A] hover:bg-white hover:text-black border border-black text-white text-xs font-bold uppercase tracking-widest disabled:opacity-50 transition-all flex items-center gap-1.5 shrink-0 h-9 rounded-none cursor-pointer"
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

          {/* RIGHT COLUMN: Bill Calculations & Invoice Save Controls (Col 1) - Editorial Aesthetic */}
          <div className="space-y-4">
            
            {/* Calculation summary block */}
            <div className="bg-white rounded-none border-2 border-[#1A1A1A] p-6 space-y-4 shadow-none">
              <h3 className="font-black font-display text-xs border-b border-[#1A1A1A] pb-2 uppercase tracking-widest text-[#1A1A1A]">Tax & Invoice Calculations</h3>

              <div className="space-y-2 text-xs font-medium">
                
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Sub-Total:</span>
                  <span className="text-black font-bold">₹{bill.subTotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold uppercase tracking-wider text-[10px]">Interstate (IGST):</span>
                    <input
                      type="checkbox"
                      checked={isInterstate}
                      onChange={(e) => setIsInterstate(e.target.checked)}
                      className="w-4 h-4 border border-black focus:ring-0"
                    />
                  </div>
                  <span className="text-[9px] border border-black bg-[#F9F9F7] px-2 py-0.5 text-black font-bold uppercase tracking-wider">
                    {isInterstate ? 'IGST 100%' : 'CGST + SGST'}
                  </span>
                </div>

                {isInterstate ? (
                  <div className="flex justify-between text-slate-600">
                    <span>IGST collected:</span>
                    <span className="text-black font-bold">₹{bill.gstTotal.toFixed(2)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>CGST (half portion):</span>
                      <span className="text-black font-bold">₹{bill.cgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>SGST (half portion):</span>
                      <span className="text-black font-bold">₹{bill.sgst.toFixed(2)}</span>
                    </div>
                  </>
                )}

                {/* Discount input row */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-slate-600">Invoice Cash Discount (₹):</span>
                  <input
                    type="number"
                    min={0}
                    value={discount || ''}
                    onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-24 border border-black text-right p-1 font-bold text-xs focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder="₹ 0.00"
                  />
                </div>

                {/* GRAND TOTAL */}
                <div className="pt-3 border-t border-black flex justify-between items-baseline">
                  <span className="font-bold text-[#1A1A1A] text-xs uppercase tracking-widest">Grand Total:</span>
                  <span className="font-black text-xl text-black font-mono">₹{bill.grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment details configuration */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] mb-1">Invoice Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full bg-white border border-[#1A1A1A] text-xs p-2 focus:outline-none"
                  >
                    <option value="Cash">Cash Handover</option>
                    <option value="UPI">UPI Payment (GPay/Paytm)</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Bank Transfer">Bank NEFT/RTGS</option>
                    <option value="Due">Invoice Outstanding (Due Later)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] mb-1">Internal Billing Remarks</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-white border border-[#1A1A1A] text-xs p-2 focus:outline-none"
                    placeholder="e.g. Delivered by Karan Singh"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveInvoice}
                  className="w-full py-3 bg-[#1A1A1A] hover:bg-white hover:text-black border-2 border-black text-white font-bold text-xs uppercase tracking-widest transition-all rounded-none cursor-pointer flex items-center justify-center gap-2"
                >
                  <FileCheck size={16} />
                  Compile & Save GST Invoice
                </button>
              </div>
            </div>

            {/* Quick stock warning help */}
            <div className="bg-[#F9F9F7] border border-[#1A1A1A] p-4 rounded-none flex items-start gap-2">
              <Info size={16} className="text-[#1A1A1A] shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-600 leading-normal font-medium">
                Saving this invoice will automatically subtract quantities from current catalog stock. Invoices are logged with the business logo config on the database profile.
              </p>
            </div>
          </div>

        </div>
      )}

      {activeView === 'history' && (
        <div className="space-y-4">
          
          <div className="flex justify-between items-center bg-white p-4 border-2 border-[#1A1A1A] rounded-none">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-[#1A1A1A]" />
              <input
                type="text"
                placeholder="Search invoice number, client name..."
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                className="w-full bg-white border border-black text-xs pl-10 pr-4 py-2.5 focus:outline-none rounded-none"
              />
            </div>
          </div>

          {/* Historical Logs List */}
          <div className="bg-white border-2 border-[#1A1A1A] rounded-none overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F9F9F7] text-[#1A1A1A] border-b-2 border-black font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-4">Invoice No</th>
                    <th className="px-3 py-4">Date</th>
                    <th className="px-3 py-4">Customer / Client</th>
                    <th className="px-3 py-4 text-center">Tax Split Mode</th>
                    <th className="px-3 py-4 text-center">Payment Mode</th>
                    <th className="px-3 py-4 text-right">Taxable Amt</th>
                    <th className="px-3 py-4 text-right">Tax Value</th>
                    <th className="px-3 py-4 text-right">Invoice Total</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {invoices.filter(inv => 
                    inv.invoiceNo.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
                    inv.customerName.toLowerCase().includes(invoiceSearch.toLowerCase())
                  ).length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-5 py-10 text-center text-slate-400 font-bold uppercase tracking-widest">
                        No billing transactions logged.
                      </td>
                    </tr>
                  ) : (
                    invoices.filter(inv => 
                      inv.invoiceNo.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
                      inv.customerName.toLowerCase().includes(invoiceSearch.toLowerCase())
                    ).map(inv => (
                      <tr key={inv.id} className="hover:bg-[#F9F9F7]/50 transition-colors">
                        <td className="px-5 py-4 font-black text-[#1A1A1A] font-mono">{inv.invoiceNo}</td>
                        <td className="px-3 py-4 text-slate-500 font-mono font-bold">{inv.date}</td>
                        <td className="px-3 py-4">
                          <div className="font-bold text-black">{inv.customerName}</div>
                          {inv.customerPhone && <div className="text-[10px] text-slate-400 font-bold">{inv.customerPhone}</div>}
                        </td>
                        <td className="px-3 py-4 text-center">
                          <span className={`px-2.5 py-0.5 border border-black text-[9px] font-black uppercase tracking-wider ${inv.isInterstate ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                            {inv.isInterstate ? 'IGST' : 'CGST + SGST'}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-center">
                          <span className="bg-slate-100 text-[#1A1A1A] border border-black px-2 py-0.5 font-bold uppercase text-[9px] tracking-wider">
                            {inv.paymentMode}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-right font-mono font-bold text-slate-600">₹{inv.subTotal.toFixed(2)}</td>
                        <td className="px-3 py-4 text-right font-mono font-bold text-slate-600">₹{inv.gstTotal.toFixed(2)}</td>
                        <td className="px-3 py-4 text-right font-mono font-black text-[#1A1A1A]">₹{inv.grandTotal.toFixed(2)}</td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => {
                              setViewingInvoiceId(inv.id);
                              setActiveView('print');
                            }}
                            className="px-3 py-1.5 bg-[#1A1A1A] hover:bg-white hover:text-black border border-black text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shrink-0 inline-flex transition-colors cursor-pointer rounded-none"
                          >
                            <Printer size={12} /> View & Print
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
        <div className="space-y-6 max-w-4xl mx-auto">
          
          <div className="flex justify-between items-center bg-[#F9F9F7] p-5 border-2 border-[#1A1A1A] rounded-none no-print">
            <button
              onClick={() => setActiveView('billing')}
              className="px-4 py-2.5 bg-white border-2 border-[#1A1A1A] text-black text-xs font-bold uppercase tracking-wider hover:bg-slate-100 transition-colors rounded-none cursor-pointer"
            >
              ← Back to Bill Maker
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveView('history')}
                className="px-4 py-2.5 bg-white border-2 border-[#1A1A1A] text-black text-xs font-bold uppercase tracking-wider hover:bg-slate-100 transition-colors rounded-none cursor-pointer"
              >
                Invoices Log
              </button>
              <button
                onClick={handlePrint}
                className="px-5 py-2.5 bg-black hover:bg-white hover:text-black border-2 border-black text-white text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1.5 rounded-none cursor-pointer"
              >
                <Printer size={14} /> Print Tax Invoice
              </button>
            </div>
          </div>

          {/* PRINT CANVAS */}
          <div className="bg-white border-2 border-black p-8 text-black font-sans print:border-none print:p-0 rounded-none" id="gst-invoice-print">
            
            {/* Header / Brand Details */}
            <div className="flex justify-between items-start border-b-2 border-black pb-5">
              <div className="space-y-1">
                <span className="text-[9px] font-black text-white bg-black uppercase tracking-widest px-2 py-1 rounded-none inline-block">Tax Invoice</span>
                <h1 className="text-2xl font-black text-[#1A1A1A] leading-tight font-display tracking-tight uppercase mt-2">{businessDetails.name}</h1>
                <p className="text-xs text-slate-500 italic font-bold uppercase tracking-wider">{businessDetails.tagline}</p>
                <p className="text-[10px] text-slate-600 font-medium max-w-md mt-1">{businessDetails.address}</p>
                <p className="text-[10px] text-black font-bold">Phone: {businessDetails.phone} | Email: {businessDetails.email}</p>
              </div>

              <div className="text-right space-y-1 font-mono text-[10px]">
                <div className="p-3 bg-[#F9F9F7] border-2 border-black rounded-none text-left">
                  <p className="text-slate-500 font-sans uppercase font-bold text-[8px] tracking-widest">GSTIN NUMBER</p>
                  <p className="font-black text-black text-xs font-mono">{businessDetails.gstin}</p>
                  <p className="text-[9px] text-slate-500 font-sans mt-0.5 font-bold uppercase tracking-wider">State Code: {businessDetails.stateCode}</p>
                </div>
              </div>
            </div>

            {/* Bill details split */}
            <div className="grid grid-cols-2 gap-4 py-5 border-b-2 border-black">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">BILLED TO (BUYER):</p>
                <p className="font-bold text-[#1A1A1A] text-xs">{activeInvoice.customerName}</p>
                {activeInvoice.customerAddress && <p className="text-[10px] text-slate-500 leading-relaxed font-serif italic">{activeInvoice.customerAddress}</p>}
                {activeInvoice.customerPhone && <p className="text-[10px] text-slate-500">Phone: {activeInvoice.customerPhone}</p>}
                {activeInvoice.customerGstin ? (
                  <p className="text-[10px] font-bold text-black bg-slate-50 border border-black px-2.5 py-0.5 rounded-none inline-block font-mono mt-1">
                    GSTIN: {activeInvoice.customerGstin}
                  </p>
                ) : (
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">UNREGISTERED CONSUMER (B2C)</p>
                )}
              </div>

              <div className="text-right space-y-1 text-xs">
                <div className="inline-block text-left space-y-1 border-l border-black pl-4">
                  <p className="text-slate-500"><strong>Invoice No:</strong> <strong className="text-black font-mono text-sm">{activeInvoice.invoiceNo}</strong></p>
                  <p className="text-slate-500"><strong>Invoice Date:</strong> <strong className="text-slate-800">{activeInvoice.date}</strong></p>
                  <p className="text-slate-500"><strong>Place of Supply:</strong> {activeInvoice.isInterstate ? 'Interstate' : 'Intrastate (Local)'}</p>
                  <p className="text-slate-500"><strong>Payment Mode:</strong> <span className="bg-slate-100 border border-black px-1.5 py-0.5 font-bold text-[9px] text-[#1A1A1A]">{activeInvoice.paymentMode}</span></p>
                </div>
              </div>
            </div>

            {/* Structured Item List with detailed GST breakup */}
            <div className="py-4">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="border-b-2 border-black bg-[#F9F9F7] text-[9px] text-[#1A1A1A] uppercase font-black tracking-wider">
                    <th className="py-3 pl-2">#</th>
                    <th className="py-3">Item Description</th>
                    <th className="py-3 text-center">HSN</th>
                    <th className="py-3 text-right">Qty</th>
                    <th className="py-3 text-right">Rate (₹)</th>
                    <th className="py-3 text-right">Taxable Amt</th>
                    {activeInvoice.isInterstate ? (
                      <>
                        <th className="py-3 text-right">IGST %</th>
                        <th className="py-3 text-right">IGST Amt</th>
                      </>
                    ) : (
                      <>
                        <th className="py-3 text-right">CGST %</th>
                        <th className="py-3 text-right">CGST Amt</th>
                        <th className="py-3 text-right">SGST %</th>
                        <th className="py-3 text-right">SGST Amt</th>
                      </>
                    )}
                    <th className="py-3 pr-2 text-right">Net Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black font-semibold text-black">
                  {activeInvoice.items.map((item, idx) => {
                    const basePrice = item.taxableAmount / item.quantity;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/20">
                        <td className="py-3 pl-2 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-3 font-bold text-black">{item.name}</td>
                        <td className="py-3 text-center font-mono text-[10px] text-slate-500">{item.hsnCode}</td>
                        <td className="py-3 text-right font-mono">{item.quantity}</td>
                        <td className="py-3 text-right font-mono">₹{basePrice.toFixed(2)}</td>
                        <td className="py-3 text-right font-mono">₹{item.taxableAmount.toFixed(2)}</td>
                        {activeInvoice.isInterstate ? (
                          <>
                            <td className="py-3 text-right font-mono">{item.gstPercentage}%</td>
                            <td className="py-3 text-right font-mono">₹{item.gstAmount.toFixed(2)}</td>
                          </>
                        ) : (
                          <>
                            <td className="py-3 text-right font-mono">{item.gstPercentage / 2}%</td>
                            <td className="py-3 text-right font-mono">₹{(item.gstAmount / 2).toFixed(2)}</td>
                            <td className="py-3 text-right font-mono">{item.gstPercentage / 2}%</td>
                            <td className="py-3 text-right font-mono">₹{(item.gstAmount / 2).toFixed(2)}</td>
                          </>
                        )}
                        <td className="py-3 pr-2 text-right font-black font-mono text-black">₹{item.totalAmount.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Calculations Blocks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5 border-t-2 border-black">
              {/* Left Details (Words, bank details) */}
              <div className="space-y-4 text-[10px]">
                <div className="bg-[#F9F9F7] p-3 border border-black rounded-none">
                  <p className="text-slate-500 uppercase font-black text-[8px] tracking-widest mb-1">Amount Chargeable (in Words)</p>
                  <p className="font-bold text-black capitalize font-serif italic text-xs">{numberToWords(activeInvoice.grandTotal)}</p>
                </div>

                {/* Bank nets transfer details */}
                {businessDetails.bankName && (
                  <div className="bg-white p-3 border border-black space-y-1.5 rounded-none">
                    <p className="text-black uppercase font-black text-[8px] tracking-widest flex items-center gap-1">
                      <Landmark size={12} className="text-black" />
                      Remittance / Bank Account Details
                    </p>
                    <div className="grid grid-cols-2 text-slate-600 font-bold leading-relaxed gap-x-3 text-[10px]">
                      <span><strong>Bank:</strong> {businessDetails.bankName}</span>
                      <span><strong>IFSC:</strong> <strong className="font-mono text-black">{businessDetails.bankIfsc}</strong></span>
                      <span className="col-span-2"><strong>Account Number:</strong> <strong className="font-mono text-black underline">{businessDetails.bankAccountNo}</strong></span>
                    </div>
                  </div>
                )}

                {activeInvoice.notes && (
                  <p className="text-[10px] text-slate-400 italic font-serif"><strong>Billing Remarks:</strong> "{activeInvoice.notes}"</p>
                )}
              </div>

              {/* Right Totals summary */}
              <div className="text-right space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-200 pb-1.5 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <span>Total Taxable Value:</span>
                  <span className="text-black font-black font-mono">₹{activeInvoice.subTotal.toFixed(2)}</span>
                </div>

                {activeInvoice.isInterstate ? (
                  <div className="flex justify-between border-b border-slate-200 pb-1.5 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <span>Integrated Tax (IGST):</span>
                    <span className="text-black font-black font-mono">₹{activeInvoice.gstTotal.toFixed(2)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <span>Central Tax (CGST):</span>
                      <span className="text-black font-black font-mono">₹{activeInvoice.cgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-1.5 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <span>State Tax (SGST):</span>
                      <span className="text-black font-black font-mono">₹{activeInvoice.sgst.toFixed(2)}</span>
                    </div>
                  </>
                )}

                {activeInvoice.discount > 0 && (
                  <div className="flex justify-between border-b border-slate-200 pb-1.5 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <span>Discount Allowed:</span>
                    <span className="text-emerald-700 font-black font-mono">- ₹{activeInvoice.discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between pt-1.5 items-baseline">
                  <span className="font-black text-black text-sm uppercase tracking-widest">Grand Net Payable:</span>
                  <span className="font-black text-lg text-black border-b-2 border-double border-black font-mono">
                    ₹{activeInvoice.grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Terms and signature */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 mt-6 border-t-2 border-black text-[9px] text-slate-400 leading-normal">
              <div>
                <p className="font-black text-slate-500 uppercase tracking-widest text-[8px] mb-1">Terms & Conditions:</p>
                <div className="whitespace-pre-line text-slate-500 italic font-medium">
                  {businessDetails.termsAndConditions}
                </div>
              </div>

              <div className="text-right flex flex-col justify-end items-end h-24">
                <p className="text-[10px] font-bold text-slate-700">For {businessDetails.name}</p>
                <div className="flex-1"></div>
                <div className="border-t border-slate-400 w-48 pt-1 mt-4">
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Authorized Signatory</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
