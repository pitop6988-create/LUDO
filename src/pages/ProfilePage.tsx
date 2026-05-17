import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  LogOut, 
  Trophy, 
  Gamepad2, 
  Wallet, 
  Frame, 
  Palette,
  CheckCircle2,
  Camera,
  X,
  Dice5
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { doc, updateDoc, onSnapshot, collection, query } from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { OperationType } from '../types/game';

import { compressImage } from '../lib/imageUtils';

export function ProfilePage() {
  const { profile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'stats' | 'frames' | 'themes' | 'dice'>('stats');
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [availableFrames, setAvailableFrames] = useState<any[]>([]);
  const [availableDice, setAvailableDice] = useState<any[]>([]);

  useEffect(() => {
    // Fetch Frames
    const framesQ = query(collection(db, 'frames'));
    const unsubscribeFrames = onSnapshot(framesQ, (snap) => {
      const allFrames = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const owned = allFrames.filter((f: any) => profile?.ownedFrames?.includes(f.id));
      setAvailableFrames(owned);
    });

    // Fetch Dice Skins
    const diceQ = query(collection(db, 'dice_skins'));
    const unsubscribeDice = onSnapshot(diceQ, (snap) => {
      const allDice = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const owned = allDice.filter((d: any) => profile?.ownedDiceSkins?.includes(d.id));
      setAvailableDice(owned);
    });

    return () => {
      unsubscribeFrames();
      unsubscribeDice();
    };
  }, [profile?.ownedFrames, profile?.ownedDiceSkins]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const original = reader.result as string;
          const compressed = await compressImage(original, 400, 400, 0.5);
          setNewAvatar(compressed);
        } catch (err) {
          console.error('Compression failed:', err);
          setNewAvatar(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profile?.uid) return;
    setIsLoading(true);
    try {
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        name: newName || profile.name,
        avatarUrl: newAvatar || profile.avatarUrl || ''
      });
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}`);
    } finally {
      setIsLoading(false);
    }
  };

  const setFrame = async (frameId: string) => {
    if (!profile?.uid) return;
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        currentFrame: frameId
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${profile.uid}`);
    }
  };

  const equipDiceSkin = async (skinId: string) => {
    if (!profile?.uid) return;
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        equippedDiceSkin: skinId
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${profile.uid}`);
    }
  };

  const themes = [
    { id: 'standard', name: 'Standard Board', primary: 'bg-blue-600' },
    { id: 'pastel', name: 'Pastel Board', primary: 'bg-pink-400' },
    { id: 'dark', name: 'Night Mode', primary: 'bg-gray-800' },
  ];

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex flex-col items-center py-6 text-center relative">
        <div className="w-28 h-28 rounded-full p-1 mb-4 relative">
          <div className="w-full h-full rounded-full bg-blue-100 flex items-center justify-center overflow-hidden relative z-10">
             {profile?.avatarUrl ? (
               <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
             ) : (
               <User className="w-12 h-12 text-blue-400" />
             )}
          </div>
          {profile?.currentFrame && (
            <div className="absolute inset-x-0 inset-y-0 z-20 pointer-events-none">
              <img src={availableFrames.find(f => f.id === profile.currentFrame)?.asset} className="w-full h-full object-contain scale-125" />
            </div>
          )}
          <button 
            onClick={() => { setIsEditing(true); setNewName(profile?.name || ''); }}
            className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-lg border-2 border-white z-30"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{profile?.name}</h2>
        <p className="text-gray-500 text-sm">{profile?.email}</p>
        <div className="mt-4 flex gap-2">
          <div className="bg-gray-100 px-4 py-1 rounded-full text-xs font-bold text-gray-600">ID: {profile?.uid.substring(0, 8)}</div>
          <button 
            onClick={logout}
            className="bg-red-50 text-red-600 px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1"
          >
            <LogOut className="w-3 h-3" /> Logout
          </button>
        </div>
        <button 
          onClick={() => (window as any).setCurrentPage('withdraw')}
          className="mt-4 w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
        >
          <Wallet className="w-4 h-4" /> Withdraw Coins
        </button>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-sm rounded-3xl p-6 relative"
            >
              <button 
                onClick={() => setIsEditing(false)}
                className="absolute top-4 right-4 text-gray-400"
              >
                <X className="w-6 h-6" />
              </button>
              
              <h3 className="text-xl font-bold mb-6">Edit Profile</h3>
              
              <div className="space-y-4">
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-gray-100 mb-2 overflow-hidden border-2 border-blue-100">
                    <img src={newAvatar || profile?.avatarUrl} className="w-full h-full object-cover" />
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 text-xs font-bold"
                  >
                    Change Photo
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Your Name</label>
                  <input 
                    type="text" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl mt-1 outline-none focus:border-blue-500 font-bold"
                  />
                </div>

                <button 
                  onClick={handleUpdateProfile}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 mt-4"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl">
        <button 
          onClick={() => setActiveTab('stats')}
          className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'stats' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
        >
          Stats
        </button>
        <button 
          onClick={() => setActiveTab('frames')}
          className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'frames' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
        >
          Frames
        </button>
        <button 
          onClick={() => setActiveTab('themes')}
          className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'themes' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
        >
          Themes
        </button>
        <button 
          onClick={() => setActiveTab('dice')}
          className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'dice' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
        >
          Dice
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-4"
        >
          {activeTab === 'stats' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border-2 border-gray-100 p-5 rounded-2xl text-center">
                <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <div className="text-2xl font-black text-gray-900">{profile?.wins || 0}</div>
                <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Wins</div>
              </div>
              <div className="bg-white border-2 border-gray-100 p-5 rounded-2xl text-center">
                <Gamepad2 className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-black text-gray-900">{profile?.totalGames || 0}</div>
                <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Matches</div>
              </div>
              <div className="bg-white border-2 border-gray-100 p-5 rounded-2xl text-center">
                <Wallet className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-black text-gray-900">{profile?.balance || 0}C</div>
                <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Coins</div>
              </div>
              <div className="bg-white border-2 border-gray-100 p-5 rounded-2xl text-center">
                <Palette className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <div className="text-sm font-black text-gray-900 capitalize">{profile?.currentTheme || 'Classic'}</div>
                <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Theme</div>
              </div>
            </div>
          )}

          {activeTab === 'frames' && (
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setFrame('')}
                className={`bg-white border-2 p-4 rounded-2xl text-left relative transition-all ${!profile?.currentFrame ? 'border-blue-600 bg-blue-50' : 'border-gray-100'}`}
              >
                <div className="w-12 h-12 rounded-full bg-gray-100 mb-3 border-2 border-dashed border-gray-300" />
                <div className="font-bold text-gray-800">Classic</div>
                {!profile?.currentFrame && (
                  <CheckCircle2 className="absolute top-4 right-4 w-5 h-5 text-blue-600" />
                )}
              </button>
              {availableFrames.map((f) => (
                <button 
                  key={f.id}
                  onClick={() => setFrame(f.id)}
                  className={`bg-white border-2 p-4 rounded-2xl text-left relative transition-all ${profile?.currentFrame === f.id ? 'border-blue-600 bg-blue-50' : 'border-gray-100'}`}
                >
                  <div className="w-12 h-12 rounded-full mb-3 relative">
                     <div className="w-full h-full bg-gray-100 rounded-full" />
                     <img src={f.asset} className="absolute inset-0 w-full h-full object-contain scale-125" />
                  </div>
                  <div className="font-bold text-gray-800 text-sm">{f.name}</div>
                  {profile?.currentFrame === f.id && (
                    <CheckCircle2 className="absolute top-4 right-4 w-5 h-5 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'themes' && (
            <div className="space-y-3">
              {themes.map((t) => (
                <button 
                  key={t.id}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${profile?.currentTheme === t.id ? 'border-blue-600 bg-blue-50' : 'border-gray-100 bg-white'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg ${t.primary}`} />
                    <span className="font-bold text-gray-800">{t.name}</span>
                  </div>
                  {profile?.currentTheme === t.id && (
                    <CheckCircle2 className="w-6 h-6 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'dice' && (
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => equipDiceSkin('')}
                className={`bg-white border-2 p-4 rounded-2xl text-left relative transition-all ${!profile?.equippedDiceSkin ? 'border-purple-600 bg-purple-50' : 'border-gray-100'}`}
              >
                <div className="w-12 h-12 bg-gray-100 rounded-xl mb-3 flex items-center justify-center border-2 border-dashed border-gray-300">
                  <Dice5 className="w-6 h-6 text-gray-400" />
                </div>
                <div className="font-bold text-gray-800">Classic</div>
                {!profile?.equippedDiceSkin && (
                  <CheckCircle2 className="absolute top-4 right-4 w-5 h-5 text-purple-600" />
                )}
              </button>
              {availableDice.map((d) => (
                <button 
                  key={d.id}
                  onClick={() => equipDiceSkin(d.id)}
                  className={`bg-white border-2 p-4 rounded-2xl text-left relative transition-all ${profile?.equippedDiceSkin === d.id ? 'border-purple-600 bg-purple-50' : 'border-gray-100'}`}
                >
                  <div className="w-12 h-12 mb-3 relative flex items-center justify-center">
                    <img src={d.faces?.[0] || 'https://img.icons8.com/color/96/dice.png'} className="w-full h-full object-contain" />
                  </div>
                  <div className="font-bold text-gray-800 text-sm truncate w-full">{d.name}</div>
                  {profile?.equippedDiceSkin === d.id && (
                    <CheckCircle2 className="absolute top-4 right-4 w-5 h-5 text-purple-600" />
                  )}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
