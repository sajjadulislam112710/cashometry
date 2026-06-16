/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import WalletsPage from './components/WalletsPage';
import ReservePage from './components/ReservePage';
import TransactionsPage from './components/TransactionsPage';
import GoalsPage from './components/GoalsPage';
import PullToRefresh from './components/PullToRefresh';
import { CreditCard, LayoutDashboard, History, Target, Vault } from 'lucide-react';
import { cn } from './lib/utils';

export type Page = 'dashboard' | 'wallets' | 'reserve' | 'transactions' | 'goals' | 'settings';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const mainRef = useRef<HTMLElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(media.matches);
    const listener = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
    };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  useLayoutEffect(() => {
    const mainElement = mainRef.current;
    if (mainElement) {
      // Direct property reset
      mainElement.scrollTop = 0;
      
      // Modern API reset
      mainElement.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      
      // Fallback for document/window
      window.scrollTo(0, 0);
 
      // Multiple frames to ensure we catch the post-render cycle
      const frames = [
        requestAnimationFrame(() => { if (mainRef.current) mainRef.current.scrollTop = 0; }),
        setTimeout(() => { if (mainRef.current) mainRef.current.scrollTop = 0; }, 10),
        setTimeout(() => { if (mainRef.current) mainRef.current.scrollTop = 0; }, 50)
      ];

      return () => {
        frames.forEach(f => {
          if (typeof f === 'number') {
            cancelAnimationFrame(f);
            clearTimeout(f);
          }
        });
      };
    }
  }, [currentPage]);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'wallets':
        return <WalletsPage />;
      case 'reserve':
        return <ReservePage />;
      case 'transactions':
        return <TransactionsPage />;
      case 'goals':
        return <GoalsPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <FinanceProvider>
      <div className="flex flex-col h-screen overflow-hidden bg-brand-gray-50 text-brand-black">
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar (Desktop) */}
          {isDesktop && <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />}

        {/* Mobile Navbar */}
        <div className="fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-[2rem] bg-black/80 px-3 py-3 text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-xl border border-white/10 lg:hidden">
          {[
            { id: 'dashboard', icon: LayoutDashboard },
            { id: 'wallets', icon: CreditCard },
            { id: 'reserve', icon: Vault },
            { id: 'transactions', icon: History },
            { id: 'goals', icon: Target },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id as Page)}
              className={cn(
                "relative flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300",
                currentPage === item.id 
                  ? "bg-white text-black scale-110 shadow-lg" 
                  : "text-white/40 hover:text-white/70"
              )}
            >
              <item.icon className="h-6 w-6" />
            </button>
          ))}
        </div>

        {/* Content Container */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Content */}
          <main ref={mainRef} key={currentPage} className="flex-1 overflow-x-hidden overflow-y-auto px-6 py-8 lg:px-12 lg:py-12">
            <PullToRefresh onRefresh={async () => {
              // Simulate full ledger synchronization and state recalculation delay
              await new Promise(resolve => setTimeout(resolve, 1200));
            }}>
              <div className="mx-auto max-w-7xl pb-32 lg:pb-12">
                {renderPage()}
              </div>
            </PullToRefresh>
          </main>
        </div>
      </div>
    </div>
  </FinanceProvider>
  );
}
