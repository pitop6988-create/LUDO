import React from 'react';
import { 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  Trophy,
  Users
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function HistoryPage() {
  const { profile } = useAuth();
  const transactions = [...(profile?.history || [])].sort((a, b) => b.timestamp - a.timestamp);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'win': return <Trophy className="text-yellow-500" />;
      case 'loss': return <ArrowDownLeft className="text-red-500" />;
      case 'deposit': return <CreditCard className="text-green-500" />;
      case 'withdraw': return <ArrowUpRight className="text-blue-500" />;
      case 'referral': return <Users className="text-purple-500" />;
      default: return <Clock className="text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Transaction History</h2>
        <div className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full uppercase">Last 30 Days</div>
      </div>

      <div className="space-y-4">
        {transactions.length === 0 ? (
          <div className="text-center py-20 opacity-50">
             <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
             <p className="text-gray-500">No transactions yet</p>
          </div>
        ) : (
          transactions.map((tx) => (
            <div key={tx.id} className="bg-white border border-gray-100 p-4 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="bg-gray-50 p-3 rounded-xl">
                  {getTypeIcon(tx.type)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 capitalize">{tx.type}</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    {new Date(tx.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className={`text-lg font-black ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {tx.amount > 0 ? '+' : ''}{tx.amount}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
