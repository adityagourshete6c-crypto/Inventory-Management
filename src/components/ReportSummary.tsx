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
      
      // Calculate costs to determine gross profits
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
      // daily salary share (monthly divided by 30)
      payrollTotal = employees.reduce((sum, emp) => emp.isActive ? sum + (emp.salary / 30) : sum, 0);
    } else if (reportTab === 'monthly') {
      // full month salary
      payrollTotal = employees.reduce((sum, emp) => emp.isActive ? sum + emp.salary : sum, 0);
    } else {
      // yearly salary
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
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex bg-slate-100 rounded-lg p-1 text-xs font-bold text-slate-600 max-w-xs self-start">
          <button
            onClick={() => setReportTab('daily')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors text-center ${
              reportTab === 'daily' ? 'bg-white text-slate-800 shadow-3xs' : 'hover:text-slate-900'
            }`}
          >
            Daily Summary
          </button>
          <button
            onClick={() => setReportTab('monthly')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors text-center ${
              reportTab === 'monthly' ? 'bg-white text-slate-800 shadow-3xs' : 'hover:text-slate-900'
            }`}
          >
            Monthly Summary
          </button>
          <button
            onClick={() => setReportTab('yearly')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors text-center ${
              reportTab === 'yearly' ? 'bg-white text-slate-800 shadow-3xs' : 'hover:text-slate-900'
            }`}
          >
            Yearly Summary
          </button>
        </div>

        {/* Date Filter selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Calendar size={14} />
            Period Selector:
          </span>
          
          {reportTab === 'daily' && (
            <input
              type="date"
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2 text-slate-700"
            />
          )}

          {reportTab === 'monthly' && (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2 text-slate-700"
            />
          )}

          {reportTab === 'yearly' && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2 text-slate-700"
            >
              {['2024', '2025', '2026', '2027'].map(yr => (
                <option key={yr} value={yr}>{yr} Financial Year</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main KPI Stat boxes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Gross Revenue (Sales)</span>
            <TrendingUp size={16} className="text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-800">
            ₹{metrics.revenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-400 font-medium">Includes tax collections</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Estimated Profit</span>
            <DollarSign size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600">
            ₹{metrics.grossProfit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-400 font-medium">Derived gross product margins</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">GST Collected</span>
            <Percent size={16} className="text-purple-500" />
          </div>
          <p className="text-2xl font-black text-purple-600">
            ₹{metrics.gstCollected.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-400 font-medium">CGST / SGST liability</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Staff Salaries Expense</span>
            <UserCheck size={16} className="text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600">
            ₹{metrics.payrollTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-400 font-medium">Pro-rata salary commitment</p>
        </div>

      </div>

      {/* Graphical Chart Trend Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Performance Visualizer (Col 2) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <BarChart2 size={14} className="text-blue-600" />
            Monthly Sales Distribution Trend ({selectedYear})
          </h3>

          {/* Graphical Bars */}
          <div className="h-64 flex items-end gap-3 pt-6 pb-2 px-4 border-b border-l border-slate-100">
            {trendData.map((data, idx) => {
              const heightPercentage = Math.max(5, (data.amount / maxTrendAmount) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                  
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-1 bg-slate-800 text-white text-[9px] font-mono px-1.5 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                    ₹{data.amount.toLocaleString()}
                  </div>

                  <div 
                    style={{ height: `${heightPercentage}%` }}
                    className={`w-full rounded-t-xs transition-all duration-500 ${
                      data.amount > 0 ? 'bg-blue-600 group-hover:bg-blue-500' : 'bg-slate-100'
                    }`}
                  />
                  <span className="text-[10px] text-slate-400 font-bold font-sans">{data.month}</span>
                </div>
              );
            })}
          </div>

          <p className="text-[10px] text-slate-400 text-center">Interactive monthly distribution charts derived from logged business tax invoices</p>
        </div>

        {/* Deliveries & Invoices Breakdowns (Col 1) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Transaction Activity Logs
          </h3>

          <div className="space-y-3 max-h-[250px] overflow-y-auto">
            {periodInvoices.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No business sales logged for this period.</p>
            ) : (
              periodInvoices.slice(0, 5).map(inv => (
                <div key={inv.id} className="p-3 border border-slate-100 rounded-lg flex justify-between items-center bg-slate-50/40">
                  <div>
                    <p className="font-bold text-slate-800 text-xs">{inv.customerName}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{inv.date} • {inv.invoiceNo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900">₹{inv.grandTotal.toFixed(2)}</p>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider">{inv.paymentMode}</p>
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
