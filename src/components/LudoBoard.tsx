import React from 'react';
import { Player, Piece, PlayerColor } from '../types/game';
import { motion } from 'motion/react';
import { Star, ArrowRight, CornerUpRight, ArrowLeft, ArrowUp, ArrowDown } from 'lucide-react';

interface LudoBoardProps {
  players: Player[];
  currentTurn: PlayerColor;
  onPieceClick: (piece: Piece) => void;
}

const COMMON_PATH = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], 
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6], 
  [0, 7], 
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], 
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14], 
  [7, 14], 
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9], 
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8], 
  [14, 7], 
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6], 
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0], 
  [7, 0], 
  [6, 0]
];

const HOME_STRETCH = {
  red: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
  green: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
  blue: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],
  yellow: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]]
};

// Standard Ludo Safe Spot and Arrow Coordinates
const SAFE_SPOTS = [
  [6, 1], [2, 6], [1, 8], [6, 12], [8, 13], [12, 8], [13, 6], [8, 2]
];

const ARROWS = [
  { r: 6, c: 1, color: '#ef4444', dir: 'right' },
  { r: 1, c: 8, color: '#22c55e', dir: 'down' },
  { r: 8, c: 13, color: '#3b82f6', dir: 'left' },
  { r: 13, c: 6, color: '#eab308', dir: 'up' }
];

