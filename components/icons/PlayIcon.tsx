
import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
}

const PlayIcon: React.FC<IconProps> = ({ size = 16, color = 'currentColor' }) => (
  <svg
    height={size}
    width={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={color}
    aria-hidden="true"
  >
    <path d="M8 5v14l11-7z" />
  </svg>
);

export default PlayIcon;
