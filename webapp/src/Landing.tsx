import React from 'react';
import { useNavigate } from 'react-router-dom';
import ModelBackground from './BackgroundComponents/ModelBackground';
import './Landing.css';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  
  // Responsive helper for button events
  const handleButtonHover = (e: React.MouseEvent<HTMLButtonElement>, isEnter: boolean, isSecondary: boolean) => {
    const button = e.currentTarget;
    if (isEnter) {
      if (isSecondary) {
        button.style.background = 'rgba(99,102,241,0.12)';
        button.style.borderColor = '#6366f1';
        button.style.color = '#fff';
      } else {
        button.style.background = '#4f46e5';
        button.style.transform = 'translateY(-1px)';
      }
    } else {
      if (isSecondary) {
        button.style.background = 'transparent';
        button.style.borderColor = 'rgba(255,255,255,0.15)';
        button.style.color = 'rgba(255,255,255,0.6)';
      } else {
        button.style.background = '#6366f1';
        button.style.transform = 'translateY(0)';
      }
    }
  };

  return (
    <ModelBackground>
      <div className="landing-container">
        <div className="landing-hero">
          <div style={{
            fontSize: '0.7rem', letterSpacing: '0.4em',
            color: '#6366f1', textTransform: 'uppercase',
            marginBottom: '0.75rem',
          }}>
            ◆ Welcome ◆
          </div>
          <h1>
            Game<br />
            <span style={{ color: '#6366f1' }}>Y</span>
          </h1>
          <p>
            Challenge bots, compete with friends,<br />master the hex board.
          </p>
        </div>

        <div className="landing-buttons">
        <button
          onClick={() => navigate('/login')}
          onMouseEnter={(e) => handleButtonHover(e, true, false)}
          onMouseLeave={(e) => handleButtonHover(e, false, false)}
          className="landing-button landing-button-primary"
        >
          Log In
        </button>

        <button
          onClick={() => navigate('/register')}
          onMouseEnter={(e) => handleButtonHover(e, true, true)}
          onMouseLeave={(e) => handleButtonHover(e, false, true)}
          className="landing-button landing-button-secondary"
        >
          Sign Up
        </button>
        </div>
      </div>
    </ModelBackground>
  );
};

export default Landing;