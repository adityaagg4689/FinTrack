import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import {
  ArrowRight, Sparkles, TrendingUp, Target, PiggyBank, RefreshCw,
  Shield, Zap, BarChart3, Wallet, Menu, X,
  ChevronRight, Globe, Mail, Users, Plus, Repeat,
  TrendingDown, CheckCircle2,AlertCircle, Clock,
} from 'lucide-react';
const GithubIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.03-2.682-.103-.253-.447-1.27.098-2.646 0 0 .84-.269 2.75 1.025.8-.223 1.65-.334 2.5-.334.85 0 1.7.111 2.5.334 1.91-1.294 2.75-1.025 2.75-1.025.545 1.376.201 2.393.099 2.646.64.698 1.03 1.591 1.03 2.682 0 3.841-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

// Custom LinkedIn Icon Component
const LinkedinIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.979 0 1.771-.773 1.771-1.729V1.729C24 .774 23.203 0 22.225 0z"/>
  </svg>
);


// ── Number ticker ─────────────────────────────────────────────────────────────
const NumberTicker = ({ value, duration = 2, decimals = 0 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const hasRun = useRef(false);
  useEffect(() => {
    if (!isInView || hasRun.current) return;
    hasRun.current = true;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(parseFloat((eased * value).toFixed(decimals)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [isInView, value, duration, decimals]);
  return <span ref={ref}>{count.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</span>;
};

// ── Animated progress bar ─────────────────────────────────────────────────────
const ProgressBar = ({ percent, color = '#3b82f6', delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  return (
    <div ref={ref} className="h-1.5 bg-white/10 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={isInView ? { width: `${percent}%` } : {}}
        transition={{ duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
};

// ── Scroll progress bar ───────────────────────────────────────────────────────
const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 40 });
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-0.5 z-[200] origin-left bg-gradient-to-r from-blue-500 to-purple-500"
      style={{ scaleX }}
    />
  );
};

// ── Floating element ──────────────────────────────────────────────────────────
const Float = ({ children, delay = 0, y = 10, duration = 4 }) => (
  <motion.div
    animate={{ y: [0, -y, 0] }}
    transition={{ duration, repeat: Infinity, delay, ease: 'easeInOut' }}
  >
    {children}
  </motion.div>
);

// ── Glow card ─────────────────────────────────────────────────────────────────
const GlowCard = ({ children, className = '' }) => (
  <div className={`relative group ${className}`}>
    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-50 transition duration-500" />
    <div className="relative bg-gray-900 rounded-2xl p-6 border border-white/10">
      {children}
    </div>
  </div>
);

// ── Magnetic button ───────────────────────────────────────────────────────────
const MagneticButton = ({ children, className, onClick }) => {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const handleMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    setPos({ x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.25 });
  };
  const reset = () => setPos({ x: 0, y: 0 });
  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      animate={{ x: pos.x, y: pos.y }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={className}
    >
      {children}
    </motion.button>
  );
};

// ── Live transaction ticker ───────────────────────────────────────────────────
const TICKER_ITEMS = [
  { label: 'Salary credited',    amt: '+₹52,000', color: '#4ade80', icon: TrendingUp },
  { label: 'Zomato order',       amt: '−₹450',    color: '#f87171', icon: TrendingDown },
  { label: 'SIP investment',     amt: '−₹5,000',  color: '#818cf8', icon: Target },
  { label: 'Amazon shopping',    amt: '−₹2,340',  color: '#f87171', icon: TrendingDown },
  { label: 'Freelance payment',  amt: '+₹18,000', color: '#4ade80', icon: TrendingUp },
  { label: 'Netflix renewed',    amt: '−₹649',    color: '#f87171', icon: Repeat },
  { label: 'Swiggy delivery',    amt: '−₹320',    color: '#f87171', icon: TrendingDown },
  { label: 'Dividend received',  amt: '+₹1,240',  color: '#4ade80', icon: TrendingUp },
];

const LiveTicker = () => {
  const [items, setItems] = useState(TICKER_ITEMS.slice(0, 4));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let idx = 0;
    const t = setInterval(() => {
      idx = (idx + 1) % TICKER_ITEMS.length;
      setItems(prev => [TICKER_ITEMS[idx], ...prev.slice(0, 3)]);
    }, 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="absolute -right-6 top-4 w-56 hidden lg:block">
      <Float delay={0.5} y={6} duration={5}>
        <div className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-gray-500 uppercase tracking-widest">Live feed</span>
          </div>
          <div className="space-y-1.5 overflow-hidden" style={{ height: '120px' }}>
            <AnimatePresence initial={false}>
              {items.map((item, i) => (
                <motion.div
                  key={item.label + i}
                  initial={{ opacity: 0, y: -20, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <item.icon className="w-3 h-3 flex-shrink-0" style={{ color: item.color }} />
                    <span className="text-[10px] text-gray-400 truncate">{item.label}</span>
                  </div>
                  <span className="text-[10px] font-semibold flex-shrink-0" style={{ color: item.color }}>{item.amt}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </Float>
    </div>
  );
};

// ── Feature showcase panels ───────────────────────────────────────────────────
const FEATURE_COLORS = {
  yellow:  { bg: 'rgba(234,179,8,0.15)',   text: '#facc15' },
  green:   { bg: 'rgba(34,197,94,0.15)',   text: '#4ade80' },
  blue:    { bg: 'rgba(59,130,246,0.15)',  text: '#60a5fa' },
  purple:  { bg: 'rgba(168,85,247,0.15)', text: '#c084fc' },
  pink:    { bg: 'rgba(236,72,153,0.15)',  text: '#f472b6' },
  indigo:  { bg: 'rgba(99,102,241,0.15)',  text: '#818cf8' },
};

const SHOWCASE_TABS = [
  { id: 'transactions', label: 'Transactions', icon: Wallet },
  { id: 'budgets',      label: 'Budgets',      icon: Target },
  { id: 'goals',        label: 'Goals',        icon: PiggyBank },
  { id: 'recurring',   label: 'Recurring',    icon: Repeat },
  { id: 'analytics',   label: 'Analytics',    icon: BarChart3 },
];

const TransactionsPanel = () => {
  const rows = [
    { icon: TrendingUp,   label: 'Salary credit',    cat: 'Income',    time: 'Today 10:30',  amt: '+₹52,000', positive: true,  bg: 'rgba(34,197,94,0.12)',   color: '#4ade80' },
    { icon: TrendingDown, label: 'Amazon shopping',  cat: 'Shopping',  time: 'Today 14:12',  amt: '−₹2,340',  positive: false, bg: 'rgba(248,113,113,0.12)', color: '#f87171' },
    { icon: TrendingDown, label: 'Zomato order',     cat: 'Food',      time: 'Today 13:05',  amt: '−₹450',    positive: false, bg: 'rgba(99,102,241,0.12)',  color: '#818cf8' },
    { icon: TrendingUp,   label: 'Freelance payout', cat: 'Income',    time: 'Yesterday',    amt: '+₹18,000', positive: true,  bg: 'rgba(34,197,94,0.12)',   color: '#4ade80' },
    { icon: TrendingDown, label: 'Metro recharge',   cat: 'Transport', time: 'Yesterday',    amt: '−₹500',    positive: false, bg: 'rgba(249,115,22,0.12)',  color: '#fb923c' },
  ];
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500 uppercase tracking-widest">June 2026</p>
        <button className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>
      {rows.map((r, i) => (
        <motion.div
          key={r.label}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: r.bg }}>
            <r.icon className="w-4 h-4" style={{ color: r.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium">{r.label}</p>
            <p className="text-[10px] text-gray-500">{r.cat} · {r.time}</p>
          </div>
          <span className={`text-xs font-semibold ${r.positive ? 'text-green-400' : 'text-red-400'}`}>{r.amt}</span>
        </motion.div>
      ))}
    </div>
  );
};

const BudgetsPanel = () => {
  const budgets = [
    { cat: 'Food & dining',   spent: 4200,  total: 5000,  color: '#3b82f6', warn: false },
    { cat: 'Transport',       spent: 1400,  total: 2500,  color: '#a855f7', warn: false },
    { cat: 'Entertainment',   spent: 1800,  total: 2000,  color: '#f87171', warn: true  },
    { cat: 'Shopping',        spent: 3200,  total: 6000,  color: '#f59e0b', warn: false },
    { cat: 'Utilities',       spent: 2100,  total: 2500,  color: '#10b981', warn: false },
  ];
  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Monthly budgets · June</p>
      {budgets.map((b, i) => {
        const pct = Math.round((b.spent / b.total) * 100);
        return (
          <motion.div key={b.cat} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="flex items-center gap-1.5 text-gray-400">
                {b.warn && <AlertCircle className="w-3 h-3 text-red-400" />}
                {b.cat}
              </span>
              <span className="text-gray-300">₹{b.spent.toLocaleString('en-IN')} <span className="text-gray-600">/ ₹{b.total.toLocaleString('en-IN')}</span></span>
            </div>
            <ProgressBar percent={pct} color={b.warn ? '#f87171' : b.color} delay={i * 0.1} />
            <p className="text-[10px] mt-1" style={{ color: b.warn ? '#f87171' : '#6b7280' }}>
              {b.warn ? `⚠ ${pct}% used — ₹${(b.total - b.spent).toLocaleString('en-IN')} left` : `${pct}% · ₹${(b.total - b.spent).toLocaleString('en-IN')} remaining`}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
};

const GoalsPanel = () => {
  const goals = [
    { name: 'Emergency fund',  current: 15000, target: 30000, color: '#3b82f6', deadline: 'Dec 2026',  icon: Shield },
    { name: 'Trip to Manali',  current: 4200,  target: 12000, color: '#a855f7', deadline: 'Mar 2027',  icon: Globe },
    { name: 'New laptop',      current: 28000, target: 28000, color: '#22c55e', deadline: 'Done ✓',    icon: Zap },
    { name: 'Home down payment',current: 80000,target: 500000,color: '#f59e0b', deadline: 'Dec 2028',  icon: Target },
  ];
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Savings goals</p>
      {goals.map((g, i) => {
        const pct = Math.min(100, Math.round((g.current / g.target) * 100));
        const done = pct === 100;
        return (
          <motion.div key={g.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.09 }}
            className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: g.color + '22' }}>
                <g.icon className="w-3.5 h-3.5" style={{ color: g.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium">{g.name}</span>
                  {done
                    ? <span className="text-[10px] text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Done</span>
                    : <span className="text-[10px] text-gray-500">{g.deadline}</span>}
                </div>
              </div>
            </div>
            <ProgressBar percent={pct} color={g.color} delay={i * 0.1} />
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-gray-500">₹{g.current.toLocaleString('en-IN')}</span>
              <span className="text-[10px] font-semibold" style={{ color: g.color }}>{pct}% · ₹{g.target.toLocaleString('en-IN')}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

const RecurringPanel = () => {
  const items = [
    { name: 'Netflix',        amt: '₹649',    freq: 'Monthly',    next: 'Jul 1',   color: '#f87171', icon: Repeat },
    { name: 'Spotify',        amt: '₹119',    freq: 'Monthly',    next: 'Jun 15',  color: '#4ade80', icon: Repeat },
    { name: 'Gym membership', amt: '₹1,200',  freq: 'Monthly',    next: 'Jul 5',   color: '#818cf8', icon: Repeat },
    { name: 'Cloud storage',  amt: '₹130',    freq: 'Monthly',    next: 'Jun 28',  color: '#60a5fa', icon: Repeat },
    { name: 'LIC premium',    amt: '₹12,000', freq: 'Quarterly',  next: 'Sep 1',   color: '#f59e0b', icon: Clock },
    { name: 'Domain renewal', amt: '₹899',    freq: 'Yearly',     next: 'Jan 2027',color: '#c084fc', icon: Globe },
  ];
  const monthlyTotal = 649 + 119 + 1200 + 130;
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500 uppercase tracking-widest">Recurring transactions</p>
        <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">₹{monthlyTotal.toLocaleString('en-IN')}/mo</span>
      </div>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <motion.div key={item.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
            className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: item.color + '22' }}>
              <item.icon className="w-4 h-4" style={{ color: item.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium">{item.name}</p>
              <p className="text-[10px] text-gray-500">{item.freq} · next {item.next}</p>
            </div>
            <span className="text-xs text-gray-300 font-medium">{item.amt}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const AnalyticsPanel = () => {
  // Bar chart data (last 6 months spending)
  const bars = [
    { month: 'Jan', income: 72000, expense: 38000 },
    { month: 'Feb', income: 72000, expense: 44000 },
    { month: 'Mar', income: 90000, expense: 35000 },
    { month: 'Apr', income: 72000, expense: 51000 },
    { month: 'May', income: 88000, expense: 42000 },
    { month: 'Jun', income: 125000, expense: 40500 },
  ];
  const maxVal = 130000;
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const categories = [
    { label: 'Food & dining', pct: 31, color: '#3b82f6', amt: '₹12,400' },
    { label: 'Transport',     pct: 12, color: '#a855f7', amt: '₹4,800' },
    { label: 'Shopping',      pct: 23, color: '#f59e0b', amt: '₹9,200' },
    { label: 'Utilities',     pct: 13, color: '#10b981', amt: '₹5,200' },
    { label: 'Others',        pct: 21, color: '#f87171', amt: '₹8,900' },
  ];

  return (
    <div ref={ref} className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">6-month overview</p>
          <p className="text-2xl font-bold">₹40,500</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Expenses this month</p>
        </div>
        <span className="text-xs px-2 py-1 bg-green-500/15 text-green-400 rounded-full">−8% vs May</span>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-1.5 h-20">
        {bars.map((b, i) => (
          <div key={b.month} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full flex gap-0.5 items-end" style={{ height: '64px' }}>
              <motion.div
                className="flex-1 rounded-sm"
                style={{ background: '#3b82f6', maxHeight: '100%' }}
                initial={{ height: 0 }}
                animate={isInView ? { height: `${(b.income / maxVal) * 100}%` } : {}}
                transition={{ duration: 0.8, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              />
              <motion.div
                className="flex-1 rounded-sm"
                style={{ background: '#f87171', maxHeight: '100%' }}
                initial={{ height: 0 }}
                animate={isInView ? { height: `${(b.expense / maxVal) * 100}%` } : {}}
                transition={{ duration: 0.8, delay: i * 0.08 + 0.1, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <span className="text-[8px] text-gray-600">{b.month}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-3 text-[10px]">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-500 inline-block" />Income</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-400 inline-block" />Expenses</span>
      </div>

      {/* Category breakdown */}
      <div className="space-y-2 pt-1">
        {categories.map((c, i) => (
          <div key={c.label}>
            <div className="flex justify-between text-[10px] mb-1">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
                <span className="text-gray-400">{c.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">{c.pct}%</span>
                <span className="text-gray-300">{c.amt}</span>
              </div>
            </div>
            <ProgressBar percent={c.pct} color={c.color} delay={i * 0.08} />
          </div>
        ))}
      </div>
    </div>
  );
};

const PANEL_COMPONENTS = {
  transactions: TransactionsPanel,
  budgets: BudgetsPanel,
  goals: GoalsPanel,
  recurring: RecurringPanel,
  analytics: AnalyticsPanel,
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDemoStep, setActiveDemoStep] = useState(0);
  const [activeShowcase, setActiveShowcase] = useState('transactions');
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef(null);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveDemoStep(s => (s + 1) % 4), 3500);
    return () => clearInterval(t);
  }, []);

  // Auto-rotate showcase
  useEffect(() => {
    const tabs = SHOWCASE_TABS.map(t => t.id);
    const t = setInterval(() => {
      setActiveShowcase(cur => {
        const i = tabs.indexOf(cur);
        return tabs[(i + 1) % tabs.length];
      });
    }, 4500);
    return () => clearInterval(t);
  }, []);

  const demoSteps = [
    { icon: Wallet,    title: 'Add transaction', desc: 'Log income and expenses instantly',    color: 'blue'   },
    { icon: Target,    title: 'Set budgets',      desc: 'Define monthly spending limits',        color: 'purple' },
    { icon: PiggyBank, title: 'Track goals',      desc: 'Save for what matters most',            color: 'green'  },
    { icon: BarChart3, title: 'View analytics',   desc: 'See your financial picture clearly',    color: 'yellow' },
  ];

  const DEMO_COLORS = {
    blue:   { bg: 'rgba(59,130,246,0.15)',  text: '#60a5fa',  bar: '#3b82f6'  },
    purple: { bg: 'rgba(168,85,247,0.15)', text: '#c084fc',  bar: '#a855f7'  },
    green:  { bg: 'rgba(34,197,94,0.15)',   text: '#4ade80',  bar: '#22c55e'  },
    yellow: { bg: 'rgba(234,179,8,0.15)',   text: '#facc15',  bar: '#eab308'  },
  };

  const features = [
    { icon: Zap,       title: 'Real-time tracking',  desc: 'Transactions update instantly across all your devices.',              color: 'yellow' },
    { icon: TrendingUp,title: 'Smart insights',       desc: 'Spending analysis with trends and personalised breakdowns.',          color: 'green'  },
    { icon: Target,    title: 'Budget planning',      desc: 'Set monthly budgets and get alerts before you go over.',             color: 'blue'   },
    { icon: PiggyBank, title: 'Goal setting',         desc: 'Save for vacations, emergencies, or big purchases step by step.',    color: 'purple' },
    { icon: RefreshCw, title: 'Recurring bills',      desc: 'Automate regular payments and subscriptions — log once, done.',      color: 'pink'   },
    { icon: Shield,    title: 'Bank-level security',  desc: 'AES-256 encryption keeps your data private and protected.',          color: 'indigo' },
  ];



  const ActivePanel = PANEL_COMPONENTS[activeShowcase];

  // Staggered hero letter animation
  const heroWords = ['Take', 'control', 'of'];
  const heroGradient = ['your', 'money'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white overflow-x-hidden">
      <ScrollProgress />

      {/* Ambient blobs */}
      <div className="fixed w-96 h-96 bg-blue-500/8 rounded-full blur-3xl pointer-events-none -z-10" style={{ left: '10%', top: '15%' }} />
      <div className="fixed w-96 h-96 bg-purple-500/8 rounded-full blur-3xl pointer-events-none -z-10" style={{ right: '8%', bottom: '20%' }} />
      <div className="fixed w-64 h-64 bg-indigo-500/6 rounded-full blur-2xl pointer-events-none -z-10" style={{ left: '50%', top: '50%' }} />

      {/* Dot grid */}
      <div className="fixed inset-0 pointer-events-none -z-10 opacity-[0.15]"
        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ${
          scrolled ? 'bg-gray-900/80 backdrop-blur-2xl border-b border-white/8 shadow-xl shadow-black/20' : ''}`}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <motion.div className="flex items-center gap-2" whileHover={{ scale: 1.03 }}>
            <motion.div
              className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center"
              animate={{ rotate: [0, 3, -3, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Wallet className="w-4 h-4 text-white" />
            </motion.div>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              FinTrack
            </span>
          </motion.div>

          <div className="hidden md:flex items-center gap-6">
            {['Features', 'Demo'].map((item, i) => (
              <motion.a key={item} href={`#${item.toLowerCase()}`}
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="text-sm text-gray-400 hover:text-white transition-colors duration-200 relative group"
              >
                {item}
                <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-gradient-to-r from-blue-400 to-purple-400 group-hover:w-full transition-all duration-300" />
              </motion.a>
            ))}
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 }}>
              <MagneticButton
                onClick={() => navigate('/register')}
                className="px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-shadow duration-300"
              >
                Get started
              </MagneticButton>
            </motion.div>
          </div>

          <button className="md:hidden p-1" onClick={() => setMobileMenuOpen(o => !o)} aria-label="Toggle menu">
            <AnimatePresence mode="wait">
              {mobileMenuOpen
                ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X className="w-5 h-5" /></motion.div>
                : <motion.div key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><Menu className="w-5 h-5" /></motion.div>}
            </AnimatePresence>
          </button>
        </div>

        <div className={`md:hidden overflow-hidden transition-all duration-300 ${mobileMenuOpen ? 'max-h-64' : 'max-h-0'}`}>
          <div className="bg-gray-900/95 backdrop-blur-xl border-t border-white/10 px-6 py-4 flex flex-col gap-3">
            {['Features', 'Demo'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`}
                className="text-sm text-gray-400 hover:text-white py-1 transition-colors"
                onClick={() => setMobileMenuOpen(false)}>
                {item}
              </a>
            ))}
            <button onClick={() => navigate('/register')}
              className="px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-sm font-semibold text-left">
              Get started
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="pt-28 pb-20 px-6 relative">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">

          {/* Copy — word-by-word entrance */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6"
            >
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}>
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              </motion.div>
              <span className="text-xs text-blue-400 font-medium">Smart finance management</span>
            </motion.div>

            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-5">
              {['Take', 'control', 'of'].map((word, i) => (
                <motion.span key={word} className="inline-block mr-3"
                  initial={{ opacity: 0, y: 30, rotateX: -40 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                >
                  {word}
                </motion.span>
              ))}
              <br />
              {['your', 'money'].map((word, i) => (
                <motion.span key={word}
                  className="inline-block mr-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
                  initial={{ opacity: 0, y: 30, rotateX: -40 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                >
                  {word}
                </motion.span>
              ))}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.75 }}
              className="text-lg text-gray-400 mb-7 max-w-md leading-relaxed"
            >
              Track expenses, set budgets, achieve goals — all in one clean dashboard built for India.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.85 }}
              className="flex flex-wrap gap-3"
            >
              <MagneticButton
                onClick={() => navigate('/register')}
                className="px-7 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-blue-500/30 hover:shadow-xl transition-all text-sm"
              >
                Start free <ArrowRight className="w-4 h-4" />
              </MagneticButton>
              <MagneticButton
                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-7 py-3 border border-white/20 rounded-xl font-semibold hover:bg-white/5 hover:border-white/30 transition-all text-sm"
              >
                See how it works
              </MagneticButton>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="mt-6"
            >
              <p className="text-xs text-gray-600">Free · No ads · No credit card required</p>
            </motion.div>
          </div>

          {/* Product card + floating ticker */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <Float delay={0} duration={4}>
              <GlowCard>
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Net balance · June 2026</p>
                      <motion.p className="text-3xl font-bold"
                        initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
                      >
                        ₹<NumberTicker value={84500} />
                      </motion.p>
                    </div>
                    <motion.span
                      initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.1 }}
                      className="text-xs px-2 py-1 bg-green-500/15 text-green-400 rounded-full font-semibold"
                    >
                      +12.5%
                    </motion.span>
                  </div>
                  <div className="flex justify-between text-sm pt-1">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Income</p>
                      <p className="text-green-400 font-semibold">₹<NumberTicker value={125000} /></p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-0.5">Expenses</p>
                      <p className="text-red-400 font-semibold">₹<NumberTicker value={40500} /></p>
                    </div>
                  </div>
                  <div className="h-px bg-white/8" />
                  <div className="space-y-3">
                    {[
                      { cat: 'Food & dining', amt: '₹4,200', pct: 84, color: '#3b82f6' },
                      { cat: 'Transport',     amt: '₹1,800', pct: 45, color: '#a855f7' },
                      { cat: 'Entertainment', amt: '₹2,100', pct: 70, color: '#22c55e' },
                    ].map((row, i) => (
                      <div key={row.cat}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-gray-400">{row.cat}</span>
                          <span className="text-gray-300">{row.amt}</span>
                        </div>
                        <ProgressBar percent={row.pct} color={row.color} delay={0.9 + i * 0.12} />
                      </div>
                    ))}
                  </div>
                </div>
              </GlowCard>
            </Float>
            <LiveTicker />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-14"
          >
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">What's inside</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Everything you need.{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Nothing you don't.
              </span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto text-sm leading-relaxed">
              Powerful tools to manage, track, and grow your finances — without the clutter.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => {
              const col = FEATURE_COLORS[f.color] ?? FEATURE_COLORS.blue;
              return (
                <motion.div key={f.title}
                  initial={{ opacity: 0, y: 32, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  viewport={{ once: true }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className="bg-white/[0.04] border border-white/8 rounded-2xl p-5 hover:bg-white/[0.07] hover:border-white/15 transition-all duration-300 group cursor-default"
                >
                  <motion.div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: col.bg }}
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <f.icon className="w-5 h-5" style={{ color: col.text }} />
                  </motion.div>
                  <h3 className="font-semibold mb-1.5 text-sm">{f.title}</h3>
                  <p className="text-gray-400 text-xs leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Feature Showcase ───────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-gradient-to-b from-transparent via-white/[0.025] to-transparent">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-12"
          >
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Every tool you need</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Built for how you{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                actually manage money
              </span>
            </h2>
            <p className="text-gray-400 text-sm max-w-lg mx-auto">
              From daily transactions to long-term savings goals — every feature is designed to reduce friction and give you clarity.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-[auto,1fr] gap-6 items-start">
            {/* Tab list */}
            <div className="lg:w-48 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
              {SHOWCASE_TABS.map((tab, i) => {
                const isActive = activeShowcase === tab.id;
                return (
                  <motion.button key={tab.id}
                    onClick={() => setActiveShowcase(tab.id)}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    viewport={{ once: true }}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      isActive
                        ? 'bg-white/10 text-white border border-white/15 shadow-lg'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
                    }`}
                  >
                    <tab.icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? 'text-blue-400' : ''}`} />
                    {tab.label}
                    {isActive && (
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-blue-400 ml-auto flex-shrink-0"
                        animate={{ scale: [1, 1.4, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="relative bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                {/* Window chrome */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8 bg-white/[0.02]">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                  <div className="flex-1 mx-4">
                    <div className="bg-white/[0.06] rounded-md px-3 py-1 text-[10px] text-gray-500 text-center max-w-48 mx-auto">
                      fintrack.app / {activeShowcase}
                    </div>
                  </div>
                </div>

                {/* Auto-advance bar */}
                <div className="h-0.5 bg-white/5">
                  <motion.div
                    key={activeShowcase}
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 4.5, ease: 'linear' }}
                  />
                </div>

                <div className="p-5">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeShowcase}
                      initial={{ opacity: 0, y: 16, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.98 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <ActivePanel />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Interactive Demo ───────────────────────────────────────────────── */}
      <section id="demo" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-14"
          >
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              See it in{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">action</span>
            </h2>
            <p className="text-gray-400 max-w-md mx-auto text-sm">A simple flow to manage your entire financial life.</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <div className="space-y-3">
              {demoSteps.map((step, i) => {
                const col = DEMO_COLORS[step.color];
                const isActive = activeDemoStep === i;
                return (
                  <motion.div key={step.title}
                    initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.09, ease: [0.16, 1, 0.3, 1] }} viewport={{ once: true }}
                    onClick={() => setActiveDemoStep(i)}
                    whileHover={{ x: 4 }}
                    className={`p-4 rounded-xl cursor-pointer transition-all duration-300 border ${
                      isActive ? 'bg-white/8 border-blue-500/40' : 'border-transparent hover:bg-white/[0.04]'}`}
                  >
                    <div className="flex items-center gap-4">
                      <motion.div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: col.bg }}
                        animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 0.4 }}
                      >
                        <step.icon className="w-5 h-5" style={{ color: col.text }} />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{step.title}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
                      </div>
                      <motion.div animate={{ rotate: isActive ? 90 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      </motion.div>
                    </div>
                    {isActive && (
                      <div className="h-0.5 bg-white/8 rounded mt-3 overflow-hidden">
                        <motion.div className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                          initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 3.5, ease: 'linear' }} />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={activeDemoStep}
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.97 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-5 border border-white/8 min-h-[240px]"
              >
                {activeDemoStep === 0 && (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Today's transactions</p>
                    {[
                      { icon: TrendingUp, label: 'Salary credit',  time: '10:30 AM', amt: '+₹52,000', positive: true,  bg: 'rgba(34,197,94,0.12)',   color: '#4ade80' },
                      { icon: Wallet,     label: 'Zomato order',   time: '1:15 PM',  amt: '−₹450',    positive: false, bg: 'rgba(248,113,113,0.12)', color: '#f87171' },
                      { icon: Wallet,     label: 'Metro recharge', time: '6:00 PM',  amt: '−₹500',    positive: false, bg: 'rgba(99,102,241,0.12)',  color: '#818cf8' },
                    ].map((t, i) => (
                      <motion.div key={t.label}
                        initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className="flex gap-3 items-center p-3 rounded-xl bg-white/[0.03]"
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: t.bg }}>
                          <t.icon className="w-5 h-5" style={{ color: t.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{t.label}</p>
                          <p className="text-xs text-gray-500">{t.time}</p>
                        </div>
                        <span className={`text-sm font-semibold ${t.positive ? 'text-green-400' : 'text-red-400'}`}>{t.amt}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
                {activeDemoStep === 1 && (
                  <div className="space-y-4">
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Monthly budgets</p>
                    {[
                      { cat: 'Food & dining', spent: 4200, total: 5000, pct: 84, color: '#3b82f6' },
                      { cat: 'Transport',     spent: 1400, total: 2500, pct: 56, color: '#a855f7' },
                      { cat: 'Entertainment', spent: 1800, total: 2000, pct: 90, color: '#f87171' },
                    ].map((b, i) => (
                      <div key={b.cat}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-gray-400">{b.cat}</span>
                          <span className="text-gray-300">₹{b.spent.toLocaleString('en-IN')} <span className="text-gray-600">/ ₹{b.total.toLocaleString('en-IN')}</span></span>
                        </div>
                        <ProgressBar percent={b.pct} color={b.color} delay={i * 0.12} />
                        <p className="text-[10px] text-gray-600 mt-1">{b.pct}% used · ₹{(b.total - b.spent).toLocaleString('en-IN')} left</p>
                      </div>
                    ))}
                  </div>
                )}
                {activeDemoStep === 2 && (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Savings goals</p>
                    {[
                      { name: 'Emergency fund', current: 15000, target: 30000, pct: 50,  color: '#3b82f6', daysLeft: 203 },
                      { name: 'Trip to Manali', current:  4200, target: 12000, pct: 35,  color: '#a855f7', daysLeft: 268 },
                      { name: 'New laptop',     current: 28000, target: 28000, pct: 100, color: '#22c55e', daysLeft: 0   },
                    ].map((g, i) => (
                      <div key={g.name}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-gray-400">{g.name}</span>
                          {g.pct === 100 ? <span className="text-green-400 font-semibold">✓ Done</span> : <span className="text-gray-500">{g.daysLeft}d left</span>}
                        </div>
                        <ProgressBar percent={g.pct} color={g.color} delay={i * 0.12} />
                        <div className="flex justify-between mt-1">
                          <span className="text-[10px] text-gray-600">₹{g.current.toLocaleString('en-IN')}</span>
                          <span className="text-[10px]" style={{ color: g.color }}>₹{g.target.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {activeDemoStep === 3 && (
                  <div className="space-y-4">
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Spending breakdown</p>
                    <div className="flex items-center gap-5">
                      <div>
                        <p className="text-2xl font-bold">₹40,500</p>
                        <p className="text-xs text-gray-500 mt-0.5">Total expenses this month</p>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 inline-block mt-2">−8% vs last month</span>
                      </div>
                      <svg viewBox="0 0 80 80" className="w-20 h-20 flex-shrink-0">
                        <circle cx="40" cy="40" r="30" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                        <circle cx="40" cy="40" r="30" fill="none" stroke="#3b82f6" strokeWidth="8" strokeDasharray="188.4" strokeDashoffset={188.4 * 0.44} transform="rotate(-90 40 40)" />
                        <circle cx="40" cy="40" r="30" fill="none" stroke="#a855f7" strokeWidth="8" strokeDasharray="188.4" strokeDashoffset={188.4 * 0.68} transform="rotate(118 40 40)" />
                        <circle cx="40" cy="40" r="30" fill="none" stroke="#f59e0b" strokeWidth="8" strokeDasharray="188.4" strokeDashoffset={188.4 * 0.82} transform="rotate(190 40 40)" />
                      </svg>
                    </div>
                    <div className="space-y-2 pt-1">
                      {[
                        { label: 'Food & dining', amt: '₹12,400', color: '#3b82f6' },
                        { label: 'Transport',     amt: '₹4,800',  color: '#a855f7' },
                        { label: 'Shopping',      amt: '₹9,200',  color: '#f59e0b' },
                      ].map(r => (
                        <div key={r.label} className="flex justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: r.color }} />
                            <span className="text-gray-400">{r.label}</span>
                          </div>
                          <span className="text-gray-300">{r.amt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, scale: 0.94 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }} transition={{ ease: [0.16, 1, 0.3, 1] }}
            className="bg-gradient-to-r from-blue-600/15 to-purple-600/15 rounded-3xl p-12 border border-white/10 relative overflow-hidden"
          >
            {/* Animated shimmer */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent pointer-events-none"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
            />
            <motion.h2
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="text-3xl md:text-4xl font-bold mb-3 relative"
            >
              Ready to take control?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: 0.2 }}
              className="text-gray-400 mb-7 relative text-sm max-w-md mx-auto leading-relaxed"
            >
              Join thousands of users who are already managing their money smarter — for free, forever.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: 0.3 }}
              className="flex justify-center"
            >
              <MagneticButton
                onClick={() => navigate('/register')}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-blue-500/30 hover:shadow-xl transition-all text-sm relative"
              >
                Create free account <ArrowRight className="w-4 h-4" />
              </MagneticButton>
            </motion.div>
            <p className="text-xs text-gray-600 mt-4 relative">No credit card required · Free forever</p>
          </motion.div>
        </div>
      </section>
     


<footer className="py-10 px-6 border-t border-white/10 bg-gray-900/30">
  <div className="max-w-6xl mx-auto">
    <div className="grid md:grid-cols-3 gap-8 mb-8">
      {/* Brand Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            FinanceTracker
          </span>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed max-w-md">
          Smart personal finance management to help you track expenses, 
          set budgets, and achieve your savings goals.
        </p>
      </div>

      {/* Quick Links */}
      <div>
        <h4 className="font-semibold text-sm text-gray-400 mb-3">Explore</h4>
        <ul className="space-y-2">
          <li><a href="#features" className="text-sm text-gray-500 hover:text-blue-400 transition-colors">Features</a></li>
          <li><a href="#demo" className="text-sm text-gray-500 hover:text-blue-400 transition-colors">Live Demo</a></li>
          <li><a href="#stats" className="text-sm text-gray-500 hover:text-blue-400 transition-colors">Statistics</a></li>
        </ul>
      </div>

      {/* Connect Section */}
      <div>
        <h4 className="font-semibold text-sm text-gray-400 mb-3">Connect</h4>
        <div className="space-y-3">
          <a 
            href="https://github.com/adityaagg4689" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-sm text-gray-500 hover:text-white transition-colors duration-200 group"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center group-hover:bg-gray-700 transition-colors">
              <GithubIcon />
            </div>
            <span>GitHub</span>
            <span className="text-xs text-gray-600 ml-auto">/adityaagg4689</span>
          </a>
          
          <a 
            href="https://www.linkedin.com/in/aditya-aggarwal-432312367/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-sm text-gray-500 hover:text-white transition-colors duration-200 group"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center group-hover:bg-gray-700 transition-colors">
              <LinkedinIcon />
            </div>
            <span>LinkedIn</span>
            <span className="text-xs text-gray-600 ml-auto">Connect</span>
          </a>
          
          <a 
            href="mailto:aggarwaladitya892@gmail.com"
            className="flex items-center gap-3 text-sm text-gray-500 hover:text-white transition-colors duration-200 group"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center group-hover:bg-gray-700 transition-colors">
              <Mail className="w-4 h-4" />
            </div>
            <span>Email</span>
            <span className="text-xs text-gray-600 ml-auto">aggarwaladitya892@gmail.com</span>
          </a>
        </div>
      </div>
    </div>

    {/* Bottom Bar */}
    <div className="pt-6 mt-4 border-t border-white/10 flex flex-wrap justify-between items-center gap-4">
      <p className="text-xs text-gray-500">
        © {new Date().getFullYear()} FinanceTracker. Built with ❤️ for better financial health
      </p>
      <div className="flex gap-2">
        <a 
          href="https://github.com/adityaagg4689" 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
          aria-label="GitHub"
        >
          <GithubIcon />
        </a>
        <a 
          href="https://www.linkedin.com/in/aditya-aggarwal-432312367/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
          aria-label="LinkedIn"
        >
          <LinkedinIcon />
        </a>
        <a 
          href="mailto:aggarwaladitya892@gmail.com"
          className="p-1.5 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
          aria-label="Email"
        >
          <Mail className="w-3.5 h-3.5 text-gray-400 hover:text-white" />
        </a>
      </div>
    </div>
  </div>
</footer>

   </div>
  );
}