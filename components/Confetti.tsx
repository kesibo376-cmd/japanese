import React, { useMemo } from 'react';
import type { Theme } from '../types';

interface ConfettiProps {
  count: number;
  theme: Theme;
}

const THEME_CONFIG: Record<Theme, { colors: string[]; shapes: ('rect' | 'pixel')[] }> = {
  charcoal: {
    colors: ['#1DB954', '#FFFFFF', '#B3B3B3'],
    shapes: ['rect'],
  },
  paper: {
    colors: ['#D95550', '#3D405B', '#F8F5F2'],
    shapes: ['rect'],
  },
  brutalist: {
    colors: ['#0000FF', '#000000', '#F5F5DC'],
    shapes: ['rect'],
  },
  'retro-web': {
    colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#000000'],
    shapes: ['pixel'],
  },
  minimal: {
    colors: ['#007aff', '#6e6e73', '#f2f2f7'],
    shapes: ['rect'],
  },
  'hand-drawn': {
    colors: ['#0057b8', '#3a3a3a', '#707070'],
    shapes: ['rect'],
  }
};

const Confetti: React.FC<ConfettiProps> = ({ count, theme }) => {
  const pieces = useMemo(() => {
    const config = THEME_CONFIG[theme] || THEME_CONFIG.charcoal;

    return Array.from({ length: count }).map((_, index) => {
      const color = config.colors[Math.floor(Math.random() * config.colors.length)];
      const shape = config.shapes[Math.floor(Math.random() * config.shapes.length)];
      
      const style: React.CSSProperties = {
        left: `${Math.random() * 100}%`,
        backgroundColor: color,
        transform: `rotate(${Math.random() * 360}deg)`,
        animationDelay: `${Math.random() * 1.5}s`,
        animationDuration: `${3.5 + Math.random() * 1.5}s`,
      };
      
      if (shape === 'rect' && theme === 'brutalist') {
         style.transform = 'none'; // No rotation for brutalist
      }

      return { style, shape, key: index };
    });
  }, [count, theme]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" aria-hidden="true">
      {pieces.map(p => (
        <div key={p.key} className={`confetti-piece ${p.shape}`} style={p.style} />
      ))}
    </div>
  );
};

export default Confetti;