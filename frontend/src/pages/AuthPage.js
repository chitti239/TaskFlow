import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/AuthPage.module.css';

export default function AuthPage({ mode }) {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const isLogin = mode === 'login';

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) return setError('Please fill in both fields.');
    if (!isLogin && password.length < 4) return setError('Password must be at least 4 characters.');
    setLoading(true);
    try {
      const url = isLogin
        ? 'http://localhost:5000/api/auth/login'
        : 'http://localhost:5000/api/auth/register';

      const response = await axios.post(url, { username, password });

      localStorage.setItem('tf_token', response.data.token);
      localStorage.setItem('tf_user', JSON.stringify({ username: response.data.username }));
      setUser({ username: response.data.username });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.logo}>TaskFlow</div>
        <p className={styles.sub}>Your student task prioritizer</p>

        <div className={styles.tabRow}>
          <Link className={`${styles.tab} ${isLogin ? styles.active : ''}`} to="/login">Sign in</Link>
          <Link className={`${styles.tab} ${!isLogin ? styles.active : ''}`} to="/signup">Sign up</Link>
        </div>

        <form onSubmit={submit}>
          <div className={styles.field}>
            <label>Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="your username" autoComplete="username" />
          </div>
          <div className={styles.field}>
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" autoComplete={isLogin ? 'current-password' : 'new-password'} />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className={styles.switchText}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <Link to={isLogin ? '/signup' : '/login'}>{isLogin ? 'Sign up' : 'Sign in'}</Link>
        </p>
      </div>
    </div>
  );
}
