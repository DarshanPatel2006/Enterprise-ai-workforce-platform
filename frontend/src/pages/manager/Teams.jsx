import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import API from '../../services/api';
import { Users, Plus, ShieldCheck, ArrowRight } from 'lucide-react';

const Teams = () => {
  const { user } = useContext(AuthContext);
  const [teams, setTeams] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [teamName, setTeamName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [teamsRes, empRes] = await Promise.all([
        API.get('/api/manager/teams'),
        API.get('/api/hr/employees')
      ]);
      setTeams(teamsRes.data);
      // Filter out admins from possible team members
      setEmployees(empRes.data.filter(u => u.role === 'Employee' || u.role === 'Manager'));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleToggleMember = (empId) => {
    if (selectedMembers.includes(empId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== empId));
    } else {
      setSelectedMembers([...selectedMembers, empId]);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!teamName.trim()) return;

    try {
      await API.post('/api/manager/teams', {
        name: teamName,
        manager_id: user.id,
        member_ids: selectedMembers
      });
      setTeamName('');
      setSelectedMembers([]);
      setShowAddForm(false);
      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Failed to create team");
    }
  };

  const getEmpName = (empId) => {
    const emp = employees.find(e => e.id === empId);
    return emp && emp.profile ? `${emp.profile.first_name} ${emp.profile.last_name}` : `Staff #${empId}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-5 border-b border-enterprise-800 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-enterprise-50 flex items-center space-x-2">
            <Users className="w-5 h-5 text-brand-primary" />
            <span>Team Workspace Builder</span>
          </h2>
          <p className="text-xs text-enterprise-400 mt-1">Manager Panel: Design operational team segments and allocate staff workloads.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="py-2 px-4 bg-brand-primary hover:bg-brand-hover text-white rounded-xl text-xs font-semibold shadow transition-colors cursor-pointer flex items-center space-x-1"
        >
          <Plus className="w-4 h-4" />
          <span>Create Team Structure</span>
        </button>
      </div>

      {/* CREATE FORM */}
      {showAddForm && (
        <div className="p-6 bg-enterprise-900 border border-enterprise-800 rounded-xl shadow-sm space-y-4">
          <h3 className="font-bold text-enterprise-100 text-sm">Create New Team Segment</h3>
          {errorMsg && (
            <div className="p-2.5 bg-red-950/20 border border-red-500/30 rounded-lg text-xs font-bold text-brand-danger">
              {errorMsg}
            </div>
          )}
          <form onSubmit={handleCreateTeam} className="space-y-4 text-xs">
            <div className="space-y-2">
              <label className="block text-enterprise-450 font-bold uppercase tracking-wider text-[10px]">Team Name</label>
              <input
                type="text"
                required
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. AI Integrations Squad"
                className="w-full px-4 py-2.5 bg-enterprise-950 border border-enterprise-850 focus:border-brand-primary rounded-xl text-enterprise-100 focus:outline-none"
              />
            </div>

            {/* Select Members checkbox list */}
            <div className="space-y-2">
              <label className="block text-enterprise-450 font-bold uppercase tracking-wider text-[10px]">Select Members</label>
              <div className="bg-enterprise-950 border border-enterprise-850 rounded-xl p-4 max-h-[180px] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3">
                {employees.map(emp => (
                  <label 
                    key={emp.id}
                    className="flex items-center space-x-3 p-2 bg-enterprise-900 border border-enterprise-850/50 hover:border-enterprise-750 rounded-lg cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(emp.id)}
                      onChange={() => handleToggleMember(emp.id)}
                      className="w-4 h-4 text-brand-primary bg-enterprise-950 border-enterprise-800 rounded"
                    />
                    <div>
                      <p className="font-semibold text-enterprise-200">
                        {emp.profile ? `${emp.profile.first_name} ${emp.profile.last_name}` : emp.email}
                      </p>
                      <p className="text-[10px] text-enterprise-500 mt-0.5">{emp.role} • {emp.profile?.employee_id}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="py-2 px-4 bg-enterprise-800 hover:bg-enterprise-750 text-enterprise-300 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!teamName.trim() || selectedMembers.length === 0}
                className="py-2 px-4 bg-brand-primary hover:bg-brand-hover disabled:bg-enterprise-800 disabled:text-enterprise-550 text-white rounded-xl font-bold shadow cursor-pointer"
              >
                Assemble Team
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TEAMS GRID LIST */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-primary"></div>
        </div>
      ) : teams.length === 0 ? (
        <div className="text-center py-16 bg-enterprise-900 border border-enterprise-800 rounded-xl">
          <Users className="w-12 h-12 text-enterprise-750 mx-auto mb-3" />
          <p className="text-sm text-enterprise-500 font-semibold">No active teams managed yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {teams.map(team => (
            <div 
              key={team.id}
              className="bg-enterprise-900 border border-enterprise-800 rounded-xl p-6 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-enterprise-850 mb-4">
                  <h3 className="font-bold text-enterprise-100 text-sm">{team.name}</h3>
                  <span className="flex items-center space-x-1 text-[10px] font-bold text-brand-success bg-brand-success/10 border border-brand-success/25 px-2 py-0.5 rounded">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Manager ID: {team.manager_id}</span>
                  </span>
                </div>
                
                {/* Team Members List */}
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  <p className="text-[10px] font-bold text-enterprise-500 uppercase tracking-wider mb-2">Team Roll Call</p>
                  {team.members?.length === 0 || !team.members ? (
                    <p className="text-xs text-enterprise-600">No members assigned.</p>
                  ) : (
                    team.members.map(m => (
                      <div key={m.id} className="p-2.5 bg-enterprise-950 border border-enterprise-850/50 rounded-lg text-xs flex items-center space-x-3">
                        <div className="w-6 h-6 rounded-full bg-enterprise-850 flex items-center justify-center font-extrabold text-[10px] text-brand-primary uppercase">
                          {getEmpName(m.employee_id)[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-enterprise-250">{getEmpName(m.employee_id)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Teams;
