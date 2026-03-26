import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import ModelBackground from './ModelBackground';

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loginUser = async (usernameToLogin: string, passwordToLogin: string): Promise<void> => {
    try {
      const gatewayUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
      const loginData = { username: usernameToLogin, password: passwordToLogin };

      const res = await fetch(`${gatewayUrl}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.userId);
        setResponseMessage(data.message);
        setUsername('');
        setPassword('');
        setTimeout(() => navigate('/menu'), 1000);
      } else {
        setError(data.error || 'Server error');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setResponseMessage(null);
    setError(null);
    if (!username.trim()) { setError('Please enter a username.'); return; }
    if (!password.trim()) { setError('Please enter a password.'); return; }
    setLoading(true);
    await loginUser(username, password);
  };

  return (
    <ModelBackground>
      {/* Header */}
      <div>
        <div style={{
          fontSize: '0.7rem', letterSpacing: '0.4em',
          color: '#6366f1', textTransform: 'uppercase',
          marginBottom: '0.75rem',
        }}>
          ◆ Welcome back ◆
        </div>
        <h1 style={{
          fontSize: 'clamp(2.5rem, 4vw, 3.5rem)',
          fontWeight: 900,
          color: '#fff',
          margin: 0,
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}>
          Log<br />
          <span style={{ color: '#6366f1' }}>In</span>
        </h1>
        <p style={{
          color: 'rgba(255,255,255,0.4)',
          fontSize: '0.95rem',
          marginTop: '1rem',
          lineHeight: 1.6,
        }}>
          Good to see you again.<br />Your board awaits.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <Label htmlFor="username" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
            Username
          </Label>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff',
              borderRadius: '8px',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <Label htmlFor="password" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
            Password
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff',
              borderRadius: '8px',
            }}
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          style={{
            height: '3.25rem',
            background: '#6366f1',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.95rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            cursor: 'pointer',
            marginTop: '0.5rem',
          }}
        >
          {loading ? 'Logging in…' : 'Login'}
        </Button>

        {responseMessage && (
          <p style={{ color: '#4ade80', fontSize: '0.85rem', textAlign: 'center' }}>{responseMessage}</p>
        )}
        {error && (
          <p style={{ color: '#f87171', fontSize: '0.85rem', textAlign: 'center' }}>{error}</p>
        )}

        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', textAlign: 'center', marginTop: '0.5rem' }}>
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/register')}
            style={{
              background: 'none', border: 'none',
              color: '#6366f1', cursor: 'pointer',
              fontSize: 'inherit', textDecoration: 'underline',
            }}
          >
            Sign up
          </button>
        </p>
      </form>
    </ModelBackground>
  );
};

export default LoginForm;