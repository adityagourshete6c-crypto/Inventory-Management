/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppData, InventoryItem, Dealer, DealerPayment, Employee, Invoice, BusinessDetails, UserAccount, UserSession } from './types';
import { 
  loadUserRegistry, 
  saveUserRegistry, 
  loadUserAppData, 
  saveUserAppData, 
  loadActiveSessions, 
  saveActiveSessions, 
  loadCurrentSession, 
  saveCurrentSession 
} from './defaultData';
import { Receipt, Boxes, Landmark, Users, BarChart3, Settings, AlertCircle, Laptop, LogOut, UserPlus, HardDrive, CheckCircle } from 'lucide-react';

// Modular Components
import BillingManager from './components/BillingManager';
import InventoryManager from './components/InventoryManager';
import DealerManager from './components/DealerManager';
import EmployeeManager from './components/EmployeeManager';
import ReportSummary from './components/ReportSummary';
import BusinessProfile from './components/BusinessProfile';
import LoginGateway from './components/LoginGateway';

export default function App() {
  const [registeredUsers, setRegisteredUsers] = useState<UserAccount[]>(() => loadUserRegistry());
  const [activeSessions, setActiveSessions] = useState<UserSession[]>(() => loadActiveSessions());
  const [currentSessionMobile, setCurrentSessionMobile] = useState<string | null>(() => loadCurrentSession());
  
  const [data, setData] = useState<AppData>(() => {
    const active = loadCurrentSession();
    return active ? loadUserAppData(active) : loadUserAppData('9876543210');
  });
  
  const [activeTab, setActiveTab] = useState<'billing' | 'inventory' | 'dealers' | 'employees' | 'reports' | 'profile'>('billing');

  // Seed demo user on first startup
  useEffect(() => {
    const existing = loadUserRegistry();
    if (existing.length === 0) {
      const demoUser: UserAccount = {
        id: 'usr-demo',
        mobileNumber: '9876543210',
        uniqueCode: 'VTX-MB-990022',
        passwordHash: '1234',
        createdAt: new Date().toISOString(),
        businessName: 'METRO WHOLESALE & SUPPLY',
        storageLimitGB: 256,
        storageUsedBytes: 54109
      };
      
      saveUserRegistry([demoUser]);
      setRegisteredUsers([demoUser]);
      
      // Seed existing local storage data to user data if present
      const savedDemoData = localStorage.getItem("VERTEX_BIZ_APP_DATA");
      if (savedDemoData) {
        localStorage.setItem("VERTEX_USER_DATA_9876543210", savedDemoData);
      }
      
      // Auto active sessions seed
      const initialSession = [{
        mobileNumber: '9876543210',
        uniqueCode: 'VTX-MB-990022',
        loggedInAt: new Date().toISOString()
      }];
      setActiveSessions(initialSession);
      saveActiveSessions(initialSession);
      setCurrentSessionMobile('9876543210');
      saveCurrentSession('9876543210');
      setData(loadUserAppData('9876543210'));
    }
  }, []);

  // Sync active user state whenever data changes
  useEffect(() => {
    if (currentSessionMobile) {
      saveUserAppData(currentSessionMobile, data);
    }
  }, [data, currentSessionMobile]);

  const handleLoginSuccess = (mobile: string) => {
    setCurrentSessionMobile(mobile);
    saveCurrentSession(mobile);
    setData(loadUserAppData(mobile));
  };

  const handleAddActiveSession = (mobile: string) => {
    const registry = loadUserRegistry();
    const user = registry.find(u => u.mobileNumber === mobile);
    const code = user ? user.uniqueCode : 'VTX-MB-XXXXXX';
    
    const existingSessions = loadActiveSessions();
    if (!existingSessions.some(s => s.mobileNumber === mobile)) {
      const updated = [...existingSessions, {
        mobileNumber: mobile,
        uniqueCode: code,
        loggedInAt: new Date().toISOString()
      }];
      setActiveSessions(updated);
      saveActiveSessions(updated);
    }
  };

  const handleSwitchSession = (mobile: string) => {
    setCurrentSessionMobile(mobile);
    saveCurrentSession(mobile);
    setData(loadUserAppData(mobile));
  };

  const handleDisconnectSession = (mobile: string) => {
    const updatedSessions = activeSessions.filter(s => s.mobileNumber !== mobile);
    setActiveSessions(updatedSessions);
    saveActiveSessions(updatedSessions);
    
    if (currentSessionMobile === mobile) {
      if (updatedSessions.length > 0) {
        const nextMobile = updatedSessions[0].mobileNumber;
        setCurrentSessionMobile(nextMobile);
        saveCurrentSession(nextMobile);
        setData(loadUserAppData(nextMobile));
      } else {
        setCurrentSessionMobile(null);
        saveCurrentSession(null);
      }
    }
  };

  const handleAddNewSessionLogin = () => {
    setCurrentSessionMobile(null);
    saveCurrentSession(null);
  };

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

  // If no user is loaded, display the Secure Multi-User Login/Register gateway
  if (!currentSessionMobile) {
    return (
      <LoginGateway
        onLoginSuccess={handleLoginSuccess}
        registeredUsers={registeredUsers}
        onRefreshUsers={() => setRegisteredUsers(loadUserRegistry())}
        activeSessions={activeSessions}
        onAddActiveSession={handleAddActiveSession}
      />
    );
  }

  const currentUserObj = registeredUsers.find(u => u.mobileNumber === currentSessionMobile);
  const currentUserCode = currentUserObj ? currentUserObj.uniqueCode : 'VTX-MB-XXXXXX';

  // Customizable Theme Configurations
  const customPrefix = data.businessDetails.dashboardPrefix || '223-Dashboard';
  const customThemeColor = data.businessDetails.themeColor || 'black';
  const customThemeMode = data.businessDetails.themeMode || 'light';
  const customColorValue = data.businessDetails.customHexColor || '#1A1A1A';

  // 1. Resolve Brand Accent Color Class & Styles
  let brandBg = 'bg-[#1A1A1A]';
  let brandText = 'text-[#1A1A1A]';
  let brandBorder = 'border-[#1A1A1A]';
  let brandHoverBg = 'hover:bg-slate-800';
  let brandBadgeBg = 'bg-[#1A1A1A]';
  
  let brandStyle: React.CSSProperties = {};
  let brandTextStyle: React.CSSProperties = {};
  let brandBorderStyle: React.CSSProperties = {};

  if (customThemeColor === 'custom') {
    brandBg = '';
    brandText = '';
    brandBorder = '';
    brandBadgeBg = '';
    brandStyle = { backgroundColor: customColorValue, color: '#FFFFFF' };
    brandTextStyle = { color: customColorValue };
    brandBorderStyle = { borderColor: customColorValue };
  } else {
    switch (customThemeColor) {
      case 'blue':
        brandBg = 'bg-blue-600';
        brandText = 'text-blue-600';
        brandBorder = 'border-blue-600';
        brandHoverBg = 'hover:bg-blue-700';
        brandBadgeBg = 'bg-blue-600';
        break;
      case 'emerald':
        brandBg = 'bg-[#10B981]';
        brandText = 'text-[#10B981]';
        brandBorder = 'border-[#10B981]';
        brandHoverBg = 'hover:bg-emerald-600';
        brandBadgeBg = 'bg-[#10B981]';
        break;
      case 'violet':
        brandBg = 'bg-violet-600';
        brandText = 'text-violet-600';
        brandBorder = 'border-violet-600';
        brandHoverBg = 'hover:bg-violet-700';
        brandBadgeBg = 'bg-violet-600';
        break;
      case 'amber':
        brandBg = 'bg-amber-500';
        brandText = 'text-amber-500';
        brandBorder = 'border-amber-500';
        brandHoverBg = 'hover:bg-amber-600';
        brandBadgeBg = 'bg-amber-500';
        break;
      case 'rose':
        brandBg = 'bg-rose-600';
        brandText = 'text-rose-600';
        brandBorder = 'border-rose-600';
        brandHoverBg = 'hover:bg-rose-700';
        brandBadgeBg = 'bg-rose-600';
        break;
      default: // black
        brandBg = 'bg-[#1A1A1A]';
        brandText = 'text-[#1A1A1A]';
        brandBorder = 'border-[#1A1A1A]';
        brandHoverBg = 'hover:bg-slate-800';
        brandBadgeBg = 'bg-[#1A1A1A]';
    }
  }

  // 2. Resolve Theme Mode Styles
  let containerBg = 'bg-[#FDFDFB]';
  let containerText = 'text-[#1A1A1A]';
  let layoutCardBg = 'bg-white';
  let layoutBorder = 'border-[#1A1A1A]';
  let headerBg = 'bg-white';
  let navBg = 'bg-[#F9F9F7]';
  let subText = 'text-slate-500';

  if (customThemeMode === 'dark') {
    containerBg = 'bg-[#0F0F10]';
    containerText = 'text-[#F4F4F5]';
    layoutCardBg = 'bg-[#18181B]';
    layoutBorder = 'border-[#27272A]';
    headerBg = 'bg-[#18181B]';
    navBg = 'bg-[#0F0F10]';
    subText = 'text-zinc-400';
  } else if (customThemeMode === 'retro') {
    containerBg = 'bg-[#151610]';
    containerText = 'text-[#B2D636]';
    layoutCardBg = 'bg-[#1A1C12]';
    layoutBorder = 'border-[#B2D636]';
    headerBg = 'bg-[#1A1C12]';
    navBg = 'bg-[#151610]';
    subText = 'text-[#8A9E3A]';
  } else if (customThemeMode === 'minimal') {
    containerBg = 'bg-[#FAF8F5]';
    containerText = 'text-[#2E2D2B]';
    layoutCardBg = 'bg-white';
    layoutBorder = 'border-slate-200';
    headerBg = 'bg-white';
    navBg = 'bg-[#FAF8F5]';
    subText = 'text-stone-500';
  } else if (customThemeMode === 'forest') {
    containerBg = 'bg-[#0F1412]';
    containerText = 'text-[#A7F3D0]';
    layoutCardBg = 'bg-[#141B18]';
    layoutBorder = 'border-[#065F46]';
    headerBg = 'bg-[#141B18]';
    navBg = 'bg-[#0F1412]';
    subText = 'text-emerald-400';
  } else if (customThemeMode === 'corporate') {
    containerBg = 'bg-[#1E293B]';
    containerText = 'text-[#F1F5F9]';
    layoutCardBg = 'bg-[#0F172A]';
    layoutBorder = 'border-[#334155]';
    headerBg = 'bg-[#0F172A]';
    navBg = 'bg-[#1E293B]';
    subText = 'text-[#94A3B8]';
  } else if (customThemeMode === 'neon') {
    containerBg = 'bg-[#180018]';
    containerText = 'text-[#F43F5E]';
    layoutCardBg = 'bg-[#2E0830]';
    layoutBorder = 'border-[#F43F5E]';
    headerBg = 'bg-[#2E0830]';
    navBg = 'bg-[#180018]';
    subText = 'text-fuchsia-400';
  }


  return (
    <div className={`min-h-screen ${containerBg} ${containerText} flex flex-col font-sans transition-colors duration-200`} id="app-root-container">
      
      {/* TOP DESK SESSION CONTROL RAIL (CONCURRENT MULTI-USER LOGINS INDICATOR) */}
      <div className="bg-[#1A1A1A] text-[#F9F9F7] text-[11px] font-bold px-6 py-3.5 flex flex-col md:flex-row justify-between items-stretch md:items-center border-b-2 border-black gap-4 shrink-0 no-print">
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
          <span className="text-slate-400 uppercase tracking-widest text-[9px] font-black flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
            Concurrently Authenticated Sessions ({activeSessions.length}):
          </span>
          
          <div className="flex flex-wrap items-center gap-2">
            {activeSessions.map((session) => {
              const isActive = session.mobileNumber === currentSessionMobile;
              return (
                <div 
                  key={session.mobileNumber}
                  className={`flex items-center gap-2 border px-3 py-1 text-[10px] font-mono select-none transition-all ${
                    isActive 
                      ? 'bg-white text-black border-white font-black shadow-sm' 
                      : 'bg-transparent text-slate-300 border-slate-800 hover:text-white hover:border-slate-500 hover:bg-white/5'
                  }`}
                >
                  <button 
                    onClick={() => handleSwitchSession(session.mobileNumber)}
                    className="cursor-pointer text-left font-bold"
                    title={`Switch view to ${session.mobileNumber}'s database ledger`}
                  >
                    {session.mobileNumber} {isActive ? '● ACTIVE' : ''}
                  </button>
                  <button
                    onClick={() => handleDisconnectSession(session.mobileNumber)}
                    className="text-[10px] ml-1 text-red-500 hover:text-red-400 font-bold px-1"
                    title="Disconnect this terminal session"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-4">
          <button
            onClick={handleAddNewSessionLogin}
            className="bg-[#2B2B2B] hover:bg-white hover:text-[#1A1A1A] border border-slate-700 text-[9px] uppercase tracking-widest text-slate-200 font-black px-3.5 py-1.5 transition-all flex items-center gap-1.5 cursor-pointer rounded-none"
            title="Log in another mobile number simultaneously"
          >
            <UserPlus size={12} />
            + Switch or Add Terminal
          </button>
          
          <div className="hidden lg:flex items-center gap-2 text-[9px] uppercase tracking-wider font-bold text-emerald-400 font-mono">
            <HardDrive size={13} className="text-emerald-500 animate-pulse" />
            <span>256 GB CLOUD PARTITION: ACTIVE</span>
          </div>
        </div>
      </div>
      <header className={`h-auto md:h-20 border-b-2 ${layoutBorder} flex flex-col md:flex-row items-stretch md:items-center justify-between px-6 py-4 md:py-0 ${headerBg} shrink-0 no-print transition-colors duration-200`}>
        <div className="flex flex-col justify-center">
          <h1 className="text-xl md:text-2xl font-black tracking-tighter leading-none font-display uppercase flex flex-wrap items-center gap-2.5">
            <span 
              className={`${brandBadgeBg} text-white text-[10px] md:text-xs font-mono font-bold tracking-widest px-2.5 py-1 uppercase`}
              style={customThemeColor === 'custom' ? brandStyle : undefined}
            >
              {customPrefix}
            </span>
            <span>{data.businessDetails.name || 'METRO WHOLESALE & SUPPLY'}</span>
          </h1>
          <span className={`text-[10px] uppercase tracking-[0.15em] font-bold ${subText} mt-1.5`}>
            GSTIN: {data.businessDetails.gstin || 'NOT REGISTERED'} • Terminal: {currentUserCode}
          </span>
        </div>
        
        <div className="flex items-center gap-6 mt-4 md:mt-0 justify-between md:justify-end">
          <div className="text-left md:text-right">
            <div className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Current Node / Mobile</div>
            <div className="text-xs md:text-sm font-black font-mono text-black">
              {currentSessionMobile}
            </div>
            <div className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider flex items-center justify-end gap-1 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              256 GB Secure Partition Dedicated
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => currentSessionMobile && handleDisconnectSession(currentSessionMobile)}
              className="px-4 py-2.5 border-2 border-red-600 hover:bg-red-600 hover:text-white bg-transparent text-red-600 text-xs font-black uppercase tracking-widest transition-colors cursor-pointer rounded-none flex items-center gap-2"
              title="Disconnect this active terminal session"
            >
              <LogOut size={13} />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* TABS SELECTOR / RUNTIME CONTROLS - EDITORIAL AESTHETIC */}
      <nav className={`${navBg} border-b ${layoutBorder} sticky top-0 z-30 no-print transition-colors duration-200`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex space-x-0 overflow-x-auto py-0">
            
            <button
              onClick={() => setActiveTab('billing')}
              className={`flex items-center gap-1.5 px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-r ${layoutBorder} transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'billing'
                  ? `${brandBg} text-white`
                  : `hover:bg-black/5`
              }`}
              style={customThemeColor === 'custom' && activeTab === 'billing' ? brandStyle : undefined}
            >
              <Receipt size={13} />
              GST Billing
            </button>
 
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-1.5 px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-r ${layoutBorder} transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'inventory'
                  ? `${brandBg} text-white`
                  : `hover:bg-black/5`
              }`}
              style={customThemeColor === 'custom' && activeTab === 'inventory' ? brandStyle : undefined}
            >
              <Boxes size={13} />
              Stock Catalog
            </button>
 
            <button
              onClick={() => setActiveTab('dealers')}
              className={`flex items-center gap-1.5 px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-r ${layoutBorder} transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'dealers'
                  ? `${brandBg} text-white`
                  : `hover:bg-black/5`
              }`}
              style={customThemeColor === 'custom' && activeTab === 'dealers' ? brandStyle : undefined}
            >
              <Landmark size={13} />
              Dealers Ledger
            </button>
 
            <button
              onClick={() => setActiveTab('employees')}
              className={`flex items-center gap-1.5 px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-r ${layoutBorder} transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'employees'
                  ? `${brandBg} text-white`
                  : `hover:bg-black/5`
              }`}
              style={customThemeColor === 'custom' && activeTab === 'employees' ? brandStyle : undefined}
            >
              <Users size={13} />
              Staff Registry
            </button>
 
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-1.5 px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-r ${layoutBorder} transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'reports'
                  ? `${brandBg} text-white`
                  : `hover:bg-black/5`
              }`}
              style={customThemeColor === 'custom' && activeTab === 'reports' ? brandStyle : undefined}
            >
              <BarChart3 size={13} />
              Performance Reports
            </button>
 
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-1.5 px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-r ${layoutBorder} transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'profile'
                  ? `${brandBg} text-white`
                  : `hover:bg-black/5`
              }`}
              style={customThemeColor === 'custom' && activeTab === 'profile' ? brandStyle : undefined}
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
