import React from 'react';

export default function AlphaLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 100 100" 
      className={className}
      fill="none"
    >
      <g filter="url(#glow)">
        {/* Outer targeting ring */}
        <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" strokeDasharray="4 8" />
        <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" strokeDasharray="40 120" />
        
        {/* Sharp geometric A / Claw shape */}
        <path 
          d="M 50 15 L 85 80 L 70 80 L 50 45 L 30 80 L 15 80 Z" 
          fill="currentColor" 
          fillOpacity="0.1"
          stroke="currentColor" 
          strokeWidth="3" 
          strokeLinejoin="miter"
        />
        
        {/* Inner crosshair accent */}
        <path 
          d="M 50 25 L 50 35 M 40 55 L 60 55 M 50 65 L 50 85" 
          stroke="currentColor" 
          strokeWidth="3" 
          strokeLinecap="square"
        />
        
        {/* Center scope dot */}
        <circle cx="50" cy="55" r="3" fill="currentColor" />
      </g>
      
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}
