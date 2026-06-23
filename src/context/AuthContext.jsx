import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext(null);

// Decode JWT helper function (no external library needed)
const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('access_token'));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refresh_token'));
  const [loading, setLoading] = useState(true);

  // Initialize and check token validity on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedAccess = localStorage.getItem('access_token');
      const storedRefresh = localStorage.getItem('refresh_token');

      if (storedAccess) {
        const decoded = decodeToken(storedAccess);
        if (decoded) {
          // Check expiration (exp is in seconds, Date.now() is in ms)
          if (decoded.exp * 1000 > Date.now()) {
            // Token is still valid
            setUser(decoded);
            setLoading(false);
            return;
          } else if (storedRefresh) {
            // Token is expired, try to refresh
            try {
              const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
              const response = await axios.post(`${apiBaseUrl}/api/auth/refresh/`, {
                refresh: storedRefresh,
              });
              const { access, refresh } = response.data;
              
              localStorage.setItem('access_token', access);
              if (refresh) {
                localStorage.setItem('refresh_token', refresh);
              }
              
              setAccessToken(access);
              if (refresh) setRefreshToken(refresh);
              
              const newDecoded = decodeToken(access);
              setUser(newDecoded);
              setLoading(false);
              return;
            } catch (err) {
              console.error('Failed to auto-refresh token on load', err);
            }
          }
        }
      }
      
      // If we reach here, tokens are missing or invalid
      logout();
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Login handler
  const login = (tokens) => {
    const { access, refresh } = tokens;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    setAccessToken(access);
    setRefreshToken(refresh);
    
    const decoded = decodeToken(access);
    setUser(decoded);
  };

  // Logout handler
  const logout = async () => {
    const storedRefresh = localStorage.getItem('refresh_token');
    if (storedRefresh) {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        await axios.post(`${apiBaseUrl}/api/auth/logout/`, {
          refresh: storedRefresh,
        });
      } catch (err) {
        console.error('Logout API call failed', err);
      }
    }
    
    localStorage.clear();
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  };

  const value = {
    user,
    accessToken,
    refreshToken,
    loading,
    isAuthenticated: !!user,
    isAdmin: !!user?.is_admin,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
