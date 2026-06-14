import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import API from '../../services/api';
import KanbanBoard from '../../components/KanbanBoard';
import { 
  FolderKanban, Plus, Clock, Eye, AlertCircle, CheckCircle, 
  ExternalLink, Calendar, PlusCircle, CheckSquare
} from 'lucide-react';

const Projects = () => {
  const { user } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [selectedProj, setSelectedProj] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals Toggles
  const [showProjForm, setShowProjForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [reviewingTask, setReviewingTask] = useState(null);
  const [activeSubmission, setActiveSubmission] = useState(null);

  // Project Form State
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projStatus, setProjStatus] = useState('Planning');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');

  // Task Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskWeight, setTaskWeight] = useState('1');
  const [taskDueDate, setTaskDueDate] = useState('');

  // Review Form State
  const [reviewStatus, setReviewStatus] = useState('Approved');
  const [reviewFeedback, setReviewFeedback] = useState('');

  useEffect(() => {
    fetchProjects();
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedProj) {
      fetchTasks(selectedProj.id);
    }
  }, [selectedProj]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/manager/projects');
      setProjects(res.data);
      if (res.data.length > 0 && !selectedProj) {
        setSelectedProj(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchEmployees = async () => {
    try {
      const res = await API.get('/api/hr/employees');
      setEmployees(res.data.filter(u => u.role === 'Employee'));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTasks = async (projId) => {
    try {
      const res = await API.get(`/api/manager/tasks/${projId}`);
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projName.trim()) return;

    try {
      const res = await API.post('/api/manager/projects', {
        name: projName,
        description: projDesc,
        status: projStatus,
        start_date: startDate,
        end_date: endDate || null
      });
      setProjName('');
      setProjDesc('');
      setShowProjForm(false);
      fetchProjects();
      setSelectedProj(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !selectedProj) return;

    try {
      await API.post('/api/manager/tasks', {
        project_id: selectedProj.id,
        title: taskTitle,
        description: taskDesc,
        assigned_to: taskAssignee ? parseInt(taskAssignee) : null,
        status: "Todo",
        weight: parseInt(taskWeight) || 1,
        due_date: taskDueDate || null
      });
      setTaskTitle('');
      setTaskDesc('');
      setTaskAssignee('');
      setTaskDueDate('');
      setShowTaskForm(false);
      fetchTasks(selectedProj.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenReview = async (task) => {
    setReviewingTask(task);
    try {
      // Fetch submissions for projects and filter this task
      const res = await API.get('/api/manager/submissions');
      const sub = res.data.find(s => s.task_id === task.id && s.status === 'Pending');
      setActiveSubmission(sub || null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewingTask || !activeSubmission) return;

    try {
      await API.put(`/api/manager/submissions/${activeSubmission.id}/review`, {
        status: reviewStatus,
        reviewer_feedback: reviewFeedback
      });
      setReviewingTask(null);
      setActiveSubmission(null);
      setReviewFeedback('');
      fetchTasks(selectedProj.id);
      alert(`Submission reviewed as: ${reviewStatus}`);
    } catch (err) {
      console.error(err);
      alert("Failed to save review");
    }
  };

  const getEmpName = (empId) => {
    const emp = employees.find(e => e.id === empId);
    return emp && emp.profile ? `${emp.profile.first_name} ${emp.profile.last_name}` : `User #${empId}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-5 border-b border-enterprise-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-enterprise-50 flex items-center space-x-2">
            <FolderKanban className="w-5 h-5 text-brand-primary" />
            <span>Projects Workspace</span>
          </h2>
          <p className="text-xs text-enterprise-400 mt-1">Manager Panel: Track task Kanban pipelines, add milestones, and review employee code submissions.</p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Project selector dropdown */}
          {projects.length > 0 && (
            <select
              value={selectedProj?.id || ''}
              onChange={(e) => {
                const proj = projects.find(p => p.id === parseInt(e.target.value));
                setSelectedProj(proj);
              }}
              className="px-4 py-2 bg-enterprise-900 border border-enterprise-800 rounded-xl text-xs text-enterprise-150 font-bold focus:outline-none"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => setShowProjForm(true)}
            className="py-2 px-4 bg-enterprise-900 hover:bg-enterprise-800 text-enterprise-200 border border-enterprise-800 rounded-xl text-xs font-semibold shadow transition-colors cursor-pointer flex items-center space-x-1"
          >
            <Plus className="w-4 h-4 text-brand-primary" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* CREATE PROJECT FORM MODAL */}
      {showProjForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6">
          <div className="w-full max-w-lg bg-enterprise-900 border border-enterprise-800 rounded-2xl shadow-xl p-6">
            <h3 className="font-extrabold text-white text-base mb-4">Establish New Project Milestone</h3>
            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="block text-enterprise-450 font-bold uppercase tracking-wider text-[10px]">Project Title</label>
                <input
                  type="text"
                  required
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  placeholder="e.g. Workforce AI RAG Engine"
                  className="w-full px-4 py-2.5 bg-enterprise-950 border border-enterprise-850 rounded-xl text-enterprise-100 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-enterprise-450 font-bold uppercase tracking-wider text-[10px]">Description</label>
                <textarea
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  placeholder="Detail project goals, core dependencies, and features..."
                  className="w-full h-[80px] p-3 bg-enterprise-950 border border-enterprise-850 rounded-xl text-enterprise-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-enterprise-450 font-bold uppercase tracking-wider text-[10px]">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-enterprise-950 border border-enterprise-850 rounded-xl text-enterprise-100 focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-enterprise-450 font-bold uppercase tracking-wider text-[10px]">Target End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-enterprise-950 border border-enterprise-850 rounded-xl text-enterprise-100 focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-enterprise-450 font-bold uppercase tracking-wider text-[10px]">Status</label>
                  <select
                    value={projStatus}
                    onChange={(e) => setProjStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-enterprise-950 border border-enterprise-850 rounded-xl text-enterprise-100 focus:outline-none"
                  >
                    <option value="Planning">Planning</option>
                    <option value="Active">Active</option>
                    <option value="Testing">Testing</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProjForm(false)}
                  className="py-2 px-4 bg-enterprise-800 hover:bg-enterprise-750 text-enterprise-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-brand-primary hover:bg-brand-hover text-white rounded-xl font-bold shadow cursor-pointer"
                >
                  Initialize Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE TASK FORM MODAL */}
      {showTaskForm && selectedProj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6">
          <div className="w-full max-w-lg bg-enterprise-900 border border-enterprise-800 rounded-2xl shadow-xl p-6">
            <h3 className="font-extrabold text-white text-base mb-4">Add Task under {selectedProj.name}</h3>
            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="block text-enterprise-450 font-bold uppercase tracking-wider text-[10px]">Task Title</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Design vector database schema"
                  className="w-full px-4 py-2.5 bg-enterprise-950 border border-enterprise-850 rounded-xl text-enterprise-100 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-enterprise-450 font-bold uppercase tracking-wider text-[10px]">Task Description</label>
                <textarea
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Summarize the core requirements, expected endpoints, or files for this task..."
                  className="w-full h-[80px] p-3 bg-enterprise-950 border border-enterprise-850 rounded-xl text-enterprise-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-enterprise-450 font-bold uppercase tracking-wider text-[10px]">Assignee</label>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full px-3 py-2 bg-enterprise-950 border border-enterprise-850 rounded-xl text-enterprise-100 focus:outline-none"
                  >
                    <option value="">Choose Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{getEmpName(emp.id)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-enterprise-450 font-bold uppercase tracking-wider text-[10px]">Task Weight (Points)</label>
                  <select
                    value={taskWeight}
                    onChange={(e) => setTaskWeight(e.target.value)}
                    className="w-full px-3 py-2 bg-enterprise-950 border border-enterprise-850 rounded-xl text-enterprise-100 focus:outline-none"
                  >
                    <option value="1">1 (Easy)</option>
                    <option value="2">2 (Medium-Easy)</option>
                    <option value="3">3 (Medium)</option>
                    <option value="4">4 (Medium-Hard)</option>
                    <option value="5">5 (Hard)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-enterprise-450 font-bold uppercase tracking-wider text-[10px]">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-enterprise-950 border border-enterprise-850 rounded-xl text-enterprise-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTaskForm(false)}
                  className="py-2 px-4 bg-enterprise-800 hover:bg-enterprise-750 text-enterprise-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-brand-primary hover:bg-brand-hover text-white rounded-xl font-bold shadow cursor-pointer"
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TASK SUBMISSION REVIEW MODAL */}
      {reviewingTask && activeSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
          <div className="w-full max-w-lg bg-enterprise-900 border border-enterprise-800 rounded-2xl shadow-xl p-6">
            <h3 className="font-extrabold text-white text-base mb-2">Review Submitted Work</h3>
            <p className="text-[11px] text-enterprise-500 border-b border-enterprise-850 pb-3 mb-4">
              Review details for Task: <strong className="text-enterprise-300">"{reviewingTask.title}"</strong>
            </p>

            {/* Submission Detail Card */}
            <div className="bg-enterprise-950 border border-enterprise-850 p-4 rounded-xl mb-4 text-xs space-y-3">
              <div className="flex justify-between items-center text-enterprise-500 font-bold">
                <span>Submitted: {new Date(activeSubmission.submitted_at).toLocaleString()}</span>
                <span className="text-brand-info font-bold">Pending Review</span>
              </div>
              
              {activeSubmission.github_link && (
                <div className="flex items-center space-x-1.5">
                  <strong className="text-enterprise-400">GitHub Link:</strong>
                  <a 
                    href={activeSubmission.github_link} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-brand-primary hover:underline flex items-center space-x-1"
                  >
                    <span>Open Pull Request</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {activeSubmission.drive_link && (
                <div className="flex items-center space-x-1.5">
                  <strong className="text-enterprise-400">Google Drive:</strong>
                  <a 
                    href={activeSubmission.drive_link} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-brand-success hover:underline flex items-center space-x-1"
                  >
                    <span>Open Drive File</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <p className="text-enterprise-300 leading-relaxed font-medium">
                <strong>Submission Notes:</strong><br />
                {activeSubmission.notes || 'No comments provided.'}
              </p>
            </div>

            {/* Review Decision Form */}
            <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="block text-enterprise-450 font-bold uppercase tracking-wider text-[10px]">Review Decision</label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  className="w-full px-4 py-2 bg-enterprise-950 border border-enterprise-850 rounded-xl text-enterprise-100 focus:outline-none"
                >
                  <option value="Approved">Approve Work (Complete Task)</option>
                  <option value="Changes Requested">Request Changes (Reopen Task)</option>
                  <option value="Rejected">Reject Submission</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-enterprise-450 font-bold uppercase tracking-wider text-[10px]">Reviewer Feedback</label>
                <textarea
                  required
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  placeholder="Detail your feedback, code critique, or alignment instructions..."
                  className="w-full h-[100px] p-4 bg-enterprise-950 border border-enterprise-850 focus:border-brand-primary rounded-xl text-enterprise-100 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setReviewingTask(null); setActiveSubmission(null); }}
                  className="py-2 px-4 bg-enterprise-800 hover:bg-enterprise-750 text-enterprise-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-brand-primary hover:bg-brand-hover text-white rounded-xl font-bold shadow cursor-pointer"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KANBAN BOARD CONTAINER */}
      {!selectedProj ? (
        <div className="text-center py-20 bg-enterprise-900 border border-enterprise-800 border-dashed rounded-xl">
          <FolderKanban className="w-12 h-12 text-enterprise-750 mx-auto mb-3" />
          <p className="text-sm text-enterprise-500 font-semibold">Please create a project milestone to begin tracking.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-enterprise-100 text-base flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-brand-success animate-ping"></div>
                <span>Workspace: {selectedProj.name}</span>
              </h3>
              <p className="text-xs text-enterprise-550 mt-1 max-w-xl">{selectedProj.description}</p>
            </div>
            <button
              onClick={() => setShowTaskForm(true)}
              className="py-2 px-4 bg-brand-primary hover:bg-brand-hover text-white rounded-xl text-xs font-semibold shadow shadow-brand-primary/10 transition-all cursor-pointer flex items-center space-x-1"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Assign Task</span>
            </button>
          </div>

          {/* Kanban Board Component */}
          <KanbanBoard 
            tasks={tasks}
            onTaskClick={() => {}} // employee-only submission trigger
            onReviewClick={handleOpenReview}
            userRole={user.role}
          />
        </div>
      )}
    </div>
  );
};

export default Projects;
