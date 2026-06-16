import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFinance } from '../context/FinanceContext';
import { Fund } from '../types';
import { formatCurrency } from '../lib/utils';
import GoalProgress from './GoalProgress';
import { 
  Plus, 
  Vault,
  Trash2,
  X,
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Target,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const ReservePage: React.FC = () => {
  const { funds, wallets, addFund, deleteFund, transactions, addTransaction } = useFinance();
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferSource, setTransferSource] = useState<{ id: string, name: string, type: 'wallet' | 'fund', color: string, icon: string } | null>(null);
  
  const [transferData, setTransferData] = useState({
    amount: '',
    sourceWalletId: '',
    targetFundId: '',
    isWithdrawMode: false,
    note: ''
  });

  const [reserveFormData, setReserveFormData] = useState({
    name: '',
    targetAmount: '',
    category: 'Savings',
    color: '#8b5cf6'
  });

  const handleAddCapitalClick = (fund: Fund) => {
    const firstWallet = wallets.find(w => w.category !== 'Receivable' && w.category !== 'Liability');
    setTransferSource({
      id: firstWallet?.id || '',
      name: firstWallet?.name || '',
      type: 'wallet',
      color: '#000000',
      icon: 'wallet'
    });
    setTransferData({
      amount: '',
      sourceWalletId: firstWallet?.id || '',
      targetFundId: fund.id,
      isWithdrawMode: false,
      note: `Allocate capital to reserve [${fund.name}]`
    });
    setIsTransferModalOpen(true);
  };

  const handleWithdrawCapitalClick = (fund: Fund) => {
    const firstWallet = wallets.find(w => w.category !== 'Receivable' && w.category !== 'Liability');
    setTransferSource({
      id: fund.id,
      name: fund.name,
      type: 'fund',
      color: fund.color,
      icon: 'vault'
    });
    setTransferData({
      amount: '',
      sourceWalletId: firstWallet?.id || '',
      targetFundId: fund.id,
      isWithdrawMode: true,
      note: `Withdraw capital from reserve [${fund.name}]`
    });
    setIsTransferModalOpen(true);
  };

  const totalReservesAmount = funds.reduce((acc, f) => acc + f.currentAmount, 0);
  const totalTargetAmount = funds.reduce((acc, f) => acc + f.targetAmount, 0);
  const averageTargetProgress = totalTargetAmount > 0 
    ? Math.round((totalReservesAmount / totalTargetAmount) * 100) 
    : 0;

  const handleReserveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addFund({
      name: reserveFormData.name,
      targetAmount: parseFloat(reserveFormData.targetAmount) || 0,
      category: reserveFormData.category,
      color: reserveFormData.color
    });
    setReserveFormData({ name: '', targetAmount: '', category: 'Savings', color: '#8b5cf6' });
    setIsReserveModalOpen(false);
  };

  const getGlowClass = (hex: string) => {
    const map: Record<string, string> = {
      '#000000': 'color-glow-black group-hover:border-black',
      '#10b981': 'color-glow-emerald group-hover:border-emerald-500',
      '#f43f5e': 'color-glow-rose group-hover:border-rose-500',
      '#0ea5e9': 'color-glow-sky group-hover:border-sky-500',
      '#f59e0b': 'color-glow-amber group-hover:border-amber-500',
      '#8b5cf6': 'color-glow-violet group-hover:border-violet-500'
    };
    return map[hex] || 'color-glow-black group-hover:border-black';
  };

  const itemVariants = {
    hidden: { scale: 0.95, opacity: 0, y: 30 },
    visible: {
      scale: 1,
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  const hoverScale = {
    scale: 1.02,
    y: -4,
    transition: { type: 'spring', stiffness: 400, damping: 10 }
  };

  return (
    <div className="space-y-8 lg:space-y-12 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pt-[15px]">
        <div className="space-y-1">
          <h1 className="text-4xl lg:text-5xl font-black tracking-tighter">Reserve Registry</h1>
          <p className="text-[10px] lg:text-xs font-mono uppercase tracking-[0.2em] text-brand-gray-400">Capital Preservation & Savings Infrastructure</p>
        </div>
        <button 
          onClick={() => setIsReserveModalOpen(true)}
          className="interactive-button flex h-14 items-center justify-center gap-3 rounded-[2rem] bg-black px-8 lg:px-10 text-xs lg:text-sm font-black uppercase tracking-widest text-white shadow-2xl shadow-black/20"
        >
          <Plus className="h-5 w-5" />
          Add New Reserve
        </button>
      </div>

      {/* Reserve Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        <motion.div 
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.2 }}
          whileHover={hoverScale}
          className="glass-card p-6 lg:p-10 flex flex-col sm:flex-row items-center justify-between gap-8 lg:gap-10 overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
            <Vault className="h-32 w-32 lg:h-40 lg:w-40 transform rotate-12" />
          </div>
          <div className="space-y-1 relative z-10 text-center sm:text-left">
            <p className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.3em] text-brand-gray-400">Total Reserves Vaulted</p>
            <h2 className="text-4xl xs:text-5xl lg:text-6xl font-black tracking-tighter tabular-nums italic">
              {formatCurrency(totalReservesAmount)}
            </h2>
          </div>
          <div className="flex flex-col items-center sm:items-end gap-2 relative z-10">
            <div className="text-center sm:text-right">
              <p className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-brand-gray-300">Total Milestones</p>
              <p className="text-2xl lg:text-3xl font-black italic">{formatCurrency(totalTargetAmount)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.2 }}
          whileHover={hoverScale}
          className="glass-card p-6 lg:p-10 flex flex-col justify-between overflow-hidden relative"
        >
          <p className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.3em] text-brand-gray-400">Average Vault Progress</p>
          <div className="space-y-4 my-auto pt-4">
            <div className="flex justify-between items-end">
              <span className="text-2xl lg:text-3xl font-black italic">{averageTargetProgress}%</span>
              <span className="text-[9px] font-mono text-brand-gray-400 uppercase tracking-widest">{formatCurrency(totalReservesAmount)} / {formatCurrency(totalTargetAmount)}</span>
            </div>
            {/* Inline Progress Bar */}
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-brand-gray-50 border border-brand-gray-100 p-0.5">
              <div 
                className="h-full rounded-full bg-black transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.max(0, averageTargetProgress))}%` }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Reserves List */}
      {funds.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 lg:gap-8 md:grid-cols-2 xl:grid-cols-3">
          {funds.map((fund) => {
            const progress = fund.targetAmount > 0 ? (fund.currentAmount / fund.targetAmount) * 100 : 0;
            return (
              <motion.div 
                layout
                key={fund.id}
                variants={itemVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.2 }}
                whileHover={hoverScale}
                className={cn(
                  "glass-card group rounded-[2.5rem] lg:rounded-[3rem] p-6 lg:p-8 transition-all overflow-hidden relative border border-transparent",
                  getGlowClass(fund.color)
                )}
              >
                <div className="flex items-center justify-between mb-6 lg:mb-8">
                  <div 
                    className="flex h-12 w-12 lg:h-16 lg:w-16 items-center justify-center rounded-xl lg:rounded-2xl text-white shadow-lg transform transition-transform group-hover:-rotate-6"
                    style={{ backgroundColor: fund.color }}
                  >
                    <Vault className="h-6 w-6 lg:h-8 lg:w-8" />
                  </div>
                  <button 
                    onClick={() => deleteFund(fund.id)} 
                    className="p-2.5 lg:p-3 text-brand-gray-300 hover:text-rose-500 transition-all cursor-pointer"
                  >
                    <Trash2 className="h-5 w-5 lg:h-6 lg:w-6" />
                  </button>
                </div>

                <div className="space-y-6 lg:space-y-8">
                  <div>
                    <p className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400 mb-1">{fund.category} Fund</p>
                    <h3 className="text-xl lg:text-2xl font-black tracking-tighter leading-tight truncate">{fund.name}</h3>
                  </div>

                  <div className="space-y-3 lg:space-y-4">
                    <div className="flex justify-between items-end gap-2">
                      <span className="text-xl lg:text-2xl font-mono font-black tracking-tighter tabular-nums truncate">{formatCurrency(fund.currentAmount)}</span>
                      <span className="text-[8px] lg:text-[10px] font-black uppercase tracking-widest text-brand-gray-400 mb-1 shrink-0">{Math.round(progress)}% Filled</span>
                    </div>
                    {/* Progress Bar Component */}
                    <GoalProgress 
                      current={fund.currentAmount} 
                      target={fund.targetAmount} 
                      color={fund.color}
                      showDetails={false}
                    />
                    <div className="flex items-center gap-1.5 text-[8px] lg:text-[10px] font-mono font-bold uppercase tracking-widest text-brand-gray-400 truncate">
                      <span>Reserve Target:</span>
                      <span className="text-black">{formatCurrency(fund.targetAmount)}</span>
                    </div>
                  </div>

                  {/* Operational Controls to Allocation */}
                  <div className="pt-4 border-t border-brand-gray-50 flex items-center justify-between gap-3">
                    <button
                      onClick={() => handleAddCapitalClick(fund)}
                      className="flex-1 py-3 px-4 rounded-xl bg-black text-white hover:bg-brand-gray-800 transition-colors text-[9px] lg:text-[10px] font-black uppercase tracking-wider text-center cursor-pointer"
                    >
                      Fund Reserve
                    </button>
                    <button
                      onClick={() => handleWithdrawCapitalClick(fund)}
                      className="flex-1 py-3 px-4 rounded-xl border border-brand-gray-200 hover:border-black text-black transition-colors text-[9px] lg:text-[10px] font-black uppercase tracking-wider text-center cursor-pointer"
                    >
                      Withdraw
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 lg:p-20 border-4 border-dashed border-brand-gray-100 rounded-[3rem] text-center max-w-xl mx-auto space-y-6">
          <div className="h-16 w-16 lg:h-20 lg:w-20 rounded-full border-2 border-dashed border-brand-gray-200 flex items-center justify-center">
            <Vault className="h-8 w-8 lg:h-10 lg:w-10 text-brand-gray-300" />
          </div>
          <div className="space-y-2">
            <p className="text-base lg:text-lg font-black tracking-tight text-brand-gray-400">No Reserve Vaults Established</p>
            <p className="text-xs text-brand-gray-400 max-w-md font-sans">
              Establish a reserve registry to segregate long-term savings, emergency funds, or operational buffers from your main liquidity pools.
            </p>
          </div>
          <button 
            onClick={() => setIsReserveModalOpen(true)}
            className="interactive-button py-4 px-8 rounded-full bg-black text-white text-xs font-black uppercase tracking-widest cursor-pointer hover:scale-105 active:scale-95 transition-all"
          >
            Deploy Reserve Vault
          </button>
        </div>
      )}

      {/* Boot New Reserve Modal */}
      {createPortal(
        <AnimatePresence>
          {isReserveModalOpen && (
            <div className="relative z-[100]">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsReserveModalOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-md"
              />
              <div className="fixed inset-0 flex justify-center p-4 pointer-events-none overflow-y-auto z-[101]">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="w-full max-w-xl overflow-hidden rounded-[3rem] bg-white shadow-[0_40px_100px_rgba(0,0,0,0.3)] pointer-events-auto border border-brand-gray-100 my-auto"
                >
                <div className="bg-black px-10 py-10 flex items-center justify-between text-white relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
                  <div className="relative">
                    <h3 className="text-3xl font-black tracking-tighter">New Reserve</h3>
                  </div>
                  <button onClick={() => setIsReserveModalOpen(false)} className="relative rounded-full p-2 bg-white/10 hover:bg-white/20 transition-colors">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <form onSubmit={handleReserveSubmit} className="p-10 space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">Registry Name</label>
                    <input 
                      required
                      type="text" 
                      value={reserveFormData.name}
                      onChange={e => setReserveFormData({ ...reserveFormData, name: e.target.value })}
                      placeholder="e.g. Resilience Reserve"
                      className="w-full rounded-2xl border border-brand-gray-200 bg-brand-gray-50 px-6 py-4 text-base font-bold focus:bg-white focus:border-black focus:ring-4 focus:ring-black/5 focus:outline-none transition-all"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">Target Volume</label>
                      <input 
                        required
                        type="text"
                        inputMode="decimal"
                        value={reserveFormData.targetAmount}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === '' || /^\d*\.?\d*$/.test(val)) {
                            setReserveFormData({ ...reserveFormData, targetAmount: val });
                          }
                        }}
                        placeholder="0.00"
                        className="w-full rounded-2xl border border-brand-gray-200 bg-brand-gray-50 px-6 py-4 text-base font-bold focus:bg-white focus:border-black focus:ring-4 focus:ring-black/5 focus:outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">Classification</label>
                      <select 
                        value={reserveFormData.category}
                        onChange={e => setReserveFormData({ ...reserveFormData, category: e.target.value })}
                        className="w-full rounded-2xl border border-brand-gray-200 bg-brand-gray-50 px-6 py-4 text-base font-bold focus:bg-white focus:border-black focus:outline-none transition-all appearance-none cursor-pointer"
                      >
                        <option value="Savings">Savings Fund</option>
                        <option value="Investment">Growth Fund</option>
                        <option value="Emergency">Emergency Fund</option>
                        <option value="Misc">Other Registry</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">Branding Palette</label>
                    <div className="flex gap-3 flex-wrap">
                      {['#000000', '#10b981', '#f43f5e', '#0ea5e9', '#f59e0b', '#8b5cf6'].map(col => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setReserveFormData({ ...reserveFormData, color: col })}
                          className={cn(
                            "h-10 w-10 rounded-xl border-2 transition-all duration-300 transform",
                            reserveFormData.color === col 
                              ? "border-black scale-125 shadow-lg" 
                              : "border-transparent hover:scale-110"
                          )}
                          style={{ backgroundColor: col }}
                        />
                      ))}
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="interactive-button w-full rounded-[2rem] bg-black py-6 text-lg font-black tracking-tighter text-white shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    AUTHORIZE RESERVE
                  </button>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )}

      {/* Quick Transfer Modal */}
      {createPortal(
        <AnimatePresence>
          {isTransferModalOpen && transferSource && (
            <div className="relative z-[110]">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsTransferModalOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-md"
              />
              <div className="fixed inset-0 flex justify-center p-4 pointer-events-none overflow-y-auto z-[111]">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="w-full max-w-lg overflow-hidden rounded-[3rem] bg-white shadow-2xl pointer-events-auto border border-brand-gray-100 my-auto"
                >
                <div className="bg-black px-8 py-8 flex items-center justify-between text-white relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
                  <div className="relative">
                    <h3 className="text-2xl font-black tracking-tighter">Flux Allocation</h3>
                    <p className="text-[10px] font-medium text-white/60 uppercase tracking-widest mt-1">
                      {transferData.isWithdrawMode ? 'Reserve Withdrawal' : 'Reserve Allocation'}
                    </p>
                  </div>
                  <button onClick={() => setIsTransferModalOpen(false)} className="relative rounded-full p-2 bg-white/10 hover:bg-white/20 transition-colors">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!transferData.sourceWalletId || !transferData.targetFundId) return;
                    
                    if (transferData.isWithdrawMode) {
                      // Withdraw: from Reserve to Wallet
                      addTransaction({
                        amount: parseFloat(transferData.amount) || 0,
                        type: 'transfer',
                        category: 'Transfer',
                        fromFundId: transferData.targetFundId,
                        toWalletId: transferData.sourceWalletId,
                        note: transferData.note || 'Withdrawal from reserve',
                        date: Date.now()
                      });
                    } else {
                      // Allocate: from Wallet to Reserve
                      addTransaction({
                        amount: parseFloat(transferData.amount) || 0,
                        type: 'transfer',
                        category: 'Transfer',
                        walletId: transferData.sourceWalletId,
                        fundId: transferData.targetFundId,
                        note: transferData.note || 'Reserve allocation',
                        date: Date.now()
                      });
                    }
                    setIsTransferModalOpen(false);
                  }} 
                  className="p-8 space-y-6"
                >
                  {/* Allocation Mode Tabs */}
                  <div className="flex p-1.5 bg-brand-gray-50 rounded-xl border border-brand-gray-100 w-full">
                    <button
                      type="button"
                      onClick={() => {
                        setTransferData({ ...transferData, isWithdrawMode: false });
                      }}
                      className={cn(
                        "flex-1 px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                        !transferData.isWithdrawMode ? "bg-black text-white shadow-md" : "text-brand-gray-400 hover:text-black"
                      )}
                    >
                      Fund Reserve
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTransferData({ ...transferData, isWithdrawMode: true });
                      }}
                      className={cn(
                        "flex-1 px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                        transferData.isWithdrawMode ? "bg-black text-white shadow-md" : "text-brand-gray-400 hover:text-black"
                      )}
                    >
                      Withdraw
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">Amount</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-xl">$</span>
                      <input 
                        required
                        type="text"
                        inputMode="decimal"
                        value={transferData.amount}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === '' || /^\d*\.?\d*$/.test(val)) {
                            setTransferData({ ...transferData, amount: val });
                          }
                        }}
                        placeholder="0.00"
                        className="w-full rounded-2xl border border-brand-gray-200 bg-brand-gray-50 pl-12 pr-6 py-5 text-3xl font-black tracking-tighter focus:bg-white focus:border-black focus:ring-4 focus:ring-black/5 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">
                        {transferData.isWithdrawMode ? 'Target Wallet' : 'Source Wallet'}
                      </label>
                      <div className="relative">
                        <select 
                          required
                          value={transferData.sourceWalletId}
                          onChange={e => setTransferData({ ...transferData, sourceWalletId: e.target.value })}
                          className="w-full rounded-2xl border border-brand-gray-200 bg-brand-gray-50 pl-6 pr-12 py-4 text-sm font-bold focus:bg-white focus:border-black focus:outline-none transition-all appearance-none cursor-pointer"
                        >
                          <option value="">Choose Wallet</option>
                          {wallets
                            .filter(w => w.category !== 'Receivable' && w.category !== 'Liability')
                            .map(w => (
                              <option key={w.id} value={w.id}>
                                {w.name} ({formatCurrency(w.balance)})
                              </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-6 text-brand-gray-400">
                          <ChevronDown className="h-5 w-5" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">
                        {transferData.isWithdrawMode ? 'Source Reserve' : 'Target Reserve'}
                      </label>
                      <div className="relative">
                        <select 
                          required
                          value={transferData.targetFundId}
                          onChange={e => setTransferData({ ...transferData, targetFundId: e.target.value })}
                          className="w-full rounded-2xl border border-brand-gray-200 bg-brand-gray-50 pl-6 pr-12 py-4 text-sm font-bold focus:bg-white focus:border-black focus:outline-none transition-all appearance-none cursor-pointer"
                        >
                          <option value="">Choose Reserve</option>
                          {funds.map(f => (
                            <option key={f.id} value={f.id}>
                              {f.name} ({formatCurrency(f.currentAmount)})
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-6 text-brand-gray-400">
                          <ChevronDown className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">Ledger Note</label>
                    <textarea 
                      value={transferData.note}
                      onChange={e => setTransferData({ ...transferData, note: e.target.value })}
                      className="w-full rounded-xl border border-brand-gray-200 bg-brand-gray-50 px-4 py-3 text-xs font-medium focus:bg-white focus:border-black focus:outline-none transition-all min-h-[80px]"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="interactive-button w-full rounded-[1.5rem] bg-black py-5 text-sm font-black tracking-tighter text-white shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    AUTHORIZE {transferData.isWithdrawMode ? 'WITHDRAWAL' : 'ALLOCATION'}
                  </button>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )}
    </div>
  );
};

export default ReservePage;
