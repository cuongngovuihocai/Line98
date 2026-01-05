import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, RotateCcw, ArrowRightLeft, Hammer, Moon, Sun, Save, Medal, Loader2 } from 'lucide-react';
import { GridState, Position, PendingBall, LeaderboardEntry, BallColor } from './types';
import { GRID_SIZE, INITIAL_SWAPS, INITIAL_HAMMERS } from './constants';
import { generateEmptyGrid, getRandomColor, getEmptyCells, checkLinesAndScore } from './utils/gameLogic';
import { findPath } from './utils/pathfinding';
import { getLeaderboardData, saveLeaderboardData } from './services/leaderboardService';
import Ball from './components/Ball';
import NextColors from './components/NextColors';

const App: React.FC = () => {
  // --- State ---
  const [grid, setGrid] = useState<GridState>(generateEmptyGrid());
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  
  const [pendingBalls, setPendingBalls] = useState<PendingBall[]>([]);
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false); // Block interactions during movement
  
  // Power-ups State
  const [swapsLeft, setSwapsLeft] = useState(INITIAL_SWAPS);
  const [hammersLeft, setHammersLeft] = useState(INITIAL_HAMMERS);
  const [activeTool, setActiveTool] = useState<'none' | 'hammer' | 'swap'>('none');
  const [swapSource, setSwapSource] = useState<Position | null>(null);

  // Theme State
  const [darkMode, setDarkMode] = useState(false);

  // Leaderboard State
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false); // New loading state
  const [isSavingScore, setIsSavingScore] = useState(false); // New saving state
  const [showNameInput, setShowNameInput] = useState(false);
  const [playerName, setPlayerName] = useState('');

  // Init Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('line98-theme');
    if (savedTheme === 'dark') {
        setDarkMode(true);
    } else if (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setDarkMode(true);
    }
  }, []);

  // Update Body BG for overscroll areas
  useEffect(() => {
    localStorage.setItem('line98-theme', darkMode ? 'dark' : 'light');
    document.body.style.backgroundColor = darkMode ? '#020617' : '#eef2f6';
  }, [darkMode]);

  // Load High Score (Local) & Leaderboard (Async Service)
  useEffect(() => {
    // Highscore vẫn giữ ở local để hiển thị nhanh
    const savedScore = localStorage.getItem('line98-highscore');
    if (savedScore) setHighScore(parseInt(savedScore));

    // Load Leaderboard from Service (Simulation or Real Backend)
    const fetchLeaderboard = async () => {
        setIsLoadingLeaderboard(true);
        try {
            const data = await getLeaderboardData();
            setLeaderboard(data);
        } catch (error) {
            console.error("Error loading leaderboard", error);
        } finally {
            setIsLoadingLeaderboard(false);
        }
    };
    
    fetchLeaderboard();
  }, []);

  // Save High Score (Local instant update)
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('line98-highscore', score.toString());
    }
  }, [score, highScore]);

  // Check Game Over qualification for Leaderboard
  useEffect(() => {
    if (gameOver && score > 0) {
      // Check if score qualifies for top 5 based on current loaded leaderboard
      const minScore = leaderboard.length < 5 ? 0 : leaderboard[leaderboard.length - 1].score;
      if (score > minScore) {
        setShowNameInput(true);
      } else {
        setShowNameInput(false);
      }
    }
  }, [gameOver, score, leaderboard]); 

  const handleSaveLeaderboard = async () => {
    if (!playerName.trim()) return;
    
    setIsSavingScore(true);

    const newEntry: LeaderboardEntry = {
        name: playerName.trim().substring(0, 15),
        score: score,
        timestamp: Date.now()
    };

    try {
        const updatedBoard = await saveLeaderboardData(newEntry);
        setLeaderboard(updatedBoard);
        setShowNameInput(false);
    } catch (error) {
        alert("Có lỗi khi lưu điểm, vui lòng thử lại!");
    } finally {
        setIsSavingScore(false);
    }
  };

  // --- Sound Effect ---
  const playScoreSound = useCallback(() => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        // Create a pleasant "ding" sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.1);
        
        // Fade out
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
        // Ignore audio errors
    }
  }, []);

  // Helper to generate N pending balls
  const generatePendingBalls = (currentGrid: GridState, count: number = 3): PendingBall[] => {
    const emptyCells = getEmptyCells(currentGrid);
    const newPending: PendingBall[] = [];
    
    for (let i = 0; i < count; i++) {
      if (emptyCells.length === 0) break;
      const randIdx = Math.floor(Math.random() * emptyCells.length);
      const pos = emptyCells[randIdx];
      
      newPending.push({
        id: `pending-${Date.now()}-${i}`,
        color: getRandomColor(),
        pos: pos
      });
      
      emptyCells.splice(randIdx, 1);
    }
    return newPending;
  };

  // --- Game Mechanics ---

  const initGame = useCallback(() => {
    const newGrid = generateEmptyGrid();
    const emptyCells = getEmptyCells(newGrid);
    
    // Initial 5 balls
    for (let i = 0; i < 5; i++) {
      if (emptyCells.length > 0) {
        const randIdx = Math.floor(Math.random() * emptyCells.length);
        const { row, col } = emptyCells[randIdx];
        newGrid[row][col].color = getRandomColor();
        emptyCells.splice(randIdx, 1);
      }
    }

    setGrid(newGrid);
    setScore(0);
    setPendingBalls(generatePendingBalls(newGrid)); 
    setSelectedPos(null);
    setGameOver(false);
    setIsAnimating(false);
    
    // Reset Power-ups
    setSwapsLeft(INITIAL_SWAPS);
    setHammersLeft(INITIAL_HAMMERS);
    setActiveTool('none');
    setSwapSource(null);

    // Reset Leaderboard Input
    setShowNameInput(false);
    setPlayerName('');
  }, []);

  // Start game on mount
  useEffect(() => {
    initGame();
  }, [initGame]);

  const toggleTheme = () => setDarkMode(!darkMode);

  const handleSwapClick = () => {
    if (swapsLeft <= 0 || gameOver || isAnimating) return;
    if (activeTool === 'swap') {
        setActiveTool('none');
        setSwapSource(null);
    } else {
        setActiveTool('swap');
        setSwapSource(null);
        setSelectedPos(null); // Clear normal selection
    }
  };

  const handleHammerClick = () => {
    if (hammersLeft <= 0 || gameOver || isAnimating) return;
    if (activeTool === 'hammer') {
        setActiveTool('none');
    } else {
        setActiveTool('hammer');
        setSelectedPos(null); // Clear normal selection
        setSwapSource(null);
    }
  };

  // Convert Pending Balls to Real Balls
  // NOTE: Accepts an optional grid to ensure we use the latest state during async flows
  const spawnPendingBalls = (currentGrid: GridState) => {
    const newGrid = [...currentGrid.map(row => [...row.map(c => ({...c}))])];
    
    let emptyCells = getEmptyCells(newGrid);
    
    for (const pBall of pendingBalls) {
      if (emptyCells.length === 0) break;

      let targetPos = pBall.pos;

      if (newGrid[targetPos.row][targetPos.col].color !== null) {
        const randIdx = Math.floor(Math.random() * emptyCells.length);
        targetPos = emptyCells[randIdx];
      }

      newGrid[targetPos.row][targetPos.col] = {
        ...newGrid[targetPos.row][targetPos.col],
        color: pBall.color,
        id: `ball-${Date.now()}-${Math.random()}`,
        isMoving: false
      };

      emptyCells = emptyCells.filter(p => !(p.row === targetPos.row && p.col === targetPos.col));
    }

    const { cellsToRemove, points } = checkLinesAndScore(newGrid);

    if (cellsToRemove.length > 0) {
      playScoreSound(); 
      setScore(prev => prev + points);
      
      const clearingGrid = [...newGrid.map(r => [...r.map(c => ({...c}))])];
      cellsToRemove.forEach(p => { clearingGrid[p.row][p.col].isClearing = true; });
      setGrid(clearingGrid);

      setTimeout(() => {
        const finalGrid = [...newGrid.map(r => [...r.map(c => ({...c}))])];
        cellsToRemove.forEach(p => {
          finalGrid[p.row][p.col].color = null;
          finalGrid[p.row][p.col].isClearing = false;
        });
        setGrid(finalGrid);
        
        if (getEmptyCells(finalGrid).length === 0) setGameOver(true);
        setPendingBalls(generatePendingBalls(finalGrid));

      }, 300);

    } else {
      setGrid(newGrid);
      
      if (emptyCells.length === 0) {
        setGameOver(true);
      } else {
        setPendingBalls(generatePendingBalls(newGrid));
      }
    }
  };

  // --- Animation Logic ---
  const moveBallAlongPath = async (path: Position[]) => {
      if (path.length < 2) return;
      setIsAnimating(true);
      setSelectedPos(null);

      const start = path[0];
      const end = path[path.length - 1];
      const ball = grid[start.row][start.col];
      const color = ball.color!;
      const ballId = ball.id;

      // Animate Movement
      // We iterate from 0 to length-1, moving the ball step by step
      for (let i = 0; i < path.length - 1; i++) {
          const current = path[i];
          const next = path[i+1];

          // 30ms per step for fluid movement
          await new Promise(r => setTimeout(r, 30));

          setGrid(prev => {
              const g = prev.map(r => [...r.map(c => ({...c}))]);
              // Clear current
              g[current.row][current.col] = { ...g[current.row][current.col], color: null };
              // Set next with isMoving flag to suppress pop-in
              g[next.row][next.col] = { color, id: ballId, isMoving: true }; 
              return g;
          });
      }

      // Movement finished. 
      // Need to calculate lines based on the final position.
      // We reconstruct the grid logically to ensure we are checking the correct state
      // (State updates inside the loop might not be fully flushed to 'grid' variable here)
      const finalGrid = grid.map(r => [...r.map(c => ({...c}))]);
      // Apply the final move manually to our local copy to be sure
      // (Clean up the path trace)
      finalGrid[start.row][start.col].color = null; 
      // Final destination ball (remove isMoving flag)
      finalGrid[end.row][end.col] = { color, id: ballId, isMoving: false };
      
      // Update UI to final static state
      setGrid(finalGrid);

      // Logic Check
      const { cellsToRemove, points } = checkLinesAndScore(finalGrid);

      if (cellsToRemove.length > 0) {
           playScoreSound();
           setScore(prev => prev + points);

           // Show clearing animation
           const clearingGrid = finalGrid.map(r => [...r.map(c => ({...c}))]);
           cellsToRemove.forEach(p => { clearingGrid[p.row][p.col].isClearing = true; });
           setGrid(clearingGrid);

           setTimeout(() => {
               const cleanedGrid = finalGrid.map(r => [...r.map(c => ({...c}))]);
               cellsToRemove.forEach(p => {
                  cleanedGrid[p.row][p.col].color = null;
                  cleanedGrid[p.row][p.col].isClearing = false;
               });
               setGrid(cleanedGrid);
               setIsAnimating(false);
           }, 300);
      } else {
           // No lines, spawn new balls
           // Small delay before spawn looks better
           setTimeout(() => {
               spawnPendingBalls(finalGrid);
               setIsAnimating(false);
           }, 50);
      }
  };


  const handleCellClick = (row: number, col: number) => {
    if (gameOver || isAnimating) return;

    const clickedCell = grid[row][col];

    // --- Hammer Tool ---
    if (activeTool === 'hammer') {
      if (clickedCell.color !== null) {
        const newGrid = [...grid.map(r => [...r])];
        newGrid[row][col] = { ...newGrid[row][col], color: null, isClearing: true };
        setGrid(newGrid);
        setHammersLeft(prev => prev - 1);
        setActiveTool('none');
        setTimeout(() => {
            const finalGrid = [...newGrid.map(r => [...r.map(c => ({...c}))])];
            finalGrid[row][col].color = null;
            finalGrid[row][col].isClearing = false;
            setGrid(finalGrid);
        }, 300);
      }
      return;
    }

    // --- Swap Tool ---
    if (activeTool === 'swap') {
        if (clickedCell.color === null) return; // Must click a ball

        if (!swapSource) {
            // Select first ball for swap
            setSwapSource({ row, col });
        } else {
            // Check if clicked same ball
            if (swapSource.row === row && swapSource.col === col) {
                setSwapSource(null);
                return;
            }

            // Perform Swap
            const newGrid = [...grid.map(r => [...r.map(c => ({...c}))])];
            const sourceCell = newGrid[swapSource.row][swapSource.col];
            const targetCell = newGrid[row][col];

            const tempColor = sourceCell.color;
            const tempId = sourceCell.id;

            newGrid[swapSource.row][swapSource.col] = { ...sourceCell, color: targetCell.color, id: targetCell.id };
            newGrid[row][col] = { ...targetCell, color: tempColor, id: tempId };

            setGrid(newGrid);
            setSwapsLeft(prev => prev - 1);
            setActiveTool('none');
            setSwapSource(null);

            // Check if swap created any lines
            const { cellsToRemove, points } = checkLinesAndScore(newGrid);
            if (cellsToRemove.length > 0) {
                 playScoreSound(); // Play sound
                 const clearingGrid = [...newGrid.map(r => [...r.map(c => ({...c}))])];
                 cellsToRemove.forEach(p => { clearingGrid[p.row][p.col].isClearing = true; });
                 setGrid(clearingGrid);
                 setScore(prev => prev + points);

                 setTimeout(() => {
                     const cleanedGrid = [...newGrid.map(r => [...r.map(c => ({...c}))])];
                     cellsToRemove.forEach(p => {
                        cleanedGrid[p.row][p.col].color = null;
                        cleanedGrid[p.row][p.col].isClearing = false;
                     });
                     setGrid(cleanedGrid);
                 }, 300);
            }
        }
        return;
    }

    // --- Normal Gameplay ---

    // Case 1: Select Ball
    if (clickedCell.color !== null) {
      if (selectedPos?.row === row && selectedPos?.col === col) {
        setSelectedPos(null);
      } else {
        setSelectedPos({ row, col });
      }
      return;
    }

    // Case 2: Move to Empty (or Ghost) Cell
    if (selectedPos && clickedCell.color === null) {
      const path = findPath(grid, selectedPos, { row, col });
      
      if (path) {
        // Execute animated move
        moveBallAlongPath(path);
      }
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-300 ${activeTool !== 'none' ? 'cursor-crosshair' : ''} ${darkMode ? 'bg-slate-950' : 'bg-[#eef2f6]'}`}>
      
      {/* Header */}
      <div className="w-full max-w-md flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
            <h1 className={`text-3xl font-bold tracking-tight transition-colors ${darkMode ? 'text-white' : 'text-slate-800'}`}>Line 98</h1>
            <div className="flex gap-2">
                <button 
                    onClick={toggleTheme}
                    className={`p-2 rounded-full shadow-sm border transition-all active:scale-95 ${
                        darkMode 
                            ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                    title={darkMode ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
                >
                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <button 
                    onClick={initGame}
                    className={`p-2 rounded-full shadow-sm border transition-all active:scale-95 ${
                        darkMode 
                            ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                    title="Chơi lại"
                >
                    <RotateCcw size={20} />
                </button>
            </div>
        </div>

        {/* Score & Next Colors */}
        <div className={`flex items-center justify-between p-4 rounded-2xl shadow-sm border transition-colors ${
            darkMode 
                ? 'bg-slate-900 border-slate-800' 
                : 'bg-white border-slate-100'
        }`}>
            <div className="flex flex-col">
                <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Điểm</span>
                <span className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{score}</span>
            </div>
             
             <NextColors colors={pendingBalls.map(p => p.color)} />

            <div className="flex flex-col items-end">
                <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    <Trophy size={12} /> Kỷ lục
                </span>
                <span className="text-2xl font-black text-amber-500">{highScore}</span>
            </div>
        </div>

        {/* Tools */}
        <div className={`flex items-center justify-center gap-4 p-3 rounded-2xl shadow-sm border transition-colors ${
            darkMode 
                ? 'bg-slate-900 border-slate-800' 
                : 'bg-white border-slate-100'
        }`}>
            {/* Swap Button */}
            <button 
                onClick={handleSwapClick}
                disabled={swapsLeft === 0}
                className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all
                    ${activeTool === 'swap'
                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-105'
                        : swapsLeft > 0 
                            ? (darkMode ? 'bg-amber-900/30 text-amber-400 hover:bg-amber-900/50' : 'bg-amber-50 text-amber-600 hover:bg-amber-100') + ' active:scale-95' 
                            : (darkMode ? 'bg-slate-800 text-slate-600' : 'bg-slate-50 text-slate-300') + ' cursor-not-allowed'}
                `}
                title="Hoán đổi 2 bóng"
            >
                <ArrowRightLeft size={18} />
                <span>Hoán đổi ({swapsLeft})</span>
            </button>

            <div className={`w-px h-6 ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>

            {/* Hammer Button */}
            <button 
                onClick={handleHammerClick}
                disabled={hammersLeft === 0}
                className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all
                    ${activeTool === 'hammer' 
                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 scale-105' 
                        : hammersLeft > 0
                            ? (darkMode ? 'bg-rose-900/30 text-rose-400 hover:bg-rose-900/50' : 'bg-rose-50 text-rose-600 hover:bg-rose-100') + ' active:scale-95'
                            : (darkMode ? 'bg-slate-800 text-slate-600' : 'bg-slate-50 text-slate-300') + ' cursor-not-allowed'}
                `}
                title="Phá bóng"
            >
                <Hammer size={18} />
                <span>Phá bóng ({hammersLeft})</span>
            </button>
        </div>
      </div>

      {/* Game Board - Always Dark for best contrast */}
      <div className={`
          bg-[#1e293b] p-3 rounded-xl shadow-xl shadow-slate-400/20 border border-slate-700 relative 
          ${activeTool === 'hammer' ? 'ring-2 ring-rose-400 ring-offset-2 ' + (darkMode ? 'ring-offset-slate-900' : 'ring-offset-[#eef2f6]') : ''}
          ${activeTool === 'swap' ? 'ring-2 ring-amber-400 ring-offset-2 ' + (darkMode ? 'ring-offset-slate-900' : 'ring-offset-[#eef2f6]') : ''}
      `}>
        <div 
            className="grid gap-1 bg-slate-800 p-1 rounded-lg"
            style={{ 
                gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
            }}
        >
            {grid.map((row, rIdx) => (
                row.map((cell, cIdx) => {
                    const isSelected = selectedPos?.row === rIdx && selectedPos?.col === cIdx;
                    const isSwapSource = swapSource?.row === rIdx && swapSource?.col === cIdx;
                    
                    const pendingBall = pendingBalls.find(p => p.pos.row === rIdx && p.pos.col === cIdx);

                    return (
                        <div 
                            key={`${rIdx}-${cIdx}`}
                            onClick={() => handleCellClick(rIdx, cIdx)}
                            className={`
                                w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 
                                rounded-lg flex items-center justify-center 
                                cursor-pointer transition-colors duration-200
                                relative
                                ${isSelected ? 'bg-slate-600 ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-800 z-10' : 'bg-slate-700 hover:bg-slate-600'}
                                ${isSwapSource ? 'bg-amber-900/50 ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-800 z-10 animate-pulse' : ''}
                                ${activeTool === 'hammer' && cell.color ? 'hover:bg-rose-900 hover:ring-2 hover:ring-rose-400 hover:z-10' : ''}
                                ${activeTool === 'swap' && cell.color && !isSwapSource ? 'hover:bg-amber-900 hover:ring-2 hover:ring-amber-400 hover:z-10' : ''}
                            `}
                        >
                            {/* Pending Ball */}
                            {!cell.color && pendingBall && (
                                <Ball 
                                    color={pendingBall.color} 
                                    small
                                    className="opacity-60 scale-75 transform contrast-125" 
                                />
                            )}

                            {/* Real Ball */}
                            {cell.color && (
                                <Ball 
                                    color={cell.color} 
                                    isMoving={cell.isMoving}
                                    className={`
                                        ${cell.isClearing ? 'ball-clear' : ''}
                                        ${isSelected ? 'animate-bounce' : ''}
                                        ${activeTool === 'hammer' ? 'animate-pulse' : ''}
                                        ${isSwapSource ? 'scale-110' : ''}
                                    `}
                                />
                            )}
                        </div>
                    );
                })
            ))}
        </div>

        {gameOver && (
            <div className="absolute inset-0 z-20 bg-slate-900/95 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center text-white animate-in fade-in duration-300 p-4">
                <h2 className="text-3xl font-black mb-2 text-white drop-shadow-lg">Game Over!</h2>
                <p className="text-lg mb-4 text-slate-300">Tổng điểm: <span className="text-yellow-400 font-bold">{score}</span></p>

                {showNameInput ? (
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-xl mb-4 w-full max-w-xs animate-in zoom-in-95">
                        <p className="text-center text-green-400 font-bold mb-2">Chúc mừng! Bạn lọt vào Top 5</p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Nhập tên của bạn"
                                maxLength={10}
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !isSavingScore && handleSaveLeaderboard()}
                                className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                autoFocus
                                disabled={isSavingScore}
                            />
                            <button
                                onClick={handleSaveLeaderboard}
                                disabled={!playerName.trim() || isSavingScore}
                                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors flex items-center justify-center min-w-[40px]"
                            >
                                {isSavingScore ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 shadow-xl mb-6 w-full max-w-xs max-h-[250px] overflow-y-auto">
                         <h3 className="text-center font-bold text-slate-400 uppercase tracking-widest text-xs mb-3 flex items-center justify-center gap-2">
                            <Medal size={14} /> Bảng Xếp Hạng
                         </h3>
                         {isLoadingLeaderboard ? (
                             <div className="flex justify-center p-4 text-slate-400">
                                 <Loader2 size={24} className="animate-spin" />
                             </div>
                         ) : leaderboard.length > 0 ? (
                            <div className="space-y-2">
                                {leaderboard.map((entry, idx) => (
                                    <div key={idx} className={`flex justify-between items-center p-2 rounded-lg ${idx === 0 ? 'bg-yellow-500/20 border border-yellow-500/30' : 'bg-slate-700/50'}`}>
                                        <div className="flex items-center gap-3">
                                            <span className={`
                                                w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold
                                                ${idx === 0 ? 'bg-yellow-500 text-slate-900' : 
                                                  idx === 1 ? 'bg-slate-300 text-slate-900' : 
                                                  idx === 2 ? 'bg-orange-700 text-white' : 'bg-slate-600 text-slate-300'}
                                            `}>
                                                {idx + 1}
                                            </span>
                                            <span className="font-semibold text-sm truncate max-w-[100px]">{entry.name}</span>
                                        </div>
                                        <span className="font-mono font-bold text-yellow-400">{entry.score}</span>
                                    </div>
                                ))}
                            </div>
                         ) : (
                             <p className="text-center text-slate-500 text-sm">Chưa có dữ liệu</p>
                         )}
                    </div>
                )}

                <button 
                    onClick={initGame}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white rounded-full font-bold shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95"
                >
                    Chơi lại ngay
                </button>
            </div>
        )}
      </div>

      <div className={`mt-8 text-center text-sm font-semibold max-w-md space-y-2 transition-colors ${darkMode ? 'text-amber-500' : 'text-amber-600'}`}>
        {activeTool === 'hammer' ? (
            <p className="text-rose-500 font-bold animate-pulse">Chọn một quả bóng để phá hủy!</p>
        ) : activeTool === 'swap' ? (
            <p className="text-amber-500 font-bold animate-pulse">
                {swapSource ? 'Chọn bóng thứ 2 để đổi chỗ' : 'Chọn bóng thứ nhất để hoán đổi'}
            </p>
        ) : (
            <div className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <p>VUI CHƠI LÀ KHỞI NGUỒN CỦA TRI THỨC</p>
                <img 
                    src={darkMode ? "https://lh3.googleusercontent.com/d/1ah0RGe13kImy6WxdDFMYirAQupXX68Sl" : "https://lh3.googleusercontent.com/d/1oTxhowzJvB_4EvS_mNOD-EWYtdYmptBw"}
                    alt="Logo" 
                    className="h-24 w-auto object-contain hover:scale-105 transition-transform duration-300 drop-shadow-md"
                />
            </div>
        )}
      </div>

    </div>
  );
};

export default App;
