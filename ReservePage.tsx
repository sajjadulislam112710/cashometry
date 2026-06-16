import React from 'react';
import { LayoutDashboard, Wallet, History, Target, TrendingUp, Vault } from 'lucide-react';
import { cn } from '../lib/utils';
import { Page } from '../App';
import { motion } from 'motion/react';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'wallets', label: 'Wallets', icon: Wallet },
    { id: 'reserve', label: 'Reserve', icon: Vault },
    { id: 'transactions', label: 'History', icon: History },
    { id: 'goals', label: 'Goals', icon: Target },
  ];

  return (
    <aside className="hidden flex-col bg-white border-r border-black w-72 lg:flex sticky top-0 h-screen">
      <div className="flex items-center justify-center py-6 px-6 border-b border-brand-gray-100">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="w-full flex items-center justify-center select-none"
        >
          <span 
            id="sidebar-logo"
            className="text-3xl font-militant tracking-[0.06em] text-black uppercase font-medium"
          >
            CASHOMETRY
          </span>
        </motion.div>
      </div>

      <nav className="flex-1 space-y-1.5 px-6 py-6">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gray-400 mb-3 flex items-center justify-center gap-3">
          <span className="h-px w-4 bg-black" />
          Operations
          <span className="h-px w-4 bg-black" />
        </p>
        {menuItems.map((item, index) => {
          const isActive = currentPage === item.id;
          return (
            <motion.button
              key={item.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setCurrentPage(item.id as Page)}
              className={cn(
                "group relative flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-sm transition-all duration-300 overflow-hidden",
                isActive 
                  ? "bg-black text-white shadow-2xl shadow-black/20 scale-[1.02] font-black" 
                  : "text-brand-gray-500 hover:bg-brand-gray-50 hover:text-black font-bold"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-glow"
                  className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none"
                />
              )}
              <item.icon className={cn("h-5 w-5 transition-transform duration-500", isActive ? "text-white" : "text-brand-gray-300 group-hover:text-black group-hover:scale-110")} />
              <span className="relative z-10">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="active-indicator"
                  className="absolute left-0 h-4 w-1 rounded-r-full bg-white"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
