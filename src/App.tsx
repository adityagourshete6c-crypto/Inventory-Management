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
    <div className="min-h-screen bg-[#FDFDFB] text-[#1A1A1A] flex flex-col font-sans" id="app-root-container">
      
      {/* PROFESSIONAL CHROME WEB APP HEADER - EDITORIAL AESTHETIC */}
      <header className="h-auto md:h-20 border-b-2 border-[#1A1A1A] flex flex-col md:flex-row items-stretch md:items-center justify-between px-6 py-4 md:py-0 bg-white shrink-0 no-print">
        <div className="flex flex-col justify-center">
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter leading-none font-display uppercase">
            {data.businessDetails.name || 'METRO WHOLESALE & SUPPLY'}
          </h1>
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 mt-1">
            GSTIN: {data.businessDetails.gstin || 'NOT REGISTERED'} • Business Management Portal
          </span>
        </div>
        
        <div className="flex items-center gap-6 mt-4 md:mt-0 justify-between md:justify-end">
          <div className="text-left md:text-right">
            <div className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Session Status</div>
            <div className="text-xs md:text-sm font-medium font-display uppercase tracking-tight">
              {data.businessDetails.ownerName || 'Administrator'} • Secure Offline
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full border-2 border-[#1A1A1A] flex items-center justify-center font-black text-xs hover:bg-[#1A1A1A] hover:text-white transition-colors cursor-help" title="Local Database storage running directly inside your Google Chrome application memory.">
              {(data.businessDetails.name || 'ME').slice(0, 2).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* TABS SELECTOR / RUNTIME CONTROLS - EDITORIAL AESTHETIC */}
      <nav className="bg-[#F9F9F7] border-b border-[#1A1A1A] sticky top-0 z-30 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex space-x-0 overflow-x-auto py-0">
            
            <button
              onClick={() => setActiveTab('billing')}
              className={`flex items-center gap-1.5 px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-[#1A1A1A] transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'billing'
                  ? 'bg-[#1A1A1A] text-white'
                  : 'text-[#1A1A1A] hover:bg-slate-200'
              }`}
            >
              <Receipt size={13} />
              GST Billing
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-1.5 px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-[#1A1A1A] transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-[#1A1A1A] text-white'
                  : 'text-[#1A1A1A] hover:bg-slate-200'
              }`}
            >
              <Boxes size={13} />
              Stock Catalog
            </button>

            <button
              onClick={() => setActiveTab('dealers')}
              className={`flex items-center gap-1.5 px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-[#1A1A1A] transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'dealers'
                  ? 'bg-[#1A1A1A] text-white'
                  : 'text-[#1A1A1A] hover:bg-slate-200'
              }`}
            >
              <Landmark size={13} />
              Dealers Ledger
            </button>

            <button
              onClick={() => setActiveTab('employees')}
              className={`flex items-center gap-1.5 px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-[#1A1A1A] transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'employees'
                  ? 'bg-[#1A1A1A] text-white'
                  : 'text-[#1A1A1A] hover:bg-slate-200'
              }`}
            >
              <Users size={13} />
              Staff Registry
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-1.5 px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-[#1A1A1A] transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-[#1A1A1A] text-white'
                  : 'text-[#1A1A1A] hover:bg-slate-200'
              }`}
            >
              <BarChart3 size={13} />
              Performance Reports
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-1.5 px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-[#1A1A1A] transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-[#1A1A1A] text-white'
                  : 'text-[#1A1A1A] hover:bg-slate-200'
              }`}
            >
              <Settings size={13} />
              Business Profile & Reset
            </button>

          </div>
        </div>
      </nav>

      {/* CORE WORKSPACE CANVAS - EDITORIAL AESTHETIC */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 no-print">
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

      {/* SYSTEM WATERMARK & AUDIT FOOTER - EDITORIAL AESTHETIC */}
      <footer className="bg-white border-t-2 border-[#1A1A1A] py-4 px-6 md:px-12 shrink-0 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 font-bold tracking-widest uppercase gap-2">
          <p>© {new Date().getFullYear()} VERTEX BILLING & ENTERPRISE LEDGER</p>
          <div className="flex gap-6">
            <span className="flex items-center gap-1 text-[#1A1A1A]">
              <AlertCircle size={10} />
              LOCAL CHROME WORKSPACE ONLY
            </span>
            <span>APP v4.2.0 • OPTIMIZED OFF-LINE STORAGE</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
