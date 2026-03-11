import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


interface LoginFormProps {
  onSwitchToRegister: () => void;
  onLoginSuccess: () => void; // Optional callback for successful login
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loginUser = async (usernameToLogin: string, passwordToLogin: string): Promise<void> => {
    try {
      // Determine API URLs based on environment
      const gatewayUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';


      const loginData = { username: usernameToLogin, password: passwordToLogin };

      const res = await fetch(`${gatewayUrl}/api/users/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loginData)
      });

      const data = await res.json();
      if (res.ok) {
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('username', usernameToLogin);

        setResponseMessage(data.message);
        setUsername('');
        setPassword('');

        // Esperamos un segundo para que el usuario vea el mensaje de éxito y luego saltamos
        setTimeout(() => {
          onLoginSuccess();
        }, 1000);
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

    if (!username.trim()) {
      setError('Please enter a username.');
      return;
    }

    if (!password.trim()) {
      setError('Please enter a password.');
      return;
    }

    setLoading(true);
    await loginUser(username, password);
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">

      <h2>Login</h2>
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      <div className="space-y-2 mt-4">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>


      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Logging in..." : "Login"}
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
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="link-button"

          >
            Register here
          </button>
        </p>
      </div>
    </form>
  );
};

export default LoginForm;