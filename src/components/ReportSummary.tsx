/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Invoice, Employee } from '../types';
import { Calendar, BarChart2, TrendingUp, DollarSign, Percent, UserCheck } from 'lucide-react';

interface ReportSummaryProps {
  invoices: Invoice[];
  employees: Employee[];
}

export default function ReportSummary({ invoices, employees }: ReportSummaryProps) {
  const [reportTab, setReportTab] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [selectedDay, setSelectedDay] = useState(new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString()); // YYYY

  // Helper: check if invoice date matches based on selected period
  const getFilteredInvoices = () => {
    return invoices.filter(inv => {
      if (reportTab === 'daily') {
        return inv.date === selectedDay;
      } else if (reportTab === 'monthly') {
        return inv.date.startsWith(selectedMonth);
      } else {
        return inv.date.startsWith(selectedYear);
      }
    });
  };

  const periodInvoices = getFilteredInvoices();

  // Financial calculations
  const calculateMetrics = () => {
    let revenue = 0;
    let gstCollected = 0;
    let costPriceTotal = 0;

    periodInvoices.forEach(inv => {
      revenue += inv.grandTotal;
      gstCollected += inv.gstTotal;
      
      inv.items.forEach(item => {
        // we can find the matching product or use a generic 30% margin fallback if not found,
        // but let's assume standard cost of item
        costPriceTotal += (item.quantity * (item.sellingPrice * 0.7)); // fallback representation
      });
    });

    const grossProfit = Math.max(0, revenue - costPriceTotal - gstCollected);
    
    // Employee payroll calculation for the selected period
    let payrollTotal = 0;
    if (reportTab === 'daily') {
      payrollTotal = employees.reduce((sum, emp) => emp.isActive ? sum + (emp.salary / 30) : sum, 0);
    } else if (reportTab === 'monthly') {
      payrollTotal = employees.reduce((sum, emp) => emp.isActive ? sum + emp.salary : sum, 0);
    } else {
      payrollTotal = employees.reduce((sum, emp) => emp.isActive ? sum + (emp.salary * 12) : sum, 0);
    }

    return {
      revenue,
      gstCollected,
      grossProfit,
      payrollTotal,
    };
  };

  const metrics = calculateMetrics();

  // Monthly Sales trend mock data derived from real invoices
  const getMonthlyTrend = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = months.map((m, idx) => {
      const monthPrefix = `${selectedYear}-${String(idx + 1).padStart(2, '0')}`;
      const monthlyInvoices = invoices.filter(inv => inv.date.startsWith(monthPrefix));
      const total = monthlyInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
      return { month: m, amount: total };
    });
    return data;
  };

  const trendData = getMonthlyTrend();
  const maxTrendAmount = Math.max(...trendData.map(d => d.amount), 1000);

  return (
    <div className="space-y-6" id="reports-summary-container">
      
      {/* Top filter tabs */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white p-5 border-2 border-[#1A1A1A] rounded-none">
        <div className="flex border-2 border-[#1A1A1A] p-0.5 text-[10px] font-black uppercase tracking-widest bg-[#F9F9F7] rounded-none max-w-sm">
          <button
            onClick={() => setReportTab('daily')}
            className={`py-2.5 px-4 rounded-none transition-colors text-center cursor-pointer ${
              reportTab === 'daily' ? 'bg-[#1A1A1A] text-white' : 'text-black hover:bg-slate-100'
            }`}
          >
            Daily Summary
          </button>
          <button
            onClick={() => setReportTab('monthly')}
            className={`py-2.5 px-4 rounded-none transition-colors text-center cursor-pointer ${
              reportTab === 'monthly' ? 'bg-[#1A1A1A] text-white' : 'text-black hover:bg-slate-100'
            }`}
          >
            Monthly Summary
          </button>
          <button
            onClick={() => setReportTab('yearly')}
            className={`py-2.5 px-4 rounded-none transition-colors text-center cursor-pointer ${
              reportTab === 'yearly' ? 'bg-[#1A1A1A] text-white' : 'text-black hover:bg-slate-100'
            }`}
          >
            Yearly Summary
          </button>
        </div>

        {/* Date Filter selector */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-black uppercase tracking-widest text-[#1A1A1A] flex items-center gap-1.5">
            <Calendar size={14} />
            Period:
          </span>
          
          {reportTab === 'daily' && (
            <input
              type="date"
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="bg-white border-2 border-black text-xs font-bold uppercase tracking-wider p-2.5 text-[#1A1A1A] rounded-none focus:outline-none"
            />
          )}

          {reportTab === 'monthly' && (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white border-2 border-black text-xs font-bold uppercase tracking-wider p-2.5 text-[#1A1A1A] rounded-none focus:outline-none"
            />
          )}

          {reportTab === 'yearly' && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-white border-2 border-black text-xs font-bold uppercase tracking-wider p-2.5 text-[#1A1A1A] rounded-none focus:outline-none"
            >
              {['2024', '2025', '2026', '2027'].map(yr => (
                <option key={yr} value={yr}>{yr} Fiscal Year</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main KPI Stat boxes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 border-2 border-[#1A1A1A] rounded-none space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-widest">Gross Revenue (Sales)</span>
            <TrendingUp size={16} className="text-black" />
          </div>
          <p className="text-2xl font-black font-mono text-black">
            ₹{metrics.revenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Includes GST collected</p>
        </div>

        <div className="bg-[#F9F9F7] p-5 border-2 border-[#1A1A1A] rounded-none space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]">Estimated Gross Profit</span>
            <DollarSign size={16} className="text-black" />
          </div>
          <p className="text-2xl font-black font-mono text-emerald-700">
            ₹{metrics.grossProfit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Est. product margins</p>
        </div>

        <div className="bg-white p-5 border-2 border-[#1A1A1A] rounded-none space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-widest">GST Collected</span>
            <Percent size={16} className="text-black" />
          </div>
          <p className="text-2xl font-black font-mono text-[#1A1A1A]">
            ₹{metrics.gstCollected.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">CGST / SGST Total</p>
        </div>

        <div className="bg-white p-5 border-2 border-[#1A1A1A] rounded-none space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-widest">Staff Salaries</span>
            <UserCheck size={16} className="text-black" />
          </div>
          <p className="text-2xl font-black font-mono text-[#1A1A1A]">
            ₹{metrics.payrollTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pro-rata payroll cost</p>
        </div>

      </div>

      {/* Graphical Chart Trend Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Performance Visualizer (Col 2) */}
        <div className="lg:col-span-2 bg-white border-2 border-[#1A1A1A] p-6 space-y-4 rounded-none">
          <h3 className="text-xs font-black text-[#1A1A1A] uppercase tracking-widest flex items-center gap-1.5 font-display italic">
            <BarChart2 size={14} className="text-black" />
            Monthly Sales Distribution Trend ({selectedYear})
          </h3>

          {/* Graphical Bars */}
          <div className="h-64 flex items-end gap-3 pt-6 pb-2 px-4 border-b-2 border-l-2 border-[#1A1A1A]">
            {trendData.map((data, idx) => {
              const heightPercentage = Math.max(4, (data.amount / maxTrendAmount) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end">
                  
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-1 bg-black text-white text-[10px] font-mono px-2 py-0.5 rounded-none shadow-none opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                    ₹{data.amount.toLocaleString()}
                  </div>

                  <div 
                    style={{ height: `${heightPercentage}%` }}
                    className={`w-full transition-all duration-300 border-2 border-black rounded-none ${
                      data.amount > 0 ? 'bg-black hover:bg-white' : 'bg-slate-50'
                    }`}
                  />
                  <span className="text-[10px] text-[#1A1A1A] font-black uppercase tracking-wider font-sans">{data.month}</span>
                </div>
              );
            })}
          </div>

          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 text-center">Charts represent continuous monthly dispatch metrics fetched directly from local stores</p>
        </div>

        {/* Deliveries & Invoices Breakdowns (Col 1) */}
        <div className="bg-[#F9F9F7] border-2 border-[#1A1A1A] p-5 space-y-4 rounded-none">
          <h3 className="text-xs font-black uppercase tracking-widest text-[#1A1A1A] font-display italic">
            Ledger Dispatch logs
          </h3>

          <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
            {periodInvoices.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-12 border border-dashed border-slate-300">No records filed for the period.</p>
            ) : (
              periodInvoices.slice(0, 6).map(inv => (
                <div key={inv.id} className="p-3 bg-white border border-[#1A1A1A] rounded-none flex justify-between items-center">
                  <div>
                    <p className="font-bold text-black text-xs">{inv.customerName}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{inv.date} • {inv.invoiceNo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black font-mono text-black">₹{inv.grandTotal.toFixed(2)}</p>
                    <p className="text-[8px] bg-slate-100 text-[#1A1A1A] px-1.5 py-0.5 font-bold uppercase tracking-wider border border-black inline-block mt-0.5">{inv.paymentMode}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
