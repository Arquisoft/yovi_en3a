import React, { useState } from 'react';

interface RegisterFormProps {
  onBack: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onBack }) => {
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
      const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          username: usernameToRegister,
          email: emailToRegister,
          password: passwordToRegister,
          age: ageToRegister ? parseInt(ageToRegister) : undefined,
          country: countryToRegister
        })
      });

      const data = await res.json();
      if (res.ok) {
        setResponseMessage(data.message);
        setUsername('');
        setEmail('');
        setPassword('');
        setPasswordConfirm('');
        setAge('');
        setCountry('');
      } 
      else if (res.status >= 400 && res.status < 500) {
        setError(data.error || 'Invalid input. Please check your data and try again.');
      }
      else {
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

    if (!username.trim()) {
      setError('Please enter a username.');
      return;
    }

    if (!email.trim()) {
      setError('Please enter an email.');
      return;
    }

    if (!password.trim()) {
      setError('Please enter a password.');
      return;
    }

    if (password !== passwordConfirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    await registerUser(username, email, password, age, country);
  };

  return (
    <form onSubmit={handleSubmit} className="register-form">
      <h2>Register</h2>
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
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
      <div className="form-group">
        <label htmlFor="passwordConfirm">Confirm Password:</label>
        <input
          type="password"
          id="passwordConfirm"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          className="form-input"
        />
      </div>
      <div className="form-group">
        <label htmlFor="age">Age (optional):</label>
        <input
          type="number"
          id="age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className="form-input"
          min="0"
        />
      </div>
      <div className="form-group">
        <label htmlFor="country">Country (optional):</label>
        <input
          type="text"
          id="country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="form-input"
        />
      </div>
      <button type="submit" className="submit-button" disabled={loading}>
        {loading ? 'Creating account...' : 'Register'}
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

export default RegisterForm;
