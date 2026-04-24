import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('tf_token');
    const saved = localStorage.getItem('tf_user');
    if (token && saved) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          setUser(JSON.parse(saved));
          const msLeft = payload.exp * 1000 - Date.now();
          setTimeout(() => logout(), msLeft);
        } else {
          localStorage.removeItem('tf_token');
          localStorage.removeItem('tf_user');
        }
      } catch { localStorage.removeItem('tf_token'); localStorage.removeItem('tf_user'); }
    }
    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem('tf_token');
    localStorage.removeItem('tf_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
