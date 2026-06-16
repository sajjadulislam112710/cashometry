import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, cn } from '../lib/utils';
import { TransactionType } from '../types';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  TrendingUp, 
  Plus, 
  MoreVertical,
  Target,
  X,
  Settings,
  History,
  Smartphone,
  Building2,
  CreditCard,
  Bitcoin,
  ChevronDown
} from 'lucide-react';
import { 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import GoalProgress from './GoalProgress';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  subMonths, 
  subDays, 
  subYears, 
  startOfDay, 
  endOfDay, 
  eachDayOfInterval, 
  eachMonthOfInterval,
  isSameDay,
  isSameMonth,
  startOfHour,
  addHours,
  differenceInDays,
  differenceInMonths,
  addDays,
  addMonths
} from 'date-fns';

const ResponsiveChartContainer: React.FC<{ children: (width: number, height: number) => React.ReactNode }> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || !entries[0]) return;
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setDimensions({ width, height });
      }
    });
    resizeObserver.observe(containerRef.current);
    
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setDimensions({ width: rect.width, height: rect.height });
    }

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full min-w-0 min-h-0 relative">
      {dimensions && dimensions.width > 0 && dimensions.height > 0 && children(dimensions.width, dimensions.height)}
    </div>
  );
};

type Cycle = '1d' | '7d' | '15d' | '1m' | '6m' | '1y' | '3y' | '5y' | 'custom';

