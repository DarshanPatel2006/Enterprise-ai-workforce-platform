import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { Settings, Plus, Trash2, CheckCircle } from 'lucide-react';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/admin/departments');
      setDepartments(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleCreateDept = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await API.post('/api/admin/departments', { name, code, description });
      setName('');
      setCode('');
      setDescription('');
      setShowAddForm(false);
      fetchDepartments();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Failed to create department");
    }
  };

  const handleDeleteDept = async (id) => {
    if (!window.confirm("Are you sure you want to delete this department?")) return;
    try {
      await API.delete(`/api/admin/departments/${id}`);
      fetchDepartments();
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
            <Settings className="w-5 h-5 text-brand-primary" />
            <span>Departments Management</span>
          </h2>
          <p className="text-xs text-enterprise-400 mt-1">Super Admin Panel: Configure core organizational department structures.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="py-2 px-4 bg-brand-primary hover:bg-brand-hover text-white rounded-xl text-xs font-semibold shadow transition-colors cursor-pointer flex items-center space-x-1"
        >
          <Plus className="w-4 h-4" />
          <span>Add Department</span>
        </button>
      </div>

      {/* CREATE FORM */}
      {showAddForm && (
        <div className="p-6 bg-enterprise-900 border border-enterprise-800 rounded-xl shadow-sm space-y-4">
          <h3 className="font-bold text-enterprise-100 text-sm">Create New Department</h3>
          {errorMsg && (
            <div className="p-2.5 bg-red-950/20 border border-red-500/30 rounded-lg text-xs font-bold text-brand-danger">
              {errorMsg}
            </div>
          )}
          <form onSubmit={handleCreateDept} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-enterprise-400 uppercase tracking-wider">Department Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Quality Assurance"
                  className="w-full px-4 py-2.5 bg-enterprise-950 border border-enterprise-850 focus:border-brand-primary rounded-xl text-xs text-enterprise-100 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-enterprise-400 uppercase tracking-wider">Dept Code</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. QA"
                  maxLength={10}
                  className="w-full px-4 py-2.5 bg-enterprise-950 border border-enterprise-850 focus:border-brand-primary rounded-xl text-xs text-enterprise-100 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-enterprise-400 uppercase tracking-wider">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of department responsibilities..."
                className="w-full h-[90px] p-4 bg-enterprise-950 border border-enterprise-850 focus:border-brand-primary rounded-xl text-xs text-enterprise-100 focus:outline-none"
              />
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
                Create Department
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LIST DEPARTMENTS */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-primary"></div>
        </div>
      ) : departments.length === 0 ? (
        <div className="text-center py-16 bg-enterprise-900 border border-enterprise-800 rounded-xl">
          <Settings className="w-12 h-12 text-enterprise-750 mx-auto mb-3" />
          <p className="text-sm text-enterprise-500 font-semibold">No departments configured.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {departments.map((d) => (
            <div 
              key={d.id}
              className="bg-enterprise-900 border border-enterprise-800 hover:border-enterprise-700 rounded-xl p-5 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-primary/10 text-brand-primary border border-brand-primary/25">
                    {d.code}
                  </span>
                  <button
                    onClick={() => handleDeleteDept(d.id)}
                    className="p-1.5 text-enterprise-500 hover:text-brand-danger rounded-lg hover:bg-enterprise-800 transition-colors"
                    title="Delete Department"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-bold text-enterprise-100 text-sm">{d.name}</h3>
                <p className="text-xs text-enterprise-400 mt-2 leading-relaxed">
                  {d.description || 'No description provided.'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Departments;
