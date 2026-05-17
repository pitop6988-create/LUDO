import React, { useEffect, useState } from 'react';
import { 
  doc, 
  onSnapshot, 
  updateDoc, 
  arrayUnion,
  getDoc,
  collection 
} from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { GameState, Player, PlayerColor, Piece, OperationType } from '../types/game';
import { motion, AnimatePresence } from 'motion/react';
import { LudoBoard } from '../components/LudoBoard';
import { 
  Users, 
  ArrowLeft, 
  Dice5, 
  CheckCircle,
  Copy,
  Clock,
  LogOut,
  Trophy
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface GamePageProps {
  gameId: string | null;
  onExit: () => void;
}

export function GamePage({ gameId, onExit }: GamePageProps) {
  const { profile } = useAuth();
  const [game, setGame] = useState<any>(null);
  const [playerProfiles, setPlayerProfiles] = useState<Record<string, any>>({});
  const [diceSkins, setDiceSkins] = useState<Record<string, any>>({});
  const [frames, setFrames] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [rolling, setRolling] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  const myPlayer = game?.players.find((p: any) => p.uid === profile?.uid);
  const isMyTurn = game?.currentTurn === myPlayer?.color;

  // Sound effects
  const diceSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2045/2045-preview.mp3');
  const moveSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

  useEffect(() => {
    if (!gameId) return;

    const unsubscribe = onSnapshot(doc(db, 'games', gameId), async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const fullGame = { id: snap.id, ...data };
        
        // Check if dice value changed to play sound
        if (game?.diceValue !== data.diceValue && data.diceValue) {
          diceSound.play().catch(() => {});
        }

        setGame(fullGame);

        // Fetch profiles for new players
        const newProfiles: Record<string, any> = { ...playerProfiles };
        let updated = false;
        for (const p of data.players) {
          if (!newProfiles[p.uid] && !p.uid.startsWith('bot_')) {
            const pSnap = await getDoc(doc(db, 'users', p.uid));
            if (pSnap.exists()) {
              newProfiles[p.uid] = pSnap.data();
              updated = true;
            }
          }
        }
        if (updated) setPlayerProfiles(newProfiles);

        // Bot intelligence: If it's a bot player's turn, execute an action
        if (data.status === 'playing' && data.canRoll && !rolling) {
          const currentPlayer = data.players.find((p: any) => p.color === data.currentTurn);
          if (currentPlayer && currentPlayer.uid.startsWith('bot_')) {
            setTimeout(() => {
              executeBotTurn(snap.id, fullGame);
            }, 1500);
          }
        }

        // Check if I need to join this game (if not already in players list)
        if (!data.players.find((p: any) => p.uid === profile?.uid) && data.status === 'waiting') {
           joinGame(snap.id, data);
        }
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `games/${gameId}`);
    });

    const diceUnsubscribe = onSnapshot(collection(db, 'dice_skins'), (snap) => {
      const skins: Record<string, any> = {};
      snap.docs.forEach(doc => {
        skins[doc.id] = doc.data();
      });
      setDiceSkins(skins);
    });

    const framesUnsubscribe = onSnapshot(collection(db, 'frames'), (snap) => {
      const f: Record<string, any> = {};
      snap.docs.forEach(doc => {
        f[doc.id] = doc.data();
      });
      setFrames(f);
    });

    return () => {
      unsubscribe();
      diceUnsubscribe();
      framesUnsubscribe();
    };
  }, [gameId, profile?.uid]);

  // Turn Timer Logic
  useEffect(() => {
    if (!game || game.status !== 'playing' || game.winner) return;
    
    const turnInterval = setInterval(async () => {
      if (!game.turnDeadline) return;
      
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((game.turnDeadline - now) / 1000));
      setTimeLeft(remaining);

      // Auto-skip logic if it's my turn
      if (remaining === 0 && isMyTurn && !rolling) {
        clearInterval(turnInterval);
        await moveTurn();
      }
    }, 1000);

    return () => clearInterval(turnInterval);
  }, [game?.currentTurn, game?.turnDeadline, isMyTurn]);

  const executeBotTurn = async (id: string, state: any) => {
    setRolling(true);
    const val = Math.floor(Math.random() * 6) + 1;
    
    // Simulate dice animation
    setTimeout(async () => {
      const currentPlayer = state.players.find((p: any) => p.color === state.currentTurn);
      const pieces = currentPlayer.pieces;
      
      // Select best piece to move
      // Priority: Move piece from base (if 6), then move piece closest to home
      let selectedPiece = null;
      
      if (val === 6) {
        selectedPiece = pieces.find((p: any) => p.position === -1);
      }
      
      if (!selectedPiece) {
        const movablePieces = pieces.filter((p: any) => p.position !== -1 && p.position + val <= 57);
        if (movablePieces.length > 0) {
          selectedPiece = movablePieces.sort((a: any, b: any) => b.position - a.position)[0];
        }
      }

      if (!selectedPiece && val === 6) {
         // Should have been picked above, but redundant check for safety
         selectedPiece = pieces.find((p: any) => p.position === -1);
      }

      if (!selectedPiece) {
        // No move possible, skip turn
        const colors = state.players.map((p: any) => p.color);
        const idx = colors.indexOf(state.currentTurn);
        const nextTurn = colors[(idx + 1) % colors.length];
        
        await updateDoc(doc(db, 'games', id), {
          currentTurn: nextTurn,
          diceValue: null,
          canRoll: true,
          canMove: false
        });
        setRolling(false);
        return;
      }

      // Move the selected piece
      let newPos = selectedPiece.position;
      if (newPos === -1) newPos = 0;
      else newPos += val;

      const updatedPlayers = state.players.map((p: any) => {
        if (p.color === state.currentTurn) {
          return {
            ...p,
            pieces: p.pieces.map((pc: any) => pc.id === selectedPiece.id ? { ...pc, position: newPos } : pc)
          };
        }
        return p;
      });

      const isWinner = updatedPlayers.find((p: any) => p.color === state.currentTurn).pieces.every((pc: any) => pc.position === 57);
      const colors = state.players.map((p: any) => p.color);
      const idx = colors.indexOf(state.currentTurn);
      const nextTurn = colors[(idx + 1) % colors.length];

      try {
        await updateDoc(doc(db, 'games', id), {
          players: updatedPlayers,
          diceValue: null,
          canRoll: true,
          canMove: false,
          status: isWinner ? 'finished' : 'playing',
          winner: isWinner ? currentPlayer.name : null,
          currentTurn: val === 6 ? state.currentTurn : nextTurn
        });
      } catch (err) {
        console.error("Bot update error", err);
      }
      setRolling(false);
    }, 1200);
  };

  const joinGame = async (id: string, data: any) => {
    if (data.players.length >= (data.maxPlayers || 4)) return;
    
    const colors: PlayerColor[] = ['red', 'green', 'blue', 'yellow'];
    const usedColors = data.players.map((p: any) => p.color);
    const availableColor = colors.find(c => !usedColors.includes(c)) || 'red';

    const newPlayer = {
      uid: profile?.uid,
      name: profile?.name,
      color: availableColor,
      isReady: true,
      pieces: Array(4).fill(0).map((_, i) => ({ 
        id: `${availableColor}-${i}`, 
        color: availableColor, 
        position: -1, 
        index: i 
      }))
    };

    try {
      await updateDoc(doc(db, 'games', id), {
        players: arrayUnion(newPlayer)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `games/${id}`);
    }
  };

  const startGame = async () => {
    if (!gameId) return;
    try {
      await updateDoc(doc(db, 'games', gameId), {
        status: 'playing',
        currentTurn: 'red',
        turnDeadline: Date.now() + 30000
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
    }
  };

  const rollDice = async () => {
    if (!gameId || rolling || game.diceValue !== null || game.currentTurn !== myPlayer?.color) return;
    
    setRolling(true);
    const val = Math.floor(Math.random() * 6) + 1;
    
    // Simulate animation delay
    setTimeout(async () => {
      try {
        await updateDoc(doc(db, 'games', gameId), {
          diceValue: val,
          canRoll: false,
          canMove: true
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
      }
      setRolling(false);

      // Simple auto-pass if no moves possible (simplified for now)
      // If val != 6 and all pieces at -1, move turn
      const allPiecesInBase = myPlayer.pieces.every((p: any) => p.position === -1);
      if (val !== 6 && allPiecesInBase) {
        setTimeout(() => moveTurn(), 1000);
      }
    }, 1200);
  };

  const moveTurn = async () => {
    if (!gameId) return;
    const colors: PlayerColor[] = game.players.map((p: any) => p.color);
    const currentIndex = colors.indexOf(game.currentTurn);
    const nextIndex = (currentIndex + 1) % colors.length;
    
    try {
      await updateDoc(doc(db, 'games', gameId), {
        currentTurn: colors[nextIndex],
        diceValue: null,
        canRoll: true,
        canMove: false,
        turnDeadline: Date.now() + 30000
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
    }
  };

  const handlePieceClick = async (piece: Piece) => {
    if (!gameId || !game.canMove || game.currentTurn !== myPlayer?.color) return;
    if (game.diceValue === null) return;

    moveSound.play().catch(() => {});

    let newPosition = piece.position;
    if (piece.position === -1) {
      if (game.diceValue === 6) newPosition = 0;
      else return; // Can't move from base without 6
    } else {
      newPosition += game.diceValue;
    }

    if (newPosition > 57) return; // Can't go past home

    const updatedPlayers = game.players.map((p: any) => {
      if (p.uid === profile?.uid) {
        return {
          ...p,
          pieces: p.pieces.map((pc: any) => pc.id === piece.id ? { ...pc, position: newPosition } : pc)
        };
      }
      return p;
    });

    // Check for win
    const isWinner = updatedPlayers.find((p: any) => p.uid === profile?.uid).pieces.every((pc: any) => pc.position === 57);
    
    if (isWinner && profile?.uid) {
      const userRef = doc(db, 'users', profile.uid);
      try {
        await updateDoc(userRef, {
          balance: (profile.balance || 0) + 100, // 100 coins win reward
          wins: (profile.wins || 0) + 1,
          totalGames: (profile.totalGames || 0) + 1
        });
      } catch (err) {
        console.error("Failed to reward winner", err);
      }
    }

    try {
      await updateDoc(doc(db, 'games', gameId), {
        players: updatedPlayers,
        status: isWinner ? 'finished' : 'playing',
        winner: isWinner ? profile?.name : null,
        diceValue: null,
        canRoll: true,
        canMove: false,
        currentTurn: game.diceValue === 6 ? game.currentTurn : getNextTurn(),
        turnDeadline: Date.now() + 30000
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
    }

    if (isWinner) confetti();
  };

  const getNextTurn = () => {
    const colors = game.players.map((p: any) => p.color);
    const idx = colors.indexOf(game.currentTurn);
    return colors[(idx + 1) % colors.length];
  };

  if (loading) return <div>Loading...</div>;

  if (game.status === 'waiting') {
    return (
      <div className="flex flex-col h-full bg-gray-50 p-4">
        <button onClick={onExit} className="flex items-center gap-2 text-gray-500 mb-8">
          <ArrowLeft className="w-5 h-5" /> Back to Home
        </button>

        <div className="bg-white rounded-3xl p-8 shadow-xl space-y-8 flex-1 flex flex-col justify-center items-center text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
             <Clock className="w-10 h-10 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Waiting for Players</h2>
            <p className="text-gray-400">Share room code to invite friends</p>
          </div>

          <div className="bg-gray-50 px-6 py-4 rounded-2xl border-2 border-dashed border-gray-200 flex items-center gap-4">
            <span className="text-3xl font-black tracking-widest text-gray-800">{game.roomCode}</span>
            <button onClick={() => navigator.clipboard.writeText(game.roomCode)} className="p-2 bg-white rounded-lg border shadow-sm">
              <Copy className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="w-full space-y-3">
              {game.players.map((p: any) => (
               <div key={p.uid} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-3">
                     <div className={`w-8 h-8 rounded-full bg-${p.color}-500 shadow-lg border-2 border-white`} />
                     <span className="font-bold">{p.name} {p.uid === profile?.uid && '(You)'}</span>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500" />
               </div>
             ))}
             {Array((game.maxPlayers || 4) - game.players.length).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-2xl opacity-50">
                  <div className="w-8 h-8 rounded-full bg-gray-200" />
                  <span className="text-sm font-medium text-gray-400 italic">Waiting...</span>
                </div>
             ))}
          </div>

          {game.createdBy === profile?.uid && game.players.length >= 2 && (
            <button 
              onClick={startGame}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
            >
              Start Game Now
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-between h-[100svh] w-full bg-[#0c0a09] text-slate-100 relative overflow-hidden font-sans select-none p-0">
      {/* Cinematic Tabletop Texture */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-wood.png')] opacity-80 pointer-events-none mix-blend-multiply" />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black/80 pointer-events-none" />
      
      {/* Dramatic Lighting Spots */}
      <div className="absolute top-[-20%] left-[-20%] w-[150%] h-[150%] bg-blue-900/10 blur-[200px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[150%] h-[150%] bg-purple-900/10 blur-[200px] rounded-full pointer-events-none" />
      <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-full h-[40%] bg-white/[0.03] blur-[150px] rounded-full pointer-events-none" />

      {/* Premium Header - Floating Glassmorphism */}
      <div className="w-full max-w-4xl flex justify-between items-center z-40 px-8 pt-12 pb-4">
         <motion.button 
           whileTap={{ scale: 0.9 }}
           onClick={onExit} 
           className="p-4 bg-white/5 hover:bg-white/10 rounded-[24px] shadow-2xl border border-white/10 backdrop-blur-3xl transition-all"
         >
            <ArrowLeft className="w-6 h-6 text-slate-300" />
         </motion.button>
         
         <div className="flex-1 flex flex-col items-center">
            <h1 className="text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-blue-200 via-blue-400 to-blue-600 drop-shadow-[0_0_30px_rgba(96,165,250,0.5)] leading-none text-center">LUDO MASTER</h1>
            <div className="flex items-center gap-3 mt-3">
               <div className="flex gap-1">
                  {[1,2,3,4,5,6].map(i => <div key={i} className="w-1 h-1 rounded-full bg-blue-500/50" />)}
               </div>
               <span className="text-[12px] font-black text-slate-500 uppercase tracking-[0.8em] pl-[0.8em]">ROYAL ARENA</span>
               <div className="flex gap-1">
                  {[1,2,3,4,5,6].map(i => <div key={i} className="w-1 h-1 rounded-full bg-blue-500/50" />)}
               </div>
            </div>
         </div>
         
         <div className="flex flex-col items-end gap-1">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Table ID</div>
            <span className="text-md font-black text-white bg-slate-900/80 px-4 py-2 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl">{game.roomCode}</span>
         </div>
      </div>

      {/* Main Board Stage - Expansive Feel */}
      <div className="relative w-full flex-1 flex items-center justify-center p-4 z-20">
        {/* Animated Ground Shadow */}
        <div className="absolute w-[80%] h-[40%] bg-black/80 blur-[130px] rounded-[50%] translate-y-32 scale-x-150 pointer-events-none" />
        
        <div className="relative w-full max-w-[min(94vw,72vh)] aspect-square">
          {/* Player Identity Cards */}
          {game.players.map((p: any, idx: number) => {
            const isCurrent = game.currentTurn === p.color;
            const prof = playerProfiles[p.uid];
            const posByColor: Record<string, string> = {
              red: 'top-[-45px] left-[-35px] sm:top-[-70px] sm:left-[-60px]',
              green: 'top-[-45px] right-[-35px] sm:top-[-70px] sm:right-[-60px]',
              blue: 'bottom-[-45px] right-[-35px] sm:bottom-[-70px] sm:right-[-60px]',
              yellow: 'bottom-[-45px] left-[-35px] sm:bottom-[-70px] sm:left-[-60px]'
            };
            
            const colorTheme = p.color === 'red' ? 'red' : p.color === 'blue' ? 'blue' : p.color === 'yellow' ? 'yellow' : 'green';
            const themeHex = p.color === 'red' ? '#ef4444' : p.color === 'blue' ? '#3b82f6' : p.color === 'yellow' ? '#facc15' : '#22c55e';

            return (
              <motion.div 
                key={p.uid}
                animate={isCurrent ? { 
                  scale: 1.15, 
                  y: [0, -6, 0],
                } : { scale: 1 }}
                transition={isCurrent ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
                className={`absolute z-30 ${posByColor[p.color]} flex flex-col items-center gap-1`}
              >
                <div className={`relative p-1.5 rounded-[40px] bg-[#0c0a09] border-[3px] transition-all duration-1000 ${isCurrent ? `border-${colorTheme}-400 ring-[24px] ring-${colorTheme}-500/10 shadow-[0_0_100px_rgba(30,144,250,0.5)] scale-110 -translate-y-4` : 'border-slate-800 opacity-60'}`}>
                   <div className="w-16 h-16 sm:w-28 sm:h-28 bg-black rounded-[34px] overflow-hidden relative shadow-inner group">
                      <img 
                        src={p.uid.startsWith('bot_') ? `https://api.dicebear.com/7.x/bottts/svg?seed=${p.uid}` : (prof?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`)} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      />
                      {prof?.currentFrame && (
                        (() => {
                           const frameData = frames[prof.currentFrame];
                           return frameData ? (
                             <img src={frameData.asset} className="absolute inset-[-10%] w-[120%] h-[120%] object-contain z-10 pointer-events-none drop-shadow-2xl" />
                           ) : null;
                        })()
                      )}

                      {/* Ultimate Timer Ring */}
                      {isCurrent && (
                        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none z-20">
                          <circle cx="50%" cy="50%" r="48%" className={`fill-none stroke-${colorTheme}-500/10 stroke-[8]`} />
                          <motion.circle
                            initial={{ strokeDashoffset: 283 }}
                            animate={{ strokeDashoffset: 283 - (timeLeft / 30) * 283 }}
                            cx="50%" cy="50%" r="48%"
                            className={`fill-none stroke-${colorTheme}-400 stroke-[6]`}
                            style={{ 
                              strokeDasharray: '283',
                              filter: `drop-shadow(0 0 12px ${themeHex})`
                            }}
                          />
                        </svg>
                      )}
                   </div>
                   {/* Player Color status jewel */}
                   <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-full border-[6px] border-[#0c0a09] shadow-2xl bg-gradient-to-br ${
                     p.color === 'red' ? 'from-red-400 to-red-700' :
                     p.color === 'blue' ? 'from-blue-400 to-blue-700' :
                     p.color === 'yellow' ? 'from-yellow-300 to-yellow-600' :
                     'from-green-400 to-green-700'
                   } flex items-center justify-center`}>
                      <div className="w-2.5 h-2.5 rounded-full bg-white/50 blur-[1.5px]" />
                   </div>
                </div>
                <div className={`mt-3 px-5 py-2 rounded-full text-[10px] sm:text-[12px] font-black uppercase tracking-[0.3em] text-center shadow-2xl border transition-all duration-700 backdrop-blur-3xl ${isCurrent ? `bg-${colorTheme}-600 text-white border-${colorTheme}-400 shadow-${colorTheme}-900/40` : 'bg-black/60 text-slate-500 border-white/5'}`}>
                  {p.name.split(' ')[0]}
                </div>
              </motion.div>
            );
          })}
  
          {/* The Board */}
          <LudoBoard 
            players={game.players} 
            currentTurn={game.currentTurn}
            onPieceClick={handlePieceClick}
          />
        </div>
      </div>

      {/* Controls Container - Floating Table Style */}
      <div className="w-full max-w-lg z-30 pb-10 px-6">
         {game.status === 'finished' ? (
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="bg-gradient-to-br from-yellow-400 to-yellow-600 p-10 rounded-[48px] text-center text-blue-950 shadow-[0_40px_80px_rgba(0,0,0,0.5)] relative overflow-hidden ring-1 ring-white/20"
           >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/white-diamond.png')] opacity-10" />
              <Trophy className="w-20 h-20 mx-auto mb-6 drop-shadow-2xl" />
              <h2 className="text-4xl font-black mb-2 italic">CHAMPION</h2>
              <p className="text-blue-950/70 font-black mb-8 uppercase tracking-widest">{game.winner} REIGNS SUPREME</p>
              <button 
                onClick={onExit}
                className="bg-blue-950 text-white px-10 py-5 rounded-[24px] font-black w-full shadow-2xl active:scale-95 transition-all text-lg tracking-widest"
              >
                RETURN TO KINGS HALL
              </button>
           </motion.div>
         ) : (
           <div className="bg-slate-900/60 backdrop-blur-3xl border border-white/5 p-10 rounded-[50px] shadow-[0_60px_120px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05)] flex items-center justify-between ring-1 ring-white/10 relative group">
              <div className="flex flex-col relative z-10">
                 <span className="text-[14px] font-black uppercase text-slate-500 tracking-[0.4em] mb-3 leading-none drop-shadow-sm">
                    {isMyTurn ? "YOUR DESTINY" : "OPPONENT WAIT"}
                 </span>
                 <div className="flex items-center gap-4">
                    <div className={`w-5 h-5 rounded-full shadow-[0_0_25px] ${
                      game.currentTurn === 'red' ? 'shadow-red-500 bg-red-500' :
                      game.currentTurn === 'blue' ? 'shadow-blue-500 bg-blue-500' :
                      game.currentTurn === 'yellow' ? 'shadow-yellow-400 bg-yellow-400' :
                      'shadow-green-500 bg-green-500'
                    } animate-pulse`} />
                    <span className="font-black text-3xl uppercase tracking-tighter text-white drop-shadow-2xl">{game.currentTurn}</span>
                 </div>
              </div>

              <motion.button 
                disabled={!isMyTurn || rolling || game.diceValue !== null}
                onClick={rollDice}
                animate={rolling ? { rotate: 720 } : {}}
                transition={rolling ? { repeat: Infinity, duration: 0.4, ease: "linear" } : { type: "spring", stiffness: 300 }}
                whileHover={isMyTurn && !rolling && game.diceValue === null ? { scale: 1.15, rotate: 10, y: -5 } : {}}
                whileTap={isMyTurn && !rolling && game.diceValue === null ? { scale: 0.9, rotate: -10 } : {}}
                className={`w-24 h-24 rounded-[32px] border-b-[8px] flex items-center justify-center transition-all shadow-[0_30px_60px_rgba(0,0,0,0.6)] relative overflow-hidden ${
                  isMyTurn && game.diceValue === null ? 'bg-gradient-to-br from-blue-500 to-blue-700 border-blue-900 text-white shadow-blue-500/30' : 
                  game.diceValue !== null ? 'bg-slate-800 border-slate-950 text-white shadow-inner' :
                  'bg-slate-800/50 border-slate-900 text-slate-600'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 pointer-events-none" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                
                {game.diceValue ? (
                  (() => {
                    const currentPlayerInGame = game.players.find((p: any) => p.color === game.currentTurn);
                    const isMe = currentPlayerInGame?.uid === profile?.uid;
                    const currentProf = isMe ? profile : playerProfiles[currentPlayerInGame?.uid];
                    const skin = diceSkins[currentProf?.equippedDiceSkin];
                    const faceImg = skin?.faces?.[game.diceValue - 1];
                    
                    return faceImg ? (
                      <img src={faceImg} className="w-full h-full object-cover p-2 drop-shadow-2xl" />
                    ) : (
                      <span className="text-5xl font-black drop-shadow-[0_6px_12px_rgba(0,0,0,0.6)]">{game.diceValue}</span>
                    );
                  })()
                ) : (
                  <div className="relative">
                     <Dice5 className="w-12 h-12 drop-shadow-2xl" />
                     {isMyTurn && <div className="absolute inset-0 blur-xl bg-white/20 animate-pulse pointer-events-none" />}
                  </div>
                )}
              </motion.button>
           </div>
         )}
      </div>

      <div className="h-12 flex items-center justify-center">
        {game.diceValue && isMyTurn && game.canMove && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-yellow-400 text-blue-900 px-8 py-3 rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-2xl animate-bounce flex items-center gap-3"
          >
            <div className="w-2 h-2 rounded-full bg-blue-900 animate-ping" />
            Move Piece!
          </motion.div>
        )}
      </div>
    </div>
  );
}
