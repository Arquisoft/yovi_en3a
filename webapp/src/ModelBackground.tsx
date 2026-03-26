import React from 'react';
import HexBackground from './HexBackGround';
import GameSVG from './GameSVG';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface ModelBackgroundProps {
  children: React.ReactNode;
}

const ModelBackground: React.FC<ModelBackgroundProps> = ({ children }) => {
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
      <HexBackground />

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
          <GameSVG />
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

        {/* Right — dynamic content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={useLocation().pathname}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ModelBackground;