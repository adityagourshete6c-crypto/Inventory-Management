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
  const pendingCount = totalEmployeesCount - (presentCount + halfDayCount + leaveCount + absentCount);

  // Month-Year calculations for salary
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

    const payableDays = presents + (halfDays * 0.5) + leaves; // assuming leaves are paid, absents/half-days deducted
    const actualWorkingDays = presents + halfDays + absents + leaves;
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
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search staff members by name or designation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 text-xs rounded-lg pl-9 pr-4 py-2.5 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => setIsEmployeeFormOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Plus size={14} />
            Hire New Employee
          </button>
        </div>

        {/* Employee Directory and Payroll Table */}
        <div className="bg-white rounded-xl shadow-2xs border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-150 bg-slate-50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
              <Award size={14} className="text-blue-600" />
              Staff Profiles & Monthly Payroll ({currentYearMonth})
            </h3>
            <span className="text-[10px] text-slate-400">Salary calculated pro-rata basis</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                <tr>
                  <th className="px-5 py-2.5">Staff Details</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                  <th className="px-3 py-2.5 text-right">Monthly Base</th>
                  <th className="px-3 py-2.5 text-center">Attendance ({currentYearMonth})</th>
                  <th className="px-3 py-2.5 text-right">Payable Payout</th>
                  <th className="px-5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                      No staff members logged. Click "Hire New Employee" to start.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map(emp => {
                    const stats = getEmployeeStatsForMonth(emp, currentYearMonth);
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-5 py-3">
                          <div className="font-bold text-slate-800">{emp.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{emp.role} • {emp.phone}</div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={() => toggleEmployeeActive(emp.id)}
                            className={`px-2 py-0.5 rounded-full font-bold text-[9px] cursor-pointer hover:opacity-80 transition-opacity ${
                              emp.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {emp.isActive ? 'Active' : 'On Leave / Out'}
                          </button>
                        </td>
                        <td className="px-3 py-3 text-right font-medium text-slate-700">
                          ₹{emp.salary.toLocaleString('en-IN')}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <div className="text-[10px] text-slate-600 font-medium">
                            {stats.presents}P • {stats.halfDays}H • {stats.leaves}L • {stats.absents}A
                          </div>
                          <div className="text-[9px] text-slate-400 mt-0.5">Payable Days: {stats.payableDays}</div>
                        </td>
                        <td className="px-3 py-3 text-right font-bold text-slate-900">
                          ₹{Math.round(stats.payableSalary).toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => toggleEmployeeActive(emp.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                          >
                            {emp.isActive ? 'Deactivate' : 'Reactivate'}
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

      {/* COLUMN 3: Daily Attendance Register (Today) */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white rounded-xl shadow-2xs border border-slate-200 overflow-hidden flex flex-col min-h-[400px]">
          
          <div className="p-4 bg-slate-50 border-b border-slate-150 space-y-3">
            <h3 className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
              <UserCheck size={14} className="text-emerald-600" />
              Daily Attendance Register
            </h3>
            
            {/* Date Picker */}
            <div className="relative">
              <Calendar className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-white border border-slate-200 text-xs rounded-lg pl-8 pr-3 py-2 font-semibold text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-4 border-b border-slate-100 p-3 bg-slate-50/30 text-center gap-1">
            <div className="bg-emerald-50 rounded-md p-1">
              <div className="text-xs font-bold text-emerald-800">{presentCount}</div>
              <div className="text-[8px] text-emerald-600 font-medium">Present</div>
            </div>
            <div className="bg-amber-50 rounded-md p-1">
              <div className="text-xs font-bold text-amber-800">{halfDayCount}</div>
              <div className="text-[8px] text-amber-600 font-medium">Half-Day</div>
            </div>
            <div className="bg-blue-50 rounded-md p-1">
              <div className="text-xs font-bold text-blue-800">{leaveCount}</div>
              <div className="text-[8px] text-blue-600 font-medium">Leave</div>
            </div>
            <div className="bg-red-50 rounded-md p-1">
              <div className="text-xs font-bold text-red-800">{absentCount}</div>
              <div className="text-[8px] text-red-600 font-medium">Absent</div>
            </div>
          </div>

          {/* Staff Attendance Action List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {employees.filter(e => e.isActive).length === 0 ? (
              <p className="text-center text-[11px] text-slate-400 py-6">No active employees to mark attendance.</p>
            ) : (
              employees.filter(e => e.isActive).map(emp => {
                const status = emp.attendance[selectedDate];
                return (
                  <div key={emp.id} className="p-3 border border-slate-100 rounded-lg flex flex-col gap-2 bg-slate-50/20">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800 text-xs">{emp.name}</span>
                      <span className="text-[9px] text-slate-400 font-medium">{emp.role}</span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {(['Present', 'Half-Day', 'Leave', 'Absent'] as const).map(option => {
                        const isSel = status === option;
                        let btnColor = 'bg-white hover:bg-slate-50 text-slate-500 border-slate-200';
                        if (isSel) {
                          if (option === 'Present') btnColor = 'bg-emerald-600 text-white border-emerald-600 font-bold';
                          else if (option === 'Half-Day') btnColor = 'bg-amber-500 text-white border-amber-500 font-bold';
                          else if (option === 'Leave') btnColor = 'bg-blue-500 text-white border-blue-500 font-bold';
                          else if (option === 'Absent') btnColor = 'bg-red-500 text-white border-red-500 font-bold';
                        }
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => handleMarkAttendance(emp.id, option)}
                            className={`py-1 text-[9px] rounded-md border transition-all truncate cursor-pointer ${btnColor}`}
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 text-sm">Hire New Staff Member</h3>
              <button onClick={() => setIsEmployeeFormOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-medium">✕</button>
            </div>
            <form onSubmit={handleAddEmployee} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Employee Full Name *</label>
                <input
                  type="text"
                  required
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. Karan Patel"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Designation / Role</label>
                  <input
                    type="text"
                    value={empRole}
                    onChange={(e) => setEmpRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g. Accounts Exec"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Contact Phone *</label>
                  <input
                    type="text"
                    required
                    value={empPhone}
                    onChange={(e) => setEmpPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g. +91 95432 00000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Monthly Salary (₹) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={empSalary || ''}
                    onChange={(e) => setEmpSalary(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    placeholder="₹ 15000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Joining Date</label>
                  <input
                    type="date"
                    required
                    value={empJoinDate}
                    onChange={(e) => setEmpJoinDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="px-6 py-4 -mx-6 -mb-6 bg-slate-50 border-t border-slate-150 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEmployeeFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
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
