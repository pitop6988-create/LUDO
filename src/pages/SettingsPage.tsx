import React from 'react';
import { 
  Settings, 
  Volume2, 
  Moon, 
  Shield, 
  HelpCircle,
  ChevronRight,
  LogOut,
  Info
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function SettingsPage() {
  const { logout } = useAuth();
  
  const sections = [
    { 
      title: 'Preferences', 
      items: [
        { label: 'Sound Effects', icon: Volume2, toggle: true, value: true },
        { label: 'Dark Mode', icon: Moon, toggle: true, value: false },
        { label: 'Language', icon: HelpCircle, value: 'English' },
      ] 
    },
    { 
      title: 'Admin', 
      items: [
        { label: 'Admin Terminal', icon: Settings, onClick: () => (window as any).setCurrentPage('admin') },
      ] 
    },
    { 
      title: 'Security', 
      items: [
        { label: 'Privacy Policy', icon: Shield },
        { label: 'Terms of Service', icon: Info },
        { label: 'Two-Factor Auth', icon: Shield, toggle: true, value: false },
      ] 
    },
    { 
      title: 'Support', 
      items: [
        { label: 'Help Center', icon: HelpCircle },
        { label: 'Contact Us', icon: MessageCircle },
      ] 
    }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Settings</h2>

      {sections.map((section) => (
        <div key={section.title} className="space-y-2">
          <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-2">
            {section.title}
          </h3>
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            {section.items.map((item, idx) => (
              <div 
                key={item.label}
                onClick={item.onClick}
                className={`p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer ${idx !== section.items.length - 1 ? 'border-b border-gray-50' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-gray-50 p-2 rounded-lg text-gray-600">
                     <item.icon className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-gray-800">{item.label}</span>
                </div>
                
                {item.toggle ? (
                  <div className={`w-10 h-5 rounded-full relative transition-colors ${item.value ? 'bg-blue-600' : 'bg-gray-200'}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${item.value ? 'right-1' : 'left-1'}`} />
                  </div>
                ) : item.value ? (
                  <span className="text-xs font-bold text-blue-600">{item.value}</span>
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <button 
        onClick={logout}
        className="w-full mt-4 bg-red-50 text-red-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-all"
      >
        <LogOut className="w-5 h-5" />
        Log Out Account
      </button>
      
      <div className="text-center py-6">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Ludo Master Pro v1.0.4</p>
        <p className="text-[10px] text-gray-400">&copy; 2024 Pixel Labs Inc.</p>
      </div>
    </div>
  );
}

const MessageCircle = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
);
