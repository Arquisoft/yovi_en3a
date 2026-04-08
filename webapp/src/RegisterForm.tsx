import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { CountryDropdown } from 'react-country-region-selector';
import ModelBackground from './ModelBackground';
import './RegisterForm.css';

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
      const res = await fetch(`${gatewayUrl}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usernameToRegister,
          email: emailToRegister,
          password: passwordToRegister,
          age: ageToRegister ? parseInt(ageToRegister) : undefined,
          country: countryToRegister,
        }),
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

  return (
    <ModelBackground>
      {/* Header */}
      <div>
        <div className="rf-header-badge">◆ Join the game ◆</div>
        <h1 className="rf-header-title">
          Sign<br />
          <span style={{ color: '#6366f1' }}>Up</span>
        </h1>
        <p className="rf-header-subtitle">
          Create your account<br />and start playing.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <Label htmlFor="username" className="rf-label">Username</Label>
        <Input id="username" className="rf-input" value={username} onChange={(e) => setUsername(e.target.value)} />
       </div>

       <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
       <Label htmlFor="email" className="rf-label">Email</Label>
       <Input id="email" type="email" className="rf-input" value={email} onChange={(e) => setEmail(e.target.value)} />
       </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
       <Label htmlFor="password" className="rf-label">Password</Label>
       <Input id="password" type="password" className="rf-input" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <Label htmlFor="passwordConfirm" className="rf-label">Confirm Password</Label>
        <Input id="passwordConfirm" type="password" className="rf-input" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} />
      </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
            <Label htmlFor="age" className="rf-label">Age (optional)</Label>
            <Input  id="age" className="rf-input" type="number" value={age} min="0" onChange={(e) => setAge(e.target.value)} />
          </div>

          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
            <Label htmlFor="country" className="rf-label">Country (optional)</Label>
            <CountryDropdown
              id="country" 
              priorityOptions={['ES', 'US', 'GB', 'DE', 'FR']}
              value={country}
              onChange={setCountry}
              className="rf-select"
              defaultOptionLabel="Select…"
            />
          </div>
        </div>

        <Button type="submit" disabled={loading} className="rf-submit">
          {loading ? 'Creating account…' : 'Register'}
        </Button>

        {responseMessage && <p className="rf-message-success">{responseMessage}</p>}
        {error && <p className="rf-message-error">{error}</p>}

        <p className="rf-login-link">
          Already have an account?{' '}
          <button type="button" onClick={() => navigate('/login')}>Log in</button>
        </p>
      </form>
    </ModelBackground>
  );
};

export default RegisterForm;