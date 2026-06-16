import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFinance } from '../context/FinanceContext';
import { Wallet as WalletType, WalletCategory } from '../types';
import { formatCurrency, generateId } from '../lib/utils';
import { 
  Plus, 
  MoreVertical, 
  Wallet, 
  Smartphone, 
  Layout, 
  Building2, 
  CreditCard,
  Vault,
  Pencil,
  Trash2,
  X,
  ArrowUpRight,
  ArrowRight,
  ChevronDown,
  Bitcoin,
  Handshake,
  ArrowDownLeft,
  HandCoins,
  Banknote
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const LendMoneyIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <HandCoins className={className} />
);

const ReturnLendMoneyIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <Banknote className={className} />
);

const WalletsPage: React.FC = () => {
  const { wallets, addWallet, updateWallet, deleteWallet, transactions, funds, addTransaction } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<WalletType | null>(null);
  
  // Quick Transfer State
  const netLiquidAssets = wallets
    .filter(w => w.category !== 'Receivable' && w.category !== 'Liability')
    .reduce((sum, w) => sum + w.balance, 0);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferSource, setTransferSource] = useState<{ id: string, name: string, type: 'wallet' | 'fund', color: string, icon: string } | null>(null);
  const [transferData, setTransferData] = useState({
    amount: '',
    sourceWalletId: '',
    targetFundId: '',
    note: ''
  });

  const [formData, setFormData] = useState({
    name: '',
    balance: '',
    category: 'Physical' as WalletCategory,
    color: '#000000',
    icon: 'Wallet'
  });

  const handleAddClick = () => {
    setEditingWallet(null);
    setFormData({ name: '', balance: '', category: 'Physical', color: '#000000', icon: 'Wallet' });
    setIsModalOpen(true);
  };

  const handleEditClick = (wallet: WalletType) => {
    setEditingWallet(wallet);
    setFormData({
      name: wallet.name,
      balance: wallet.balance.toString(),
      category: wallet.category,
      color: wallet.color,
      icon: wallet.icon
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: formData.name,
      balance: parseFloat(formData.balance) || 0,
      category: formData.category,
      color: formData.color,
      icon: formData.icon
    };

    if (editingWallet) {
      updateWallet(editingWallet.id, data);
    } else {
      addWallet(data);
    }
    setIsModalOpen(false);
  };

  const getIcon = (iconName: string, className?: string) => {
    const cnStr = className || "h-6 w-6";
    switch (iconName) {
      case 'Smartphone': return <Smartphone className={cnStr} />;
      case 'Building2': return <Building2 className={cnStr} />;
      case 'CreditCard': return <CreditCard className={cnStr} />;
      case 'PiggyBank': return <Vault className={cnStr} />;
      case 'Bitcoin': return <Bitcoin className={cnStr} />;
      case 'Handshake': return <Handshake className={cnStr} />;
      case 'ArrowDownLeft': return <ArrowDownLeft className={cnStr} />;
      case 'LendMoney': return <LendMoneyIcon className={cnStr} />;
      case 'ReturnLendMoney': return <ReturnLendMoneyIcon className={cnStr} />;
      default: return <Wallet className={cnStr} />;
    }
  };

  useEffect(() => {
    const mainEl = document.querySelector('main');
    const isLocked = isModalOpen || isTransferModalOpen;
    if (isLocked) {
      document.body.style.overflow = 'hidden';
      if (mainEl) {
        mainEl.style.overflow = 'hidden';
      }
    } else {
      document.body.style.overflow = 'unset';
      if (mainEl) {
        mainEl.style.overflow = 'auto';
      }
    }
    return () => {
      document.body.style.overflow = 'unset';
      if (mainEl) {
        mainEl.style.overflow = 'auto';
      }
    };
  }, [isModalOpen, isTransferModalOpen]);

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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl lg:text-5xl font-black tracking-tighter">Asset Storage</h1>
          <p className="text-[10px] lg:text-xs font-mono uppercase tracking-[0.2em] text-brand-gray-400">Wallet Infrastructure Management</p>
        </div>
      </div>

      {/* Liquidity Overview */}
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
              <Wallet className="h-32 w-32 lg:h-40 lg:w-40 transform rotate-12" />
           </div>
           <div className="space-y-1 relative z-10 text-center sm:text-left">
              <p className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.3em] text-brand-gray-400">Total Assets</p>
              <h2 className="text-4xl xs:text-5xl lg:text-6xl font-black tracking-tighter tabular-nums italic">
                {formatCurrency(netLiquidAssets)}
              </h2>
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-3 lg:pt-4">
                 <span className="h-1.5 w-1.5 lg:h-2 lg:w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
           </div>
           <div className="flex flex-col items-center sm:items-end gap-2 relative z-10">
              <div className="text-center sm:text-right">
                 <p className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-brand-gray-300">Wallet Count</p>
                 <p className="text-2xl lg:text-3xl font-black italic">{wallets.length}</p>
              </div>
           </div>
        </motion.div>
        <div className="grid grid-cols-2 gap-4">
           {['Physical', 'Digital', 'Receivable', 'Liability'].map((cat, idx) => {
              const categoryWallets = wallets.filter(w => {
                if (cat === 'Physical') return w.category === 'Physical';
                if (cat === 'Digital') return w.category === 'Digital' || w.category === 'Bank' || w.category === 'Crypto' || w.category === 'Cards';
                return w.category === cat;
              });
              const totalBalance = categoryWallets.reduce((acc, w) => acc + w.balance, 0);
              const hasTransactions = transactions.length > 0;
              const allocation = hasTransactions 
                ? Math.round(totalBalance / (netLiquidAssets || 1) * 100)
                : 0;

              return (
                <motion.div 
                  key={cat} 
                  variants={itemVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: false, amount: 0.2 }}
                  whileHover={hoverScale}
                  className="glass-card p-5 lg:p-8 flex flex-col justify-between group overflow-hidden relative"
                >
                   <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                   <p className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-brand-gray-400 relative z-10">
                     {cat.toLowerCase()} wallet
                   </p>
                   <div className="relative z-10 mt-3 lg:mt-4">
                      <p className="text-xl lg:text-2xl font-black italic tabular-nums leading-none truncate">{formatCurrency(totalBalance)}</p>
                      <p className="text-[7px] lg:text-[8px] font-mono text-brand-gray-300 uppercase tracking-widest mt-1">Alloc: {allocation}%</p>
                   </div>
                </motion.div>
              );
           })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:gap-8 md:grid-cols-2 xl:grid-cols-3">
          {/* Vaults */}
          {wallets.map((wallet) => (
            <motion.div 
              layout
              key={wallet.id}
              variants={itemVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.2 }}
              whileHover={hoverScale}
              className={cn(
                "glass-card group relative flex flex-col justify-between overflow-hidden rounded-[2.5rem] lg:rounded-[3rem] p-8 lg:p-10",
                getGlowClass(wallet.color)
              )}
            >
            <div className="flex items-start justify-between">
              <div 
                className="flex h-14 w-14 lg:h-16 lg:w-16 items-center justify-center rounded-[1.25rem] lg:rounded-2xl text-white shadow-xl transform transition-transform group-hover:scale-110"
                style={{ backgroundColor: wallet.color }}
              >
                {getIcon(wallet.icon)}
              </div>
              <div className="flex items-center gap-2 transition-all">
                {!wallet.id.startsWith('w_') && (
                  <>
                    <button 
                      onClick={() => handleEditClick(wallet)}
                      className="rounded-xl p-3 text-brand-gray-400 hover:bg-brand-gray-50 hover:text-black border border-transparent hover:border-brand-gray-100 transition-all"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => deleteWallet(wallet.id)}
                      className="rounded-xl p-3 text-brand-gray-400 hover:bg-rose-50 hover:text-rose-500 border border-transparent hover:border-rose-100 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="mt-8 lg:mt-12">
              <h3 className="mt-1 lg:mt-2 text-xl lg:text-2xl font-bold tracking-tight text-brand-gray-600">{wallet.name}</h3>
              <p className="mt-3 lg:mt-4 text-3xl xs:text-4xl lg:text-5xl font-black tracking-tighter text-black truncate">{formatCurrency(wallet.balance)}</p>
            </div>

            {wallet.category !== 'Receivable' && wallet.category !== 'Liability' && (
              <div className="pt-4 mt-6 border-t border-brand-gray-50/50">
                <button
                  onClick={() => {
                    setTransferSource({
                      id: wallet.id,
                      name: wallet.name,
                      type: 'wallet',
                      color: wallet.color,
                      icon: wallet.icon
                    });
                    setTransferData({
                      amount: '',
                      sourceWalletId: wallet.id,
                      targetFundId: funds[0]?.id || '',
                      note: `Allocate capital to reserve from [${wallet.name}]`
                    });
                    setIsTransferModalOpen(true);
                  }}
                  className="interactive-button w-full py-2.5 rounded-xl bg-black text-white hover:bg-brand-gray-800 text-[11px] font-black uppercase tracking-wider text-center cursor-pointer transition-all"
                >
                  Allocate to Reserve
                </button>
              </div>
            )}


          </motion.div>
        ))}

        {/* Placeholder for "Add New Vault" */}
        <motion.button 
          onClick={handleAddClick}
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.2 }}
          whileHover={hoverScale}
          className="group flex min-h-[350px] flex-col items-center justify-center gap-6 rounded-[3rem] border-2 border-dashed border-brand-gray-200 bg-brand-gray-50/50 transition-all hover:border-black hover:bg-white hover:shadow-2xl hover:shadow-black/5"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-white text-brand-gray-400 border border-brand-gray-100 group-hover:bg-black group-hover:text-white transition-all shadow-sm">
            <Plus className="h-8 w-8" />
          </div>
          <div className="space-y-1 text-center">
            <span className="text-sm font-bold text-brand-gray-400 group-hover:text-black">Create New Vault</span>
          </div>
        </motion.button>
      </div>

      {/* Modal */}
      {createPortal(
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] pointer-events-none">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-md pointer-events-auto"
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
                    <h3 className="text-3xl font-black tracking-tighter">{editingWallet ? 'Reconfigure Vault' : 'Initialize Wallet'}</h3>
                    <p className="text-xs font-medium text-white/60 uppercase tracking-widest mt-1">Infrastructure Setup Wizard</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="relative rounded-full p-2 bg-white/10 hover:bg-white/20 transition-colors">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-10 space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">Wallet Designation</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Master Operating Capital"
                      className="w-full rounded-2xl border border-brand-gray-200 bg-brand-gray-50 px-6 py-4 text-base font-bold placeholder:text-brand-gray-300 focus:bg-white focus:border-black focus:ring-4 focus:ring-black/5 focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">Branding Palette</label>
                    <div className="flex gap-3 flex-wrap">
                      {[
                        '#000000', '#10b981', '#f43f5e', '#0ea5e9', '#f59e0b', '#8b5cf6',
                        '#dc2626', '#6366f1', '#14b8a6', '#64748b', '#a16207', '#15803d',
                        '#d946ef', '#f97316', '#1e1b4b', '#84cc16'
                      ].map(col => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setFormData({ ...formData, color: col })}
                          className={cn(
                            "h-10 w-10 rounded-xl border-2 transition-all duration-300 transform",
                            formData.color === col 
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
                    {editingWallet ? 'COMMIT CHANGES' : 'Set Up New Wallet'}
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
            <div className="fixed inset-0 z-[110] pointer-events-none">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsTransferModalOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-md pointer-events-auto"
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
                    <p className="text-[10px] font-medium text-white/60 uppercase tracking-widest mt-1">Vault to Reserve Capital Allocation</p>
                  </div>
                  <button onClick={() => setIsTransferModalOpen(false)} className="relative rounded-full p-2 bg-white/10 hover:bg-white/20 transition-colors">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!transferData.sourceWalletId || !transferData.targetFundId) return;
                    addTransaction({
                      amount: parseFloat(transferData.amount) || 0,
                      type: 'transfer',
                      category: 'Transfer',
                      walletId: transferData.sourceWalletId,
                      fundId: transferData.targetFundId,
                      note: transferData.note || 'Reserve allocation',
                      date: Date.now()
                    });
                    setIsTransferModalOpen(false);
                  }} 
                  className="p-8 space-y-6"
                >
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
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">Source Wallet</label>
                      <div className="relative">
                        <select 
                          required
                          value={transferData.sourceWalletId}
                          onChange={e => setTransferData({ ...transferData, sourceWalletId: e.target.value })}
                          className="w-full rounded-2xl border border-brand-gray-200 bg-brand-gray-50 pl-6 pr-12 py-4 text-sm font-bold focus:bg-white focus:border-black focus:outline-none transition-all appearance-none cursor-pointer"
                        >
                          <option value="">Select Source Wallet</option>
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
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">Target Reserve</label>
                      <div className="relative">
                        <select 
                          required
                          value={transferData.targetFundId}
                          onChange={e => setTransferData({ ...transferData, targetFundId: e.target.value })}
                          className="w-full rounded-2xl border border-brand-gray-200 bg-brand-gray-50 pl-6 pr-12 py-4 text-sm font-bold focus:bg-white focus:border-black focus:outline-none transition-all appearance-none cursor-pointer"
                        >
                          <option value="">Select Target Reserve</option>
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
                    AUTHORIZE TRANSFER
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

export default WalletsPage;
