/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Dealer, DealerPayment } from '../types';
import { Plus, Search, Calendar, Landmark, CreditCard, ChevronRight, UserPlus, FileText, ArrowUpRight, ArrowDownLeft, MapPin } from 'lucide-react';

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
  const [paymentType, setPaymentType] = useState<'Debit' | 'Credit'>('Debit'); // Debit = We Paid them, Credit = We bought goods
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
    setSelectedDealerId(newDealer.id); // auto-select

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
          <div className="bg-[#F9F9F7] p-4 border-2 border-[#1A1A1A] rounded-none">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total Outstanding</span>
            <p className="text-base font-black text-red-600 font-mono mt-1">₹{totalOwed.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white p-4 border-2 border-[#1A1A1A] rounded-none">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Advance Deposits</span>
            <p className="text-base font-black text-emerald-700 font-mono mt-1">₹{totalAdvances.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-black" />
            <input
              type="text"
              placeholder="Search supplier / GSTIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border-2 border-[#1A1A1A] text-xs pl-10 pr-4 py-3 focus:outline-none rounded-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
            <div className="flex border-2 border-[#1A1A1A] p-0.5 text-[10px] font-black uppercase tracking-widest bg-white rounded-none">
              {(['All', 'Supplier', 'Vendor'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 rounded-none transition-colors cursor-pointer ${
                    filterType === type ? 'bg-[#1A1A1A] text-white' : 'text-[#1A1A1A] hover:bg-slate-100'
                  }`}
                >
                  {type}s
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setIsDealerFormOpen(true)}
              className="px-4 py-2.5 bg-black hover:bg-white hover:text-black border-2 border-black text-white text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 rounded-none cursor-pointer"
            >
              <UserPlus size={12} />
              Add Dealer
            </button>
          </div>
        </div>

        {/* Dealers Scrollable Cards */}
        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
          {filteredDealers.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-10 border border-dashed border-slate-300">No dealers registered.</p>
          ) : (
            filteredDealers.map(dlr => {
              const isSelected = dlr.id === selectedDealerId;
              return (
                <div
                  key={dlr.id}
                  onClick={() => setSelectedDealerId(dlr.id)}
                  className={`p-4 rounded-none border-2 transition-all cursor-pointer flex justify-between items-center ${
                    isSelected 
                      ? 'bg-[#F9F9F7] border-[#1A1A1A]' 
                      : 'bg-white border-slate-200 hover:border-[#1A1A1A]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#1A1A1A] text-xs">{dlr.name}</span>
                      <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 border border-black bg-[#F9F9F7] text-black">
                        {dlr.type}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">{dlr.contactPerson} • {dlr.phone}</p>
                    {dlr.gstin && <p className="text-[9px] font-mono text-slate-400">GST: {dlr.gstin}</p>}
                  </div>

                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className={`text-xs font-black font-mono ${
                        dlr.balance > 0 
                          ? 'text-red-600' 
                          : dlr.balance < 0 
                            ? 'text-emerald-700' 
                            : 'text-slate-400'
                      }`}>
                        {dlr.balance === 0 
                          ? 'Settled' 
                          : `₹${Math.abs(dlr.balance).toLocaleString('en-IN')}`
                        }
                      </p>
                      <p className="text-[8px] text-slate-400 uppercase tracking-widest font-bold">
                        {dlr.balance > 0 ? 'To Pay' : dlr.balance < 0 ? 'Advance' : 'Balance'}
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-[#1A1A1A]" />
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
          <div className="bg-white border-2 border-[#1A1A1A] rounded-none overflow-hidden flex flex-col min-h-[550px]">
            
            {/* Dealer Detail Header */}
            <div className="p-6 bg-[#F9F9F7] border-b-2 border-[#1A1A1A] flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
              <div className="space-y-1.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Selected Ledger Account</span>
                <h3 className="font-black text-[#1A1A1A] text-lg font-display italic">{selectedDealer.name}</h3>
                <div className="text-xs text-slate-600 space-y-0.5">
                  <p><strong>Contact Person:</strong> {selectedDealer.contactPerson}</p>
                  <p><strong>Phone:</strong> {selectedDealer.phone} {selectedDealer.email && `• ${selectedDealer.email}`}</p>
                  {selectedDealer.gstin && <p className="font-mono text-[10px]"><strong>GSTIN:</strong> {selectedDealer.gstin}</p>}
                </div>
                {selectedDealer.address && (
                  <p className="text-[10px] text-slate-400 mt-1 flex items-start gap-1">
                    <MapPin size={12} className="shrink-0 mt-0.5 text-slate-400" />
                    <span>{selectedDealer.address}</span>
                  </p>
                )}
              </div>

              <div className="text-left md:text-right shrink-0 bg-white p-4 border border-black rounded-none">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Outstanding Due</div>
                <div className={`text-2xl font-black font-mono mt-0.5 ${selectedDealer.balance > 0 ? 'text-red-600' : selectedDealer.balance < 0 ? 'text-emerald-700' : 'text-[#1A1A1A]'}`}>
                  ₹{Math.abs(selectedDealer.balance).toLocaleString('en-IN')}
                </div>
                <div className="text-[9px] text-[#1A1A1A] uppercase font-bold tracking-wider mt-1">
                  {selectedDealer.balance > 0 ? 'OUTSTANDING DEBIT' : selectedDealer.balance < 0 ? 'CREDIT ADVANCE' : 'ACCOUNT BALANCE NIL'}
                </div>
              </div>
            </div>

            {/* Ledger Action Toolbar */}
            <div className="px-6 py-4 border-b border-[#1A1A1A] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white">
              <span className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-widest">Chronological Cash & Purchase Ledger</span>
              <button
                onClick={() => setIsPaymentFormOpen(true)}
                className="px-4 py-2 bg-black hover:bg-white hover:text-black border-2 border-black text-white font-black uppercase tracking-widest text-[10px] transition-colors flex items-center gap-1.5 rounded-none cursor-pointer"
              >
                <Plus size={12} />
                Log Payment or Purchase
              </button>
            </div>

            {/* Payments Scrollable List */}
            <div className="flex-1 overflow-y-auto p-6">
              {selectedDealerHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 text-slate-400">
                  <FileText size={36} className="mb-2 text-slate-400" />
                  <p className="text-xs font-bold uppercase text-[#1A1A1A] tracking-wider">No history found</p>
                  <p className="text-[10px] text-slate-500 mt-1 max-w-xs">No historical statements are registered yet. Create a transaction log above to activate this dealer's balance ledger.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedDealerHistory.map(pay => {
                    const isWePaid = pay.type === 'Debit';
                    return (
                      <div
                        key={pay.id}
                        className={`p-4 rounded-none border transition-all flex items-center justify-between ${
                          isWePaid 
                            ? 'border-emerald-600 bg-emerald-50/10' 
                            : 'border-red-600 bg-red-50/10'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-none border flex items-center justify-center shrink-0 ${
                            isWePaid ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-red-600 bg-red-50 text-red-800'
                          }`}>
                            {isWePaid ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                          </div>

                          <div>
                            <div className="flex items-center flex-wrap gap-2">
                              <span className="font-bold text-[#1A1A1A] text-xs">
                                {isWePaid ? 'Cash Paid to Supplier (Debit)' : 'Materials Purchased (Credit Liability)'}
                              </span>
                              <span className="text-[9px] bg-white border border-[#1A1A1A] text-[#1A1A1A] font-black uppercase tracking-wider px-2 py-0.5 rounded-none font-mono">
                                {pay.paymentMode}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar size={11} />
                                {pay.date}
                              </span>
                              {pay.referenceNo && <span>• Ref: <strong className="text-[#1A1A1A] font-mono">{pay.referenceNo}</strong></span>}
                            </div>
                            {pay.notes && <p className="text-[10px] text-slate-500 italic mt-1.5 font-serif">"{pay.notes}"</p>}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className={`text-sm font-black font-mono ${isWePaid ? 'text-emerald-700' : 'text-red-700'}`}>
                            {isWePaid ? '−' : '+'} ₹{pay.amount.toLocaleString('en-IN')}
                          </p>
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                            {isWePaid ? 'Liability Reduced' : 'Liability Logged'}
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
          <div className="bg-white border-2 border-dashed border-[#1A1A1A] p-12 flex flex-col items-center justify-center text-center text-slate-400 min-h-[550px]">
            <Landmark size={44} className="mb-3 text-[#1A1A1A]" />
            <h4 className="font-black uppercase tracking-widest text-[#1A1A1A] text-xs">No Account Selected</h4>
            <p className="text-xs max-w-sm mt-2 leading-relaxed">Select a registered supplier or vendor client from the directory sidebar to review payments, record bills, issue clearances, and fetch active GST ledgers.</p>
          </div>
        )}
      </div>

      {/* MODAL 1: Add Dealer Form */}
      {isDealerFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-40">
          <div className="bg-white border-2 border-[#1A1A1A] rounded-none max-w-md w-full overflow-hidden shadow-none">
            <div className="px-6 py-5 bg-[#F9F9F7] border-b-2 border-[#1A1A1A] flex justify-between items-center">
              <h3 className="font-black uppercase tracking-widest text-[#1A1A1A] text-xs font-display italic">Add New Vendor / Supplier</h3>
              <button onClick={() => setIsDealerFormOpen(false)} className="text-black hover:opacity-70 font-black cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleAddDealer} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] mb-1.5">Dealer Business Name *</label>
                <input
                  type="text"
                  required
                  value={dealerName}
                  onChange={(e) => setDealerName(e.target.value)}
                  className="w-full bg-white border border-[#1A1A1A] p-3 text-xs focus:ring-1 focus:ring-black focus:outline-none"
                  placeholder="e.g. Supreme Electricals Ltd."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] mb-1.5">Contact Person Name</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full bg-white border border-[#1A1A1A] p-3 text-xs focus:ring-1 focus:ring-black focus:outline-none"
                    placeholder="e.g. Mr. Shah"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] mb-1.5">Primary Phone *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white border border-[#1A1A1A] p-3 text-xs focus:ring-1 focus:ring-black focus:outline-none"
                    placeholder="e.g. +91 99880 12345"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] mb-1.5">Dealer Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-[#1A1A1A] p-3 text-xs focus:ring-1 focus:ring-black focus:outline-none"
                    placeholder="e.g. billing@supreme.com"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] mb-1.5">GSTIN Number</label>
                  <input
                    type="text"
                    maxLength={15}
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="w-full bg-white border border-[#1A1A1A] p-3 text-xs font-mono focus:ring-1 focus:ring-black focus:outline-none"
                    placeholder="e.g. 27AAACS1234F1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] mb-1.5">Classification</label>
                  <select
                    value={dealerType}
                    onChange={(e) => setDealerType(e.target.value as any)}
                    className="w-full bg-white border border-[#1A1A1A] p-3 text-xs focus:ring-1 focus:ring-black focus:outline-none font-bold"
                  >
                    <option value="Supplier">Supplier (Goods Provider)</option>
                    <option value="Vendor">Vendor (Wholesale Buyer)</option>
                    <option value="Both">Both Supplier & Vendor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] mb-1.5">Initial Balance (₹)</label>
                  <input
                    type="number"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-[#1A1A1A] p-3 text-xs focus:ring-1 focus:ring-black focus:outline-none font-bold"
                    placeholder="We owe them (+)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] mb-1.5">Dealer Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full bg-white border border-[#1A1A1A] p-3 text-xs focus:ring-1 focus:ring-black focus:outline-none resize-none"
                  placeholder="Billing address of the dealer..."
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDealerFormOpen(false)}
                  className="px-5 py-3 border-2 border-slate-300 text-slate-700 text-xs font-bold uppercase tracking-widest hover:bg-slate-100 transition-colors rounded-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-3 bg-[#1A1A1A] hover:bg-white hover:text-black border-2 border-[#1A1A1A] text-white text-xs font-black uppercase tracking-widest transition-colors rounded-none cursor-pointer"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-40">
          <div className="bg-white border-2 border-[#1A1A1A] rounded-none max-w-sm w-full overflow-hidden shadow-none">
            <div className="px-6 py-5 bg-[#F9F9F7] border-b-2 border-[#1A1A1A] flex justify-between items-center">
              <h3 className="font-black uppercase tracking-widest text-xs text-[#1A1A1A] font-display italic">Log Transaction Ledger</h3>
              <button onClick={() => setIsPaymentFormOpen(false)} className="text-black hover:opacity-75 font-black cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleLogPayment} className="p-6 space-y-5">
              
              <div className="flex border-2 border-black p-0.5 text-xs font-black uppercase tracking-widest bg-white rounded-none">
                <button
                  type="button"
                  onClick={() => setPaymentType('Debit')}
                  className={`flex-1 py-2 rounded-none transition-colors text-center cursor-pointer ${
                    paymentType === 'Debit' ? 'bg-[#1A1A1A] text-white' : 'text-[#1A1A1A] hover:bg-slate-100'
                  }`}
                >
                  We Paid Them
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType('Credit')}
                  className={`flex-1 py-2 rounded-none transition-colors text-center cursor-pointer ${
                    paymentType === 'Credit' ? 'bg-red-600 text-white' : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  We Purchased
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-white border border-[#1A1A1A] p-2.5 text-xs focus:ring-1 focus:ring-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    min={0.01}
                    step="0.01"
                    required
                    value={payAmount || ''}
                    onChange={(e) => setPayAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-white border border-[#1A1A1A] p-2.5 text-xs focus:ring-1 focus:ring-black focus:outline-none font-bold font-mono"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] mb-1">Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full bg-white border border-[#1A1A1A] p-2.5 text-xs focus:ring-1 focus:ring-black focus:outline-none font-bold"
                  >
                    <option value="UPI">UPI Payment</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash Ledger</option>
                    <option value="Cheque">Cheque Draft</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] mb-1">Reference No.</label>
                  <input
                    type="text"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    className="w-full bg-white border border-[#1A1A1A] p-2.5 text-xs focus:ring-1 focus:ring-black focus:outline-none font-mono"
                    placeholder="TXN ID / Ref"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] mb-1">Notes / Item list</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white border border-[#1A1A1A] p-2.5 text-xs focus:ring-1 focus:ring-black focus:outline-none"
                  placeholder="e.g. Copper delivery ledger clearance"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPaymentFormOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold uppercase tracking-widest hover:bg-slate-100 rounded-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1A1A1A] hover:bg-white hover:text-[#1A1A1A] border border-black text-white text-xs font-black uppercase tracking-widest rounded-none cursor-pointer"
                >
                  Log Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
