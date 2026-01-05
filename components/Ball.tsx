import React from 'react';
import { BallColor } from '../types';
import { BALL_COLOR_MAP } from '../constants';

interface BallProps {
  color: BallColor;
  small?: boolean;
  className?: string;
}

const Ball: React.FC<BallProps> = ({ color, small = false, className = '' }) => {
  const baseClasses = "rounded-full bg-gradient-to-br shadow-md relative";
  const sizeClasses = small ? "w-4 h-4" : "w-8 h-8 md:w-10 md:h-10 ball-enter";
  const colorClasses = BALL_COLOR_MAP[color];

  return (
    <div className={`${baseClasses} ${sizeClasses} ${colorClasses} ${className}`}>
        {/* Shine effect */}
        <div className="absolute top-1 left-1 w-[40%] h-[40%] bg-white rounded-full opacity-30"></div>
    </div>
  );
};

export default Ball;
