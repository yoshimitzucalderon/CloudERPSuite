import React from 'react';

const YCM360Logo = () => {
  return (
    <div className="flex items-center" style={{ padding: 0 }}>
      {/* Circular logo part */}
      <span className="flex items-center" style={{ marginRight: '6px', position: 'relative', top: '3px' }}>
        <svg width="22" height="22" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="#38b2ac"
            strokeWidth="5.28"
            strokeDasharray="224.48, 11.52"
            strokeDashoffset="5.76"
            transform="rotate(45 40 40)"
          />
          <circle
            cx="56"
            cy="40"
            r="6"
            fill="#38b2ac"
          />
        </svg>
      </span>
      {/* Text part */}
      <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#38b2ac', letterSpacing: '0.01em', fontFamily: 'Inter, sans-serif', lineHeight: 1 }}>
        YCM360
      </span>
    </div>
  );
};

export default YCM360Logo; 