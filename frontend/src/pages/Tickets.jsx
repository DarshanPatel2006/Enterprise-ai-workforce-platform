import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import { 
  HelpCircle, Plus, Send, CheckCircle2, AlertCircle, MessageSquare 
} from 'lucide-react';

const Tickets = () => {
  const { user } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Create Ticket Form State
  const [category, setCategory] = useState('General');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Resolve Ticket Form State
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [responseMsg, setResponseMsg] = useState('');
  const [resolveStatus, setResolveStatus] = useState('Resolved');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const endpoint = (user.role === 'HR' || user.role === 'Super Admin') 
        ? '/api/tickets/all' 
        : '/api/tickets/my';
      const res = await API.get(endpoint);
      setTickets(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    try {
      await API.post('/api/tickets', { category, title, description });
      setTitle('');
      setDescription('');
      setShowCreateForm(false);
      fetchTickets();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveTicket = async (e) => {
    e.preventDefault();
    if (!responseMsg.trim()) return;

    try {
      await API.put(`/api/tickets/${selectedTicket.id}/resolve`, {
        response: responseMsg,
        status: resolveStatus
      });
      setSelectedTicket(null);
      setResponseMsg('');
      fetchTickets();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Open':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-danger/10 text-brand-danger border border-brand-danger/25">Open</span>;
      case 'In Progress':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-warning/10 text-brand-warning border border-brand-warning/25">In Progress</span>;
      case 'Resolved':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-success/10 text-brand-success border border-brand-success/25">Resolved</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-enterprise-800 text-enterprise-400 border border-enterprise-700">Closed</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-5 border-b border-enterprise-800 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-enterprise-50 flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-brand-primary" />
            <span>Support Tickets</span>
          </h2>
          <p className="text-xs text-enterprise-400 mt-1">
            {(user.role === 'HR' || user.role === 'Super Admin')
              ? 'Review and respond to active internal employee support requests.'
              : 'File salary issues, attendance discrepancies, device needs, or general inquiries.'}
          </p>
        </div>

        {user.role === 'Employee' && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="py-2 px-4 bg-brand-primary hover:bg-brand-hover text-white rounded-xl text-xs font-semibold shadow-lg shadow-brand-primary/10 transition-colors flex items-center space-x-1 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>File New Ticket</span>
          </button>
        )}
      </div>

      {/* CREATE TICKET FORM MODAL/DRAWER (EMPLOYEE ONLY) */}
      {showCreateForm && user.role === 'Employee' && (
        <div className="p-6 bg-enterprise-900 border border-enterprise-800 rounded-xl shadow-sm space-y-4">
          <h3 className="font-bold text-enterprise-100 text-sm">Submit Support Ticket</h3>
          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-enterprise-400 uppercase tracking-wider">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 bg-enterprise-950 border border-enterprise-800 focus:border-brand-primary rounded-xl text-xs text-enterprise-100 focus:outline-none"
                >
                  <option value="Salary">Salary Issue</option>
                  <option value="Attendance">Attendance Discrepancy</option>
                  <option value="Leave">Leave Inquiry</option>
                  <option value="Device">Device / Asset Request</option>
                  <option value="General">General Inquiry</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-enterprise-400 uppercase tracking-wider">Ticket Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Missing bonus for May 2026"
                  className="w-full px-4 py-2 bg-enterprise-950 border border-enterprise-800 focus:border-brand-primary rounded-xl text-xs text-enterprise-100 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-enterprise-400 uppercase tracking-wider">Description</label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail the issue or request. Please provide dates or specific values where applicable."
                className="w-full h-[100px] p-4 bg-enterprise-950 border border-enterprise-800 focus:border-brand-primary rounded-xl text-xs text-enterprise-100 focus:outline-none"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="py-2 px-4 bg-enterprise-800 hover:bg-enterprise-750 text-enterprise-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2 px-4 bg-brand-primary hover:bg-brand-hover text-white rounded-xl text-xs font-semibold shadow"
              >
                Submit Ticket
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RESOLVE TICKET MODAL OVERLAY (HR/ADMIN ONLY) */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6">
          <div className="w-full max-w-lg bg-enterprise-900 border border-enterprise-800 rounded-2xl shadow-xl p-6">
            <h3 className="font-extrabold text-white text-base mb-2">Respond to Ticket ID {selectedTicket.id}</h3>
            <div className="bg-enterprise-950 border border-enterprise-850 p-4 rounded-xl mb-4 text-xs">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-enterprise-400">Category: {selectedTicket.category}</span>
                {getStatusBadge(selectedTicket.status)}
              </div>
              <h4 className="font-bold text-enterprise-200 text-sm mb-1">{selectedTicket.title}</h4>
              <p className="text-enterprise-400 leading-relaxed italic">" {selectedTicket.description} "</p>
            </div>

            <form onSubmit={handleResolveTicket} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-enterprise-400 uppercase tracking-wider">Action State</label>
                  <select
                    value={resolveStatus}
                    onChange={(e) => setResolveStatus(e.target.value)}
                    className="w-full px-4 py-2 bg-enterprise-950 border border-enterprise-850 rounded-xl text-xs text-enterprise-100 focus:outline-none"
                  >
                    <option value="Resolved">Mark as Resolved</option>
                    <option value="In Progress">Move to In Progress</option>
                    <option value="Closed">Close Ticket</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-enterprise-400 uppercase tracking-wider">Response Details</label>
                <textarea
                  required
                  value={responseMsg}
                  onChange={(e) => setResponseMsg(e.target.value)}
                  placeholder="Provide resolution details or requested adjustments..."
                  className="w-full h-[120px] p-4 bg-enterprise-950 border border-enterprise-850 focus:border-brand-primary rounded-xl text-xs text-enterprise-100 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="py-2 px-4 bg-enterprise-800 hover:bg-enterprise-750 text-enterprise-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-brand-primary hover:bg-brand-hover text-white rounded-xl text-xs font-semibold shadow"
                >
                  Submit Response
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TICKETS LIST TABLE */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-primary"></div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 bg-enterprise-900 border border-enterprise-800 rounded-xl">
          <HelpCircle className="w-12 h-12 text-enterprise-750 mx-auto mb-3" />
          <p className="text-sm text-enterprise-500 font-semibold">No tickets filed yet.</p>
        </div>
      ) : (
        <div className="bg-enterprise-900 border border-enterprise-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-enterprise-950 text-enterprise-500 font-bold border-b border-enterprise-850">
                  <th className="p-4 uppercase tracking-wider">ID</th>
                  <th className="p-4 uppercase tracking-wider">Category</th>
                  <th className="p-4 uppercase tracking-wider">Title</th>
                  <th className="p-4 uppercase tracking-wider">Status</th>
                  <th className="p-4 uppercase tracking-wider">Filed Date</th>
                  <th className="p-4 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-enterprise-850/50">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-enterprise-950/40 transition-colors">
                    <td className="p-4 text-enterprise-300 font-bold"># {t.id}</td>
                    <td className="p-4 font-semibold text-enterprise-450">{t.category}</td>
                    <td className="p-4">
                      <p className="font-semibold text-enterprise-100 leading-snug">{t.title}</p>
                      <p className="text-[10px] text-enterprise-500 line-clamp-1 mt-0.5">{t.description}</p>
                      {t.response && (
                        <div className="mt-2 p-2 bg-enterprise-950 border border-enterprise-850/30 rounded text-[10px] leading-relaxed text-brand-info">
                          <strong>Response:</strong> {t.response}
                        </div>
                      )}
                    </td>
                    <td className="p-4">{getStatusBadge(t.status)}</td>
                    <td className="p-4 text-enterprise-500 font-semibold">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      {(user.role === 'HR' || user.role === 'Super Admin') && t.status !== 'Closed' ? (
                        <button
                          onClick={() => {
                            setSelectedTicket(t);
                            setResponseMsg(t.response || '');
                          }}
                          className="py-1 px-3 bg-enterprise-850 hover:bg-enterprise-750 text-enterprise-200 rounded font-semibold text-[10px]"
                        >
                          Respond
                        </button>
                      ) : (
                        <span className="text-[10px] text-enterprise-600 font-bold">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tickets;
