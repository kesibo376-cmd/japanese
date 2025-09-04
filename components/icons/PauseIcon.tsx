
import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
}

const PauseIcon: React.FC<IconProps> = ({ size = 16, color = 'currentColor' }) => (
  <svg
    height={size}
    width={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={color}
    aria-hidden="true"
  >
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

export default PauseIcon;
