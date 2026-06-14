import React, { createContext, useState, useEffect } from 'react';
import API from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    const savedToken = localStorage.getItem('workforce_token');
    const savedUser = localStorage.getItem('workforce_user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      
      // Verify and refresh profile from backend
      try {
        const res = await API.get('/api/employee/me');
        setUser(res.data);
        localStorage.setItem('workforce_user', JSON.stringify(res.data));
      } catch (err) {
        console.error("Token verification failed, logging out", err);
        logout();
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await API.post('/api/auth/login', { email, password });
      const { access_token, role, name } = response.data;
      
      localStorage.setItem('workforce_token', access_token);
      setToken(access_token);
      
      // Load user profile details
      const profileRes = await API.get('/api/employee/me');
      const userProfile = profileRes.data;
      
      localStorage.setItem('workforce_user', JSON.stringify(userProfile));
      setUser(userProfile);
      
      setLoading(false);
      return { success: true, role };
    } catch (error) {
      setLoading(false);
      const msg = error.response?.data?.detail || "Invalid email or password";
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('workforce_token');
    localStorage.removeItem('workforce_user');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshProfile: checkToken }}>
      {children}
    </AuthContext.Provider>
  );
};
