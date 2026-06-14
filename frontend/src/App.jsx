import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import Navigation from './components/Navigation';

// Import Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AIWorkspace from './pages/AIWorkspace';
import Tickets from './pages/Tickets';

// Admin Pages
import HrAccounts from './pages/admin/HrAccounts';
import Departments from './pages/admin/Departments';
import SystemLogs from './pages/admin/SystemLogs';

// HR Pages
import EmployeeManager from './pages/hr/EmployeeManager';
import SalaryManager from './pages/hr/SalaryManager';
import LeaveApprovals from './pages/hr/LeaveApprovals';
import DocumentCenter from './pages/hr/DocumentCenter';

// Manager Pages
import Teams from './pages/manager/Teams';
import Projects from './pages/manager/Projects';

// Route Guard to verify user is authenticated
const PrivateRoute = ({ children }) => {
  const { token, loading } = useContext(AuthContext);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-enterprise-950">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-brand-primary"></div>
      </div>
    );
  }
  
  return token ? children : <Navigate to="/login" replace />;
};

// Route Guard to verify user has role permissions
const RoleRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-enterprise-950">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-brand-primary"></div>
      </div>
    );
  }
  
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// App Layout wrapper containing sidebar and content area
const AppLayout = () => {
  return (
    <div className="flex min-h-screen bg-enterprise-950">
      <Navigation />
      <main className="flex-1 ml-64 p-8 min-h-screen overflow-x-hidden">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ai-assistant" element={<AIWorkspace />} />
          <Route path="/tickets" element={<Tickets />} />
          
          {/* Admin routes */}
          <Route path="/admin/hr" element={
            <RoleRoute allowedRoles={['Super Admin']}><HrAccounts /></RoleRoute>
          } />
          <Route path="/admin/departments" element={
            <RoleRoute allowedRoles={['Super Admin']}><Departments /></RoleRoute>
          } />
          <Route path="/admin/logs" element={
            <RoleRoute allowedRoles={['Super Admin']}><SystemLogs /></RoleRoute>
          } />

          {/* HR routes */}
          <Route path="/hr/employees" element={
            <RoleRoute allowedRoles={['HR', 'Super Admin']}><EmployeeManager /></RoleRoute>
          } />
          <Route path="/hr/salaries" element={
            <RoleRoute allowedRoles={['HR', 'Super Admin']}><SalaryManager /></RoleRoute>
          } />
          <Route path="/hr/leaves" element={
            <RoleRoute allowedRoles={['HR', 'Super Admin']}><LeaveApprovals /></RoleRoute>
          } />
          <Route path="/hr/documents" element={
            <RoleRoute allowedRoles={['HR', 'Super Admin']}><DocumentCenter /></RoleRoute>
          } />

          {/* Manager routes */}
          <Route path="/manager/teams" element={
            <RoleRoute allowedRoles={['Manager', 'HR', 'Super Admin']}><Teams /></RoleRoute>
          } />
          <Route path="/manager/projects" element={
            <RoleRoute allowedRoles={['Manager', 'HR', 'Super Admin']}><Projects /></RoleRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
