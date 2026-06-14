import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import EmployeeTimeline from '../components/EmployeeTimeline';
import { 
  Users, Calendar, Clock, BarChart3, AlertCircle, FileText, CheckCircle2,
  ListTodo, UserCheck, ShieldAlert, Award, FileSignature, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user, refreshProfile } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [agreePolicies, setAgreePolicies] = useState(false);
  
  // Employee Task Submission State
  const [submittingTask, setSubmittingTask] = useState(null);
  const [githubLink, setGithubLink] = useState('');
  const [driveLink, setDriveLink] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');

  // Employee Photo Upload State
  const [photoFile, setPhotoFile] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (user.role === 'Super Admin') {
        const [analytics, audits, aiLogs] = await Promise.all([
          API.get('/api/admin/analytics'),
          API.get('/api/admin/audit-logs'),
          API.get('/api/admin/ai-logs')
        ]);
        setData({ analytics: analytics.data, audits: audits.data, aiLogs: aiLogs.data });
      } 
      else if (user.role === 'HR') {
        const [employees, leaves, attendance] = await Promise.all([
          API.get('/api/hr/employees'),
          API.get('/api/hr/leaves'),
          API.get('/api/hr/attendance')
        ]);
        setData({ employees: employees.data, leaves: leaves.data, attendance: attendance.data });
      } 
      else if (user.role === 'Manager') {
        const [analytics, submissions, projects] = await Promise.all([
          API.get('/api/manager/analytics'),
          API.get('/api/manager/submissions'),
          API.get('/api/manager/projects')
        ]);
        setData({ analytics: analytics.data, submissions: submissions.data, projects: projects.data });
      } 
      else if (user.role === 'Employee') {
        const [tasks, leaves, timeline, announcements, depts, emps] = await Promise.all([
          API.get('/api/employee/tasks'),
          API.get('/api/employee/leaves'),
          API.get('/api/employee/timeline'),
          API.get('/api/announcements'),
          API.get('/api/admin/departments'),
          API.get('/api/hr/employees')
        ]);
        setData({ 
          tasks: tasks.data, 
          leaves: leaves.data, 
          timeline: timeline.data, 
          announcements: announcements.data,
          departments: depts.data,
          employees: emps.data
        });
        
        // Check first login: if no 'First Login Policy Agreement' in timeline, show welcome modal
        const hasAgreed = timeline.data.some(event => event.title === 'First Login Policy Agreement');
        if (!hasAgreed) {
          setShowWelcomeModal(true);
        }
      }
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    }
    setLoading(false);
  };

  const handleAgreePolicies = async () => {
    if (!agreePolicies) return;
    try {
      await API.put('/api/employee/first-login');
      setShowWelcomeModal(false);
      // Refresh timeline and profile
      refreshProfile();
      fetchDashboardData();
    } catch (err) {
      console.error("Agreement failed", err);
    }
  };

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    if (!submittingTask) return;
    try {
      await API.post(`/api/employee/tasks/${submittingTask.id}/submit`, {
        github_link: githubLink,
        drive_link: driveLink,
        notes: submissionNotes
      });
      setSubmittingTask(null);
      setGithubLink('');
      setDriveLink('');
      setSubmissionNotes('');
      fetchDashboardData();
      alert("Work submitted successfully for review!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to submit work.");
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setShowUploadModal(true);
  };

  const handleConfirmUpload = async () => {
    if (!photoFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', photoFile);

    try {
      await API.post('/api/employee/upload-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      alert("ID card photo uploaded and locked successfully!");
      setShowUploadModal(false);
      setPhotoFile(null);
      refreshProfile();
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-brand-primary"></div>
      </div>
    );
  }

  // Calculate experience in years/months
  const getExperienceString = (dateStr) => {
    if (!dateStr) return '0 months';
    const joinDate = new Date(dateStr);
    const today = new Date();
    let diffMonths = (today.getFullYear() - joinDate.getFullYear()) * 12 + (today.getMonth() - joinDate.getMonth());
    if (diffMonths <= 0) return 'Just joined';
    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;
    if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''} ${months > 0 ? `${months} month${months > 1 ? 's' : ''}` : ''}`;
    }
    return `${months} month${months > 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-8">
      {/* Welcome Modal for First Login */}
      {showWelcomeModal && user?.role === 'Employee' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 overflow-y-auto">
          <div className="w-full max-w-2xl bg-enterprise-900 border border-enterprise-800 rounded-2xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-extrabold text-white mb-2 flex items-center space-x-2">
              <Award className="w-7 h-7 text-brand-success" />
              <span>Welcome to Enterprise AI Platforms!</span>
            </h2>
            <p className="text-xs text-enterprise-400 border-b border-enterprise-850 pb-4 mb-4">
              Please review your profile details, standard rules, regulations, and security guidelines to continue.
            </p>
            
            {/* Employee Profile Preview */}
            <div className="bg-enterprise-950 border border-enterprise-850 rounded-xl p-4 mb-6 grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-enterprise-500 font-bold uppercase tracking-wider">Employee ID</p>
                <p className="text-enterprise-100 font-semibold mt-0.5">{user.profile?.employee_id}</p>
              </div>
              <div>
                <p className="text-enterprise-500 font-bold uppercase tracking-wider">Full Name</p>
                <p className="text-enterprise-100 font-semibold mt-0.5">{user.profile?.first_name} {user.profile?.last_name}</p>
              </div>
              <div>
                <p className="text-enterprise-500 font-bold uppercase tracking-wider">Assigned Role</p>
                <p className="text-enterprise-100 font-semibold mt-0.5">{user.role}</p>
              </div>
              <div>
                <p className="text-enterprise-500 font-bold uppercase tracking-wider">Joining Date</p>
                <p className="text-enterprise-100 font-semibold mt-0.5">{user.profile?.joining_date}</p>
              </div>
            </div>

            {/* Rules and Guidelines */}
            <div className="space-y-4 mb-6 text-xs text-enterprise-300 leading-relaxed max-h-[30vh] overflow-y-auto pr-2 border border-enterprise-850 p-4 rounded-xl bg-enterprise-950/30">
              <h4 className="font-bold text-enterprise-200 uppercase tracking-wider">Rules & Security Guidelines</h4>
              <p><strong>1. Work Hours & Clock-In:</strong> Standard work hours are 9:00 AM to 6:00 PM. Clock-ins are logged through the employee dashboard. Clock-ins after 9:30 AM are flagged as late. 3 late clock-ins a month triggers a disciplinary HR audit.</p>
              <p><strong>2. Information Security & Source Code:</strong> Employees are strictly prohibited from copying, downloading, or forwarding corporate source code, data, or documents to external unapproved environments. All repositories must remain under enterprise-licensed accounts.</p>
              <p><strong>3. Document Approvals & Leave Policy:</strong> Standard leaves must be submitted 3 business days in advance. HR and manager authorization is mandatory for final approvals.</p>
              <p><strong>4. Platform Fair-use Policy:</strong> AI assistant requests are logged to evaluate usage distributions. Inappropriate prompts or data leaks will lead to account suspension.</p>
            </div>

            <div className="flex items-center space-x-3 mb-6">
              <input 
                type="checkbox" 
                id="agree-rules" 
                checked={agreePolicies}
                onChange={(e) => setAgreePolicies(e.target.checked)}
                className="w-4 h-4 text-brand-primary bg-enterprise-950 border-enterprise-800 rounded focus:ring-brand-primary focus:ring-1"
              />
              <label htmlFor="agree-rules" className="text-xs text-enterprise-400 font-medium cursor-pointer">
                I verify that the above employee details are correct, and I agree to abide by the company rules, policies, and regulations.
              </label>
            </div>

            <button
              onClick={handleAgreePolicies}
              disabled={!agreePolicies}
              className={`w-full py-3 px-4 rounded-xl text-sm font-semibold text-white shadow-lg transition-all duration-150 flex items-center justify-center space-x-2 ${
                agreePolicies 
                  ? 'bg-brand-success hover:bg-emerald-600 shadow-brand-success/10 cursor-pointer' 
                  : 'bg-enterprise-800 text-enterprise-500 cursor-not-allowed'
              }`}
            >
              <FileSignature className="w-4 h-4" />
              <span>Agree & Proceed</span>
            </button>
          </div>
        </div>
      )}

      {/* Header Profile Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-enterprise-800">
        <div>
          <h2 className="text-2xl font-bold text-enterprise-50">
            Welcome back, {user.profile ? user.profile.first_name : 'Admin'}
          </h2>
          <p className="text-xs text-enterprise-400 mt-1">Here is a summary of your workplace activities and operations.</p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-enterprise-500 bg-enterprise-900 border border-enterprise-800 px-3 py-1.5 rounded-lg">
          <Clock className="w-4 h-4" />
          <span>{new Date().toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* --- SUPER ADMIN DASHBOARD --- */}
      {user.role === 'Super Admin' && data && (
        <div className="space-y-8">
          {/* Metrics cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-enterprise-900 border border-enterprise-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-enterprise-500 uppercase tracking-wider">Total Active Staff</span>
                <h3 className="text-2xl font-extrabold text-enterprise-100 mt-1">{data.analytics.total_employees}</h3>
              </div>
              <div className="p-3 rounded-lg bg-brand-primary/10 text-brand-primary"><Users className="w-5 h-5" /></div>
            </div>
            <div className="bg-enterprise-900 border border-enterprise-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-enterprise-500 uppercase tracking-wider">Active Departments</span>
                <h3 className="text-2xl font-extrabold text-enterprise-100 mt-1">{data.analytics.departments_count}</h3>
              </div>
              <div className="p-3 rounded-lg bg-brand-success/10 text-brand-success"><BarChart3 className="w-5 h-5" /></div>
            </div>
            <div className="bg-enterprise-900 border border-enterprise-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-enterprise-500 uppercase tracking-wider">AI Assistant Calls</span>
                <h3 className="text-2xl font-extrabold text-enterprise-100 mt-1">{data.analytics.ai_usage.total_calls}</h3>
              </div>
              <div className="p-3 rounded-lg bg-brand-info/10 text-brand-info"><BarChart3 className="w-5 h-5" /></div>
            </div>
            <div className="bg-enterprise-900 border border-enterprise-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-enterprise-500 uppercase tracking-wider">AI Fallback Rate</span>
                <h3 className="text-2xl font-extrabold text-enterprise-100 mt-1">
                  {data.analytics.ai_usage.total_calls > 0 
                    ? `${Math.round((data.analytics.ai_usage.fallback_calls / data.analytics.ai_usage.total_calls) * 100)}%`
                    : '0%'}
                </h3>
              </div>
              <div className="p-3 rounded-lg bg-brand-warning/10 text-brand-warning"><ShieldAlert className="w-5 h-5" /></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* System Audit Logs */}
            <div className="bg-enterprise-900 border border-enterprise-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-enterprise-850">
                <h3 className="font-bold text-enterprise-100 text-sm flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-brand-primary" />
                  <span>Recent System Audit Logs</span>
                </h3>
                <Link to="/admin/logs" className="text-xs text-brand-primary hover:underline flex items-center space-x-1">
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="space-y-3 overflow-y-auto max-h-[300px]">
                {data.audits.slice(0, 5).map(log => (
                  <div key={log.id} className="p-3 bg-enterprise-950 border border-enterprise-850/50 rounded-lg text-xs">
                    <div className="flex items-center justify-between text-enterprise-500 font-bold mb-1">
                      <span>{log.action}</span>
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-enterprise-300 font-medium">{log.details}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI usage Logs */}
            <div className="bg-enterprise-900 border border-enterprise-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-enterprise-850">
                <h3 className="font-bold text-enterprise-100 text-sm flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-brand-info" />
                  <span>AI Engine Call Logs</span>
                </h3>
                <Link to="/admin/logs" className="text-xs text-brand-info hover:underline flex items-center space-x-1">
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="space-y-3 overflow-y-auto max-h-[300px]">
                {data.aiLogs.slice(0, 5).map(log => (
                  <div key={log.id} className="p-3 bg-enterprise-950 border border-enterprise-850/50 rounded-lg text-xs">
                    <div className="flex items-center justify-between text-enterprise-500 font-bold mb-1">
                      <span>Model: {log.model_used}</span>
                      <span>{log.response_time_ms}ms</span>
                    </div>
                    <p className="text-enterprise-300 font-medium truncate"><strong>Query:</strong> {log.query}</p>
                    <div className="flex items-center justify-between text-[10px] text-enterprise-600 mt-2">
                      <span>Tokens Est: {log.tokens_used}</span>
                      <span className={log.fallback_occurred ? 'text-brand-warning font-bold' : 'text-brand-success font-bold'}>
                        {log.fallback_occurred ? 'Fallback Route' : 'Primary API'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- HR DASHBOARD --- */}
      {user.role === 'HR' && data && (
        <div className="space-y-8">
          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-enterprise-900 border border-enterprise-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-enterprise-500 uppercase tracking-wider">Active Employees</span>
                <h3 className="text-2xl font-extrabold text-enterprise-100 mt-1">{data.employees.length}</h3>
              </div>
              <div className="p-3 rounded-lg bg-brand-primary/10 text-brand-primary"><Users className="w-5 h-5" /></div>
            </div>
            <div className="bg-enterprise-900 border border-enterprise-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-enterprise-500 uppercase tracking-wider">Pending Leaves</span>
                <h3 className="text-2xl font-extrabold text-enterprise-100 mt-1">
                  {data.leaves.filter(l => l.status === 'Pending').length}
                </h3>
              </div>
              <div className="p-3 rounded-lg bg-brand-warning/10 text-brand-warning"><Calendar className="w-5 h-5" /></div>
            </div>
            <div className="bg-enterprise-900 border border-enterprise-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-enterprise-500 uppercase tracking-wider">Late Arrivals (Today)</span>
                <h3 className="text-2xl font-extrabold text-enterprise-100 mt-1">
                  {data.attendance.filter(a => a.status === 'Late' && a.date === new Date().toISOString().split('T')[0]).length}
                </h3>
              </div>
              <div className="p-3 rounded-lg bg-brand-danger/10 text-brand-danger"><Clock className="w-5 h-5" /></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Quick Actions Shortcuts */}
            <div className="bg-enterprise-900 border border-enterprise-800 rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-enterprise-100 text-sm pb-3 border-b border-enterprise-850">HR Core Operations</h3>
              <Link to="/hr/employees" className="flex items-center justify-between p-3 bg-enterprise-950 border border-enterprise-850 hover:border-enterprise-750 rounded-xl text-xs font-semibold text-enterprise-200 transition-colors">
                <span className="flex items-center space-x-2"><Users className="w-4 h-4 text-brand-primary" /> <span>Add new employee account</span></span>
                <ArrowRight className="w-4 h-4 text-enterprise-500" />
              </Link>
              <Link to="/hr/documents" className="flex items-center justify-between p-3 bg-enterprise-950 border border-enterprise-850 hover:border-enterprise-750 rounded-xl text-xs font-semibold text-enterprise-200 transition-colors">
                <span className="flex items-center space-x-2"><FileText className="w-4 h-4 text-brand-success" /> <span>Generate official letters</span></span>
                <ArrowRight className="w-4 h-4 text-enterprise-500" />
              </Link>
              <Link to="/hr/salaries" className="flex items-center justify-between p-3 bg-enterprise-950 border border-enterprise-850 hover:border-enterprise-750 rounded-xl text-xs font-semibold text-enterprise-200 transition-colors">
                <span className="flex items-center space-x-2"><Clock className="w-4 h-4 text-brand-info" /> <span>Process monthly payroll slips</span></span>
                <ArrowRight className="w-4 h-4 text-enterprise-500" />
              </Link>
            </div>

            {/* Pending Leave Requests */}
            <div className="bg-enterprise-900 border border-enterprise-800 rounded-xl p-6 shadow-sm md:col-span-2 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-enterprise-850">
                <h3 className="font-bold text-enterprise-100 text-sm">Pending Leave Requests</h3>
                <Link to="/hr/leaves" className="text-xs text-brand-primary hover:underline flex items-center space-x-1">
                  <span>Manage All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="space-y-3 overflow-y-auto max-h-[200px]">
                {data.leaves.filter(l => l.status === 'Pending').length === 0 ? (
                  <div className="text-center py-6 text-xs text-enterprise-500">No pending leave requests.</div>
                ) : (
                  data.leaves.filter(l => l.status === 'Pending').slice(0, 3).map(req => (
                    <div key={req.id} className="p-3 bg-enterprise-950 border border-enterprise-850/50 rounded-lg text-xs flex items-center justify-between">
                      <div>
                        <p className="font-bold text-enterprise-200">{req.leave_type} Leave</p>
                        <p className="text-[10px] text-enterprise-500 mt-0.5">Dates: {req.start_date} to {req.end_date}</p>
                        <p className="text-enterprise-400 mt-1.5 italic">" {req.reason} "</p>
                      </div>
                      <Link to="/hr/leaves" className="py-1 px-2.5 bg-brand-primary text-white rounded text-[10px] font-bold">
                        Resolve
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MANAGER DASHBOARD --- */}
      {user.role === 'Manager' && data && (
        <div className="space-y-8">
          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-enterprise-900 border border-enterprise-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-enterprise-500 uppercase tracking-wider">Team Size</span>
                <h3 className="text-2xl font-extrabold text-enterprise-100 mt-1">{data.analytics.team_size}</h3>
              </div>
              <div className="p-3 rounded-lg bg-brand-primary/10 text-brand-primary"><Users className="w-5 h-5" /></div>
            </div>
            <div className="bg-enterprise-900 border border-enterprise-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-enterprise-500 uppercase tracking-wider">Team Productivity</span>
                <h3 className="text-2xl font-extrabold text-brand-success mt-1">{data.analytics.productivity_score}%</h3>
              </div>
              <div className="p-3 rounded-lg bg-brand-success/10 text-brand-success"><CheckCircle2 className="w-5 h-5" /></div>
            </div>
            <div className="bg-enterprise-900 border border-enterprise-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-enterprise-500 uppercase tracking-wider">Total Active Tasks</span>
                <h3 className="text-2xl font-extrabold text-enterprise-100 mt-1">{data.analytics.tasks.total}</h3>
              </div>
              <div className="p-3 rounded-lg bg-brand-info/10 text-brand-info"><ListTodo className="w-5 h-5" /></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Task Submissions for Review */}
            <div className="bg-enterprise-900 border border-enterprise-800 rounded-xl p-6 shadow-sm md:col-span-2 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-enterprise-850">
                <h3 className="font-bold text-enterprise-100 text-sm">Recent Task Submissions for Review</h3>
                <Link to="/manager/projects" className="text-xs text-brand-primary hover:underline flex items-center space-x-1">
                  <span>Open Kanban</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="space-y-3 overflow-y-auto max-h-[220px]">
                {data.submissions.filter(s => s.status === 'Pending').length === 0 ? (
                  <div className="text-center py-6 text-xs text-enterprise-500">No pending task submissions to review.</div>
                ) : (
                  data.submissions.filter(s => s.status === 'Pending').slice(0, 3).map(sub => (
                    <div key={sub.id} className="p-3 bg-enterprise-950 border border-enterprise-850/50 rounded-lg text-xs flex items-center justify-between">
                      <div>
                        <p className="font-bold text-enterprise-200">Submission for Task ID {sub.task_id}</p>
                        {sub.github_link && <p className="text-[10px] text-brand-primary mt-0.5 truncate max-w-md">PR: {sub.github_link}</p>}
                        <p className="text-enterprise-400 mt-1 text-[11px] truncate max-w-md">Notes: {sub.notes || 'No notes'}</p>
                      </div>
                      <Link to="/manager/projects" className="py-1 px-3 bg-brand-primary text-white rounded text-[10px] font-bold">
                        Review
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Projects list */}
            <div className="bg-enterprise-900 border border-enterprise-800 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-enterprise-100 text-sm pb-3 border-b border-enterprise-850 mb-4">Project Progress</h3>
              <div className="space-y-4">
                {Object.keys(data.analytics.projects_progress).length === 0 ? (
                  <div className="text-center py-6 text-xs text-enterprise-500">No active projects found.</div>
                ) : (
                  Object.entries(data.analytics.projects_progress).map(([name, progress]) => (
                    <div key={name} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-enterprise-300 truncate max-w-[160px]">{name}</span>
                        <span className="text-brand-success">{progress}%</span>
                      </div>
                      <div className="w-full bg-enterprise-850 h-2 rounded-full overflow-hidden">
                        <div className="bg-brand-success h-full" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- EMPLOYEE DASHBOARD --- */}
      {user.role === 'Employee' && data && (
        <div className="space-y-8 animate-fade-in">
          {/* Dashboard Metrics grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-enterprise-900 border border-enterprise-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-enterprise-500 uppercase tracking-wider">Assigned Tasks</span>
                <h3 className="text-2xl font-extrabold text-enterprise-100 mt-1">
                  {data.tasks.filter(t => t.status !== 'Completed').length}
                </h3>
              </div>
              <div className="p-3 rounded-lg bg-brand-primary/10 text-brand-primary"><ListTodo className="w-5 h-5" /></div>
            </div>
            <div className="bg-enterprise-900 border border-enterprise-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-enterprise-500 uppercase tracking-wider">Leave Balance</span>
                <h3 className="text-2xl font-extrabold text-enterprise-100 mt-1">{user.profile?.leave_balance} days</h3>
              </div>
              <div className="p-3 rounded-lg bg-brand-warning/10 text-brand-warning"><Calendar className="w-5 h-5" /></div>
            </div>
            <div className="bg-enterprise-900 border border-enterprise-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-enterprise-500 uppercase tracking-wider">Attendance Rate</span>
                <h3 className="text-2xl font-extrabold text-brand-success mt-1">{user.profile?.attendance_percentage || 100}%</h3>
              </div>
              <div className="p-3 rounded-lg bg-brand-success/10 text-brand-success"><UserCheck className="w-5 h-5" /></div>
            </div>
            <div className="bg-enterprise-900 border border-enterprise-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-enterprise-500 uppercase tracking-wider">Experience</span>
                <h3 className="text-base font-bold text-enterprise-200 mt-2 truncate">
                  {getExperienceString(user.profile?.joining_date)}
                </h3>
              </div>
              <div className="p-3 rounded-lg bg-brand-info/10 text-brand-info"><Clock className="w-5 h-5" /></div>
            </div>
          </div>

          {/* Premium Digital Employee ID Card Section */}
          <div className="bg-enterprise-900 border border-enterprise-800 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-enterprise-100 text-sm pb-3 border-b border-enterprise-850 mb-6 flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-brand-primary" />
              <span>Smart Corporate Identity Card</span>
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* ID Card Display - Col span 5 */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-[340px] h-[500px] rounded-2xl bg-gradient-to-br from-enterprise-950/80 to-enterprise-900/40 backdrop-blur-md border border-enterprise-800/80 shadow-2xl p-6 overflow-hidden flex flex-col justify-between select-none">
                  {/* Watermark background */}
                  <div className="absolute inset-0 opacity-[0.03] flex flex-wrap justify-center items-center pointer-events-none text-white font-extrabold text-sm rotate-12 leading-relaxed">
                    {Array(40).fill("TUF HACK ").map((t, idx) => (
                      <span key={idx} className="m-2 shrink-0">{t}</span>
                    ))}
                  </div>

                  {/* Card Header */}
                  <div className="flex justify-between items-center z-10 border-b border-enterprise-800/60 pb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-black text-xs tracking-wider font-mono bg-white/5 px-2 py-1 rounded border border-white/10">[TUF] &lt;/&gt; [HACK]</span>
                    </div>
                    <span className="text-[9px] font-bold tracking-wider text-brand-success uppercase bg-brand-success/15 border border-brand-success/20 px-2 py-0.5 rounded-full">
                      {user.profile?.status === 'active' ? 'Active Badge' : 'Suspended'}
                    </span>
                  </div>

                  {/* Card Body - Photo & Info */}
                  <div className="flex flex-col items-center text-center my-auto z-10 space-y-4">
                    {/* Rounded Profile Photo Container */}
                    <div className="relative group">
                      <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-brand-primary bg-enterprise-950 flex items-center justify-center shadow-lg">
                        {user.profile?.photo_url ? (
                          <img 
                            src={user.profile.photo_url.startsWith('http') ? user.profile.photo_url : `${API.defaults.baseURL || 'http://localhost:8000'}${user.profile.photo_url}`} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Users className="w-12 h-12 text-enterprise-750" />
                        )}
                      </div>
                      
                      {/* Upload overlay if not locked */}
                      {!user.profile?.photo_locked && (
                        <label className="absolute inset-0 w-28 h-28 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity duration-200">
                          <span className="text-[10px] font-bold text-white text-center px-2">Upload Photo</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handlePhotoChange} 
                            className="hidden" 
                          />
                        </label>
                      )}
                    </div>

                    <div>
                      <h4 className="text-lg font-extrabold text-white leading-tight font-sans">
                        {user.profile?.first_name} {user.profile?.last_name}
                      </h4>
                      <p className="text-xs text-brand-primary font-bold mt-1 tracking-wide font-sans">{user.role}</p>
                    </div>

                    {/* Quick Profile fields */}
                    <div className="w-full grid grid-cols-2 gap-x-2 gap-y-3 bg-enterprise-950/40 p-3.5 border border-enterprise-850/50 rounded-xl text-left text-[10px]">
                      <div>
                        <span className="text-enterprise-500 font-bold uppercase tracking-wider block">Employee ID</span>
                        <span className="text-enterprise-250 font-semibold mt-0.5 block">{user.profile?.employee_id || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-enterprise-500 font-bold uppercase tracking-wider block">Office Location</span>
                        <span className="text-enterprise-250 font-semibold mt-0.5 block">{user.profile?.office_location || 'Not Specified'}</span>
                      </div>
                      <div>
                        <span className="text-enterprise-500 font-bold uppercase tracking-wider block">Blood Group</span>
                        <span className="text-enterprise-250 font-semibold mt-0.5 block">{user.profile?.blood_group || 'Not Specified'}</span>
                      </div>
                      <div>
                        <span className="text-enterprise-500 font-bold uppercase tracking-wider block">Joining Date</span>
                        <span className="text-enterprise-250 font-semibold mt-0.5 block">{user.profile?.joining_date || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="flex justify-between items-center z-10 border-t border-enterprise-800/60 pt-3 text-[9px] text-enterprise-450 font-medium">
                    <span>SECURE ID SYSTEM</span>
                    <span>TUF HACK © 2026</span>
                  </div>
                </div>
              </div>

              {/* Card Metadata/Actions Grid - Col span 7 */}
              <div className="lg:col-span-7 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Reporting Manager */}
                  <div className="p-4 bg-enterprise-950 border border-enterprise-850/60 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-enterprise-500 uppercase tracking-wider">Reporting Manager</span>
                    <p className="text-sm font-bold text-enterprise-200">
                      {data.employees?.find(e => e.id === user.profile?.manager_id)?.profile 
                        ? `${data.employees.find(e => e.id === user.profile.manager_id).profile.first_name} ${data.employees.find(e => e.id === user.profile.manager_id).profile.last_name}`
                        : user.profile?.manager_id 
                        ? data.employees?.find(e => e.id === user.profile.manager_id)?.email 
                        : 'Unassigned'}
                    </p>
                  </div>

                  {/* Department Name */}
                  <div className="p-4 bg-enterprise-950 border border-enterprise-850/60 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-enterprise-500 uppercase tracking-wider">Department</span>
                    <p className="text-sm font-bold text-enterprise-200">
                      {data.departments?.find(d => d.id === user.profile?.department_id)?.name || 'Unassigned'}
                    </p>
                  </div>

                  {/* Current Salary */}
                  <div className="p-4 bg-enterprise-950 border border-enterprise-850/60 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-enterprise-500 uppercase tracking-wider">Annual Salary (USD)</span>
                    <p className="text-sm font-bold text-brand-success">
                      {user.profile?.salary ? `$${user.profile.salary.toLocaleString()}` : '$0'}
                    </p>
                  </div>

                  {/* Employment Status */}
                  <div className="p-4 bg-enterprise-950 border border-enterprise-850/60 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-enterprise-500 uppercase tracking-wider">Employment Status</span>
                    <p className="text-sm font-bold text-enterprise-200 capitalize">
                      {user.profile?.status || 'Active'}
                    </p>
                  </div>
                </div>

                {/* QR Code and Info block */}
                <div className="p-4 bg-enterprise-950 border border-enterprise-850 rounded-xl flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
                  <div className="w-28 h-28 bg-white p-1 rounded-xl flex-shrink-0 flex items-center justify-center shadow-md">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(JSON.stringify({
                        employee_id: user.profile?.employee_id || '',
                        name: `${user.profile?.first_name || ''} ${user.profile?.last_name || ''}`.trim(),
                        role: user.role || 'Employee',
                        department: data.departments?.find(d => d.id === user.profile?.department_id)?.name || 'Engineering & AI'
                      }))}`} 
                      alt="QR Code" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="space-y-2 text-center md:text-left">
                    <h4 className="text-xs font-bold text-enterprise-200">Smart Badge QR Verification</h4>
                    <p className="text-[11px] text-enterprise-450 leading-relaxed font-sans">
                      Scan this secure QR code using any corporate validator or reader device to confirm employment status, ID verification, role permissions, and active department registration instantly.
                    </p>
                    {user.profile?.photo_locked ? (
                      <span className="inline-block mt-1 text-[10px] font-bold text-brand-success bg-brand-success/10 border border-brand-success/20 px-2.5 py-1 rounded">
                        ✓ ID Badge Locked (Identity Verified)
                      </span>
                    ) : (
                      <div className="mt-2 space-y-2">
                        <p className="text-[10px] text-brand-warning font-semibold">⚠ Badge Photo not uploaded yet. Click on the profile photo circle to upload.</p>
                        <label className="inline-block py-1.5 px-3 bg-brand-primary hover:bg-brand-hover text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors shadow">
                          Upload Badge Photo
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handlePhotoChange} 
                            className="hidden" 
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Announcements & Tasks */}
            <div className="md:col-span-2 space-y-6">
              {/* Announcements */}
              <div className="bg-enterprise-900 border border-enterprise-800 rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-enterprise-100 text-sm pb-3 border-b border-enterprise-850 mb-4 flex items-center space-x-2">
                  <Award className="w-4 h-4 text-brand-warning" />
                  <span>Recent Company Announcements</span>
                </h3>
                <div className="space-y-4">
                  {data.announcements.length === 0 ? (
                    <div className="text-center py-6 text-xs text-enterprise-500">No announcements posted.</div>
                  ) : (
                    data.announcements.slice(0, 3).map(ann => (
                      <div key={ann.id} className="p-4 bg-enterprise-950 border border-enterprise-850/50 rounded-xl text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ann.type === 'Award' ? 'bg-amber-500/10 text-amber-500' : 'bg-brand-primary/10 text-brand-primary'
                          }`}>
                            {ann.type}
                          </span>
                          <span className="text-[10px] text-enterprise-500">{new Date(ann.created_at).toLocaleDateString()}</span>
                        </div>
                        <h4 className="font-bold text-enterprise-200 text-sm">{ann.title}</h4>
                        <p className="text-enterprise-400 leading-relaxed">{ann.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Active Tasks */}
              <div className="bg-enterprise-900 border border-enterprise-800 rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-enterprise-100 text-sm pb-3 border-b border-enterprise-850 mb-4 flex items-center space-x-2">
                  <ListTodo className="w-4 h-4 text-brand-primary" />
                  <span>My Active Assigned Tasks</span>
                </h3>
                <div className="space-y-3">
                  {data.tasks.filter(t => t.status !== 'Completed').length === 0 ? (
                    <div className="text-center py-6 text-xs text-enterprise-500 font-semibold">No active tasks assigned. Enjoy your day!</div>
                  ) : (
                    data.tasks.filter(t => t.status !== 'Completed').map(task => (
                      <div key={task.id} className="p-4 bg-enterprise-950 border border-enterprise-850/50 rounded-xl text-xs flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-enterprise-200 text-xs">{task.title}</h4>
                          <p className="text-enterprise-400 mt-1.5">{task.description}</p>
                          <p className="text-[10px] text-enterprise-500 mt-2 font-semibold">Due: {task.due_date} • Weight: {task.weight} • Status: {task.status}</p>
                        </div>
                        <div className="shrink-0 ml-4">
                          {task.status === 'Testing' ? (
                            <span className="px-2 py-1 bg-cyan-950 text-brand-info border border-brand-info/20 rounded text-[10px] font-bold">Testing</span>
                          ) : (
                            <button
                              onClick={() => setSubmittingTask(task)}
                              className="py-1 px-3 bg-brand-primary hover:bg-brand-hover text-white rounded text-[10px] font-bold shadow transition-colors"
                            >
                              Submit
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Career Timeline */}
            <EmployeeTimeline events={data.timeline} />
          </div>
        </div>
      )}

      {/* Submit Work Modal Overlay */}
      {submittingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-6">
          <div className="w-full max-w-lg bg-enterprise-900 border border-enterprise-800 rounded-2xl shadow-xl p-6">
            <h3 className="font-extrabold text-white text-base mb-2">Submit Work Deliverables</h3>
            <p className="text-xs text-enterprise-500 border-b border-enterprise-850 pb-3 mb-4">
              Submitting for: <strong className="text-enterprise-300">"{submittingTask.title}"</strong>
            </p>

            <form onSubmit={handleSubmitWork} className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="block text-enterprise-450 font-bold uppercase tracking-wider text-[10px]">GitHub Pull Request URL</label>
                <input
                  type="url"
                  value={githubLink}
                  onChange={(e) => setGithubLink(e.target.value)}
                  placeholder="https://github.com/company/repo/pull/123"
                  className="w-full px-4 py-2 bg-enterprise-950 border border-enterprise-850 rounded-xl text-enterprise-100 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-enterprise-450 font-bold uppercase tracking-wider text-[10px]">Google Drive Link (Optional)</label>
                <input
                  type="url"
                  value={driveLink}
                  onChange={(e) => setDriveLink(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full px-4 py-2 bg-enterprise-950 border border-enterprise-850 rounded-xl text-enterprise-100 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-enterprise-450 font-bold uppercase tracking-wider text-[10px]">Notes / Instructions</label>
                <textarea
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Add any comments, documentation references, or instructions for the reviewer..."
                  className="w-full h-[100px] p-4 bg-enterprise-950 border border-enterprise-850 rounded-xl text-enterprise-100 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSubmittingTask(null)}
                  className="py-2 px-4 bg-enterprise-800 hover:bg-enterprise-750 text-enterprise-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-brand-primary hover:bg-brand-hover text-white rounded-xl font-bold shadow"
                >
                  Submit Deliverable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Upload Confirmation Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-fade-in">
          <div className="w-full max-w-md bg-enterprise-900 border border-enterprise-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3 text-brand-warning pb-1 border-b border-enterprise-850">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-extrabold text-white text-base">Verify Identity Photo</h3>
            </div>
            
            <div className="space-y-3 text-xs text-enterprise-300 leading-relaxed font-sans">
              <p>
                This image will become your official company identity card photo and <strong className="text-white">cannot be changed by you later</strong>. Only HR or Super Admin can update it after submission.
              </p>
              <p className="text-[11px] text-enterprise-450">
                Please ensure you are using a clear, forward-facing headshot with a clean background.
              </p>
              {photoFile && (
                <div className="p-2.5 bg-enterprise-950 border border-enterprise-850 rounded-xl flex items-center space-x-3 text-enterprise-400">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-enterprise-900 border border-enterprise-800 flex-shrink-0">
                    <img 
                      src={URL.createObjectURL(photoFile)} 
                      alt="Selected preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="truncate flex-1">
                    <p className="font-bold text-enterprise-350 truncate">{photoFile.name}</p>
                    <p className="text-[10px] text-enterprise-500">{(photoFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                disabled={uploading}
                onClick={() => {
                  setPhotoFile(null);
                  setShowUploadModal(false);
                }}
                className="py-2 px-4 bg-enterprise-800 hover:bg-enterprise-750 text-enterprise-300 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={uploading}
                onClick={handleConfirmUpload}
                className="py-2 px-4 bg-brand-primary hover:bg-brand-hover disabled:bg-brand-primary/40 text-white rounded-xl font-bold text-xs shadow-md transition-colors"
              >
                {uploading ? 'Uploading...' : 'Confirm Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
