import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFinance } from '../context/FinanceContext';
import { Transaction, TransactionType } from '../types';
import { formatCurrency, generateId } from '../lib/utils';
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  ArrowLeftRight,
  MoreVertical,
  ChevronDown,
  X,
  Calendar,
  FileText,
  Trash2,
  Clock,
  Check,
  Folder,
  HardDrive,
  Download,
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

const TransactionsPage: React.FC = () => {
  const { 
    transactions, 
    wallets, 
    funds, 
    addTransaction, 
    deleteTransaction, 
    categories,
    addCategory,
    ledgerFilterType,
    setLedgerFilterType,
    ledgerStartDate,
    setLedgerStartDate,
    ledgerEndDate,
    setLedgerEndDate
  } = useFinance();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const showTime = true; // Always show time automatically per request

  // Export Wizard states
  const [isExportWizardOpen, setIsExportWizardOpen] = useState(false);
  const [exportStep, setExportStep] = useState<1 | 2>(1);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'xlsx'>('xlsx');
  const [exportTimeline, setExportTimeline] = useState<'all' | 'this_month' | 'last_30' | 'custom'>('all');
  const [exportStartDate, setExportStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return format(d, "yyyy-MM-dd");
  });
  const [exportEndDate, setExportEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [exportLocation, setExportLocation] = useState('/storage/emulated/0/Download/Cashometry/');
  const [exportFileName, setExportFileName] = useState('');
  const [showExportToast, setShowExportToast] = useState(false);
  const [exportToastMessage, setExportToastMessage] = useState('');

  const handleOpenExportWizard = () => {
    setExportStep(1);
    setExportFormat('xlsx');
    setExportTimeline('all');
    setExportFileName(`cashometry_ledger_${format(new Date(), 'yyyyMMdd_HHmm')}`);
    setIsExportWizardOpen(true);
  };

  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [customCategoryColor, setCustomCategoryColor] = useState('#10b981');
  const [customCategoryIcon, setCustomCategoryIcon] = useState('Tag');

  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense' as TransactionType,
    category: 'Food',
    walletId: wallets[0]?.id || '',
    fromFundId: '',
    toWalletId: '',
    fundId: '',
    sourceType: 'wallet' as 'wallet' | 'fund',
    transferDestination: 'wallet' as 'wallet' | 'fund',
    note: '',
    purpose: '',
    receivableSubtype: 'income' as 'income' | 'lended_money' | 'others',
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm")
  });

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

  const allDisplayTransactions = useMemo(() => {
    const list: (Transaction & { isVirtual?: boolean })[] = [...transactions];
    transactions.forEach(tx => {
      if ((tx.type === 'receivable' || tx.type === 'liability') && tx.payouts) {
        tx.payouts.forEach((p, idx) => {
          list.push({
            id: `${tx.id}-payout-${idx}`,
            amount: p.amount,
            type: tx.type === 'receivable' ? 'income' : 'expense',
            category: tx.type === 'receivable' ? 'Receivable Collection' : 'Liability Repayment',
            walletId: p.walletId,
            note: `Settlement for: ${tx.note || tx.purpose || 'debt'}`,
            purpose: tx.purpose,
            date: p.date,
            isVirtual: true
          });
        });
      }
    });
    return list.sort((a, b) => b.date - a.date);
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return allDisplayTransactions.filter(tx => {
      const matchesSearch = tx.note.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           tx.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (tx.purpose && tx.purpose.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = ledgerFilterType === 'all' || 
                          (ledgerFilterType === 'reserve' ? (tx.fundId || tx.fromFundId) : tx.type === ledgerFilterType);
      const matchesDate = (!ledgerStartDate || tx.date >= ledgerStartDate) &&
                          (!ledgerEndDate || tx.date <= ledgerEndDate);
      return matchesSearch && matchesType && matchesDate;
    });
  }, [allDisplayTransactions, searchQuery, ledgerFilterType, ledgerStartDate, ledgerEndDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const isTransfer = formData.type === 'transfer';
    const isIncome = formData.type === 'income';
    const isExpense = formData.type === 'expense';
    const isSourceFund = formData.sourceType === 'fund';
    const isTargetFund = formData.transferDestination === 'fund';

    addTransaction({
      amount: parseFloat(formData.amount),
      type: formData.type,
      category: isTransfer ? 'Transfer' : formData.category,
      // Wallet ID is only used if source is wallet
      walletId: formData.sourceType === 'wallet' ? formData.walletId : undefined,
      // fromFundId is ONLY used for transfers OUT of a fund
      fromFundId: (isTransfer && isSourceFund) ? formData.fromFundId : undefined,
      // Target Wallet for transfers, or initial wallet for receivable/liability
      toWalletId: isTransfer 
        ? (formData.transferDestination === 'wallet' ? formData.toWalletId : undefined)
        : (formData.type === 'receivable' || formData.type === 'liability')
          ? formData.toWalletId
          : undefined,
      // Fund ID is used for:
      // 1. Target of a transfer (if target is fund)
      // 2. Direct income/expense to a fund (if source is fund)
      fundId: isTransfer 
        ? (isTargetFund ? formData.fundId : undefined)
        : (isSourceFund ? formData.fromFundId : undefined),
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
      fromFundId: '',
      toWalletId: '',
      fundId: '',
      sourceType: 'wallet' as 'wallet' | 'fund',
      transferDestination: 'wallet' as 'wallet' | 'fund',
      note: '',
      purpose: '',
      receivableSubtype: 'income',
      date: format(new Date(), "yyyy-MM-dd'T'HH:mm")
    });
  };

  const handleConfirmExport = () => {
    // 1. Determine timeline window select
    let startTs = 0;
    let endTs = Date.now();

    if (exportTimeline === 'this_month') {
      const d = new Date();
      startTs = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    } else if (exportTimeline === 'last_30') {
      startTs = Date.now() - 30 * 24 * 60 * 60 * 1000;
    } else if (exportTimeline === 'custom') {
      startTs = new Date(exportStartDate + 'T00:00:00').getTime();
      endTs = new Date(exportEndDate + 'T23:59:59').getTime();
    }

    const txsToExport = transactions
      .filter(t => t.date >= startTs && t.date <= endTs)
      .sort((a, b) => b.date - a.date);

    const extension = exportFormat === 'xlsx' ? 'xlsx' : 'html';
    const finalFileName = `${exportFileName || 'ledger_backup'}.${extension}`;
    const fullSavedPath = `${exportLocation.endsWith('/') ? exportLocation : exportLocation + '/'}${finalFileName}`;

    let mainContent = '';
    let mimeType = '';

    if (exportFormat === 'xlsx') {
      // Build native-like MS Excel XML Spreadsheet. When opened, it renders beautifully styled tabular rows
      const sheetRows = txsToExport.map(tx => {
        const walletName = wallets.find(w => w.id === tx.walletId)?.name || 'Unknown';
        const dateStr = format(tx.date, 'yyyy-MM-dd HH:mm');
        const cleanNote = (tx.note || '').replace(/[&<>'"]/g, tag => ({
          '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        }[tag] || tag));
        const cleanCat = (tx.category || '').replace(/[&<>'"]/g, tag => ({
          '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        }[tag] || tag));
        
        return `
        <tr>
          <td style="padding: 8px; border: 1px solid #E4E4E7; font-family: monospace;">${dateStr}</td>
          <td style="padding: 8px; border: 1px solid #E4E4E7; font-weight: bold; text-transform: uppercase;">${tx.type}</td>
          <td style="padding: 8px; border: 1px solid #E4E4E7;">${cleanCat}</td>
          <td style="padding: 8px; border: 1px solid #E4E4E7;">${walletName}</td>
          <td style="padding: 8px; border: 1px solid #E4E4E7; text-align: right; font-family: monospace; font-weight: bold;">${tx.amount.toFixed(2)}</td>
          <td style="padding: 8px; border: 1px solid #E4E4E7;">${cleanNote}</td>
        </tr>`;
      }).join('\n');

      mainContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>Cashometry Ledger</x:Name>
                  <x:WorksheetOptions>
                    <x:DisplayGridlines/>
                  </x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
          <style>
            body { font-family: 'Segoe UI', sans-serif; margin: 20px; }
            th { background-color: #000000; color: #ffffff; font-weight: bold; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; }
            td { font-size: 11px; }
          </style>
        </head>
        <body>
          <h2 style="font-family: sans-serif; font-size: 18px; margin-bottom: 5px; font-weight: 900; letter-spacing: -0.5px;">CASHOMETRY FINANCIAL LEDGER</h2>
          <p style="font-size: 11px; color: #71717A; margin-top: 0; margin-bottom: 20px;">Export Destination: ${fullSavedPath} | Date: ${format(new Date(), 'yyyy-MM-dd HH:mm')}</p>
          <table style="border-collapse: collapse; width: 100%;">
            <thead>
              <tr style="background-color: #000000; color: #ffffff;">
                <th style="padding: 10px; border: 1px solid #000000; text-align: left;">Timestamp</th>
                <th style="padding: 10px; border: 1px solid #000000; text-align: left;">Type</th>
                <th style="padding: 10px; border: 1px solid #000000; text-align: left;">Category Tag</th>
                <th style="padding: 10px; border: 1px solid #000000; text-align: left;">Wallet / Asset</th>
                <th style="padding: 10px; border: 1px solid #000000; text-align: right;">Amount ($)</th>
                <th style="padding: 10px; border: 1px solid #000000; text-align: left;">Notes</th>
              </tr>
            </thead>
            <tbody>
              ${sheetRows || '<tr><td colspan="6" style="padding: 20px; text-align: center; color: #9CA3AF;">No records matched standard query</td></tr>'}
            </tbody>
          </table>
        </body>
      </html>`;
      
      mimeType = 'application/vnd.ms-excel';

    } else {
      // PDF mode formatted beautifully inside HTML view, triggering printing-to-PDF offline
      const totalInflow = txsToExport.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const totalOutflow = txsToExport.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
      const netOps = totalInflow - totalOutflow;

      const pdfRows = txsToExport.map(tx => {
        const walletName = wallets.find(w => w.id === tx.walletId)?.name || 'Unknown';
        const dateStr = format(tx.date, 'MMM dd, yyyy HH:mm');
        const isInc = tx.type === 'income';
        const isExp = tx.type === 'expense';
        const cleanNote = (tx.note || '-').replace(/[&<>'"]/g, tag => ({
          '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        }[tag] || tag));
        const cleanCat = (tx.category || '').replace(/[&<>'"]/g, tag => ({
          '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        }[tag] || tag));

        return `
        <tr style="border-bottom: 1px solid #E5E7EB;">
          <td style="padding: 12px 8px; font-size: 11px; font-family: monospace; color: #4B5563;">${dateStr}</td>
          <td style="padding: 12px 8px; font-size: 11px; font-weight: bold; text-transform: uppercase; color: ${isInc ? '#10B981' : isExp ? '#EF4444' : '#3B82F6'}">${tx.type}</td>
          <td style="padding: 12px 8px; font-size: 11px; color: #1F2937; font-weight: 500;">${cleanCat}</td>
          <td style="padding: 12px 8px; font-size: 11px; color: #4B5563;">${walletName}</td>
          <td style="padding: 12px 8px; font-size: 11px; text-align: right; font-family: monospace; font-weight: bold; color: ${isInc ? '#10B981' : isExp ? '#EF4444' : '#111827'}">$${tx.amount.toFixed(2)}</td>
          <td style="padding: 12px 8px; font-size: 11px; color: #6B7280; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${cleanNote}</td>
        </tr>`;
      }).join('\n');

      mainContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${exportFileName}</title>
          <style>
            @media print {
              body { background: white; color: black; }
              .no-print { display: none; }
            }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
              color: #1F2937; 
              margin: 40px auto; 
              max-width: 800px;
              padding: 0 20px;
            }
            .header-bar {
              border-bottom: 3px solid #111827;
              padding-bottom: 20px;
              margin-bottom: 30px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
              margin-bottom: 40px;
            }
            .meta-card {
              background-color: #F9FAFB;
              border: 1px solid #E5E7EB;
              border-radius: 12px;
              padding: 15px;
              text-align: center;
            }
            .table-ledger {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            .table-ledger th {
              background-color: #111827;
              color: white;
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              padding: 12px 8px;
              text-align: left;
            }
          </style>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            }
          </script>
        </head>
        <body>
          <div class="header-bar">
            <div>
              <h1 style="margin: 0; font-size: 26px; font-weight: 900; tracking-tight: -0.05em; text-transform: uppercase;">CASHOMETRY SUMMARY REPORT</h1>
              <p style="margin: 4px 0 0 0; font-size: 11px; font-weight: bold; color: #6B7280; text-transform: uppercase; letter-spacing: 0.15em;">Financial Atomic Ledger Summary</p>
            </div>
            <div style="text-align: right;">
              <p style="margin: 0; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">Export Storage Location</p>
              <p style="margin: 4px 0 0 0; font-family: monospace; font-size: 10px; color: #4B5563;">${fullSavedPath}</p>
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-card">
              <p style="margin: 0; font-size: 10px; font-weight: 800; color: #6B7280; text-transform: uppercase; letter-spacing: 0.1em;">Total Inbound</p>
              <p style="margin: 6px 0 0 0; font-size: 18px; font-weight: 900; color: #10B981; font-family: monospace;">$${totalInflow.toFixed(2)}</p>
            </div>
            <div class="meta-card">
              <p style="margin: 0; font-size: 10px; font-weight: 800; color: #6B7280; text-transform: uppercase; letter-spacing: 0.1em;">Total Outbound</p>
              <p style="margin: 6px 0 0 0; font-size: 18px; font-weight: 900; color: #EF4444; font-family: monospace;">$${totalOutflow.toFixed(2)}</p>
            </div>
            <div class="meta-card" style="border-color: #111827; background-color: #111827; color: white;">
              <p style="margin: 0; font-size: 10px; font-weight: 800; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.1em;">Net Operations</p>
              <p style="margin: 6px 0 0 0; font-size: 18px; font-weight: 900; color: #F3F4F6; font-family: monospace;">$${netOps.toFixed(2)}</p>
            </div>
          </div>

          <p style="font-size: 12px; font-weight: bold; color: #374151; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.05em;">Record entries: ${txsToExport.length} transactions included</p>
          <table class="table-ledger">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Type</th>
                <th>Category</th>
                <th>Asset / Wallet</th>
                <th style="text-align: right;">Amount</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              ${pdfRows || '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #9CA3AF;">No data available for the chosen range</td></tr>'}
            </tbody>
          </table>

          <div style="margin-top: 50px; text-align: center; border-top: 1px solid #E5E7EB; padding-top: 20px;" class="no-print">
            <button onclick="window.print()" style="background-color: #111827; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-size: 12px; font-weight: bold; cursor: pointer; text-transform: uppercase; letter-spacing: 1px;">
              Print Ledger / Export to PDF
            </button>
            <p style="font-size: 11px; color: #9CA3AF; margin-top: 8px;">Opening print view offline automatically. Click "Save as PDF" relative to your device destination.</p>
          </div>
        </body>
      </html>`;
      
      mimeType = 'text/html';
    }

    // Attempt universal triggers for maximum fallback compatibility
    try {
      // 1. Try traditional download Blob Object URL channel
      const blob = new Blob([mainContent], { type: `${mimeType};charset=utf-8` });
      const url = URL.createObjectURL(blob);
      const link1 = document.createElement("a");
      link1.setAttribute("href", url);
      link1.setAttribute("download", finalFileName);
      document.body.appendChild(link1);
      link1.click();
      document.body.removeChild(link1);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn("Blob URL failed, falling back to Base64 data URL", e);
    }

    try {
      // 2. Try raw base64 Data URL channel (often intercepted on simple Android WebViews which block Blob URLs)
      const base64Content = window.btoa(unescape(encodeURIComponent(mainContent)));
      const dataUri = `data:${mimeType};base64,${base64Content}`;
      const link2 = document.createElement("a");
      link2.setAttribute("href", dataUri);
      link2.setAttribute("download", finalFileName);
      document.body.appendChild(link2);
      link2.click();
      document.body.removeChild(link2);
    } catch (e) {
      console.warn("Base64 Data URL download failed", e);
    }

    // 3. Put full formatted text backup on clipboard automatically as an ultimate secure failsafe
    try {
      navigator.clipboard.writeText(mainContent);
    } catch (cl) {
      // clip board write failed
    }

    // Close configuration step
    setIsExportWizardOpen(false);
    setExportToastMessage(`Saved to ${exportLocation}${finalFileName}! Failsafe copied to clipboard.`);
    setShowExportToast(true);

    setTimeout(() => {
      setShowExportToast(false);
    }, 4500);
  };

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isModalOpen]);

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
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between pt-[15px]">
        <div className="space-y-1">
          <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-center lg:text-left">Financial Ledger</h1>
          <p className="text-[10px] lg:text-xs font-mono uppercase tracking-[0.2em] text-brand-gray-400 text-center lg:text-left">Atomic Transaction Logging</p>
        </div>
        <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 lg:gap-4">
          <button 
            onClick={handleOpenExportWizard}
            className="interactive-button flex h-14 items-center justify-center gap-3 rounded-[2rem] border border-brand-gray-200 bg-white px-6 lg:px-8 text-xs lg:text-sm font-black uppercase tracking-widest transition-all hover:border-black"
          >
            <Download className="h-5 w-5" />
            <span className="hidden xs:inline">Export Ledger</span>
            <span className="xs:hidden">Export</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="interactive-button flex h-14 items-center justify-center gap-3 rounded-[2rem] bg-black px-8 lg:px-10 text-xs lg:text-sm font-black uppercase tracking-widest text-white shadow-2xl shadow-black/20"
          >
            <Plus className="h-5 lg:h-6 w-5 lg:w-6" />
            Append Record
          </button>
        </div>
      </div>

      {/* Ledger Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
        {[
          { label: 'Total Inflow', icon: ArrowUpRight, value: formatCurrency(transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0)), color: 'emerald' },
          { label: 'Total Outflow', icon: ArrowDownRight, value: formatCurrency(transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0)), color: 'rose' },
          { label: 'Net Operations', icon: FileText, value: formatCurrency(transactions.reduce((acc, t) => acc + (t.type === 'income' ? t.amount : t.type === 'expense' ? -t.amount : 0), 0)), color: 'sky' }
        ].map((stat, idx) => (
          <motion.div 
            key={idx}
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.2 }}
            whileHover={hoverScale}
            className={cn("glass-card p-6 lg:p-8 group overflow-hidden relative", `color-glow-${stat.color}`, idx === 2 && "sm:col-span-2 md:col-span-1")}
          >
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-0.5 lg:space-y-1 text-center sm:text-left">
                <p className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-brand-gray-400">{stat.label}</p>
                <p className="text-xl lg:text-2xl font-black tracking-tight font-mono">{stat.value}</p>
              </div>
              <div className={cn("hidden xs:flex h-10 w-10 lg:h-12 lg:w-12 rounded-[1rem] lg:rounded-2xl items-center justify-center bg-brand-gray-50 transition-all group-hover:scale-110", `text-${stat.color}-500 group-hover:bg-black group-hover:text-white`)}>
                <stat.icon className="h-5 w-5 lg:h-6 lg:w-6" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters Bar */}
      <motion.div 
        variants={itemVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.2 }}
        className="glass-card flex flex-col gap-4 lg:gap-6 rounded-[2rem] p-4 lg:p-6 sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-gray-400" />
          <input 
            type="text" 
            placeholder="Search identifiers..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="h-12 lg:h-14 w-full rounded-2xl border border-brand-gray-100 bg-brand-gray-50/50 pl-12 pr-6 text-sm font-medium focus:border-black focus:bg-white focus:outline-none transition-all"
          />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="flex flex-wrap items-center justify-center gap-1.5 bg-brand-gray-50 p-1.5 rounded-2xl border border-brand-gray-100">
            {['all', 'income', 'expense', 'transfer', 'receivable', 'liability', 'reserve'].map(type => (
              <button
                key={type}
                onClick={() => setLedgerFilterType(type as any)}
                className={cn(
                  "h-9 lg:h-11 px-4 lg:px-6 rounded-xl text-[10px] lg:text-xs font-black uppercase tracking-widest transition-all",
                  ledgerFilterType === type 
                    ? "bg-black text-white shadow-lg" 
                    : "text-brand-gray-400 hover:text-black hover:bg-white"
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Active Timeline Filter Info */}
      {(ledgerStartDate || ledgerEndDate) && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between px-6 py-4 rounded-[1.5rem] bg-indigo-50 border border-indigo-100 text-indigo-800 text-xs font-bold"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="font-sans font-medium text-brand-black">
              Active Timeline Filter: {' '}
              <span className="font-mono bg-white px-2 py-0.5 rounded-md border border-brand-gray-100 text-slate-800">
                {ledgerStartDate && format(ledgerStartDate, 'MMM dd, yyyy')} 
                {ledgerStartDate && ledgerEndDate && ' — '} 
                {ledgerEndDate && format(ledgerEndDate, 'MMM dd, yyyy')}
              </span>
            </span>
          </div>
          <button 
            onClick={() => {
              setLedgerStartDate(null);
              setLedgerEndDate(null);
              setLedgerFilterType('all');
            }} 
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border border-brand-gray-100 hover:border-red-200 transition-all font-black uppercase tracking-widest text-[9px] shadow-sm cursor-pointer"
          >
            Clear Filter
          </button>
        </motion.div>
      )}

      {/* Transactions List */}
      <div className="glass-card overflow-hidden rounded-[2rem] lg:rounded-[2.5rem]">
        <div className="overflow-x-auto overflow-y-auto scrollbar-hide max-h-[650px] relative">
          <table className="w-full text-left border-collapse min-w-[800px] lg:min-w-0">
            <thead className="sticky top-0 z-20 bg-brand-gray-50/95 backdrop-blur-md shadow-sm">
              <tr className="border-b border-brand-gray-100">
                <th className="px-6 lg:px-8 py-5 lg:py-6 text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">Timestamp & Identifier</th>
                <th className="px-6 lg:px-8 py-5 lg:py-6 text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">Classification</th>
                <th className="px-6 lg:px-8 py-5 lg:py-6 text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">Wallet / Reserve</th>
                <th className="px-6 lg:px-8 py-5 lg:py-6 text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400 text-right">Amount</th>
                <th className="pl-[20px] pr-6 lg:pl-[20px] lg:pr-8 py-5 lg:py-6 text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-gray-50">
              {filteredTransactions.length > 0 ? filteredTransactions.map((tx, idx) => {
                const wallet = wallets.find(w => w.id === tx.walletId);
                const toWallet = tx.toWalletId ? wallets.find(w => w.id === tx.toWalletId) : null;
                
                return (
                  <motion.tr 
                    key={tx.id} 
                    variants={itemVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: false, amount: 0.05 }}
                    whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                    className="group transition-all hover:bg-brand-gray-50/50 cursor-pointer"
                  >
                    <td className="px-6 lg:px-8 py-5 lg:py-6">
                      <div className="flex items-center gap-4 lg:gap-5">
                        <div className={cn(
                          "flex h-12 w-12 lg:h-14 lg:w-14 shrink-0 items-center justify-center rounded-xl lg:rounded-2xl border transition-all duration-500 transform group-hover:rotate-6",
                          tx.type === 'income' ? "bg-emerald-50 border-emerald-100 text-emerald-600 shadow-sm" : 
                          tx.type === 'expense' ? "bg-brand-gray-50 border-brand-gray-100 text-black shadow-sm" :
                          "bg-sky-50 border-sky-100 text-sky-600 shadow-sm"
                        )}>
                          {tx.type === 'income' ? <ArrowUpRight className="h-6 w-6 lg:h-7 lg:w-7" /> : 
                           tx.type === 'expense' ? <ArrowDownRight className="h-6 w-6 lg:h-7 lg:w-7" /> :
                           <ArrowLeftRight className="h-6 w-6 lg:h-7 lg:w-7" />}
                        </div>
                        <div>
                          <p className="text-sm lg:text-base font-bold tracking-tight text-brand-gray-700 truncate max-w-[150px] lg:max-w-none">{tx.note || 'Unspecified Event'}</p>
                          <p className="text-[9px] lg:text-[10px] font-mono text-brand-gray-400 uppercase tracking-widest mt-0.5">
                            {format(tx.date, showTime ? 'MMM dd, yyyy • HH:mm' : 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 lg:px-8 py-5 lg:py-6">
                      {(tx.type !== 'receivable' && tx.type !== 'liability') ? (
                        <span className={cn(
                          "inline-flex rounded-xl px-3 lg:px-4 py-1.5 lg:py-2 text-[9px] lg:text-[10px] font-black uppercase tracking-widest border",
                          tx.type === 'income' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                          tx.type === 'expense' ? "bg-brand-gray-50 text-brand-gray-500 border-brand-gray-100" :
                          "bg-sky-50 text-sky-600 border-sky-100"
                        )}>
                          {tx.category}
                        </span>
                      ) : (
                        <div className="flex flex-col items-start gap-1">
                          <span className={cn(
                            "inline-flex rounded-xl px-3 lg:px-4 py-1.5 lg:py-2 text-[9px] lg:text-[10px] font-black uppercase tracking-widest border",
                            tx.type === 'receivable' ? "bg-indigo-50 text-indigo-600 border-indigo-100" : 
                            "bg-amber-50 text-amber-600 border-amber-100"
                          )}>
                            {tx.type}
                          </span>
                          {tx.purpose && (
                            <span className="text-[10px] font-bold text-brand-gray-500">{tx.purpose}</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 lg:px-8 py-5 lg:py-6">
                      <div className="flex items-center gap-2 lg:gap-3">
                        <span className="text-[10px] lg:text-xs font-bold font-mono tracking-tight text-brand-gray-600 truncate max-w-[120px] lg:max-w-none">
                          {tx.fromFundId 
                            ? (funds.find(f => f.id === tx.fromFundId)?.name || 'Reserve') 
                            : (wallet?.name || (funds.find(f => f.id === tx.fundId)?.name) || 'Unknown')}
                        </span>
                        {tx.type === 'transfer' && (
                          <>
                            <ArrowLeftRight className="h-3 w-3 lg:h-4 lg:w-4 text-brand-gray-300" />
                            <span className="text-[10px] lg:text-xs font-bold font-mono tracking-tight text-brand-gray-600 truncate max-w-[120px] lg:max-w-none">
                              {tx.toWalletId ? (toWallet?.name || 'Vault') : (funds.find(f => f.id === tx.fundId)?.name || 'Reserve')}
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 lg:px-8 py-5 lg:py-6 text-right">
                      <p className={cn(
                        "text-lg lg:text-xl font-black tracking-tighter font-mono",
                        tx.type === 'income' ? "text-emerald-600" : 
                        tx.type === 'expense' ? "text-black" : "text-sky-600"
                      )}>
                        {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                        {formatCurrency(tx.amount)}
                      </p>
                    </td>
                    <td className="px-6 lg:px-8 py-5 lg:py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!(tx as any).isVirtual ? (
                          <button 
                            onClick={() => deleteTransaction(tx.id)}
                            className="rounded-xl p-2.5 lg:p-3 text-brand-gray-400 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-100 transition-all"
                          >
                            <Trash2 className="h-4 w-4 lg:h-5 lg:w-5" />
                          </button>
                        ) : (
                          <span className="text-[9px] font-black uppercase tracking-wider text-brand-gray-400 bg-brand-gray-50 px-2.5 py-1 rounded-md">Settled</span>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 lg:py-24 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <Search className="h-10 lg:h-12 w-10 lg:w-12 text-brand-gray-200" />
                      <p className="text-xs lg:text-sm font-medium text-brand-gray-400 italic">Static Ledger - No Entries Matching Criteria</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
                            sourceType: (type === 'receivable' || type === 'liability') ? 'wallet' : formData.sourceType,
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
                      <div className={cn("space-y-6", formData.type === 'receivable' && "md:col-span-2")}>
                        {(formData.type !== 'receivable' && formData.type !== 'liability') && (
                          <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">
                              {formData.type === 'transfer' ? 'Source Wallet' : 'Primary Wallet'}
                            </label>
                            <div className="flex p-1.5 bg-brand-gray-50 rounded-xl border border-brand-gray-100 w-full">
                              <button
                                type="button"
                                onClick={() => setFormData({ 
                                  ...formData, 
                                  sourceType: 'wallet',
                                  walletId: wallets[0]?.id || ''
                                })}
                                className={cn(
                                  "flex-1 px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                                  formData.sourceType === 'wallet' ? "bg-black text-white shadow-md" : "text-brand-gray-400 hover:text-black"
                                )}
                              >
                                Vault
                              </button>
                              <button
                                type="button"
                                onClick={() => setFormData({ 
                                  ...formData, 
                                  sourceType: 'fund',
                                  fromFundId: funds[0]?.id || ''
                                })}
                                className={cn(
                                  "flex-1 px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                                  formData.sourceType === 'fund' ? "bg-black text-white shadow-md" : "text-brand-gray-400 hover:text-black"
                                )}
                              >
                                Reserve
                              </button>
                            </div>
                          </div>
                        )}

                        {formData.sourceType === 'wallet' ? (
                          <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">
                              {formData.type === 'receivable' ? 'Receivable Wallet' : formData.type === 'liability' ? 'Liability Wallet' : 'Source Wallet / Reserve'}
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
                                {(() => {
                                  let list = wallets;
                                  if (formData.type === 'receivable') {
                                    list = wallets.filter(w => w.category === 'Receivable');
                                  } else if (formData.type === 'liability') {
                                    list = wallets.filter(w => w.category === 'Liability');
                                  } else {
                                    list = wallets.filter(w => w.category !== 'Receivable' && w.category !== 'Liability');
                                  }
                                  return list.map(w => <option key={w.id} value={w.id}>{w.name} (${w.balance})</option>);
                                })()}
                              </select>
                              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-brand-gray-400">
                                <ChevronDown className="h-4 w-4" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="relative">
                              <select 
                                required
                                value={formData.fromFundId}
                                onChange={e => setFormData({ ...formData, fromFundId: e.target.value })}
                                className="w-full rounded-2xl border border-brand-gray-200 bg-brand-gray-50 pl-6 pr-12 py-4 text-sm font-bold focus:bg-white focus:border-black focus:outline-none transition-all appearance-none cursor-pointer"
                              >
                                <option value="">Select Reserve</option>
                                {funds.map(f => <option key={f.id} value={f.id}>{f.name} (${f.currentAmount})</option>)}
                              </select>
                              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-brand-gray-400">
                                <ChevronDown className="h-4 w-4" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {formData.type === 'transfer' ? (
                        <div className="space-y-6">
                          <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">Target Wallet</label>
                            <div className="flex p-1.5 bg-brand-gray-50 rounded-xl border border-brand-gray-100 w-full">
                              <button
                                type="button"
                                onClick={() => setFormData({ 
                                  ...formData, 
                                  transferDestination: 'wallet',
                                  toWalletId: wallets.find(w => w.id !== formData.walletId)?.id || ''
                                })}
                                className={cn(
                                  "flex-1 px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                                  formData.transferDestination === 'wallet' ? "bg-black text-white shadow-md" : "text-brand-gray-400 hover:text-black"
                                )}
                              >
                                Vault
                              </button>
                              <button
                                type="button"
                                onClick={() => setFormData({ 
                                  ...formData, 
                                  transferDestination: 'fund',
                                  fundId: funds.find(f => f.id !== formData.fromFundId)?.id || ''
                                })}
                                className={cn(
                                  "flex-1 px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                                  formData.transferDestination === 'fund' ? "bg-black text-white shadow-md" : "text-brand-gray-400 hover:text-black"
                                )}
                              >
                                Reserve
                              </button>
                            </div>
                          </div>

                          {formData.transferDestination === 'wallet' ? (
                            <div className="space-y-3">
                              <div className="relative">
                                <select 
                                  required
                                  value={formData.toWalletId}
                                  onChange={e => setFormData({ ...formData, toWalletId: e.target.value })}
                                  className="w-full rounded-2xl border border-brand-gray-200 bg-brand-gray-50 pl-6 pr-12 py-4 text-sm font-bold focus:bg-white focus:border-black focus:outline-none transition-all appearance-none cursor-pointer"
                                >
                                  <option value="">Select Wallet / Vault</option>
                                  {wallets.filter(w => w.id !== formData.walletId).map(w => (
                                    <option key={w.id} value={w.id}>{w.name} (${w.balance})</option>
                                  ))}
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-brand-gray-400">
                                  <ChevronDown className="h-4 w-4" />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="relative">
                                <select 
                                  required
                                  value={formData.fundId}
                                  onChange={e => setFormData({ ...formData, fundId: e.target.value })}
                                  className="w-full rounded-2xl border border-brand-gray-200 bg-brand-gray-50 pl-6 pr-12 py-4 text-sm font-bold focus:bg-white focus:border-black focus:outline-none transition-all appearance-none cursor-pointer"
                                >
                                  <option value="">Select Reserve</option>
                                  {funds.filter(f => f.id !== formData.fromFundId).map(f => (
                                    <option key={f.id} value={f.id}>{f.name} (${f.currentAmount})</option>
                                  ))}
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-brand-gray-400">
                                  <ChevronDown className="h-4 w-4" />
                                </div>
                              </div>
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
                      ) : (
                        <>
                          {(formData.type !== 'receivable' && formData.type !== 'liability') && (
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
                          {(formData.type === 'receivable' || formData.type === 'liability') && (
                            <>
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
                              {formData.type === 'receivable' && (
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
                              )}
                              {formData.type === 'liability' && (
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
                              )}
                            </>
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
                        </>
                      )}
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

      {/* EXPORT DATA WIZARD MODAL */}
      {createPortal(
        <AnimatePresence>
          {isExportWizardOpen && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm">
              <div className="flex min-h-screen items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="w-full max-w-lg rounded-[2.5rem] bg-white p-6 lg:p-8 shadow-2xl relative border border-brand-gray-100"
                >
                {/* Close Button */}
                <button
                  onClick={() => setIsExportWizardOpen(false)}
                  className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-brand-gray-50 hover:bg-brand-gray-100 text-brand-gray-500 hover:text-black transition-all"
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Progress Indicators */}
                <div className="flex items-center gap-2 mb-6 pr-10">
                  <div className={`h-1.5 flex-1 rounded-full ${exportStep >= 1 ? 'bg-black' : 'bg-brand-gray-100'}`} />
                  <div className={`h-1.5 flex-1 rounded-full ${exportStep >= 2 ? 'bg-black' : 'bg-brand-gray-100'}`} />
                </div>

                {exportStep === 1 ? (
                  /* STEP 1: Format & Range selection */
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-black tracking-tight text-brand-gray-900">Database Export Configurator</h3>
                      <p className="text-xs text-brand-gray-400 mt-1 uppercase font-mono tracking-wider">Configure offline ledger extraction specifications</p>
                    </div>

                    {/* FORMAT Choice */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">Select File Format</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setExportFormat('xlsx')}
                          className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all ${
                            exportFormat === 'xlsx' 
                              ? 'border-black bg-brand-gray-50/50 scale-[1.02]' 
                              : 'border-brand-gray-100 hover:border-brand-gray-300'
                          }`}
                        >
                          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${exportFormat === 'xlsx' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-brand-gray-50 text-brand-gray-400'} mb-3`}>
                            <FileSpreadsheet className="h-6 w-6" />
                          </div>
                          <span className="text-xs font-black uppercase tracking-wider text-center">Excel Table</span>
                          <span className="text-[9px] text-brand-gray-400 mt-1 text-center">Offline sheet (.XLSX)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setExportFormat('pdf')}
                          className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all ${
                            exportFormat === 'pdf' 
                              ? 'border-black bg-brand-gray-50/50 scale-[1.02]' 
                              : 'border-brand-gray-100 hover:border-brand-gray-300'
                          }`}
                        >
                          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${exportFormat === 'pdf' ? 'bg-sky-500/10 text-sky-600' : 'bg-brand-gray-50 text-brand-gray-400'} mb-3`}>
                            <FileText className="h-6 w-6" />
                          </div>
                          <span className="text-xs font-black uppercase tracking-wider text-center">Print / PDF</span>
                          <span className="text-[9px] text-brand-gray-400 mt-1 text-center">Printable layout (.HTML)</span>
                        </button>
                      </div>
                    </div>

                    {/* RANGE Choice */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">Configure Timeline Range</label>
                      <div className="grid grid-cols-2 gap-2 bg-brand-gray-50 p-1.5 rounded-2xl border border-brand-gray-150">
                        {[
                          { key: 'all', label: 'All-Time' },
                          { key: 'this_month', label: 'This Month' },
                          { key: 'last_30', label: 'Last 30 Days' },
                          { key: 'custom', label: 'Custom Range' }
                        ].map(t => (
                          <button
                            key={t.key}
                            type="button"
                            onClick={() => setExportTimeline(t.key as any)}
                            className={`h-9 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                              exportTimeline === t.key 
                                ? 'bg-black text-white shadow-sm' 
                                : 'text-brand-gray-400 hover:text-black'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>

                      {exportTimeline === 'custom' && (
                        <div className="grid grid-cols-2 gap-4 mt-3 p-4 bg-brand-gray-50/50 border border-brand-gray-105 rounded-2xl">
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-wider text-brand-gray-400">Start Date</label>
                            <input 
                              type="date" 
                              value={exportStartDate}
                              onChange={e => setExportStartDate(e.target.value)}
                              className="w-full h-11 px-3 border border-brand-gray-200 bg-white rounded-xl text-xs font-mono font-bold mt-1 focus:border-black focus:outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-wider text-brand-gray-400">End Date</label>
                            <input 
                              type="date" 
                              value={exportEndDate}
                              onChange={e => setExportEndDate(e.target.value)}
                              className="w-full h-11 px-3 border border-brand-gray-200 bg-white rounded-xl text-xs font-mono font-bold mt-1 focus:border-black focus:outline-none transition-all"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setExportStep(2)}
                        className="interactive-button w-full rounded-[2rem] bg-black py-5 text-sm font-black uppercase tracking-widest text-white flex items-center justify-center gap-2 shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
                      >
                        <span>Continue to Save Location</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* STEP 2: Custom Storage & Save Destination Picker */
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-black tracking-tight text-brand-gray-900">Define Save Destination</h3>
                      <p className="text-xs text-brand-gray-400 mt-1 uppercase font-mono tracking-wider">Configure target storage parameters for your offline APK</p>
                    </div>

                    {/* STORAGE Target Presets Selector */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">Storage Location Preset</label>
                      <div className="flex flex-col gap-2">
                        {[
                          { name: 'Standard Downloads Directory', path: '/storage/emulated/0/Download/Cashometry/', label: 'Downloads' },
                          { name: 'My Documents Directory', path: '/storage/emulated/0/Documents/Cashometry/', label: 'Documents' },
                          { name: 'Custom Root Sandbox Storage', path: '/storage/emulated/0/Cashometry/', label: 'Root Sandbox' }
                        ].map(preset => (
                          <button
                            key={preset.path}
                            type="button"
                            onClick={() => setExportLocation(preset.path)}
                            className={`flex items-center gap-3 p-3 text-left transition-all rounded-xl border ${
                              exportLocation === preset.path 
                                ? 'border-black bg-brand-gray-50/50 text-black font-semibold' 
                                : 'border-brand-gray-100 hover:border-brand-gray-200 text-brand-gray-500 hover:text-black'
                            }`}
                          >
                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${exportLocation === preset.path ? 'bg-black text-white' : 'bg-brand-gray-50 text-brand-gray-400'}`}>
                              <Folder className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-black uppercase tracking-wider">{preset.label}</p>
                              <p className="text-[9px] font-mono text-brand-gray-400 mt-0.5 truncate max-w-[220px]">{preset.path}</p>
                            </div>
                            {exportLocation === preset.path && (
                              <div className="h-5 w-5 rounded-full bg-black text-white flex items-center justify-center">
                                <Check className="h-3 w-3" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* PATH Display Input */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">Editable Folder Destination</label>
                      <div className="relative">
                        <Folder className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-gray-400" />
                        <input
                          type="text"
                          value={exportLocation}
                          onChange={e => setExportLocation(e.target.value)}
                          className="h-12 w-full rounded-xl border border-brand-gray-200 bg-brand-gray-50/50 pl-11 pr-4 text-xs font-mono font-bold focus:border-black focus:outline-none focus:bg-white transition-all text-brand-gray-700"
                        />
                      </div>
                    </div>

                    {/* FILE Name Input */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-400">Custom Filename</label>
                      <div className="relative">
                        <HardDrive className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-gray-400" />
                        <input
                          type="text"
                          value={exportFileName}
                          placeholder="Filename prefix"
                          onChange={e => setExportFileName(e.target.value)}
                          className="h-12 w-full rounded-xl border border-brand-gray-200 bg-brand-gray-50/50 pl-11 pr-16 text-xs font-mono font-bold focus:border-black focus:outline-none focus:bg-white transition-all text-brand-gray-700"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-wider text-brand-gray-400 font-mono">
                          .{exportFormat === 'xlsx' ? 'xlsx' : 'html'}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setExportStep(1)}
                        className="interactive-button flex-1 rounded-[2rem] border border-brand-gray-200 py-5 text-xs font-black uppercase tracking-widest text-brand-gray-500 hover:text-black hover:border-black transition-all"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmExport}
                        className="interactive-button flex-[2] rounded-[2rem] bg-black py-5 text-xs font-black uppercase tracking-widest text-white flex items-center justify-center gap-2 shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
                      >
                        <Download className="h-4.5 w-4.5" />
                        <span>Confirm Backup</span>
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )}

      {/* CUSTOM DYNAMIC EXPORT CONFIRMATION TOAST */}
      <AnimatePresence>
        {showExportToast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed bottom-24 left-4 right-4 z-50 mx-auto max-w-sm rounded-2xl border border-brand-gray-100 bg-black p-4 text-white shadow-2xl xs:left-auto xs:right-8 xs:bottom-8"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Check className="h-4.5 w-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-emerald-400">Export Succeeded</h4>
                <p className="text-xs font-semibold text-brand-gray-300 mt-0.5 truncate">{exportToastMessage}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TransactionsPage;
