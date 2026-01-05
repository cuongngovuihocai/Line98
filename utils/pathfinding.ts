import { GRID_SIZE } from '../constants';
import { GridState, Position } from '../types';

// Breadth-First Search to find path
export const findPath = (grid: GridState, start: Position, end: Position): Position[] | null => {
  if (grid[end.row][end.col].color !== null) return null; // Destination blocked

  const queue: Position[] = [start];
  const cameFrom = new Map<string, Position | null>();
  const visited = new Set<string>();

  const startKey = `${start.row},${start.col}`;
  visited.add(startKey);
  cameFrom.set(startKey, null);

  const directions = [
    { r: -1, c: 0 }, // Up
    { r: 1, c: 0 },  // Down
    { r: 0, c: -1 }, // Left
    { r: 0, c: 1 },  // Right
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    
    if (current.row === end.row && current.col === end.col) {
      // Path found, reconstruct it
      const path: Position[] = [];
      let curr: Position | null = current;
      while (curr) {
        path.push(curr);
        const key = `${curr.row},${curr.col}`;
        curr = cameFrom.get(key) || null;
      }
      return path.reverse();
    }

    for (const dir of directions) {
      const nextR = current.row + dir.r;
      const nextC = current.col + dir.c;

      if (nextR >= 0 && nextR < GRID_SIZE && nextC >= 0 && nextC < GRID_SIZE) {
        const nextKey = `${nextR},${nextC}`;
        if (!visited.has(nextKey) && grid[nextR][nextC].color === null) {
          visited.add(nextKey);
          queue.push({ row: nextR, col: nextC });
          cameFrom.set(nextKey, current);
        }
      }
    }
  }

  return null; // No path
};
