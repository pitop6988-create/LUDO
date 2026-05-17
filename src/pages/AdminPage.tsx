import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  Settings, 
  List, 
  Layout, 
  Plus, 
  Trash2,
  Users,
  DollarSign,
  Image as ImageIcon
} from 'lucide-react';
import { motion } from 'motion/react';
import { doc, getDoc, setDoc, onSnapshot, collection, query, orderBy, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { OperationType } from '../types/game';

import { compressImage, getBase64Size } from '../lib/imageUtils';

export function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'info' | 'error' } | null>(null);
  
  const [availableFrames, setAvailableFrames] = useState<any[]>([]);
  const [availableDice, setAvailableDice] = useState<any[]>([]);
  
  const [newFrameName, setNewFrameName] = useState('');
  const [newFrameUrl, setNewFrameUrl] = useState('');
  const [newFramePrice, setNewFramePrice] = useState('500');

  const [newDiceName, setNewDiceName] = useState('');
  const [newDiceFaces, setNewDiceFaces] = useState<string[]>(['', '', '', '', '', '']);
  const [newDicePrice, setNewDicePrice] = useState('1000');
  const [activeFaceIndex, setActiveFaceIndex] = useState(0);
  
  const adminFileRef = React.useRef<HTMLInputElement>(null);
  const diceFileRef = React.useRef<HTMLInputElement>(null);

  const handleAdminFileChange = async (e: React.ChangeEvent<HTMLInputElement>, target: 'frame' | 'dice') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const original = reader.result as string;
          const dim = target === 'frame' ? 500 : 200;
          const quality = target === 'frame' ? 0.5 : 0.4;
          const compressed = await compressImage(original, dim, dim, quality);
          const size = getBase64Size(compressed);
          
          const maxAllowedSize = target === 'frame' ? 800000 : 150000; // 150KB * 6 = 900KB
          
          if (size > maxAllowedSize) {
             setStatusMessage({ text: `Image too large (${Math.round(size / 1024)}KB). Please use a smaller file.`, type: 'error' });
             return;
          }

          if (target === 'frame') {
            setNewFrameUrl(compressed);
          } else {
            const updatedFaces = [...newDiceFaces];
            updatedFaces[activeFaceIndex] = compressed;
            setNewDiceFaces(updatedFaces);
          }
          setStatusMessage({ text: `Image compressed to ${Math.round(size / 1024)}KB`, type: 'info' });
        } catch (err) {
          console.error('Compression failed:', err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    
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
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'EMAD8912') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  const addFrame = async () => {
    if (!newFrameName || !newFrameUrl) return;
    const price = parseInt(newFramePrice) || 500;
    const frameId = Date.now().toString();
    const frameData = { 
      id: frameId,
      name: newFrameName, 
      asset: newFrameUrl, 
      price,
      createdAt: Date.now()
    };
    try {
      await setDoc(doc(db, 'frames', frameId), frameData);
      setNewFrameName('');
      setNewFrameUrl('');
      setNewFramePrice('500');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `frames/${frameId}`);
    }
  };

  const addDiceSkin = async () => {
    if (!newDiceName || newDiceFaces.some(f => !f)) return;
    const price = parseInt(newDicePrice) || 1000;
    const skinId = Date.now().toString();
    const skinData = { 
      id: skinId,
      name: newDiceName, 
      faces: newDiceFaces, 
      price,
      createdAt: Date.now()
    };
    try {
      await setDoc(doc(db, 'dice_skins', skinId), skinData);
      setNewDiceName('');
      setNewDiceFaces(['', '', '', '', '', '']);
      setNewDicePrice('1000');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `dice_skins/${skinId}`);
    }
  };

  const removeFrame = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'frames', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `frames/${id}`);
    }
  };

  const removeDiceSkin = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'dice_skins', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `dice_skins/${id}`);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-100 p-4 rounded-full text-red-600 mb-6">
          <Lock className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Admin Panel</h2>
        <p className="text-gray-500 mb-8 max-w-xs">Enter your master password to access advanced game controls.</p>
        
        <form onSubmit={handleLogin} className="w-full space-y-4">
          <input 
            type="password" 
            placeholder="Master Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 px-4 py-4 rounded-2xl outline-none focus:border-red-500 transition-all text-center text-2xl tracking-widest"
          />
          {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
          <button 
            type="submit"
            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all active:scale-95"
          >
            Authorize Access
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             <ShieldCheck className="w-8 h-8 text-green-400" />
             <h2 className="text-xl font-bold">Admin Controls</h2>
          </div>
          <div className="bg-green-500/20 text-green-400 text-[10px] px-2 py-1 rounded-full font-black uppercase tracking-tighter">Verified</div>
        </div>

        {statusMessage && (
          <div className={`mb-4 p-3 rounded-xl text-xs font-bold ${statusMessage.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
            {statusMessage.text}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 p-4 rounded-xl">
            <Users className="text-blue-400 mb-1" />
            <div className="text-2xl font-black">1.2k</div>
            <div className="text-[10px] text-gray-400 font-bold uppercase">Users</div>
          </div>
          <div className="bg-white/5 p-4 rounded-xl">
            <DollarSign className="text-green-400 mb-1" />
            <div className="text-2xl font-black">450k</div>
            <div className="text-[10px] text-gray-400 font-bold uppercase">Total Coins</div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <Layout className="w-5 h-5 text-blue-600" />
          Content Management
        </h3>
        
        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-sm text-gray-600 uppercase">Manage Frames (GIF/IMG)</h4>
          </div>
          
          <div className="mb-6 p-4 bg-gray-50 rounded-2xl space-y-3">
             <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase mb-1">
                <Plus className="w-3 h-3" /> Add New Frame
             </div>
             <input 
               type="text" 
               placeholder="Frame Display Name" 
               value={newFrameName}
               onChange={(e) => setNewFrameName(e.target.value)}
               className="w-full text-sm p-3 bg-white rounded-xl border border-gray-200 outline-none focus:border-blue-500" 
             />
             <input 
               type="text" 
               placeholder="Asset URL (GIF/PNG/JPG)" 
               value={newFrameUrl}
               onChange={(e) => setNewFrameUrl(e.target.value)}
               className="w-full text-sm p-3 bg-white rounded-xl border border-gray-200 outline-none focus:border-blue-500" 
             />
             <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="number" 
                    placeholder="Price (Coins)" 
                    value={newFramePrice}
                    onChange={(e) => setNewFramePrice(e.target.value)}
                    className="w-full text-sm pl-9 p-3 bg-white rounded-xl border border-gray-200 outline-none focus:border-blue-500" 
                  />
                </div>
                 <div className="flex-1 flex items-center gap-2">
                  <input 
                    type="file" 
                    ref={adminFileRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleAdminFileChange(e, 'frame')}
                  />
                  <button 
                    onClick={() => adminFileRef.current?.click()}
                    className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm"
                  >
                    <ImageIcon className="w-4 h-4" /> Pick
                  </button>
                </div>
             </div>
             <button 
               onClick={addFrame}
               className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
             >
               Add Frame to System
             </button>
          </div>

          <ul className="space-y-3">
            {availableFrames.map((f) => (
              <li key={f.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10">
                    <img src={f.asset} className="w-full h-full rounded-2xl object-cover border border-gray-200" />
                    <div className="absolute inset-0 rounded-2xl border-2 border-blue-400 opacity-50" />
                  </div>
                  <span className="text-sm font-bold text-gray-700">{f.name}</span>
                  <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold ml-2">{f.price || 500}C</span>
                </div>
                <button 
                  onClick={() => removeFrame(f.id)}
                  className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
            {availableFrames.length === 0 && (
               <div className="text-center py-6 text-gray-400 text-xs italic">No custom frames added yet</div>
            )}
          </ul>
        </div>

        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-sm text-gray-600 uppercase">Manage Dice Skins</h4>
          </div>
          
          <div className="mb-6 p-4 bg-gray-50 rounded-2xl space-y-3">
             <div className="flex items-center gap-2 text-xs font-black text-purple-600 uppercase mb-1">
                <Plus className="w-4 h-4" /> Add Premium 6-Face Dice Skin
             </div>
             <p className="text-[10px] text-gray-400 font-bold uppercase italic mt-[-10px] mb-2">Upload individual images for each side (1-6)</p>
             
             <input 
               type="text" 
               placeholder="Dice Collection Name (e.g. Diamond Series)" 
               value={newDiceName}
               onChange={(e) => setNewDiceName(e.target.value)}
               className="w-full text-sm p-3 bg-white rounded-xl border border-gray-200 outline-none focus:border-purple-500 shadow-sm" 
             />
             
             <div className="grid grid-cols-3 gap-2 py-2">
                {[1, 2, 3, 4, 5, 6].map((face, idx) => (
                  <button
                    key={face}
                    onClick={() => setActiveFaceIndex(idx)}
                    className={`relative aspect-square rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 overflow-hidden shadow-sm ${activeFaceIndex === idx ? 'border-purple-500 bg-purple-50 ring-4 ring-purple-100' : 'border-gray-200 bg-white hover:border-purple-200'}`}
                  >
                    <span className="absolute top-1 left-2 text-[8px] font-black text-gray-300 uppercase">Side {face}</span>
                    {newDiceFaces[idx] ? (
                      <img src={newDiceFaces[idx]} className="w-10 h-10 object-contain" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center border border-dashed border-gray-200">
                        <Plus className="w-5 h-5 text-gray-200" />
                      </div>
                    )}
                    {newDiceFaces[idx] && (
                       <div className="absolute bottom-0 right-0 p-1 bg-green-500 rounded-tl-lg">
                          <ShieldCheck className="w-2.5 h-2.5 text-white" />
                       </div>
                    )}
                  </button>
                ))}
             </div>

             <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder={`Side ${activeFaceIndex + 1} Image URL`}
                    value={newDiceFaces[activeFaceIndex]}
                    onChange={(e) => {
                      const updated = [...newDiceFaces];
                      updated[activeFaceIndex] = e.target.value;
                      setNewDiceFaces(updated);
                    }}
                    className="w-full text-xs pl-10 p-3 bg-white rounded-xl border border-gray-200 outline-none focus:border-purple-500" 
                  />
                </div>
                <button 
                  onClick={() => diceFileRef.current?.click()}
                  className="bg-purple-100 text-purple-600 px-4 py-3 rounded-xl font-black flex items-center justify-center gap-2 text-xs whitespace-nowrap active:scale-95 transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Upload Side {activeFaceIndex + 1}
                </button>
                <input 
                  type="file" 
                  ref={diceFileRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => handleAdminFileChange(e, 'dice')}
                />
             </div>

             <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="number" 
                  placeholder="Price (Coins)" 
                  value={newDicePrice}
                  onChange={(e) => setNewDicePrice(e.target.value)}
                  className="w-full text-sm pl-9 p-3 bg-white rounded-xl border border-gray-200 outline-none focus:border-blue-500" 
                />
             </div>
             
             <button 
               onClick={addDiceSkin}
               className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
             >
               Add 6-Screen Dice to System
             </button>
          </div>

          <ul className="space-y-3">
            {availableDice.map((d) => (
              <li key={d.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-4">
                    {d.faces?.slice(0, 3).map((f: string, i: number) => (
                      <img key={i} src={f} className="w-8 h-8 rounded-lg object-cover border-2 border-white bg-white shadow-sm" />
                    ))}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-700">{d.name}</span>
                    <span className="text-[10px] text-gray-400 uppercase font-bold">{d.faces?.length || 0} Dimensions</span>
                  </div>
                  <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold ml-2">{d.price || 1000}C</span>
                </div>
                <button 
                  onClick={() => removeDiceSkin(d.id)}
                  className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
            {availableDice.length === 0 && (
               <div className="text-center py-6 text-gray-400 text-xs italic">No custom dice skins added yet</div>
            )}
          </ul>
        </div>

        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-sm text-gray-600 uppercase">System Board Themes</h4>
            <button className="bg-blue-50 text-blue-600 p-2 rounded-lg"><Plus className="w-4 h-4" /></button>
          </div>
          <ul className="space-y-2">
            {['Classic', 'Pastel', 'Neon Night', 'Cyberpunk'].map((t) => (
              <li key={t} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-sm font-medium">{t}</span>
                <Trash2 className="w-4 h-4 text-red-300 hover:text-red-500 cursor-pointer" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
