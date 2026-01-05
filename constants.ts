import { BallColor } from './types';

export const GRID_SIZE = 9;
export const NEW_BALLS_PER_TURN = 3;
export const MIN_LINE_LENGTH = 5;

export const INITIAL_SWAPS = 10;
export const INITIAL_HAMMERS = 10;

export const COLORS = [
  BallColor.Red,
  BallColor.Green,
  BallColor.Blue,
  BallColor.Yellow,
  BallColor.Purple,
  BallColor.Cyan,
  BallColor.Orange,
  BallColor.Pink
];

// Tailwind color maps - Adjusted for Dark Cell Background
export const BALL_COLOR_MAP: Record<BallColor, string> = {
  // Red: Bright Red
  [BallColor.Red]: 'bg-red-500 shadow-red-500/60 from-red-400 to-red-600 ring-1 ring-red-400/30',
  
  // Green: Emerald (Bright)
  [BallColor.Green]: 'bg-emerald-500 shadow-emerald-500/60 from-emerald-400 to-emerald-600 ring-1 ring-emerald-400/30',
  
  // Blue: Blue (Brightened for dark bg)
  [BallColor.Blue]: 'bg-blue-500 shadow-blue-500/60 from-blue-400 to-blue-600 ring-1 ring-blue-400/30',
  
  // Yellow: Yellow (Bright)
  [BallColor.Yellow]: 'bg-yellow-400 shadow-yellow-400/60 from-yellow-300 to-yellow-500 ring-1 ring-yellow-300/30',
  
  // Purple: Violet (Brightened)
  [BallColor.Purple]: 'bg-violet-500 shadow-violet-500/60 from-violet-400 to-violet-600 ring-1 ring-violet-400/30',
  
  // Cyan: Cyan (Bright)
  [BallColor.Cyan]: 'bg-cyan-400 shadow-cyan-400/60 from-cyan-300 to-cyan-500 ring-1 ring-cyan-300/30',
  
  // Orange: Orange (Bright)
  [BallColor.Orange]: 'bg-orange-500 shadow-orange-500/60 from-orange-400 to-orange-600 ring-1 ring-orange-400/30',
  
  // Pink: Fuchsia (Bright)
  [BallColor.Pink]: 'bg-fuchsia-500 shadow-fuchsia-500/60 from-fuchsia-400 to-fuchsia-600 ring-1 ring-fuchsia-400/30',
};
