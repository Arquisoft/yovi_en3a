import React, { useState } from 'react';

interface LoginFormProps {
  onBack: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onBack }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setResponseMessage(null);
    setError(null);

    if (!username.trim()) {
      setError('Please enter a username.');
      return;
    }

    if (!password.trim()) {
      setError('Please enter a password.');
      return;
    }

    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (res.ok) {
        setResponseMessage(data.message);
        setUsername('');
        setPassword('');
      } else {
        setError(data.error || 'Server error');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <h2>Login</h2>
      <div className="form-group">
        <label htmlFor="username">Username:</label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="form-input"
        />
      </div>
      <div className="form-group">
        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="form-input"
        />
      </div>
      <button type="submit" className="submit-button" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>

      {responseMessage && (
        <div className="success-message" style={{ marginTop: 12, color: 'green' }}>
          {responseMessage}
        </div>
      )}

      {error && (
        <div className="error-message" style={{ marginTop: 12, color: 'red' }}>
          {error}
        </div>
      )}

      <button type="button" className="back-button" onClick={onBack} style={{ marginTop: 12 }}>
        Back
      </button>
    </form>
  );
};

export default LoginForm;
