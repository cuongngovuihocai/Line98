import { GridState, Position, BallColor } from '../types';
import { GRID_SIZE, MIN_LINE_LENGTH } from '../constants';

export interface HintMove {
  from: Position;
  to: Position;
  color: BallColor;
  score: number;
  lineLength: number;
  description: string;
}

// Find all empty cells reachable from a given source cell using BFS
function getReachableEmptyCells(grid: GridState, start: Position): Position[] {
  const visited: boolean[][] = Array(GRID_SIZE).fill(false).map(() => Array(GRID_SIZE).fill(false));
  const reachable: Position[] = [];
  const queue: Position[] = [start];
  visited[start.row][start.col] = true;

  const dr = [-1, 1, 0, 0];
  const dc = [0, 0, -1, 1];

  while (queue.length > 0) {
    const current = queue.shift()!;

    for (let i = 0; i < 4; i++) {
      const nr = current.row + dr[i];
      const nc = current.col + dc[i];

      if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
        if (!visited[nr][nc]) {
          visited[nr][nc] = true;
          // Empty cell can be moved to and traversed through
          if (grid[nr][nc].color === null) {
            reachable.push({ row: nr, col: nc });
            queue.push({ row: nr, col: nc });
          }
        }
      }
    }
  }

  return reachable;
}

// Evaluate the best potential line if a ball of color C is placed at targetPos
function evaluatePlacement(grid: GridState, targetPos: Position, fromPos: Position, color: BallColor): { maxLine: number, openEnds: number } {
  const directions = [
    { dr: 0, dc: 1 },  // Horizontal
    { dr: 1, dc: 0 },  // Vertical
    { dr: 1, dc: 1 },  // Diagonal \
    { dr: 1, dc: -1 }, // Diagonal /
  ];

  let maxLine = 1;
  let totalOpenEnds = 0;

  for (const { dr, dc } of directions) {
    let count = 1;
    let openEnds = 0;

    // Check positive direction
    let step = 1;
    while (true) {
      const r = targetPos.row + dr * step;
      const c = targetPos.col + dc * step;
      if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) break;
      if (r === fromPos.row && c === fromPos.col) break; // Exclude ball being moved away

      if (grid[r][c].color === color) {
        count++;
        step++;
      } else {
        if (grid[r][c].color === null) openEnds++;
        break;
      }
    }

    // Check negative direction
    step = 1;
    while (true) {
      const r = targetPos.row - dr * step;
      const c = targetPos.col - dc * step;
      if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) break;
      if (r === fromPos.row && c === fromPos.col) break; // Exclude ball being moved away

      if (grid[r][c].color === color) {
        count++;
        step++;
      } else {
        if (grid[r][c].color === null) openEnds++;
        break;
      }
    }

    if (count > maxLine) {
      maxLine = count;
      totalOpenEnds = openEnds;
    }
  }

  return { maxLine, openEnds: totalOpenEnds };
}

/**
 * Finds the single best move on the current board.
 * Returns null if no valid moves exist.
 */
export function findBestHint(grid: GridState): HintMove | null {
  let bestMove: HintMove | null = null;
  let highestScore = -1;

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const sourceColor = grid[r][c].color;
      if (sourceColor === null) continue;

      const fromPos: Position = { row: r, col: c };
      const reachableCells = getReachableEmptyCells(grid, fromPos);

      for (const toPos of reachableCells) {
        const { maxLine, openEnds } = evaluatePlacement(grid, toPos, fromPos, sourceColor);

        let moveScore = 0;
        let description = '';

        if (maxLine >= MIN_LINE_LENGTH) {
          // Can clear line immediately! Highest priority
          moveScore = 10000 + maxLine * 1000;
          description = `Ăn điểm ngay (${maxLine} bóng)!`;
        } else if (maxLine === 4) {
          // 4 balls ready for a 5-in-a-row
          moveScore = 3000 + openEnds * 200;
          description = 'Tạo thế 4 bóng sắp ăn điểm';
        } else if (maxLine === 3) {
          // 3 balls line
          moveScore = 1500 + openEnds * 100;
          description = 'Gom thành chuỗi 3 bóng';
        } else if (maxLine === 2) {
          // 2 balls line
          moveScore = 500 + openEnds * 50;
          description = 'Ghép đôi bóng cùng màu';
        } else {
          // Low utility move
          moveScore = 50;
          description = 'Nước đi mở đường';
        }

        if (moveScore > highestScore) {
          highestScore = moveScore;
          bestMove = {
            from: fromPos,
            to: toPos,
            color: sourceColor,
            score: moveScore,
            lineLength: maxLine,
            description
          };
        }
      }
    }
  }

  return bestMove;
}
