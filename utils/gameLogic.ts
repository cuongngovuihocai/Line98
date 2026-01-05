import { GridState, Position, BallColor, CellState } from '../types';
import { GRID_SIZE, MIN_LINE_LENGTH, COLORS, NEW_BALLS_PER_TURN } from '../constants';

export const generateEmptyGrid = (): GridState => {
  return Array(GRID_SIZE).fill(null).map((_, r) => 
    Array(GRID_SIZE).fill(null).map((_, c) => ({
      color: null,
      id: `cell-${r}-${c}-${Math.random()}`
    }))
  );
};

export const getRandomColor = (): BallColor => {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
};

export const getEmptyCells = (grid: GridState): Position[] => {
  const emptyCells: Position[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c].color === null) {
        emptyCells.push({ row: r, col: c });
      }
    }
  }
  return emptyCells;
};

// Check for lines and return positions to clear and points
export const checkLines = (grid: GridState, movedBallPos?: Position): { cellsToRemove: Position[], points: number } => {
  const cellsToRemove = new Set<string>();
  let totalPoints = 0;

  // Directions to check: Horizontal, Vertical, Diagonal 1 (\), Diagonal 2 (/)
  const directions = [
    { dr: 0, dc: 1 },
    { dr: 1, dc: 0 },
    { dr: 1, dc: 1 },
    { dr: 1, dc: -1 }
  ];
  
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const color = grid[r][c].color;
      if (!color) continue;

      for (const { dr, dc } of directions) {
        let line: Position[] = [{ row: r, col: c }];
        
        // Trace forward
        let k = 1;
        while (true) {
          const nr = r + dr * k;
          const nc = c + dc * k;
          if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && grid[nr][nc].color === color) {
            line.push({ row: nr, col: nc });
            k++;
          } else {
            break;
          }
        }

        // If line is long enough
        if (line.length >= MIN_LINE_LENGTH) {
            line.forEach(pos => cellsToRemove.add(`${pos.row},${pos.col}`));
            const extra = line.length - MIN_LINE_LENGTH;
            totalPoints += 10 + (extra * 5);
        }
      }
    }
  }

  return {
    cellsToRemove: Array.from(cellsToRemove).map(str => {
      const [r, c] = str.split(',').map(Number);
      return { row: r, col: c };
    }),
    points: totalPoints
  };
};

export const checkLinesAndScore = (grid: GridState): { cellsToRemove: Position[], points: number } => {
    const matched = new Set<string>();
    let baseScore = 0;
    let numberOfLines = 0;

    // Horizontal
    for(let r=0; r<GRID_SIZE; r++) {
        let count = 0;
        let color: BallColor | null = null;
        for(let c=0; c<GRID_SIZE; c++) {
            if(grid[r][c].color === color && color !== null) {
                count++;
            } else {
                if(count >= 5) {
                    numberOfLines++;
                    baseScore += 10 + (count - 5) * 5;
                    for(let k=1; k<=count; k++) matched.add(`${r},${c-k}`);
                }
                count = 1;
                color = grid[r][c].color;
            }
        }
        if(count >= 5 && color !== null) {
            numberOfLines++;
            baseScore += 10 + (count - 5) * 5;
            for(let k=0; k<count; k++) matched.add(`${r},${GRID_SIZE-1-k}`);
        }
    }

    // Vertical
    for(let c=0; c<GRID_SIZE; c++) {
        let count = 0;
        let color: BallColor | null = null;
        for(let r=0; r<GRID_SIZE; r++) {
            if(grid[r][c].color === color && color !== null) {
                count++;
            } else {
                if(count >= 5) {
                    numberOfLines++;
                    baseScore += 10 + (count - 5) * 5;
                    for(let k=1; k<=count; k++) matched.add(`${r-k},${c}`);
                }
                count = 1;
                color = grid[r][c].color;
            }
        }
        if(count >= 5 && color !== null) {
            numberOfLines++;
            baseScore += 10 + (count - 5) * 5;
            for(let k=0; k<count; k++) matched.add(`${GRID_SIZE-1-k},${c}`);
        }
    }

    // Diagonals
    for(let r=0; r<GRID_SIZE; r++) {
        for(let c=0; c<GRID_SIZE; c++) {
            const color = grid[r][c].color;
            if(!color) continue;

            // Check Down-Right
            if (r === 0 || c === 0 || grid[r-1][c-1].color !== color) {
                let count = 0;
                let k = 0;
                while(r+k < GRID_SIZE && c+k < GRID_SIZE && grid[r+k][c+k].color === color) {
                    count++;
                    k++;
                }
                if(count >= 5) {
                    numberOfLines++;
                    baseScore += 10 + (count - 5) * 5;
                    for(let i=0; i<count; i++) matched.add(`${r+i},${c+i}`);
                }
            }

            // Check Down-Left
            if (r === 0 || c === GRID_SIZE - 1 || grid[r-1][c+1].color !== color) {
                let count = 0;
                let k = 0;
                while(r+k < GRID_SIZE && c-k >= 0 && grid[r+k][c-k].color === color) {
                    count++;
                    k++;
                }
                if(count >= 5) {
                    numberOfLines++;
                    baseScore += 10 + (count - 5) * 5;
                    for(let i=0; i<count; i++) matched.add(`${r+i},${c-i}`);
                }
            }
        }
    }

    // Bonus Calculation: 5x points if 2 or more lines are cleared at once
    let finalPoints = baseScore;
    if (numberOfLines >= 2) {
        finalPoints = baseScore * 5;
    }

    return {
        cellsToRemove: Array.from(matched).map(str => {
            const [r, c] = str.split(',').map(Number);
            return { row: r, col: c };
        }),
        points: finalPoints
    };
}

