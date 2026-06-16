import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFinance } from '../context/FinanceContext';
import { Fund, Goal, Wallet } from '../types';
import { formatCurrency, generateId } from '../lib/utils';
import { 
  Plus, 
  Target, 
  Vault, 
  Calendar, 
  TrendingUp, 
  X, 
  Trash2,
  AlertCircle,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, differenceInDays, addDays } from 'date-fns';
import { cn } from '../lib/utils';
import GoalProgress from './GoalProgress';

const GoalsPage: React.FC = () => {
  const { funds, wallets, goals, addFund, addGoal, deleteFund, deleteGoal, addTransaction } = useFinance();
  const [activeTab, setActiveTab] = useState<'goals' | 'funds'>('goals');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Goal Form State
  const [goalForm, setGoalForm] = useState({
    title: '',
    targetAmount: '',
    deadline: ''
  });

  // Goal Funding Form State
  const [isFundingModalOpen, setIsFundingModalOpen] = useState(false);
  const [selectedGoalForFunding, setSelectedGoalForFunding] = useState<Goal | null>(null);
  const [fundingAmount, setFundingAmount] = useState('');
  const [sourceWalletId, setSourceWalletId] = useState('');
  const [fundingNote, setFundingNote] = useState('');

  // Fund Form State
  const [fundForm, setFundForm] = useState({
    name: '',
    targetAmount: '',
    category: 'Savings',
    color: '#000000'
  });

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addGoal({
      title: goalForm.title,
      targetAmount: parseFloat(goalForm.targetAmount),
      deadline: goalForm.deadline || undefined
    });
    // Reset form
    setGoalForm({
      title: '',
      targetAmount: '',
      deadline: ''
    });
    setIsModalOpen(false);
  };

  const openFundingModal = (goal: Goal) => {
    setSelectedGoalForFunding(goal);
    setFundingAmount('');
    const firstWallet = wallets[0];
    setSourceWalletId(firstWallet ? firstWallet.id : '');
    setFundingNote(`Capital Allocation: ${goal.title}`);
    setIsFundingModalOpen(true);
  };

  const handleFundingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalForFunding || !sourceWalletId) return;

    const amountNum = parseFloat(fundingAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    addTransaction({
      amount: amountNum,
      type: 'transfer',
      category: 'Transfer',
      walletId: sourceWalletId,
      fundId: selectedGoalForFunding.linkedFundId,
      note: fundingNote || `Allocated for: ${selectedGoalForFunding.title}`,
      date: Date.now()
    });

    setIsFundingModalOpen(false);
    setSelectedGoalForFunding(null);
  };

  const handleFundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addFund({
      name: fundForm.name,
      targetAmount: parseFloat(fundForm.targetAmount),
      category: fundForm.category,
      color: fundForm.color
    });
    setIsModalOpen(false);
  };

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isModalOpen]);

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
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl lg:text-5xl font-black tracking-tighter italic text-center lg:text-left">Milestone Analytics</h1>
          <p className="text-[10px] lg:text-xs font-mono uppercase tracking-[0.2em] text-brand-gray-400 text-center lg:text-left">Long-term Asset Projections & Safety Protocols</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="interactive-button flex h-14 items-center justify-center gap-3 rounded-[2rem] bg-black px-8 lg:px-10 text-[10px] lg:text-sm font-bold text-white shadow-2xl shadow-black/20 transition-all font-black uppercase tracking-widest"
        >
          <Plus className="h-5 w-5 lg:h-6 lg:w-6" />
          Initialize Goal
        </button>
      </div>

      {activeTab === 'goals' ? (
        <div className="grid grid-cols-1 gap-6 lg:gap-8 md:grid-cols-2">
          {goals.map((goal, idx) => {
            const remaining = goal.targetAmount - goal.currentAmount;
            const colors = ['indigo', 'emerald', 'rose', 'sky', 'amber', 'fuchsia'];
            const color = colors[idx % colors.length];
            
            return (
              <motion.div 
                layout
                key={goal.id}
                variants={itemVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.2 }}
                whileHover={hoverScale}
                className={cn(
                  "glass-card group relative rounded-[2.5rem] lg:rounded-[3rem] p-6 lg:p-10 transition-all overflow-hidden",
                  `color-glow-${color} group-hover:border-${color}-500`
                )}
              >
                <div className="flex items-start justify-between mb-6 lg:mb-8">
                  <div className="flex h-12 w-12 lg:h-16 lg:w-16 items-center justify-center rounded-[1.25rem] lg:rounded-[1.5rem] bg-black text-white shadow-xl transform transition-transform group-hover:rotate-6">
                    <Target className="h-6 w-6 lg:h-8 lg:w-8" />
                  </div>
                  <button 
                    onClick={() => deleteGoal(goal.id)}
                    className="p-2.5 lg:p-3 text-brand-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                  >
                    <Trash2 className="h-5 w-5 lg:h-6 lg:w-6" />
                  </button>
                </div>

                <div className="space-y-6 lg:space-y-8">
                  <div>
                    <h3 className="text-2xl lg:text-3xl font-black tracking-tighter text-brand-gray-800 leading-tight truncate">{goal.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <Calendar className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-brand-gray-300" />
                      <p className="text-[8px] lg:text-[10px] font-mono text-brand-gray-400 uppercase tracking-widest">
                        {goal.deadline ? `Termination: ${format(new Date(goal.deadline), 'MMM dd, yyyy')}` : 'No Deadline'}
                      </p>
                    </div>
                  </div>

                  <GoalProgress 
                    current={goal.currentAmount} 
                    target={goal.targetAmount} 
                    showValues={true}
                  />

                  <div className="flex items-center gap-4 lg:gap-5 rounded-[1.5rem] lg:rounded-[2rem] bg-brand-gray-50/50 border border-brand-gray-100 p-4 lg:p-6 mt-6 lg:mt-8">
                    <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl lg:rounded-2xl bg-white border border-brand-gray-100 flex items-center justify-center shrink-0">
                      <TrendingUp className="h-5 w-5 lg:h-6 lg:w-6 text-emerald-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[8px] lg:text-[10px] font-black text-brand-gray-400 uppercase tracking-widest mb-0.5 lg:mb-1 truncate">Delta to Completion</p>
                      <p className="text-lg lg:text-xl font-mono font-black tracking-tighter truncate">
                        {formatCurrency(remaining)} 
                        <span className="hidden sm:inline text-[10px] lg:text-xs font-medium text-brand-gray-400 uppercase tracking-widest italic ml-1.5">Needed</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => openFundingModal(goal)}
                    className="w-full interactive-button flex h-14 items-center justify-center gap-3 rounded-[1.5rem] bg-black text-[10px] lg:text-xs font-black uppercase tracking-widest text-white hover:bg-brand-gray-800 transition-all shadow-lg"
                  >
                    <Plus className="h-4 w-4" />
                    Fund Goal
                  </button>
                </div>
              </motion.div>
            );
          })}
          
          <motion.button 
            onClick={() => setIsModalOpen(true)}
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.2 }}
            whileHover={hoverScale}
            className="flex min-h-[320px] lg:min-h-[400px] flex-col items-center justify-center gap-4 lg:gap-6 rounded-[2.5rem] lg:rounded-[3.5rem] border-4 border-dashed border-brand-gray-100 transition-all hover:border-black hover:bg-white group p-6"
          >
            <div className="h-16 w-16 lg:h-20 lg:w-20 rounded-full border-2 border-dashed border-brand-gray-200 flex items-center justify-center transition-all group-hover:scale-110 group-hover:bg-brand-gray-50 group-hover:border-black">
              <Plus className="h-8 w-8 lg:h-10 lg:w-10 text-brand-gray-300 group-hover:text-black" />
            </div>
            <div className="text-center space-y-1">
              <span className="text-base lg:text-lg font-black tracking-tight text-brand-gray-400 group-hover:text-black">New Objective</span>
              <p className="text-[9px] lg:text-[10px] font-mono uppercase tracking-[0.2em] text-brand-gray-300">Authorize New Financial Target</p>
            </div>
          </motion.button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {funds.map((fund) => {
            const progress = (fund.currentAmount / fund.targetAmount) * 100;
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
                  "glass-card group rounded-[2.5rem] lg:rounded-[3rem] p-6 lg:p-8 transition-all overflow-hidden",
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
                  <button onClick={() => deleteFund(fund.id)} className="p-2.5 lg:p-3 text-brand-gray-300 hover:text-rose-500 transition-all">
                    <Trash2 className="h-5 w-5 lg:h-6 lg:w-6" />
                  </button>
                </div>

                <div className="space-y-6 lg:space-y-8">
                  <div>
                    <p className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-300 mb-1">{fund.category}</p>
                    <h3 className="text-xl lg:text-2xl font-black tracking-tighter leading-tight truncate">{fund.name}</h3>
                  </div>

                  <div className="space-y-3 lg:space-y-4">
                    <div className="flex justify-between items-end gap-2">
                      <span className="text-xl lg:text-2xl font-mono font-black tracking-tighter tabular-nums truncate">{formatCurrency(fund.currentAmount)}</span>
                      <span className="text-[8px] lg:text-[10px] font-black uppercase tracking-widest text-brand-gray-400 mb-1 shrink-0">{Math.round(progress)}% Filled</span>
                    </div>
                    <GoalProgress 
                      current={fund.currentAmount} 
                      target={fund.targetAmount} 
                      color={fund.color}
                      showDetails={false}
                    />
                    <div className="flex items-center gap-1.5 text-[8px] lg:text-[10px] font-mono font-bold uppercase tracking-widest text-brand-gray-400 truncate">
                      <span>Vault Target:</span>
                      <span className="text-black">{formatCurrency(fund.targetAmount)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
          
          <motion.button 
            onClick={() => setIsModalOpen(true)}
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.2 }}
            whileHover={hoverScale}
            className="flex min-h-[250px] lg:min-h-[300px] flex-col items-center justify-center gap-4 rounded-[2.5rem] lg:rounded-[3rem] border-2 border-dashed border-brand-gray-100 transition-all hover:border-black hover:bg-white group p-6"
          >
            <div className="p-5 lg:p-6 rounded-full bg-brand-gray-50 group-hover:bg-black group-hover:text-white transition-all">
              <Plus className="h-6 w-6 lg:h-8 lg:w-8 text-brand-gray-300 group-hover:text-white" />
            </div>
            <span className="text-[10px] lg:text-xs font-black uppercase tracking-widest text-brand-gray-400 group-hover:text-black">New Reserve Fund</span>
          </motion.button>
        </div>
      )}

      {/* Modals */}
      {createPortal(
        <AnimatePresence>
          {isModalOpen && (
            <div className="relative z-[100]">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
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
                    <h3 className="text-3xl font-black tracking-tighter italic">Entry Protocol</h3>
                    <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em] mt-2">Initialize New Financial Constraint</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="relative h-12 w-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                {activeTab === 'goals' ? (
                  <form onSubmit={handleGoalSubmit} className="p-10 space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">Objective Label</label>
                      <input 
                        required
                        type="text" 
                        value={goalForm.title}
                        onChange={e => setGoalForm({ ...goalForm, title: e.target.value })}
                        placeholder="e.g. Asset Acquisition: Real Estate"
                        className="w-full h-16 rounded-2xl border border-brand-gray-200 bg-brand-gray-50 px-6 text-sm font-bold focus:border-black focus:bg-white focus:outline-none transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">Target Capital</label>
                        <input 
                          required
                          type="text"
                          inputMode="decimal"
                          value={goalForm.targetAmount}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === '' || /^\d*\.?\d*$/.test(val)) {
                              setGoalForm({ ...goalForm, targetAmount: val });
                            }
                          }}
                          placeholder="0.00"
                          className="w-full h-14 rounded-2xl border border-brand-gray-200 bg-brand-gray-50 px-6 text-sm font-bold focus:border-black focus:bg-white focus:outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">Temporal Deadline</label>
                        <input 
                          type="date" 
                          value={goalForm.deadline}
                          onChange={e => setGoalForm({ ...goalForm, deadline: e.target.value })}
                          className="w-full h-14 rounded-2xl border border-brand-gray-200 bg-brand-gray-50 px-6 text-sm font-bold focus:border-black focus:bg-white focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div className="rounded-2xl border border-dashed border-emerald-500/30 bg-emerald-500/5 p-6 text-center space-y-1.5">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Auto-Provision Protocol</p>
                      <p className="text-xs text-brand-gray-500 font-medium leading-relaxed">
                        A dedicated Reserve Vault named <span className="font-bold text-black font-sans">"{goalForm.title || '[Goal Title]'}"</span> with target <span className="font-mono font-bold text-black">{goalForm.targetAmount ? formatCurrency(parseFloat(goalForm.targetAmount) || 0) : '$0.00'}</span> will be created automatically upon authorization.
                      </p>
                    </div>
                    <button type="submit" className="interactive-button w-full rounded-3xl bg-black py-6 text-lg font-black tracking-tighter italic text-white shadow-2xl shadow-black/20">AUTHORIZE OBJECTIVE</button>
                  </form>
                ) : (
                  <form onSubmit={handleFundSubmit} className="p-10 space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">Registry Name</label>
                      <input 
                        required
                        type="text" 
                        value={fundForm.name}
                        onChange={e => setFundForm({ ...fundForm, name: e.target.value })}
                        placeholder="e.g. Resilience Reserve"
                        className="w-full h-16 rounded-2xl border border-brand-gray-200 bg-brand-gray-50 px-6 text-sm font-bold focus:border-black focus:bg-white focus:outline-none transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">Target Volume</label>
                        <input 
                          required
                          type="text"
                          inputMode="decimal"
                          value={fundForm.targetAmount}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === '' || /^\d*\.?\d*$/.test(val)) {
                              setFundForm({ ...fundForm, targetAmount: val });
                            }
                          }}
                          placeholder="0.00"
                          className="w-full h-14 rounded-2xl border border-brand-gray-200 bg-brand-gray-50 px-6 text-sm font-bold focus:border-black focus:bg-white focus:outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">Classification</label>
                        <select 
                          value={fundForm.category}
                          onChange={e => setFundForm({ ...fundForm, category: e.target.value })}
                          className="w-full h-14 rounded-2xl border border-brand-gray-100 bg-brand-gray-50 px-6 text-sm font-bold appearance-none cursor-pointer focus:border-black focus:bg-white focus:outline-none transition-all"
                        >
                          <option value="Savings">Strategic Reserve</option>
                          <option value="Investment">Growth Protocol</option>
                          <option value="Emergency">Resilience Assets</option>
                          <option value="Travel">Exploration Fund</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">Spectral Identifier</label>
                      <div className="flex flex-wrap gap-3 p-4 bg-brand-gray-50 rounded-2xl border border-brand-gray-100">
                        {['#000000', '#10b981', '#f43f5e', '#0ea5e9', '#f59e0b', '#8b5cf6'].map(col => (
                          <button
                            key={col}
                            type="button"
                            onClick={() => setFundForm({ ...fundForm, color: col })}
                            className={cn(
                              "h-12 w-12 rounded-xl border-4 transition-all hover:scale-110",
                              fundForm.color === col ? "border-white shadow-lg scale-110" : "border-transparent opacity-40 hover:opacity-100"
                            )}
                            style={{ backgroundColor: col }}
                          />
                        ))}
                      </div>
                    </div>
                    <button type="submit" className="interactive-button w-full rounded-3xl bg-black py-6 text-lg font-black tracking-tighter italic text-white shadow-2xl shadow-black/20">COMMIT RESERVE</button>
                  </form>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )}
      {createPortal(
        <AnimatePresence>
          {isFundingModalOpen && selectedGoalForFunding && (
            <div className="relative z-[100]">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setIsFundingModalOpen(false);
                  setSelectedGoalForFunding(null);
                }}
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
                      <h3 className="text-3xl font-black tracking-tighter">Capital Injection</h3>
                      <p className="text-xs font-medium text-white/60 uppercase tracking-widest mt-1">Allocate Funds to Selected Objective</p>
                    </div>
                    <button 
                      onClick={() => {
                        setIsFundingModalOpen(false);
                        setSelectedGoalForFunding(null);
                      }} 
                      className="relative rounded-full p-2 bg-white/10 hover:bg-white/20 transition-all text-white"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <form onSubmit={handleFundingSubmit} className="p-10 space-y-8">
                    <div className="rounded-2xl border border-brand-gray-100 bg-brand-gray-50/50 p-6 space-y-2">
                      <p className="text-[9px] font-black uppercase tracking-widest text-brand-gray-400">Target Objective</p>
                      <h4 className="text-xl font-black tracking-tight text-brand-gray-800 leading-none">{selectedGoalForFunding.title}</h4>
                      <div className="flex justify-between items-center text-xs font-mono font-medium text-brand-gray-500 pt-2 border-t border-brand-gray-100/60">
                        <span>Total Target: {formatCurrency(selectedGoalForFunding.targetAmount)}</span>
                        <span>Deposited: {formatCurrency(selectedGoalForFunding.currentAmount)}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">Amount</label>
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-2xl text-brand-gray-400">$</span>
                        <input 
                          required
                          type="text"
                          inputMode="decimal"
                          value={fundingAmount}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === '' || /^\d*\.?\d*$/.test(val)) {
                              setFundingAmount(val);
                            }
                          }}
                          placeholder="0.00"
                          className="w-full rounded-[2rem] border border-brand-gray-200 bg-brand-gray-50 pl-14 pr-8 py-8 text-4xl font-black tracking-tighter focus:border-black focus:bg-white focus:ring-4 focus:ring-black/5 focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">Source Wallet</label>
                        <div className="relative">
                          <select 
                            required
                            value={sourceWalletId}
                            onChange={e => setSourceWalletId(e.target.value)}
                            className="w-full rounded-2xl border border-brand-gray-200 bg-brand-gray-50 pl-6 pr-12 py-4 text-sm font-bold focus:bg-white focus:border-black focus:outline-none transition-all appearance-none cursor-pointer"
                          >
                            {wallets.map(w => (
                              <option key={w.id} value={w.id}>
                                {w.name} ({formatCurrency(w.balance)})
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-brand-gray-400">
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">Protocol Memo</label>
                        <input 
                          type="text" 
                          value={fundingNote}
                          onChange={e => setFundingNote(e.target.value)}
                          placeholder="Allocated for Goal completion"
                          className="w-full h-14 rounded-2xl border border-brand-gray-200 bg-brand-gray-50 px-6 text-sm font-bold focus:border-black focus:bg-white focus:ring-4 focus:ring-black/5 focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className="interactive-button w-full rounded-[2rem] bg-black py-6 text-lg font-black tracking-tighter text-white shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      EXECUTE FUND ALLOCATION
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

export default GoalsPage;
