import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { Clock, DollarSign, Plus, Award, BookOpen, ChevronRight, FileText } from 'lucide-react';

const SalaryManager = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [slipsHistory, setSlipsHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Salary Increment Form
  const [showIncrementForm, setShowIncrementForm] = useState(false);
  const [incrementAmount, setIncrementAmount] = useState('');
  
  // Pay Slip Disbursal Form
  const [showSlipForm, setShowSlipForm] = useState(false);
  const [baseSalary, setBaseSalary] = useState('');
  const [bonus, setBonus] = useState('0');
  const [deductions, setDeductions] = useState('0');
  const [payPeriod, setPayPeriod] = useState('June 2026');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/hr/employees');
      setEmployees(res.data.filter(u => u.role !== 'Super Admin'));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchSlipsHistory = async (empId) => {
    try {
      const res = await API.get(`/api/hr/salaries/history/${empId}`);
      setSlipsHistory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectEmp = (emp) => {
    setSelectedEmp(emp);
    setBaseSalary(emp.profile?.salary || '');
    fetchSlipsHistory(emp.id);
  };

  const handleApplyIncrement = async (e) => {
    e.preventDefault();
    if (!incrementAmount || !selectedEmp) return;

    const oldSalary = selectedEmp.profile?.salary || 0;
    const newSalary = oldSalary + parseFloat(incrementAmount);
    const todayStr = new Date().toISOString().split('T')[0];

    try {
      // 1. Update Employee Salary profile
      await API.put(`/api/hr/employees/${selectedEmp.id}`, {
        salary: newSalary
      });

      // 2. Publish Salary Announcement
      await API.post('/api/announcements', {
        title: `Salary Update: Congratulations to ${selectedEmp.profile?.first_name}!`,
        content: `Congratulations! Your salary has been updated. Old Salary: $${oldSalary.toLocaleString()}, New Salary: $${newSalary.toLocaleString()}, Effective Date: ${todayStr}.`,
        type: "Increment",
        metadata_json: JSON.stringify({ old_salary: oldSalary, new_salary: newSalary, effective_date: todayStr })
      });

      setShowIncrementForm(false);
      setIncrementAmount('');
      
      // Refresh
      const updatedEmployees = await API.get('/api/hr/employees');
      setEmployees(updatedEmployees.data.filter(u => u.role !== 'Super Admin'));
      const updatedSelected = updatedEmployees.data.find(u => u.id === selectedEmp.id);
      setSelectedEmp(updatedSelected);
      
      alert("Salary successfully updated and announcement published!");
    } catch (err) {
      console.error(err);
      alert("Failed to apply salary increment.");
    }
  };

  const handleDisburseSlip = async (e) => {
    e.preventDefault();
    if (!baseSalary || !selectedEmp) return;

    try {
      await API.post('/api/hr/salaries/slips', {
        employee_id: selectedEmp.id,
        base_salary: parseFloat(baseSalary),
        bonus: parseFloat(bonus) || 0,
        deductions: parseFloat(deductions) || 0,
        pay_period: payPeriod
      });

      setBonus('0');
      setDeductions('0');
      setShowSlipForm(false);
      fetchSlipsHistory(selectedEmp.id);
      alert("Pay slip disbursed successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to disburse pay slip.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-5 border-b border-enterprise-800">
        <h2 className="text-xl font-bold text-enterprise-50 flex items-center space-x-2">
          <DollarSign className="w-5 h-5 text-brand-success" />
          <span>Compensation & Payroll System</span>
        </h2>
        <p className="text-xs text-enterprise-400 mt-1">HR Panel: Manage base salary scaling, apply performance increments, and disburse monthly pay slips.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Staff Salary list */}
        <div className="bg-enterprise-900 border border-enterprise-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <h3 className="font-bold text-enterprise-100 text-sm pb-3 border-b border-enterprise-850 mb-4">Staff Compensation List</h3>
          
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-brand-primary"></div>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[400px]">
              {employees.map(emp => (
                <button
                  key={emp.id}
                  onClick={() => handleSelectEmp(emp)}
                  className={`w-full text-left p-3 border rounded-xl transition-all duration-150 flex items-center justify-between ${
                    selectedEmp?.id === emp.id
                      ? 'bg-brand-primary/10 border-brand-primary/40'
                      : 'bg-enterprise-950 border-enterprise-850 hover:border-enterprise-750'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-enterprise-200 text-xs">
                      {emp.profile ? `${emp.profile.first_name} ${emp.profile.last_name}` : emp.email}
                    </h4>
                    <p className="text-[10px] text-enterprise-500 mt-0.5">{emp.role} • {emp.profile?.employee_id}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-enterprise-100">
                      ${emp.profile?.salary.toLocaleString() || '0'}
                    </span>
                    <p className="text-[9px] text-enterprise-550 uppercase tracking-wider font-bold">Base Salary</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Columns: Detail Workspace */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedEmp ? (
            <div className="flex flex-col items-center justify-center py-28 text-enterprise-600 bg-enterprise-900 border border-enterprise-800 border-dashed rounded-xl h-full">
              <DollarSign className="w-12 h-12 opacity-20 mb-2" />
              <span className="text-xs font-semibold">Select an employee from the list to manage payroll</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Employee Salary Workspace Header */}
              <div className="bg-enterprise-900 border border-enterprise-800 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold text-brand-success uppercase tracking-wider">Active Workspace</span>
                  <h3 className="text-lg font-bold text-enterprise-100 mt-0.5">
                    {selectedEmp.profile?.first_name} {selectedEmp.profile?.last_name}
                  </h3>
                  <p className="text-xs text-enterprise-500">{selectedEmp.role} • {selectedEmp.profile?.employee_id} • Dept ID {selectedEmp.profile?.department_id}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => { setShowIncrementForm(true); setShowSlipForm(false); }}
                    className="py-1.5 px-3 bg-brand-warning/10 hover:bg-brand-warning/20 text-brand-warning border border-brand-warning/25 rounded-lg text-xs font-bold transition-all"
                  >
                    Apply Increment
                  </button>
                  <button
                    onClick={() => { setShowSlipForm(true); setShowIncrementForm(false); }}
                    className="py-1.5 px-3 bg-brand-primary hover:bg-brand-hover text-white rounded-lg text-xs font-bold shadow shadow-brand-primary/10 transition-all cursor-pointer"
                  >
                    Disburse Pay Slip
                  </button>
                </div>
              </div>

              {/* SALARY INCREMENT FORM */}
              {showIncrementForm && (
                <div className="p-6 bg-enterprise-900 border border-enterprise-800 rounded-xl shadow-sm space-y-4">
                  <h4 className="font-bold text-enterprise-100 text-sm">Increment Salary Base</h4>
                  <form onSubmit={handleApplyIncrement} className="flex items-end gap-4 text-xs">
                    <div className="space-y-2 flex-1">
                      <label className="block text-enterprise-450 font-bold uppercase tracking-wider text-[10px]">Increment Amount ($ Annual)</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-enterprise-500 font-bold">$</span>
                        <input
                          type="number"
                          required
                          value={incrementAmount}
                          onChange={(e) => setIncrementAmount(e.target.value)}
                          placeholder="e.g. 5000"
                          className="w-full pl-7 pr-4 py-2 bg-enterprise-950 border border-enterprise-850 rounded-xl text-enterprise-100 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowIncrementForm(false)}
                        className="py-2.5 px-4 bg-enterprise-805 hover:bg-enterprise-750 text-enterprise-300 rounded-xl font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="py-2.5 px-4 bg-brand-warning hover:bg-amber-600 text-enterprise-950 font-bold rounded-xl shadow"
                      >
                        Apply & Publish Notice
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* PAY SLIP DISBURSAL FORM */}
              {showSlipForm && (
                <div className="p-6 bg-enterprise-900 border border-enterprise-800 rounded-xl shadow-sm space-y-4">
                  <h4 className="font-bold text-enterprise-100 text-sm">Disburse Monthly Payroll Slip</h4>
                  <form onSubmit={handleDisburseSlip} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <label className="block text-enterprise-450 font-bold uppercase tracking-wider text-[10px]">Base Salary ($)</label>
                        <input
                          type="number"
                          required
                          value={baseSalary}
                          onChange={(e) => setBaseSalary(e.target.value)}
                          className="w-full px-3 py-2 bg-enterprise-950 border border-enterprise-850 rounded-xl text-enterprise-100 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-enterprise-450 font-bold uppercase tracking-wider text-[10px]">Performance Bonus ($)</label>
                        <input
                          type="number"
                          value={bonus}
                          onChange={(e) => setBonus(e.target.value)}
                          className="w-full px-3 py-2 bg-enterprise-950 border border-enterprise-850 rounded-xl text-enterprise-100 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-enterprise-450 font-bold uppercase tracking-wider text-[10px]">Deductions ($)</label>
                        <input
                          type="number"
                          value={deductions}
                          onChange={(e) => setDeductions(e.target.value)}
                          className="w-full px-3 py-2 bg-enterprise-950 border border-enterprise-850 rounded-xl text-enterprise-100 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-enterprise-450 font-bold uppercase tracking-wider text-[10px]">Pay Period</label>
                        <input
                          type="text"
                          required
                          value={payPeriod}
                          onChange={(e) => setPayPeriod(e.target.value)}
                          placeholder="June 2026"
                          className="w-full px-3 py-2 bg-enterprise-950 border border-enterprise-850 rounded-xl text-enterprise-100 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowSlipForm(false)}
                        className="py-2 px-4 bg-enterprise-800 hover:bg-enterprise-750 text-enterprise-300 rounded-xl font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="py-2 px-4 bg-brand-primary hover:bg-brand-hover text-white rounded-xl font-bold shadow cursor-pointer"
                      >
                        Disburse Pay Slip
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Slips History Table */}
              <div className="bg-enterprise-900 border border-enterprise-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                <h4 className="font-bold text-enterprise-100 text-xs pb-3 border-b border-enterprise-850 mb-4 flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-brand-primary" />
                  <span>Salary Slips History</span>
                </h4>
                
                {slipsHistory.length === 0 ? (
                  <div className="text-center py-8 text-xs text-enterprise-500 font-semibold">No pay slips issued yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-enterprise-950 text-enterprise-500 font-bold border-b border-enterprise-850">
                          <th className="p-3 uppercase tracking-wider">Pay Period</th>
                          <th className="p-3 uppercase tracking-wider">Base Salary</th>
                          <th className="p-3 uppercase tracking-wider">Bonus</th>
                          <th className="p-3 uppercase tracking-wider">Deductions</th>
                          <th className="p-3 uppercase tracking-wider font-extrabold text-enterprise-100">Net Salary</th>
                          <th className="p-3 uppercase tracking-wider">Issued Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-enterprise-850/50 text-enterprise-300">
                        {slipsHistory.map(slip => (
                          <tr key={slip.id} className="hover:bg-enterprise-950/40 transition-colors">
                            <td className="p-3 font-semibold text-brand-info">{slip.pay_period}</td>
                            <td className="p-3">${slip.base_salary.toLocaleString()}</td>
                            <td className="p-3 text-brand-success">+ ${slip.bonus.toLocaleString()}</td>
                            <td className="p-3 text-brand-danger">- ${slip.deductions.toLocaleString()}</td>
                            <td className="p-3 font-bold text-enterprise-100">${slip.net_salary.toLocaleString()}</td>
                            <td className="p-3 text-enterprise-500">{new Date(slip.issued_date).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalaryManager;
