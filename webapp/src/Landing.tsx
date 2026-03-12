import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';



const Landing: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animated hex grid on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let t = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const drawHex = (cx: number, cy: number, r: number, alpha: number) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 0.008;

      const hexR = 36;
      const hexW = hexR * Math.sqrt(3);
      const hexH = hexR * 2;
      const cols = Math.ceil(canvas.width / hexW) + 2;
      const rows = Math.ceil(canvas.height / (hexH * 0.75)) + 2;

      for (let row = -1; row < rows; row++) {
        for (let col = -1; col < cols; col++) {
          const cx = col * hexW + (row % 2) * (hexW / 2);
          const cy = row * hexH * 0.75;
          const dist = Math.sqrt(
            Math.pow((cx - canvas.width * 0.5) / canvas.width, 2) +
            Math.pow((cy - canvas.height * 0.5) / canvas.height, 2)
          );
          const pulse = Math.sin(t - dist * 6) * 0.5 + 0.5;
          const alpha = pulse * 0.12 + 0.03;
          drawHex(cx, cy, hexR * 0.88, alpha);
        }
      }

      animFrame = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080b14',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Georgia', serif",
    }}>
      {/* Animated hex background */}
      <canvas ref={canvasRef} style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
      }} />

      {/* Radial glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(30,20,80,0.6) 0%, transparent 70%)',
      }} />

      {/* Main layout */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 1px 380px',
        gap: '4rem',
        alignItems: 'center',
        maxWidth: '1000px',
        width: '100%',
        padding: '2rem',
      }}>

        {/* Left — hex board illustration */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <HexBoard />
          <p style={{
            color: 'rgba(255,255,255,0.25)',
            fontSize: '0.7rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            textAlign: 'center',
          }}>
            A game of connection and strategy
          </p>
        </div>

        {/* Divider */}
        <div style={{ background: 'rgba(255,255,255,0.07)', height: '300px', alignSelf: 'center' }} />

        {/* Right — title + buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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
        </div>
      </div>
    </div>
  );
};

// SVG hex board illustration
const HexBoard: React.FC = () => {
  const size = 5;
  const r = 22;
  const hexW = r * Math.sqrt(3);
  const hexH = r * 2;

  const cells: { cx: number; cy: number; row: number; col: number }[] = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col <= row; col++) {
      const cx = (col - row / 2) * hexW + (size * hexW) / 2;
      const cy = row * hexH * 0.75 + r;
      cells.push({ cx, cy, row, col });
    }
  }

  const svgW = size * hexW;
  const svgH = (size - 1) * hexH * 0.75 + hexH;

  const hexPath = (cx: number, cy: number) => {
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      return `${cx + r * 0.88 * Math.cos(a)},${cy + r * 0.88 * Math.sin(a)}`;
    });
    return `M${pts.join('L')}Z`;
  };

  const colors = ['#1d4ed8', '#991b1b', null, '#1d4ed8', null, null, null, '#991b1b', null, null, null, null, null, null, null];

  return (
    <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
      {cells.map(({ cx, cy, row, col }, i) => {
        const fill = colors[i];
        return (
          <g key={i}>
            <path
              d={hexPath(cx, cy)}
              fill={fill ?? 'rgba(255,255,255,0.04)'}
              stroke={fill ? 'rgba(255,255,255,0.2)' : 'rgba(99,102,241,0.25)'}
              strokeWidth="1"
            />
          </g>
        );
      })}
    </svg>
  );
};

export default Landing;