import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

const FireIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 22c-2.5-1-4-4.5-4-8.5 0-4.5 4-8.5 4-8.5s4 4 4 8.5c0 4-1.5 7.5-4 8.5z" />
    <path d="M10.5 6s-1.5 2-1.5 3.5c0 1.5 1.5 3 1.5 3" />
    <path d="M14 12c.5-1 .5-2 0-3" />
  </svg>
);

export default FireIcon;
