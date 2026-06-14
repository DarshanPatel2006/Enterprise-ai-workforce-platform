import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { ShieldAlert, BarChart3, Search, RefreshCw } from 'lucide-react';

const SystemLogs = () => {
  const [activeSubTab, setActiveSubTab] = useState('audit'); // audit, ai
  const [auditLogs, setAuditLogs] = useState([]);
  const [aiLogs, setAiLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [activeSubTab]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      if (activeSubTab === 'audit') {
        const res = await API.get('/api/admin/audit-logs');
        setAuditLogs(res.data);
      } else {
        const res = await API.get('/api/admin/ai-logs');
        setAiLogs(res.data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // Filter logs based on search term
  const filteredAuditLogs = auditLogs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredAiLogs = aiLogs.filter(log => 
    log.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.model_used.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.response && log.response.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-5 border-b border-enterprise-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-enterprise-50 flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-brand-primary" />
            <span>System Activity Monitoring</span>
          </h2>
          <p className="text-xs text-enterprise-400 mt-1">Super Admin Panel: Track and inspect secure workplace actions and model fallbacks.</p>
        </div>
        
        {/* Search & Refresh */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-enterprise-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search logs..."
              className="pl-9 pr-4 py-2 bg-enterprise-900 border border-enterprise-800 hover:border-enterprise-750 focus:border-brand-primary rounded-xl text-xs text-enterprise-100 placeholder-enterprise-600 focus:outline-none"
            />
          </div>
          <button
            onClick={fetchLogs}
            className="p-2 bg-enterprise-900 border border-enterprise-800 rounded-xl hover:bg-enterprise-800 transition-colors text-enterprise-400 hover:text-enterprise-100"
            title="Refresh Logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-enterprise-850 text-xs font-bold">
        <button
          onClick={() => { setActiveSubTab('audit'); setSearchTerm(''); }}
          className={`pb-3 border-b-2 px-1 transition-all duration-150 flex items-center space-x-1.5 ${
            activeSubTab === 'audit' 
              ? 'border-brand-primary text-brand-primary' 
              : 'border-transparent text-enterprise-450 hover:text-enterprise-250'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Audit Logs</span>
        </button>
        <button
          onClick={() => { setActiveSubTab('ai'); setSearchTerm(''); }}
          className={`pb-3 border-b-2 px-1 transition-all duration-150 flex items-center space-x-1.5 ${
            activeSubTab === 'ai' 
              ? 'border-brand-primary text-brand-primary' 
              : 'border-transparent text-enterprise-450 hover:text-enterprise-250'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>AI Usage & Fallbacks</span>
        </button>
      </div>

      {/* Tables list */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-primary"></div>
        </div>
      ) : activeSubTab === 'audit' ? (
        // AUDIT LOGS TABLE
        filteredAuditLogs.length === 0 ? (
          <div className="text-center py-16 bg-enterprise-900 border border-enterprise-800 rounded-xl text-xs text-enterprise-500 font-semibold">
            No matching audit logs found.
          </div>
        ) : (
          <div className="bg-enterprise-900 border border-enterprise-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-enterprise-950 text-enterprise-500 font-bold border-b border-enterprise-850">
                    <th className="p-4 uppercase tracking-wider">Log ID</th>
                    <th className="p-4 uppercase tracking-wider">Timestamp</th>
                    <th className="p-4 uppercase tracking-wider">Action Type</th>
                    <th className="p-4 uppercase tracking-wider">Initiator ID</th>
                    <th className="p-4 uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-enterprise-850/50">
                  {filteredAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-enterprise-950/40 transition-colors">
                      <td className="p-4 text-enterprise-400 font-bold"># {log.id}</td>
                      <td className="p-4 text-enterprise-500 font-semibold">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 text-enterprise-300 font-semibold">User {log.user_id || 'System'}</td>
                      <td className="p-4 text-enterprise-200 font-medium">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        // AI ROUTING LOGS TABLE
        filteredAiLogs.length === 0 ? (
          <div className="text-center py-16 bg-enterprise-900 border border-enterprise-800 rounded-xl text-xs text-enterprise-500 font-semibold">
            No matching AI logs found.
          </div>
        ) : (
          <div className="bg-enterprise-900 border border-enterprise-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-enterprise-950 text-enterprise-500 font-bold border-b border-enterprise-850">
                    <th className="p-4 uppercase tracking-wider">Timestamp</th>
                    <th className="p-4 uppercase tracking-wider">Model Used</th>
                    <th className="p-4 uppercase tracking-wider">Response Time</th>
                    <th className="p-4 uppercase tracking-wider">Query Preview</th>
                    <th className="p-4 uppercase tracking-wider">Fallback Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-enterprise-850/50">
                  {filteredAiLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-enterprise-950/40 transition-colors">
                      <td className="p-4 text-enterprise-500 font-semibold">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-4 font-bold text-enterprise-250">{log.model_used}</td>
                      <td className="p-4 text-enterprise-300 font-bold">{log.response_time_ms} ms</td>
                      <td className="p-4">
                        <p className="font-semibold text-enterprise-100 line-clamp-1 max-w-xs">{log.query}</p>
                        {log.response && <p className="text-[10px] text-enterprise-500 line-clamp-1 mt-0.5 max-w-xs">{log.response}</p>}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          log.fallback_occurred 
                            ? 'bg-brand-warning/10 text-brand-warning border-brand-warning/25'
                            : 'bg-brand-success/10 text-brand-success border-brand-success/25'
                        }`}>
                          {log.fallback_occurred ? 'Fallback Route' : 'Primary API'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default SystemLogs;
