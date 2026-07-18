/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Dealer, DealerPayment } from '../types';
import { Plus, Search, Calendar, Landmark, CreditCard, ChevronRight, UserPlus, FileText, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface DealerManagerProps {
  dealers: Dealer[];
  dealerPayments: DealerPayment[];
  onUpdateDealers: (newDealers: Dealer[]) => void;
  onUpdatePayments: (newPayments: DealerPayment[]) => void;
}

export default function DealerManager({
  dealers,
  dealerPayments,
  onUpdateDealers,
  onUpdatePayments,
}: DealerManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Supplier' | 'Vendor'>('All');
  const [selectedDealerId, setSelectedDealerId] = useState<string | null>(null);
  
  // Modals / Forms
  const [isDealerFormOpen, setIsDealerFormOpen] = useState(false);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);

  // Dealer Form State
  const [dealerName, setDealerName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [dealerType, setDealerType] = useState<'Supplier' | 'Vendor' | 'Both'>('Supplier');
  const [initialBalance, setInitialBalance] = useState(0);

  // Payment Form State
  const [payAmount, setPayAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque'>('UPI');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentType, setPaymentType] = useState<'Debit' | 'Credit'>('Debit'); // Debit = We Paid them (reduces our due), Credit = We purchased goods (increases due)
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));

  const filteredDealers = dealers.filter(dlr => {
    const matchesSearch = dlr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          dlr.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (dlr.gstin && dlr.gstin.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'All' || dlr.type === filterType || dlr.type === 'Both';
    return matchesSearch && matchesType;
  });

  const selectedDealer = dealers.find(d => d.id === selectedDealerId);
  const selectedDealerHistory = dealerPayments.filter(p => p.dealerId === selectedDealerId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleAddDealer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealerName.trim()) return;

    const newDealer: Dealer = {
      id: `dealer-${Date.now()}`,
      name: dealerName,
      contactPerson,
      phone,
      email,
      gstin,
      address,
      type: dealerType,
      balance: initialBalance,
    };

    onUpdateDealers([...dealers, newDealer]);
    setIsDealerFormOpen(false);
    setSelectedDealerId(newDealer.id); // auto-select newly added dealer

    // reset fields
    setDealerName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setGstin('');
    setAddress('');
    setDealerType('Supplier');
    setInitialBalance(0);
  };

  const handleLogPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDealerId || payAmount <= 0) return;

    const newPayment: DealerPayment = {
      id: `pay-${Date.now()}`,
      dealerId: selectedDealerId,
      date: paymentDate,
      amount: payAmount,
      paymentMode,
      referenceNo,
      notes,
      type: paymentType
    };

    onUpdatePayments([...dealerPayments, newPayment]);

    // Update dealer outstanding balance
    // Positive balance means we owe them money.
    // If we make a payment (Debit), we owe them less -> reduce balance.
    // If we purchase from them / they give credit (Credit), we owe them more -> increase balance.
    const updatedDealers = dealers.map(dlr => {
      if (dlr.id === selectedDealerId) {
        const balanceChange = paymentType === 'Debit' ? -payAmount : payAmount;
        return {
          ...dlr,
          balance: dlr.balance + balanceChange
        };
      }
      return dlr;
    });
    onUpdateDealers(updatedDealers);

    // reset form
    setPayAmount(0);
    setReferenceNo('');
    setNotes('');
    setPaymentType('Debit');
    setIsPaymentFormOpen(false);
  };

  const totalOwed = dealers.reduce((sum, d) => d.balance > 0 ? sum + d.balance : sum, 0);
  const totalAdvances = dealers.reduce((sum, d) => d.balance < 0 ? sum + Math.abs(d.balance) : sum, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dealer-manager-container">
      
      {/* LEFT COLUMN: Dealers List */}
      <div className="lg:col-span-1 space-y-4">
        
        {/* Statistics panel */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total Outstanding</span>
            <p className="text-sm font-bold text-red-600 mt-0.5">₹{totalOwed.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Advance Deposits</span>
            <p className="text-sm font-bold text-emerald-600 mt-0.5">₹{totalAdvances.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search supplier/GSTIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 text-xs rounded-lg pl-8 pr-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 justify-between items-center">
            <div className="flex bg-slate-100 rounded-md p-0.5 text-[10px] font-medium text-slate-600">
              {(['All', 'Supplier', 'Vendor'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-2.5 py-1 rounded-sm transition-colors ${
                    filterType === type ? 'bg-white text-slate-800 shadow-3xs' : 'hover:text-slate-900'
                  }`}
                >
                  {type}s
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setIsDealerFormOpen(true)}
              className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[10px] font-semibold transition-colors flex items-center gap-1 shrink-0"
            >
              <UserPlus size={11} />
              Add Dealer
            </button>
          </div>
        </div>

        {/* Dealers Scrollable Cards */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {filteredDealers.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-6">No dealers found.</p>
          ) : (
            filteredDealers.map(dlr => {
              const isSelected = dlr.id === selectedDealerId;
              return (
                <div
                  key={dlr.id}
                  onClick={() => setSelectedDealerId(dlr.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer flex justify-between items-center ${
                    isSelected 
                      ? 'bg-blue-50/50 border-blue-300 ring-1 ring-blue-100' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800 text-xs">{dlr.name}</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-sm ${
                        dlr.type === 'Supplier' 
                          ? 'bg-blue-100 text-blue-800' 
                          : dlr.type === 'Vendor' 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-purple-100 text-purple-800'
                      }`}>
                        {dlr.type}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">{dlr.contactPerson} • {dlr.phone}</p>
                    {dlr.gstin && <p className="text-[9px] font-mono text-slate-500">GST: {dlr.gstin}</p>}
                  </div>

                  <div className="text-right flex items-center gap-2">
                    <div>
                      <p className={`text-xs font-bold ${
                        dlr.balance > 0 
                          ? 'text-red-600' 
                          : dlr.balance < 0 
                            ? 'text-emerald-600' 
                            : 'text-slate-400'
                      }`}>
                        {dlr.balance === 0 
                          ? 'Settled' 
                          : `₹${Math.abs(dlr.balance).toLocaleString('en-IN')}`
                        }
                      </p>
                      <p className="text-[8px] text-slate-400 uppercase tracking-wide">
                        {dlr.balance > 0 ? 'To Pay' : dlr.balance < 0 ? 'Advance' : 'Balance'}
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-slate-300" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Ledger Book & Payment History */}
      <div className="lg:col-span-2 space-y-4">
        {selectedDealer ? (
          <div className="bg-white rounded-xl shadow-2xs border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
            
            {/* Dealer Detail Header */}
            <div className="p-5 bg-slate-50 border-b border-slate-150 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-base">{selectedDealer.name}</h3>
                <p className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                  <span><strong>Contact:</strong> {selectedDealer.contactPerson}</span>
                  <span><strong>Phone:</strong> {selectedDealer.phone}</span>
                  {selectedDealer.email && <span><strong>Email:</strong> {selectedDealer.email}</span>}
                </p>
                {selectedDealer.address && (
                  <p className="text-[10px] text-slate-400"><strong>Address:</strong> {selectedDealer.address}</p>
                )}
              </div>

              <div className="text-right shrink-0">
                <div className="text-xs text-slate-400">Current Outstanding Balance</div>
                <div className={`text-xl font-black ${selectedDealer.balance > 0 ? 'text-red-600' : selectedDealer.balance < 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                  ₹{Math.abs(selectedDealer.balance).toLocaleString('en-IN')}
                </div>
                <div className="text-[9px] text-slate-400 uppercase font-semibold">
                  {selectedDealer.balance > 0 ? 'Outstandings (Debit Due)' : selectedDealer.balance < 0 ? 'Advance Paid (Credit)' : 'Account Settled'}
                </div>
              </div>
            </div>

            {/* Ledger Action Toolbar */}
            <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Account Payment & Purchase Ledger</span>
              <button
                onClick={() => setIsPaymentFormOpen(true)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition-colors flex items-center gap-1"
              >
                <Plus size={12} />
                Log Payment/Credit
              </button>
            </div>

            {/* Payments Scrollable List */}
            <div className="flex-1 overflow-y-auto p-5">
              {selectedDealerHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                  <FileText size={40} className="mb-2 text-slate-300" />
                  <p className="text-xs">No historical transactions logged with this dealer.</p>
                  <p className="text-[10px] text-slate-400 mt-1">Record a payment or purchase credit above to populate the ledger.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDealerHistory.map(pay => {
                    const isWePaid = pay.type === 'Debit';
                    return (
                      <div
                        key={pay.id}
                        className={`p-3 rounded-lg border transition-all flex items-center justify-between ${
                          isWePaid 
                            ? 'border-emerald-100 bg-emerald-50/30' 
                            : 'border-red-100 bg-red-50/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            isWePaid ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {isWePaid ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-800 text-xs">
                                {isWePaid ? 'Paid to Dealer (Cashout)' : 'Goods Purchased / Credit'}
                              </span>
                              <span className="text-[9px] bg-white border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-mono font-medium">
                                {pay.paymentMode}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="flex items-center gap-0.5">
                                <Calendar size={10} />
                                {pay.date}
                              </span>
                              {pay.referenceNo && <span>• Ref: <strong className="text-slate-500 font-mono">{pay.referenceNo}</strong></span>}
                            </div>
                            {pay.notes && <p className="text-[10px] text-slate-500 italic mt-1">"{pay.notes}"</p>}
                          </div>
                        </div>

                        <div className="text-right">
                          <p className={`text-sm font-bold ${isWePaid ? 'text-emerald-700' : 'text-red-700'}`}>
                            {isWePaid ? '-' : '+'} ₹{pay.amount.toLocaleString('en-IN')}
                          </p>
                          <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">
                            {isWePaid ? 'Outstanding Reduced' : 'Outstanding Added'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-2xs border border-slate-200 p-8 flex flex-col items-center justify-center text-center text-slate-400 min-h-[500px]">
            <Landmark size={48} className="mb-3 text-slate-300" />
            <h4 className="font-semibold text-slate-700 text-sm">No Dealer Selected</h4>
            <p className="text-xs max-w-sm mt-1">Select a dealer from the list on the left to review billing histories, payments, advances, and manage account ledger balances.</p>
          </div>
        )}
      </div>

      {/* MODAL 1: Add Dealer Form */}
      {isDealerFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 text-sm">Add New Vendor / Supplier</h3>
              <button onClick={() => setIsDealerFormOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-medium">✕</button>
            </div>
            <form onSubmit={handleAddDealer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Dealer Business Name *</label>
                <input
                  type="text"
                  required
                  value={dealerName}
                  onChange={(e) => setDealerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. Supreme Electricals Ltd."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Contact Person Name</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g. Mr. Shah"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Primary Phone *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g. +91 99880 12345"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Dealer Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g. billing@supreme.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    maxLength={15}
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-lg p-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g. 27AAACS1234F1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Dealer Classification</label>
                  <select
                    value={dealerType}
                    onChange={(e) => setDealerType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Supplier">Supplier (Goods Provider)</option>
                    <option value="Vendor">Vendor (Wholesale Buyer)</option>
                    <option value="Both">Both Supplier & Vendor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Initial Balance (₹)</label>
                  <input
                    type="number"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    placeholder="Positive if we owe them"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Dealer Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 resize-none"
                  placeholder="Billing address of the dealer..."
                />
              </div>

              <div className="px-6 py-4 -mx-6 -mb-6 bg-slate-50 border-t border-slate-150 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDealerFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Save Dealer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Log Payment / Ledger Entry Form */}
      {isPaymentFormOpen && selectedDealer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 text-sm">Log Transaction: {selectedDealer.name}</h3>
              <button onClick={() => setIsPaymentFormOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-medium">✕</button>
            </div>
            <form onSubmit={handleLogPayment} className="p-6 space-y-4">
              
              <div className="flex bg-slate-100 rounded-lg p-1 text-xs font-bold text-slate-600">
                <button
                  type="button"
                  onClick={() => setPaymentType('Debit')}
                  className={`flex-1 py-2 rounded-md transition-colors text-center ${
                    paymentType === 'Debit' ? 'bg-emerald-600 text-white shadow-sm' : 'hover:text-slate-900'
                  }`}
                >
                  We Paid Them (Debit)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType('Credit')}
                  className={`flex-1 py-2 rounded-md transition-colors text-center ${
                    paymentType === 'Credit' ? 'bg-red-600 text-white shadow-sm' : 'hover:text-slate-900'
                  }`}
                >
                  We Bought Goods (Credit)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Transaction Date</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Transaction Amount (₹) *</label>
                  <input
                    type="number"
                    min={0.01}
                    step="0.01"
                    required
                    value={payAmount || ''}
                    onChange={(e) => setPayAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    placeholder="₹ 0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="UPI">UPI (GPay/PhonePe)</option>
                    <option value="Bank Transfer">Bank NetBanking</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Ref / Cheque No.</label>
                  <input
                    type="text"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    placeholder="TXN ID or Cheque #"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Reference Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. Order #221 delivery"
                />
              </div>

              <div className="px-6 py-4 -mx-6 -mb-6 bg-slate-50 border-t border-slate-150 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Log Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
