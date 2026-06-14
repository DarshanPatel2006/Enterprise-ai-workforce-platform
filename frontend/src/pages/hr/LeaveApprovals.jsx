import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { CalendarRange, Check, X, AlertCircle } from 'lucide-react';

const LeaveApprovals = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pending'); // Pending, Approved, Rejected

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leavesRes, empRes] = await Promise.all([
        API.get('/api/hr/leaves'),
        API.get('/api/hr/employees')
      ]);
      setLeaveRequests(leavesRes.data);
      setEmployees(empRes.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleResolve = async (id, status) => {
    try {
      await API.put(`/api/hr/leaves/${id}/resolve`, { status });
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to resolve leave request");
    }
  };

  const filteredRequests = leaveRequests.filter(req => req.status === filter);

  const getEmpName = (empId) => {
    const emp = employees.find(e => e.id === empId);
    return emp && emp.profile ? `${emp.profile.first_name} ${emp.profile.last_name}` : `Staff #${empId}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-5 border-b border-enterprise-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-enterprise-50 flex items-center space-x-2">
            <CalendarRange className="w-5 h-5 text-brand-primary" />
            <span>Leave Requests Management</span>
          </h2>
          <p className="text-xs text-enterprise-400 mt-1">HR Panel: Approve or reject employee leave requests and review leave balances.</p>
        </div>

        {/* Filters */}
        <div className="flex bg-enterprise-900 border border-enterprise-850 p-1 rounded-xl text-xs font-semibold">
          {['Pending', 'Approved', 'Rejected'].map(state => (
            <button
              key={state}
              onClick={() => setFilter(state)}
              className={`py-1.5 px-4 rounded-lg transition-all ${
                filter === state
                  ? 'bg-brand-primary text-white shadow-md'
                  : 'text-enterprise-400 hover:text-enterprise-250'
              }`}
            >
              {state}
            </button>
          ))}
        </div>
      </div>

      {/* Requests table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-primary"></div>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-16 bg-enterprise-900 border border-enterprise-800 rounded-xl">
          <CalendarRange className="w-12 h-12 text-enterprise-750 mx-auto mb-3" />
          <p className="text-sm text-enterprise-500 font-semibold">No {filter.toLowerCase()} leave requests.</p>
        </div>
      ) : (
        <div className="bg-enterprise-900 border border-enterprise-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-enterprise-950 text-enterprise-500 font-bold border-b border-enterprise-850">
                  <th className="p-4 uppercase tracking-wider">Employee</th>
                  <th className="p-4 uppercase tracking-wider">Leave Type</th>
                  <th className="p-4 uppercase tracking-wider">Duration</th>
                  <th className="p-4 uppercase tracking-wider">Total Days</th>
                  <th className="p-4 uppercase tracking-wider">Reason</th>
                  <th className="p-4 uppercase tracking-wider">Date Applied</th>
                  {filter === 'Pending' && <th className="p-4 uppercase tracking-wider text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-enterprise-850/50 text-enterprise-300">
                {filteredRequests.map(req => {
                  const start = new Date(req.start_date);
                  const end = new Date(req.end_date);
                  const days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
                  
                  return (
                    <tr key={req.id} className="hover:bg-enterprise-950/40 transition-colors">
                      <td className="p-4 font-semibold text-enterprise-100">{getEmpName(req.employee_id)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          req.leave_type === 'Sick' 
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                            : req.leave_type === 'Annual'
                            ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20'
                            : 'bg-enterprise-800 text-enterprise-400 border border-enterprise-750'
                        }`}>
                          {req.leave_type}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-enterprise-450">{req.start_date} to {req.end_date}</td>
                      <td className="p-4 font-bold text-enterprise-300">{days} day{days > 1 ? 's' : ''}</td>
                      <td className="p-4 text-enterprise-350 italic max-w-xs truncate">" {req.reason} "</td>
                      <td className="p-4 text-enterprise-500 font-semibold">{new Date(req.created_at).toLocaleDateString()}</td>
                      
                      {filter === 'Pending' && (
                        <td className="p-4 text-right flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleResolve(req.id, 'Approved')}
                            className="p-1.5 bg-emerald-950/30 border border-emerald-500/30 text-brand-success hover:bg-emerald-900/30 rounded-lg transition-colors cursor-pointer"
                            title="Approve Leave"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleResolve(req.id, 'Rejected')}
                            className="p-1.5 bg-red-950/30 border border-red-500/30 text-brand-danger hover:bg-red-900/30 rounded-lg transition-colors cursor-pointer"
                            title="Reject Leave"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveApprovals;
