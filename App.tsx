import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, RotateCcw, ArrowRightLeft, Hammer, Moon, Sun } from 'lucide-react';
import { GridState, Position, PendingBall } from './types';
import { GRID_SIZE, INITIAL_SWAPS, INITIAL_HAMMERS } from './constants';
import { generateEmptyGrid, getRandomColor, getEmptyCells, checkLinesAndScore } from './utils/gameLogic';
import { findPath } from './utils/pathfinding';
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
  
  // Power-ups State
  const [swapsLeft, setSwapsLeft] = useState(INITIAL_SWAPS);
  const [hammersLeft, setHammersLeft] = useState(INITIAL_HAMMERS);
  const [activeTool, setActiveTool] = useState<'none' | 'hammer' | 'swap'>('none');
  const [swapSource, setSwapSource] = useState<Position | null>(null);

  // Theme State
  const [darkMode, setDarkMode] = useState(false);

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

  // Load High Score
  useEffect(() => {
    const saved = localStorage.getItem('line98-highscore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  // Save High Score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('line98-highscore', score.toString());
    }
  }, [score, highScore]);

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
        // Slide form E5 (659Hz) to A5 (880Hz) quickly
        osc.frequency.setValueAtTime(659.25, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.1);
        
        // Fade out
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
        // Ignore audio errors (e.g. if user hasn't interacted yet)
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
    
    // Reset Power-ups
    setSwapsLeft(INITIAL_SWAPS);
    setHammersLeft(INITIAL_HAMMERS);
    setActiveTool('none');
    setSwapSource(null);
  }, []);

  // Start game on mount
  useEffect(() => {
    initGame();
  }, [initGame]);

  const toggleTheme = () => setDarkMode(!darkMode);

  const handleSwapClick = () => {
    if (swapsLeft <= 0 || gameOver) return;
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
    if (hammersLeft <= 0 || gameOver) return;
    if (activeTool === 'hammer') {
        setActiveTool('none');
    } else {
        setActiveTool('hammer');
        setSelectedPos(null); // Clear normal selection
        setSwapSource(null);
    }
  };

  // Convert Pending Balls to Real Balls
  const spawnPendingBalls = (currentGrid: GridState) => {
    const newGrid = [...currentGrid.map(row => [...row])];
    
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
        id: `ball-${Date.now()}-${Math.random()}`
      };

      emptyCells = emptyCells.filter(p => !(p.row === targetPos.row && p.col === targetPos.col));
    }

    const { cellsToRemove, points } = checkLinesAndScore(newGrid);

    if (cellsToRemove.length > 0) {
      playScoreSound(); // Play sound
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

  const handleCellClick = (row: number, col: number) => {
    if (gameOver) return;

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
        // Execute move
        const newGrid = [...grid.map(r => [...r])];
        const ballColor = newGrid[selectedPos.row][selectedPos.col].color;
        
        newGrid[selectedPos.row][selectedPos.col].color = null;
        newGrid[row][col] = {
            ...newGrid[row][col],
            color: ballColor,
            id: grid[selectedPos.row][selectedPos.col].id
        };

        setGrid(newGrid);
        setSelectedPos(null);

        // Check for lines
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

        } else {
            spawnPendingBalls(newGrid);
        }
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
            <div className="absolute inset-0 z-20 bg-slate-900/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center text-white animate-in fade-in duration-300">
                <h2 className="text-4xl font-black mb-2 text-white drop-shadow-lg">Game Over!</h2>
                <p className="text-lg mb-6 text-slate-300">Tổng điểm: {score}</p>
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
