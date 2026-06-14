import React, { useState, useEffect, useContext } from 'react';
import API from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { Users, Plus, Trash2, Edit2, Ban, CheckCircle, XCircle } from 'lucide-react';

const EmployeeManager = () => {
  const { user } = useContext(AuthContext);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const handleUploadPhotoHR = async (e) => {
    const file = e.target.files[0];
    if (!file || !editingUser) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await API.post(`/api/hr/employees/${editingUser.id}/upload-photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("Employee ID photo updated successfully!");
      setEditingUser({
        ...editingUser,
        profile: {
          ...editingUser.profile,
          photo_url: res.data.photo_url
        }
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Photo upload failed");
    }
  };

  // Form State
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('Employee');
  const [salary, setSalary] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [managerId, setManagerId] = useState('');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [errorMsg, setErrorMsg] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [officeLocation, setOfficeLocation] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, deptRes] = await Promise.all([
        API.get('/api/hr/employees'),
        API.get('/api/admin/departments')
      ]);
      setEmployees(empRes.data);
      setDepartments(deptRes.data);
      
      // Managers list are employees who have role 'Manager'
      const mgrList = empRes.data.filter(u => u.role === 'Manager');
      setManagers(mgrList);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleCreateOrUpdateEmployee = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    const payload = {
      employee_id: employeeId,
      email,
      first_name: firstName,
      last_name: lastName,
      role,
      salary: parseFloat(salary) || 0,
      department_id: departmentId ? parseInt(departmentId) : null,
      manager_id: managerId ? parseInt(managerId) : null,
      joining_date: joiningDate,
      leave_balance: 24,
      attendance_percentage: 100.0,
      status: "active",
      blood_group: bloodGroup || null,
      office_location: officeLocation || null
    };

    try {
      if (editingUser) {
        // Update Employee
        await API.put(`/api/hr/employees/${editingUser.id}`, {
          first_name: firstName,
          last_name: lastName,
          salary: parseFloat(salary) || 0,
          department_id: departmentId ? parseInt(departmentId) : null,
          manager_id: managerId ? parseInt(managerId) : null,
          role,
          status: editingUser.profile?.status || "active",
          blood_group: bloodGroup || null,
          office_location: officeLocation || null
        });
      } else {
        // Create Employee
        payload.password = password;
        await API.post('/api/hr/employees', payload);
      }
      
      // Clear form
      resetForm();
      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Action failed");
    }
  };

  const resetForm = () => {
    setEmployeeId('');
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setRole('Employee');
    setSalary('');
    setDepartmentId('');
    setManagerId('');
    setShowForm(false);
    setEditingUser(null);
    setErrorMsg('');
    setBloodGroup('');
    setOfficeLocation('');
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setEmployeeId(user.profile?.employee_id || '');
    setEmail(user.email);
    setFirstName(user.profile?.first_name || '');
    setLastName(user.profile?.last_name || '');
    setRole(user.role);
    setSalary(user.profile?.salary || '');
    setDepartmentId(user.profile?.department_id || '');
    setManagerId(user.profile?.manager_id || '');
    setJoiningDate(user.profile?.joining_date || new Date().toISOString().split('T')[0]);
    setBloodGroup(user.profile?.blood_group || '');
    setOfficeLocation(user.profile?.office_location || '');
    setShowForm(true);
  };

  const handleToggleActive = async (userId) => {
    try {
      await API.put(`/api/hr/employees/${userId}/toggle`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEmployee = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this employee account?")) return;
    try {
      await API.delete(`/api/hr/employees/${userId}`);
      fetchData();
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
            <span>Employee Lifecycle Manager</span>
          </h2>
          <p className="text-xs text-enterprise-400 mt-1">HR Panel: Onboard staff, assign managers and departments, and update profiles.</p>
        </div>
        <button
          onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          className="py-2 px-4 bg-brand-primary hover:bg-brand-hover text-white rounded-xl text-xs font-semibold shadow transition-colors cursor-pointer flex items-center space-x-1"
        >
          <Plus className="w-4 h-4" />
          <span>{editingUser ? 'Cancel Edit' : 'Add Employee'}</span>
        </button>
      </div>

      {/* CREATE / EDIT FORM */}
      {showForm && (
        <div className="p-6 bg-enterprise-900 border border-enterprise-800 rounded-xl shadow-sm space-y-4">
          <h3 className="font-bold text-enterprise-100 text-sm">
            {editingUser ? `Edit Profile: ${firstName} ${lastName}` : 'Onboard New Employee'}
          </h3>
          {errorMsg && (
            <div className="p-2.5 bg-red-950/20 border border-red-500/30 rounded-lg text-xs font-bold text-brand-danger">
              {errorMsg}
            </div>
          )}
          {editingUser && (
            <div className="p-4 bg-enterprise-950/60 border border-enterprise-850 rounded-xl flex items-center space-x-4">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-brand-primary bg-enterprise-900 flex-shrink-0 flex items-center justify-center">
                {editingUser.profile?.photo_url ? (
                  <img 
                    src={editingUser.profile.photo_url.startsWith('http') ? editingUser.profile.photo_url : `${API.defaults.baseURL || 'http://localhost:8000'}${editingUser.profile.photo_url}`} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Users className="w-8 h-8 text-enterprise-700" />
                )}
              </div>
              <div className="space-y-1.5 flex-1">
                <h4 className="text-xs font-bold text-enterprise-300 font-sans">ID Badge Identity Photo</h4>
                <p className="text-[10px] text-enterprise-500 font-sans">Upload a professional headshot to override this employee's ID card photo.</p>
                <label className="inline-block py-1.5 px-3 bg-enterprise-850 hover:bg-enterprise-750 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors border border-enterprise-700">
                  Upload Photo Override
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleUploadPhotoHR} 
                    className="hidden" 
                  />
                </label>
              </div>
            </div>
          )}
          <form onSubmit={handleCreateOrUpdateEmployee} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-enterprise-400 uppercase tracking-wider">Employee ID</label>
                <input
                  type="text"
                  required
                  disabled={!!editingUser}
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="e.g. EMP-302"
                  className="w-full px-4 py-2 bg-enterprise-950 border border-enterprise-850 focus:border-brand-primary rounded-xl text-xs text-enterprise-100 disabled:opacity-50 focus:outline-none"
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
              <div className="space-y-2">
                <label className="block text-xs font-bold text-enterprise-400 uppercase tracking-wider">Role / Access</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2 bg-enterprise-950 border border-enterprise-850 focus:border-brand-primary rounded-xl text-xs text-enterprise-100 focus:outline-none"
                >
                  <option value="Employee">Employee</option>
                  <option value="Manager">Manager</option>
                  {user?.role === 'Super Admin' && (
                    <option value="HR">HR Officer</option>
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-enterprise-400 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  disabled={!!editingUser}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@company.ai"
                  className="w-full px-4 py-2 bg-enterprise-950 border border-enterprise-850 focus:border-brand-primary rounded-xl text-xs text-enterprise-100 disabled:opacity-50 focus:outline-none"
                />
              </div>
              
              {!editingUser && (
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
              )}

              <div className="space-y-2">
                <label className="block text-xs font-bold text-enterprise-400 uppercase tracking-wider">Base Salary</label>
                <input
                  type="number"
                  required
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder="e.g. 75000"
                  className="w-full px-4 py-2 bg-enterprise-950 border border-enterprise-850 focus:border-brand-primary rounded-xl text-xs text-enterprise-100 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-enterprise-400 uppercase tracking-wider">Joining Date</label>
                <input
                  type="date"
                  required
                  disabled={!!editingUser}
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="w-full px-4 py-2 bg-enterprise-950 border border-enterprise-850 focus:border-brand-primary rounded-xl text-xs text-enterprise-100 disabled:opacity-50 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-enterprise-400 uppercase tracking-wider">Department Assignment</label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full px-4 py-2 bg-enterprise-950 border border-enterprise-850 focus:border-brand-primary rounded-xl text-xs text-enterprise-100 focus:outline-none"
                >
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-enterprise-400 uppercase tracking-wider">Reporting Manager</label>
                <select
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  className="w-full px-4 py-2 bg-enterprise-950 border border-enterprise-850 focus:border-brand-primary rounded-xl text-xs text-enterprise-100 focus:outline-none"
                >
                  <option value="">Select Manager</option>
                  {managers.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.profile ? `${m.profile.first_name} ${m.profile.last_name}` : m.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-enterprise-400 uppercase tracking-wider">Blood Group</label>
                <input
                  type="text"
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  placeholder="e.g. O+, A-, B+"
                  className="w-full px-4 py-2 bg-enterprise-950 border border-enterprise-850 focus:border-brand-primary rounded-xl text-xs text-enterprise-100 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-enterprise-400 uppercase tracking-wider">Office Location</label>
                <input
                  type="text"
                  value={officeLocation}
                  onChange={(e) => setOfficeLocation(e.target.value)}
                  placeholder="e.g. New York - Floor 4"
                  className="w-full px-4 py-2 bg-enterprise-950 border border-enterprise-850 focus:border-brand-primary rounded-xl text-xs text-enterprise-100 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="py-2 px-4 bg-enterprise-800 hover:bg-enterprise-750 text-enterprise-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2 px-4 bg-brand-primary hover:bg-brand-hover text-white rounded-xl text-xs font-semibold shadow"
              >
                {editingUser ? 'Save Profile' : 'Onboard Staff'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STAFF LIST TABLE */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-primary"></div>
        </div>
      ) : employees.length === 0 ? (
        <div className="text-center py-16 bg-enterprise-900 border border-enterprise-800 rounded-xl">
          <Users className="w-12 h-12 text-enterprise-750 mx-auto mb-3" />
          <p className="text-sm text-enterprise-500 font-semibold">No Employee profiles registered.</p>
        </div>
      ) : (
        <div className="bg-enterprise-900 border border-enterprise-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-enterprise-950 text-enterprise-500 font-bold border-b border-enterprise-850">
                  <th className="p-4 uppercase tracking-wider">Emp ID</th>
                  <th className="p-4 uppercase tracking-wider">Name</th>
                  <th className="p-4 uppercase tracking-wider">Email</th>
                  <th className="p-4 uppercase tracking-wider">Department</th>
                  <th className="p-4 uppercase tracking-wider">Role</th>
                  <th className="p-4 uppercase tracking-wider">Base Salary</th>
                  <th className="p-4 uppercase tracking-wider">Status</th>
                  <th className="p-4 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-enterprise-850/50">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-enterprise-950/40 transition-colors">
                    <td className="p-4 font-bold text-enterprise-300">
                      {emp.profile ? emp.profile.employee_id : `-`}
                    </td>
                    <td className="p-4 font-semibold text-enterprise-100">
                      {emp.profile ? `${emp.profile.first_name} ${emp.profile.last_name}` : 'Staff Profile'}
                    </td>
                    <td className="p-4 font-semibold text-enterprise-450">{emp.email}</td>
                    <td className="p-4 font-semibold text-enterprise-400">
                      {emp.profile && departments.find(d => d.id === emp.profile.department_id) 
                        ? departments.find(d => d.id === emp.profile.department_id).name
                        : 'Unassigned'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        emp.role === 'Manager' 
                          ? 'bg-brand-info/10 text-brand-info border border-brand-info/25'
                          : emp.role === 'HR'
                          ? 'bg-brand-warning/10 text-brand-warning border border-brand-warning/25'
                          : 'bg-enterprise-800 text-enterprise-300 border border-enterprise-750'
                      }`}>
                        {emp.role}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-enterprise-300">
                      {emp.profile ? `$${emp.profile.salary.toLocaleString()}` : '-'}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        emp.is_active 
                          ? 'bg-brand-success/10 text-brand-success border border-brand-success/20' 
                          : 'bg-brand-danger/10 text-brand-danger border border-brand-danger/20'
                      }`}>
                        {emp.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{emp.is_active ? 'Active' : 'Suspended'}</span>
                      </span>
                    </td>
                    <td className="p-4 text-right flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEditClick(emp)}
                        className="p-1.5 text-enterprise-400 hover:text-white rounded hover:bg-enterprise-800"
                        title="Edit Profile"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(emp.id)}
                        className={`p-1.5 rounded hover:bg-enterprise-800 ${emp.is_active ? 'text-brand-warning' : 'text-brand-success'}`}
                        title={emp.is_active ? 'Suspend Account' : 'Reactivate Account'}
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(emp.id)}
                        className="p-1.5 text-enterprise-500 hover:text-brand-danger rounded hover:bg-enterprise-800"
                        title="Delete Employee"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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

export default EmployeeManager;
