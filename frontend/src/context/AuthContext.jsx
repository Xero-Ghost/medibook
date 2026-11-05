import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('medibook-token')));

  const logout = useCallback(() => {
    localStorage.removeItem('medibook-token');
    setUser(null);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('medibook-token')) {
      setLoading(false);
      return;
    }
    api.get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [logout]);

  const signIn = useCallback(async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem('medibook-token', data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const signUp = useCallback(async (details) => {
    const { data } = await api.post('/auth/register', details);
    localStorage.setItem('medibook-token', data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const value = useMemo(() => ({ user, loading, signIn, signUp, logout, setUser }), [user, loading, signIn, signUp, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
