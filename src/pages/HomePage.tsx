import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Share2, 
  Trophy, 
  Coins, 
  LayoutGrid,
  Zap,
  Search,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { generateRoomCode } from '../utils/utils';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  doc,
  updateDoc,
  arrayUnion,
  limit,
  orderBy,
  startAt,
  endAt
} from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { OperationType } from '../types/game';

interface HomePageProps {
  onJoinGame: (gameId: string) => void;
}

export function HomePage({ onJoinGame }: HomePageProps) {
  const { profile } = useAuth();
  const [joiningCode, setJoiningCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  const [maxPlayers, setMaxPlayers] = useState<2 | 4>(4);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (val.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      // Basic prefix search
      const q = query(
        collection(db, 'users'),
        orderBy('name'),
        startAt(val),
        endAt(val + '\uf8ff'),
        limit(5)
      );
      const snap = await getDocs(q);
      const users = snap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
      setSearchResults(users);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleCheckIn = async () => {
    if (!profile?.uid) return;
    
    const today = new Date().toDateString();
    const lastClaim = profile.lastRewardClaimedAt ? new Date(profile.lastRewardClaimedAt).toDateString() : null;
    
    if (today === lastClaim) {
      alert('Reward already claimed today! Come back tomorrow.');
      return;
    }

    setCheckingIn(true);
    try {
      const userRef = doc(db, 'users', profile.uid);
      const transaction = {
        id: Date.now().toString(),
        type: 'referral', // Reusing Type
        amount: 10,
        status: 'completed',
        timestamp: Date.now()
      };
      await updateDoc(userRef, {
        balance: (profile.balance || 0) + 10,
        history: arrayUnion(transaction),
        lastRewardClaimedAt: Date.now()
      });
      alert('Daily Reward: 10C added to your balance!');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${profile.uid}`);
    } finally {
      setCheckingIn(false);
    }
  };

  const createGame = async (mode: 'multiplayer' | 'friends' | 'bot') => {
    setLoading(true);
    try {
      const roomCode = generateRoomCode();
      
      const players = [
        {
          uid: profile?.uid,
          name: profile?.name,
          color: 'red',
          isReady: true,
          pieces: Array(4).fill(0).map((_, i) => ({ id: `red-${i}`, color: 'red', position: -1, index: i }))
        }
      ];

      if (mode === 'bot') {
        const colors: any[] = ['blue', 'yellow', 'green'];
        for (let i = 0; i < maxPlayers - 1; i++) {
          players.push({
            uid: `bot_${i}`,
            name: `AI Bot ${i + 1}`,
            color: colors[i],
            isReady: true,
            pieces: Array(4).fill(0).map((_, j) => ({ id: `${colors[i]}-${j}`, color: colors[i], position: -1, index: j }))
          });
        }
      }

      const gameData = {
        roomCode,
        status: mode === 'bot' ? 'playing' : 'waiting',
        createdBy: profile?.uid,
        mode,
        maxPlayers,
        players,
        currentTurn: 'red',
        diceValue: null,
        canRoll: true,
        canMove: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'games'), gameData);
      onJoinGame(docRef.id);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'games');
    } finally {
      setLoading(false);
    }
  };

  const joinGame = async () => {
    if (!joiningCode) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'games'), where('roomCode', '==', joiningCode.toUpperCase()), where('status', '==', 'waiting'));
      const snap = await getDocs(q);
      if (snap.empty) {
        alert('Game not found or already started');
        return;
      }
      onJoinGame(snap.docs[0].id);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'games');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <motion.div 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md">Featured Mode</div>
          </div>
          <h2 className="text-3xl font-black italic tracking-tighter mb-2">4 PLAYER BATTLE</h2>
          <p className="text-blue-100 text-sm mb-6 max-w-[200px]">Real-time multiplayer arena. Compete against 3 online masters.</p>
          <button 
            onClick={() => { setMaxPlayers(4); createGame('multiplayer'); }}
            className="bg-yellow-400 text-blue-900 px-8 py-3 rounded-2xl text-sm font-black shadow-[0_10px_20px_rgba(234,179,8,0.3)] active:scale-95 transition-all hover:bg-yellow-300"
          >
            PLAY NOW
          </button>
        </div>
        <div className="absolute top-0 right-0 w-[50%] h-full flex items-center justify-center opacity-20 rotate-12">
            <Trophy className="w-48 h-48" />
        </div>
      </motion.div>

      {/* User Search */}
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-500" /> Find Friends
          </h3>
          {searching && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
        </div>
        
        <div className="relative">
          <input 
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 px-5 py-4 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
          />
        </div>

        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-2 overflow-hidden py-2"
            >
              {searchResults.map((user) => (
                <div key={user.uid} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-white" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                    </div>
                    <div>
                      <span className="font-black text-slate-800 text-sm">{user.name}</span>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Level {Math.floor((user.wins || 0) / 5) + 1}</p>
                    </div>
                  </div>
                  <button className="bg-blue-600/10 p-2 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all">
                    <UserPlus className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
          {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
            <div className="text-center py-4 text-slate-400 text-xs font-bold uppercase tracking-widest">No masters found</div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats Quick View */}

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Wins</div>
            <div className="font-bold text-blue-900">{profile?.wins || 0}</div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-100 p-4 rounded-xl flex items-center gap-3">
          <div className="bg-green-600 p-2 rounded-lg text-white">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Games</div>
            <div className="font-bold text-green-900">{profile?.totalGames || 0}</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-4">
        <div className="bg-white border-2 border-gray-100 p-4 rounded-2xl">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
             <Users className="w-4 h-4 text-blue-600" /> Choose Player Count
          </h3>
          <div className="flex gap-2">
            {[2, 4].map((count) => (
              <button 
                key={count}
                onClick={() => setMaxPlayers(count as 2 | 4)}
                className={`flex-1 py-3 rounded-xl font-bold transition-all border-2 ${maxPlayers === count ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-400 border-gray-100'}`}
              >
                {count} Players
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button 
            disabled={loading}
            onClick={() => createGame('multiplayer')}
            className="flex-1 bg-white border-2 border-blue-600 hover:bg-blue-50 text-blue-600 p-4 rounded-2xl flex flex-col items-center gap-2 transition-transform active:scale-95"
          >
            <LayoutGrid className="w-8 h-8" />
            <span className="font-bold">Quick Match</span>
          </button>
          <button 
            disabled={loading}
            onClick={() => createGame('bot')}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-2xl flex flex-col items-center gap-2 transition-transform active:scale-95 shadow-lg shadow-purple-200"
          >
            <Zap className="w-8 h-8" />
            <span className="font-bold">Play vs Bot</span>
          </button>
        </div>

        <div className="flex gap-4">
          <button 
            disabled={loading}
            onClick={() => createGame('friends')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-lg shadow-blue-200"
          >
            <Plus className="w-6 h-6" />
            <span className="font-bold">Create Private Room</span>
          </button>
        </div>

        <div className="bg-white border-2 border-gray-100 p-4 rounded-2xl space-y-3">
          <h3 className="font-bold text-gray-800">Join Private Room</h3>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Enter Room Code"
              value={joiningCode}
              onChange={(e) => setJoiningCode(e.target.value)}
              className="flex-1 bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all uppercase"
            />
            <button 
              onClick={joinGame}
              className="bg-gray-800 text-white px-6 py-3 rounded-xl font-bold transition-transform active:scale-95"
            >
              Join
            </button>
          </div>
        </div>
      </div>

      {/* Referral Card */}
      <div className="bg-white border-2 border-dashed border-blue-200 p-5 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-full text-blue-600">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-gray-800">Refer & Earn</h4>
            <p className="text-xs text-gray-500">Get 10C for every friend you invite</p>
          </div>
        </div>
        <button className="text-blue-600 font-bold text-sm bg-blue-50 px-4 py-2 rounded-lg">Invite</button>
      </div>

      {/* Daily Rewards (Requested) */}
      <div className="space-y-3">
        <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider ml-1">Daily Rewards</h3>
        <div className="grid grid-cols-7 gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => {
            const isTodayInCycle = day === 1; // Simplified logic, day 1 is the claimable one
            const claimedToday = profile?.lastRewardClaimedAt && new Date(profile.lastRewardClaimedAt).toDateString() === new Date().toDateString();
            const isClaimable = isTodayInCycle && !claimedToday;
            
            return (
              <button 
                key={day} 
                disabled={checkingIn || !isClaimable}
                onClick={handleCheckIn}
                className={`flex flex-col items-center p-2 rounded-lg border text-center transition-all ${isClaimable ? 'bg-yellow-100 border-yellow-300 shadow-sm active:scale-95' : claimedToday && isTodayInCycle ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 opacity-50'}`}
              >
                <span className="text-[10px] text-gray-500 font-bold">Day {day}</span>
                {claimedToday && isTodayInCycle ? (
                  <div className="bg-green-500 rounded-full p-1 mt-1 text-white">
                    <Plus className="w-2 h-2" />
                  </div>
                ) : (
                  <Coins className={`w-4 h-4 mt-1 ${isClaimable ? 'text-yellow-600' : 'text-gray-400'}`} />
                )}
                <span className="text-[10px] font-black mt-1">
                  {claimedToday && isTodayInCycle ? 'Claimed' : `${day * 5}C`}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
