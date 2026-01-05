export enum BallColor {
  Red = 'red',
  Green = 'green',
  Blue = 'blue',
  Yellow = 'yellow',
  Purple = 'purple',
  Cyan = 'cyan',
  Orange = 'orange',
  Pink = 'pink'
}

export interface Position {
  row: number;
  col: number;
}

export interface CellState {
  color: BallColor | null;
  id: string; // Unique ID for React keys and animation tracking
  isClearing?: boolean; // For animation
  isMoving?: boolean; // For movement animation (suppresses pop-in)
}

export type GridState = CellState[][];

export interface PendingBall {
  id: string;
  color: BallColor;
  pos: Position;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  timestamp: number;
}

export interface GameState {
  grid: GridState;
  score: number;
  highScore: number;
  pendingBalls: PendingBall[];
  selectedPos: Position | null;
  gameOver: boolean;
  scorePopups: { id: number; value: number; pos: Position }[]; // For floating score text
}