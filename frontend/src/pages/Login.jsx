import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Shield, Mail, Lock } from 'lucide-react';
import TufHackLogo from '../components/TufHackLogo';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!email || !password) {
      setErrorMsg("Please fill out all fields.");
      return;
    }
    
    const res = await login(email, password);
    if (res.success) {
      navigate('/');
    } else {
      setErrorMsg(res.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-enterprise-950 p-6">
      <div className="w-full max-w-md bg-enterprise-900 border border-enterprise-800 rounded-2xl shadow-xl overflow-hidden p-8">
        
        {/* Brand Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4">
            <TufHackLogo className="text-base" isDark={true} />
          </div>
          <h2 className="text-base font-extrabold text-enterprise-250">Enterprise Workforce Management</h2>
          <p className="text-xs text-enterprise-500 mt-1">Sign in to your workplace AI account</p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-6 p-3 bg-red-950/20 border border-red-500/30 rounded-lg text-xs font-medium text-brand-danger">
            {errorMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-enterprise-400 uppercase tracking-wider mb-2">
              Work Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-enterprise-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.ai"
                className="w-full pl-10 pr-4 py-3 bg-enterprise-950 border border-enterprise-800 hover:border-enterprise-750 focus:border-brand-primary rounded-xl text-sm text-enterprise-100 placeholder-enterprise-600 focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all duration-150"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-enterprise-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-enterprise-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-enterprise-950 border border-enterprise-800 hover:border-enterprise-750 focus:border-brand-primary rounded-xl text-sm text-enterprise-100 placeholder-enterprise-600 focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all duration-150"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-brand-primary hover:bg-brand-hover text-white font-semibold text-sm rounded-xl shadow-lg shadow-brand-primary/10 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary mt-6"
          >
            Sign In
          </button>
        </form>

        {/* Demo Accounts Details Helper */}
        <div className="mt-8 pt-6 border-t border-enterprise-800 text-[11px] text-enterprise-500">
          <p className="font-bold text-enterprise-400 mb-2">Portfolio Demo Accounts:</p>
          <ul className="space-y-1">
            <li><span className="font-semibold text-enterprise-300">Super Admin:</span> admin@enterprise.ai (admin123)</li>
            <li><span className="font-semibold text-enterprise-300">HR:</span> hr@enterprise.ai (hr123)</li>
            <li><span className="font-semibold text-enterprise-300">Manager:</span> manager@enterprise.ai (manager123)</li>
            <li><span className="font-semibold text-enterprise-300">Employee:</span> employee@enterprise.ai (employee123)</li>
          </ul>
        </div>

      </div>
    </div>
  );
};

export default Login;
