/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Employee } from '../types';
import { Search, Plus, Calendar, CheckCircle2, XCircle, AlertCircle, Award, UserCheck, DollarSign } from 'lucide-react';

interface EmployeeManagerProps {
  employees: Employee[];
  onUpdateEmployees: (newEmployees: Employee[]) => void;
}

export default function EmployeeManager({ employees, onUpdateEmployees }: EmployeeManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [isEmployeeFormOpen, setIsEmployeeFormOpen] = useState(false);

  // Form State
  const [empName, setEmpName] = useState('');
  const [empRole, setEmpRole] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empSalary, setEmpSalary] = useState(0);
  const [empJoinDate, setEmpJoinDate] = useState(new Date().toISOString().slice(0, 10));

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim()) return;

    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      name: empName,
      role: empRole || 'Staff',
      phone: empPhone,
      salary: empSalary,
      joiningDate: empJoinDate,
      isActive: true,
      attendance: {},
    };

    onUpdateEmployees([...employees, newEmp]);
    setIsEmployeeFormOpen(false);

    // reset
    setEmpName('');
    setEmpRole('');
    setEmpPhone('');
    setEmpSalary(0);
  };

  const handleMarkAttendance = (empId: string, status: 'Present' | 'Absent' | 'Leave' | 'Half-Day') => {
    const updated = employees.map(emp => {
      if (emp.id === empId) {
        return {
          ...emp,
          attendance: {
            ...emp.attendance,
            [selectedDate]: status
          }
        };
      }
      return emp;
    });
    onUpdateEmployees(updated);
  };

  const toggleEmployeeActive = (id: string) => {
    const updated = employees.map(emp => {
      if (emp.id === id) {
        return { ...emp, isActive: !emp.isActive };
      }
      return emp;
    });
    onUpdateEmployees(updated);
  };

  // Compute stats for selected date
  const totalEmployeesCount = employees.filter(e => e.isActive).length;
  const presentCount = employees.filter(e => e.isActive && e.attendance[selectedDate] === 'Present').length;
  const halfDayCount = employees.filter(e => e.isActive && e.attendance[selectedDate] === 'Half-Day').length;
  const leaveCount = employees.filter(e => e.isActive && e.attendance[selectedDate] === 'Leave').length;
  const absentCount = employees.filter(e => e.isActive && e.attendance[selectedDate] === 'Absent').length;

  const currentYearMonth = selectedDate.slice(0, 7); // e.g. "2026-07"
  
  const getEmployeeStatsForMonth = (emp: Employee, yearMonth: string) => {
    let presents = 0;
    let absents = 0;
    let leaves = 0;
    let halfDays = 0;

    Object.entries(emp.attendance).forEach(([date, status]) => {
      if (date.startsWith(yearMonth)) {
        if (status === 'Present') presents++;
        else if (status === 'Absent') absents++;
        else if (status === 'Leave') leaves++;
        else if (status === 'Half-Day') halfDays++;
      }
    });

    const payableDays = presents + (halfDays * 0.5) + leaves;
    const unpaidAbsents = absents + (halfDays * 0.5);
    const dayRate = emp.salary / 30; // standard 30-day calculation
    const payableSalary = Math.max(0, emp.salary - (unpaidAbsents * dayRate));

    return {
      presents,
      absents,
      leaves,
      halfDays,
      payableDays,
      payableSalary,
    };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="employee-manager-container">
      
      {/* COLUMN 1 & 2: Employee Profiles & Salary Book */}
      <div className="lg:col-span-2 space-y-4">
        
        {/* Search and Action Header */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-black" />
            <input
              type="text"
              placeholder="Search staff members by name or designation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border-2 border-[#1A1A1A] text-xs pl-10 pr-4 py-3 focus:outline-none rounded-none"
            />
          </div>

          <button
            onClick={() => setIsEmployeeFormOpen(true)}
            className="px-4 py-3 bg-black hover:bg-white hover:text-black border-2 border-black text-white text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 rounded-none cursor-pointer"
          >
            <Plus size={14} />
            Hire New Employee
          </button>
        </div>

        {/* Employee Directory and Payroll Table */}
        <div className="bg-white border-2 border-[#1A1A1A] rounded-none overflow-hidden">
          <div className="px-5 py-4 border-b-2 border-[#1A1A1A] bg-[#F9F9F7] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h3 className="font-black text-[#1A1A1A] text-xs uppercase tracking-widest flex items-center gap-1.5 font-display italic">
              <Award size={14} className="text-black" />
              Staff Profiles & Monthly Payroll Ledger ({currentYearMonth})
            </h3>
            <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Salary computed on pro-rata basis</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F9F9F7] border-b border-black text-[#1A1A1A] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Staff Details</th>
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-3 py-3 text-right">Monthly Base</th>
                  <th className="px-3 py-3 text-center">Attendance ({currentYearMonth})</th>
                  <th className="px-3 py-3 text-right">Payable Payout</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-400 font-medium">
                      No staff members currently registered. Click "Hire New Employee" to start.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map(emp => {
                    const stats = getEmployeeStatsForMonth(emp, currentYearMonth);
                    return (
                      <tr key={emp.id} className="hover:bg-[#F9F9F7]/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-bold text-[#1A1A1A]">{emp.name}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{emp.role} • {emp.phone}</div>
                        </td>
                        <td className="px-3 py-4 text-center">
                          <button
                            onClick={() => toggleEmployeeActive(emp.id)}
                            className={`px-3 py-1 font-black text-[9px] uppercase border transition-all cursor-pointer ${
                              emp.isActive 
                                ? 'bg-emerald-50 border-emerald-600 text-emerald-800' 
                                : 'bg-slate-50 border-slate-300 text-slate-500'
                            }`}
                          >
                            {emp.isActive ? 'Active' : 'Out / Inactive'}
                          </button>
                        </td>
                        <td className="px-3 py-4 text-right font-bold text-slate-600 font-mono">
                          ₹{emp.salary.toLocaleString('en-IN')}
                        </td>
                        <td className="px-3 py-4 text-center">
                          <div className="text-[10px] text-[#1A1A1A] font-bold font-mono">
                            {stats.presents}P • {stats.halfDays}H • {stats.leaves}L • {stats.absents}A
                          </div>
                          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Paid Days: {stats.payableDays}</div>
                        </td>
                        <td className="px-3 py-4 text-right font-black text-[#1A1A1A] font-mono">
                          ₹{Math.round(stats.payableSalary).toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => toggleEmployeeActive(emp.id)}
                            className="text-xs text-black font-bold uppercase tracking-wider hover:underline cursor-pointer"
                          >
                            {emp.isActive ? 'Suspend' : 'Reinstate'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* COLUMN 3: Daily Attendance Register */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white border-2 border-[#1A1A1A] rounded-none overflow-hidden flex flex-col min-h-[450px]">
          
          <div className="p-4 bg-[#F9F9F7] border-b-2 border-[#1A1A1A] space-y-3">
            <h3 className="font-black text-[#1A1A1A] text-xs uppercase tracking-widest flex items-center gap-1.5 font-display italic">
              <UserCheck size={14} className="text-black" />
              Daily Attendance Register
            </h3>
            
            {/* Date Picker */}
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-black pointer-events-none" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-white border-2 border-black text-xs pl-10 pr-3 py-2.5 font-black uppercase tracking-wider text-[#1A1A1A] rounded-none focus:outline-none"
              />
            </div>
          </div>

          {/* Quick stats - Editorial layout */}
          <div className="grid grid-cols-4 border-b border-[#1A1A1A] p-2 bg-[#F9F9F7]/40 text-center gap-1">
            <div className="border border-emerald-600 bg-emerald-50/50 p-1 rounded-none">
              <div className="text-xs font-black font-mono text-emerald-800">{presentCount}</div>
              <div className="text-[8px] font-bold text-emerald-600 uppercase tracking-wider">Present</div>
            </div>
            <div className="border border-amber-500 bg-amber-50/50 p-1 rounded-none">
              <div className="text-xs font-black font-mono text-amber-800">{halfDayCount}</div>
              <div className="text-[8px] font-bold text-amber-600 uppercase tracking-wider">Half</div>
            </div>
            <div className="border border-blue-600 bg-blue-50/50 p-1 rounded-none">
              <div className="text-xs font-black font-mono text-blue-800">{leaveCount}</div>
              <div className="text-[8px] font-bold text-blue-600 uppercase tracking-wider">Leave</div>
            </div>
            <div className="border border-red-600 bg-red-50/50 p-1 rounded-none">
              <div className="text-xs font-black font-mono text-red-800">{absentCount}</div>
              <div className="text-[8px] font-bold text-red-600 uppercase tracking-wider">Absent</div>
            </div>
          </div>

          {/* Staff Attendance Action List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {employees.filter(e => e.isActive).length === 0 ? (
              <p className="text-center text-[10px] uppercase font-bold text-slate-400 py-10">No active employees to mark attendance.</p>
            ) : (
              employees.filter(e => e.isActive).map(emp => {
                const status = emp.attendance[selectedDate];
                return (
                  <div key={emp.id} className="p-3.5 border border-[#1A1A1A] rounded-none flex flex-col gap-2 bg-white">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#1A1A1A] text-xs">{emp.name}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{emp.role}</span>
                    </div>

                    <div className="grid grid-cols-4 gap-1">
                      {(['Present', 'Half-Day', 'Leave', 'Absent'] as const).map(option => {
                        const isSel = status === option;
                        let btnColor = 'bg-white hover:bg-slate-50 text-[#1A1A1A] border-slate-300';
                        if (isSel) {
                          if (option === 'Present') btnColor = 'bg-black text-white border-black font-black';
                          else if (option === 'Half-Day') btnColor = 'bg-amber-500 text-white border-amber-500 font-black';
                          else if (option === 'Leave') btnColor = 'bg-blue-600 text-white border-blue-600 font-black';
                          else if (option === 'Absent') btnColor = 'bg-red-600 text-white border-red-600 font-black';
                        }
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => handleMarkAttendance(emp.id, option)}
                            className={`py-1.5 text-[8px] font-black uppercase border rounded-none transition-all truncate cursor-pointer text-center ${btnColor}`}
                          >
                            {option === 'Half-Day' ? 'Half' : option}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>

      {/* Hire Modal */}
      {isEmployeeFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-40">
          <div className="bg-white border-2 border-[#1A1A1A] rounded-none max-w-sm w-full overflow-hidden shadow-none">
            <div className="px-6 py-5 bg-[#F9F9F7] border-b-2 border-[#1A1A1A] flex justify-between items-center">
              <h3 className="font-black uppercase tracking-widest text-xs text-[#1A1A1A] font-display italic">Hire New Staff Member</h3>
              <button onClick={() => setIsEmployeeFormOpen(false)} className="text-black hover:opacity-75 font-black cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleAddEmployee} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] mb-1.5">Employee Full Name *</label>
                <input
                  type="text"
                  required
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  className="w-full bg-white border border-[#1A1A1A] p-3 text-xs focus:ring-1 focus:ring-black focus:outline-none"
                  placeholder="e.g. Karan Patel"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] mb-1.5">Designation / Role</label>
                  <input
                    type="text"
                    value={empRole}
                    onChange={(e) => setEmpRole(e.target.value)}
                    className="w-full bg-white border border-[#1A1A1A] p-3 text-xs focus:ring-1 focus:ring-black focus:outline-none"
                    placeholder="e.g. Accounts Exec"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] mb-1.5">Contact Phone *</label>
                  <input
                    type="text"
                    required
                    value={empPhone}
                    onChange={(e) => setEmpPhone(e.target.value)}
                    className="w-full bg-white border border-[#1A1A1A] p-3 text-xs focus:ring-1 focus:ring-black focus:outline-none"
                    placeholder="e.g. +91 95432 00000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] mb-1.5">Monthly Salary (₹) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={empSalary || ''}
                    onChange={(e) => setEmpSalary(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-white border border-[#1A1A1A] p-3 text-xs focus:ring-1 focus:ring-black focus:outline-none font-bold font-mono"
                    placeholder="15000"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] mb-1.5">Joining Date</label>
                  <input
                    type="date"
                    required
                    value={empJoinDate}
                    onChange={(e) => setEmpJoinDate(e.target.value)}
                    className="w-full bg-white border border-[#1A1A1A] p-2.5 text-xs focus:ring-1 focus:ring-black focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEmployeeFormOpen(false)}
                  className="px-5 py-3 border-2 border-slate-300 text-slate-700 text-xs font-bold uppercase tracking-widest hover:bg-slate-100 transition-colors rounded-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-3 bg-[#1A1A1A] hover:bg-white hover:text-black border-2 border-[#1A1A1A] text-white text-xs font-black uppercase tracking-widest transition-colors rounded-none cursor-pointer"
                >
                  Confirm Hiring
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
