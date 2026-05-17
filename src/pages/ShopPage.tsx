import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Coins, 
  Zap, 
  Star, 
  Flame,
  ArrowRight,
  Lock,
  X,
  Sparkles,
  Check,
  Dice5
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, arrayUnion, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { OperationType } from '../types/game';

export function ShopPage() {
  const { profile } = useAuth();
  const [buying, setBuying] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedPack, setSelectedPack] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  
  const [availableFrames, setAvailableFrames] = useState<any[]>([]);
  const [availableDice, setAvailableDice] = useState<any[]>([]);
  const [frameToBuy, setFrameToBuy] = useState<any>(null);

  useEffect(() => {
    const framesQ = query(collection(db, 'frames'), orderBy('createdAt', 'desc'));
    const unsubscribeFrames = onSnapshot(framesQ, (snap) => {
      setAvailableFrames(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'frames');
    });

    const diceQ = query(collection(db, 'dice_skins'), orderBy('createdAt', 'desc'));
    const unsubscribeDice = onSnapshot(diceQ, (snap) => {
      setAvailableDice(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'dice_skins');
    });

    return () => {
      unsubscribeFrames();
      unsubscribeDice();
    };
  }, []);

  const coinPacks = [
    { amount: 100, price: 0.99, tag: 'Starter' },
    { amount: 500, price: 3.99, tag: 'Value', popular: true },
    { amount: 1200, price: 9.99, tag: 'Pro' },
    { amount: 3000, price: 19.99, tag: 'Elite' },
  ];

  const handlePackClick = (pack: any) => {
    setSelectedPack(pack);
    setShowPasswordModal(true);
    setPassword('');
    setPasswordError(false);
  };

  const handlePasswordSubmit = () => {
    if (password === 'EMAD8912') {
      setShowPasswordModal(false);
      if (selectedPack) {
        buyCoins(selectedPack.amount);
      }
    } else {
      setPasswordError(true);
      setTimeout(() => setPasswordError(false), 2000);
    }
  };

  const buyCoins = async (amount: number) => {
    if (!profile?.uid || buying) return;
    setBuying(true);
    try {
      const userRef = doc(db, 'users', profile.uid);
      const transaction = {
        id: Date.now().toString(),
        type: 'deposit',
        amount,
        status: 'completed',
        timestamp: Date.now()
      };
      await updateDoc(userRef, {
        balance: (profile.balance || 0) + amount,
        history: arrayUnion(transaction)
      });
      alert(`Success! ${amount} coins added to your account.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${profile.uid}`);
    } finally {
      setBuying(false);
    }
  };

  const buyFrame = async (frame: any) => {
    if (!profile?.uid || buying) return;
    const price = frame.price || 500;
    if ((profile?.balance || 0) < price) {
      alert(`Insufficient balance! You need ${price} coins.`);
      return;
    }

    if (profile?.ownedFrames?.includes(frame.id)) {
      alert('You already own this frame!');
      return;
    }

    setBuying(true);
    try {
      const userRef = doc(db, 'users', profile.uid);
      const transaction = {
        id: Date.now().toString(),
        type: 'withdraw', // Item purchase
        amount: -price,
        status: 'completed',
        timestamp: Date.now()
      };
      await updateDoc(userRef, {
        balance: (profile.balance || 0) - price,
        ownedFrames: arrayUnion(frame.id),
        history: arrayUnion(transaction)
      });
      alert(`Success! You now own the ${frame.name} frame.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${profile.uid}`);
    } finally {
      setBuying(false);
    }
  };

  const buyDiceSkin = async (skin: any) => {
    if (!profile?.uid || buying) return;
    const price = skin.price || 1000;
    if ((profile?.balance || 0) < price) {
      alert(`Insufficient balance! You need ${price} coins.`);
      return;
    }

    if (profile?.ownedDiceSkins?.includes(skin.id)) {
      alert('You already own this skin!');
      return;
    }

    setBuying(true);
    try {
      const userRef = doc(db, 'users', profile.uid);
      const transaction = {
        id: Date.now().toString(),
        type: 'withdraw',
        amount: -price,
        status: 'completed',
        timestamp: Date.now()
      };
      await updateDoc(userRef, {
        balance: (profile.balance || 0) - price,
        ownedDiceSkins: arrayUnion(skin.id),
        history: arrayUnion(transaction)
      });
      alert(`Success! You now own the ${skin.name} dice skin.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${profile.uid}`);
    } finally {
      setBuying(false);
    }
  };

  const equipDiceSkin = async (skin: any) => {
    if (!profile?.uid || buying) return;
    try {
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        equippedDiceSkin: skin.id
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${profile.uid}`);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="relative h-48 rounded-3xl overflow-hidden bg-blue-900 text-white p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col h-full justify-center">
           <h2 className="text-3xl font-black mb-2 italic">BIG SALE!</h2>
           <p className="text-blue-200 font-bold">VIP Items Available Now</p>
           <button className="mt-4 bg-yellow-400 text-blue-900 w-fit px-6 py-2 rounded-full font-black text-sm shadow-xl active:scale-95 transition-transform uppercase tracking-wider">Limited Time</button>
        </div>
        <ShoppingBag className="absolute -right-8 -bottom-8 w-48 h-48 text-white/10 -rotate-12" />
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-gray-800 uppercase text-xs tracking-widest flex items-center gap-2">
           <Zap className="w-4 h-4 text-orange-500" />
           Top Up Coins
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          {coinPacks.map((pack) => (
            <motion.button 
              key={pack.amount}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePackClick(pack)}
              disabled={buying}
              className={`bg-white border-2 p-4 rounded-3xl relative overflow-hidden transition-all text-left ${pack.popular ? 'border-yellow-400 shadow-lg' : 'border-gray-100'} ${buying ? 'opacity-50' : ''}`}
            >
              {pack.popular && (
                <div className="absolute top-0 right-0 bg-yellow-400 px-3 py-1 text-[8px] font-black uppercase text-blue-900 rounded-bl-xl">Popular</div>
              )}
              <div className="bg-yellow-100 w-10 h-10 rounded-full flex items-center justify-center mb-4 text-yellow-600">
                <Coins className="w-6 h-6" />
              </div>
              <div className="text-2xl font-black text-gray-900">{pack.amount}</div>
              <div className="text-xs text-gray-500 font-bold mb-4">Coins</div>
              <div className="bg-gray-900 text-white py-2 rounded-xl text-center font-black">${pack.price}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Frame Shop Hub */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800 uppercase text-xs tracking-[0.2em] flex items-center gap-2">
             <Sparkles className="w-4 h-4 text-blue-500" />
             Frame Hub
          </h3>
          <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-3 py-1 rounded-full uppercase">VIP Only</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {availableFrames.map((frame) => {
            const isOwned = profile?.ownedFrames?.includes(frame.id);
            return (
              <motion.div 
                key={frame.id}
                whileTap={!isOwned ? { scale: 0.98 } : undefined}
                onClick={() => !isOwned && buyFrame(frame)}
                className={`group relative bg-white rounded-[40px] p-8 shadow-sm border-2 transition-all overflow-hidden flex flex-col items-center cursor-pointer ${isOwned ? 'border-blue-100 shadow-inner' : 'border-slate-50 hover:border-blue-200 hover:shadow-xl hover:-translate-y-1'} ${buying ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {/* Background Decor */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors" />
                
                <div className="relative w-36 h-36 mb-6">
                   <div className="w-full h-full p-2">
                     <div className="w-full h-full bg-slate-50 rounded-full flex items-center justify-center relative overflow-hidden shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] border-4 border-white">
                        <img 
                          src="https://api.dicebear.com/7.x/avataaars/svg?seed=preview" 
                          className="w-20 h-20 opacity-20 grayscale" 
                        />
                        <img 
                          src={frame.asset} 
                          className="absolute inset-0 w-full h-full object-contain scale-125 z-10 drop-shadow-[0_8px_16px_rgba(0,0,0,0.15)] group-hover:scale-135 transition-transform duration-500" 
                        />
                     </div>
                   </div>
                </div>

                <div className="text-center w-full">
                  <h4 className="font-black text-slate-800 text-lg mb-2 tracking-tight">{frame.name}</h4>
                  <div className="flex items-center justify-center gap-2 mb-6">
                     <div className="bg-yellow-400/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-yellow-600 fill-yellow-600" />
                        <span className="text-xs font-black text-yellow-700">{frame.price || 500}</span>
                     </div>
                  </div>
                </div>

                <div className="w-full">
                  {isOwned ? (
                    <div className="w-full bg-blue-50 text-blue-600 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                      <Check className="w-4 h-4 text-blue-600 stroke-[3]" /> Collected
                    </div>
                  ) : (
                    <div className="w-full bg-slate-950 text-white py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] group-hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 group-hover:shadow-blue-200">
                      Unlock Now <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {!isOwned && (
                  <div className="absolute top-6 left-6 bg-blue-600 text-white p-2 rounded-xl shadow-lg -rotate-12 group-hover:rotate-0 transition-all">
                     <Sparkles className="w-4 h-4" />
                  </div>
                )}
                
                {/* Rarity Indicator */}
                <div className="absolute top-6 right-8 text-[9px] font-black text-slate-300 uppercase tracking-widest">Premium</div>
              </motion.div>
            );
          })}
          {availableFrames.length === 0 && (
             <div className="col-span-1 sm:col-span-2 text-center py-16 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-100">
                <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">The Hub is currently empty</p>
             </div>
          )}
        </div>
      </div>

      {/* Dice Skin Hub */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800 uppercase text-xs tracking-[0.2em] flex items-center gap-2">
             <Dice5 className="w-4 h-4 text-purple-500" />
             Dice Skins
          </h3>
          <span className="text-[10px] font-black bg-purple-100 text-purple-600 px-3 py-1 rounded-full uppercase">Exclusive</span>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {availableDice.map((skin) => {
            const isOwned = profile?.ownedDiceSkins?.includes(skin.id);
            const previewFace = skin.faces?.[0] || 'https://img.icons8.com/color/96/dice.png';
            
            return (
              <motion.div 
                key={skin.id}
                whileTap={!isOwned ? { scale: 0.98 } : undefined}
                onClick={() => !isOwned && buyDiceSkin(skin)}
                className={`group relative bg-white rounded-[40px] p-6 shadow-sm border-2 transition-all flex flex-col items-center cursor-pointer ${isOwned ? 'border-purple-100 shadow-inner' : 'border-slate-50 hover:border-purple-200 hover:shadow-xl hover:-translate-y-1'} ${buying ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="w-24 h-24 mb-6 relative flex items-center justify-center">
                   <div className="absolute inset-0 bg-purple-100 rounded-3xl rotate-6 group-hover:rotate-12 transition-transform opacity-30" />
                   <div className="absolute inset-0 bg-purple-600 rounded-3xl -rotate-3 group-hover:-rotate-6 transition-transform opacity-10" />
                   <img src={previewFace} className="w-16 h-16 object-contain z-10 drop-shadow-2xl group-hover:scale-115 transition-transform duration-500" />
                </div>

                <div className="text-center mb-6 w-full">
                   <h4 className="font-black text-slate-800 text-sm mb-1">{skin.name}</h4>
                   <div className="flex items-center justify-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                      <div className="flex items-center gap-1">
                        <Coins className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-[10px] text-slate-400 font-black tracking-wider">{skin.price || 1000}</span>
                      </div>
                   </div>
                </div>

                {isOwned ? (
                  <div className="w-full flex flex-col gap-3">
                    <div className="w-full bg-purple-50 text-purple-600 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-600" /> Collected
                    </div>
                    {profile?.equippedDiceSkin === skin.id ? (
                      <div className="w-full bg-green-500 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center shadow-lg shadow-green-100">
                        Equipped
                      </div>
                    ) : (
                      <button 
                        onClick={(e) => { e.stopPropagation(); equipDiceSkin(skin); }}
                        className="w-full bg-slate-950 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 transition-all shadow-lg shadow-slate-100 hover:shadow-purple-100"
                      >
                        Equip
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="w-full bg-purple-600 text-white py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-purple-700 transition-all shadow-lg shadow-purple-100 flex items-center justify-center gap-2">
                    Unlock <ArrowRight className="w-3 h-3" />
                  </div>
                )}

                {/* Dimension count for dice */}
                {skin.faces && (
                  <div className="absolute bottom-24 right-6 flex -space-x-2">
                    {skin.faces.slice(1, 4).map((f: string, i: number) => (
                      <div key={i} className="w-4 h-4 rounded-full border border-white bg-white shadow-sm overflow-hidden opacity-40">
                         <img src={f} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
          {availableDice.length === 0 && (
             <div className="col-span-2 text-center py-10 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No premium skins added yet</p>
             </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showPasswordModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-6 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-sm rounded-[32px] p-8 relative shadow-2xl"
            >
              <button 
                onClick={() => setShowPasswordModal(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
                  <Lock className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Secure Payment</h3>
                <p className="text-gray-500 text-sm mb-8">Enter the secret password to buy {selectedPack?.amount} coins.</p>
                
                <div className="w-full space-y-4">
                  <input 
                    type="password"
                    placeholder="Secret Key"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full bg-gray-50 border-2 p-5 rounded-2xl text-center font-black text-xl outline-none transition-all ${passwordError ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-100 focus:border-blue-500'}`}
                  />
                  
                  {passwordError && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-xs font-bold uppercase tracking-widest"
                    >
                      Access Denied
                    </motion.p>
                  )}

                  <button 
                    onClick={handlePasswordSubmit}
                    className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black shadow-lg shadow-blue-100 active:scale-95 transition-transform"
                  >
                    Authorize Purchase
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
