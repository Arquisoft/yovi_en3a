import React from 'react';
import { useNavigate } from 'react-router-dom';
import ModelBackground from './ModelBackground';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <ModelBackground>
      <div>
        <div style={{
          fontSize: '0.7rem', letterSpacing: '0.4em',
          color: '#6366f1', textTransform: 'uppercase',
          marginBottom: '0.75rem',
        }}>
          ◆ Welcome ◆
        </div>
        <h1 style={{
          fontSize: 'clamp(3rem, 5vw, 4.5rem)',
          fontWeight: 900,
          color: '#fff',
          margin: 0,
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}>
          Game<br />
          <span style={{ color: '#6366f1' }}>Y</span>
        </h1>
        <p style={{
          color: 'rgba(255,255,255,0.4)',
          fontSize: '0.95rem',
          marginTop: '1rem',
          lineHeight: 1.6,
        }}>
          Challenge bots, compete with friends,<br />master the hex board.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <button
          onClick={() => navigate('/login')}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = '#4f46e5';
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = '#6366f1';
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
          }}
          style={{
            height: '3.25rem', width: '100%',
            background: '#6366f1', color: '#fff',
            border: 'none', borderRadius: '8px',
            fontSize: '0.95rem', fontWeight: 700,
            letterSpacing: '0.05em', cursor: 'pointer',
            transition: 'all 0.15s ease',
            fontFamily: 'inherit',
          }}
        >
          Log In
        </button>

        <button
          onClick={() => navigate('/register')}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.12)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#6366f1';
            (e.currentTarget as HTMLButtonElement).style.color = '#fff';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.15)';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.6)';
          }}
          style={{
            height: '3.25rem', width: '100%',
            background: 'transparent',
            color: 'rgba(255,255,255,0.6)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '8px',
            fontSize: '0.95rem', fontWeight: 600,
            letterSpacing: '0.05em', cursor: 'pointer',
            transition: 'all 0.15s ease',
            fontFamily: 'inherit',
          }}
        >
          Sign Up
        </button>
      </div>
    </ModelBackground>
  );
};

export default Landing;