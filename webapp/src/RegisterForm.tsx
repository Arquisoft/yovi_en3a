import React, { useState } from 'react';
import { Button } from './components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from 'react-router-dom';



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
      // Determine API URLs based on environment
      const gatewayUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';


      const registerData = {
        username: usernameToRegister,
        email: emailToRegister,
        password: passwordToRegister,
        age: ageToRegister ? parseInt(ageToRegister) : undefined,
        country: countryToRegister
      };

      const res = await fetch(`${gatewayUrl}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData)
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
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="passwordConfirm">Confirm Password</Label>
        <Input
          id="passwordConfirm"
          type="password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
        />
      </div>


      <div className="space-y-2">
        <Label htmlFor="age">Age (optional)</Label>
        <Input
          id="age"
          type="number"
          value={age}
          min="0"
          onChange={(e) => setAge(e.target.value)}
        />
      </div>


      <div className="space-y-2">
        <Label htmlFor="country">Country (optional)</Label>
        <Input
          id="country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating account..." : "Register"}
      </Button>

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

      <div className="auth-switch" style={{ marginTop: 20, textAlign: 'center' }}>
        <p>
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="link-button"
          >
            Login here
          </button>
        </p>
      </div>
    </form>
  );
};

export default RegisterForm;