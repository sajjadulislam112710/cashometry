import React, { createContext, useContext, useState, useEffect } from 'react';
import { Wallet, Fund, Goal, Transaction, Category, TransactionType } from '../types';
import { generateId } from '../lib/utils';

interface FinanceState {
  wallets: Wallet[];
  funds: Fund[];
  goals: Goal[];
  transactions: Transaction[];
  categories: Category[];
}

interface FinanceContextType extends FinanceState {
  addWallet: (wallet: Omit<Wallet, 'id' | 'createdAt'>) => void;
  updateWallet: (id: string, wallet: Partial<Wallet>) => void;
  deleteWallet: (id: string) => void;
  addFund: (fund: Omit<Fund, 'id' | 'createdAt' | 'currentAmount'>) => void;
  updateFund: (id: string, fund: Partial<Fund>) => void;
  deleteFund: (id: string) => void;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'currentAmount' | 'status'>) => void;
  updateGoal: (id: string, goal: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, tx: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  resetData: () => void;
  ledgerFilterType: 'all' | TransactionType | 'reserve';
  setLedgerFilterType: (type: 'all' | TransactionType | 'reserve') => void;
  ledgerStartDate: number | null;
  setLedgerStartDate: (date: number | null) => void;
  ledgerEndDate: number | null;
  setLedgerEndDate: (date: number | null) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const INITIAL_CATEGORIES: Category[] = [
  { id: '1', name: 'Salary', type: 'income', icon: 'DollarSign', color: '#10b981' },
  { id: '2', name: 'Freelancing', type: 'income', icon: 'Briefcase', color: '#0ea5e9' },
  { id: '3', name: 'Food', type: 'expense', icon: 'Utensils', color: '#f59e0b' },
  { id: '4', name: 'Transport', type: 'expense', icon: 'Bus', color: '#6366f1' },
  { id: '5', name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#ec4899' },
  { id: '6', name: 'Entertainment', type: 'expense', icon: 'Film', color: '#8b5cf6' },
  { id: '7', name: 'Health', type: 'expense', icon: 'HeartPulse', color: '#ef4444' },
];

const DEFAULT_STATE = {
  wallets: [
    { id: 'w_physical', name: 'Cash', balance: 0, category: 'Physical' as const, color: '#78716c', icon: 'Wallet', createdAt: Date.now() },
    { id: 'w_digital', name: 'E-Wallet', balance: 0, category: 'Digital' as const, color: '#0ea5e9', icon: 'Smartphone', createdAt: Date.now() },
    { id: 'w_bank', name: 'Bank Account', balance: 0, category: 'Bank' as const, color: '#10b981', icon: 'Building2', createdAt: Date.now() },
    { id: 'w_crypto', name: 'Cryptocurrency', balance: 0, category: 'Crypto' as const, color: '#f59e0b', icon: 'Bitcoin', createdAt: Date.now() },
    { id: 'w_cards', name: 'Cards', balance: 0, category: 'Cards' as const, color: '#ec4899', icon: 'CreditCard', createdAt: Date.now() },
    { id: 'w_receivable', name: 'Receivable', balance: 0, category: 'Receivable' as const, color: '#6366f1', icon: 'LendMoney', createdAt: Date.now() },
    { id: 'w_liability', name: 'Payable', balance: 0, category: 'Liability' as const, color: '#d97706', icon: 'ReturnLendMoney', createdAt: Date.now() },
  ],
  funds: [],
  goals: [],
  transactions: [],
  categories: INITIAL_CATEGORIES,
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<FinanceState>(() => {
    let saved = localStorage.getItem('cashometry_v3');
    if (!saved) {
      saved = localStorage.getItem('finflow_v3');
    }
    if (saved) {
      try {
        let parsed = JSON.parse(saved);
        
        // Keep ONLY default wallets
        const defaultIds = DEFAULT_STATE.wallets.map(dw => dw.id);
        const initialWallets = (DEFAULT_STATE.wallets).map(w => ({ ...w, balance: 0 }));
        const initialFunds = (parsed.funds || DEFAULT_STATE.funds).map((f: any) => ({ ...f, currentAmount: 0 }));
        const initialGoals = (parsed.goals || DEFAULT_STATE.goals).map((g: any) => ({ ...g, currentAmount: 0 }));

        // Filter and keep only default wallets from saved state
        let wallets = [...(parsed.wallets || initialWallets)].filter(w => defaultIds.includes(w.id));

        // Ensure ALL default wallets are present
        DEFAULT_STATE.wallets.forEach(defW => {
          if (!wallets.some(w => w.id === defW.id)) {
            wallets.push({ ...defW, balance: 0 });
          }
        });

        // Ensure any default wallet has its name, icon, color, and category forced to DEFAULT_STATE.wallets values exactly
        wallets = wallets.map(w => {
          const defW = DEFAULT_STATE.wallets.find(dw => dw.id === w.id);
          if (defW) {
            return {
              ...w,
              name: defW.name,
              category: defW.category,
              color: defW.color,
              icon: defW.icon,
            };
          }
          return w;
        });

        // Filter transactions to only reference active default wallets or funds/reserves
        const transactions = ((parsed.transactions || []) as Transaction[]).filter(
          tx => (tx.walletId ? (defaultIds.includes(tx.walletId) || !tx.walletId.startsWith('w_')) : true) && 
                (tx.toWalletId ? (defaultIds.includes(tx.toWalletId) || !tx.toWalletId.startsWith('w_')) : true)
        );

        // Reset balances first for true recalculation
        wallets = wallets.map(w => ({ ...w, balance: 0 }));
        let funds = initialFunds;
        let goals = initialGoals;

        // Process transactions from oldest to newest
        const sortedTx = [...transactions].sort((a, b) => a.date - b.date);
        
        sortedTx.forEach(tx => {
          // Update Wallet
          wallets = wallets.map(w => {
            let bal = w.balance;
            if (tx.walletId && w.id === tx.walletId) {
              if (tx.type === 'income') bal += tx.amount;
              if (tx.type === 'expense') bal -= tx.amount;
              if (tx.type === 'transfer') bal -= tx.amount;
              if (tx.type === 'receivable') bal += tx.amount - (tx.paidAmount || 0);
              if (tx.type === 'liability') bal += tx.amount - (tx.paidAmount || 0);
            }
            if (tx.type === 'transfer' && tx.toWalletId && w.id === tx.toWalletId) {
              bal += tx.amount;
            }
            if (tx.type === 'liability' && tx.toWalletId && w.id === tx.toWalletId) {
              bal += tx.amount;
            }
            if (tx.type === 'receivable' || tx.type === 'liability') {
              if (tx.payouts && tx.payouts.length > 0) {
                tx.payouts.forEach(p => {
                  if (w.id === p.walletId) {
                    if (tx.type === 'receivable') bal += p.amount;
                    if (tx.type === 'liability') bal -= p.amount;
                  }
                });
              } else if (tx.paidAmount && tx.paidAmount > 0) {
                const isNewSystem = Array.isArray(tx.payouts);
                if (!isNewSystem) {
                  const assetWalletId = tx.toWalletId || 'w_physical';
                  if (w.id === assetWalletId) {
                    if (tx.type === 'receivable') bal += tx.paidAmount;
                    if (tx.type === 'liability') bal -= tx.paidAmount;
                  }
                }
              }
            }
            return { ...w, balance: bal };
          });

          // Update Funds & Goals
          // Source Fund (for transfers)
          if (tx.fromFundId) {
            funds = funds.map(f => {
              if (f.id === tx.fromFundId) {
                return { ...f, currentAmount: f.currentAmount - tx.amount };
              }
              return f;
            });
          }

          // Destination Fund / Linked Fund
          if (tx.fundId) {
            funds = funds.map(f => {
              if (f.id === tx.fundId) {
                let amt = f.currentAmount;
                if (tx.type === 'income') amt += tx.amount;
                if (tx.type === 'expense') amt -= tx.amount;
                if (tx.type === 'transfer') amt += tx.amount;
                return { ...f, currentAmount: amt };
              }
              return f;
            });
          }

          // Handle cases where a Fund/Reserve is used in toWalletId (e.g. transfers or receivable/payable destination)
          funds = funds.map(f => {
            let amt = f.currentAmount;
            if (tx.type === 'transfer' && tx.toWalletId && f.id === tx.toWalletId) {
              amt += tx.amount;
            }
            if (tx.type === 'liability' && tx.toWalletId && f.id === tx.toWalletId) {
              amt += tx.amount;
            }
            if (tx.type === 'receivable' || tx.type === 'liability') {
              if (tx.payouts && tx.payouts.length > 0) {
                tx.payouts.forEach(p => {
                  if (f.id === p.walletId) {
                    if (tx.type === 'receivable') amt += p.amount;
                    if (tx.type === 'liability') amt -= p.amount;
                  }
                });
              } else if (tx.paidAmount && tx.paidAmount > 0) {
                const isNewSystem = Array.isArray(tx.payouts);
                if (!isNewSystem) {
                  const assetWalletId = tx.toWalletId;
                  if (assetWalletId && f.id === assetWalletId) {
                    if (tx.type === 'receivable') amt += tx.paidAmount;
                    if (tx.type === 'liability') amt -= tx.paidAmount;
                  }
                }
              }
            }
            return { ...f, currentAmount: amt };
          });

          // Synchronize linked goals
          goals = goals.map(g => {
            if (g.linkedFundId) {
              const correspondingFund = funds.find(f => f.id === g.linkedFundId);
              if (correspondingFund) {
                return { ...g, currentAmount: correspondingFund.currentAmount };
              }
            }
            return g;
          });
        });

        // Automatically delete completed goals
        goals = goals.filter(g => g.currentAmount < g.targetAmount);

        parsed.wallets = wallets;
        parsed.funds = funds;
        parsed.goals = goals;
        parsed.categories = parsed.categories || INITIAL_CATEGORIES;

        // Migration: Remove the old placeholder goal if it exists
        if (parsed.goals) {
          parsed.goals = parsed.goals.filter((g: any) => g.id !== 'g1');
        }
        return parsed;
      } catch (e) {
        console.error('Failed to parse state', e);
      }
    }
    return DEFAULT_STATE;
  });

  useEffect(() => {
    localStorage.setItem('cashometry_v3', JSON.stringify(state));
  }, [state]);

  const [ledgerFilterType, setLedgerFilterType] = useState<'all' | TransactionType | 'reserve'>('all');
  const [ledgerStartDate, setLedgerStartDate] = useState<number | null>(null);
  const [ledgerEndDate, setLedgerEndDate] = useState<number | null>(null);

  const resetData = () => {
    if (confirm('Are you sure you want to purge all registry data? This action is irreversible.')) {
      setState(DEFAULT_STATE);
      localStorage.removeItem('cashometry_v3');
      localStorage.removeItem('finflow_v3');
      window.location.reload();
    }
  };

  const addWallet = (wallet: Omit<Wallet, 'id' | 'createdAt'>) => {
    // Only default wallets are permitted, do not allow adding custom wallets
    return;
  };

  const updateWallet = (id: string, wallet: Partial<Wallet>) => {
    if (id.startsWith('w_')) {
      const defW = DEFAULT_STATE.wallets.find(dw => dw.id === id);
      if (defW) {
        wallet = {
          ...wallet,
          name: defW.name,
          category: defW.category,
          color: defW.color,
          icon: defW.icon
        };
      }
    }
    setState(prev => ({
      ...prev,
      wallets: prev.wallets.map(w => w.id === id ? { ...w, ...wallet } : w)
    }));
  };

  const deleteWallet = (id: string) => {
    if (id.startsWith('w_')) {
      return; // Do not allow deleting system default wallets
    }
    setState(prev => ({
      ...prev,
      wallets: prev.wallets.filter(w => w.id !== id),
      transactions: prev.transactions.filter(t => t.walletId !== id && t.toWalletId !== id)
    }));
  };

  const addFund = (fund: Omit<Fund, 'id' | 'createdAt' | 'currentAmount'>) => {
    setState(prev => ({
      ...prev,
      funds: [...prev.funds, { ...fund, id: generateId(), currentAmount: 0, createdAt: Date.now() }]
    }));
  };

  const updateFund = (id: string, fund: Partial<Fund>) => {
    setState(prev => ({
      ...prev,
      funds: prev.funds.map(f => f.id === id ? { ...f, ...fund } : f)
    }));
  };

  const deleteFund = (id: string) => {
    setState(prev => ({
      ...prev,
      funds: prev.funds.filter(f => f.id !== id),
      goals: prev.goals.map(g => g.linkedFundId === id ? { ...g, linkedFundId: undefined } : g)
    }));
  };

  const addGoal = (goal: Omit<Goal, 'id' | 'createdAt' | 'currentAmount' | 'status' | 'linkedFundId'>) => {
    setState(prev => {
      const fundId = generateId();
      const newFund: Fund = {
        id: fundId,
        name: goal.title,
        targetAmount: goal.targetAmount,
        currentAmount: 0,
        category: 'Goal Reserve',
        color: '#8b5cf6', // Violet color identifier
        deadline: goal.deadline,
        createdAt: Date.now()
      };

      const newGoal: Goal = {
        ...goal,
        id: generateId(),
        currentAmount: 0,
        status: 'active',
        linkedFundId: fundId,
        createdAt: Date.now()
      };

      return {
        ...prev,
        funds: [...prev.funds, newFund],
        goals: [...prev.goals, newGoal]
      };
    });
  };

  const updateGoal = (id: string, goal: Partial<Goal>) => {
    setState(prev => ({
      ...prev,
      goals: prev.goals.map(g => g.id === id ? { ...g, ...goal } : g)
    }));
  };

  const deleteGoal = (id: string) => {
    setState(prev => ({
      ...prev,
      goals: prev.goals.filter(g => g.id !== id)
    }));
  };

  const reevaluateStateFromTransactions = (
    transactions: Transaction[],
    currentWallets: Wallet[],
    currentFunds: Fund[],
    currentGoals: Goal[]
  ) => {
    const DEFAULT_WALLETS = [
      { id: 'w_physical', name: 'Cash', balance: 0, category: 'Physical' as const, color: '#78716c', icon: 'Wallet', createdAt: Date.now() },
      { id: 'w_digital', name: 'E-Wallet', balance: 0, category: 'Digital' as const, color: '#0ea5e9', icon: 'Smartphone', createdAt: Date.now() },
      { id: 'w_bank', name: 'Bank Account', balance: 0, category: 'Bank' as const, color: '#10b981', icon: 'Building2', createdAt: Date.now() },
      { id: 'w_crypto', name: 'Cryptocurrency', balance: 0, category: 'Crypto' as const, color: '#f59e0b', icon: 'Bitcoin', createdAt: Date.now() },
      { id: 'w_cards', name: 'Cards', balance: 0, category: 'Cards' as const, color: '#ec4899', icon: 'CreditCard', createdAt: Date.now() },
      { id: 'w_receivable', name: 'Receivable', balance: 0, category: 'Receivable' as const, color: '#6366f1', icon: 'LendMoney', createdAt: Date.now() },
      { id: 'w_liability', name: 'Payable', balance: 0, category: 'Liability' as const, color: '#d97706', icon: 'ReturnLendMoney', createdAt: Date.now() },
    ];

    const defaultIds = DEFAULT_WALLETS.map(dw => dw.id);
    let wallets = currentWallets.filter(w => defaultIds.includes(w.id)).map(w => ({ ...w, balance: 0 }));
    if (wallets.length === 0) {
      wallets = DEFAULT_WALLETS;
    }

    // Ensure ALL default wallets are present
    DEFAULT_WALLETS.forEach(defW => {
      if (!wallets.some(w => w.id === defW.id)) {
        wallets.push({ ...defW, balance: 0 });
      }
    });

    // Ensure any default wallet has its name, icon, color, and category forced to DEFAULT_WALLETS values exactly
    wallets = wallets.map(w => {
      const defW = DEFAULT_WALLETS.find(dw => dw.id === w.id);
      if (defW) {
        return {
          ...w,
          name: defW.name,
          category: defW.category,
          color: defW.color,
          icon: defW.icon,
        };
      }
      return w;
    });

    let funds = currentFunds.map(f => ({ ...f, currentAmount: 0 }));
    let goals = currentGoals.map(g => ({ ...g, currentAmount: 0 }));

    const sortedTx = [...transactions].sort((a, b) => a.date - b.date);

    sortedTx.forEach(tx => {
      wallets = wallets.map(w => {
        let bal = w.balance;
        if (tx.walletId && w.id === tx.walletId) {
          if (tx.type === 'income') bal += tx.amount;
          if (tx.type === 'expense') bal -= tx.amount;
          if (tx.type === 'transfer') bal -= tx.amount;
          if (tx.type === 'receivable') bal += tx.amount - (tx.paidAmount || 0);
          if (tx.type === 'liability') bal += tx.amount - (tx.paidAmount || 0);
        }
        if (tx.type === 'transfer' && tx.toWalletId && w.id === tx.toWalletId) {
          bal += tx.amount;
        }
        if (tx.type === 'liability' && tx.toWalletId && w.id === tx.toWalletId) {
          bal += tx.amount;
        }
        if (tx.type === 'receivable' || tx.type === 'liability') {
          if (tx.payouts && tx.payouts.length > 0) {
            tx.payouts.forEach(p => {
              if (w.id === p.walletId) {
                if (tx.type === 'receivable') bal += p.amount;
                if (tx.type === 'liability') bal -= p.amount;
              }
            });
          } else if (tx.paidAmount && tx.paidAmount > 0) {
            const isNewSystem = Array.isArray(tx.payouts);
            if (!isNewSystem) {
              const assetWalletId = tx.toWalletId || 'w_physical';
              if (w.id === assetWalletId) {
                if (tx.type === 'receivable') bal += tx.paidAmount;
                if (tx.type === 'liability') bal -= tx.paidAmount;
              }
            }
          }
        }
        return { ...w, balance: bal };
      });

      if (tx.fromFundId) {
        funds = funds.map(f => f.id === tx.fromFundId ? { ...f, currentAmount: f.currentAmount - tx.amount } : f);
      }

      if (tx.fundId) {
        funds = funds.map(f => {
          if (f.id === tx.fundId) {
            let amt = f.currentAmount;
            if (tx.type === 'income') amt += tx.amount;
            if (tx.type === 'expense') amt -= tx.amount;
            if (tx.type === 'transfer') amt += tx.amount;
            return { ...f, currentAmount: amt };
          }
          return f;
        });
      }

      // Handle cases where a Fund/Reserve is used in toWalletId (e.g. transfers or receivable/payable destination)
      funds = funds.map(f => {
        let amt = f.currentAmount;
        if (tx.type === 'transfer' && tx.toWalletId && f.id === tx.toWalletId) {
          amt += tx.amount;
        }
        if (tx.type === 'liability' && tx.toWalletId && f.id === tx.toWalletId) {
          amt += tx.amount;
        }
        if (tx.type === 'receivable' || tx.type === 'liability') {
          if (tx.payouts && tx.payouts.length > 0) {
            tx.payouts.forEach(p => {
              if (f.id === p.walletId) {
                if (tx.type === 'receivable') amt += p.amount;
                if (tx.type === 'liability') amt -= p.amount;
              }
            });
          } else if (tx.paidAmount && tx.paidAmount > 0) {
            const isNewSystem = Array.isArray(tx.payouts);
            if (!isNewSystem) {
              const assetWalletId = tx.toWalletId;
              if (assetWalletId && f.id === assetWalletId) {
                if (tx.type === 'receivable') amt += tx.paidAmount;
                if (tx.type === 'liability') amt -= tx.paidAmount;
              }
            }
          }
        }
        return { ...f, currentAmount: amt };
      });

      // Synchronize linked goals
      goals = goals.map(g => {
        if (g.linkedFundId) {
          const correspondingFund = funds.find(f => f.id === g.linkedFundId);
          if (correspondingFund) {
            return { ...g, currentAmount: correspondingFund.currentAmount };
          }
        }
        return g;
      });
    });

    // Automatically delete completed goals
    goals = goals.filter(g => g.currentAmount < g.targetAmount);

    return { wallets, funds, goals };
  };

  const addTransaction = (tx: Omit<Transaction, 'id'>) => {
    const id = generateId();
    const newTx = { ...tx, id };

    setState(prev => {
      const nextTransactions = [newTx, ...prev.transactions];
      const reevaluated = reevaluateStateFromTransactions(nextTransactions, prev.wallets, prev.funds, prev.goals);
      return {
        ...prev,
        ...reevaluated,
        transactions: nextTransactions
      };
    });
  };

  const updateTransaction = (id: string, updatedFields: Partial<Transaction>) => {
    setState(prev => {
      const nextTransactions = prev.transactions.map(t => 
        t.id === id ? { ...t, ...updatedFields } : t
      );
      const reevaluated = reevaluateStateFromTransactions(nextTransactions, prev.wallets, prev.funds, prev.goals);
      return {
        ...prev,
        ...reevaluated,
        transactions: nextTransactions
      };
    });
  };

  const deleteTransaction = (id: string) => {
    setState(prev => {
      const nextTransactions = prev.transactions.filter(t => t.id !== id);
      const reevaluated = reevaluateStateFromTransactions(nextTransactions, prev.wallets, prev.funds, prev.goals);
      return {
        ...prev,
        ...reevaluated,
        transactions: nextTransactions
      };
    });
  };

  const addCategory = (category: Omit<Category, 'id'>) => {
    setState(prev => {
      const id = generateId();
      const newCategory = { ...category, id };
      return {
        ...prev,
        categories: [...prev.categories, newCategory]
      };
    });
  };

  return (
    <FinanceContext.Provider value={{
      ...state,
      addWallet,
      updateWallet,
      deleteWallet,
      addFund,
      updateFund,
      deleteFund,
      addGoal,
      updateGoal,
      deleteGoal,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addCategory,
      resetData,
      ledgerFilterType,
      setLedgerFilterType,
      ledgerStartDate,
      setLedgerStartDate,
      ledgerEndDate,
      setLedgerEndDate
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
