import { useState, useEffect, useRef } from 'react';

const CATEGORIES = {
  income:  ['Salary','Freelance','Investment','Gift','Refund','Other'],
  expense: ['Food','Transport','Shopping','Housing','Health','Entertainment','Education','Utilities','Other'],
};

const CATEGORY_ICONS = {
  Salary:'💼', Freelance:'🧑‍💻', Investment:'📈', Gift:'🎁', Refund:'↩️',
  Food:'🍜', Transport:'🚌', Shopping:'🛍️', Housing:'🏠',
  Health:'❤️', Entertainment:'🎬', Education:'📚', Utilities:'💡', Other:'📋',
};

const TransactionForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [form, setForm] = useState({
    type: 'expense', amount: '', category: '',
    date: new Date().toISOString().split('T')[0], note: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const amountRef = useRef(null);
  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setForm({ type: initialData.type, amount: String(initialData.amount),
        category: initialData.category, date: initialData.date, note: initialData.note || '' });
    }
    setTimeout(() => amountRef.current?.focus(), 100);
  }, [initialData]);

  const set = (key, val) => setForm(p => ({ ...p, [key]: val, ...(key === 'type' ? { category: '' } : {}) }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) { setError('Enter a valid amount'); return; }
    if (!form.category) { setError('Pick a category'); return; }
    setLoading(true);
    try { await onSubmit({ ...form, amount: parseFloat(form.amount) }); }
    catch (err) { setError(err.message || 'Something went wrong'); }
    finally { setLoading(false); }
  };

  const displayAmount = form.amount ? `₹${Number(form.amount).toLocaleString('en-IN')}` : '₹0';

  return (
    <>
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(20px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
        .form-modal { animation: slideUp 0.3s cubic-bezier(0.34,1.2,0.64,1) both; }
      `}</style>
      <div className="fixed inset-0 z-50 bg-black/55 dark:bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
        onClick={e => e.target === e.currentTarget && onCancel()}>
        <div className="form-modal bg-white dark:bg-gray-900 border border-slate-200 dark:border-white/[0.1] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="flex justify-between items-center px-6 pt-6 pb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{isEditing ? 'Edit Transaction' : 'New Transaction'}</h2>
            <button onClick={onCancel} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white transition-all">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Type toggle */}
          <div className="px-6 pb-4">
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.07] rounded-2xl">
              <button type="button" onClick={() => set('type', 'expense')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  form.type === 'expense' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900 dark:text-white/40 dark:hover:text-white'
                }`}>
                ↓ Expense
              </button>
              <button type="button" onClick={() => set('type', 'income')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  form.type === 'income' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900 dark:text-white/40 dark:hover:text-white'
                }`}>
                ↑ Income
              </button>
            </div>
          </div>

          {/* Big amount display */}
          <div className="px-6 pb-2 text-center">
            <p className={`text-5xl font-bold tracking-tighter transition-colors duration-300 ${
              form.type === 'income' ? 'text-emerald-400' : form.amount ? 'text-rose-400' : 'text-slate-300 dark:text-white/20'
            }`}>
              {displayAmount}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4 mt-2">
            {/* Amount input */}
            <div>
              <label className="text-xs text-slate-500 dark:text-white/30 uppercase tracking-widest">Amount</label>
              <div className="relative mt-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-white/30 font-medium">₹</span>
                <input ref={amountRef} name="amount" type="number" step="0.01" min="0"
                  placeholder="0.00" value={form.amount}
                  onChange={e => set('amount', e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white text-lg font-semibold placeholder-slate-400 dark:placeholder-white/20 focus:outline-none focus:border-blue-500/60 focus:bg-white dark:focus:bg-white/[0.06] transition-all"/>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="text-xs text-slate-500 dark:text-white/30 uppercase tracking-widest">Category</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {CATEGORIES[form.type].map(cat => (
                  <button key={cat} type="button" onClick={() => set('category', cat)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                      form.category === cat
                        ? form.type === 'income'
                          ? 'bg-emerald-600 text-white shadow-lg'
                          : 'bg-rose-600 text-white shadow-lg'
                        : 'bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.07] text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08]'
                    }`}>
                    <span className="text-base leading-none">{CATEGORY_ICONS[cat]}</span>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Date + Note in a row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 dark:text-white/30 uppercase tracking-widest">Date</label>
                <input name="date" type="date" value={form.date}
                  onChange={e => set('date', e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500/60 transition-all dark:[color-scheme:dark]"/>
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-white/30 uppercase tracking-widest">Note</label>
                <input name="note" type="text" placeholder="Optional…" value={form.note}
                  onChange={e => set('note', e.target.value)} maxLength={120}
                  className="w-full mt-1 px-3 py-2.5 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-white/20 focus:outline-none focus:border-blue-500/60 transition-all"/>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm text-center">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onCancel}
                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-white/[0.1] text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white font-semibold transition-all">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className={`flex-1 py-3 rounded-xl text-white font-semibold transition-all disabled:opacity-40 ${
                  form.type === 'income'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}>
                {loading ? '…' : isEditing ? 'Update' : `Add ${form.type === 'income' ? 'Income' : 'Expense'}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default TransactionForm;