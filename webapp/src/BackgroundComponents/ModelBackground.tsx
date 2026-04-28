import React from 'react';
import HexBackground from './HexBackGround';
import GameSVG from './GameSVG';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import './ModelBackground.css';

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
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div className="model-background-container" style={{
          position: 'relative', zIndex: 1,
        }}>
        {/* Left — hex board illustration */}
        <div className="model-background-left">
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
        <div className="model-background-divider" />

        {/* Right — dynamic content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={useLocation().pathname}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="model-background-right"
          >
            {children}
          </motion.div>
        </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ModelBackground;