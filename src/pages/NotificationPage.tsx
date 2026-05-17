import React from 'react';
import { 
  Bell, 
  MessageCircle, 
  Trophy, 
  Zap,
  Check
} from 'lucide-react';

export function NotificationPage() {
  const notifications = [
    { id: '1', title: 'Welcome Bonus!', msg: 'You received $50 as a sign-up reward.', type: 'reward', read: false },
    { id: '2', title: 'Match Found', msg: 'Your private room is now full. Start playing!', type: 'system', read: true },
    { id: '3', title: 'New Achievement', msg: 'You won 5 games in a row!', type: 'trophy', read: true },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'reward': return <Zap className="text-yellow-500" />;
      case 'trophy': return <Trophy className="text-blue-500" />;
      default: return <MessageCircle className="text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Notifications</h2>
        <button className="text-xs font-bold text-blue-600 hover:underline">Mark all as read</button>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <div key={n.id} className={`p-4 rounded-2xl flex gap-4 transition-all ${n.read ? 'bg-white border border-gray-100' : 'bg-blue-50 border border-blue-100'}`}>
            <div className={`p-3 rounded-xl h-fit ${n.read ? 'bg-gray-50' : 'bg-white'}`}>
              {getIcon(n.type)}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h4 className={`font-bold ${n.read ? 'text-gray-800' : 'text-blue-900'}`}>{n.title}</h4>
                {n.read && <Check className="w-4 h-4 text-green-500" />}
              </div>
              <p className={`text-sm ${n.read ? 'text-gray-500' : 'text-blue-700'}`}>{n.msg}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
