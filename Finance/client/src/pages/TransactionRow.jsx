const CATEGORY_META = {
  // Income
  'Salary':      { icon: '💼', color: '#34d399' },
  'Freelance':   { icon: '🧑‍💻', color: '#34d399' },
  'Investment':  { icon: '📈', color: '#34d399' },
  'Gift':        { icon: '🎁', color: '#34d399' },
  'Refund':      { icon: '↩️', color: '#34d399' },
  // Expense
  'Food':        { icon: '🍜', color: '#f87171' },
  'Transport':   { icon: '🚌', color: '#fb923c' },
  'Shopping':    { icon: '🛍️', color: '#fbbf24' },
  'Housing':     { icon: '🏠', color: '#60a5fa' },
  'Health':      { icon: '❤️', color: '#f87171' },
  'Entertainment':{ icon: '🎬', color: '#a78bfa' },
  'Education':   { icon: '📚', color: '#60a5fa' },
  'Utilities':   { icon: '💡', color: '#fbbf24' },
  'Other':       { icon: '📋', color: '#9ca3af' },
};

const TransactionRow = ({ transaction, onEdit, onDelete, selected, onSelect }) => {
  const { id, amount, type, category, date, note } = transaction;
  const isIncome = type === 'income';
  const meta = CATEGORY_META[category] || { icon: '📋', color: '#9ca3af' };

  const fmtDate = new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

  return (
    <div className={`tx-row flex items-center gap-3 px-5 py-3.5 border-b border-slate-200 dark:border-white/[0.04] transition-all group cursor-pointer
      ${selected ? 'bg-blue-500/10' : 'hover:bg-slate-50 dark:hover:bg-white/[0.025]'}`}
      onClick={() => onSelect(id)}
    >
      {/* Checkbox */}
      <div className={`w-4 h-4 rounded flex-shrink-0 border transition-all ${
        selected ? 'bg-blue-500 border-blue-500' : 'border-slate-300 dark:border-white/20 group-hover:border-slate-400 dark:group-hover:border-white/40'
      } flex items-center justify-center`}>
        {selected && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>

      {/* Icon bubble */}
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
        style={{ background: `${meta.color}18` }}>
        {meta.icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{category}</p>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${
            isIncome ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
          }`}>
            {isIncome ? 'IN' : 'OUT'}
          </span>
        </div>
        {note && <p className="text-xs text-slate-500 dark:text-white/30 truncate mt-0.5">{note}</p>}
      </div>

      {/* Date */}
      <span className="text-xs text-slate-500 dark:text-white/25 flex-shrink-0 hidden sm:block">{fmtDate}</span>

      {/* Amount */}
      <span className={`font-bold text-sm flex-shrink-0 w-24 text-right ${
        isIncome ? 'text-emerald-400' : 'text-rose-400'
      }`}>
        {isIncome ? '+' : '−'}₹{Number(amount).toLocaleString('en-IN')}
      </span>

      {/* Actions */}
      <div className="tx-actions flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
        <button onClick={() => onEdit(transaction)}
          className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/25 text-blue-400 transition-colors" aria-label="Edit">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button onClick={() => onDelete(id)}
          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 transition-colors" aria-label="Delete">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <polyline points="3,6 5,6 21,6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TransactionRow;