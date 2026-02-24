import React from 'react';

interface AuthLandingProps {
  onSelectLogin: () => void;
  onSelectRegister: () => void;
}

const Landing: React.FC<AuthLandingProps> = ({ onSelectLogin, onSelectRegister }) => {
  return (
    <div className="auth-landing">
      <h2>Welcome to Yovi</h2>
      <p>Choose what you'd like to do:</p>
      
      <div className="auth-buttons">
        <button className="auth-button login-button" onClick={onSelectLogin}>
          Login
        </button>
        <button className="auth-button register-button" onClick={onSelectRegister}>
          Sign Up
        </button>
      </div>
    </div>
  );
};

export default Landing;
