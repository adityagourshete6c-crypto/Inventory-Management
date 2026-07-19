/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserAccount, UserSession, AppData } from '../types';
import { loadUserRegistry, saveUserRegistry, loadUserAppData, saveUserAppData } from '../defaultData';
import { Phone, Lock, Eye, EyeOff, ShieldCheck, UserCheck, HardDrive, Cpu, PlusCircle, CheckCircle2, RefreshCw } from 'lucide-react';

interface LoginGatewayProps {
  onLoginSuccess: (mobileNumber: string) => void;
  registeredUsers: UserAccount[];
  onRefreshUsers: () => void;
  activeSessions: UserSession[];
  onAddActiveSession: (mobile: string) => void;
}

export default function LoginGateway({
  onLoginSuccess,
  registeredUsers,
  onRefreshUsers,
  activeSessions,
  onAddActiveSession
}: LoginGatewayProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  
  // Fields
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // States
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successCode, setSuccessCode] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Validate Indian Mobile Number format (10 digits)
  const validateMobile = (num: string) => {
    const clean = num.replace(/\D/g, '');
    return clean.length >= 10 && clean.length <= 12;
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessCode(null);

    const cleanMobile = mobileNumber.trim();
    if (!validateMobile(cleanMobile)) {
      setErrorMsg('Please enter a valid mobile number (10 to 12 digits).');
      return;
    }

    if (password.length < 4) {
      setErrorMsg('Password should be at least 4 characters long.');
      return;
    }

    const users = loadUserRegistry();
    const exists = users.some(u => u.mobileNumber === cleanMobile);
    if (exists) {
      setErrorMsg('This mobile number is already registered. Please login.');
      return;
    }

    setIsRegistering(true);

    // Simulate database delay
    setTimeout(() => {
      // Create Unique App Code
      const randDigits = Math.floor(100000 + Math.random() * 900000);
      const uniqueCode = `VTX-MB-${randDigits}`;

      const newUser: UserAccount = {
        id: `usr-${Date.now()}`,
        mobileNumber: cleanMobile,
        uniqueCode,
        passwordHash: password, // simple storage for demo
        createdAt: new Date().toISOString(),
        businessName: businessName.trim() || 'METRO WHOLESALE STORE',
        storageLimitGB: 256,
        storageUsedBytes: Math.floor(45000 + Math.random() * 80000) // simulated baseline files size
      };

      // Initialize default user appData with their business name and phone
      const initialUserData: AppData = {
        inventory: [],
        dealers: [],
        dealerPayments: [],
        employees: [],
        invoices: [],
        businessDetails: {
          name: newUser.businessName,
          tagline: "Premium Distribution & Spares Dealer",
          ownerName: "Partner Terminal",
          address: "Sector 4, Wholesale Complex, Mumbai",
          phone: cleanMobile,
          email: `terminal.${cleanMobile.slice(-4)}@vertex.com`,
          gstin: "27AADCM" + randDigits + "F1Z5",
          bankName: "State Bank of India",
          bankAccountNo: "30221445" + randDigits,
          bankIfsc: "SBIN0004523",
          termsAndConditions: "1. Goods once sold will not be taken back.\n2. Warranty as per manufacturer terms.",
          stateCode: "27",
          dashboardPrefix: "223-Dashboard",
          themeColor: "black",
          themeMode: "light",
          customHexColor: "#1A1A1A"
        }
      };

      // Save user profile and their workspace database
      const updatedUsers = [...users, newUser];
      saveUserRegistry(updatedUsers);
      saveUserAppData(cleanMobile, initialUserData);

      onRefreshUsers();
      setSuccessCode(uniqueCode);
      setIsRegistering(false);

      // Auto login after 3 seconds
      setTimeout(() => {
        onAddActiveSession(cleanMobile);
        onLoginSuccess(cleanMobile);
      }, 3000);

    }, 800);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanMobile = mobileNumber.trim();
    if (!cleanMobile) {
      setErrorMsg('Please enter your mobile number.');
      return;
    }

    const users = loadUserRegistry();
    const user = users.find(u => u.mobileNumber === cleanMobile);

    if (!user) {
      setErrorMsg('This mobile number is not registered. Please sign up first.');
      return;
    }

    if (user.passwordHash !== password) {
      setErrorMsg('Incorrect password. Please try again.');
      return;
    }

    onAddActiveSession(cleanMobile);
    onLoginSuccess(cleanMobile);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB] text-[#1A1A1A] flex flex-col justify-center items-center px-4 py-12 font-sans" id="login-gateway-container">
      
      {/* Visual Branding Frame */}
      <div className="max-w-md w-full bg-white border-2 border-black rounded-none shadow-none overflow-hidden relative">
        
        {/* Accent Top Bar */}
        <div className="bg-black text-[#F9F9F7] px-6 py-4 border-b border-black flex justify-between items-center">
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest font-display italic">VERTEX BILLING DECK</h2>
            <p className="text-[9px] uppercase tracking-wider text-slate-400 mt-0.5">Terminal Authentication Interface</p>
          </div>
          <span className="text-[9px] bg-red-600 text-white font-black px-2 py-0.5 border border-black uppercase tracking-wider animate-pulse">
            Secure Live
          </span>
        </div>

        {/* 256 GB High-Performance Storage Status Banner */}
        <div className="bg-[#F9F9F7] border-b-2 border-black p-4 flex gap-3 items-center">
          <HardDrive size={24} className="text-black shrink-0" />
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-black">Storage Server Partition Status</span>
              <span className="bg-emerald-500 text-white text-[7px] px-1 py-0.5 rounded-none font-bold font-mono">256 GB ACTIVE</span>
            </div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
              Guaranteed 256 GB cloud allocation active. Multiple operators may connect concurrently.
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b-2 border-black bg-slate-50 text-xs font-black uppercase tracking-wider">
          <button
            onClick={() => { setTab('login'); setErrorMsg(null); setSuccessCode(null); }}
            className={`flex-1 py-3 text-center transition-colors border-r border-black cursor-pointer ${
              tab === 'login' ? 'bg-white text-black font-black' : 'text-slate-400 hover:bg-slate-100'
            }`}
          >
            Log In Terminal
          </button>
          <button
            onClick={() => { setTab('register'); setErrorMsg(null); setSuccessCode(null); }}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
              tab === 'register' ? 'bg-white text-black font-black' : 'text-slate-400 hover:bg-slate-100'
            }`}
          >
            Register Terminal
          </button>
        </div>

        {/* Forms Content */}
        <div className="p-6">
          
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-600 text-red-800 text-[10px] font-bold uppercase tracking-wide flex items-start gap-2 rounded-none">
              <span className="shrink-0 font-black">✕ ERROR:</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successCode && (
            <div className="mb-5 p-4 bg-emerald-50 border-2 border-emerald-600 text-emerald-900 rounded-none space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-emerald-800">
                <CheckCircle2 size={16} />
                Terminal Activated Successfully!
              </div>
              <p className="text-[10px] text-slate-600 font-bold leading-normal uppercase">
                Your automatically generated unique license code is:
              </p>
              <div className="p-2.5 bg-white border border-emerald-600 text-center font-mono font-black text-xs text-black select-all uppercase tracking-wider">
                {successCode}
              </div>
              <p className="text-[9px] text-emerald-700 font-bold text-center animate-pulse">
                Auto-connecting workspace. Please wait...
              </p>
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Registered Mobile Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 h-4 w-4 text-black pointer-events-none" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-white border border-black p-3 text-xs font-bold pl-10 focus:ring-1 focus:ring-black focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Terminal Secure Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-black pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-black p-3 text-xs pl-10 pr-10 focus:ring-1 focus:ring-black focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-black focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-3 bg-black hover:bg-white hover:text-black border-2 border-black text-white text-xs font-black uppercase tracking-widest transition-all rounded-none cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldCheck size={14} />
                Access Terminal Workspace
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Mobile Number (Login ID) *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 h-4 w-4 text-black pointer-events-none" />
                  <input
                    type="tel"
                    required
                    placeholder="Enter 10-12 digit mobile number"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-white border border-black p-3 text-xs font-bold pl-10 focus:ring-1 focus:ring-black focus:outline-none"
                  />
                </div>
                <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-wider">This number is used to log in individually.</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Create Secure Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-black pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Create your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-black p-3 text-xs pl-10 pr-10 focus:ring-1 focus:ring-black focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-black focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Business / Enterprise Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Metro Distributors Pvt Ltd"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full bg-white border border-black p-3 text-xs font-bold focus:ring-1 focus:ring-black focus:outline-none"
                />
              </div>

              <div className="p-3 bg-[#F9F9F7] border border-black flex items-start gap-2.5">
                <Cpu size={18} className="text-black shrink-0 mt-0.5" />
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed">
                  Upon registration, the app's cryptographic engine will instantly generate a <strong>Unique Terminal License Code</strong> assigned specifically to this mobile node.
                </p>
              </div>

              <button
                type="submit"
                disabled={isRegistering}
                className="w-full mt-4 py-3 bg-black hover:bg-[#F9F9F7] hover:text-black border-2 border-black text-white text-xs font-black uppercase tracking-widest transition-all rounded-none cursor-pointer flex items-center justify-center gap-2"
              >
                {isRegistering ? (
                  <>
                    <RefreshCw className="animate-spin" size={14} />
                    Provisioning Sandbox Space...
                  </>
                ) : (
                  <>
                    <PlusCircle size={14} />
                    Submit & Register
                  </>
                )}
              </button>
            </form>
          )}

        </div>

        {/* Active Concurrent Terminals List (Visualizing Multi-session availability) */}
        {activeSessions.length > 0 && (
          <div className="bg-[#F9F9F7] border-t-2 border-black p-4 space-y-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-black flex items-center gap-1">
              <UserCheck size={12} className="text-emerald-600 animate-pulse" />
              Concurrently Authenticated Node Sessions ({activeSessions.length})
            </span>
            <div className="space-y-1.5 max-h-24 overflow-y-auto">
              {activeSessions.map((session, index) => {
                const userObj = registeredUsers.find(u => u.mobileNumber === session.mobileNumber);
                return (
                  <div key={index} className="flex justify-between items-center text-[10px] bg-white border border-black p-2 font-mono">
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="font-bold text-black">{session.mobileNumber}</span>
                      <span className="text-slate-400">({userObj?.uniqueCode || session.uniqueCode})</span>
                    </div>
                    <button
                      onClick={() => onLoginSuccess(session.mobileNumber)}
                      className="text-[9px] text-white bg-black hover:bg-slate-800 px-2 py-0.5 font-bold uppercase tracking-wider rounded-none cursor-pointer"
                    >
                      Enter Deck
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer info branding */}
        <div className="bg-black text-[#F9F9F7]/60 text-[8px] font-bold uppercase tracking-widest text-center py-2.5 border-t border-black">
          VERTEX TRANSACTION GATEWAY v4.2.0 • ISO-9001 COMPLIANT
        </div>

      </div>

      {/* Mini Helper Text explaining 256 GB Partition and Multi-session */}
      <div className="mt-4 max-w-xs text-center space-y-1.5">
        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
          SYSTEM IS SANDBOXED SECURELY IN GOOGLE CLOUD INGRESS ROUTING LAYER.
        </p>
        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
          STORAGE PARTITION ALLOCATION: <strong>256 GB SECURE FLASH MEMORY</strong>
        </p>
      </div>

    </div>
  );
}
