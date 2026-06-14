import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { Users, Plus, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';

const HrAccounts = () => {
  const [hrAccounts, setHrAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [salary, setSalary] = useState('');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchHrAccounts();
  }, []);

  const fetchHrAccounts = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/hr/employees');
      // Filter only users with role === 'HR'
      const hrs = res.data.filter(u => u.role === 'HR');
      setHrAccounts(hrs);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleCreateHr = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await API.post('/api/admin/hr', {
        employee_id: employeeId,
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        salary: parseFloat(salary) || 0,
        joining_date: joiningDate,
        role: "HR",
        leave_balance: 24,
        attendance_percentage: 100.0,
        status: "active"
      });
      // Clear fields
      setEmployeeId('');
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setSalary('');
      setShowAddForm(false);
      fetchHrAccounts();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Failed to create HR account");
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await API.put(`/api/admin/hr/${userId}/toggle`);
      fetchHrAccounts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-5 border-b border-enterprise-800 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-enterprise-50 flex items-center space-x-2">
            <Users className="w-5 h-5 text-brand-primary" />
            <span>HR Accounts Management</span>
          </h2>
          <p className="text-xs text-enterprise-400 mt-1">Super Admin Panel: Register, audit, and activate/deactivate HR officer accounts.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="py-2 px-4 bg-brand-primary hover:bg-brand-hover text-white rounded-xl text-xs font-semibold shadow transition-colors cursor-pointer flex items-center space-x-1"
        >
          <Plus className="w-4 h-4" />
          <span>Add HR Account</span>
        </button>
      </div>

      {/* CREATE HR FORM */}
      {showAddForm && (
        <div className="p-6 bg-enterprise-900 border border-enterprise-800 rounded-xl shadow-sm space-y-4">
          <h3 className="font-bold text-enterprise-100 text-sm">Create New HR Profile</h3>
          {errorMsg && (
            <div className="p-2.5 bg-red-950/20 border border-red-500/30 rounded-lg text-xs font-bold text-brand-danger">
              {errorMsg}
            </div>
          )}
          <form onSubmit={handleCreateHr} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-enterprise-400 uppercase tracking-wider">Employee ID</label>
                <input
                  type="text"
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="e.g. HR-102"
                  className="w-full px-4 py-2 bg-enterprise-950 border border-enterprise-850 focus:border-brand-primary rounded-xl text-xs text-enterprise-100 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-enterprise-400 uppercase tracking-wider">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="w-full px-4 py-2 bg-enterprise-950 border border-enterprise-850 focus:border-brand-primary rounded-xl text-xs text-enterprise-100 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-enterprise-400 uppercase tracking-wider">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full px-4 py-2 bg-enterprise-950 border border-enterprise-850 focus:border-brand-primary rounded-xl text-xs text-enterprise-100 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-enterprise-400 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@company.ai"
                  className="w-full px-4 py-2 bg-enterprise-950 border border-enterprise-850 focus:border-brand-primary rounded-xl text-xs text-enterprise-100 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-enterprise-400 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 bg-enterprise-950 border border-enterprise-850 focus:border-brand-primary rounded-xl text-xs text-enterprise-100 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-enterprise-400 uppercase tracking-wider">Base Salary</label>
                <input
                  type="number"
                  required
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder="85000"
                  className="w-full px-4 py-2 bg-enterprise-950 border border-enterprise-850 focus:border-brand-primary rounded-xl text-xs text-enterprise-100 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="py-2 px-4 bg-enterprise-800 hover:bg-enterprise-750 text-enterprise-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2 px-4 bg-brand-primary hover:bg-brand-hover text-white rounded-xl text-xs font-semibold shadow"
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* HR LIST TABLE */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-primary"></div>
        </div>
      ) : hrAccounts.length === 0 ? (
        <div className="text-center py-16 bg-enterprise-900 border border-enterprise-800 rounded-xl">
          <Users className="w-12 h-12 text-enterprise-750 mx-auto mb-3" />
          <p className="text-sm text-enterprise-500 font-semibold">No HR Accounts registered.</p>
        </div>
      ) : (
        <div className="bg-enterprise-900 border border-enterprise-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-enterprise-950 text-enterprise-500 font-bold border-b border-enterprise-850">
                <th className="p-4 uppercase tracking-wider">ID</th>
                <th className="p-4 uppercase tracking-wider">Name</th>
                <th className="p-4 uppercase tracking-wider">Email</th>
                <th className="p-4 uppercase tracking-wider">Salary</th>
                <th className="p-4 uppercase tracking-wider">Status</th>
                <th className="p-4 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-enterprise-850/50">
              {hrAccounts.map((hr) => (
                <tr key={hr.id} className="hover:bg-enterprise-950/40 transition-colors">
                  <td className="p-4 font-bold text-enterprise-300">
                    {hr.profile ? hr.profile.employee_id : `User-${hr.id}`}
                  </td>
                  <td className="p-4 font-semibold text-enterprise-100">
                    {hr.profile ? `${hr.profile.first_name} ${hr.profile.last_name}` : 'HR Officer'}
                  </td>
                  <td className="p-4 font-semibold text-enterprise-450">{hr.email}</td>
                  <td className="p-4 font-semibold text-enterprise-350">
                    {hr.profile ? `$${hr.profile.salary.toLocaleString()}` : '-'}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      hr.is_active 
                        ? 'bg-brand-success/15 text-brand-success border border-brand-success/30' 
                        : 'bg-brand-danger/15 text-brand-danger border border-brand-danger/30'
                    }`}>
                      {hr.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      <span>{hr.is_active ? 'Active' : 'Disabled'}</span>
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleToggleStatus(hr.id)}
                      className={`py-1 px-3.5 rounded font-bold text-[10px] transition-colors ${
                        hr.is_active 
                          ? 'bg-red-950/25 hover:bg-red-950/45 text-brand-danger border border-brand-danger/25'
                          : 'bg-emerald-950/25 hover:bg-emerald-950/45 text-brand-success border border-brand-success/25'
                      }`}
                    >
                      {hr.is_active ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HrAccounts;