export function LudoBoard({ players, currentTurn, onPieceClick }: LudoBoardProps) {
  const cells = Array(15 * 15).fill(0);
  
  const getCellColor = (r: number, c: number) => {
    // Red Base Area (Top Left)
    if (r < 6 && c < 6) return 'bg-red-600 shadow-[inset_0_4px_16px_rgba(0,0,0,0.5)] border-red-500/30';
    // Green Base Area (Top Right)
    if (r < 6 && c > 8) return 'bg-green-600 shadow-[inset_0_4px_16px_rgba(0,0,0,0.5)] border-green-500/30';
    // Yellow Base Area (Bottom Left)
    if (r > 8 && c < 6) return 'bg-yellow-500 shadow-[inset_0_4px_16px_rgba(0,0,0,0.5)] border-yellow-400/30';
    // Blue Base Area (Bottom Right)
    if (r > 8 && c > 8) return 'bg-blue-600 shadow-[inset_0_4px_16px_rgba(0,0,0,0.5)] border-blue-500/30';

    // Home Stretches
    // Red Home Stretch (Left)
    if (r === 7 && c > 0 && c < 7) return 'bg-red-500/90 shadow-[inset_0_2px_12px_rgba(0,0,0,0.4)] border-red-600/10';
    // Green Home Stretch (Top)
    if (c === 7 && r > 0 && r < 7) return 'bg-green-500/90 shadow-[inset_0_2px_12px_rgba(0,0,0,0.4)] border-green-600/10';
    // Blue Home Stretch (Right)
    if (r === 7 && c > 8 && c < 14) return 'bg-blue-500/90 shadow-[inset_0_2px_12px_rgba(0,0,0,0.4)] border-blue-600/10';
    // Yellow Home Stretch (Bottom)
    if (c === 7 && r > 8 && r < 14) return 'bg-yellow-400/90 shadow-[inset_0_2px_12px_rgba(0,0,0,0.4)] border-yellow-600/10';

    // Entry Points & Stars
    if (r === 6 && c === 1) return 'bg-red-500 shadow-[0_0_25px_rgba(239,68,68,0.5)]';
    if (r === 1 && c === 8) return 'bg-green-500 shadow-[0_0_25px_rgba(34,197,94,0.5)]';
    if (r === 8 && c === 13) return 'bg-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.5)]';
    if (r === 13 && c === 6) return 'bg-yellow-400 shadow-[0_0_25px_rgba(234,179,8,0.5)]';

    if (r >= 6 && r <= 8 || c >= 6 && c <= 8) return 'bg-white/95';

    return 'bg-slate-300/40';
  };

  return (
    <div className="aspect-square w-full bg-[#0a0a0a] shadow-[0_120px_240px_rgba(0,0,0,1),inset_0_-10px_80px_rgba(255,255,255,0.02)] relative p-4 border-[32px] border-[#0c0a09] rounded-[80px] overflow-hidden translate-z-0 ring-4 ring-yellow-600/10">
      {/* Golden Inner Trim */}
      <div className="absolute inset-2 border-[2px] border-yellow-600/20 rounded-[60px] pointer-events-none z-30" />
      
      {/* Luxury Wood Texture Layer */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-wood.png')] opacity-50 pointer-events-none mix-blend-overlay" />
      <div className="absolute inset-0 bg-gradient-to-tr from-black via-transparent to-white/5 pointer-events-none" />
      
      <div className="w-full h-full grid grid-cols-15 grid-rows-15 bg-[#080c14] relative shadow-[inset_0_0_120px_rgba(0,0,0,1)] border-[10px] border-black/60 rounded-4xl overflow-hidden backdrop-blur-2xl">
        {/* Central Home Zone - Colored Triangles & Citadel Jewel */}
        <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] z-20 pointer-events-none">
           <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl opacity-90">
              <polygon points="0,0 50,50 0,100" className="fill-red-500" />
              <polygon points="0,0 100,0 50,50" className="fill-green-500" />
              <polygon points="100,0 100,100 50,50" className="fill-blue-500" />
              <polygon points="0,100 100,100 50,50" className="fill-yellow-400" />
           </svg>
           {/* Center Jewel - Floating Above */}
           <div className="absolute inset-4 bg-slate-950/40 backdrop-blur-md rounded-xl flex flex-col items-center justify-center border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
              <div className="relative">
                 <div className="absolute inset-0 blur-lg bg-blue-500/10 animate-pulse" />
                 <span className="relative text-white font-black italic tracking-tighter text-[10px] sm:text-[14px] drop-shadow-md leading-none block">LUDO</span>
                 <span className="relative text-yellow-400 font-black italic tracking-widest text-[6px] sm:text-[8px] drop-shadow-sm leading-none text-center block w-full">PRO</span>
              </div>
           </div>
        </div>

        {/* Player Bases (Pockets) - Immersive Experience */}
        {cells.map((_, i) => {
          const r = Math.floor(i / 15);
          const c = i % 15;
          const colorClass = getCellColor(r, c);
          
          const isSafeSpot = SAFE_SPOTS.some(s => s[0] === r && s[1] === c);
          const arrow = ARROWS.find(a => a.r === r && a.c === c);

          return (
            <div 
              key={i} 
              className={`${colorClass} border-[0.5px] border-black/5 transition-all duration-700 flex items-center justify-center relative`}
            >
              <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
              {isSafeSpot && (
                <div className="relative">
                   <Star className="w-4 h-4 text-slate-900/10 fill-slate-900/5" />
                   <div className="absolute inset-0 blur-[4px] bg-slate-900/5 pointer-events-none" />
                </div>
              )}
              {arrow && (
                <div className="absolute inset-0 flex items-center justify-center p-0.5 pointer-events-none">
                   {arrow.dir === 'right' && <ArrowRight className="w-4 h-4 text-white/80 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]" />}
                   {arrow.dir === 'down' && <ArrowDown className="w-4 h-4 text-white/80 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]" />}
                   {arrow.dir === 'left' && <ArrowLeft className="w-4 h-4 text-white/80 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]" />}
                   {arrow.dir === 'up' && <ArrowUp className="w-4 h-4 text-white/80 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]" />}
                </div>
              )}
            </div>
          );
        })}

        <div className="absolute top-0 left-0 w-[40%] h-[40%] p-1 sm:p-7 pointer-events-none">
           <div className="w-full h-full bg-red-950/40 backdrop-blur-2xl rounded-[48px] sm:rounded-[64px] shadow-[inset_0_8px_30px_rgba(0,0,0,0.6),0_15px_50px_rgba(239,68,68,0.25)] border-2 border-red-500/10 flex items-center justify-center gap-3 sm:gap-6 flex-wrap p-4 sm:p-10">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-7 h-7 sm:w-12 sm:h-12 rounded-full bg-black/40 shadow-[inset_0_4px_12px_rgba(0,0,0,0.9),0_1px_1px_rgba(255,255,255,0.05)] border border-red-500/5 flex items-center justify-center relative">
                   <div className="w-full h-full rounded-full bg-red-500/2 blur-md" />
                   <div className="absolute top-1 left-2 w-1.5 h-1.5 bg-white/10 rounded-full blur-[0.5px]" />
                </div>
              ))}
           </div>
        </div>
        <div className="absolute top-0 right-0 w-[40%] h-[40%] p-1 sm:p-7 pointer-events-none">
           <div className="w-full h-full bg-green-950/40 backdrop-blur-2xl rounded-[48px] sm:rounded-[64px] shadow-[inset_0_8px_30px_rgba(0,0,0,0.6),0_15px_50px_rgba(34,197,94,0.25)] border-2 border-green-500/10 flex items-center justify-center gap-3 sm:gap-6 flex-wrap p-4 sm:p-10">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-7 h-7 sm:w-12 sm:h-12 rounded-full bg-black/40 shadow-[inset_0_4px_12px_rgba(0,0,0,0.9),0_1px_1px_rgba(255,255,255,0.05)] border border-green-500/5 flex items-center justify-center relative">
                   <div className="w-full h-full rounded-full bg-green-500/2 blur-md" />
                   <div className="absolute top-1 left-2 w-1.5 h-1.5 bg-white/10 rounded-full blur-[0.5px]" />
                </div>
              ))}
           </div>
        </div>
        <div className="absolute bottom-0 right-0 w-[40%] h-[40%] p-1 sm:p-7 pointer-events-none">
           <div className="w-full h-full bg-blue-950/40 backdrop-blur-2xl rounded-[48px] sm:rounded-[64px] shadow-[inset_0_8px_30px_rgba(0,0,0,0.6),0_15px_50px_rgba(59,130,246,0.25)] border-2 border-blue-500/10 flex items-center justify-center gap-3 sm:gap-6 flex-wrap p-4 sm:p-10">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-7 h-7 sm:w-12 sm:h-12 rounded-full bg-black/40 shadow-[inset_0_4px_12px_rgba(0,0,0,0.9),0_1px_1px_rgba(255,255,255,0.05)] border border-blue-500/5 flex items-center justify-center relative">
                   <div className="w-full h-full rounded-full bg-blue-500/2 blur-md" />
                   <div className="absolute top-1 left-2 w-1.5 h-1.5 bg-white/10 rounded-full blur-[0.5px]" />
                </div>
              ))}
           </div>
        </div>
        <div className="absolute bottom-0 left-0 w-[40%] h-[40%] p-1 sm:p-7 pointer-events-none">
           <div className="w-full h-full bg-yellow-950/40 backdrop-blur-2xl rounded-[48px] sm:rounded-[64px] shadow-[inset_0_8px_30px_rgba(0,0,0,0.6),0_15px_50px_rgba(234,179,8,0.2)] border-2 border-yellow-500/10 flex items-center justify-center gap-3 sm:gap-6 flex-wrap p-4 sm:p-10">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-7 h-7 sm:w-12 sm:h-12 rounded-full bg-black/40 shadow-[inset_0_4px_12px_rgba(0,0,0,0.9),0_1px_1px_rgba(255,255,255,0.05)] border border-yellow-500/5 flex items-center justify-center relative">
                   <div className="w-full h-full rounded-full bg-yellow-500/2 blur-md" />
                   <div className="absolute top-1 left-2 w-1.5 h-1.5 bg-white/10 rounded-full blur-[0.5px]" />
                </div>
              ))}
           </div>
        </div>

        {/* Pieces */}
        {players.map((p) => (
          p.pieces.map((pc) => (
            <PieceUI 
               key={pc.id} 
               piece={pc} 
               isTurn={currentTurn === p.color}
               onClick={() => onPieceClick(pc)} 
            />
          ))
        ))}
      </div>
    </div>
  );
}

