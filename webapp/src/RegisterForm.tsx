import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import ModelBackground from './ModelBackground';

const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [age, setAge] = useState('');
  const [country, setCountry] = useState('');
  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const registerUser = async (
    usernameToRegister: string,
    emailToRegister: string,
    passwordToRegister: string,
    ageToRegister: string,
    countryToRegister: string
  ): Promise<void> => {
    try {
      const gatewayUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
      const registerData = {
        username: usernameToRegister,
        email: emailToRegister,
        password: passwordToRegister,
        age: ageToRegister ? parseInt(ageToRegister) : undefined,
        country: countryToRegister,
      };

      const res = await fetch(`${gatewayUrl}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      });

      const data = await res.json();
      if (res.ok) {
        setResponseMessage(data.message);
        setUsername(''); setEmail(''); setPassword('');
        setPasswordConfirm(''); setAge(''); setCountry('');
        setTimeout(() => navigate('/login'), 1500);
      } else if (res.status >= 400 && res.status < 500) {
        setError(data.error || 'Invalid input. Please check your data and try again.');
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
    if (!email.trim()) { setError('Please enter an email.'); return; }
    if (!password.trim()) { setError('Please enter a password.'); return; }
    if (password !== passwordConfirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    await registerUser(username, email, password, age, country);
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#fff',
    borderRadius: '8px',
  };

  const labelStyle = {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '0.8rem',
    letterSpacing: '0.05em',
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
          ◆ Join the game ◆
        </div>
        <h1 style={{
          fontSize: 'clamp(2.5rem, 4vw, 3.5rem)',
          fontWeight: 900,
          color: '#fff',
          margin: 0,
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}>
          Sign<br />
          <span style={{ color: '#6366f1' }}>Up</span>
        </h1>
        <p style={{
          color: 'rgba(255,255,255,0.4)',
          fontSize: '0.95rem',
          marginTop: '1rem',
          lineHeight: 1.6,
        }}>
          Create your account<br />and start playing.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <Label htmlFor="username" style={labelStyle}>Username</Label>
          <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <Label htmlFor="email" style={labelStyle}>Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <Label htmlFor="password" style={labelStyle}>Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <Label htmlFor="passwordConfirm" style={labelStyle}>Confirm Password</Label>
          <Input id="passwordConfirm" type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
            <Label htmlFor="age" style={labelStyle}>Age (optional)</Label>
            <Input id="age" type="number" value={age} min="0" onChange={(e) => setAge(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
            <Label htmlFor="country" style={labelStyle}>Country (optional)</Label>
            <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} style={inputStyle} />
          </div>
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
            marginTop: '0.25rem',
          }}
        >
          {loading ? 'Creating account…' : 'Register'}
        </Button>

        {responseMessage && (
          <p style={{ color: '#4ade80', fontSize: '0.85rem', textAlign: 'center' }}>{responseMessage}</p>
        )}
        {error && (
          <p style={{ color: '#f87171', fontSize: '0.85rem', textAlign: 'center' }}>{error}</p>
        )}

        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', textAlign: 'center' }}>
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            style={{
              background: 'none', border: 'none',
              color: '#6366f1', cursor: 'pointer',
              fontSize: 'inherit', textDecoration: 'underline',
            }}
          >
            Log in
          </button>
        </p>
      </form>
    </ModelBackground>
  );
};

export default RegisterForm;