interface DashboardProps {
  onNavigate?: (page: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { 
    wallets, 
    transactions, 
    goals, 
    funds, 
    addTransaction, 
    updateTransaction,
    categories, 
    addCategory,
    resetData, 
    setLedgerFilterType, 
    setLedgerStartDate, 
    setLedgerEndDate 
  } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssetSummaryOpen, setIsAssetSummaryOpen] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<Cycle>('6m');
  const [allocationMode, setAllocationMode] = useState<'income' | 'expense' | 'wallet_evaluation'>('expense');
  const [customRange, setCustomRange] = useState({
    start: format(subMonths(new Date(), 1), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd")
  });

  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [customCategoryColor, setCustomCategoryColor] = useState('#10b981');
  const [customCategoryIcon, setCustomCategoryIcon] = useState('Tag');

  const handleSaveCustomCategory = () => {
    if (!customCategoryName.trim()) {
      alert('Please enter a category name');
      return;
    }
    const targetType = (formData.type === 'income' || formData.type === 'receivable') ? 'income' : 'expense';
    const exists = categories.some(
      c => c.name.toLowerCase() === customCategoryName.trim().toLowerCase() && c.type === targetType
    );
    if (exists) {
      alert('A category tag with this name already exists.');
      return;
    }
    const newCat = {
      name: customCategoryName.trim(),
      type: targetType as 'income' | 'expense',
      icon: customCategoryIcon,
      color: customCategoryColor
    };
    addCategory(newCat);
    setFormData(prev => ({ ...prev, category: newCat.name }));
    setIsAddingCustomCategory(false);
    setCustomCategoryName('');
    setCustomCategoryColor('#10b981');
    setCustomCategoryIcon('Tag');
  };

  const [selectedPayoutTx, setSelectedPayoutTx] = useState<any>(null);
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [paymentWalletId, setPaymentWalletId] = useState<string>('w_physical');

  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense' as TransactionType,
    category: 'Food',
    walletId: wallets[0]?.id || '',
    toWalletId: '',
    fundId: '',
    note: '',
    purpose: '',
    receivableSubtype: 'income' as 'income' | 'lended_money' | 'others',
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm")
  });

  const handleOpenAddModal = (type: 'receivable' | 'liability') => {
    const found = wallets.find(w => w.category === (type === 'receivable' ? 'Receivable' : 'Liability'));
    setFormData({
      amount: '',
      type: type,
      category: type === 'receivable' ? 'Salary' : 'Food',
      walletId: found?.id || '',
      toWalletId: '',
      fundId: '',
      note: '',
      purpose: '',
      receivableSubtype: 'income',
      date: format(new Date(), "yyyy-MM-dd'T'HH:mm")
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.walletId) return;

    const isSourceFund = !formData.walletId.startsWith('w_');
    const isTransfer = formData.type === 'transfer';

    addTransaction({
      amount: parseFloat(formData.amount),
      type: formData.type,
      category: formData.type === 'transfer' ? 'Transfer' : formData.category,
      walletId: isSourceFund ? undefined : formData.walletId,
      fromFundId: (isTransfer && isSourceFund) ? formData.walletId : undefined,
      toWalletId: formData.type === 'transfer' 
        ? formData.toWalletId 
        : (formData.type === 'receivable' || formData.type === 'liability')
          ? formData.toWalletId
          : undefined,
      fundId: (!isTransfer && isSourceFund) 
        ? formData.walletId 
        : undefined,
      note: formData.note,
      purpose: (formData.type === 'receivable' || formData.type === 'liability') ? formData.purpose : undefined,
      receivableSubtype: formData.type === 'receivable' ? formData.receivableSubtype : undefined,
      date: new Date(formData.date).getTime(),
      payouts: (formData.type === 'receivable' || formData.type === 'liability') ? [] : undefined
    });

    setIsModalOpen(false);
    setIsAddingCustomCategory(false);
    setCustomCategoryName('');
    // Reset form
    setFormData({
      amount: '',
      type: 'expense' as TransactionType,
      category: 'Food',
      walletId: wallets[0]?.id || '',
      toWalletId: '',
      fundId: '',
      note: '',
      purpose: '',
      receivableSubtype: 'income',
      date: format(new Date(), "yyyy-MM-dd'T'HH:mm")
    });
  };

  const handlePayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayoutTx) return;

    const amountToApply = parseFloat(payoutAmount);
    if (isNaN(amountToApply) || amountToApply <= 0) return;

    const currentPaid = selectedPayoutTx.paidAmount || 0;
    const remaining = selectedPayoutTx.amount - currentPaid;

    if (amountToApply > remaining) {
      return;
    }

    const finalPaid = currentPaid + amountToApply;
    const currentPayouts = selectedPayoutTx.payouts || [];
    const updatedPayouts = [
      ...currentPayouts,
      { amount: amountToApply, date: Date.now(), walletId: paymentWalletId }
    ];

    updateTransaction(selectedPayoutTx.id, {
      paidAmount: finalPaid,
      payouts: updatedPayouts
    });

    setSelectedPayoutTx(null);
    setPayoutAmount('');
  };

  useEffect(() => {
    const isLocked = isModalOpen || isAssetSummaryOpen;
    const mainEl = document.querySelector('main');
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
  }, [isModalOpen, isAssetSummaryOpen]);

  const totalBalance = wallets
    .filter(w => w.category !== 'Receivable' && w.category !== 'Liability')
    .reduce((sum, w) => sum + w.balance, 0);

  const receivableBalance = wallets
    .filter(w => w.category === 'Receivable')
    .reduce((acc, w) => acc + w.balance, 0);

  const liabilityBalance = wallets
    .filter(w => w.category === 'Liability')
    .reduce((acc, w) => acc + w.balance, 0);
  
  const now = new Date();
  const currentMonthStart = startOfMonth(now).getTime();
  const currentMonthEnd = endOfMonth(now).getTime();
  
  const prevMonthStart = startOfMonth(subMonths(now, 1)).getTime();
  const prevMonthEnd = endOfMonth(subMonths(now, 1)).getTime();

  const getMonthlyTotal = (type: TransactionType, start: number, end: number) => 
    transactions
      .filter(t => {
        const matchesDate = t.date >= start && t.date <= end;
        if (!matchesDate) return false;
        if (type === 'income') {
          return t.type === 'income' || (t.type === 'receivable' && t.receivableSubtype === 'income');
        }
        return t.type === type;
      })
      .reduce((acc, curr) => acc + curr.amount, 0);

  const monthlyIncome = getMonthlyTotal('income', currentMonthStart, currentMonthEnd);
  const monthlyExpense = getMonthlyTotal('expense', currentMonthStart, currentMonthEnd);
  
  const prevMonthlyIncome = getMonthlyTotal('income', prevMonthStart, prevMonthEnd);
  const prevMonthlyExpense = getMonthlyTotal('expense', prevMonthStart, prevMonthEnd);

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const diff = ((current - previous) / previous) * 100;
    return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`;
  };

  const incomeTrend = calculateTrend(monthlyIncome, prevMonthlyIncome);
  const expenseTrend = calculateTrend(monthlyExpense, prevMonthlyExpense);

  const healthIndex = Math.min(Math.max(
    monthlyIncome === 0 ? (monthlyExpense === 0 ? 100 : 0) : Math.round((1 - (monthlyExpense / monthlyIncome)) * 100),
    0
  ), 100);



  // Improved Data Aggregator
  const getAggregatedTotal = (type: TransactionType, start: number, end: number) => 
    transactions
      .filter(t => {
        const matchesDate = t.date >= start && t.date <= end;
        if (!matchesDate) return false;
        if (type === 'income') {
          return t.type === 'income' || (t.type === 'receivable' && t.receivableSubtype === 'income');
        }
        return t.type === type;
      })
      .reduce((acc, curr) => acc + curr.amount, 0);

  // Chart Data Preparation based on Cycle
  const generateChartData = () => {
    const data: { name: string, income: number, expense: number }[] = [];
    const now = new Date();

    const getRange = () => {
      switch (selectedCycle) {
        case '1d': {
          let startLimit = subDays(now, 1);
          let endLimit = now;
          if (transactions.length > 0) {
            const hasDataInLast24h = transactions.some(t => {
              const matchesDate = t.date >= startLimit.getTime() && t.date <= endLimit.getTime();
              if (!matchesDate) return false;
              return t.type === 'income' || t.type === 'expense' || (t.type === 'receivable' && t.receivableSubtype === 'income');
            });
            if (!hasDataInLast24h) {
              const lastTxTime = Math.max(...transactions.map(t => t.date));
              endLimit = new Date(lastTxTime);
              startLimit = subDays(endLimit, 1);
            }
          }
          return { start: startLimit, end: endLimit, unit: 'hour' as const, steps: 24 };
        }
        case '7d': return { start: subDays(now, 6), end: now, unit: 'day' as const, steps: 7 };
        case '15d': return { start: subDays(now, 14), end: now, unit: 'day' as const, steps: 15 };
        case '1m': return { start: subDays(now, 29), end: now, unit: 'day' as const, steps: 30 };
        case '6m': return { start: subMonths(now, 5), end: now, unit: 'month' as const, steps: 6 };
        case '1y': return { start: subYears(now, 1), end: now, unit: 'month' as const, steps: 12 };
        case '3y': return { start: subYears(now, 3), end: now, unit: 'month' as const, steps: 12, interval: 3 }; // every 3 months
        case '5y': return { start: subYears(now, 5), end: now, unit: 'month' as const, steps: 12, interval: 5 }; // every 5 months
        case 'custom': {
          const start = new Date(customRange.start);
          const end = new Date(customRange.end);
          const days = differenceInDays(end, start);
          if (days <= 2) return { start, end, unit: 'hour' as const, steps: Math.max(24, Math.round(days * 24)) };
          if (days <= 60) return { start, end, unit: 'day' as const, steps: days + 1 };
          return { start, end, unit: 'month' as const, steps: Math.max(6, differenceInMonths(end, start) + 1) };
        }
        default: return { start: subMonths(now, 5), end: now, unit: 'month' as const, steps: 6 };
      }
    };

    const range = getRange();
    const interval = 'interval' in range ? range.interval || 1 : 1;

    for (let i = 0; i < range.steps; i++) {
        let stepStart: Date;
        let stepEnd: Date;
        let label: string;

        if (range.unit === 'hour') {
            const endHour = startOfHour(range.end);
            stepStart = addHours(endHour, - (range.steps - 1 - i) * interval);
            stepEnd = addHours(stepStart, interval);
            label = format(stepStart, 'HH:mm');
        } else if (range.unit === 'day') {
            stepStart = startOfDay(addDays(range.start, i * interval));
            stepEnd = endOfDay(stepStart);
            label = format(stepStart, 'MMM dd');
        } else {
            stepStart = startOfMonth(addMonths(range.start, i * interval));
            stepEnd = endOfMonth(stepStart);
            label = format(stepStart, i === 0 || stepStart.getMonth() === 0 ? 'MMM yyyy' : 'MMM');
        }

        data.push({
            name: label,
            income: getAggregatedTotal('income', stepStart.getTime(), stepEnd.getTime()),
            expense: getAggregatedTotal('expense', stepStart.getTime(), stepEnd.getTime())
        });
    }
    return data;
  };

  const chartData = generateChartData();

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#0ea5e9', '#d946ef'];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
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
    <div className="space-y-16 pb-24">
      {/* Header / Hero */}
      <motion.div 
        variants={itemVariants} 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.2 }}
        className="flex flex-col items-center justify-center gap-4 lg:gap-10 pt-[15px] pb-12 lg:py-20 text-center relative overflow-hidden"
      >
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,#E5E7EB_0%,transparent_70%)] opacity-30" />
        <div className="relative w-fit mx-auto flex flex-col items-center justify-center">
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            style={{ originX: 0.5 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="absolute -top-2 lg:-top-4 left-0 right-0 h-0.5 lg:h-1 bg-black"
          />
          <h1 className="text-4xl xs:text-5xl sm:text-7xl lg:text-[6rem] font-militant tracking-[0.06em] text-black uppercase font-bold leading-none text-center mx-auto select-none">
            CASHOMETRY
          </h1>
        </div>
        <div className="flex items-center gap-4 lg:gap-6">
          <motion.button 
            whileHover={hoverScale}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsModalOpen(true)}
            className="interactive-button flex h-14 lg:h-16 items-center justify-center gap-3 rounded-[2.5rem] bg-black px-8 lg:px-12 text-xs lg:text-sm font-black uppercase tracking-widest text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all"
          >
            <Plus className="h-5 w-5 lg:h-6 lg:w-6" />
            Append Record
          </motion.button>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Audit Assets', icon: Wallet, color: 'indigo', action: () => onNavigate?.('wallets') },
          { label: 'Track Goals', icon: Target, color: 'amber', action: () => onNavigate?.('goals') }
        ].map((action, idx) => (
          <motion.button 
            key={idx} 
            onClick={action.action}
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.3 }}
            whileHover={hoverScale}
            whileTap={{ scale: 0.98 }}
            className={cn(
            "flex items-center justify-center p-6 rounded-3xl bg-white border border-brand-gray-100 hover:border-black transition-all group overflow-hidden relative",
            `color-glow-${action.color}`
          )}>
            <div className="absolute inset-0 bg-gradient-to-br from-black/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex flex-col items-center gap-3 relative z-10">
              <action.icon className="h-5 w-5 text-brand-gray-300 group-hover:text-black transition-colors" />
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-gray-400 group-hover:text-black">{action.label}</span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:gap-8 lg:grid-cols-3">
        <motion.div variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.2 }} whileHover={hoverScale}>
          <StatCard title="Total Assets" value={formatCurrency(totalBalance)} icon={<Wallet className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7" />} subtitle="Combined Balance" color="black" centered onClick={() => setIsAssetSummaryOpen(true)} />
        </motion.div>

        <motion.div variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.2 }} whileHover={hoverScale}>
          <StatCard 
            title="Income Flux" 
            value={formatCurrency(monthlyIncome)} 
            icon={<ArrowUpRight className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-emerald-500" />} 
            subtitle={`Inbound (${format(currentMonthStart, 'MMM d')} - ${format(currentMonthEnd, 'MMM d')})`} 
            color="emerald" 
            centered 
            onClick={() => {
              setLedgerFilterType('income');
              setLedgerStartDate(currentMonthStart);
              setLedgerEndDate(currentMonthEnd);
              onNavigate?.('transactions');
            }}
          />
        </motion.div>

        <motion.div variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.2 }} whileHover={hoverScale}>
          <StatCard 
            title="Outflow Flux" 
            value={formatCurrency(monthlyExpense)} 
            icon={<ArrowDownRight className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-rose-500" />} 
            subtitle={`Outbound (${format(currentMonthStart, 'MMM d')} - ${format(currentMonthEnd, 'MMM d')})`} 
            color="rose" 
            centered 
            onClick={() => {
              setLedgerFilterType('expense');
              setLedgerStartDate(currentMonthStart);
              setLedgerEndDate(currentMonthEnd);
              onNavigate?.('transactions');
            }}
          />
        </motion.div>

        <motion.div variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.2 }} whileHover={hoverScale}>
          <StatCard 
            title="Efficiency" 
            value={formatCurrency(monthlyIncome - monthlyExpense)} 
            icon={<TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-sky-500" />} 
            subtitle={`Net Yield (${format(currentMonthStart, 'MMM d')} - ${format(currentMonthEnd, 'MMM d')})`} 
            color="sky" 
            centered 
            onClick={() => {
              const el = document.getElementById('flow-analytics');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }}
          />
        </motion.div>

        <motion.div variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.2 }} whileHover={hoverScale}>
          <StatCard 
            title="Receivable" 
            value={formatCurrency(receivableBalance)} 
            icon={<ArrowUpRight className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-indigo-500" />} 
            subtitle="Money that you're expecting to recieve from others" 
            color="indigo" 
            centered 
            onClick={() => {
              const el = document.getElementById('receivables-box');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }}
          />
        </motion.div>

        <motion.div variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.2 }} whileHover={hoverScale}>
          <StatCard 
            title="Liability" 
            value={formatCurrency(liabilityBalance)} 
            icon={<ArrowDownRight className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-amber-500" />} 
            subtitle="Money that you're expected to return" 
            color="amber" 
            centered 
            onClick={() => {
              const el = document.getElementById('liabilities-box');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }}
          />
        </motion.div>
      </div>

      {/* Health Assessment */}
      <motion.div 
        variants={itemVariants} 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.2 }}
        whileHover={hoverScale}
        className="glass-card p-6 lg:p-10 flex flex-col md:flex-row items-center gap-8 lg:gap-10 overflow-hidden relative group"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <TrendingUp className="h-32 w-32 lg:h-40 lg:w-40 transform rotate-12" />
        </div>
        <div className="relative h-32 w-32 lg:h-40 lg:w-40 flex-shrink-0">
          <svg className="h-full w-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="10"
              fill="transparent"
              className="text-brand-gray-100"
              style={{ cx: '50%', cy: '50%', r: '40%' }}
            />
            <motion.circle
              initial={{ strokeDashoffset: 280 }}
              animate={{ strokeDashoffset: 280 - (280 * (healthIndex / 100)) }}
              transition={{ duration: 2.5, ease: "easeOut" }}
              cx="50%"
              cy="50%"
              r="40%"
              stroke="currentColor"
              strokeWidth="10"
              fill="transparent"
              strokeDasharray="280"
              className="text-black"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl lg:text-4xl font-black italic">{healthIndex}</span>
            <span className="text-[7px] lg:text-[8px] font-black uppercase tracking-widest text-brand-gray-400">Health Index</span>
          </div>
        </div>
        <div className="flex-1 space-y-3 lg:space-y-4 text-center md:text-left">
          <div className="space-y-1">
            <h2 className="text-2xl lg:text-3xl font-black tracking-tighter italic">Asset Integrity Assessment</h2>
          </div>
          <p className="text-xs lg:text-sm text-brand-gray-500 leading-relaxed max-w-2xl">
            {healthIndex > 70 
              ? "System analysis indicates a high capital efficiency ratio. Allocation vectors are aligned with projected milestones. Outflow flux is within nominal parameters."
              : healthIndex > 40
              ? "Operational stability maintained. Minor divergence detected in allocation vectors. Liquidity remains sufficient for immediate cycles."
              : "Low efficiency threshold detected. High outflow relative to realized income. Strategic realignment of expenditure vectors recommended."}
          </p>
          <div className="flex justify-center md:justify-start gap-3 lg:gap-4 pt-2">
             <span className={cn(
               "px-3 py-1.5 lg:px-4 lg:py-2 rounded-xl font-mono text-[9px] lg:text-[10px] font-black uppercase tracking-widest border",
               healthIndex > 40 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
             )}>
               {healthIndex > 40 ? 'Nominal Risk' : 'High Risk'}
             </span>
             <span className="px-3 py-1.5 lg:px-4 lg:py-2 rounded-xl bg-sky-50 text-sky-600 font-mono text-[9px] lg:text-[10px] font-black uppercase tracking-widest border border-sky-100">
               {healthIndex > 70 ? 'High Efficiency' : 'Adaptive State'}
             </span>
          </div>
        </div>
      </motion.div>

      {/* Receivables & Liabilities Trackers Grid */}
      <div className="grid grid-cols-1 gap-6 lg:gap-8 lg:grid-cols-2">
        {/* Receivables Box */}
        <motion.div 
          id="receivables-box"
          variants={itemVariants} 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.1 }}
          whileHover={hoverScale}
          className="glass-card rounded-[2.5rem] lg:rounded-[3rem] p-6 lg:p-10 h-[480px] lg:h-[520px] flex flex-col scroll-mt-6 lg:scroll-mt-8"
        >
          <div className="mb-6 lg:mb-8 flex items-center justify-between flex-shrink-0">
            <div className="space-y-1">
              <h2 className="text-3xl lg:text-4xl font-black tracking-tighter italic">Receivables</h2>
              <p className="text-[10px] text-indigo-500 font-mono uppercase tracking-[0.2em]">Uncollected Inbound Capital</p>
            </div>
            <button 
              type="button"
              title="Add New Receivable"
              onClick={() => handleOpenAddModal('receivable')}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white hover:bg-zinc-800 transition-all shadow-md hover:scale-105 cursor-pointer"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4 overflow-y-auto pr-1 flex-1 scrollbar-hide">
            {(() => {
              const list = transactions.filter(t => t.type === 'receivable' && (t.amount - (t.paidAmount || 0)) > 0);
              if (list.length > 0) {
                return list.map(tx => {
                  const total = tx.amount;
                  const collected = tx.paidAmount || 0;
                  const remaining = total - collected;
                  const percentSecured = Math.min(Math.round((collected / total) * 100), 100);

                  return (
                    <div 
                      key={tx.id}
                      onClick={() => {
                        if (remaining > 0) {
                          setSelectedPayoutTx(tx);
                          setPayoutAmount('');
                          const firstOperational = wallets.find(w => w.category !== 'Receivable' && w.category !== 'Liability');
                          setPaymentWalletId(firstOperational?.id || 'w_physical');
                        }
                      }}
                      className={cn(
                        "group p-5 rounded-2xl bg-brand-gray-50 border border-brand-gray-100 hover:border-black hover:bg-white hover:shadow-xl transition-all font-sans cursor-pointer flex flex-col gap-3",
                        remaining === 0 && "opacity-60 cursor-default hover:border-brand-gray-100 hover:bg-brand-gray-50 hover:shadow-none"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <h4 className="text-base font-black tracking-tight text-brand-black">{tx.purpose || 'Inbound Claim'}</h4>
                          <p className="text-[9px] font-mono text-brand-gray-400 uppercase tracking-widest mt-1">
                            Created on {format(tx.date, 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={cn(
                            "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                            remaining === 0 
                              ? "bg-slate-100 text-slate-500 border-slate-200" 
                              : "bg-indigo-50 text-indigo-600 border-indigo-100 animate-pulse"
                          )}>
                            {remaining === 0 ? 'Fulfilled' : `${percentSecured}% Collected`}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-1 text-center font-sans">
                        <div className="text-left">
                          <span className="text-[8px] font-mono font-black uppercase tracking-wider text-brand-gray-400 block">Total Claimed</span>
                          <span className="text-xs font-mono font-medium text-brand-black">{formatCurrency(total)}</span>
                        </div>
                        <div className="text-center">
                          <span className="text-[8px] font-mono font-black uppercase tracking-wider text-brand-gray-400 block">Collected</span>
                          <span className="text-xs font-mono font-medium text-emerald-600">+{formatCurrency(collected)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] font-mono font-black uppercase tracking-wider text-brand-gray-400 block">Outstanding</span>
                          <span className={cn("text-xs font-mono font-black", remaining > 0 ? "text-indigo-600" : "text-brand-gray-300")}>
                            {remaining > 0 ? formatCurrency(remaining) : 'Settled'}
                          </span>
                        </div>
                      </div>

                      {/* Progress visualizer bar */}
                      <div className="w-full bg-brand-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-full transition-all duration-500" 
                          style={{ width: `${percentSecured}%` }}
                        />
                      </div>
                    </div>
                  );
                });
              } else {
                return (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-brand-gray-400 space-y-2 py-12">
                    <Wallet className="h-8 w-8 mx-auto stroke-1" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No outstanding receivables listed</p>
                  </div>
                );
              }
            })()}
          </div>
        </motion.div>

        {/* Liabilities Box */}
        <motion.div 
          id="liabilities-box"
          variants={itemVariants} 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.1 }}
          whileHover={hoverScale}
          className="glass-card rounded-[2.5rem] lg:rounded-[3rem] p-6 lg:p-10 h-[480px] lg:h-[520px] flex flex-col scroll-mt-6 lg:scroll-mt-8"
        >
          <div className="mb-6 lg:mb-8 flex items-center justify-between flex-shrink-0">
            <div className="space-y-1">
              <h2 className="text-3xl lg:text-4xl font-black tracking-tighter italic">Liabilities</h2>
              <p className="text-[10px] text-amber-600 font-mono uppercase tracking-[0.2em]">Outstanding Obligations</p>
            </div>
            <button 
              type="button"
              title="Add New Liability"
              onClick={() => handleOpenAddModal('liability')}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white hover:bg-zinc-800 transition-all shadow-md hover:scale-105 cursor-pointer"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4 overflow-y-auto pr-1 flex-1 scrollbar-hide">
            {(() => {
              const list = transactions.filter(t => t.type === 'liability' && (t.amount - (t.paidAmount || 0)) > 0);
              if (list.length > 0) {
                return list.map(tx => {
                  const total = tx.amount;
                  const paid = tx.paidAmount || 0;
                  const remaining = total - paid;
                  const percentSettled = Math.min(Math.round((paid / total) * 100), 100);

                  return (
                    <div 
                      key={tx.id}
                      onClick={() => {
                        if (remaining > 0) {
                          setSelectedPayoutTx(tx);
                          setPayoutAmount('');
                          const firstOperational = wallets.find(w => w.category !== 'Receivable' && w.category !== 'Liability');
                          setPaymentWalletId(firstOperational?.id || 'w_physical');
                        }
                      }}
                      className={cn(
                        "group p-5 rounded-2xl bg-brand-gray-50 border border-brand-gray-100 hover:border-black hover:bg-white hover:shadow-xl transition-all font-sans cursor-pointer flex flex-col gap-3",
                        remaining === 0 && "opacity-60 cursor-default hover:border-brand-gray-100 hover:bg-brand-gray-50 hover:shadow-none"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <h4 className="text-base font-black tracking-tight text-brand-black">{tx.purpose || 'Debt Obligation'}</h4>
                          <p className="text-[9px] font-mono text-brand-gray-400 uppercase tracking-widest mt-1">
                            Created on {format(tx.date, 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={cn(
                            "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                            remaining === 0 
                              ? "bg-slate-100 text-slate-500 border-slate-200" 
                              : "bg-amber-50 text-amber-600 border-amber-100 animate-pulse"
                          )}>
                            {remaining === 0 ? 'Settled' : `${percentSettled}% Paid`}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-1 text-center font-sans">
                        <div className="text-left">
                          <span className="text-[8px] font-mono font-black uppercase tracking-wider text-brand-gray-400 block">Total Owed</span>
                          <span className="text-xs font-mono font-medium text-brand-black">{formatCurrency(total)}</span>
                        </div>
                        <div className="text-center">
                          <span className="text-[8px] font-mono font-black uppercase tracking-wider text-brand-gray-400 block">Paid Off</span>
                          <span className="text-xs font-mono font-medium text-red-500">-{formatCurrency(paid)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] font-mono font-black uppercase tracking-wider text-brand-gray-400 block">Remaining</span>
                          <span className={cn("text-xs font-mono font-black", remaining > 0 ? "text-amber-600" : "text-brand-gray-300")}>
                            {remaining > 0 ? formatCurrency(remaining) : 'Payoff complete'}
                          </span>
                        </div>
                      </div>

                      {/* Progress visualizer bar */}
                      <div className="w-full bg-brand-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-amber-500 h-full transition-all duration-500" 
                          style={{ width: `${percentSettled}%` }}
                        />
                      </div>
                    </div>
                  );
                });
              } else {
                return (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-brand-gray-400 space-y-2 py-12">
                    <Wallet className="h-8 w-8 mx-auto stroke-1" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No outstanding liabilities listed</p>
                  </div>
                );
              }
            })()}
          </div>
        </motion.div>
      </div>

      {/* Main Charts & Lists */}
      <div className="grid grid-cols-1 gap-6 lg:gap-8 lg:grid-cols-2">
        {/* Analytics Chart */}
        <motion.div 
          id="flow-analytics"
          variants={itemVariants} 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.1 }}
          whileHover={hoverScale}
          className="glass-card rounded-[2.5rem] lg:rounded-[3rem] p-6 lg:p-10 scroll-mt-6 lg:scroll-mt-8"
        >
          <div className="mb-8 lg:mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <h2 className="text-3xl lg:text-4xl font-black tracking-tighter italic">Flow Analytics</h2>
              <p className="text-[10px] text-brand-gray-400 font-mono uppercase tracking-[0.2em]">Liquidity Mapping</p>
            </div>
            <div className="flex flex-col items-center sm:items-end gap-3 lg:gap-4">
              <select 
                value={selectedCycle}
                onChange={(e) => setSelectedCycle(e.target.value as Cycle)}
                className="w-full sm:w-auto rounded-[1.2rem] border border-brand-gray-100 bg-brand-gray-50 px-4 sm:px-3 py-2 sm:py-1.5 text-[9px] sm:text-[8px] font-black focus:border-black focus:outline-none uppercase tracking-widest cursor-pointer text-center sm:text-left max-h-9 lg:max-h-8"
              >
                <option value="1d">Cycle: 24 Hours</option>
                <option value="7d">Cycle: 7 Days</option>
                <option value="15d">Cycle: 15 Days</option>
                <option value="1m">Cycle: 30 Days</option>
                <option value="6m">Cycle: 6 Months</option>
                <option value="1y">Cycle: 1 Year</option>
                <option value="3y">Cycle: 3 Years</option>
                <option value="5y">Cycle: 5 Years</option>
                <option value="custom">Range: Custom</option>
              </select>

              {selectedCycle === 'custom' && (
                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <input 
                    type="date"
                    value={customRange.start}
                    onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                    className="rounded-xl border border-brand-gray-100 bg-white px-4 py-2 text-[10px] font-black uppercase"
                  />
                  <span className="text-brand-gray-300 font-black">/</span>
                  <input 
                    type="date"
                    value={customRange.end}
                    onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                    className="rounded-xl border border-brand-gray-100 bg-white px-4 py-2 text-[10px] font-black uppercase"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="h-[400px] w-full min-w-0 relative">
            {chartData.some(d => d.income > 0 || d.expense > 0) ? (
              <ResponsiveChartContainer>
                {(width, height) => (
                  <LineChart width={width} height={height} data={chartData} margin={{ top: 20, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid 
                      vertical={false} 
                      stroke="#E5E7EB" 
                      strokeDasharray="0"
                    />
                    <XAxis 
                      dataKey="name" 
                      axisLine={{ stroke: '#E5E7EB' }}
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 500 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 500 }}
                      tickFormatter={(val) => `$${val}`}
                    />
                    <Tooltip 
                      cursor={{ stroke: '#E5E7EB', strokeWidth: 1 }}
                      contentStyle={{ 
                        borderRadius: '8px', 
                        border: '1px solid #E5E7EB', 
                        backgroundColor: '#FFFFFF',
                        color: '#000000',
                        fontSize: '11px',
                        padding: '12px',
                        fontWeight: 600,
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }} 
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      align="center" 
                      iconType="rect"
                      wrapperStyle={{
                        paddingTop: '30px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#374151'
                      }}
                    />
                    {/* Income Series (Blue) */}
                    <Line 
                      type="monotone" 
                      dataKey="income" 
                      name="Independent Income"
                      stroke="#026cb6" 
                      strokeWidth={4}
                      dot={{ stroke: '#026cb6', strokeWidth: 2, r: 3.5, fill: '#FFFFFF' }}
                      activeDot={{ r: 6, stroke: '#FFFFFF', strokeWidth: 2 }}
                      animationDuration={1500}
                    />
                    {/* Expense Series (Red) */}
                    <Line 
                      type="monotone" 
                      dataKey="expense" 
                      name="Living Expenses"
                      stroke="#ed1c24" 
                      strokeWidth={4}
                      dot={{ stroke: '#ed1c24', strokeWidth: 2, r: 3.5, fill: '#FFFFFF' }}
                      activeDot={{ r: 6, stroke: '#FFFFFF', strokeWidth: 2 }}
                      animationDuration={1500}
                    />
                  </LineChart>
                )}
              </ResponsiveChartContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="h-1 bg-brand-gray-100 w-32 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ x: [-128, 128] }} 
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="h-full bg-brand-gray-300 w-1/2" 
                  />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gray-300 italic">No transaction data detected in the current cycle</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Goals Progress */}
        <motion.div 
          variants={itemVariants} 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.1 }}
          whileHover={hoverScale}
          className="glass-card rounded-[2.5rem] lg:rounded-[3rem] p-6 lg:p-10"
        >
          <div className="mb-8 lg:mb-10 flex items-end justify-between">
            <div className="space-y-1 text-center sm:text-left w-full sm:w-auto">
              <h2 className="text-3xl lg:text-4xl font-black tracking-tighter italic">Milestones</h2>
              <p className="text-[10px] text-brand-gray-400 font-mono uppercase tracking-[0.2em]">Target Projections</p>
            </div>
          </div>
          <div className="space-y-8 lg:space-y-10">
            {goals.length > 0 ? goals.map((goal) => {
              return (
                <div key={goal.id} className="group cursor-pointer">
                  <div className="mb-4 flex items-end justify-between">
                    <div className="flex items-center gap-5">
                      <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-brand-gray-50 border border-brand-gray-100 text-black group-hover:bg-black group-hover:text-white transition-all transform group-hover:rotate-6">
                        <Target className="h-7 w-7" />
                      </div>
                      <div>
                        <p className="text-base font-black tracking-tight leading-none mb-1.5">{goal.title}</p>
                        <p className="text-[10px] font-mono text-brand-gray-400 uppercase tracking-widest font-bold tabular-nums">{formatCurrency(goal.targetAmount)} Total</p>
                      </div>
                    </div>
                    {/* GoalProgress component handles percentage and animated bar */}
                  </div>
                  <GoalProgress 
                    current={goal.currentAmount} 
                    target={goal.targetAmount} 
                    showValues={false}
                    className="mt-4"
                  />
                </div>
              );
            }) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Target className="h-16 w-16 text-brand-gray-100 mb-6" />
                <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-gray-300">No active projections</p>
              </div>
            )}
            
            <button className="interactive-button w-full rounded-[2rem] border-2 border-dashed border-brand-gray-100 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-300 transition-all hover:border-black hover:text-black bg-black" onClick={() => onNavigate?.('goals')}>
              + New Goal
            </button>
          </div>
        </motion.div>



        {/* Monthly Spending Breakdown */}
        <motion.div 
          variants={itemVariants} 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.1 }}
          whileHover={hoverScale}
          className="glass-card rounded-[2.5rem] lg:rounded-[3rem] p-6 lg:p-10"
        >
          {(() => {
            let chartData: { name: string; color: string; value: number }[] = [];
            let totalAmount = 0;
            let displayLabel = 'Blank';
            let centerText = 'Status';
            let listData: { name: string; color: string; value: number; percent: number; details?: string }[] = [];

            if (allocationMode === 'expense') {
              // Group expenses dynamically
              const expenseTxThisMonth = transactions.filter(t => 
                t.type === 'expense' && 
                t.date >= currentMonthStart && 
                t.date <= currentMonthEnd
              );

              const systemCategories = categories.filter(c => c.type === 'expense');
              const txCategories = Array.from(new Set(expenseTxThisMonth.map(t => t.category)));
              const allCategoryNames = Array.from(new Set([...systemCategories.map(c => c.name), ...txCategories]));

              const totalsByCategory = allCategoryNames
                .map((catName, index) => {
                  const matchingCat = categories.find(c => c.name === catName && c.type === 'expense');
                  const color = matchingCat?.color || COLORS[index % COLORS.length];
                  const value = expenseTxThisMonth
                    .filter(t => t.category === catName)
                    .reduce((acc, t) => acc + t.amount, 0);
                  return { name: catName, color, value };
                })
                .filter(c => c.value > 0)
                .sort((a, b) => b.value - a.value);

              chartData = totalsByCategory.length > 0 
                ? totalsByCategory 
                : [{ name: 'Unallocated', value: 100, color: '#e4e4e7' }];
              
              totalAmount = totalsByCategory.reduce((acc, c) => acc + c.value, 0);
              displayLabel = totalsByCategory.length > 0 ? formatCurrency(totalAmount) : 'Blank';
              centerText = 'Spent';

              listData = totalsByCategory.map(item => ({
                name: item.name,
                color: item.color,
                value: item.value,
                percent: totalAmount > 0 ? Math.round((item.value / totalAmount) * 100) : 0
              }));

            } else if (allocationMode === 'income') {
              // Group income dynamically (income and receivable collections)
              const incomeTxThisMonth = transactions.filter(t => 
                (t.type === 'income' || (t.type === 'receivable' && t.receivableSubtype === 'income')) && 
                t.date >= currentMonthStart && 
                t.date <= currentMonthEnd
              );

              const systemCategories = categories.filter(c => c.type === 'income');
              const txCategories = Array.from(new Set(incomeTxThisMonth.map(t => t.category)));
              const allCategoryNames = Array.from(new Set([...systemCategories.map(c => c.name), ...txCategories]));

              const totalsByCategory = allCategoryNames
                .map((catName, index) => {
                  const matchingCat = categories.find(c => c.name === catName && c.type === 'income');
                  const color = matchingCat?.color || COLORS[index % COLORS.length];
                  const value = incomeTxThisMonth
                    .filter(t => t.category === catName)
                    .reduce((acc, t) => acc + t.amount, 0);
                  return { name: catName, color, value };
                })
                .filter(c => c.value > 0)
                .sort((a, b) => b.value - a.value);

              chartData = totalsByCategory.length > 0 
                ? totalsByCategory 
                : [{ name: 'No Inflow', value: 100, color: '#e4e4e7' }];
              
              totalAmount = totalsByCategory.reduce((acc, c) => acc + c.value, 0);
              displayLabel = totalsByCategory.length > 0 ? formatCurrency(totalAmount) : 'Blank';
              centerText = 'Inflow';

              listData = totalsByCategory.map(item => ({
                name: item.name,
                color: item.color,
                value: item.value,
                percent: totalAmount > 0 ? Math.round((item.value / totalAmount) * 100) : 0
              }));

            } else {
              // wallet_evaluation mode
              const evaluableWallets = wallets.filter(w => w.category !== 'Liability');
              const evaluableReserves = funds;

              const walletSlices = evaluableWallets.map((w, index) => ({
                name: w.name,
                color: w.color || COLORS[index % COLORS.length],
                value: w.balance,
                type: 'Wallet'
              }));

              const reserveSlices = evaluableReserves.map((f, index) => ({
                name: f.name,
                color: f.color || COLORS[(index + 3) % COLORS.length],
                value: f.currentAmount,
                type: 'Reserve'
              }));

              const allAssets = [...walletSlices, ...reserveSlices].filter(item => item.value > 0);
              chartData = allAssets.length > 0 
                ? allAssets 
                : [{ name: 'No Assets', value: 100, color: '#e4e4e7' }];

              totalAmount = allAssets.reduce((acc, c) => acc + c.value, 0);
              displayLabel = allAssets.length > 0 ? formatCurrency(totalAmount) : 'Blank';
              centerText = 'Assets';

              listData = allAssets.map(item => ({
                name: item.name,
                color: item.color,
                value: item.value,
                percent: totalAmount > 0 ? Math.round((item.value / totalAmount) * 100) : 0,
                details: item.type
              }));
            }

            const hasData = totalAmount > 0;

            return (
              <>
                <div className="mb-8 lg:mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1 text-left">
                    <h2 className="text-3xl lg:text-4xl font-black tracking-tighter italic">
                      Allocation
                    </h2>
                  </div>
                  <div className="relative shrink-0">
                    <select
                      value={allocationMode}
                      onChange={(e) => setAllocationMode(e.target.value as any)}
                      className="bg-brand-gray-50 border border-brand-gray-200 text-[10px] font-black uppercase tracking-widest rounded-xl pl-3.5 pr-8 py-2 focus:border-black focus:bg-white focus:outline-none focus:ring-4 focus:ring-black/5 transition-all cursor-pointer appearance-none"
                    >
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                      <option value="wallet_evaluation">Wallet Evaluation</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none h-3.5 w-3.5 text-brand-gray-400" />
                  </div>
                </div>
                <div className="relative h-[240px] lg:h-[280px] w-full min-w-0 flex items-center justify-center">
                  {/* Center Text Labels overlaid cleanly on top */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                    <span className="text-[10px] font-black text-brand-gray-400 uppercase tracking-[0.2em]">
                      {centerText}
                    </span>
                    <span className="text-2xl lg:text-3xl font-mono font-black tracking-tighter tabular-nums text-black mt-1">
                      {hasData ? displayLabel : 'Blank'}
                    </span>
                  </div>

                  <ResponsiveChartContainer>
                    {(width, height) => (
                      <PieChart width={width} height={height}>
                        <Pie
                          data={chartData}
                          innerRadius={80}
                          outerRadius={110}
                          paddingAngle={hasData ? 6 : 0}
                          dataKey="value"
                          nameKey="name"
                          stroke="none"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        {hasData && (
                          <Tooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-black text-white px-4 py-3 rounded-2xl shadow-xl border border-white/10 text-[10px] font-black uppercase tracking-wider space-y-1">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                                      <span>{data.name}</span>
                                    </div>
                                    <div className="text-[9px] text-brand-gray-400 font-mono">
                                      {formatCurrency(data.value)} ({Math.round((data.value / totalAmount) * 100)}%)
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        )}
                      </PieChart>
                    )}
                  </ResponsiveChartContainer>
                </div>
                <div className="mt-10 space-y-5">
                  {!hasData ? (
                    <div className="py-6 text-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-brand-gray-300">
                        {allocationMode === 'expense' && 'No expense transactions detected'}
                        {allocationMode === 'income' && 'No income transactions detected'}
                        {allocationMode === 'wallet_evaluation' && 'No assets detected'}
                      </p>
                    </div>
                  ) : (
                    listData.slice(0, 5).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between group cursor-pointer transition-all duration-200">
                        <div className="flex items-center gap-4">
                          <div className="h-4.5 w-4.5 rounded-xl shadow-md transition-all duration-300 group-hover:scale-110 flex items-center justify-center border border-black/5" style={{ backgroundColor: item.color }}>
                            <div className="w-1.5 h-1.5 rounded-full bg-white opacity-40 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-brand-gray-400 uppercase tracking-[0.15em] group-hover:text-black transition-colors flex items-center gap-1.5">
                              {item.name}
                              {item.details && (
                                <span className="text-[8px] px-2 py-0.5 rounded-md bg-brand-gray-100 text-brand-gray-400 font-mono scale-90 font-bold uppercase tracking-widest">
                                  {item.details}
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] font-mono text-brand-gray-300 font-black tracking-wider mt-0.5">
                              {formatCurrency(item.value)}
                            </span>
                          </div>
                        </div>
                        <span className="text-2xl font-mono font-black tracking-tighter tabular-nums transition-all group-hover:translate-x-[-4px]">
                          {item.percent}%
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </>
            );
          })()}
        </motion.div>
      </div>

      {/* Add Transaction Modal */}
      {createPortal(
        <AnimatePresence>
          {isModalOpen && (
            <div className="relative z-[100]">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => { setIsModalOpen(false); setIsAddingCustomCategory(false); setCustomCategoryName(''); }}
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
                    <h3 className="text-3xl font-black tracking-tighter">New Entry</h3>
                    <p className="text-xs font-medium text-white/60 uppercase tracking-widest mt-1">Transaction Authorization Protocol</p>
                  </div>
                  <button onClick={() => { setIsModalOpen(false); setIsAddingCustomCategory(false); setCustomCategoryName(''); }} className="relative rounded-full p-2 bg-white/10 hover:bg-white/20 transition-colors">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-10 space-y-8">
                  {/* Type Switcher */}
                  <div className="flex flex-wrap gap-1 p-2 bg-brand-gray-50 rounded-2xl border border-brand-gray-100">
                    {['expense', 'income', 'transfer', 'receivable', 'liability'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          let defaultWalletId = formData.walletId;
                          let defaultCategory = formData.category;
                          if (type === 'receivable') {
                            const found = wallets.find(w => w.category === 'Receivable');
                            defaultWalletId = found?.id || '';
                            defaultCategory = 'Salary';
                          } else if (type === 'liability') {
                            const found = wallets.find(w => w.category === 'Liability');
                            defaultWalletId = found?.id || '';
                            defaultCategory = 'Food';
                          } else {
                            const found = wallets.find(w => w.category !== 'Receivable' && w.category !== 'Liability');
                            defaultWalletId = found?.id || '';
                            defaultCategory = type === 'income' ? 'Salary' : 'Food';
                          }

                          setIsAddingCustomCategory(false);
                          setCustomCategoryName('');
                          setFormData({ 
                            ...formData, 
                            type: type as TransactionType,
                            walletId: defaultWalletId,
                            category: defaultCategory,
                            toWalletId: ''
                          });
                        }}
                        className={cn(
                          "flex-1 min-w-[80px] py-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                          formData.type === type 
                            ? "bg-white shadow-xl text-black" 
                            : "text-brand-gray-400 hover:text-brand-gray-600"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">Amount</label>
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-2xl text-brand-gray-400">$</span>
                        <input 
                          required
                          type="text"
                          inputMode="decimal"
                          value={formData.amount}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === '' || /^\d*\.?\d*$/.test(val)) {
                              setFormData({ ...formData, amount: val });
                            }
                          }}
                          placeholder="0.00"
                          className="w-full rounded-[2rem] border border-brand-gray-200 bg-brand-gray-50 pl-14 pr-8 py-8 text-4xl font-black tracking-tighter focus:border-black focus:bg-white focus:ring-4 focus:ring-black/5 focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className={cn("space-y-3", formData.type === 'receivable' && "md:col-span-2")}>
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">
                          {formData.type === 'transfer' ? 'Source Wallet / Reserve' : formData.type === 'income' ? 'Destination Wallet / Reserve' : formData.type === 'receivable' ? 'Receivable Wallet' : formData.type === 'liability' ? 'Liability Wallet' : 'Source Wallet / Reserve'}
                        </label>
                        <div className="relative">
                          <select 
                            required
                            value={formData.walletId}
                            onChange={e => setFormData({ ...formData, walletId: e.target.value })}
                            className="w-full rounded-2xl border border-brand-gray-200 bg-brand-gray-50 pl-6 pr-12 py-4 text-sm font-bold focus:bg-white focus:border-black focus:outline-none transition-all appearance-none cursor-pointer"
                          >
                            <option value="">
                              {formData.type === 'receivable' ? 'Select Receivable' : formData.type === 'liability' ? 'Select Liability' : 'Select Wallet / Reserve'}
                            </option>
                            {formData.type === 'receivable' ? (
                              wallets.filter(w => w.category === 'Receivable').map(w => (
                                <option key={w.id} value={w.id}>{w.name} (${w.balance})</option>
                              ))
                            ) : formData.type === 'liability' ? (
                              wallets.filter(w => w.category === 'Liability').map(w => (
                                <option key={w.id} value={w.id}>{w.name} (${w.balance})</option>
                              ))
                            ) : (
                              <>
                                <optgroup label="Vaults (Wallets)">
                                  {wallets.filter(w => w.category !== 'Receivable' && w.category !== 'Liability').map(w => (
                                    <option key={w.id} value={w.id}>{w.name} (${w.balance})</option>
                                  ))}
                                </optgroup>
                                {funds.length > 0 && (
                                  <optgroup label="Reserves (Funds)">
                                    {funds.map(f => (
                                      <option key={f.id} value={f.id}>{f.name} (${f.currentAmount})</option>
                                    ))}
                                  </optgroup>
                                )}
                              </>
                            )}
                          </select>
                          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-brand-gray-400">
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                      
                      {formData.type === 'transfer' ? (
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">Target Wallet / Reserve</label>
                          <div className="relative">
                            <select 
                              required
                              value={formData.toWalletId}
                              onChange={e => setFormData({ ...formData, toWalletId: e.target.value })}
                              className="w-full rounded-2xl border border-brand-gray-200 bg-brand-gray-50 pl-6 pr-12 py-4 text-sm font-bold focus:bg-white focus:border-black focus:outline-none transition-all appearance-none cursor-pointer"
                            >
                              <option value="">Select Wallet / Reserve</option>
                              <optgroup label="Vaults (Wallets)">
                                {wallets.filter(w => w.id !== formData.walletId && w.category !== 'Receivable' && w.category !== 'Liability').map(w => (
                                  <option key={w.id} value={w.id}>{w.name} (${w.balance})</option>
                                ))}
                              </optgroup>
                              {funds.length > 0 && (
                                <optgroup label="Reserves (Funds)">
                                  {funds.map(f => (
                                    <option key={f.id} value={f.id}>{f.name} (${f.currentAmount})</option>
                                  ))}
                                </optgroup>
                              )}
                            </select>
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-brand-gray-400">
                              <ChevronDown className="h-4 w-4" />
                            </div>
                          </div>
                        </div>
                      ) : (formData.type === 'receivable' || formData.type === 'liability') ? (
                        formData.type === 'liability' ? (
                          <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">
                              Destination Wallet / Reserve
                            </label>
                            <div className="relative">
                              <select 
                                required
                                value={formData.toWalletId}
                                onChange={e => setFormData({ ...formData, toWalletId: e.target.value })}
                                className="w-full rounded-2xl border border-brand-gray-200 bg-brand-gray-50 pl-6 pr-12 py-4 text-sm font-bold focus:bg-white focus:border-black focus:outline-none transition-all appearance-none cursor-pointer"
                              >
                                <option value="">Select Wallet / Reserve</option>
                                <optgroup label="Vaults (Wallets)">
                                  {wallets.filter(w => w.category !== 'Receivable' && w.category !== 'Liability').map(w => (
                                    <option key={w.id} value={w.id}>{w.name} (${w.balance})</option>
                                  ))}
                                </optgroup>
                                {funds.length > 0 && (
                                  <optgroup label="Reserves (Funds)">
                                    {funds.map(f => (
                                      <option key={f.id} value={f.id}>{f.name} (${f.currentAmount})</option>
                                    ))}
                                  </optgroup>
                                )}
                              </select>
                              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-brand-gray-400">
                                <ChevronDown className="h-4 w-4" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">
                              Receivable Type
                            </label>
                            <div className="relative">
                              <select 
                                required
                                value={formData.receivableSubtype}
                                onChange={e => setFormData({ ...formData, receivableSubtype: e.target.value as any })}
                                className="w-full rounded-2xl border border-brand-gray-200 bg-brand-gray-50 pl-6 pr-12 py-4 text-sm font-bold focus:bg-white focus:border-black focus:outline-none transition-all appearance-none cursor-pointer"
                              >
                                <option value="income">Income</option>
                                <option value="lended_money">Lended Money</option>
                                <option value="others">Others</option>
                              </select>
                              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-brand-gray-400">
                                <ChevronDown className="h-4 w-4" />
                              </div>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">Category Tag</label>
                            <button 
                              type="button" 
                              onClick={() => setIsAddingCustomCategory(!isAddingCustomCategory)}
                              className="text-[10px] font-black uppercase tracking-wider text-black hover:opacity-75 transition-all flex items-center gap-1.5"
                            >
                              {isAddingCustomCategory ? '✕ Cancel' : '+ New Tag'}
                            </button>
                          </div>
                          {isAddingCustomCategory ? (
                            <div className="rounded-2xl border border-brand-gray-300 bg-white p-5 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                              <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-[0.15em] text-brand-gray-400">Custom Tag Name</label>
                                <input 
                                  type="text"
                                  placeholder="e.g., Subscriptions, Coffee, Bonus"
                                  value={customCategoryName}
                                  onChange={e => setCustomCategoryName(e.target.value)}
                                  className="w-full rounded-xl border border-brand-gray-200 bg-brand-gray-50 px-4 py-3 text-xs font-bold focus:bg-white focus:border-black focus:outline-none transition-all"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-[0.15em] text-brand-gray-400">Accent Color</label>
                                <div className="flex flex-wrap gap-2">
                                  {['#10b981', '#0ea5e9', '#ec4899', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6', '#f43f5e', '#a855f7', '#64748b'].map(color => (
                                    <button
                                      key={color}
                                      type="button"
                                      onClick={() => setCustomCategoryColor(color)}
                                      className={`w-5 h-5 rounded-full transition-all duration-150 ${customCategoryColor === color ? 'ring-2 ring-black ring-offset-2 scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'}`}
                                      style={{ backgroundColor: color }}
                                    />
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-[0.15em] text-brand-gray-400">Accent Icon</label>
                                <div className="flex flex-wrap gap-1.5">
                                  {['Tag', 'Sparkles', 'Coffee', 'Gift', 'Heart', 'Tv', 'Home', 'PiggyBank', 'DollarSign', 'Smartphone', 'ShoppingBag', 'Activity'].map(ic => (
                                    <button
                                      key={ic}
                                      type="button"
                                      onClick={() => setCustomCategoryIcon(ic)}
                                      className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold tracking-tight transition-all ${customCategoryIcon === ic ? 'bg-black text-white border-black' : 'bg-brand-gray-50 text-brand-gray-600 border-brand-gray-200 hover:border-brand-gray-400'}`}
                                    >
                                      {ic}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={handleSaveCustomCategory}
                                className="w-full py-2.5 rounded-xl bg-black text-white text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all"
                              >
                                Create Tag
                              </button>
                            </div>
                          ) : (
                            <div className="relative">
                              <select 
                                required
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className="w-full rounded-2xl border border-brand-gray-200 bg-brand-gray-50 pl-6 pr-12 py-4 text-sm font-bold focus:bg-white focus:border-black focus:outline-none transition-all appearance-none cursor-pointer"
                              >
                                {categories.filter(c => c.type === ((formData.type === 'income' || formData.type === 'receivable') ? 'income' : 'expense')).map(c => (
                                  <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                              </select>
                              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-brand-gray-400">
                                <ChevronDown className="h-4 w-4" />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      {(formData.type === 'receivable' || formData.type === 'liability') && (
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">Purpose</label>
                          <input 
                            required
                            type="text" 
                            value={formData.purpose}
                            onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                            placeholder={formData.type === 'receivable' ? "e.g., Client Freelance Work" : "e.g., Car Loan"}
                            className="w-full rounded-2xl border border-brand-gray-200 bg-brand-gray-50 px-6 py-4 text-sm font-bold focus:border-black focus:outline-none transition-all"
                          />
                        </div>
                      )}

                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">Date & Time</label>
                        <input 
                          required
                          type="datetime-local" 
                          value={formData.date}
                          onChange={e => setFormData({ ...formData, date: e.target.value })}
                          className="w-full rounded-2xl border border-brand-gray-200 bg-brand-gray-50 px-6 py-4 text-sm font-bold focus:border-black focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">Meta Description</label>
                      <textarea 
                        value={formData.note}
                        onChange={e => setFormData({ ...formData, note: e.target.value })}
                        placeholder="Transaction justification..."
                        className="w-full rounded-2xl border border-brand-gray-200 bg-brand-gray-50 px-6 py-4 text-sm font-medium focus:border-black focus:bg-white focus:ring-4 focus:ring-black/5 focus:outline-none transition-all min-h-[120px]"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="interactive-button w-full rounded-[2rem] bg-black py-6 text-lg font-black tracking-tighter text-white shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    AUTHORIZE {formData.type.toUpperCase()}
                  </button>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )}

      {/* Positive Balances Summary Modal */}
      {createPortal(
        <AnimatePresence>
          {isAssetSummaryOpen && (
            <div className="fixed inset-0 z-[100] pointer-events-none">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAssetSummaryOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-md pointer-events-auto"
              />
              <div className="fixed inset-0 flex justify-center p-4 pointer-events-none overflow-y-auto z-[101]">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white shadow-[0_40px_100px_rgba(0,0,0,0.3)] pointer-events-auto border border-brand-gray-100 my-auto"
                >
                <div className="bg-black px-8 py-8 flex items-center justify-between text-white relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
                  <div className="relative">
                    <h3 className="text-2xl font-black tracking-tighter">Total Assets</h3>
                  </div>
                  <button onClick={() => setIsAssetSummaryOpen(false)} className="relative rounded-full p-2 bg-white/10 hover:bg-white/20 transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="p-8 space-y-6">
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    {(() => {
                      const positiveWallets = wallets.filter(
                        w => w.category !== 'Receivable' && w.category !== 'Liability' && w.balance > 0
                      );

                      if (positiveWallets.length === 0) {
                        return (
                          <div className="text-center py-8 space-y-2">
                            <Wallet className="h-10 w-10 text-brand-gray-300 mx-auto stroke-1" />
                            <p className="text-xs font-bold text-brand-gray-400 uppercase tracking-wider">No Positive Balances Found</p>
                          </div>
                        );
                      }

                      return positiveWallets.map(w => {
                        const getWalletIcon = (iconName: string) => {
                          const cnStr = "h-5 w-5";
                          switch (iconName) {
                            case 'Smartphone': return <Smartphone className={cnStr} style={{ color: w.color }} />;
                            case 'Building2': return <Building2 className={cnStr} style={{ color: w.color }} />;
                            case 'CreditCard': return <CreditCard className={cnStr} style={{ color: w.color }} />;
                            case 'Bitcoin': return <Bitcoin className={cnStr} style={{ color: w.color }} />;
                            default: return <Wallet className={cnStr} style={{ color: w.color }} />;
                          }
                        };

                        return (
                          <div 
                            key={w.id} 
                            className="flex items-center justify-between p-4 rounded-2xl bg-brand-gray-50 border border-brand-gray-100 hover:border-brand-gray-200 transition-all font-sans"
                          >
                            <div className="flex items-center gap-3 font-sans">
                              <div className="p-2.5 rounded-xl bg-white border border-brand-gray-100 shadow-sm flex items-center justify-center">
                                {getWalletIcon(w.icon)}
                              </div>
                              <div className="text-left">
                                <h4 className="text-sm font-black tracking-tight text-black">{w.name}</h4>
                                <p className="text-[9px] font-mono font-black uppercase tracking-widest text-brand-gray-300 mt-0.5">{w.category}</p>
                              </div>
                            </div>
                            <span className="text-base font-black tracking-tight text-black tabular-nums font-sans">
                              {formatCurrency(w.balance)}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  <div className="border-t border-brand-gray-100 pt-6 flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-[10px] font-mono text-brand-gray-400 uppercase tracking-widest">Total Asset Value</p>
                      <p className="text-xs text-brand-gray-300">Excluding Expected/Debts</p>
                    </div>
                    <span className="text-xl font-black tracking-tighter text-black tabular-nums italic">
                      {formatCurrency(
                        wallets
                          .filter(w => w.category !== 'Receivable' && w.category !== 'Liability' && w.balance > 0)
                          .reduce((sum, w) => sum + w.balance, 0)
                      )}
                    </span>
                  </div>

                  <button 
                    onClick={() => setIsAssetSummaryOpen(false)}
                    className="interactive-button w-full rounded-[1.5rem] bg-black py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )}

      {/* Interactive Settlement & Payoff Modal */}
      {createPortal(
        <AnimatePresence>
          {selectedPayoutTx && (
            <div className="relative z-[100]">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedPayoutTx(null)}
                className="fixed inset-0 bg-black/60 backdrop-blur-md"
              />
              <div className="fixed inset-0 flex justify-center p-4 pointer-events-none overflow-y-auto z-[101]">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="w-full max-w-lg overflow-hidden rounded-[3rem] bg-white shadow-[0_40px_100px_rgba(0,0,0,0.3)] pointer-events-auto border border-brand-gray-100 my-auto"
                >
                <div className="bg-black px-8 py-8 flex items-center justify-between text-white relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
                  <div className="relative text-left">
                    <h3 className="text-2xl font-black tracking-tighter">
                      {selectedPayoutTx.type === 'receivable' ? 'Record Collection' : 'Record Paydown'}
                    </h3>
                    <p className="text-[10px] font-medium text-white/60 uppercase tracking-widest mt-1">
                      {selectedPayoutTx.type === 'receivable' ? 'Receivable Settlement Protocol' : 'Liability Liquidation Process'}
                    </p>
                  </div>
                  <button onClick={() => setSelectedPayoutTx(null)} className="relative rounded-full p-2 bg-white/10 hover:bg-white/20 transition-colors cursor-pointer">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handlePayoutSubmit} className="p-8 space-y-6 text-left">
                  <div className="p-5 rounded-2xl bg-brand-gray-50 border border-brand-gray-100 space-y-3 font-sans">
                    <div className="flex justify-between items-center pb-2 border-b border-brand-gray-100">
                      <span className="text-xs font-black text-brand-black uppercase tracking-wider">Purpose / Name</span>
                      <span className="text-sm font-bold text-brand-black">{selectedPayoutTx.purpose || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-brand-gray-400">Total Contract Owed:</span>
                      <span className="text-xs font-mono font-bold text-brand-black">{formatCurrency(selectedPayoutTx.amount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-brand-gray-400">
                        {selectedPayoutTx.type === 'receivable' ? 'Already Collected:' : 'Already Repaid:'}
                      </span>
                      <span className="text-xs font-mono font-medium text-emerald-600">
                        {formatCurrency(selectedPayoutTx.paidAmount || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-brand-gray-100">
                      <span className="text-xs font-black text-brand-black uppercase tracking-wider">Remaining Balance:</span>
                      <span className="text-sm font-mono font-black text-indigo-600">
                        {formatCurrency(selectedPayoutTx.amount - (selectedPayoutTx.paidAmount || 0))}
                      </span>
                    </div>
                  </div>

                  {/* Input Amount to apply */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">
                      {selectedPayoutTx.type === 'receivable' ? 'Amount Received' : 'Amount Paid Back'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-2xl text-brand-gray-400">$</span>
                      <input 
                        required
                        type="text"
                        inputMode="decimal"
                        value={payoutAmount}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === '' || /^\d*\.?\d*$/.test(val)) {
                            setPayoutAmount(val);
                          }
                        }}
                        placeholder="0.00"
                        className="w-full rounded-[2rem] border border-brand-gray-200 bg-brand-gray-50 pl-14 pr-8 py-6 text-3xl font-black tracking-tighter focus:border-black focus:bg-white focus:ring-4 focus:ring-black/5 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Operational Wallet Selection */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">
                      {selectedPayoutTx.type === 'receivable' ? 'Deposit Into' : 'Pay From'}
                    </label>
                    <select 
                      required
                      value={paymentWalletId}
                      onChange={e => setPaymentWalletId(e.target.value)}
                      className="w-full rounded-2xl border border-brand-gray-200 bg-brand-gray-50 px-6 py-4 text-sm font-bold focus:bg-white focus:border-black focus:outline-none transition-all appearance-none cursor-pointer"
                    >
                      <optgroup label="Vaults (Wallets)">
                        {wallets
                          .filter(w => w.category !== 'Receivable' && w.category !== 'Liability')
                          .map(w => (
                            <option key={w.id} value={w.id}>
                              {w.name} (${w.balance})
                            </option>
                          ))}
                      </optgroup>
                      {funds.length > 0 && (
                        <optgroup label="Reserves (Funds)">
                          {funds.map(f => (
                            <option key={f.id} value={f.id}>
                              {f.name} (${f.currentAmount})
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  {/* Display warning or execute action */}
                  {(() => {
                    const maxAllowed = selectedPayoutTx.amount - (selectedPayoutTx.paidAmount || 0);
                    const entered = parseFloat(payoutAmount) || 0;
                    const isExceeded = entered > maxAllowed;

                    return (
                      <button 
                        type="submit"
                        disabled={isExceeded || entered <= 0}
                        className={cn(
                          "interactive-button w-full rounded-[2rem] py-5 text-sm font-black uppercase tracking-wider text-white shadow-xl transition-all cursor-pointer",
                          isExceeded 
                            ? "bg-red-500 cursor-not-allowed hover:scale-100" 
                            : "bg-black hover:scale-[1.02] active:scale-[0.98]"
                        )}
                      >
                        {isExceeded 
                          ? 'EXCEEDS NOMINAL OUTSTANDING DEBT' 
                          : selectedPayoutTx.type === 'receivable' 
                            ? 'CONFIRM COLLECTION RECEIPT' 
                            : 'CONFIRM PAYMENT RELEASE'}
                      </button>
                    );
                  })()}
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

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  subtitle?: string;
  color?: 'black' | 'indigo' | 'emerald' | 'rose' | 'sky' | 'amber';
  centered?: boolean;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, subtitle, color = 'black', centered, onClick }) => {
  const colorMap = {
    black: 'group-hover:border-black color-glow-black',
    indigo: 'group-hover:border-indigo-500 color-glow-indigo',
    emerald: 'group-hover:border-emerald-500 color-glow-emerald',
    rose: 'group-hover:border-rose-500 color-glow-rose',
    sky: 'group-hover:border-sky-500 color-glow-sky',
    amber: 'group-hover:border-amber-500 color-glow-amber',
  };

  const bgMap = {
    black: 'group-hover:bg-black',
    indigo: 'group-hover:bg-indigo-600',
    emerald: 'group-hover:bg-emerald-600',
    rose: 'group-hover:bg-rose-600',
    sky: 'group-hover:bg-sky-600',
    amber: 'group-hover:bg-amber-600',
  };

  return (
    <div 
      onClick={onClick}
      className={cn(
        "glass-card group relative overflow-hidden rounded-3xl p-4 xs:p-5 sm:p-6 lg:p-8",
        colorMap[color as keyof typeof colorMap],
        onClick && "cursor-pointer hover:border-black hover:shadow-lg transition-all duration-300"
      )}
    >
      <div className={cn("flex justify-between", centered ? "flex-col items-center text-center gap-4 sm:gap-6" : "items-end")}>
        <div className={cn("space-y-1.5 sm:space-y-2 flex flex-col", centered ? "items-center" : "items-start")}>
          <p className="text-[9px] sm:text-[10px] font-mono text-brand-gray-400 uppercase tracking-widest">{title}</p>
          <p className="text-lg xs:text-xl sm:text-2xl lg:text-3xl font-black tabular-nums tracking-tight">{value}</p>
          <p className="text-[9px] sm:text-[10px] font-medium text-brand-gray-400 uppercase italic">
            {subtitle}
          </p>
        </div>
        <div className={cn("flex flex-col gap-2 sm:gap-3", centered ? "items-center" : "items-end")}>
          <div className={cn(
            "flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-brand-gray-50 text-black group-hover:text-white transition-all duration-500 transform group-hover:rotate-12 group-hover:scale-110",
            bgMap[color as keyof typeof bgMap]
          )}>
            {icon}
          </div>
          {trend && (
            <span className={cn(
              "text-[9px] sm:text-[10px] font-black px-2 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase tracking-tighter",
              trend.startsWith('+') ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
            )}>
              {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
