/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppData, InventoryItem, Dealer, DealerPayment, Employee, Invoice, BusinessDetails } from './types';
import { loadAppData, saveAppData } from './defaultData';
import { Receipt, Boxes, Landmark, Users, BarChart3, Settings, AlertCircle, Laptop } from 'lucide-react';

// Modular Components
import BillingManager from './components/BillingManager';
import InventoryManager from './components/InventoryManager';
import DealerManager from './components/DealerManager';
import EmployeeManager from './components/EmployeeManager';
import ReportSummary from './components/ReportSummary';
import BusinessProfile from './components/BusinessProfile';

export default function App() {
  const [data, setData] = useState<AppData>(loadAppData);
  const [activeTab, setActiveTab] = useState<'billing' | 'inventory' | 'dealers' | 'employees' | 'reports' | 'profile'>('billing');

  // Sync state to localStorage whenever it changes
  useEffect(() => {
    saveAppData(data);
  }, [data]);

  const handleUpdateInventory = (newInventory: InventoryItem[]) => {
    setData(prev => ({
      ...prev,
      inventory: newInventory
    }));
  };

  const handleUpdateDealers = (newDealers: Dealer[]) => {
    setData(prev => ({
      ...prev,
      dealers: newDealers
    }));
  };

  const handleUpdatePayments = (newPayments: DealerPayment[]) => {
    setData(prev => ({
      ...prev,
      dealerPayments: newPayments
    }));
  };

  const handleUpdateEmployees = (newEmployees: Employee[]) => {
    setData(prev => ({
      ...prev,
      employees: newEmployees
    }));
  };

  const handleUpdateInvoices = (newInvoices: Invoice[]) => {
    setData(prev => ({
      ...prev,
      invoices: newInvoices
    }));
  };

  const handleSaveDetails = (details: BusinessDetails) => {
    setData(prev => ({
      ...prev,
      businessDetails: details
    }));
  };

  const handleImportBackup = (importedData: AppData) => {
    setData(importedData);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="app-root-container">
      
      {/* PROFESSIONAL CHROME WEB APP HEADER */}
      <header className="bg-slate-900 text-white border-b border-slate-800 shrink-0 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-base tracking-wider shadow-sm">
                V
              </div>
              <div>
                <h1 className="text-sm font-black tracking-tight flex items-center gap-1.5 uppercase">
                  {data.businessDetails.name || 'Enterprise'}
                </h1>
                <p className="text-[10px] text-slate-400 font-medium">GSTIN: {data.businessDetails.gstin || 'Add registered GSTIN'}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick reminder on shortcut install */}
            <div className="hidden md:flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-[10px] text-slate-300">
              <Laptop size={12} className="text-blue-400" />
              <span>For Shortcut: Click Chrome Menu (⋮) → Save and share → Install page...</span>
            </div>

            <div className="text-right text-xs">
              <p className="text-slate-300 font-bold">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
              <p className="text-[9px] text-emerald-400 font-semibold uppercase flex items-center justify-end gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                Secure Offline Mode
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* TABS SELECTOR / RUNTIME CONTROLS */}
      <nav className="bg-white border-b border-slate-200 shadow-3xs sticky top-0 z-30 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2">
            
            <button
              onClick={() => setActiveTab('billing')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'billing'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Receipt size={14} />
              GST Billing
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Boxes size={14} />
              Stock Catalog
            </button>

            <button
              onClick={() => setActiveTab('dealers')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'dealers'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Landmark size={14} />
              Dealers Ledger
            </button>

            <button
              onClick={() => setActiveTab('employees')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'employees'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Users size={14} />
              Staff Registry
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BarChart3 size={14} />
              Performance Reports
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Settings size={14} />
              Business Profile
            </button>

          </div>
        </div>
      </nav>

      {/* CORE WORKSPACE CANVAS */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 no-print">
        {activeTab === 'billing' && (
          <BillingManager
            inventory={data.inventory}
            businessDetails={data.businessDetails}
            invoices={data.invoices}
            onUpdateInvoices={handleUpdateInvoices}
            onUpdateInventory={handleUpdateInventory}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryManager
            inventory={data.inventory}
            onUpdateInventory={handleUpdateInventory}
          />
        )}

        {activeTab === 'dealers' && (
          <DealerManager
            dealers={data.dealers}
            dealerPayments={data.dealerPayments}
            onUpdateDealers={handleUpdateDealers}
            onUpdatePayments={handleUpdatePayments}
          />
        )}

        {activeTab === 'employees' && (
          <EmployeeManager
            employees={data.employees}
            onUpdateEmployees={handleUpdateEmployees}
          />
        )}

        {activeTab === 'reports' && (
          <ReportSummary
            invoices={data.invoices}
            employees={data.employees}
          />
        )}

        {activeTab === 'profile' && (
          <BusinessProfile
            businessDetails={data.businessDetails}
            onSaveDetails={handleSaveDetails}
            appData={data}
            onImportBackup={handleImportBackup}
          />
        )}
      </main>

      {/* SYSTEM WATERMARK & AUDIT FOOTER */}
      <footer className="bg-slate-100 border-t border-slate-200 py-3 shrink-0 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center text-[10px] text-slate-400 font-medium">
          <p>© {new Date().getFullYear()} Vertex Systems Inc. All Data Saved Locally.</p>
          <p className="flex items-center gap-1">
            <AlertCircle size={10} />
            Chrome PWA Secure Storage Ready
          </p>
        </div>
      </footer>

    </div>
  );
}
