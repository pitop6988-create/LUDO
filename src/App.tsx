import React, { useState } from 'react';
import { 
  Home, 
  Gamepad2, 
  User, 
  History, 
  Bell, 
  ShoppingBag, 
  Settings,
  ShieldCheck,
  Wallet
} from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { HomePage } from './pages/HomePage';
import { GamePage } from './pages/GamePage';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { ShopPage } from './pages/ShopPage';
import { HistoryPage } from './pages/HistoryPage';
import { NotificationPage } from './pages/NotificationPage';
import { SettingsPage } from './pages/SettingsPage';
import { WithdrawPage } from './pages/WithdrawPage';
import { motion, AnimatePresence } from 'motion/react';

type Page = 'home' | 'game' | 'profile' | 'admin' | 'shop' | 'history' | 'notifications' | 'settings' | 'withdraw';

export default function App() {
  const { user, profile, loading, signIn } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [activeGameId, setActiveGameId] = useState<string | null>(null);

  // Expose routing for nested components
  (window as any).setCurrentPage = setCurrentPage;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <HomePage onJoinGame={(id) => { setActiveGameId(id); setCurrentPage('game'); }} />;
      case 'game': return <GamePage gameId={activeGameId} onExit={() => setCurrentPage('home')} />;
      case 'profile': return <ProfilePage />;
      case 'admin': return <AdminPage />;
      case 'shop': return <ShopPage />;
      case 'history': return <HistoryPage />;
      case 'notifications': return <NotificationPage />;
      case 'settings': return <SettingsPage />;
      case 'withdraw': return <WithdrawPage onBack={() => setCurrentPage('profile')} />;
      default: return <HomePage onJoinGame={(id) => { setActiveGameId(id); setCurrentPage('game'); }} />;
    }
  };

  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'shop', icon: ShoppingBag, label: 'Shop' },
    { id: 'history', icon: History, label: 'History' },
    { id: 'notifications', icon: Bell, label: 'Alerts' },
    { id: 'profile', icon: User, label: 'Me' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative overflow-hidden flex flex-col">
        {/* Header */}
        {currentPage !== 'game' && (
          <header className="bg-blue-600 text-white p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <img src="https://img.icons8.com/color/48/ludo.png" alt="Logo" className="w-8 h-8" />
              <span className="font-bold text-xl">Ludo Pro</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-blue-700 px-3 py-1 rounded-full flex items-center gap-1">
                <span className="text-yellow-400 font-bold">C</span>
                <span className="font-medium">{profile?.balance || 0}</span>
              </div>
              <button onClick={() => setCurrentPage('settings')}>
                <Settings className="w-6 h-6 text-blue-100" />
              </button>
              {/* Admin Access Hidden - Accessible via code */}
              <button 
                onDoubleClick={() => setCurrentPage('admin')}
                className="opacity-0 w-4 h-4"
              />
            </div>
          </header>
        )}

        {/* Content */}
        <main className={`flex-1 overflow-y-auto ${currentPage === 'game' ? 'p-0 pb-0' : 'p-4 pb-20'}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Nav */}
        {currentPage !== 'game' && (
          <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-200 flex justify-around py-3 px-2 z-50">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id as Page)}
                className={`flex flex-col items-center gap-1 transition-colors ${
                  currentPage === item.id ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-[10px] font-medium">{item.label}</span>
                {currentPage === item.id && (
                  <motion.div layoutId="nav-indicator" className="w-1 h-1 bg-blue-600 rounded-full" />
                )}
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
