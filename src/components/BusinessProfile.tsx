/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BusinessDetails, AppData } from '../types';
import { Save, Building, ShieldCheck, Download, Upload, Info, Laptop, Monitor, AlertTriangle } from 'lucide-react';

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
    link.download = `${details.name.replace(/\s+/g, '_')}_Backup_${new Date().toISOString().slice(0, 10)}.json`;
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

  return (
    <div className="space-y-6" id="business-profile-container">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Settings Form */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-150 bg-slate-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Building size={16} className="text-blue-600" />
              Company / Business Details
            </h2>
            <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">GST Billing Ready</span>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Business Registered Name *</label>
                <input
                  type="text"
                  name="name"
                  value={details.name}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. Vertex Enterprises"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tagline / Slogan</label>
                <input
                  type="text"
                  name="tagline"
                  value={details.tagline}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. Quality Industrial Spares"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">GSTIN (15-digit GST Number) *</label>
                <input
                  type="text"
                  name="gstin"
                  value={details.gstin}
                  onChange={handleInputChange}
                  required
                  maxLength={15}
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-lg p-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. 29AAAAA0000A1Z1"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">GST State & State Code *</label>
                <input
                  type="text"
                  name="stateCode"
                  value={details.stateCode}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. 29 (Karnataka)"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Contact Phone Number *</label>
                <input
                  type="text"
                  name="phone"
                  value={details.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. +91 98765 43210"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Contact Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={details.email}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. office@vertex.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Proprietor / Owner Name</label>
                <input
                  type="text"
                  name="ownerName"
                  value={details.ownerName}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  placeholder="Owner / Partner Name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Bank Name (For Bill Footer)</label>
                <input
                  type="text"
                  name="bankName"
                  value={details.bankName || ''}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  placeholder="Bank Name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Bank Account Number</label>
                <input
                  type="text"
                  name="bankAccountNo"
                  value={details.bankAccountNo || ''}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  placeholder="Account Number"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Bank IFSC Code</label>
                <input
                  type="text"
                  name="bankIfsc"
                  value={details.bankIfsc || ''}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-lg p-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  placeholder="IFSC Code"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Billing & Delivery Address *</label>
              <textarea
                name="address"
                value={details.address}
                onChange={handleInputChange}
                required
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 resize-none"
                placeholder="Business full postal address for invoices..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Invoice Terms & Conditions</label>
              <textarea
                name="termsAndConditions"
                value={details.termsAndConditions}
                onChange={handleInputChange}
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 resize-none"
                placeholder="Terms displayed on invoice bottom..."
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <ShieldCheck size={12} className="text-emerald-500" />
                These details will appear on all generated invoices.
              </p>
              <div className="flex items-center gap-3">
                {saveSuccess && (
                  <span className="text-xs text-emerald-600 font-medium">Details saved successfully!</span>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5"
                >
                  <Save size={14} />
                  Save Business Profile
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Backup and Local Storage Control Column */}
        <div className="space-y-6">
          
          {/* Chrome Install Shortcut Guide */}
          <div className="bg-slate-900 text-white rounded-xl shadow-xs border border-slate-800 p-5 space-y-4">
            <h3 className="text-xs font-semibold flex items-center gap-2 text-blue-400">
              <Monitor size={16} />
              Open as Chrome Desktop Shortcut
            </h3>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              This app can be added as a standalone window shortcut on your Laptop or PC's Desktop/Home Screen. 
            </p>
            
            <div className="space-y-2 border-t border-slate-800 pt-3">
              <div className="flex gap-2.5">
                <span className="w-5 h-5 bg-slate-800 text-slate-300 text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">1</span>
                <p className="text-[10px] text-slate-300">Click the <strong className="text-white">Three Dots menu (⋮)</strong> at the top right of your Google Chrome browser window.</p>
              </div>
              <div className="flex gap-2.5">
                <span className="w-5 h-5 bg-slate-800 text-slate-300 text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">2</span>
                <p className="text-[10px] text-slate-300">Select <strong className="text-white">Save and share</strong>, then click <strong className="text-white">Install page...</strong> or <strong className="text-white">Create shortcut...</strong>.</p>
              </div>
              <div className="flex gap-2.5">
                <span className="w-5 h-5 bg-slate-800 text-slate-300 text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">3</span>
                <p className="text-[10px] text-slate-300">Tick <strong className="text-white">Open as window</strong> and click Create. An icon shortcut is generated instantly on your desktop!</p>
              </div>
            </div>

            <div className="p-2.5 bg-slate-800/50 rounded-lg flex items-start gap-2 border border-slate-800">
              <Laptop size={14} className="text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-[9px] text-slate-400">
                You can pin the shortcut to your Windows Taskbar or Mac Dock for quick, one-click access just like standard billing software!
              </p>
            </div>
          </div>

          {/* Local App Storage Management */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
            <h3 className="text-xs font-semibold text-slate-800 flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-600" />
              Database Backup & Recovery
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Your billing catalog, transactions, supplier balances, and staff logs are securely stored in Chrome's <strong className="text-slate-700">Local Storage</strong>. Download a backup copy regularly.
            </p>

            <div className="space-y-2 pt-1">
              <button
                onClick={handleBackupExport}
                className="w-full py-2.5 px-3 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Download size={14} className="text-blue-600" />
                Download Complete Backup (.json)
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
                  className="w-full py-2.5 px-3 border border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 text-slate-600 hover:text-blue-700 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload size={14} className="text-emerald-600" />
                  Restore / Upload Backup (.json)
                </label>
              </div>
            </div>

            {importSuccess && (
              <div className="p-2 bg-emerald-50 text-emerald-800 text-[10px] rounded-md border border-emerald-100">
                Data restored successfully! Please refresh or toggle tabs to view changes.
              </div>
            )}

            {importError && (
              <div className="p-2 bg-red-50 text-red-800 text-[10px] rounded-md border border-red-100 flex items-start gap-1">
                <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                <span>{importError}</span>
              </div>
            )}

            <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-2">
              <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-700 leading-normal">
                <strong>Warning:</strong> Restoring a backup file will overwrite all current entries. We recommend exporting a backup first.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
