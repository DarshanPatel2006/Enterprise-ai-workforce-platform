import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import TufHackLogo from './TufHackLogo';
import { 
  LayoutDashboard, Users, FolderKanban, HelpCircle, 
  Settings, LogOut, FileText, CalendarRange, Clock, 
  MessageSquareCode, ShieldAlert, Award
} from 'lucide-react';

const Navigation = () => {
  const { user, logout } = useContext(AuthContext);
  if (!user) return null;

  const role = user.role;

  // Define navigation items dynamically by role
  const menuItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/ai-assistant', label: 'AI Workspace', icon: MessageSquareCode },
    { to: '/tickets', label: 'Support Tickets', icon: HelpCircle },
  ];

  if (role === 'Super Admin') {
    menuItems.push(
      { to: '/admin/hr', label: 'HR Accounts', icon: Users },
      { to: '/admin/departments', label: 'Departments', icon: Settings },
      { to: '/admin/logs', label: 'System Logs', icon: ShieldAlert }
    );
  }

  if (role === 'HR') {
    menuItems.push(
      { to: '/hr/employees', label: 'Employee Manager', icon: Users },
      { to: '/hr/salaries', label: 'Salary Manager', icon: Clock },
      { to: '/hr/leaves', label: 'Leave Approvals', icon: CalendarRange },
      { to: '/hr/documents', label: 'Document Center', icon: FileText }
    );
  }

  if (role === 'Manager') {
    menuItems.push(
      { to: '/manager/teams', label: 'Team Setup', icon: Users },
      { to: '/manager/projects', label: 'Projects & Tasks', icon: FolderKanban }
    );
  }

  return (
    <aside className="w-64 bg-enterprise-900 border-r border-enterprise-800 flex flex-col h-screen fixed left-0 top-0">
      {/* Header Logo */}
      <div className="p-6 border-b border-enterprise-800 flex flex-col space-y-2">
        <TufHackLogo className="text-sm" />
        <span className="text-[10px] text-enterprise-500 font-bold tracking-wider uppercase">{role} Panel</span>
      </div>

      {/* Nav Menu Links */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => 
                `flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive 
                    ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/10' 
                    : 'text-enterprise-400 hover:bg-enterprise-800 hover:text-enterprise-100'
                }`
              }
            >
              <IconComponent className="w-5 h-5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-enterprise-800 bg-enterprise-950/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-enterprise-800 border border-enterprise-700 flex items-center justify-center font-bold text-brand-primary uppercase">
              {user.profile ? user.profile.first_name[0] : 'A'}
            </div>
            <div className="truncate w-28">
              <p className="text-xs font-bold text-enterprise-100 truncate">
                {user.profile ? `${user.profile.first_name} ${user.profile.last_name}` : 'Admin'}
              </p>
              <p className="text-[10px] text-enterprise-500 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="p-2 text-enterprise-500 hover:text-brand-danger rounded-lg hover:bg-enterprise-800 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Navigation;
