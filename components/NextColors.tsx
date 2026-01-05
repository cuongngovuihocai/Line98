import React from 'react';
import { BallColor } from '../types';
import Ball from './Ball';

interface NextColorsProps {
  colors: BallColor[];
}

const NextColors: React.FC<NextColorsProps> = ({ colors }) => {
  return (
    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-2">Tiếp theo</span>
      <div className="flex gap-2">
        {colors.map((color, idx) => (
          <Ball key={idx} color={color} small />
        ))}
      </div>
    </div>
  );
};

export default NextColors;