function PieceUI({ piece, isTurn, onClick }: { piece: Piece, isTurn: boolean, onClick: () => void, key?: string }) {
  const getCoordinates = (pos: number, color: PlayerColor) => {
    let r, c;
    
    if (pos === -1) {
       const baseOrigins: any = {
         red: [1, 1],
         green: [1, 10],
         blue: [10, 10],
         yellow: [10, 1]
       };
       const origin = baseOrigins[color];
       const posInBase = [
         [0, 0], [0, 3],
         [3, 0], [3, 3]
       ][piece.index];
       r = origin[0] + posInBase[0] + 1;
       c = origin[1] + posInBase[1] + 1;
    } else if (pos >= 0 && pos < 51) {
       const offsets: any = { red: 0, green: 13, blue: 26, yellow: 39 };
       const pathIdx = (pos + offsets[color]) % 52;
       [r, c] = COMMON_PATH[pathIdx];
    } else if (pos >= 51 && pos < 57) {
       const stretchIdx = pos - 51;
       [r, c] = HOME_STRETCH[color][stretchIdx];
    } else {
       r = 7;
       c = 7;
    }

    const cellSize = 100 / 15;
    return { 
      top: `${r * cellSize}%`, 
      left: `${c * cellSize}%` 
    };
  };

  const coords = getCoordinates(piece.position, piece.color);

  return (
    <motion.button
      onClick={onClick}
      layoutId={piece.id}
      style={{ top: coords.top, left: coords.left }}
      transition={{ type: "spring", stiffness: 450, damping: 28 }}
      whileHover={{ scale: isTurn ? 1.5 : 1.1, y: -4 }}
      className={`absolute w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-white/40 shadow-[0_15px_30px_rgba(0,0,0,0.6),inset_0_-4px_8px_rgba(0,0,0,0.3)] z-50 flex items-center justify-center transition-all ${
        piece.color === 'red' ? 'bg-gradient-to-t from-red-800 via-red-600 to-red-400' : 
        piece.color === 'blue' ? 'bg-gradient-to-t from-blue-800 via-blue-600 to-blue-400' :
        piece.color === 'yellow' ? 'bg-gradient-to-t from-yellow-700 via-yellow-500 to-yellow-300' : 
        'bg-gradient-to-t from-green-800 via-green-600 to-green-400'
      } ${isTurn ? 'ring-8 ring-yellow-400/20 ring-offset-0 cursor-pointer' : 'cursor-default opacity-100'}`}
    >
      {/* 3D Glossy Highlight */}
      <div className="absolute top-1 left-1.5 w-2 h-2 rounded-full bg-white/30 blur-[0.5px]" />
      
      {/* Piece Center Circle */}
      <div className="w-2.5 h-2.5 rounded-full bg-black/20 shadow-inner border border-white/10 flex items-center justify-center">
         <div className="w-1 h-1 rounded-full bg-white/40 blur-[0.5px]" />
      </div>

      {/* Turn Indicator Glow */}
      {isTurn && (
        <motion.div 
          animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full bg-yellow-400/30 blur-md pointer-events-none"
        />
      )}
    </motion.button>
  );
}

