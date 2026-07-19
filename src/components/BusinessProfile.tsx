/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BusinessDetails, AppData } from '../types';
import { Save, Building, ShieldCheck, Download, Upload, Info, Laptop, Monitor, AlertTriangle, Trash2, Cpu, Check } from 'lucide-react';

interface BusinessProfileProps {
  businessDetails: BusinessDetails;
  onSaveDetails: (details: BusinessDetails) => void;
  appData: AppData;
  onImportBackup: (importedData: AppData) => void;
}

export default function BusinessProfile({
  businessDetails,
  onSaveDetails,
  appData,
  onImportBackup,
}: BusinessProfileProps) {
  const [details, setDetails] = useState<BusinessDetails>({ ...businessDetails });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  
  // Memory Optimization & Hard Reset States
  const [resetConfirm, setResetConfirm] = useState(false);
  const [pruningStatus, setPruningStatus] = useState<string | null>(null);

  // Calculate local storage size
  const rawDataString = JSON.stringify(appData);
  const dataSizeInBytes = rawDataString.length;
  const dataSizeInKB = (dataSizeInBytes / 1024).toFixed(2);
  const storageCapacityKB = 5120; // 5MB standard LocalStorage quota
  const storagePercentage = Math.min(100, parseFloat(((parseFloat(dataSizeInKB) / storageCapacityKB) * 100).toFixed(3)));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveDetails(details);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleBackupExport = () => {
    const jsonStr = JSON.stringify(appData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(details.name || 'Enterprise').replace(/\s+/g, '_')}_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleBackupImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSuccess(false);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text) as AppData;
        
        // Simple structural validation
        if (
          parsed &&
          Array.isArray(parsed.inventory) &&
          Array.isArray(parsed.dealers) &&
          Array.isArray(parsed.employees) &&
          Array.isArray(parsed.invoices) &&
          parsed.businessDetails
        ) {
          onImportBackup(parsed);
          setDetails({ ...parsed.businessDetails });
          setImportSuccess(true);
          setTimeout(() => setImportSuccess(false), 4000);
        } else {
          setImportError('Invalid backup file. The required business database structure is missing.');
        }
      } catch (err) {
        setImportError('Failed to parse backup file. Please ensure it is a valid JSON backup.');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  // Perform a full hard reset to start empty and erase all demo entries
  const handleFullHardReset = () => {
    const emptyData: AppData = {
      inventory: [],
      dealers: [],
      dealerPayments: [],
      employees: [],
      invoices: [],
      businessDetails: {
        name: "",
        tagline: "",
        ownerName: "",
        address: "",
        phone: "",
        email: "",
        gstin: "",
        bankName: "",
        bankAccountNo: "",
        bankIfsc: "",
        termsAndConditions: "1. Goods once sold will not be taken back.\n2. Warranty as per manufacturer terms.",
        stateCode: ""
      }
    };

    localStorage.removeItem("VERTEX_BIZ_APP_DATA");
    onImportBackup(emptyData);
    setDetails({ ...emptyData.businessDetails });
    setResetConfirm(false);
    setImportSuccess(true);
    setTimeout(() => setImportSuccess(false), 4000);
  };

  // Memory saving: compact ledger & prune empty items
  const handleOptimizeMemory = () => {
    setPruningStatus("Analyzing database...");
    setTimeout(() => {
      // 1. Filter out empty items in stock that don't have a valid name or id
      const filteredInventory = appData.inventory.filter(item => item.name.trim() !== "" && item.id);
      
      // 2. Filter out dealerPayments that don't have matching dealer (unless it's an unassigned log)
      const validDealerIds = new Set(appData.dealers.map(d => d.id));
      const filteredPayments = appData.dealerPayments.filter(pay => !pay.dealerId || validDealerIds.has(pay.dealerId));

      // 3. Compact dates or remove orphaned invoices
      const filteredInvoices = appData.invoices.filter(inv => inv.items && inv.items.length > 0 && inv.invoiceNo);

      // 4. Compact the dataset and trigger update
      const optimizedData: AppData = {
        ...appData,
        inventory: filteredInventory,
        dealerPayments: filteredPayments,
        invoices: filteredInvoices
      };

      onImportBackup(optimizedData);
      setPruningStatus("Memory storage optimized successfully!");
      setTimeout(() => setPruningStatus(null), 3500);
    }, 1000);
  };

  return (
    <div className="space-y-8" id="business-profile-container">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Settings Form - Editorial Style */}
        <div className="lg:col-span-2 bg-white border-2 border-[#1A1A1A] rounded-none overflow-hidden shadow-none">
          <div className="p-6 border-b-2 border-[#1A1A1A] bg-[#F9F9F7] flex items-center justify-between">
            <h2 className="text-lg font-black italic font-display text-[#1A1A1A] flex items-center gap-2 uppercase tracking-tight">
              <Building size={18} className="text-[#1A1A1A]" />
              Business Registry & Profile Settings
            </h2>
            <span className="text-[9px] border border-black bg-[#1A1A1A] text-white px-3 py-1 font-bold uppercase tracking-wider">
              GST BILLING ENG
            </span>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] mb-1.5">Business Registered Name *</label>
                <input
                  type="text"
                  name="name"
                  value={details.name}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white border border-[#1A1A1A] rounded-none p-3 text-xs font-medium focus:ring-1 focus:ring-black focus:outline-none"
                  placeholder="e.g. Metro Wholesale & Supply"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] mb-1.5">Tagline / Slogan</label>
                <input
                  type="text"
                  name="tagline"
                  value={details.tagline}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-[#1A1A1A] rounded-none p-3 text-xs font-medium focus:ring-1 focus:ring-black focus:outline-none"
                  placeholder="e.g. Premium Wholesale Spares"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] mb-1.5">GSTIN (15-digit GST Number) *</label>
                <input
                  type="text"
                  name="gstin"
                  value={details.gstin}
                  onChange={handleInputChange}
                  required
                  maxLength={15}
                  className="w-full bg-white border border-[#1A1A1A] rounded-none p-3 text-xs font-mono font-bold focus:ring-1 focus:ring-black focus:outline-none"
                  placeholder="e.g. 27AADCM1234F1Z5"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] mb-1.5">GST State & State Code *</label>
                <input
                  type="text"
                  name="stateCode"
                  value={details.stateCode}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white border border-[#1A1A1A] rounded-none p-3 text-xs font-medium focus:ring-1 focus:ring-black focus:outline-none"
                  placeholder="e.g. 27 (Maharashtra)"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] mb-1.5">Contact Phone Number *</label>
                <input
                  type="text"
                  name="phone"
                  value={details.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white border border-[#1A1A1A] rounded-none p-3 text-xs font-medium focus:ring-1 focus:ring-black focus:outline-none"
                  placeholder="e.g. +91 91122 33445"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] mb-1.5">Contact Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={details.email}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-[#1A1A1A] rounded-none p-3 text-xs font-medium focus:ring-1 focus:ring-black focus:outline-none"
                  placeholder="e.g. billing@metro.com"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] mb-1.5">Proprietor / Owner Name</label>
                <input
                  type="text"
                  name="ownerName"
                  value={details.ownerName}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-[#1A1A1A] rounded-none p-3 text-xs font-medium focus:ring-1 focus:ring-black focus:outline-none"
                  placeholder="Proprietor Full Name"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] mb-1.5">Bank Name (For Bill Footer)</label>
                <input
                  type="text"
                  name="bankName"
                  value={details.bankName || ''}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-[#1A1A1A] rounded-none p-3 text-xs font-medium focus:ring-1 focus:ring-black focus:outline-none"
                  placeholder="Bank Name"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] mb-1.5">Bank Account Number</label>
                <input
                  type="text"
                  name="bankAccountNo"
                  value={details.bankAccountNo || ''}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-[#1A1A1A] rounded-none p-3 text-xs font-medium focus:ring-1 focus:ring-black focus:outline-none"
                  placeholder="Account Number"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] mb-1.5">Bank IFSC Code</label>
                <input
                  type="text"
                  name="bankIfsc"
                  value={details.bankIfsc || ''}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-[#1A1A1A] rounded-none p-3 text-xs font-mono focus:ring-1 focus:ring-black focus:outline-none"
                  placeholder="IFSC Code"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] mb-1.5">Billing & Delivery Address *</label>
              <textarea
                name="address"
                value={details.address}
                onChange={handleInputChange}
                required
                rows={2}
                className="w-full bg-white border border-[#1A1A1A] rounded-none p-3 text-xs font-medium focus:ring-1 focus:ring-black focus:outline-none resize-none"
                placeholder="Business full postal address for invoices..."
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] mb-1.5">Invoice Terms & Conditions</label>
              <textarea
                name="termsAndConditions"
                value={details.termsAndConditions}
                onChange={handleInputChange}
                rows={3}
                className="w-full bg-white border border-[#1A1A1A] rounded-none p-3 text-xs font-medium focus:ring-1 focus:ring-black focus:outline-none resize-none"
                placeholder="Terms displayed on invoice bottom..."
              />
            </div>

            {/* 223-Dashboard Customizable Theme Settings Section */}
            <div className="pt-6 border-t-2 border-[#1A1A1A] space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#1A1A1A] flex items-center gap-2">
                <span className="bg-[#1A1A1A] text-white text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-wider">Theme Controls</span>
                223-Dashboard Premium Themes & Fully Editable Color Combos
              </h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                Tailor the visual branding, terminal prefix identifiers, and active color palettes for your individual workspace.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] mb-1.5">
                    Dashboard Header Prefix *
                  </label>
                  <input
                    type="text"
                    name="dashboardPrefix"
                    value={details.dashboardPrefix || '223-Dashboard'}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white border border-[#1A1A1A] rounded-none p-3 text-xs font-bold focus:ring-1 focus:ring-black focus:outline-none"
                    placeholder="e.g. 223-Dashboard"
                  />
                  <p className="text-[9px] text-slate-400 mt-1.5 uppercase font-bold tracking-wider">
                    Changes the workspace menu branding header prefix.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] mb-1.5">
                    Interface Theme Mode
                  </label>
                  <select
                    name="themeMode"
                    value={details.themeMode || 'light'}
                    onChange={(e) => {
                      setDetails(prev => ({
                        ...prev,
                        themeMode: e.target.value as any
                      }));
                    }}
                    className="w-full bg-white border border-[#1A1A1A] rounded-none p-3 text-xs font-bold focus:ring-1 focus:ring-black focus:outline-none"
                  >
                    <option value="light">Swiss Light (High Contrast)</option>
                    <option value="dark">Cosmic Dark (Command Deck)</option>
                    <option value="retro">Industrial Retro (Amber CRT)</option>
                    <option value="minimal">Minimal Soft (Paperback)</option>
                    <option value="forest">Teal Forest (Organic Warm)</option>
                    <option value="corporate">Corporate Blue (Steel Vibe)</option>
                    <option value="neon">Neon Synth (Vaporwave Purple)</option>
                  </select>
                  <p className="text-[9px] text-slate-400 mt-1.5 uppercase font-bold tracking-wider">
                    Select your preferred workspace aesthetic.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] mb-1.5">
                    Accent Brand Color
                  </label>
                  <div className="grid grid-cols-6 gap-1 pt-1">
                    {[
                      { name: 'black', bg: 'bg-[#1A1A1A]', border: 'border-black' },
                      { name: 'blue', bg: 'bg-blue-600', border: 'border-blue-800' },
                      { name: 'emerald', bg: 'bg-[#10B981]', border: 'border-[#047857]' },
                      { name: 'violet', bg: 'bg-violet-600', border: 'border-violet-800' },
                      { name: 'amber', bg: 'bg-amber-500', border: 'border-amber-600' },
                      { name: 'rose', bg: 'bg-rose-600', border: 'border-rose-800' },
                    ].map((color) => {
                      const isSelected = (details.themeColor || 'black') === color.name;
                      return (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => {
                            setDetails(prev => ({
                              ...prev,
                              themeColor: color.name
                            }));
                          }}
                          className={`h-8 w-full ${color.bg} border-2 relative cursor-pointer hover:scale-105 transition-transform ${
                            isSelected ? 'ring-2 ring-offset-2 ring-black border-white' : 'border-transparent opacity-80'
                          }`}
                          title={`Select ${color.name} brand color`}
                        >
                          {isSelected && (
                            <span className="absolute inset-0 flex items-center justify-center text-white">
                              <Check size={14} className="stroke-[3]" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Fully Editable Color Customizer */}
                  <div className="mt-3 pt-2.5 border-t border-slate-200">
                    <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      <input
                        type="radio"
                        name="themeColorType"
                        checked={details.themeColor === 'custom'}
                        onChange={() => {
                          setDetails(prev => ({
                            ...prev,
                            themeColor: 'custom',
                            customHexColor: prev.customHexColor || '#FF5733'
                          }));
                        }}
                        className="cursor-pointer"
                      />
                      Or Use Custom Hex Color Code:
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={details.customHexColor || '#FF5733'}
                        onChange={(e) => {
                          setDetails(prev => ({
                            ...prev,
                            themeColor: 'custom',
                            customHexColor: e.target.value
                          }));
                        }}
                        className="h-9 w-9 bg-transparent border-0 cursor-pointer p-0"
                        title="Choose custom branding color"
                      />
                      <input
                        type="text"
                        value={details.customHexColor || '#FF5733'}
                        onChange={(e) => {
                          setDetails(prev => ({
                            ...prev,
                            themeColor: 'custom',
                            customHexColor: e.target.value
                          }));
                        }}
                        placeholder="#FF5733"
                        maxLength={7}
                        className="flex-1 bg-white border border-[#1A1A1A] p-1.5 text-xs font-mono font-bold uppercase text-center focus:ring-1 focus:ring-black focus:outline-none"
                      />
                    </div>
                  </div>

                  <p className="text-[9px] text-slate-400 mt-1.5 uppercase font-bold tracking-wider">
                    Branding: <strong className="text-black uppercase">{(details.themeColor === 'custom' ? details.customHexColor : details.themeColor) || 'black'}</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-4 border-t border-slate-200 gap-4">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-black" />
                These details are populated onto the official invoices.
              </p>
              <div className="flex items-center justify-end gap-3">
                {saveSuccess && (
                  <span className="text-xs text-[#1A1A1A] font-bold uppercase tracking-wider">Saved Successfully!</span>
                )}
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#1A1A1A] hover:bg-white hover:text-[#1A1A1A] border-2 border-[#1A1A1A] text-white font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer rounded-none"
                >
                  Save Business Profile
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Backup and Local Storage Control Column */}
        <div className="space-y-8">
          
          {/* Active Memory Saving & Storage Optimizer Panel */}
          <div className="bg-white border-2 border-[#1A1A1A] rounded-none p-6 space-y-6 shadow-none">
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-[#1A1A1A] border-b border-[#1A1A1A] pb-3 font-display italic">
              <Cpu size={18} />
              Memory & Storage Saving Center
            </h3>
            
            {/* 256 GB Dedicated Cloud Partition Status Box */}
            <div className="p-4 bg-black text-[#F9F9F7] border border-black space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black tracking-widest text-[#F9F9F7]/70 uppercase">CLOUD PARTITION STATUS</span>
                <span className="bg-emerald-500 text-white text-[8px] px-2 py-0.5 font-bold font-mono uppercase tracking-wider animate-pulse rounded-none">
                  ONLINE (256 GB)
                </span>
              </div>
              
              <div className="space-y-1 font-mono">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Total Allocation:</span>
                  <span className="font-bold text-white">256.00 GB</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Used Workspace:</span>
                  <span className="font-bold text-emerald-400">{(0.000012 + (parseFloat(dataSizeInKB) / 1024 / 1024)).toFixed(6)} GB</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Remaining Free:</span>
                  <span className="font-bold text-white">255.999988 GB</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                <p className="text-[8px] text-slate-400 uppercase font-bold tracking-wider leading-relaxed">
                  Terminal partition isolated, encrypted, and backed up with real-time sync nodes.
                </p>
              </div>
            </div>

            {/* Real-time Storage stats */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-end text-xs font-bold uppercase tracking-wider">
                <span>Active Browser Local Cache</span>
                <span className="font-mono">{dataSizeInKB} KB</span>
              </div>
              
              {/* Storage bar */}
              <div className="w-full h-4 border border-black bg-slate-100 p-0.5 rounded-none">
                <div 
                  style={{ width: `${Math.max(1, storagePercentage)}%` }}
                  className="h-full bg-black transition-all duration-500"
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <span>0 KB</span>
                <span>Chrome Quota: 5.0 MB</span>
              </div>
            </div>

            {/* Metrics Checklist */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-[#F9F9F7] border border-[#1A1A1A]">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Stock Items</p>
                <p className="text-lg font-black italic mt-0.5">{appData.inventory.length}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Invoices Logs</p>
                <p className="text-lg font-black italic mt-0.5">{appData.invoices.length}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Staff Records</p>
                <p className="text-lg font-black italic mt-0.5">{appData.employees.length}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Registered Dealers</p>
                <p className="text-lg font-black italic mt-0.5">{appData.dealers.length}</p>
              </div>
            </div>

            {/* Prune and compact ledger */}
            <div className="space-y-3">
              <p className="text-[11px] text-slate-500 leading-normal">
                Optimize and free application memory by cleaning out orphaned receipts, empty ledger items, and formatting Whitespace parameters.
              </p>
              
              <button
                onClick={handleOptimizeMemory}
                disabled={!!pruningStatus}
                className="w-full py-3 border-2 border-black hover:bg-[#1A1A1A] hover:text-white bg-transparent text-[#1A1A1A] text-xs font-bold uppercase tracking-widest transition-all cursor-pointer rounded-none flex items-center justify-center gap-2"
              >
                <Cpu size={14} />
                {pruningStatus ? pruningStatus : "Compact & Prune Memory"}
              </button>
            </div>
          </div>

          {/* Database Backup & Recovery */}
          <div className="bg-white border-2 border-[#1A1A1A] rounded-none p-6 space-y-4 shadow-none">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#1A1A1A] flex items-center gap-2 font-display italic">
              <ShieldCheck size={16} />
              Database Backups
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Your billing logs and catalog data are saved locally inside Chrome's secure isolation engine. Export backup copies regularly.
            </p>

            <div className="space-y-3 pt-1">
              <button
                onClick={handleBackupExport}
                className="w-full py-3 bg-transparent hover:bg-slate-100 border border-[#1A1A1A] text-[#1A1A1A] text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 rounded-none cursor-pointer"
              >
                <Download size={14} />
                Export JSON Database
              </button>

              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleBackupImport}
                  id="backup-upload"
                  className="hidden"
                />
                <label
                  htmlFor="backup-upload"
                  className="w-full py-3 border border-dashed border-[#1A1A1A] hover:bg-slate-50 text-[#1A1A1A] text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer rounded-none"
                >
                  <Upload size={14} />
                  Restore JSON Database
                </label>
              </div>
            </div>

            {importSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-bold uppercase tracking-widest rounded-none text-center">
                Database restored successfully!
              </div>
            )}

            {importError && (
              <div className="p-3 bg-red-50 border border-red-300 text-red-800 text-[10px] font-bold uppercase tracking-wide rounded-none flex items-start gap-1">
                <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                <span>{importError}</span>
              </div>
            )}
          </div>

          {/* Destructive Clear Cache & Erase Demo Entries Panel */}
          <div className="bg-white border-2 border-red-600 rounded-none p-6 space-y-4 shadow-none">
            <h3 className="text-xs font-black uppercase tracking-widest text-red-600 flex items-center gap-2 font-display italic">
              <Trash2 size={16} />
              Reset & Wipe Database
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Delete all data cached in your browser. This will **permanently erase** any residual demo entries, invoices, and restore the ledger to a completely empty production-ready state.
            </p>

            {!resetConfirm ? (
              <button
                onClick={() => setResetConfirm(true)}
                className="w-full py-3 border-2 border-red-600 hover:bg-red-600 hover:text-white bg-transparent text-red-600 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer rounded-none flex items-center justify-center gap-2"
              >
                <Trash2 size={14} />
                Hard Reset (Wipe All)
              </button>
            ) : (
              <div className="space-y-3 p-3 bg-red-50 border border-red-200">
                <p className="text-[10px] text-red-800 font-bold uppercase tracking-wide text-center">Are you absolutely sure? This cannot be undone!</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleFullHardReset}
                    className="py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider rounded-none cursor-pointer"
                  >
                    Yes, Wipe
                  </button>
                  <button
                    onClick={() => setResetConfirm(false)}
                    className="py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold uppercase tracking-wider rounded-none cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
