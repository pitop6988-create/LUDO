import React, { useState } from 'react';
import { 
  Building2, 
  Smartphone, 
  ArrowRight, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { OperationType } from '../types/game';

export function WithdrawPage({ onBack }: { onBack: () => void }) {
  const { profile } = useAuth();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'bank' | 'upi'>('upi');
  const [success, setSuccess] = useState(false);

  const handleWithdraw = async () => {
    const val = parseInt(amount);
    if (!val || val <= 0 || !profile?.uid) return;
    if (val > (profile?.balance || 0)) {
      alert('Insufficient balance');
      return;
    }
    
    try {
      const userRef = doc(db, 'users', profile.uid);
      const transaction = {
        id: Date.now().toString(),
        type: 'withdraw',
        amount: -val,
        status: 'completed',
        timestamp: Date.now()
      };
      await updateDoc(userRef, {
        balance: (profile.balance || 0) - val,
        history: arrayUnion(transaction)
      });
      setSuccess(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${profile.uid}`);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-white rounded-3xl">
         <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6">
            <ShieldCheck className="w-12 h-12" />
         </div>
         <h2 className="text-2xl font-black text-gray-900 mb-2">Withdrawal Initiated</h2>
         <p className="text-gray-500 mb-8">Your request for {amount}C is being processed. It will take 2-4 working days.</p>
         <button onClick={onBack} className="bg-gray-900 text-white w-full py-4 rounded-2xl font-bold">Done</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-600 p-8 rounded-3xl text-white">
         <span className="text-xs font-bold uppercase text-blue-200">Withdrawable Balance</span>
         <div className="text-4xl font-black mt-2">{profile?.balance || 0}C</div>
      </div>

      <div className="space-y-4">
         <h3 className="font-bold text-gray-800">Select Withdrawal Method</h3>
         <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setMethod('upi')}
              className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${method === 'upi' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-100 bg-white text-gray-400'}`}
            >
               <Smartphone className="w-8 h-8" />
               <span className="font-bold">UPI / Phone</span>
            </button>
            <button 
              onClick={() => setMethod('bank')}
              className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${method === 'bank' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-100 bg-white text-gray-400'}`}
            >
               <Building2 className="w-8 h-8" />
               <span className="font-bold">Bank Transfer</span>
            </button>
         </div>
      </div>

      <div className="bg-white border border-gray-100 p-6 rounded-3xl space-y-4">
         <div>
            <label className="text-xs font-bold text-gray-400 uppercase pl-1">Amount to Withdraw</label>
            <div className="relative mt-2">
               <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">C</span>
               <input 
                 type="number" 
                 value={amount}
                 onChange={(e) => setAmount(e.target.value)}
                 className="w-full bg-gray-50 border border-gray-100 pl-10 pr-4 py-4 rounded-2xl outline-none focus:border-blue-500 font-bold text-xl"
                 placeholder="0.00"
               />
            </div>
         </div>

         <div className="bg-amber-50 rounded-2xl p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-[10px] text-amber-700 font-medium">Minimum withdrawal limit is 100C. Verification might be required for amounts greater than 500C.</p>
         </div>

         <button 
           onClick={handleWithdraw}
           className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-xl disabled:opacity-50"
           disabled={!amount || parseFloat(amount) < 100}
         >
           Withdraw Funds
         </button>
      </div>
    </div>
  );
}
