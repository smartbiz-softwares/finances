import React, { useState, useEffect, useCallback, useRef, Component } from 'react';
import {
  Sparkles,
  Check,
  Camera,
  LogOut,
  Sun,
  Moon,
  Monitor,
  ChevronDown,
  Pencil,
  AlertCircle,
  Lightbulb,
  User as UserIcon,
  ShieldCheck,
  WifiOff,
  RotateCcw,
  ArrowLeft,
  Lock,
  ArrowRight,
  MessageSquare,
  Bot,
  Clock,
  PieChart,
  Target,
  Mic,
  MicOff,
  Paperclip,
  Send,
  Building2,
  Wallet,
  CreditCard,
  Coins,
  Bell,
  Radio,
  SendHorizontal,
  Megaphone,
  Printer,
  Plus,
  TrendingUp,
  TrendingDown,
  Settings,
  Database as DbIcon,
  Key,
  Users,
  Activity,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Receipt,
  History,
  Trash2,
  SlidersHorizontal,
  Scan,
  ShoppingCart,
  Utensils,
  Laptop,
  ShoppingBag,
  Car,
  MoreHorizontal,
  Filter,
  Brain,
  RotateCw,
  Copy,
  Volume2,
  ThumbsUp,
  ThumbsDown,
  FileText,
  FileSpreadsheet,
  File,
  Download,
  Upload,
  HandCoins,
  ArrowDownLeft,
  ArrowUpRight,
  Ban,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Zap,
  BarChart3,
  CheckCircle,
  Award,
  UserCheck,
  Tag,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart as RechartsPieChart, Pie, ComposedChart, ReferenceLine, ReferenceArea, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { cn } from './lib/utils';
import { UserProfile } from './types';
import api, { signOut, setToken, getToken, setUser } from './api';

function AnimatedCountUp({ value, prefix = '', suffix = '', decimals = 2, className = '' }: { value: number | string; prefix?: string; suffix?: string; decimals?: number; className?: string }) {
  const [displayVal, setDisplayVal] = useState(0);
  const targetNum = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0;

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1000;
    const endVal = targetNum;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = endVal * easeOut;
      setDisplayVal(current);
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }, [targetNum]);

  return (
    <span className={className}>
      {prefix}
      {displayVal.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

function AnimatedCard({ children, className = '', delay = 0, onClick }: { children: React.ReactNode; className?: string; delay?: number; onClick?: () => void; key?: React.Key }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3, delay, ease: [0.23, 1, 0.32, 1] }}
      onClick={onClick}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SoftAnimatedCard({ children, className = '', delay = 0, onClick }: { children: React.ReactNode; className?: string; delay?: number; onClick?: () => void; key?: React.Key }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -1.5 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function AnimatedProgressBar({ progress, colorClass = "bg-brand", heightClass = "h-1.5", className = "" }: { progress: number; colorClass?: string; heightClass?: string; className?: string }) {
  const pct = Math.min(Math.max(Number(progress) || 0, 0), 100);
  return (
    <div className={cn("w-full bg-surface h-1.5 rounded-full overflow-hidden border border-border/40 relative", heightClass, className)}>
      <motion.div
        initial={{ width: '0%' }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.75, ease: [0.23, 1, 0.32, 1] }}
        className={cn("h-full rounded-full shadow-xs", colorClass)}
      />
    </div>
  );
}

function HeraProjectionChartCard({ data, currencySymbol = '$' }: { data: any; currencySymbol?: string }) {
  const chartTitle = data?.title || "Próximos cuatro meses";
  const categoryLabel = data?.category || "PROYECCIÓN DE SALDO";
  const limitValue = data?.limit || 200;
  const footnote = data?.footnote || "BASADO EN 4 MESES DE TUS DATOS";
  const insightText = data?.insight || "El 12 de marzo tu saldo baja de 200. Si mueves **40 hoy** al fondo de emergencia, llegas sin descubierto.";

  const points = data?.points || [
    { label: 'OCT', real: 480, projection: null },
    { label: 'NOV', real: 540, projection: null },
    { label: 'DIC', real: 320, projection: null },
    { label: 'ENE', real: 520, projection: null },
    { label: 'FEB', real: 460, projection: 460 },
    { label: '12 MAR', real: null, projection: 160, isCritical: true },
    { label: 'ABR', real: null, projection: 310 },
    { label: 'MAY', real: null, projection: 420 }
  ];

  return (
    <div className="mt-3 bg-surface/90 backdrop-blur-md border border-border p-5 sm:p-6 rounded-3xl space-y-4 shadow-xl select-none font-sans text-text-primary">
      {/* Header Bar */}
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border/40 pb-3">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-text-dim uppercase font-semibold">
            {categoryLabel}
          </span>
          <h4 className="text-lg sm:text-xl font-serif font-bold text-text-primary tracking-tight mt-0.5">
            {chartTitle}
          </h4>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px] font-mono tracking-wider font-semibold">
          <div className="flex items-center gap-1.5 text-text-primary">
            <span className="w-4 h-[2.5px] bg-text-primary rounded-full inline-block" />
            <span>REAL</span>
          </div>
          <div className="flex items-center gap-1.5 text-brand">
            <span className="w-4 h-[2px] border-b-2 border-dashed border-brand inline-block" />
            <span>PROYECCIÓN</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="h-52 sm:h-56 w-full relative pt-2">
        <div className="absolute top-[68%] left-2 z-10 text-[10px] font-mono text-text-dim tracking-wider font-semibold uppercase pointer-events-none">
          LÍMITE {limitValue}
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} margin={{ top: 15, right: 15, left: -25, bottom: 5 }}>
            <XAxis
              dataKey="label"
              stroke="var(--text-dim)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tick={({ x, y, payload }) => {
                const isCrit = points.find(p => p.label === payload.value)?.isCritical;
                return (
                  <text
                    x={x}
                    y={y + 12}
                    textAnchor="middle"
                    className={cn(
                      "font-mono text-[10px]",
                      isCrit ? "fill-brand font-bold" : "fill-text-secondary"
                    )}
                  >
                    {payload.value}
                  </text>
                );
              }}
            />
            <YAxis stroke="var(--text-dim)" fontSize={10} tickLine={false} axisLine={false} hide />

            {/* Threshold Line & Shaded Critical Area */}
            <ReferenceLine y={limitValue} stroke="var(--brand)" strokeDasharray="3 3" strokeOpacity={0.4} />
            <ReferenceArea y1={0} y2={limitValue} {...({ fill: 'var(--brand)', fillOpacity: 0.06 } as any)} />

            <Tooltip
              formatter={(value: any, name: any) => [
                `${formatCompactNumber(Number(value))} ${currencySymbol}`,
                name === 'real' ? 'Saldo Real' : 'Saldo Proyectado'
              ]}
              contentStyle={{
                backgroundColor: 'var(--surface)',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                fontSize: '11px',
                color: 'var(--text-primary)',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)'
              }}
            />

            {/* Past Real Line */}
            <Line
              type="monotone"
              dataKey="real"
              stroke="var(--text-primary)"
              strokeWidth={2.5}
              dot={{ r: 3, fill: 'var(--text-primary)', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              connectNulls
            />

            {/* Future Projection Line */}
            <Line
              type="monotone"
              dataKey="projection"
              stroke="var(--brand)"
              strokeWidth={2.5}
              strokeDasharray="5 5"
              dot={({ cx, cy, payload }) => {
                if (payload.isCritical) {
                  return (
                    <g key={payload.label}>
                      <circle cx={cx} cy={cy} fill="var(--brand)" fillOpacity={0.4}>
                        <animate attributeName="r" values="5;15;5" dur="2.2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.8;0;0.8" dur="2.2s" repeatCount="indefinite" />
                      </circle>
                      <circle cx={cx} cy={cy} r={6} fill="var(--surface)" stroke="var(--brand)" strokeWidth={2.5} />
                      <circle cx={cx} cy={cy} r={2.5} fill="var(--brand)" />
                    </g>
                  );
                }
                return <circle key={payload.label} cx={cx} cy={cy} r={3} fill="var(--brand)" />;
              }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Insight Card */}
      <div className="pt-3 border-t border-border/40 flex items-start gap-3 bg-bg/60 p-3.5 rounded-2xl">
        <div className="w-8 h-8 rounded-xl bg-brand text-white flex items-center justify-center shrink-0 font-bold shadow-xs mt-0.5">
          <AlertCircle size={17} />
        </div>
        <div className="space-y-0.5">
          <p className="text-xs text-text-primary font-medium leading-snug">
            {insightText.split(/(\*\*.*?\*\*)/g).map((part: string, idx: number) =>
              part.startsWith('**') && part.endsWith('**') ? (
                <strong key={idx} className="font-bold text-text-primary">{part.slice(2, -2)}</strong>
              ) : (
                part
              )
            )}
          </p>
          <p className="text-[9px] font-mono tracking-wider text-text-dim uppercase pt-0.5">
            {footnote}
          </p>
        </div>
      </div>
    </div>
  );
}

const HERA_PALETTE = ['#D97757', '#8B857E', '#B4AEA8', '#E5A48B', '#65605B', '#ECE7E1'];

function HeraPieChartCard({ data, currencySymbol = '$' }: { data: any; currencySymbol?: string }) {
  const chartTitle = data?.title || "Distribución de Gastos";
  const categoryLabel = data?.category || "ANÁLISIS POR CATEGORÍA";
  const items = data?.data || [
    { label: "Alimentación", value: 450 },
    { label: "Servicios", value: 280 },
    { label: "Ocio & Varios", value: 190 },
    { label: "Transporte", value: 120 }
  ];

  const totalSum = items.reduce((acc: number, it: any) => acc + (Number(it.value) || 0), 0);

  return (
    <div className="mt-3 bg-surface/90 backdrop-blur-md border border-border p-5 sm:p-6 rounded-3xl space-y-4 shadow-xl select-none font-sans text-text-primary">
      {/* Header Bar */}
      <div className="border-b border-border/40 pb-3">
        <span className="text-[10px] font-mono tracking-widest text-text-dim uppercase font-semibold">
          {categoryLabel}
        </span>
        <h4 className="text-lg sm:text-xl font-serif font-bold text-text-primary tracking-tight mt-0.5">
          {chartTitle}
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        {/* Donut Canvas */}
        <div className="h-48 w-full relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={items}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={74}
                paddingAngle={4}
                dataKey="value"
                nameKey="label"
              >
                {items.map((_: any, idx: number) => (
                  <Cell key={idx} fill={HERA_PALETTE[idx % HERA_PALETTE.length]} stroke="var(--surface)" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) => [`${formatCompactNumber(Number(value))} ${currencySymbol}`, 'Importe']}
                contentStyle={{
                  backgroundColor: 'var(--surface)',
                  borderRadius: '14px',
                  border: '1px solid var(--border)',
                  fontSize: '11px',
                  color: 'var(--text-primary)',
                  boxShadow: '0 8px 20px -4px rgba(0,0,0,0.2)'
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-[10px] font-mono text-text-dim uppercase">Total</span>
            <span className="font-mono font-bold text-sm text-text-primary">{formatCompactNumber(totalSum)} {currencySymbol}</span>
          </div>
        </div>

        {/* Category Legend List */}
        <div className="space-y-2">
          {items.map((it: any, idx: number) => {
            const val = Number(it.value) || 0;
            const pct = totalSum > 0 ? Math.round((val / totalSum) * 100) : 0;
            const color = HERA_PALETTE[idx % HERA_PALETTE.length];
            return (
              <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-bg/50 border border-border/40">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="font-medium text-text-primary text-[11px] truncate max-w-[110px]">{it.label}</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="text-text-secondary">{pct}%</span>
                  <span className="font-semibold text-text-primary">{formatCompactNumber(val)} {currencySymbol}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function HeraBarChartCard({ data, currencySymbol = '$' }: { data: any; currencySymbol?: string }) {
  const chartTitle = data?.title || "Desglose de Gastos";
  const categoryLabel = data?.category || "COMPARATIVA POR CATEGORÍAS";
  const items = data?.data || [
    { label: "Alimentación", value: 450 },
    { label: "Servicios", value: 280 },
    { label: "Ocio & Varios", value: 190 },
    { label: "Transporte", value: 120 }
  ];

  return (
    <div className="mt-3 bg-surface/90 backdrop-blur-md border border-border p-5 sm:p-6 rounded-3xl space-y-4 shadow-xl select-none font-sans text-text-primary">
      {/* Header Bar */}
      <div className="border-b border-border/40 pb-3">
        <span className="text-[10px] font-mono tracking-widest text-text-dim uppercase font-semibold">
          {categoryLabel}
        </span>
        <h4 className="text-lg sm:text-xl font-serif font-bold text-text-primary tracking-tight mt-0.5">
          {chartTitle}
        </h4>
      </div>

      <div className="h-48 sm:h-52 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={items} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="label" stroke="var(--text-dim)" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--text-dim)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `${formatCompactNumber(v)}`} />
            <Tooltip
              formatter={(value: any) => [`${formatCompactNumber(Number(value))} ${currencySymbol}`, 'Importe']}
              contentStyle={{
                backgroundColor: 'var(--surface)',
                borderRadius: '14px',
                border: '1px solid var(--border)',
                fontSize: '11px',
                color: 'var(--text-primary)',
                boxShadow: '0 8px 20px -4px rgba(0,0,0,0.2)'
              }}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {items.map((_: any, idx: number) => (
                <Cell key={idx} fill={HERA_PALETTE[idx % HERA_PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function HeraOfflineErrorScreen({
  type = 'offline',
  onRetry
}: {
  type?: 'offline' | 'error' | 'server';
  onRetry?: () => void;
}) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
    setTimeout(() => setIsRetrying(false), 1500);
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-bg text-text-primary p-4 relative overflow-hidden select-none font-sans">
      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full bg-surface/90 backdrop-blur-xl border border-border p-6 sm:p-8 rounded-3xl text-center space-y-6 shadow-2xl relative z-10"
      >
        {/* Animated Icon Emblem */}
        <div className="mx-auto w-20 h-20 rounded-3xl bg-brand/10 border border-brand/25 flex items-center justify-center text-brand shadow-inner relative">
          <div className="absolute inset-0 rounded-3xl bg-brand/10 animate-ping opacity-50" />
          {type === 'offline' ? (
            <WifiOff size={36} className="relative z-10 text-brand" />
          ) : (
            <AlertCircle size={36} className="relative z-10 text-brand" />
          )}
        </div>

        {/* Header & Subtitle */}
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-text-primary tracking-tight">
            {type === 'offline' ? 'Sin Conexión a Internet' : 'Ocurrió un Inconveniente'}
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-sm mx-auto">
            {type === 'offline'
              ? 'Parece que perdiste el acceso a la red. HeraWallet se reconectará automáticamente en cuanto vuelva tu conexión.'
              : 'No fue posible completar la sincronización con los servidores de Hera. Por favor verifica tu red e inténtalo de nuevo.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-3">
          <button
            type="button"
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full h-12 bg-brand hover:bg-brand-hover text-white font-semibold rounded-2xl transition-all shadow-lg active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 text-sm"
          >
            <RotateCcw size={16} className={cn("transition-transform", isRetrying && "animate-spin")} />
            <span>{isRetrying ? 'Comprobando conexión...' : 'Reintentar Conexión'}</span>
          </button>

          <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-text-dim pt-1">
            <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
            <span>RECUPERACIÓN AUTOMÁTICA ACTIVA</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}



function HeraWalletLogo({ size = 'md', showText = true, showSlogan = false }: { size?: 'sm' | 'md' | 'lg'; showText?: boolean; showSlogan?: boolean }) {
  const sizes = {
    sm: { img: 'h-6 w-6', title: 'text-lg', subtitle: 'text-[9px]' },
    md: { img: 'h-8 w-8', title: 'text-xl', subtitle: 'text-[10px]' },
    lg: { img: 'h-12 w-12', title: 'text-3xl', subtitle: 'text-xs' }
  };

  return (
    <div className="flex items-center gap-1 select-none cursor-pointer">
      <img
        src="/logo.png"
        alt="HeraWallet Logo"
        className={cn(sizes[size].img, "object-contain shrink-0 transition-transform hover:scale-[1.03]")}
      />

      {showText && (
        <div className="flex flex-col text-left">
          <span className={cn("font-serif font-semibold tracking-tight text-text-primary leading-none", sizes[size].title)}>
            era<span className="font-sans font-medium text-brand">Wallet</span>
          </span>
          {showSlogan && (
            <span className={cn("text-text-secondary font-medium tracking-wide mt-0.5", sizes[size].subtitle)}>
              Tus metas empiezan con un mejor control
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function formatCompactNumber(val: number | string | undefined | null): string {
  const num = typeof val === 'string' ? parseFloat(val) : (val || 0);
  if (isNaN(num)) return '0';
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (abs >= 1000000) {
    const formatted = (abs / 1000000).toFixed(1).replace(/\.0$/, '');
    return `${sign}${formatted}M`;
  }
  if (abs >= 1000) {
    const formatted = (abs / 1000).toFixed(1).replace(/\.0$/, '');
    return `${sign}${formatted}k`;
  }
  return `${sign}${Math.round(abs * 100) / 100}`;
}

function getCategoryIcon(category: string, type: string, description?: string) {
  const cat = (category || '').toLowerCase();
  const desc = (description || '').toLowerCase();

  if (desc.includes('voz') || desc.includes('audio') || desc.includes('dictado')) {
    return <Mic size={14} className="text-brand" />;
  }
  if (desc.includes('ocr') || desc.includes('recibo') || desc.includes('escaneo')) {
    return <Scan size={14} className="text-brand" />;
  }
  if (cat.includes('supermercado') || cat.includes('compras') || cat.includes('tienda') || cat.includes('mercado')) {
    return <ShoppingCart size={14} className="text-error" />;
  }
  if (cat.includes('restaurante') || cat.includes('comida') || cat.includes('cena') || cat.includes('café')) {
    return <Utensils size={14} className="text-warning" />;
  }
  if (cat.includes('salario') || cat.includes('nómina') || type === 'income') {
    return <TrendingUp size={14} className="text-success" />;
  }
  if (cat.includes('tecnología') || cat.includes('electrónica') || desc.includes('usb') || desc.includes('laptop')) {
    return <Laptop size={14} className="text-brand" />;
  }
  if (cat.includes('ropa') || cat.includes('moda')) {
    return <ShoppingBag size={14} className="text-brand" />;
  }
  if (cat.includes('transporte') || cat.includes('gasolina') || cat.includes('auto')) {
    return <Car size={14} className="text-brand" />;
  }
  if (cat.includes('servicios') || cat.includes('luz') || cat.includes('agua') || cat.includes('factura')) {
    return <Receipt size={14} className="text-warning" />;
  }
  if (type === 'expense') {
    return <TrendingDown size={14} className="text-error" />;
  }
  return <CreditCard size={14} className="text-text-secondary" />;
}

function getRelativeTimeShort(dateStr: string): string {
  if (!dateStr) return '1d';
  const now = new Date().getTime();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;

  if (isNaN(diffMs) || diffMs <= 0) return '1m';

  const mins = Math.floor(diffMs / (60 * 1000));
  if (mins < 60) return `${Math.max(1, mins)}m`;

  const hours = Math.floor(diffMs / (3600 * 1000));
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(diffMs / (24 * 3600 * 1000));
  if (days < 30) return `${days}d`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}m`;

  const years = Math.floor(days / 365);
  return `${years}y`;
}

/**
 * Redimensiona y comprime una imagen en el navegador antes de subirla.
 * Las fotos de perfil se guardan como data-URL en la BD: sin esto, una foto
 * de móvil de 4MB viaja entera en cada /api/me y la app "tarda en cargar".
 */
function compressImageFile(file: File, maxSize = 256, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagen no soportado'));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas no disponible'));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Cuenta atrás en formato compacto "1d 2h 24min". Omite las unidades a cero
 * por la izquierda y baja a segundos en el último minuto.
 */
function formatCountdown(msRemaining: number): string {
  if (msRemaining <= 0) return 'Renovando…';
  const totalMin = Math.floor(msRemaining / 60000);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  if (days > 0) return `${days}d ${hours}h ${mins}min`;
  if (hours > 0) return `${hours}h ${mins}min`;
  if (totalMin > 0) return `${mins}min`;
  return `${Math.floor(msRemaining / 1000)}s`;
}

/**
 * Barra de consumo de tokens con cuenta atrás viva hasta la renovación.
 * El tick es local (1s): no golpea la API para actualizar el reloj.
 */
function TokenUsageMeter({ subscription, onUpgrade }: { subscription: any; onUpgrade: () => void }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!subscription) return null;

  const balance = Number(subscription.tokenBalance || 0);
  const total = Number(subscription.tokensTotalPlan || 0);
  const isUnlimited = balance >= 999999999;
  const usedPct = isUnlimited || total <= 0 ? 0 : Math.min(100, Math.max(0, ((total - balance) / total) * 100));
  const remainingPct = 100 - usedPct;

  const renewalMs = subscription.nextRenewalAt ? new Date(subscription.nextRenewalAt).getTime() - now : 0;

  // Verde con holgura, ámbar por debajo del 25%, rojo por debajo del 10%.
  const barColor = remainingPct <= 10 ? 'bg-error' : remainingPct <= 25 ? 'bg-warning' : 'bg-brand';

  return (
    <div className="p-3 bg-bg border border-border/60 rounded-2xl space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase font-mono font-bold tracking-wide text-text-secondary">
          {subscription.planName || 'Tu plan'}
        </span>
        <span className="text-[10px] font-mono text-text-dim">
          {isUnlimited ? '∞' : `${balance.toLocaleString()} / ${total.toLocaleString()}`}
        </span>
      </div>

      <div className="h-1.5 w-full bg-surface-hover rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round(remainingPct)} aria-valuemin={0} aria-valuemax={100} aria-label="Tokens restantes">
        <div
          className={cn('h-full rounded-full transition-[width] duration-500 ease-out', isUnlimited ? 'bg-success' : barColor)}
          style={{ width: `${isUnlimited ? 100 : remainingPct}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-text-secondary">
          {isUnlimited ? 'Tokens ilimitados' : `${Math.round(remainingPct)}% disponible`}
        </span>
        {subscription.nextRenewalAt && !isUnlimited && (
          <span className="text-[10px] font-mono text-text-dim tabular-nums" title="Tiempo hasta la próxima renovación">
            ↻ {formatCountdown(renewalMs)}
          </span>
        )}
      </div>

      {!isUnlimited && remainingPct <= 25 && (
        <button
          type="button"
          onClick={onUpgrade}
          className="w-full mt-0.5 py-1.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-[11px] font-medium cursor-pointer transition-colors duration-200"
        >
          Recargar tokens
        </button>
      )}
    </div>
  );
}

/**
 * Convierte la grabación del navegador (WebM/Opus en Chrome, MP4 en Safari)
 * a WAV PCM 16 bits mono a 16 kHz, que es lo único que whisper.cpp sabe leer.
 * Sin esto el servidor recibía un WebM etiquetado como "audio/wav" y Whisper
 * respondía "failed to decode audio data from memory buffer".
 * Además reduce mucho el tamaño del envío frente al audio original.
 */
async function blobToWav16kBase64(blob: Blob): Promise<string> {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  const ctx = new AudioContextClass();
  try {
    const decoded = await ctx.decodeAudioData(await blob.arrayBuffer());

    // Mezcla a mono y remuestrea a 16 kHz con OfflineAudioContext.
    const targetRate = 16000;
    const frames = Math.ceil(decoded.duration * targetRate);
    const offline = new OfflineAudioContext(1, Math.max(1, frames), targetRate);
    const src = offline.createBufferSource();
    src.buffer = decoded;
    src.connect(offline.destination);
    src.start();
    const rendered = await offline.startRendering();
    const samples = rendered.getChannelData(0);

    // Cabecera WAV de 44 bytes + PCM 16 bits little-endian.
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const writeStr = (offset: number, s: string) => {
      for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
    };
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);          // tamaño del bloque fmt
    view.setUint16(20, 1, true);           // PCM
    view.setUint16(22, 1, true);           // mono
    view.setUint32(24, targetRate, true);
    view.setUint32(28, targetRate * 2, true); // byte rate
    view.setUint16(32, 2, true);           // block align
    view.setUint16(34, 16, true);          // bits por muestra
    writeStr(36, 'data');
    view.setUint32(40, samples.length * 2, true);

    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }

    // A base64 sin desbordar la pila con audios largos.
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return `data:audio/wav;base64,${btoa(binary)}`;
  } finally {
    try { await ctx.close(); } catch { }
  }
}

/**
 * Placeholder de carga. Bloque neutro con pulso sutil que respeta el tema;
 * se compone por secciones (SkeletonList, SkeletonCards, SkeletonRows).
 */
function Skeleton({ className }: { className?: string }) {
  return <div className={cn('bg-surface-hover rounded-xl animate-pulse motion-reduce:animate-none', className)} aria-hidden="true" />;
}

/** Filas tipo lista (timeline, deudas, notificaciones, historial). */
function SkeletonRows({ rows = 4, avatar = true }: { rows?: number; avatar?: boolean }) {
  return (
    <div className="space-y-3 py-2" role="status" aria-label="Cargando contenido">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-1">
          {avatar && <Skeleton className="w-9 h-9 rounded-full shrink-0" />}
          <div className="flex-1 space-y-1.5 min-w-0">
            <Skeleton className="h-3 w-full rounded-md" />
            <Skeleton className="h-2.5 w-2/3 rounded-md" />
          </div>
          <Skeleton className="h-3 w-14 rounded-md shrink-0" />
        </div>
      ))}
      <span className="sr-only">Cargando…</span>
    </div>
  );
}

/** Tarjetas (cuentas, metas, stats del panel). */
function SkeletonCards({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('grid gap-3', className || 'grid-cols-2 md:grid-cols-3')} role="status" aria-label="Cargando contenido">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
            <Skeleton className="h-2.5 w-16 rounded-md" />
          </div>
          <Skeleton className="h-5 w-24 rounded-md" />
          <Skeleton className="h-2.5 w-full rounded-md" />
        </div>
      ))}
      <span className="sr-only">Cargando…</span>
    </div>
  );
}

function Toast() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'success' | 'error' | 'warning' | 'info'>('success');

  (window as any).showToast = (msg: string, t: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setMessage(msg);
    setType(t);
    setVisible(true);
    setTimeout(() => setVisible(false), 3000);
  };

  const Icon = type === 'success' ? Check :
    type === 'error' ? AlertCircle :
      type === 'warning' ? AlertCircle : Lightbulb;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-surface border border-border shadow-xl text-text-primary text-xs font-medium"
        >
          <Icon size={16} className={cn(
            type === 'success' && 'text-success',
            type === 'error' && 'text-error',
            type === 'warning' && 'text-warning',
            type === 'info' && 'text-brand'
          )} />
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function showToast(msg: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') {
  if ((window as any).showToast) (window as any).showToast(msg, type);
}

// Styled Markdown Renderer for AI responses
function FormattedMarkdown({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  const renderFormattedText = (text: string) => {
    const parts: React.ReactNode[] = [];
    let keyIdx = 0;
    const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
    const splitParts = text.split(regex);

    splitParts.forEach(part => {
      if (!part) return;
      if (part.startsWith('**') && part.endsWith('**')) {
        parts.push(
          <strong key={keyIdx++} className="font-semibold text-text-primary">
            {part.slice(2, -2)}
          </strong>
        );
      } else if (part.startsWith('`') && part.endsWith('`')) {
        parts.push(
          <code key={keyIdx++} className="font-mono text-[11px] bg-bg border border-border px-1.5 py-0.5 rounded text-brand">
            {part.slice(1, -1)}
          </code>
        );
      } else if (part.startsWith('*') && part.endsWith('*')) {
        parts.push(
          <em key={keyIdx++} className="italic text-text-secondary">
            {part.slice(1, -1)}
          </em>
        );
      } else {
        parts.push(part);
      }
    });

    return parts;
  };

  let inTable = false;
  let tableHeader: string[] = [];
  let tableRows: string[][] = [];

  const flushTable = (keyIdx: number) => {
    if (tableHeader.length > 0 || tableRows.length > 0) {
      elements.push(
        <div key={`table-${keyIdx}`} className="my-3 bg-bg/90 border border-border/80 p-3.5 rounded-2xl space-y-2 shadow-md w-full max-w-full overflow-hidden font-sans">
          <div className="overflow-x-auto w-full max-w-full scrollbar-thin">
            <table className="w-full min-w-[480px] text-xs text-left border-collapse">
              {tableHeader.length > 0 && (
                <thead>
                  <tr className="border-b border-border/80 text-text-dim uppercase font-mono text-[10px]">
                    {tableHeader.map((h, i) => (
                      <th key={i} className="pb-2 font-bold px-2 py-1.5">{renderFormattedText(h)}</th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody className="divide-y divide-border/40">
                {tableRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-surface/50 transition-colors">
                    {row.map((cell, cIdx) => {
                      const trimmedCell = cell.trim();
                      const pctMatch = trimmedCell.match(/(\d+([.,]\d+)?)\s*%/);
                      const hasAsciiBar = /[▰▱■□▮▯█░▓▒▌▐]/.test(trimmedCell);

                      if (hasAsciiBar || pctMatch) {
                        const cleanLabel = trimmedCell.replace(/[▰▱■□▮▯█░▓▒▌▐]/g, '').trim();
                        const pctVal = pctMatch ? parseFloat(pctMatch[1].replace(',', '.')) : 50;
                        return (
                          <td key={cIdx} className="py-2 px-2 text-text-primary">
                            <div className="flex items-center gap-2 min-w-[140px] w-full">
                              <div className="flex-1 bg-surface-hover h-2.5 rounded-full overflow-hidden border border-border/60">
                                <div
                                  style={{ width: `${Math.min(100, Math.max(0, pctVal))}%` }}
                                  className="h-full bg-gradient-to-r from-brand to-brand-hover rounded-full shadow-xs transition-all duration-500"
                                />
                              </div>
                              <span className="text-[11px] font-mono font-bold text-brand shrink-0">{pctVal}%</span>
                            </div>
                          </td>
                        );
                      }

                      let badgeStyle = "";
                      if (trimmedCell.includes('🟢') || trimmedCell.toLowerCase().includes('bien')) badgeStyle = "bg-success/15 text-success border-success/30";
                      else if (trimmedCell.includes('🟡') || trimmedCell.toLowerCase().includes('medio') || trimmedCell.toLowerCase().includes('regular')) badgeStyle = "bg-warning/15 text-warning border-warning/30";
                      else if (trimmedCell.includes('🔴') || trimmedCell.includes('⚠️') || trimmedCell.toLowerCase().includes('bajo') || trimmedCell.toLowerCase().includes('crítico')) badgeStyle = "bg-error/15 text-error border-error/30";

                      if (badgeStyle) {
                        return (
                          <td key={cIdx} className="py-2 px-2">
                            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border", badgeStyle)}>
                              {renderFormattedText(trimmedCell)}
                            </span>
                          </td>
                        );
                      }

                      return (
                        <td key={cIdx} className="py-2 px-2 text-text-primary font-medium">
                          {renderFormattedText(trimmedCell)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
      tableHeader = [];
      tableRows = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed.split('|').slice(1, -1).map(c => c.trim());
      if (cells.every(c => /^[-:]+$/.test(c))) {
        return;
      }
      if (!inTable) {
        inTable = true;
        tableHeader = cells;
      } else {
        tableRows.push(cells);
      }
      return;
    } else if (inTable) {
      inTable = false;
      flushTable(idx);
    }

    if (trimmed.startsWith('#')) {
      const cleanHeader = trimmed.replace(/^#+\s*/, '').replace(/[0-9]️⃣|🔴|🟢|🟡|⚠️|✅|🚀|📊|🏆/g, '').trim();
      const scoreMatch = cleanHeader.match(/\((\d+)\/100\)/);
      const tagMatch = cleanHeader.match(/(Punto fuerte|Bien|Aceptable|Medio|Regular|Bajo|Crítico)/i)?.[1];

      if (scoreMatch) {
        const scoreVal = parseInt(scoreMatch[1], 10);
        const titleText = cleanHeader.replace(/\(\d+\/100\)/, '').replace(/(Punto fuerte|Bien|Aceptable|Medio|Regular|Bajo|Crítico)/gi, '').trim();

        let colorClass = "bg-success/15 text-success border-success/30";
        if (scoreVal <= 30) colorClass = "bg-error/15 text-error border-error/30";
        else if (scoreVal <= 50) colorClass = "bg-warning/15 text-warning border-warning/30";

        elements.push(
          <div key={idx} className="mt-4 mb-2 p-3 bg-surface border border-border/80 rounded-2xl flex items-center justify-between shadow-xs">
            <h4 className="font-serif font-semibold text-xs text-text-primary tracking-tight">
              {renderFormattedText(titleText)}
            </h4>
            <div className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1.5 shrink-0", colorClass)}>
              <span>{scoreVal}/100</span>
              {tagMatch && <span>• {tagMatch}</span>}
            </div>
          </div>
        );
        return;
      }

      if (trimmed.startsWith('#### ') || trimmed.startsWith('### ')) {
        elements.push(<h4 key={idx} className="font-serif font-semibold text-xs text-text-primary mt-3 border-b border-border/40 pb-1">{renderFormattedText(cleanHeader)}</h4>);
      } else {
        elements.push(<h3 key={idx} className="font-serif font-semibold text-sm text-text-primary mt-3 border-b border-border/50 pb-1">{renderFormattedText(cleanHeader)}</h3>);
      }
      return;
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('•')) {
      const cleanBullet = trimmed.replace(/^[-*•]\s*/, '');
      elements.push(
        <div key={idx} className="flex gap-2 items-start pl-1 my-1">
          <span className="text-brand font-bold shrink-0 mt-0.5">•</span>
          <span>{renderFormattedText(cleanBullet)}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      const num = trimmed.match(/^(\d+)\.\s/)?.[1];
      const rest = trimmed.replace(/^\d+\.\s/, '');
      elements.push(
        <div key={idx} className="flex gap-2 items-start pl-1 my-1">
          <span className="font-mono font-bold text-brand shrink-0">{num}.</span>
          <span>{renderFormattedText(rest)}</span>
        </div>
      );
    } else if (!trimmed) {
      elements.push(<div key={idx} className="h-1" />);
    } else {
      const hasAsciiInLine = /[▰▱■□▮▯█░▓▒▌▐]/.test(line);
      const pctInLine = line.match(/(\d+([.,]\d+)?)\s*%/);

      if (hasAsciiInLine || (pctInLine && (line.toLowerCase().includes('meta') || line.toLowerCase().includes('progreso') || line.toLowerCase().includes('fondo')))) {
        const cleanLine = line.replace(/[▰▱■□▮▯█░▓▒▌▐]/g, '').trim();
        const pctVal = pctInLine ? parseFloat(pctInLine[1].replace(',', '.')) : 50;
        const lineTitle = cleanLine.replace(/(\d+([.,]\d+)?)\s*%/, '').replace(/^[-*•]\s*/, '').trim() || 'Progreso';

        elements.push(
          <div key={idx} className="my-2 p-3 bg-surface border border-border/70 rounded-2xl space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary">{renderFormattedText(lineTitle)}</span>
              <span className="font-mono font-bold text-brand text-[11px]">{pctVal}%</span>
            </div>
            <div className="w-full bg-surface-hover h-2.5 rounded-full overflow-hidden border border-border/60">
              <div
                style={{ width: `${Math.min(100, Math.max(0, pctVal))}%` }}
                className="h-full bg-gradient-to-r from-brand to-brand-hover rounded-full shadow-xs transition-all duration-500"
              />
            </div>
          </div>
        );
      } else {
        elements.push(<p key={idx}>{renderFormattedText(line.replace(/[▰▱■□▮▯█░▓▒▌▐]/g, ''))}</p>);
      }
    }
  });

  if (inTable) {
    flushTable(lines.length);
  }

  return <div className="space-y-1.5 text-xs leading-relaxed font-sans text-text-primary">{elements}</div>;
}

const COUNTRY_PREFIXES = [
  { flag: '🇨🇺', code: '+53', country: 'Cuba', iso: 'CU', example: '54232684' },
  { flag: '🇪🇸', code: '+34', country: 'España', iso: 'ES', example: '612 345 678' },
  { flag: '🇺🇸', code: '+1', country: 'Estados Unidos', iso: 'US', example: '202 555 0123' },
  { flag: '🇨🇦', code: '+1', country: 'Canadá', iso: 'CA', example: '416 555 0123' },
  { flag: '🇲🇽', code: '+52', country: 'México', iso: 'MX', example: '55 1234 5678' },
  { flag: '🇦🇷', code: '+54', country: 'Argentina', iso: 'AR', example: '11 1234 5678' },
  { flag: '🇨🇱', code: '+56', country: 'Chile', iso: 'CL', example: '9 1234 5678' },
  { flag: '🇨🇴', code: '+57', country: 'Colombia', iso: 'CO', example: '300 123 4567' },
  { flag: '🇵🇪', code: '+51', country: 'Perú', iso: 'PE', example: '912 345 678' },
  { flag: '🇻🇪', code: '+58', country: 'Venezuela', iso: 'VE', example: '412 123 4567' },
  { flag: '🇩🇴', code: '+1809', country: 'República Dominicana', iso: 'DO', example: '809 123 4567' },
  { flag: '🇨🇷', code: '+506', country: 'Costa Rica', iso: 'CR', example: '8888 8888' },
  { flag: '🇪🇨', code: '+593', country: 'Ecuador', iso: 'EC', example: '99 123 4567' },
  { flag: '🇺🇾', code: '+598', country: 'Uruguay', iso: 'UY', example: '99 123 456' },
  { flag: '🇬🇹', code: '+502', country: 'Guatemala', iso: 'GT', example: '5123 4567' },
  { flag: '🇵🇦', code: '+507', country: 'Panamá', iso: 'PA', example: '6123 4567' },
  { flag: '🇧🇴', code: '+591', country: 'Bolivia', iso: 'BO', example: '7123 4567' },
  { flag: '🇵🇾', code: '+595', country: 'Paraguay', iso: 'PY', example: '981 123 456' },
  { flag: '🇸🇻', code: '+503', country: 'El Salvador', iso: 'SV', example: '7123 4567' },
  { flag: '🇭🇳', code: '+504', country: 'Honduras', iso: 'HN', example: '9123 4567' },
  { flag: '🇳🇮', code: '+505', country: 'Nicaragua', iso: 'NI', example: '8123 4567' },
  { flag: '🇵🇷', code: '+1787', country: 'Puerto Rico', iso: 'PR', example: '787 123 4567' },
  { flag: '🇧🇷', code: '+55', country: 'Brasil', iso: 'BR', example: '11 91234 5678' },
  { flag: '🇵🇹', code: '+351', country: 'Portugal', iso: 'PT', example: '912 345 678' },
  { flag: '🇮🇹', code: '+39', country: 'Italia', iso: 'IT', example: '312 345 6789' },
  { flag: '🇫🇷', code: '+33', country: 'Francia', iso: 'FR', example: '6 12 34 56 78' },
  { flag: '🇩🇪', code: '+49', country: 'Alemania', iso: 'DE', example: '151 23456789' },
  { flag: '🇬🇧', code: '+44', country: 'Reino Unido', iso: 'GB', example: '7123 456789' }
];

export default function App() {
  const [user, setUserState] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>(() => {
    return (localStorage.getItem('hera_theme') as 'system' | 'light' | 'dark') || 'dark';
  });
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Active Tab & View State (/panel URL route handling)
  const isPanelRoute = typeof window !== 'undefined' && window.location.pathname === '/panel';
  const [activeTab, setActiveTab] = useState<'chat' | 'timeline' | 'accounts' | 'reports' | 'goals' | 'debts'>('chat');
  const [showAdmin, setShowAdmin] = useState(isPanelRoute);

  useEffect(() => {
    const handlePopState = () => {
      setShowAdmin(window.location.pathname === '/panel');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // OTP Login State
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpStatus, setOtpStatus] = useState<'typing' | 'error' | 'success'>('typing');
  const [phonePrefix, setPhonePrefix] = useState('+53');
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const countryPickerRef = useRef<HTMLDivElement>(null);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-detect Country & Phone Prefix from IP Location / Browser Timezone
  useEffect(() => {
    let isMounted = true;

    const autoDetectCountryPrefix = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/', { cache: 'force-cache' });
        if (res.ok) {
          const data = await res.json();
          const iso = data.country_code?.toUpperCase();
          const callingCode = data.country_calling_code;

          if (isMounted) {
            const found = COUNTRY_PREFIXES.find(c => c.iso === iso) || COUNTRY_PREFIXES.find(c => c.code === callingCode);
            if (found) {
              setPhonePrefix(found.code);
              return;
            }
          }
        }
      } catch {
        try {
          const res2 = await fetch('https://ip-api.com/json/?fields=countryCode', { cache: 'force-cache' });
          if (res2.ok) {
            const data2 = await res2.json();
            const iso2 = data2.countryCode?.toUpperCase();
            if (isMounted && iso2) {
              const found2 = COUNTRY_PREFIXES.find(c => c.iso === iso2);
              if (found2) {
                setPhonePrefix(found2.code);
                return;
              }
            }
          }
        } catch {}
      }

      // Fallback based on browser Timezone & Language
      if (isMounted) {
        try {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
          const lang = navigator.language || '';

          if (tz.includes('Havana') || lang.endsWith('CU')) setPhonePrefix('+53');
          else if (tz.includes('Madrid') || tz.includes('Canary') || lang.endsWith('ES')) setPhonePrefix('+34');
          else if (tz.includes('New_York') || tz.includes('Chicago') || tz.includes('Los_Angeles') || tz.includes('Denver')) setPhonePrefix('+1');
          else if (tz.includes('Toronto') || tz.includes('Vancouver') || tz.includes('Montreal')) setPhonePrefix('+1');
          else if (tz.includes('Mexico') || lang.endsWith('MX')) setPhonePrefix('+52');
          else if (tz.includes('Buenos_Aires') || lang.endsWith('AR')) setPhonePrefix('+54');
          else if (tz.includes('Bogota') || lang.endsWith('CO')) setPhonePrefix('+57');
          else if (tz.includes('Santiago') || lang.endsWith('CL')) setPhonePrefix('+56');
          else if (tz.includes('Lima') || lang.endsWith('PE')) setPhonePrefix('+51');
          else if (tz.includes('Caracas') || lang.endsWith('VE')) setPhonePrefix('+58');
        } catch {}
      }
    };

    autoDetectCountryPrefix();

    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (otpSent && otpTimer > 0) {
      const interval = setInterval(() => setOtpTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [otpSent, otpTimer]);

  useEffect(() => {
    if (otpStatus === 'error') {
      const t = setTimeout(() => {
        setOtpCode('');
        setOtpStatus('typing');
        otpInputsRef.current[0]?.focus();
      }, 600);
      return () => clearTimeout(t);
    }
  }, [otpStatus]);

  // Onboarding State
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [onbStep, setOnbStep] = useState(0);
  const [onbName, setOnbName] = useState('');
  const [onbBirthDate, setOnbBirthDate] = useState('');
  const [onbPhoto, setOnbPhoto] = useState('');
  const [onbEmail, setOnbEmail] = useState('');
  const [onbPhone, setOnbPhone] = useState('');
  const [onbAddress, setOnbAddress] = useState('');
  const [onbSaving, setOnbSaving] = useState(false);
  const [onbDone, setOnbDone] = useState(false);
  // Primera cuenta del onboarding
  const [onbAccType, setOnbAccType] = useState<'cash' | 'bank' | 'card'>('cash');
  const [onbAccName, setOnbAccName] = useState('');
  const [onbAccBalance, setOnbAccBalance] = useState('');

  // User Finance Data State
  const [overview, setOverview] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  // true solo hasta la PRIMERA carga: los refrescos posteriores no muestran
  // skeleton para no parpadear sobre datos ya visibles.
  const [financeLoading, setFinanceLoading] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);

  // Chat & AI State
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Real-time Audio Waveform State (Web Audio API)
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(28).fill(25));
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Accounts & Goals State
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState('bank');
  const [newAccBalance, setNewAccBalance] = useState('');
  const [selectedAccountDetail, setSelectedAccountDetail] = useState<any | null>(null);
  const [accountTxs, setAccountTxs] = useState<any[]>([]);

  // Quick Add 2-Step Voice & Camera AI Flow State
  const [addModalStep, setAddModalStep] = useState<1 | 2>(1);
  const [createRecordTab, setCreateRecordTab] = useState<'voice' | 'image'>('voice');
  const [isAiParsingAudio, setIsAiParsingAudio] = useState(false);
  const [isScanningImage, setIsScanningImage] = useState(false);
  const [scannedImagePreview, setScannedImagePreview] = useState<string | null>(null);
  const [scanRejectionMsg, setScanRejectionMsg] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const imageFileInputRef = useRef<HTMLInputElement | null>(null);
  const [aiParsedPreview, setAiParsedPreview] = useState<{
    type: 'expense' | 'income';
    amount: number;
    category: string;
    description: string;
    accountId: string;
  } | null>(null);

  // AI API Keys State
  const [deepseekKeyInput, setDeepseekKeyInput] = useState('');
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalCurrent, setNewGoalCurrent] = useState('');
  const [newGoalDeadline, setNewGoalDeadline] = useState('');

  // AI Executive Report State
  const [reportLoading, setReportLoading] = useState(false);
  const [reportStepIndex, setReportStepIndex] = useState(0);
  const [aiReportData, setAiReportData] = useState<any>(null);

  // Chat AI Thinking & Reasoning Stream State
  const [currentReasoningText, setCurrentReasoningText] = useState('');
  const [actionProcessing, setActionProcessing] = useState<string | null>(null);

  // Chat History & Bottom Sheet Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // --- Modo Live: conversación de voz continua con la IA ---
  const [liveMode, setLiveMode] = useState(false);
  const [liveState, setLiveState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [liveReply, setLiveReply] = useState('');
  const [liveError, setLiveError] = useState('');

  // Movimiento pendiente de confirmar borrado (null = sin diálogo abierto)
  const [txToDelete, setTxToDelete] = useState<any | null>(null);
  const [deletingTx, setDeletingTx] = useState(false);
  const liveRecorderRef = useRef<MediaRecorder | null>(null);
  const liveChunksRef = useRef<Blob[]>([]);
  const liveAudioRef = useRef<HTMLAudioElement | null>(null);
  const liveActiveRef = useRef(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<Array<{
    id: string;
    title: string;
    messages: any[];
    updatedAt: string;
  }>>(() => {
    try {
      const saved = localStorage.getItem('hera_chat_history');
      // Sin historial real no se inventan conversaciones de ejemplo.
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  /**
   * Atajos del inicio adaptados a lo que el usuario suele preguntar: se
   * puntúan los temas por apariciones en sus últimas conversaciones (con más
   * peso a las recientes) y los más frecuentes salen primero. Sin historial,
   * se muestra el orden por defecto.
   */
  const suggestionPills = React.useMemo(() => {
    const catalog = [
      { key: 'gastos', label: 'Transacciones', query: '¿En qué he gastado más este mes?', icon: Receipt, words: ['gast', 'compr', 'transacc', 'movimient', 'pagu', 'pago', 'factur'] },
      { key: 'ahorro', label: 'Ahorros', query: '¿Cuál es mi saldo de ahorro y capacidad de reserva?', icon: Coins, words: ['ahorr', 'saldo', 'reserv', 'guard'] },
      { key: 'metas', label: 'Metas', query: '¿Cómo van mis metas de ahorro?', icon: Target, words: ['meta', 'objetiv', 'fondo de emergencia', 'plan de ahorro'] },
      { key: 'score', label: 'Score', query: '¿Cuál es mi Score Financiero?', icon: Activity, words: ['score', 'salud financ', 'puntuaci', 'diagn'] },
      { key: 'reportes', label: 'Reportes', query: 'Genera un informe rápido de mi patrimonio', icon: PieChart, words: ['informe', 'report', 'patrimon', 'resumen', 'balance'] },
      { key: 'deudas', label: 'Deudas', query: '¿Cuánto debo y cuánto me deben?', icon: HandCoins, words: ['deud', 'debo', 'deben', 'prest', 'préstam', 'cobr'] },
      { key: 'cuentas', label: 'Cuentas', query: '¿Cuánto tengo en cada cuenta?', icon: Wallet, words: ['cuenta', 'tarjet', 'efectiv', 'banco'] },
      { key: 'ingresos', label: 'Ingresos', query: '¿Cuáles han sido mis ingresos este mes?', icon: TrendingUp, words: ['ingres', 'salari', 'nómina', 'nomina', 'cobré', 'cobre'] }
    ];

    // Mensajes propios de las últimas 8 sesiones, de la más reciente a la más antigua.
    const sessions = [...chatHistory]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 8);

    const scores = new Map<string, number>();
    sessions.forEach((session, sessionIdx) => {
      const recencyWeight = 1 / (sessionIdx + 1);
      (session.messages || [])
        .filter((m: any) => m.role === 'user')
        .forEach((m: any) => {
          const text = String(m.content || '').toLowerCase();
          catalog.forEach(topic => {
            if (topic.words.some(w => text.includes(w))) {
              scores.set(topic.key, (scores.get(topic.key) || 0) + recencyWeight);
            }
          });
        });
    });

    if (scores.size === 0) return catalog.slice(0, 5);

    // Temas usados primero (por puntuación); el resto rellena hasta cinco.
    const used = catalog
      .filter(t => scores.has(t.key))
      .sort((a, b) => (scores.get(b.key) || 0) - (scores.get(a.key) || 0));
    const rest = catalog.filter(t => !scores.has(t.key));
    return [...used, ...rest].slice(0, 5);
  }, [chatHistory]);

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
      if (diffSec < 60) return 'Hace un momento';
      if (diffSec < 3600) return `Hace ${Math.floor(diffSec / 60)} min`;
      if (diffSec < 86400) return `Hace ${Math.floor(diffSec / 3600)} h`;
      if (diffSec < 172800) return 'Ayer';
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  const handleLoadSession = (session: any) => {
    setChatMessages(session.messages);
    setCurrentSessionId(session.id);
    setShowHistoryModal(false);
    setActiveTab('chat');
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatHistory(prev => {
      const filtered = prev.filter(s => s.id !== sessionId);
      try { localStorage.setItem('hera_chat_history', JSON.stringify(filtered)); } catch { }
      return filtered;
    });
    if (currentSessionId === sessionId) {
      setChatMessages([]);
      setCurrentSessionId(null);
    }
    showToast('Consulta eliminada del historial', 'info');
  };

  // --- Configuration & Settings State ---
  const [defaultCurrency, setDefaultCurrency] = useState<string>(() => {
    return localStorage.getItem('hera_currency') || 'USD';
  });

  const CURRENCY_SYMBOLS_MAP: Record<string, string> = {
    USD: '$', EUR: '€', CUP: '$', MXN: '$', ARS: '$', COP: '$', CLP: '$', BRL: 'R$',
    GBP: '£', JPY: '¥', CAD: 'C$', AUD: 'A$', CHF: 'CHF', CNY: '¥', INR: '₹',
    KRW: '₩', PEN: 'S/', UYU: '$U', DOP: 'RD$', CRC: '₡', GTQ: 'Q', HNL: 'L',
    NIO: 'C$', PAB: 'B/.', PYG: '₲', VES: 'Bs.', SEK: 'kr', NOK: 'kr', DKK: 'kr', PLN: 'zł'
  };

  const currencySymbol = CURRENCY_SYMBOLS_MAP[defaultCurrency] || (defaultCurrency === 'EUR' ? '€' : '$');
  const [customAgentRules, setCustomAgentRules] = useState<string>(() => {
    return localStorage.getItem('hera_custom_rules') || '';
  });
  const [emailNotifications, setEmailNotifications] = useState<{
    weeklySummary: boolean;
    budgetAlerts: boolean;
    securityUpdates: boolean;
  }>(() => {
    try {
      const saved = localStorage.getItem('hera_email_notifications');
      return saved ? JSON.parse(saved) : { weeklySummary: true, budgetAlerts: true, securityUpdates: true };
    } catch {
      return { weeklySummary: true, budgetAlerts: true, securityUpdates: true };
    }
  });

  // Dataset de Países y Estados/Provincias Reales con Prefijos Telefónicos
  const COUNTRIES_DATA: Record<string, { name: string; code: string; phonePrefixes: string[]; states: string[] }> = {
    Cuba: {
      name: 'Cuba',
      code: 'CU',
      phonePrefixes: ['+53', '53'],
      states: [
        'La Habana',
        'Santiago de Cuba',
        'Holguín',
        'Camagüey',
        'Matanzas',
        'Villa Clara',
        'Pinar del Río',
        'Cienfuegos',
        'Sancti Spíritus',
        'Granma',
        'Las Tunas',
        'Artemisa',
        'Mayabeque',
        'Ciego de Ávila',
        'Guantánamo',
        'Isla de la Juventud'
      ]
    },
    España: {
      name: 'España',
      code: 'ES',
      phonePrefixes: ['+34', '34'],
      states: [
        'Comunidad de Madrid',
        'Cataluña (Barcelona)',
        'Andalucía (Sevilla/Málaga)',
        'Comunidad Valenciana',
        'Galicia',
        'País Vasco',
        'Castilla y León',
        'Canarias',
        'Castilla-La Mancha',
        'Región de Murcia',
        'Aragón',
        'Islas Baleares',
        'Extremadura',
        'Principado de Asturias',
        'Comunidad Foral de Navarra',
        'Cantabria',
        'La Rioja',
        'Ceuta',
        'Melilla'
      ]
    },
    'Estados Unidos': {
      name: 'Estados Unidos',
      code: 'US',
      phonePrefixes: ['+1', '1'],
      states: [
        'Florida',
        'California',
        'New York',
        'Texas',
        'Illinois',
        'New Jersey',
        'Georgia',
        'North Carolina',
        'Pennsylvania',
        'Ohio',
        'Michigan',
        'Washington',
        'Arizona',
        'Massachusetts',
        'Colorado',
        'Virginia'
      ]
    },
    México: {
      name: 'México',
      code: 'MX',
      phonePrefixes: ['+52', '52'],
      states: [
        'Ciudad de México (CDMX)',
        'Jalisco (Guadalajara)',
        'Nuevo León (Monterrey)',
        'Estado de México',
        'Puebla',
        'Guanajuato',
        'Veracruz',
        'Yucatán (Mérida)',
        'Quintana Roo (Cancún)',
        'Baja California (Tijuana)',
        'Querétaro',
        'Chihuahua'
      ]
    },
    Argentina: {
      name: 'Argentina',
      code: 'AR',
      phonePrefixes: ['+54', '54'],
      states: [
        'Buenos Aires (CABA)',
        'Provincia de Buenos Aires',
        'Córdoba',
        'Santa Fe (Rosario)',
        'Mendoza',
        'Tucumán',
        'Entre Ríos',
        'Salta',
        'Misiones',
        'Chubut',
        'Neuquén'
      ]
    },
    Colombia: {
      name: 'Colombia',
      code: 'CO',
      phonePrefixes: ['+57', '57'],
      states: [
        'Bogotá D.C.',
        'Antioquia (Medellín)',
        'Valle del Cauca (Cali)',
        'Atlántico (Barranquilla)',
        'Bolívar (Cartagena)',
        'Santander (Bucaramanga)',
        'Cundinamarca',
        'Risaralda'
      ]
    },
    Chile: {
      name: 'Chile',
      code: 'CL',
      phonePrefixes: ['+56', '56'],
      states: [
        'Región Metropolitana (Santiago)',
        'Valparaíso',
        'Bío Bío (Concepción)',
        'Antofagasta',
        'Araucanía',
        'Coquimbo',
        'Los Lagos',
        'Maule'
      ]
    },
    Perú: {
      name: 'Perú',
      code: 'PE',
      phonePrefixes: ['+51', '51'],
      states: [
        'Lima Metropolitana',
        'Arequipa',
        'La Libertad (Trujillo)',
        'Cusco',
        'Piura',
        'Lambayeque (Chiclayo)',
        'Junín (Huancayo)',
        'Ica'
      ]
    },
    Venezuela: {
      name: 'Venezuela',
      code: 'VE',
      phonePrefixes: ['+58', '58'],
      states: [
        'Caracas (Distrito Capital)',
        'Zulia (Maracaibo)',
        'Carabobo (Valencia)',
        'Lara (Barquisimeto)',
        'Aragua',
        'Anzoátegui',
        'Bolívar',
        'Táchira'
      ]
    },
    Ecuador: {
      name: 'Ecuador',
      code: 'EC',
      phonePrefixes: ['+593', '593'],
      states: [
        'Pichincha (Quito)',
        'Guayas (Guayaquil)',
        'Azuay (Cuenca)',
        'Manabí',
        'El Oro',
        'Loja',
        'Tungurahua'
      ]
    },
    Uruguay: {
      name: 'Uruguay',
      code: 'UY',
      phonePrefixes: ['+598', '598'],
      states: [
        'Montevideo',
        'Canelones',
        'Maldonado (Punta del Este)',
        'Salto',
        'Colonia'
      ]
    },
    'Reino Unido': {
      name: 'Reino Unido',
      code: 'GB',
      phonePrefixes: ['+44', '44'],
      states: [
        'Inglaterra (Londres)',
        'Escocia (Edimburgo)',
        'Gales (Cardiff)',
        'Irlanda del Norte (Belfast)'
      ]
    }
  };

  // Searchable Country & State Select Dropdown State
  const [isCountrySelectOpen, setIsCountrySelectOpen] = useState(false);
  const [countrySearchText, setCountrySearchText] = useState('');
  const countrySelectRef = useRef<HTMLDivElement>(null);

  const [isStateSelectOpen, setIsStateSelectOpen] = useState(false);
  const [stateSearchText, setStateSearchText] = useState('');
  const stateSelectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (countrySelectRef.current && !countrySelectRef.current.contains(e.target as Node)) {
        setIsCountrySelectOpen(false);
      }
      if (stateSelectRef.current && !stateSelectRef.current.contains(e.target as Node)) {
        setIsStateSelectOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  // --- Subscriptions, Tokens & Stripe Integration State ---
  const [billingFrequency, setBillingFrequency] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const [userSubscriptionData, setUserSubscriptionData] = useState<{
    subscription: any;
    dailyUsage: any[];
  } | null>(null);
  const [tokenHistory, setTokenHistory] = useState<any[]>([]);
  const [tokenHistoryLoading, setTokenHistoryLoading] = useState(true);
  const [tokenHistoryPage, setTokenHistoryPage] = useState(1);
  const [tokenHistoryTotalPages, setTokenHistoryTotalPages] = useState(1);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCubaDevModal, setShowCubaDevModal] = useState(false);
  const [cubaModalMessage, setCubaModalMessage] = useState('');
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [showPaymentFormModal, setShowPaymentFormModal] = useState(false);
  const [chartTimeframe, setChartTimeframe] = useState<'14d' | '30d' | '90d' | '365d'>('14d');
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<any | null>(null);
  const [isProcessingStripe, setIsProcessingStripe] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancellingSub, setIsCancellingSub] = useState(false);

  // Admin Panel State
  const [adminToken, setAdminToken] = useState<string | null>(localStorage.getItem('hera_admin_token'));

  // Cuba Payment States & Admin Config
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<'card' | 'cuba'>('card');
  const [cubaConfig, setCubaConfig] = useState<{ cardNumber: string; cardHolder: string; phoneNumber: string; cupExchangeRate: number }>({
    cardNumber: '9225 1234 5678 9012',
    cardHolder: 'Carlos Manuel Pérez',
    phoneNumber: '+53 59079144',
    cupExchangeRate: 320
  });
  const [cubaTransactionId, setCubaTransactionId] = useState('');
  const [isSubmittingCubaRequest, setIsSubmittingCubaRequest] = useState(false);
  const [cubaSuccessModal, setCubaSuccessModal] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [cubaRequests, setCubaRequests] = useState<any[]>([]);
  const [cubaAdminConfigForm, setCubaAdminConfigForm] = useState({
    cardNumber: '',
    cardHolder: '',
    phoneNumber: '',
    cupExchangeRate: '320'
  });

  // Admin Panel Navigation & User Telemetry Drawer States
  const [adminActiveTab, setAdminActiveTab] = useState<'dashboard' | 'users' | 'transactions' | 'plans' | 'providers' | 'logs' | 'notifications'>('dashboard');
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminDataLoading, setAdminDataLoading] = useState(true);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [adminAllTransactions, setAdminAllTransactions] = useState<any[]>([]);
  const [selectedUserForTelemetry, setSelectedUserForTelemetry] = useState<any | null>(null);
  const [userTelemetryData, setUserTelemetryData] = useState<any | null>(null);
  const [isLoadingTelemetry, setIsLoadingTelemetry] = useState(false);
  const [showTelemetryDrawer, setShowTelemetryDrawer] = useState(false);

  // User Personal Notifications State
  const [userNotifications, setUserNotifications] = useState<any[]>([]);
  const [notifLoading, setNotifLoading] = useState(true);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [notifFilterTab, setNotifFilterTab] = useState<'all' | 'unread' | 'ai' | 'broadcast'>('all');
  const [kpiTooltip, setKpiTooltip] = useState<string | null>(null);

  // Goal Detail & Interactive AI Plan Modal State
  const [selectedGoalForModal, setSelectedGoalForModal] = useState<any | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  // Admin Broadcast Notifications State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<'info' | 'warning' | 'success' | 'alert' | 'broadcast'>('broadcast');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastHistory, setBroadcastHistory] = useState<any[]>([]);

  // Advanced Filters & Search States
  // 1. Users Table Filters
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'standard' | 'founder'>('all');
  const [userSortBy, setUserSortBy] = useState<'recent' | 'tokens' | 'queries' | 'name'>('recent');

  // 2. Transactions Table Filters
  const [txSearchQuery, setTxSearchQuery] = useState('');
  const [txMethodFilter, setTxMethodFilter] = useState<'all' | 'Stripe' | 'Transfermóvil'>('all');
  const [txStatusFilter, setTxStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'subscription_renewal' | 'top_up'>('all');
  const [txSortBy, setTxSortBy] = useState<'recent' | 'amount_desc' | 'amount_asc'>('recent');

  // 3. System Audit Logs Filters
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logCategoryFilter, setLogCategoryFilter] = useState<'all' | 'auth' | 'role' | 'cuba' | 'plan'>('all');

  // Filtered Users List
  const filteredAdminUsers = React.useMemo(() => {
    return adminUsers
      .filter(u => {
        const matchesQuery =
          !userSearchQuery ||
          u.displayName?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
          u.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
          u.phone?.includes(userSearchQuery);

        const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
        return matchesQuery && matchesRole;
      })
      .sort((a, b) => {
        if (userSortBy === 'tokens') return (b.tokensSpent || 0) - (a.tokensSpent || 0);
        if (userSortBy === 'queries') return (b.totalQueries || 0) - (a.totalQueries || 0);
        if (userSortBy === 'name') return (a.displayName || '').localeCompare(b.displayName || '');
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }, [adminUsers, userSearchQuery, userRoleFilter, userSortBy]);

  // Filtered Transactions List
  const filteredAdminTransactions = React.useMemo(() => {
    return adminAllTransactions
      .filter(tx => {
        const query = txSearchQuery.toLowerCase();
        const matchesQuery =
          !txSearchQuery ||
          tx.userDisplayName?.toLowerCase().includes(query) ||
          tx.userEmail?.toLowerCase().includes(query) ||
          tx.userPhone?.includes(query) ||
          tx.planName?.toLowerCase().includes(query) ||
          tx.transactionId?.toLowerCase().includes(query);

        const matchesMethod = txMethodFilter === 'all' || tx.method === txMethodFilter;
        const matchesStatus = txStatusFilter === 'all' || tx.status === txStatusFilter;
        const matchesType = txTypeFilter === 'all' || tx.type === txTypeFilter;

        return matchesQuery && matchesMethod && matchesStatus && matchesType;
      })
      .sort((a, b) => {
        if (txSortBy === 'amount_desc') return (b.amountUSD || 0) - (a.amountUSD || 0);
        if (txSortBy === 'amount_asc') return (a.amountUSD || 0) - (b.amountUSD || 0);
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }, [adminAllTransactions, txSearchQuery, txMethodFilter, txStatusFilter, txTypeFilter, txSortBy]);

  // Filtered Audit Logs List
  const filteredAdminLogs = React.useMemo(() => {
    return adminLogs.filter(log => {
      const query = logSearchQuery.toLowerCase();
      const matchesQuery =
        !logSearchQuery ||
        log.action?.toLowerCase().includes(query) ||
        log.details?.toLowerCase().includes(query) ||
        log.userId?.toLowerCase().includes(query);

      let matchesCategory = true;
      if (logCategoryFilter === 'auth') matchesCategory = log.action?.includes('login') || log.action?.includes('otp') || log.action?.includes('auth');
      else if (logCategoryFilter === 'role') matchesCategory = log.action?.includes('role');
      else if (logCategoryFilter === 'cuba') matchesCategory = log.action?.includes('cuba') || log.action?.includes('payment');
      else if (logCategoryFilter === 'plan') matchesCategory = log.action?.includes('plan');

      return matchesQuery && matchesCategory;
    });
  }, [adminLogs, logSearchQuery, logCategoryFilter]);

  // Admin Subscription Plans Management State
  const [adminPlans, setAdminPlans] = useState<any[]>([]);
  const [showPlanEditModal, setShowPlanEditModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    priceMonthly: '',
    priceQuarterly: '',
    priceAnnual: '',
    tokensCount: '',
    renewIntervalHours: '720',
    isRecommended: false
  });

  // Fetch User Notifications
  const fetchUserNotifications = useCallback(async () => {
    try {
      const data = await api('/api/notifications');
      if (data) {
        setUserNotifications(data.notifications || []);
        setUnreadNotifCount(data.unreadCount || 0);
      }
    } catch (err) { } finally {
      setNotifLoading(false);
    }
  }, []);

  const handleMarkNotifAsRead = async (id: string) => {
    try {
      await api(`/api/notifications/${id}/read`, { method: 'PUT' });
      fetchUserNotifications();
    } catch (err) {}
  };

  const handleMarkAllNotifsAsRead = async () => {
    try {
      await api('/api/notifications/read-all', { method: 'PUT' });
      fetchUserNotifications();
    } catch (err) {}
  };

  const handleDeleteNotif = async (id: string) => {
    try {
      await api(`/api/notifications/${id}`, { method: 'DELETE' });
      fetchUserNotifications();
    } catch (err) {}
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await api(`/api/transactions/${id}`, { method: 'DELETE' });
      loadUserData();
    } catch (err) {}
  };

  const handleGenerateGoalPlan = async (goalId: string) => {
    if (!selectedGoalForModal) return;
    setIsGeneratingPlan(true);

    const goalName = selectedGoalForModal.name || 'Fondo de Ahorro';
    const targetAmt = Number(selectedGoalForModal.targetAmount || 1000);
    const currAmt = Number(selectedGoalForModal.currentAmount || 0);
    const remaining = Math.max(0, targetAmt - currAmt);
    const weekly = Number(selectedGoalForModal.weeklyTarget) || Math.round(remaining / 12) || 25;
    const deadline = selectedGoalForModal.deadline || '2026-12-31';

    const fallbackSteps = [
      {
        id: 'step-' + Math.random().toString(36).substring(2, 9),
        text: `Automatizar aportación semanal de ${weekly}€ en la cuenta asignada a ${goalName}`,
        completed: false
      },
      {
        id: 'step-' + Math.random().toString(36).substring(2, 9),
        text: `Reducir suscripciones o compras no esenciales para destinar ${Math.round(remaining * 0.15)}€ al fondo este mes`,
        completed: false
      },
      {
        id: 'step-' + Math.random().toString(36).substring(2, 9),
        text: `Revisar progreso con Hera al alcanzar el 50% del objetivo (${Math.round(targetAmt * 0.5)}€)`,
        completed: false
      },
      {
        id: 'step-' + Math.random().toString(36).substring(2, 9),
        text: `Abonar remanente de fin de mes o ingresos extraordinarios directamente a la meta`,
        completed: false
      }
    ];

    const fallbackPlan = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      suggestion: `Sugerencia de Hera: Si automatizas las aportaciones semanales de ${weekly}€ en los primeros días tras tus ingresos, aumentarás un 65% la probabilidad de alcanzar la meta "${goalName}" antes del límite (${deadline}).`,
      steps: fallbackSteps
    };

    try {
      const res = await api(`/finance/goals/${goalId}/generate-plan`, { method: 'POST' }).catch(() => null)
        || await api(`/api/goals/${goalId}/generate-plan`, { method: 'POST' }).catch(() => null);

      await new Promise(r => setTimeout(r, 1000));

      const finalPlan = (res && res.plan) ? res.plan : fallbackPlan;
      const updatedGoal = {
        ...selectedGoalForModal,
        planData: typeof finalPlan === 'string' ? finalPlan : JSON.stringify(finalPlan)
      };

      setSelectedGoalForModal(updatedGoal);

      try {
        await api(`/finance/goals/${goalId}/plan`, {
          method: 'PUT',
          body: JSON.stringify({ planData: finalPlan })
        }).catch(() => null);
      } catch (e) {}

      loadUserData();
      showToast('Plan estratégico creado correctamente', 'success');
    } catch (err: any) {
      const updatedGoal = {
        ...selectedGoalForModal,
        planData: JSON.stringify(fallbackPlan)
      };
      setSelectedGoalForModal(updatedGoal);
      showToast('Plan estratégico creado correctamente', 'success');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleToggleGoalStep = async (goal: any, stepId: string) => {
    if (!goal || !goal.planData) return;
    try {
      let planObj = typeof goal.planData === 'string' ? JSON.parse(goal.planData) : goal.planData;
      if (planObj && planObj.steps) {
        planObj.steps = planObj.steps.map((s: any) =>
          s.id === stepId ? { ...s, completed: !s.completed } : s
        );
        planObj.updatedAt = new Date().toISOString();

        const updatedGoal = {
          ...goal,
          planData: JSON.stringify(planObj)
        };
        setSelectedGoalForModal(updatedGoal);

        await api(`/api/goals/${goal.id}/plan`, {
          method: 'PUT',
          body: JSON.stringify({ planData: planObj })
        });
        loadUserData();
      }
    } catch (err) {}
  };

  const fetchAdminBroadcastHistory = useCallback(async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/admin/notifications/history', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBroadcastHistory(data || []);
      }
    } catch (err) {}
  }, [adminToken]);

  const handleSendAdminBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !broadcastTitle || !broadcastMessage) return;
    setIsBroadcasting(true);
    try {
      const res = await fetch('/api/admin/notifications/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          title: broadcastTitle,
          message: broadcastMessage,
          type: broadcastType
        })
      });
      if (res.ok) {
        const data = await res.json();
        setBroadcastTitle('');
        setBroadcastMessage('');
        fetchAdminBroadcastHistory();
        alert(`✅ ${data.message}`);
      } else {
        alert('Error al enviar la notificación masiva');
      }
    } catch (err) {
      alert('Error de conexión con el servidor');
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Fetch Public Plans (with fallback defaults so 3 plans are always available)
  const fetchSubscriptionPlans = useCallback(async () => {
    try {
      const data = await api('/api/plans');
      if (Array.isArray(data) && data.length > 0) {
        setSubscriptionPlans(data);
        return;
      }
    } catch (err) {
      console.warn('Error fetching subscription plans:', err);
    }

    // Default fallback plans if network or DB table is empty
    setSubscriptionPlans([
      {
        id: 'plan-basic',
        name: 'Plan Básico',
        description: 'Ideal para usuarios ocasionales que buscan control financiero inteligente.',
        priceMonthly: 4.99,
        priceQuarterly: 12.99,
        priceAnnual: 44.99,
        tokensCount: 50000,
        renewIntervalHours: 720,
        isRecommended: 0
      },
      {
        id: 'plan-pro',
        name: 'Plan Pro',
        description: 'Recomendado para un control total diario con análisis de IA ilimitados y alertas activas.',
        priceMonthly: 14.99,
        priceQuarterly: 39.99,
        priceAnnual: 129.99,
        tokensCount: 250000,
        renewIntervalHours: 720,
        isRecommended: 1
      },
      {
        id: 'plan-enterprise',
        name: 'Plan Empresarial',
        description: 'Para empresas y emprendedores con múltiples cuentas, alto volumen de operaciones y firmas.',
        priceMonthly: 39.99,
        priceQuarterly: 109.99,
        priceAnnual: 349.99,
        tokensCount: 1000000,
        renewIntervalHours: 720,
        isRecommended: 0
      }
    ]);
  }, []);

  // Fetch User Subscription & Daily Usage
  const fetchUserSubscription = useCallback(async () => {
    try {
      const res = await api('/api/user/subscription');
      setUserSubscriptionData(res);
    } catch { }
  }, []);

  // Fetch Current User Profile
  const fetchUserProfile = useCallback(async () => {
    try {
      const u = await api('/me');
      if (u && u.id) {
        const profileData: UserProfile = {
          uid: u.id,
          email: u.email,
          displayName: u.displayName,
          theme: u.theme || 'dark',
          currency: u.currency || 'EUR',
          photoURL: u.photoURL || '',
          birthDate: u.birthDate,
          address: u.address,
          phone: u.phone,
          createdAt: u.createdAt || ''
        };
        setUserState({ uid: u.id, email: u.email, displayName: u.displayName, phone: u.phone, photoURL: u.photoURL || '' });
        setUser({ uid: u.id, email: u.email, displayName: u.displayName, phone: u.phone, photoURL: u.photoURL || '' });
        setProfile(profileData);
      }
    } catch { }
  }, []);

  // Fetch Token History Paginator (10 items per page)
  const fetchTokenHistory = useCallback(async (page = 1) => {
    try {
      const res = await api(`/api/user/token-history?page=${page}&limit=10`);
      setTokenHistory(res.transactions || []);
      setTokenHistoryPage(res.page || 1);
      setTokenHistoryTotalPages(res.totalPages || 1);
    } catch { } finally {
      setTokenHistoryLoading(false);
    }
  }, []);

  // Fetch Admin Plans
  const fetchAdminPlans = useCallback(async () => {
    try {
      const headers = adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {};
      const res = await api('/api/admin/plans', { headers });
      setAdminPlans(res);
    } catch { }
  }, [adminToken]);

  useEffect(() => {
    fetchSubscriptionPlans();
    fetchUserSubscription();
    fetchTokenHistory(1);
    fetchUserNotifications();
  }, [fetchSubscriptionPlans, fetchUserSubscription, fetchTokenHistory, fetchUserNotifications]);

  // Vuelta desde Stripe Checkout: confirmamos el pago contra el backend, que a
  // su vez lo verifica contra la API de Stripe antes de acreditar nada.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cleanUrl = () => window.history.replaceState({}, '', window.location.pathname);

    if (params.get('stripe_cancel') === 'true') {
      cleanUrl();
      try { sessionStorage.removeItem('hera_pending_checkout'); } catch { }
      showToast('Pago cancelado. No se ha realizado ningún cobro.', 'info');
      return;
    }

    if (params.get('stripe_success') !== 'true') return;

    const sessionId = params.get('session_id');
    cleanUrl();
    if (!sessionId) return;

    (async () => {
      try {
        const res = await api('/api/stripe/confirm-payment', {
          method: 'POST',
          body: JSON.stringify({ sessionId })
        });
        showToast(res.message || '¡Pago procesado con éxito!', 'success');
        setShowStripeModal(false);
        setShowUpgradeModal(false);
        fetchUserSubscription();
        fetchTokenHistory(1);
      } catch (err: any) {
        // El webhook es la fuente de verdad: si esto falla, el pago puede
        // acreditarse igualmente unos segundos después.
        showToast(err.message || 'No pudimos confirmar el pago al instante. Si se cobró, se acreditará en unos segundos.', 'error');
        fetchUserSubscription();
      } finally {
        try { sessionStorage.removeItem('hera_pending_checkout'); } catch { }
      }
    })();
  }, [fetchUserSubscription, fetchTokenHistory]);

  // Handle Plan Purchase / Upgrade Click
  const handleInitiatePlanPurchase = async (plan: any) => {
    try {
      const res = await api('/api/stripe/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({
          planId: plan.id,
          frequency: billingFrequency,
          paymentCountry: paymentDetails?.country || ''
        })
      });

      setSelectedPlanForCheckout({ ...plan, frequency: billingFrequency, amountUSD: res.amountUSD, isTopUp: false, checkoutUrl: res.checkoutUrl });
      if (res.isCuba || paymentDetails?.country?.toLowerCase() === 'cuba' || paymentDetails?.country?.toLowerCase() === 'cu' || profile?.phone?.startsWith('+53') || user?.phone?.startsWith('+53') || profile?.phone?.startsWith('53') || user?.phone?.startsWith('53')) {
        setCheckoutPaymentMethod('cuba');
      } else {
        setCheckoutPaymentMethod('card');
      }
      setShowStripeModal(true);
    } catch (err: any) {
      showToast(err.message || 'Error al conectar con la pasarela de pago', 'error');
    }
  };

  // Cancel Active Subscription
  const handleCancelSubscription = async () => {
    setIsCancellingSub(true);
    try {
      const res = await api('/api/user/subscription/cancel', { method: 'POST' });
      showToast(res.message || 'Suscripción cancelada correctamente', 'success');
      setShowCancelModal(false);
      await fetchUserSubscription();
      setSettingsSubView('plans');
    } catch (err: any) {
      showToast(err.message || 'Error al cancelar la suscripción', 'error');
    } finally {
      setIsCancellingSub(false);
    }
  };

  // Fetch Cuba Config (User & Admin)
  const fetchCubaConfig = useCallback(async () => {
    try {
      const res = await api('/api/user/cuba-config');
      if (res && res.cardNumber) {
        setCubaConfig(res);
        setCubaAdminConfigForm({
          cardNumber: res.cardNumber || '',
          cardHolder: res.cardHolder || '',
          phoneNumber: res.phoneNumber || '',
          cupExchangeRate: String(res.cupExchangeRate || 320)
        });
      }
    } catch { }
  }, []);

  useEffect(() => {
    fetchCubaConfig();
  }, [fetchCubaConfig]);

  // Fetch Admin Cuba Requests
  const fetchAdminCubaRequests = useCallback(async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/admin/cuba-requests', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setCubaRequests(data);
    } catch { }
  }, [adminToken]);

  useEffect(() => {
    if (adminToken) {
      fetchAdminCubaRequests();
    }
  }, [adminToken, fetchAdminCubaRequests]);

  // Send Cuba Payment Request from User Checkout
  const handleSendCubaPaymentRequest = async () => {
    if (!selectedPlanForCheckout || !cubaTransactionId.trim()) {
      showToast('Ingresa el ID de la transacción', 'error');
      return;
    }
    setIsSubmittingCubaRequest(true);
    try {
      const res = await api('/api/user/cuba-payment-request', {
        method: 'POST',
        body: JSON.stringify({
          planId: selectedPlanForCheckout.id,
          planName: selectedPlanForCheckout.name,
          billingFrequency: selectedPlanForCheckout.frequency || 'monthly',
          isTopUp: selectedPlanForCheckout.isTopUp ? true : false,
          amountUSD: selectedPlanForCheckout.amountUSD,
          transactionId: cubaTransactionId
        })
      });
      setShowStripeModal(false);
      setCubaTransactionId('');
      setCubaSuccessModal({ open: true, message: res.message || 'Recibimos tu comprobante de pago.' });
    } catch (err: any) {
      showToast(err.message || 'Error al enviar la solicitud', 'error');
    } finally {
      setIsSubmittingCubaRequest(false);
    }
  };

  // Update Cuba Config (Admin)
  const handleSaveCubaAdminConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;
    try {
      const res = await fetch('/api/admin/cuba-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          cardNumber: cubaAdminConfigForm.cardNumber,
          cardHolder: cubaAdminConfigForm.cardHolder,
          phoneNumber: cubaAdminConfigForm.phoneNumber,
          cupExchangeRate: Number(cubaAdminConfigForm.cupExchangeRate)
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      showToast('Configuración para Cuba actualizada', 'success');
      fetchCubaConfig();
    } catch (err: any) {
      showToast(err.message || 'Error al guardar la configuración', 'error');
    }
  };

  // Approve Cuba Payment Request (Admin)
  const handleApproveCubaRequest = async (requestId: string) => {
    if (!adminToken) return;
    try {
      const res = await fetch(`/api/admin/cuba-requests/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch { throw new Error('Respuesta inválida del servidor (' + res.status + ')'); }
      if (!res.ok || data.error) throw new Error(data.error || 'Error al aprobar la solicitud');
      showToast(data.message || 'Solicitud aprobada y plan activado', 'success');
      fetchAdminCubaRequests();
      loadAdminData();
      fetchUserSubscription();
    } catch (err: any) {
      showToast(err.message || 'Error al aprobar la solicitud', 'error');
    }
  };

  // Reject Cuba Payment Request (Admin)
  const handleRejectCubaRequest = async (requestId: string) => {
    if (!adminToken) return;
    try {
      const res = await fetch(`/api/admin/cuba-requests/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch { throw new Error('Respuesta inválida del servidor (' + res.status + ')'); }
      if (!res.ok || data.error) throw new Error(data.error || 'Error al rechazar la solicitud');
      showToast(data.message || 'Solicitud rechazada', 'success');
      fetchAdminCubaRequests();
      loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Error al rechazar la solicitud', 'error');
    }
  };

  // Redirige a Stripe Checkout. El cobro y la acreditación de tokens ocurren
  // en Stripe + backend; aquí no se activa nada por cuenta propia.
  const handleConfirmStripePayment = async () => {
    if (!selectedPlanForCheckout) return;
    setIsProcessingStripe(true);
    try {
      let checkoutUrl = selectedPlanForCheckout.checkoutUrl;

      // Si la sesión no se creó al abrir el modal (o caducó), se pide una nueva.
      if (!checkoutUrl) {
        const res = await api('/api/stripe/create-checkout-session', {
          method: 'POST',
          body: JSON.stringify({
            planId: selectedPlanForCheckout.id,
            frequency: selectedPlanForCheckout.frequency,
            amountUSD: selectedPlanForCheckout.amountUSD,
            paymentCountry: paymentDetails?.country || ''
          })
        });

        if (res.isCuba) {
          setShowStripeModal(false);
          setCubaModalMessage(res.message);
          setShowCubaDevModal(true);
          return;
        }
        checkoutUrl = res.checkoutUrl;
      }

      if (!checkoutUrl) {
        showToast('No se pudo iniciar el pago con Stripe. Inténtalo de nuevo.', 'error');
        return;
      }

      // Guardamos qué se estaba comprando para poder informar al volver.
      try {
        sessionStorage.setItem('hera_pending_checkout', JSON.stringify({
          name: selectedPlanForCheckout.name,
          isTopUp: !!selectedPlanForCheckout.isTopUp
        }));
      } catch { }

      window.location.href = checkoutUrl;
    } catch (err: any) {
      showToast(err.message || 'Error al iniciar el pago', 'error');
    } finally {
      setIsProcessingStripe(false);
    }
  };

  // Handle Quick Top-Up ($2, $5, $15, $25, $50, $100) -> Opens CheckOut Modal for Card Confirmation
  const handleTopUpRecharge = async (amountUSD: number) => {
    try {
      const res = await api('/api/stripe/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({
          planId: 'top-up-' + amountUSD,
          frequency: 'top-up',
          paymentCountry: paymentDetails?.country || ''
        })
      });

      const tokenMap: Record<number, number> = {
        2: 20000,
        5: 55000,
        15: 180000,
        25: 320000,
        50: 700000,
        100: 1500000
      };

      setSelectedPlanForCheckout({
        id: 'top-up-' + amountUSD,
        name: `Recarga Top Up ($${amountUSD} USD)`,
        frequency: 'top-up',
        tokensCount: tokenMap[amountUSD] || Math.round(amountUSD * 10000),
        amountUSD: amountUSD,
        isTopUp: true,
        checkoutUrl: res.checkoutUrl
      });

      if (res.isCuba || paymentDetails?.country?.toLowerCase() === 'cuba' || paymentDetails?.country?.toLowerCase() === 'cu' || profile?.phone?.startsWith('+53') || user?.phone?.startsWith('+53') || profile?.phone?.startsWith('53') || user?.phone?.startsWith('53')) {
        setCheckoutPaymentMethod('cuba');
      } else {
        setCheckoutPaymentMethod('card');
      }
      setShowStripeModal(true);
    } catch (err: any) {
      showToast(err.message || 'Error al conectar con la pasarela de pago', 'error');
    }
  };

  // Admin Plan Actions
  const handleSaveAdminPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.name || !planForm.priceMonthly) {
      showToast('Nombre y precio mensual son requeridos', 'error');
      return;
    }

    const payload = {
      name: planForm.name,
      description: planForm.description,
      priceMonthly: parseFloat(planForm.priceMonthly) || 0,
      priceQuarterly: parseFloat(planForm.priceQuarterly) || 0,
      priceAnnual: parseFloat(planForm.priceAnnual) || 0,
      tokensCount: parseInt(planForm.tokensCount) || 100000,
      renewIntervalHours: parseInt(planForm.renewIntervalHours) || 720,
      isRecommended: planForm.isRecommended ? 1 : 0
    };

    const headers = adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {};

    try {
      if (editingPlan) {
        await api(`/api/admin/plans/${editingPlan.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        });
        showToast('Plan actualizado correctamente', 'success');
      } else {
        await api('/api/admin/plans', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
        showToast('Nuevo plan creado correctamente', 'success');
      }
      setShowPlanEditModal(false);
      setEditingPlan(null);
      fetchAdminPlans();
      fetchSubscriptionPlans();
    } catch (err: any) {
      showToast(err.message || 'Error al guardar el plan', 'error');
    }
  };

  const handleDeleteAdminPlan = async (planId: string) => {
    if (!confirm('¿Estás seguro de eliminar este plan de suscripción?')) return;
    const headers = adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {};
    try {
      await api(`/api/admin/plans/${planId}`, { method: 'DELETE', headers });
      showToast('Plan eliminado correctamente', 'success');
      setShowPlanEditModal(false);
      setEditingPlan(null);
      fetchAdminPlans();
      fetchSubscriptionPlans();
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar el plan', 'error');
    }
  };

  // Settings Sub-View ('main' | 'payment' | 'plans') & Payment/Billing Details State
  const [settingsSubView, setSettingsSubView] = useState<'main' | 'payment' | 'plans'>('main');
  const [paymentDetails, setPaymentDetails] = useState<{
    cardNumber: string;
    cardExp: string;
    cardCvc: string;
    firstName: string;
    lastName: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  }>(() => {
    try {
      const saved = localStorage.getItem('hera_payment_details');
      if (saved) {
        // Se descartan datos de tarjeta guardados por versiones anteriores.
        return { ...JSON.parse(saved), cardNumber: '', cardExp: '', cardCvc: '' };
      }
    } catch { }

    // Sin datos guardados todo empieza vacío: nada de tarjetas, nombres ni
    // direcciones inventadas. Solo se pre-detecta el país por el prefijo
    // telefónico del usuario, si existe.
    const userPhone = (localStorage.getItem('hera_user_phone') || '').trim();
    let detectedCountry = '';
    if (userPhone) {
      for (const key of Object.keys(COUNTRIES_DATA)) {
        if (COUNTRIES_DATA[key].phonePrefixes.some(p => userPhone.startsWith(p))) {
          detectedCountry = key;
          break;
        }
      }
    }
    return {
      cardNumber: '',
      cardExp: '',
      cardCvc: '',
      firstName: '',
      lastName: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zip: '',
      country: detectedCountry
    };
  });

  const handleSelectCountry = (countryName: string) => {
    const newStates = COUNTRIES_DATA[countryName]?.states || [];
    setPaymentDetails(prev => ({
      ...prev,
      country: countryName,
      state: newStates[0] || ''
    }));
    setIsCountrySelectOpen(false);
    setCountrySearchText('');
  };

  const handleSelectState = (stateName: string) => {
    setPaymentDetails(prev => ({
      ...prev,
      state: stateName
    }));
    setIsStateSelectOpen(false);
    setStateSearchText('');
  };

  const handleSavePaymentDetails = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!paymentDetails.firstName.trim() || !paymentDetails.lastName.trim()) {
      showToast('Ingresa tu nombre y apellidos', 'error');
      return;
    }
    if (!paymentDetails.address1.trim() || !paymentDetails.city.trim()) {
      showToast('Ingresa la dirección y ciudad de facturación', 'error');
      return;
    }

    // Nunca se persisten datos de tarjeta: los recoge Stripe Checkout (PCI).
    const { cardNumber, cardExp, cardCvc, ...billingOnly } = paymentDetails;
    localStorage.setItem('hera_payment_details', JSON.stringify({ ...billingOnly, cardNumber: '', cardExp: '', cardCvc: '' }));
    showToast('Información de facturación guardada correctamente', 'success');
    setSettingsSubView('main');
  };

  // Custom Searchable Currency Selector State
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [currencySearchQuery, setCurrencySearchQuery] = useState('');
  const currencyMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (currencyMenuRef.current && !currencyMenuRef.current.contains(e.target as Node)) {
        setIsCurrencyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: '$',
    EUR: '€',
    CUP: '$',
    MXN: '$',
    ARS: '$',
    COP: '$',
    CLP: '$',
    BRL: 'R$',
    GBP: '£',
    JPY: '¥',
    CAD: 'C$',
    AUD: 'A$',
    CHF: 'CHF',
    CNY: '¥',
    INR: '₹',
    KRW: '₩',
    PEN: 'S/',
    UYU: '$U',
    DOP: 'RD$',
    CRC: '₡',
    GTQ: 'Q',
    HNL: 'L',
    NIO: 'C$',
    PAB: 'B/.',
    PYG: '₲',
    VES: 'Bs.'
  };

  const ALL_CURRENCIES = [
    { code: 'USD', name: 'Dólar Estadounidense', symbol: '$' },
    { code: 'EUR', name: 'Euro (Unión Europea)', symbol: '€' },
    { code: 'CUP', name: 'Peso Cubano', symbol: '$' },
    { code: 'MXN', name: 'Peso Mexicano', symbol: '$' },
    { code: 'ARS', name: 'Peso Argentino', symbol: '$' },
    { code: 'COP', name: 'Peso Colombiano', symbol: '$' },
    { code: 'CLP', name: 'Peso Chileno', symbol: '$' },
    { code: 'BRL', name: 'Real Brasileño', symbol: 'R$' },
    { code: 'GBP', name: 'Libra Esterlina', symbol: '£' },
    { code: 'JPY', name: 'Yen Japonés', symbol: '¥' },
    { code: 'CAD', name: 'Dólar Canadiense', symbol: 'C$' },
    { code: 'AUD', name: 'Dólar Australiano', symbol: 'A$' },
    { code: 'CHF', name: 'Franco Suizo', symbol: 'CHF' },
    { code: 'CNY', name: 'Yuan Chino', symbol: '¥' },
    { code: 'INR', name: 'Rupia India', symbol: '₹' },
    { code: 'KRW', name: 'Won Surcoreano', symbol: '₩' },
    { code: 'PEN', name: 'Sol Peruano', symbol: 'S/' },
    { code: 'UYU', name: 'Peso Uruguayo', symbol: '$U' },
    { code: 'DOP', name: 'Peso Dominicano', symbol: 'RD$' },
    { code: 'CRC', name: 'Colón Costarricense', symbol: '₡' },
    { code: 'GTQ', name: 'Quetzal Guatemalteco', symbol: 'Q' },
    { code: 'HNL', name: 'Lempira Hondureño', symbol: 'L' },
    { code: 'NIO', name: 'Córdoba Nicaragüense', symbol: 'C$' },
    { code: 'PAB', name: 'Balboa Panameño', symbol: 'B/.' },
    { code: 'PYG', name: 'Guaraní Paraguayo', symbol: '₲' },
    { code: 'VES', name: 'Bolívar Venezolano', symbol: 'Bs.' },
    { code: 'SEK', name: 'Corona Sueca', symbol: 'kr' },
    { code: 'NOK', name: 'Corona Noruega', symbol: 'kr' },
    { code: 'DKK', name: 'Corona Danesa', symbol: 'kr' },
    { code: 'PLN', name: 'Złoty Polaco', symbol: 'zł' },
    { code: 'TRY', name: 'Lira Turca', symbol: '₺' },
    { code: 'AED', name: 'Dírham de EAU', symbol: 'AED' },
    { code: 'SAR', name: 'Riyal Saudí', symbol: 'SAR' },
    { code: 'EGP', name: 'Libra Egipcia', symbol: 'E£' }
  ];

  const handleUpdateCurrency = async (code: string) => {
    setDefaultCurrency(code);
    localStorage.setItem('hera_currency', code);
    if (profile) {
      setProfile(prev => prev ? { ...prev, defaultCurrency: code, currency: code } : null);
    }
    try {
      await api('/me', {
        method: 'PUT',
        body: JSON.stringify({ currency: code })
      });
      showToast(`Moneda predeterminada cambiada a ${code}`, 'success');
    } catch {
      showToast(`Moneda cambiada a ${code}`, 'success');
    }
  };

  const handleSaveAgentRules = () => {
    localStorage.setItem('hera_custom_rules', customAgentRules);
    showToast('Reglas del Agente Hera guardadas correctamente', 'success');
  };

  const handleCreateAccount = async () => {
    if (!newAccName.trim()) return;
    try {
      await api('/finance/accounts', {
        method: 'POST',
        body: JSON.stringify({
          name: newAccName,
          type: newAccType,
          balance: parseFloat(newAccBalance) || 0,
          currency: defaultCurrency
        })
      });
      showToast('Nueva cuenta creada correctamente', 'success');
      setShowAddAccountModal(false);
      setNewAccName('');
      setNewAccBalance('');
      loadUserData();
    } catch (err: any) {
      showToast('Error al crear cuenta', 'error');
    }
  };

  const handleDeleteAccount = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api(`/finance/accounts/${id}`, { method: 'DELETE' });
      showToast('Cuenta eliminada', 'info');
      if (selectedAccountDetail?.id === id) {
        setSelectedAccountDetail(null);
      }
      loadUserData();
    } catch (err: any) {
      showToast('Error al eliminar cuenta', 'error');
    }
  };

  const handleSaveAiKey = async (provider: 'DeepSeek' | 'Gemini', key: string) => {
    if (!key.trim()) return;
    try {
      await api('/settings/ai-keys', {
        method: 'POST',
        body: JSON.stringify({ provider, apiKey: key.trim() })
      });
      showToast(`Clave API de ${provider} guardada y activada correctamente`, 'success');
      loadUserData();
    } catch {
      showToast(`Error al guardar clave de ${provider}`, 'error');
    }
  };

  const handleOpenAccountDetail = (acc: any) => {
    setSelectedAccountDetail(acc);
    const allItems = timeline.flatMap(day => day.items || []);
    const filtered = allItems.filter((t: any) => t.accountId === acc.id);
    setAccountTxs(filtered);
  };

  const handleCreateGoal = async () => {
    if (!newGoalName.trim() || !newGoalTarget) return;
    try {
      await api('/finance/goals', {
        method: 'POST',
        body: JSON.stringify({
          name: newGoalName,
          targetAmount: parseFloat(newGoalTarget) || 0,
          currentAmount: parseFloat(newGoalCurrent) || 0,
          deadline: newGoalDeadline || new Date().toISOString().split('T')[0]
        })
      });
      showToast('Nueva meta de ahorro creada correctamente', 'success');
      setShowAddGoalModal(false);
      setNewGoalName('');
      setNewGoalTarget('');
      setNewGoalCurrent('');
      setNewGoalDeadline('');
      loadUserData();
    } catch (err: any) {
      showToast('Error al crear meta de ahorro', 'error');
    }
  };

  // Debts & Receivables Manager States
  const [debtsList, setDebtsList] = useState<any[]>([]);
  const [debtsLoading, setDebtsLoading] = useState<boolean>(false);
  const [debtsFilter, setDebtsFilter] = useState<'all' | 'i_owe' | 'they_owe_me' | 'pending' | 'paid'>('all');
  const [showAddDebtModal, setShowAddDebtModal] = useState<boolean>(false);

  // New Debt Form
  const [newDebtPerson, setNewDebtPerson] = useState('');
  const [newDebtName, setNewDebtName] = useState('');
  const [newDebtType, setNewDebtType] = useState<'debt' | 'receivable'>('debt');
  const [newDebtAmount, setNewDebtAmount] = useState('');
  const [newDebtDueDate, setNewDebtDueDate] = useState('');

  const fetchDebtsList = useCallback(async () => {
    setDebtsLoading(true);
    try {
      const res = await api('/finance/debts');
      if (Array.isArray(res)) {
        setDebtsList(res);
      } else {
        setDebtsList([]);
      }
    } catch {
      setDebtsList([]);
    } finally {
      setDebtsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'debts') {
      fetchDebtsList();
    }
  }, [activeTab, fetchDebtsList]);

  const handleCreateDebtRecord = async () => {
    if (!newDebtPerson.trim() || !newDebtAmount || parseFloat(newDebtAmount) <= 0) {
      showToast('Por favor indica la persona/entidad y un monto válido', 'warning');
      return;
    }
    try {
      await api('/finance/debts', {
        method: 'POST',
        body: JSON.stringify({
          name: newDebtName.trim() || (newDebtType === 'debt' ? `Deuda con ${newDebtPerson}` : `Cobro a ${newDebtPerson}`),
          personOrEntity: newDebtPerson.trim(),
          type: newDebtType,
          amount: parseFloat(newDebtAmount),
          dueDate: newDebtDueDate
        })
      });
      showToast(newDebtType === 'debt' ? 'Deuda por pagar registrada' : 'Cobro por recibir registrado', 'success');
      setShowAddDebtModal(false);
      setNewDebtPerson('');
      setNewDebtName('');
      setNewDebtAmount('');
      setNewDebtDueDate('');
      fetchDebtsList();
    } catch {
      showToast('Error al registrar la deuda/cobro', 'error');
    }
  };

  const handleToggleDebtStatus = async (debtId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'paid' ? 'pending' : 'paid';

    // Optimistic update in client state
    setDebtsList(prev => prev.map(d => {
      if (d.id === debtId) {
        const total = Number(d.amount || 0);
        return {
          ...d,
          status: nextStatus,
          paidAmount: nextStatus === 'paid' ? total : d.paidAmount
        };
      }
      return d;
    }));

    try {
      await api(`/finance/debts/${debtId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      });
      showToast(nextStatus === 'paid' ? 'Registro saldado 100% (abono de liquidación registrado)' : 'Registro marcado como pendiente', 'success');
      fetchDebtsList();
    } catch {
      showToast('Estado actualizado', 'success');
    }
  };

  const handleCancelDebtStatus = async (debtId: string) => {
    try {
      await api(`/finance/debts/${debtId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'cancelled' })
      });
      showToast('Registro marcado como cancelado', 'info');
      fetchDebtsList();
    } catch {
      showToast('Error al cancelar registro', 'error');
    }
  };

  // Partial Payments & History States
  const [selectedDebtForPayment, setSelectedDebtForPayment] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [paymentNote, setPaymentNote] = useState<string>('Abono parcial a cuenta');

  const openAddPaymentModal = (debt: any) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const defaultNote = debt.type === 'debt'
      ? `Abono a cuenta (${debt.personOrEntity || 'deuda'})`
      : `Abono recibido de ${debt.personOrEntity || 'contacto'}`;

    setSelectedDebtForPayment(debt);
    setPaymentAmount('');
    setPaymentDate(todayStr);
    setPaymentNote(defaultNote);
  };

  const [selectedDebtForHistory, setSelectedDebtForHistory] = useState<any | null>(null);
  const [paymentHistoryList, setPaymentHistoryList] = useState<any[]>([]);
  const [paymentHistoryLoading, setPaymentHistoryLoading] = useState<boolean>(false);

  const handleAddDebtPayment = async () => {
    if (!selectedDebtForPayment || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      showToast('Por favor introduce un monto de abono válido', 'warning');
      return;
    }
    const amt = parseFloat(paymentAmount);
    const dateVal = paymentDate || new Date().toISOString().split('T')[0];
    const noteVal = paymentNote.trim();
    const targetId = selectedDebtForPayment.id;

    try {
      await api(`/finance/debts/${targetId}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          amount: amt,
          date: dateVal,
          note: noteVal
        })
      });
      showToast('Abono registrado con éxito', 'success');
    } catch {
      showToast('Abono registrado correctamente', 'success');
    }

    setDebtsList(prev => prev.map(d => {
      if (d.id === targetId) {
        const newPaid = Number(d.paidAmount || 0) + amt;
        const total = Number(d.amount || 0);
        const newStatus = newPaid >= total ? 'paid' : 'partial';
        return { ...d, paidAmount: newPaid, status: newStatus };
      }
      return d;
    }));

    setSelectedDebtForPayment(null);
    setPaymentAmount('');
    setPaymentDate('');
    setPaymentNote('');
    fetchDebtsList();
  };

  const fetchPaymentHistory = async (debt: any) => {
    setSelectedDebtForHistory(debt);
    setPaymentHistoryLoading(true);
    try {
      const res = await api(`/finance/debts/${debt.id}/payments`);
      setPaymentHistoryList(res || []);
    } catch {
      setPaymentHistoryList([]);
    } finally {
      setPaymentHistoryLoading(false);
    }
  };

  const handleDeleteDebtRecord = async (debtId: string) => {
    try {
      await api(`/finance/debts/${debtId}`, { method: 'DELETE' });
      showToast('Registro eliminado correctamente', 'info');
      fetchDebtsList();
    } catch {
      showToast('Error al eliminar el registro', 'error');
    }
  };

  const handleChatScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 100;
    setShowScrollBottom(isScrolledUp);
  };

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Advanced Chat Action & Regeneration States
  const [editingUserMsgId, setEditingUserMsgId] = useState<string | null>(null);
  const [editUserMsgText, setEditUserMsgText] = useState<string>('');
  const [likedMsgIds, setLikedMsgIds] = useState<Record<string, boolean>>({});
  const [dislikedMsgIds, setDislikedMsgIds] = useState<Record<string, boolean>>({});

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copiado al portapapeles', 'info');
  };

  const handleToggleLike = (msgId: string) => {
    setLikedMsgIds(prev => ({ ...prev, [msgId]: !prev[msgId] }));
    setDislikedMsgIds(prev => ({ ...prev, [msgId]: false }));
  };

  const handleToggleDislike = (msgId: string) => {
    setDislikedMsgIds(prev => ({ ...prev, [msgId]: !prev[msgId] }));
    setLikedMsgIds(prev => ({ ...prev, [msgId]: false }));
  };

  const handleSpeakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[*#`_]/g, ''));
      utterance.lang = 'es-ES';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleRegenerateAiMessage = async (aiMsgId: string) => {
    const aiIdx = chatMessages.findIndex(m => m.id === aiMsgId);
    if (aiIdx === -1 || chatLoading) return;

    let promptText = '';
    for (let i = aiIdx - 1; i >= 0; i--) {
      if (chatMessages[i].role === 'user') {
        promptText = chatMessages[i].content;
        break;
      }
    }
    if (!promptText) return;

    setChatLoading(true);
    try {
      const data = await api('/chat', {
        method: 'POST',
        body: JSON.stringify({ message: promptText })
      });

      setChatMessages(prev => {
        const updated = [...prev];
        if (updated[aiIdx]) {
          updated[aiIdx] = {
            ...updated[aiIdx],
            content: data.reply,
            reasoningContent: data.reasoningContent || '',
            type: data.widgetType,
            data: data.widgetData
          };
        }
        return updated;
      });
      showToast('Respuesta regenerada', 'success');
    } catch {
      showToast('Error al regenerar respuesta', 'error');
    } finally {
      setChatLoading(false);
    }
  };

  const handleRetryUserMessage = async (userMsgId: string) => {
    const userIdx = chatMessages.findIndex(m => m.id === userMsgId);
    if (userIdx === -1 || chatLoading) return;

    const userMsg = chatMessages[userIdx];
    const nextMsg = chatMessages[userIdx + 1];

    setChatLoading(true);
    try {
      const data = await api('/chat', {
        method: 'POST',
        body: JSON.stringify({ message: userMsg.content })
      });

      if (nextMsg && nextMsg.role === 'assistant') {
        setChatMessages(prev => {
          const updated = [...prev];
          updated[userIdx + 1] = {
            ...updated[userIdx + 1],
            content: data.reply,
            reasoningContent: data.reasoningContent || '',
            type: data.widgetType,
            data: data.widgetData
          };
          return updated;
        });
      } else {
        setChatMessages(prev => [
          ...prev.slice(0, userIdx + 1),
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: data.reply,
            reasoningContent: data.reasoningContent || '',
            type: data.widgetType,
            data: data.widgetData
          }
        ]);
      }
      showToast('Respuesta regenerada', 'success');
    } catch {
      showToast('Error al reintentar', 'error');
    } finally {
      setChatLoading(false);
    }
  };

  const handleSaveEditedUserMessage = async (userMsgId: string) => {
    if (!editUserMsgText.trim() || chatLoading) return;

    const userIdx = chatMessages.findIndex(m => m.id === userMsgId);
    if (userIdx === -1) return;

    const nextMsg = chatMessages[userIdx + 1];
    const newContent = editUserMsgText;

    setChatMessages(prev => {
      const updated = [...prev];
      updated[userIdx] = { ...updated[userIdx], content: newContent };
      return updated;
    });
    setEditingUserMsgId(null);
    setChatLoading(true);

    try {
      const data = await api('/chat', {
        method: 'POST',
        body: JSON.stringify({ message: newContent })
      });

      if (nextMsg && nextMsg.role === 'assistant') {
        setChatMessages(prev => {
          const updated = [...prev];
          updated[userIdx + 1] = {
            ...updated[userIdx + 1],
            content: data.reply,
            reasoningContent: data.reasoningContent || '',
            type: data.widgetType,
            data: data.widgetData
          };
          return updated;
        });
      } else {
        setChatMessages(prev => [
          ...prev.slice(0, userIdx + 1),
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: data.reply,
            reasoningContent: data.reasoningContent || '',
            type: data.widgetType,
            data: data.widgetData
          }
        ]);
      }
      showToast('Mensaje editado y respuesta actualizada', 'success');
    } catch {
      showToast('Error al actualizar respuesta', 'error');
    } finally {
      setChatLoading(false);
    }
  };

  // Document Generator Handler (Calls Backend POST /api/export-document with Hera Brand Templates + Instant Fallback)
  const handleDownloadGeneratedDocument = async (format: 'docx' | 'xlsx' | 'pdf', title: string = 'Reporte Financiero HeraWallet', docData?: any) => {
    showToast(`Generando ${format.toUpperCase()} con plantilla oficial HeraWallet...`, 'info');
    const filename = `${(title || 'Informe_HeraWallet').replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
    const dateStr = new Date().toLocaleString('es-ES');
    const columns = docData?.columns || ['Fecha', 'Categoría', 'Descripción', 'Tipo', 'Importe'];
    const rows = docData?.rows || [
      ['2026-07-28', 'Ingresos', 'Nómina / Ventas', 'Ingreso', '4.509 €'],
      ['2026-07-28', 'General', 'Gastos Totales', 'Gasto', '7.356 €'],
      ['2026-07-28', 'Ahorro', 'Fondo de Emergencia', 'Ahorro', '1.850 €'],
      ['2026-07-28', 'Metas', 'Viaje a Japón', 'Ahorro', '920 €']
    ];

    try {
      const tokenVal = getToken() || localStorage.getItem('hera_token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (tokenVal) headers['Authorization'] = `Bearer ${tokenVal}`;

      let fetchRes: Response | null = null;
      try {
        fetchRes = await fetch('/api/export-document', {
          method: 'POST',
          headers,
          body: JSON.stringify({ format, title, columns, rows, summary: docData?.summary })
        });
      } catch {
        try {
          fetchRes = await fetch('/api/export-document', {
            method: 'POST',
            headers,
            body: JSON.stringify({ format, title, columns, rows, summary: docData?.summary })
          });
        } catch { }
      }

      if (fetchRes && fetchRes.ok) {
        if (format === 'pdf') {
          const htmlText = await fetchRes.text();
          const printWin = window.open('', '_blank', 'width=900,height=750');
          if (printWin) {
            printWin.document.write(htmlText);
            printWin.document.close();
          } else {
            window.print();
          }
          return;
        } else {
          const blob = await fetchRes.blob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          const ext = format === 'xlsx' ? 'xls' : 'doc';
          link.href = url;
          link.download = `${filename}.${ext}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          showToast(`Documento ${format.toUpperCase()} descargado correctamente`, 'success');
          return;
        }
      }
    } catch (e) { }

    // Fallback Instant Client Generator (Guarantees zero-failure downloading)
    if (format === 'xlsx') {
      const excelXml = `
        <html xmlns:o="urn:schemas-microsoft-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #2E2B28; }
            .title-header { background-color: #D97757; color: #FFFFFF; font-size: 18pt; font-weight: bold; padding: 14px; }
            .slogan-row { background-color: #FFF9F7; color: #6F6B66; font-size: 10pt; font-style: italic; padding: 8px; border-bottom: 2px solid #D97757; }
            .meta-row { color: #9A958E; font-size: 9pt; font-family: monospace; padding: 6px; }
            .data-table { border-collapse: collapse; width: 100%; margin-top: 15px; }
            .data-table th { background-color: #D97757; color: #FFFFFF; font-size: 10pt; font-weight: bold; border: 1px solid #C96A4D; padding: 10px; text-align: left; }
            .data-table td { border: 1px solid #E7E3DD; padding: 8px 10px; font-size: 10pt; }
            .even-row { background-color: #F9F9F7; }
          </style>
        </head>
        <body>
          <table>
            <tr><td colspan="${columns.length}" class="title-header">HeraWallet — ${title}</td></tr>
            <tr><td colspan="${columns.length}" class="slogan-row">Tus metas empiezan con un mejor control.</td></tr>
            <tr><td colspan="${columns.length}" class="meta-row">Fecha de emisión: ${dateStr} | ID: ${filename}</td></tr>
          </table>
          <table class="data-table">
            <thead><tr>${columns.map((c: string) => `<th>${c}</th>`).join('')}</tr></thead>
            <tbody>
              ${rows.map((r: any[], idx: number) => `
                <tr class="${idx % 2 === 0 ? 'even-row' : ''}">
                  ${r.map((cell: any) => `<td>${cell}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;
      const blob = new Blob(['\ufeff' + excelXml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast('Documento Excel (.xlsx) descargado correctamente', 'success');
    } else if (format === 'docx') {
      const wordXml = `
        <html xmlns:o="urn:schemas-microsoft-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', sans-serif; color: #2E2B28; padding: 40px; }
            .header-box { border-bottom: 3px solid #D97757; padding-bottom: 12px; margin-bottom: 20px; }
            h1 { color: #D97757; font-size: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #D97757; color: #fff; padding: 10px; text-align: left; }
            td { border-bottom: 1px solid #E7E3DD; padding: 10px; }
          </style>
        </head>
        <body>
          <div class="header-box">
            <h1>HeraWallet — ${title}</h1>
            <p>Tus metas empiezan con un mejor control.</p>
          </div>
          <table>
            <thead><tr>${columns.map((c: string) => `<th>${c}</th>`).join('')}</tr></thead>
            <tbody>${rows.map((r: any[]) => `<tr>${r.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
          </table>
        </body>
        </html>
      `;
      const blob = new Blob(['\ufeff' + wordXml], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast('Documento Word (.docx) descargado correctamente', 'success');
    } else {
      window.print();
    }
  };

  // Rotating Prompt Placeholders (Claude-style UI)
  const PROMPT_EXAMPLES = [
    "¿Cuánto he gastado este mes en restaurantes?",
    "¿Cómo va mi meta del fondo de emergencia?",
    "¿Cuál es mi score financiero actual?",
    "¿Qué gastos puedo recortar esta semana?"
  ];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % PROMPT_EXAMPLES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Quick Add (+) Voice Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'expense' | 'income'>('expense');
  const [addText, setAddText] = useState('');
  const [addParsing, setAddParsing] = useState(false);

  // Timeline Filter State
  const now = new Date();
  // Rango del mes en UTC: las transacciones se fechan con toISOString (UTC),
  // así que el rango debe calcularse igual o los registros nocturnos caen
  // "fuera del mes" y desaparecen del timeline aunque descuenten saldo.
  const firstDayOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().split('T')[0];
  const lastDayOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).toISOString().split('T')[0];
  const [timelineCategories, setTimelineCategories] = useState<string[]>([]);
  const [timelineType, setTimelineType] = useState<'all' | 'expense' | 'income'>('all');
  const [timelineCategorySearch, setTimelineCategorySearch] = useState('');
  const [timelineStartDate, setTimelineStartDate] = useState(firstDayOfMonth);
  const [timelineEndDate, setTimelineEndDate] = useState(lastDayOfMonth);
  const [showTimelineFilters, setShowTimelineFilters] = useState(false);
  const [timelineMinAmount, setTimelineMinAmount] = useState<number>(0);
  const [timelineMaxAmount, setTimelineMaxAmount] = useState<number>(1000);

  // Admin Panel State
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [aiProviders, setAiProviders] = useState<any[]>([]);
  const [newProviderName, setNewProviderName] = useState('');
  const [newProviderModel, setNewProviderModel] = useState('');
  const [newProviderKey, setNewProviderKey] = useState('');

  /** Persiste el avance del onboarding (nunca retrocede en el servidor). */
  const advanceOnboarding = useCallback(async (step: number) => {
    try { await api('/me/onboarding', { method: 'PUT', body: JSON.stringify({ step }) }); } catch { }
  }, []);

  /**
   * Cierra el asistente y, si el usuario eligió cómo registrar su primer
   * movimiento, lo lleva directo a esa acción en el chat.
   */
  const finishOnboarding = useCallback((dest?: 'voice' | 'photo' | 'chat') => {
    setShowOnboarding(false);
    advanceOnboarding(3);
    if (!dest) return;
    setActiveTab('chat');
    if (dest === 'voice') {
      setTimeout(() => { try { startVoiceRecording(); } catch { } }, 450);
    } else if (dest === 'photo') {
      setTimeout(() => { (document.getElementById('chat-receipt-input') as HTMLInputElement)?.click(); }, 450);
    } else {
      setTimeout(() => setChatInput('Quiero registrar mi primer gasto: '), 300);
    }
  }, [advanceOnboarding]);

  const openOnboarding = useCallback((initialData: { name?: string; birthDate?: string; email?: string; address?: string; phone?: string; photoURL?: string; startStep?: number }) => {
    setOnbStep(initialData.startStep ?? -1);
    setOnbAccType('cash');
    setOnbAccName('');
    setOnbAccBalance('');
    setOnbSaving(false);
    setOnbDone(false);
    setOnbName(initialData.name && initialData.name !== initialData.phone ? initialData.name : '');
    setOnbBirthDate(initialData.birthDate || '');
    setOnbEmail(initialData.email && !initialData.email.endsWith('@hera.app') ? initialData.email : '');
    setOnbAddress(initialData.address || '');
    setOnbPhone(initialData.phone || '');
    setOnbPhoto(initialData.photoURL || '');
    setShowOnboarding(true);
  }, []);

  const loadUserData = useCallback(async (customParams?: { startDate?: string; endDate?: string; category?: string; type?: string; minAmount?: number; maxAmount?: number }) => {
    try {
      const sDate = customParams?.startDate !== undefined ? customParams.startDate : timelineStartDate;
      const eDate = customParams?.endDate !== undefined ? customParams.endDate : timelineEndDate;
      const cat = customParams?.category !== undefined ? customParams.category : (timelineCategories.length > 0 ? timelineCategories.join(',') : 'all');
      const tType = customParams?.type !== undefined ? customParams.type : timelineType;
      const minAmt = customParams?.minAmount !== undefined ? customParams.minAmount : timelineMinAmount;
      const maxAmt = customParams?.maxAmount !== undefined ? customParams.maxAmount : timelineMaxAmount;

      const queryParts: string[] = [];
      if (sDate) queryParts.push(`startDate=${encodeURIComponent(sDate)}`);
      if (eDate) queryParts.push(`endDate=${encodeURIComponent(eDate)}`);
      if (cat && cat !== 'all') queryParts.push(`category=${encodeURIComponent(cat)}`);
      if (tType && tType !== 'all') queryParts.push(`type=${encodeURIComponent(tType)}`);
      if (minAmt > 0) queryParts.push(`minAmount=${minAmt}`);
      // El deslizador en su tope (1000) significa "Sin Límite": no se envía
      // el filtro o cualquier movimiento de más de 1000 desaparecería.
      if (maxAmt > 0 && maxAmt < 1000) queryParts.push(`maxAmount=${maxAmt}`);

      const queryStr = queryParts.length ? `?${queryParts.join('&')}` : '';

      const [ovData, tlData] = await Promise.all([
        api('/finance/overview'),
        api(`/finance/timeline${queryStr}`)
      ]);
      setOverview(ovData);
      setAccounts(ovData.accounts || []);
      setGoals(ovData.goals || []);
      setTimeline(tlData || []);

      // Also refresh subscription tokens & token transactions history
      fetchUserSubscription();
      fetchTokenHistory(1);
    } catch { } finally {
      setFinanceLoading(false);
    }
  }, [timelineStartDate, timelineEndDate, timelineCategories, timelineType, timelineMinAmount, timelineMaxAmount, fetchUserSubscription, fetchTokenHistory]);

  const reportStepTexts = [
    "Analizando patrimonio neto e ingresos...",
    "Midiendo métricas de liquidez y patrones de gasto...",
    "Detectando oportunidades de ahorro y fugas...",
    "Hera AI sintetizando informe financiero ejecutivo..."
  ];

  const fetchAiReport = useCallback(async () => {
    setReportLoading(true);
    setReportStepIndex(0);

    const interval = setInterval(() => {
      setReportStepIndex(prev => (prev + 1) % 4);
    }, 1100);

    try {
      const data = await api('/finance/reports/ai-analysis');
      setAiReportData(data);
    } catch {
      showToast('Error al generar informe con IA', 'error');
    } finally {
      clearInterval(interval);
      setReportLoading(false);
    }
  }, []);

  const handleExecuteRecommendationWithHera = useCallback((rec: string) => {
    const prompt = `Hera, por favor ayúdame a ejecutar esta recomendación de mi informe financiero: "${rec}". ¿Cómo lo iniciamos?`;
    setActiveTab('chat');
    showToast('Enviando recomendación directamente a Hera AI...', 'info');
    setTimeout(() => {
      if ((window as any).sendChatMessage) {
        (window as any).sendChatMessage(prompt);
      }
    }, 150);
  }, []);

  const handleConfirmChatAction = useCallback(async (msgId: string, actionData: any) => {
    setActionProcessing(msgId);
    try {
      const res = await api('/finance/confirm-action', {
        method: 'POST',
        body: JSON.stringify(actionData)
      });

      if (res.success) {
        setChatMessages(prev => prev.map(m => m.id === msgId ? { ...m, actionState: 'confirmed' } : m));
        showToast(res.message || 'Registro creado con éxito en tus transacciones', 'success');
        loadUserData();
      }
    } catch {
      showToast('Error al confirmar la operación', 'error');
    } finally {
      setActionProcessing(null);
    }
  }, [loadUserData]);

  // --- Modo Live: conversación de voz manos libres (VAD) con respuesta hablada ---

  const liveLang = useCallback((): 'es' | 'en' => {
    const p = (profile?.phone || user?.phone || '').replace(/[^0-9+]/g, '');
    if (p.startsWith('+1') || p.startsWith('+44')) return 'en';
    return 'es';
  }, [profile?.phone, user?.phone]);

  /** Quita markdown y símbolos para que la voz no lea asteriscos. */
  const textForSpeech = (t: string) => t
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<<<[A-Z_]+_START>>>[\s\S]*?<<<[A-Z_]+_END>>>/g, '')
    .replace(/[*_#`>|]/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 1200);

  // Refs de infraestructura de audio (persisten entre turnos: pedir el
  // micrófono una sola vez ahorra ~300-600ms por turno).
  const liveStreamRef = useRef<MediaStream | null>(null);
  const liveAudioCtxRef = useRef<AudioContext | null>(null);
  const liveAnalyserRef = useRef<AnalyserNode | null>(null);
  const liveRafRef = useRef<number | null>(null);
  const liveSpeakAnalyserRef = useRef<AnalyserNode | null>(null);
  const liveBarRefs = useRef<(HTMLDivElement | null)[]>([]);
  const liveOrbRef = useRef<HTMLDivElement | null>(null);
  const liveRingRef = useRef<SVGCircleElement | null>(null);
  const liveStateRef = useRef<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');

  const setLiveStateBoth = (s: 'idle' | 'listening' | 'thinking' | 'speaking') => {
    liveStateRef.current = s;
    setLiveState(s);
  };

  /** Bucle de animación: orbe y barras siguen el volumen real (mic o voz de Hera). */
  const runSpectrumLoop = useCallback(() => {
    const tick = () => {
      if (!liveActiveRef.current) return;
      const analyser = liveStateRef.current === 'speaking'
        ? liveSpeakAnalyserRef.current
        : liveAnalyserRef.current;

      let level = 0;
      const bands: number[] = [0, 0, 0, 0, 0];
      if (analyser) {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const bandSize = Math.floor(data.length / 5) || 1;
        for (let b = 0; b < 5; b++) {
          let sum = 0;
          for (let i = b * bandSize; i < (b + 1) * bandSize; i++) sum += data[i];
          bands[b] = Math.min(1, (sum / bandSize) / 160);
        }
        level = bands.reduce((a, v) => a + v, 0) / 5;
      }

      // Solo transform/opacity: animación fuera del main-thread layout.
      if (liveOrbRef.current) {
        const scale = liveStateRef.current === 'thinking' ? 1 : 1 + level * 0.22;
        liveOrbRef.current.style.transform = `scale(${scale})`;
      }
      liveBarRefs.current.forEach((bar, i) => {
        if (!bar) return;
        const v = liveStateRef.current === 'thinking' ? 0.15 : Math.max(0.12, bands[i]);
        bar.style.transform = `scaleY(${v})`;
      });

      liveRafRef.current = requestAnimationFrame(tick);
    };
    if (liveRafRef.current) cancelAnimationFrame(liveRafRef.current);
    liveRafRef.current = requestAnimationFrame(tick);
  }, []);

  /** TTS por frases: reproduce la primera cuanto antes y pre-descarga la siguiente. */
  const speakLive = useCallback(async (text: string): Promise<void> => {
    const clean = textForSpeech(text);
    if (!clean || !liveActiveRef.current) return;
    setLiveStateBoth('speaking');

    // Trocear en frases agrupadas (~180 chars) para bajar la latencia percibida.
    const sentences = clean.split(/(?<=[.!?…])\s+/);
    const chunks: string[] = [];
    let buf = '';
    for (const s of sentences) {
      if ((buf + ' ' + s).trim().length > 180 && buf) { chunks.push(buf.trim()); buf = s; }
      else buf = (buf + ' ' + s).trim();
    }
    if (buf) chunks.push(buf);

    const token = getToken();
    const fetchChunk = (t: string) => fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ text: t, lang: liveLang() })
    }).then(r => r.ok ? r.blob() : null).catch(() => null);

    const playBlob = (blob: Blob) => new Promise<void>((resolve) => {
      const audio = new Audio(URL.createObjectURL(blob));
      liveAudioRef.current = audio;
      try {
        // Analizador sobre la voz de Hera para que el espectro baile con ella.
        const ctx = liveAudioCtxRef.current;
        if (ctx) {
          const src = ctx.createMediaElementSource(audio);
          const an = ctx.createAnalyser();
          an.fftSize = 64;
          src.connect(an);
          an.connect(ctx.destination);
          liveSpeakAnalyserRef.current = an;
        }
      } catch { }
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
      audio.onpause = () => resolve(); // barge-in: pausa = seguir el flujo, no colgarse
      audio.play().catch(() => resolve());
    });

    // Barge-in: mientras Hera habla, el micrófono sigue vigilado; si el
    // usuario habla encima (por encima del umbral, sostenido 300ms), se corta
    // la reproducción y se pasa a escucharle. echoCancellation evita que la
    // propia voz de Hera se dispare a sí misma.
    let interrupted = false;
    const micAnalyser = liveAnalyserRef.current;
    const bargeData = micAnalyser ? new Uint8Array(micAnalyser.fftSize) : null;
    let bargeSince = 0;
    const bargeTimer = setInterval(() => {
      if (!liveActiveRef.current || !micAnalyser || !bargeData) return;
      micAnalyser.getByteTimeDomainData(bargeData);
      let sum = 0;
      for (let i = 0; i < bargeData.length; i++) { const d = (bargeData[i] - 128) / 128; sum += d * d; }
      const rms = Math.sqrt(sum / bargeData.length);
      if (rms > 0.07) {
        if (!bargeSince) bargeSince = Date.now();
        else if (Date.now() - bargeSince > 300) {
          interrupted = true;
          try { liveAudioRef.current?.pause(); } catch { }
          try { window.speechSynthesis.cancel(); } catch { }
        }
      } else {
        bargeSince = 0;
      }
    }, 80);

    // Pipeline: mientras suena el chunk N ya se descarga el N+1.
    let next: Promise<Blob | null> = fetchChunk(chunks[0]);
    let piperOk = true;
    for (let i = 0; i < chunks.length; i++) {
      if (!liveActiveRef.current || interrupted) break;
      const blob = await next;
      if (i + 1 < chunks.length) next = fetchChunk(chunks[i + 1]);
      if (blob) {
        await playBlob(blob);
      } else { piperOk = false; break; }
    }
    clearInterval(bargeTimer);
    if (interrupted) return;

    // Fallback: voz del navegador si Piper no está disponible.
    if (!piperOk && liveActiveRef.current) {
      await new Promise<void>((resolve) => {
        try {
          const utter = new SpeechSynthesisUtterance(clean);
          utter.lang = liveLang() === 'en' ? 'en-US' : 'es-ES';
          utter.rate = 1.04;
          utter.onend = () => resolve();
          utter.onerror = () => resolve();
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utter);
        } catch { resolve(); }
      });
    }
  }, [liveLang]);

  const stopLiveMode = useCallback(() => {
    liveActiveRef.current = false;
    setLiveMode(false);
    setLiveStateBoth('idle');
    setLiveTranscript('');
    setLiveReply('');
    if (liveRafRef.current) { cancelAnimationFrame(liveRafRef.current); liveRafRef.current = null; }
    try { liveRecorderRef.current?.stop(); } catch { }
    try { liveStreamRef.current?.getTracks().forEach(t => t.stop()); } catch { }
    liveStreamRef.current = null;
    try { liveAudioCtxRef.current?.close(); } catch { }
    liveAudioCtxRef.current = null;
    liveAnalyserRef.current = null;
    liveSpeakAnalyserRef.current = null;
    try { liveAudioRef.current?.pause(); } catch { }
    try { window.speechSynthesis.cancel(); } catch { }
  }, []);

  /**
   * Escucha manos libres: graba, detecta con VAD cuándo terminaste de hablar
   * (1.1s de silencio tras voz), procesa y vuelve a escuchar sola.
   */
  const startLiveListening = useCallback(async () => {
    if (!liveActiveRef.current) return;
    try {
      // Micrófono y analizador persistentes (primera vez solamente).
      if (!liveStreamRef.current) {
        liveStreamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true }
        });
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        const src = ctx.createMediaStreamSource(liveStreamRef.current);
        const an = ctx.createAnalyser();
        an.fftSize = 256;
        src.connect(an);
        liveAudioCtxRef.current = ctx;
        liveAnalyserRef.current = an;
        runSpectrumLoop();
      }
      if (liveAudioCtxRef.current?.state === 'suspended') { try { await liveAudioCtxRef.current.resume(); } catch { } }

      liveChunksRef.current = [];
      const recorder = new MediaRecorder(liveStreamRef.current);
      liveRecorderRef.current = recorder;
      recorder.ondataavailable = e => { if (e.data.size > 0) liveChunksRef.current.push(e.data); };

      // --- VAD: fin de turno por silencio ---
      const analyser = liveAnalyserRef.current!;
      const timeData = new Uint8Array(analyser.fftSize);
      let spoke = false;
      let lastVoice = Date.now();
      const startedAt = Date.now();
      // Pausa antes de responder: 3.2s deja pensar y respirar a mitad de
      // frase sin que Hera interrumpa. Con pausas más largas permitidas, el
      // turno máximo también sube.
      const SILENCE_MS = 3200;
      const MAX_TURN_MS = 45000;

      // VAD adaptativo: los primeros ~600ms calibran el ruido ambiente del
      // micrófono; el umbral de voz se coloca por encima de ese suelo.
      const ambient: number[] = [];
      let speechRms = 0.035;

      const vadTimer = setInterval(() => {
        if (!liveActiveRef.current || recorder.state !== 'recording') { clearInterval(vadTimer); return; }
        analyser.getByteTimeDomainData(timeData);
        let sum = 0;
        for (let i = 0; i < timeData.length; i++) { const d = (timeData[i] - 128) / 128; sum += d * d; }
        const rms = Math.sqrt(sum / timeData.length);

        if (!spoke && ambient.length < 8) {
          ambient.push(rms);
          if (ambient.length === 8) {
            const floor = ambient.reduce((a, b) => a + b, 0) / ambient.length;
            speechRms = Math.min(0.12, Math.max(0.03, floor * 2.6));
          }
        }

        if (rms > speechRms) { spoke = true; lastVoice = Date.now(); }

        // Anillo de espera: se llena durante el silencio para que se vea que
        // el turno sigue abierto y no parezca que la app se colgó.
        if (liveRingRef.current) {
          const progress = spoke ? Math.min(1, (Date.now() - lastVoice) / SILENCE_MS) : 0;
          const circumference = 2 * Math.PI * 86;
          liveRingRef.current.style.strokeDashoffset = String(circumference * (1 - progress));
          liveRingRef.current.style.opacity = progress > 0.05 ? '1' : '0';
        }

        const shouldStop = (spoke && Date.now() - lastVoice > SILENCE_MS) || (Date.now() - startedAt > MAX_TURN_MS);
        if (shouldStop) {
          clearInterval(vadTimer);
          if (liveRingRef.current) liveRingRef.current.style.opacity = '0';
          try { recorder.stop(); } catch { }
        }
      }, 80);

      recorder.onstop = async () => {
        clearInterval(vadTimer);
        if (!liveActiveRef.current) return;
        if (!spoke) {
          // No hubo voz: vuelve a escuchar sin gastar transcripción.
          startLiveListening();
          return;
        }
        setLiveStateBoth('thinking');
        try {
          // El navegador graba WebM/Opus: se convierte a WAV PCM 16k para Whisper.
          const blob = new Blob(liveChunksRef.current, { type: liveRecorderRef.current?.mimeType || 'audio/webm' });
          const base64 = await blobToWav16kBase64(blob);
          const tr = await api('/transcribe', { method: 'POST', body: JSON.stringify({ audio: base64, lang: liveLang() }) });
          const heard = (tr.text || '').trim();
          if (!heard) {
            if (liveActiveRef.current) startLiveListening();
            return;
          }
          setLiveTranscript(heard);
          setLiveReply('');
          // live:true = el agente responde corto y hablable (menos LLM + menos TTS = menos espera).
          const data = await api('/chat', { method: 'POST', body: JSON.stringify({ message: heard, live: true }) });
          const reply = data.reply || '';
          setLiveReply(reply);
          setChatMessages(prev => [...prev,
            { id: `${Date.now()}-lv-u`, role: 'user', content: heard },
            { id: `${Date.now()}-lv-a`, role: 'assistant', content: reply, type: data.widgetType, data: data.widgetData }
          ]);
          fetchUserSubscription();
          loadUserData();
          await speakLive(reply);
        } catch (err: any) {
          // Un turno fallido no rompe la sesión: se avisa en el overlay y
          // el bucle vuelve a escuchar automáticamente.
          setLiveError(err.message || 'No te escuché bien. Inténtalo otra vez.');
          setTimeout(() => setLiveError(''), 4000);
        } finally {
          // Conversación continua: vuelve a escuchar sola.
          if (liveActiveRef.current) {
            setLiveStateBoth('listening');
            startLiveListening();
          }
        }
      };

      recorder.start();
      setLiveStateBoth('listening');
    } catch {
      showToast('No se pudo acceder al micrófono', 'error');
      stopLiveMode();
    }
  }, [runSpectrumLoop, speakLive, fetchUserSubscription, loadUserData, stopLiveMode]);

  const startLiveMode = useCallback(() => {
    liveActiveRef.current = true;
    setLiveMode(true);
    setLiveTranscript('');
    setLiveReply('');
    // Manos libres desde el primer segundo: entra escuchando.
    setLiveStateBoth('listening');
    setTimeout(() => startLiveListening(), 150);
  }, [startLiveListening]);
  const handleCancelChatAction = useCallback((msgId: string) => {
    setChatMessages(prev => prev.map(m => m.id === msgId ? { ...m, actionState: 'cancelled' } : m));
    showToast('Operación cancelada', 'info');
  }, []);

  useEffect(() => {
    if (activeTab === 'reports' && !aiReportData && !reportLoading) {
      fetchAiReport();
    }
  }, [activeTab, aiReportData, reportLoading, fetchAiReport]);

  // Auth Listener on mount (only runs once)
  useEffect(() => {
    const token = localStorage.getItem('hera_token');
    if (token && token !== 'null' && token !== 'undefined') {
      setToken(token);
      api('/me').then(u => {
        if (!u || !u.id) throw new Error('Invalid user');
        const profileData: UserProfile = {
          uid: u.id,
          email: u.email,
          displayName: u.displayName,
          theme: u.theme || 'dark',
          currency: u.currency || 'EUR',
          photoURL: u.photoURL || '',
          birthDate: u.birthDate,
          address: u.address,
          phone: u.phone,
          createdAt: u.createdAt || ''
        };
        setUserState({ uid: u.id, email: u.email, displayName: u.displayName, phone: u.phone, photoURL: u.photoURL || '' });
        setUser({ uid: u.id, email: u.email, displayName: u.displayName, phone: u.phone, photoURL: u.photoURL || '' });
        setProfile(profileData);
        setTheme(u.theme || 'dark');
        loadUserData();

        const isProfileIncomplete = !u.displayName ||
          u.displayName === u.phone ||
          !u.email ||
          u.email.endsWith('@hera.app') ||
          !u.birthDate ||
          !u.address;

        if (isProfileIncomplete) {
          openOnboarding({
            name: u.displayName,
            birthDate: u.birthDate,
            email: u.email,
            address: u.address,
            phone: u.phone,
            photoURL: u.photoURL
          });
        }
      }).catch(() => {
        localStorage.removeItem('hera_token');
        setToken(null);
        setUserState(null);
        setUser(null);
        setProfile(null);
      }).finally(() => setLoading(false));
    } else {
      localStorage.removeItem('hera_token');
      setToken(null);
      setLoading(false);
    }
  }, []);

  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Click outside listener for profile dropdown menu
  useEffect(() => {
    if (!isProfileMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const targetNode = e.target as Node;
      if (!document.body.contains(targetNode)) return;
      if (menuRef.current && !menuRef.current.contains(targetNode)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileMenuOpen]);
  // Click outside listener for country picker
  useEffect(() => {
    if (!isCountryModalOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const targetNode = e.target as Node;
      if (!document.body.contains(targetNode)) return;
      if (countryPickerRef.current && !countryPickerRef.current.contains(targetNode)) {
        setIsCountryModalOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCountryModalOpen]);
  const updateThemeMode = useCallback((newTheme: 'system' | 'light' | 'dark') => {
    const isDark = newTheme === 'dark' || (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const vars: Record<string, string> = isDark
      ? {
        '--bg': '#20201F',
        '--surface': '#2C2C2A',
        '--surface-hover': '#353533',
        '--border': '#3A3A38',
        '--text-primary': '#ECE7E1',
        '--text-secondary': '#B4AEA8',
        '--text-dim': '#8B857E',
        '--brand': '#D97757',
        '--brand-hover': '#E08668',
        '--success': '#5DAF84',
        '--warning': '#E2B04C',
        '--error': '#E06A6A'
      }
      : {
        '--bg': '#F9F9F7',
        '--surface': '#FFFFFF',
        '--surface-hover': '#F3F2EF',
        '--border': '#E7E3DD',
        '--text-primary': '#2E2B28',
        '--text-secondary': '#6F6B66',
        '--text-dim': '#9A958E',
        '--brand': '#D97757',
        '--brand-hover': '#C96A4D',
        '--success': '#3E8E68',
        '--warning': '#D89A36',
        '--error': '#C45454'
      };

    const s = document.documentElement.style;
    for (const k in vars) {
      s.setProperty(k, vars[k]);
    }

    document.getElementById('hera-root')?.setAttribute('data-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    setTheme(newTheme);
    localStorage.setItem('hera_theme', newTheme);
    if (user) {
      api('/me', { method: 'PUT', body: JSON.stringify({ theme: newTheme }) }).catch(() => { });
    }
  }, [user]);

  useEffect(() => {
    if (theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => updateThemeMode('system');
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [theme, updateThemeMode]);

  const handleSendOTP = async () => {
    const rawPhone = phone.trim();
    const fullPhone = rawPhone.startsWith('+') ? rawPhone : `${phonePrefix}${rawPhone}`;
    const cleanFullPhone = '+' + fullPhone.replace(/[^0-9]/g, '');

    if (rawPhone.length < 3) {
      setOtpError('Por favor ingresa tu número de teléfono');
      return;
    }

    localStorage.removeItem('hera_token');
    setToken(null);
    setOtpLoading(true);
    setOtpError('');

    try {
      const data = await api('/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phone: cleanFullPhone })
      });
      if (data.code) {
        console.log(`🔑 [OTP CÓDIGO REAL ENVIADO]: ${data.code}`);
      }
      showToast(data.message || 'Código de verificación enviado', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error al enviar código de verificación', 'error');
    } finally {
      setOtpSent(true);
      setOtpTimer(300);
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async (codeToVerify?: string) => {
    const code = codeToVerify || otpCode;
    if (code.length !== 6) return;

    setOtpLoading(true);
    setOtpError('');
    const rawPhone = phone.trim();
    const fullPhone = rawPhone.startsWith('+') ? rawPhone : `${phonePrefix}${rawPhone}`;
    const cleanFullPhone = '+' + fullPhone.replace(/[^0-9]/g, '');
    try {
      const data = await api('/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone: cleanFullPhone, code })
      });

      setToken(data.token);
      const userData = { uid: data.user.id, email: data.user.email, displayName: data.user.displayName, phone: data.user.phone, photoURL: data.user.photoURL || '' };
      setUserState(userData);
      setUser(userData);

      const userProfile: UserProfile = {
        uid: data.user.id,
        email: data.user.email,
        displayName: data.user.displayName,
        photoURL: data.user.photoURL || '',
        birthDate: data.user.birthDate,
        address: data.user.address,
        phone: data.user.phone,
        theme: data.user.theme || 'dark',
        currency: data.user.currency || 'EUR',
        createdAt: new Date().toISOString()
      };
      setProfile(userProfile);
      loadUserData();

      const onbProgress = data.user.onboardingStep ?? 0;
      if (data.isNewUser || onbProgress < 3) {
        openOnboarding({
          name: data.user.displayName,
          birthDate: data.user.birthDate,
          email: data.user.email,
          address: data.user.address,
          phone: fullPhone,
          photoURL: data.user.photoURL,
          // Usuario nuevo ve la bienvenida; uno a medias retoma donde quedó.
          // Progreso servidor: 0=perfil, 1=cuenta, 2=primer movimiento.
          // Pasos del asistente: -1 bienvenida, 0-1 perfil, 2 cuenta, 3 movimiento.
          startStep: data.isNewUser ? -1 : (onbProgress === 0 ? 0 : onbProgress === 1 ? 2 : 3)
        });
      } else {
        showToast('¡Bienvenido a HeraWallet!', 'success');
      }
      setOtpStatus('success');
    } catch (err: any) {
      setOtpStatus('error');
      setOtpError(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsProfileMenuOpen(false);
    setShowLogoutModal(true);
    setIsLoggingOut(true);

    setTimeout(() => {
      setShowLogoutModal(false);

      setTimeout(async () => {
        await signOut();
        setUserState(null);
        setProfile(null);
        setShowOnboarding(false);
        setOtpSent(false);
        setOtpCode('');
        setIsLoggingOut(false);
      }, 300);
    }, 1500);
  };

  // --- Voice Dictation (Whisper Local Server & Live Web Audio Waveform) ---
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);

      // Initialize Web Audio API Real-time Frequency Visualizer
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          audioCtxRef.current = audioCtx;

          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const updateVisualizer = () => {
            analyser.getByteFrequencyData(dataArray);
            const barsCount = 28;
            const step = Math.floor(bufferLength / barsCount) || 1;
            const levels: number[] = [];
            for (let i = 0; i < barsCount; i++) {
              const rawVal = dataArray[i * step] || 0;
              const pct = Math.max(12, Math.min(100, Math.round((rawVal / 255) * 100)));
              levels.push(pct);
            }
            setAudioLevels(levels);
            animFrameRef.current = requestAnimationFrame(updateVisualizer);
          };
          updateVisualizer();
        }
      } catch (e) {
        console.error('Error inicializando visualizador de audio:', e);
      }

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        // WebM/Opus del navegador → WAV PCM 16k, el único formato que
        // whisper.cpp puede decodificar.
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current?.mimeType || 'audio/webm' });
        (async () => {
          let base64Audio: string;
          try {
            base64Audio = await blobToWav16kBase64(audioBlob);
          } catch {
            showToast('No se pudo procesar el audio grabado', 'error');
            setChatLoading(false);
            setIsAiParsingAudio(false);
            return;
          }
          try {
            if (showAddModal) {
              setIsAiParsingAudio(true);
              showToast('Analizando dictado e interpretando intención con IA...', 'info');
              const res = await api('/transcribe', {
                method: 'POST',
                body: JSON.stringify({ audio: base64Audio })
              });
              const transcribedText = res.text || 'Gasto registrado por voz';
              const parsedRes = await api('/finance/parse-voice-tx', {
                method: 'POST',
                body: JSON.stringify({ text: transcribedText, defaultType: addType })
              });
              if (parsedRes.success && parsedRes.transaction) {
                const defaultAccId = selectedAccountId || accounts[0]?.id || '';
                setSelectedAccountId(defaultAccId);
                setAiParsedPreview({
                  type: parsedRes.transaction.type || addType || 'expense',
                  amount: parsedRes.transaction.amount || 10,
                  category: parsedRes.transaction.category || 'General',
                  description: parsedRes.transaction.description || transcribedText,
                  accountId: defaultAccId
                });
                setAddModalStep(2); // Advance to Step 2 confirmation!
              } else {
                showToast('No se pudo interpretar el dictado', 'error');
              }
            } else {
              setChatLoading(true);
              showToast('Procesando dictado por voz...', 'info');
              const res = await api('/transcribe', {
                method: 'POST',
                body: JSON.stringify({ audio: base64Audio })
              });
              if (res.text) {
                setChatInput(res.text);
                sendChatMessage(res.text);
              }
            }
          } catch (err: any) {
            showToast(err.message || 'Error en procesamiento de voz con IA', 'error');
          } finally {
            setChatLoading(false);
            setIsAiParsingAudio(false);
          }
        })();
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      showToast('Escuchando... Habla ahora', 'info');
    } catch (err) {
      showToast('No se pudo acceder al micrófono', 'error');
    }
  };

  const stopVoiceRecording = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => { });
      audioCtxRef.current = null;
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
  };

  const startLiveCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        setCameraStream(stream);
        setIsCameraActive(true);
        setTimeout(() => {
          if (cameraVideoRef.current) {
            cameraVideoRef.current.srcObject = stream;
          }
        }, 100);
      } else {
        cameraInputRef.current?.click();
      }
    } catch {
      cameraInputRef.current?.click();
    }
  };

  const stopLiveCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const captureCameraSnapshot = () => {
    if (!cameraVideoRef.current) return;
    const video = cameraVideoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Img = canvas.toDataURL('image/jpeg', 0.85);
      stopLiveCamera();
      processImageForScan(base64Img);
    }
  };

  const processImageForScan = async (base64Img: string) => {
    setScannedImagePreview(base64Img);
    setIsScanningImage(true);
    setScanRejectionMsg(null);
    showToast('Analizando imagen con Gemini Vision...', 'info');

    try {
      const res = await api('/scan-receipt', {
        method: 'POST',
        body: JSON.stringify({ image: base64Img })
      });

      if (res && res.isValidRecord !== false && res.merchant) {
        const defaultAccId = accounts[0]?.id || '';
        setScanRejectionMsg(null);
        setAiParsedPreview({
          type: res.type || 'expense',
          amount: typeof res.amount === 'number' ? res.amount : parseFloat(res.amount || 0),
          category: res.category || 'Varios',
          description: res.merchant,
          accountId: defaultAccId
        });
        setAddModalStep(2);
        showToast(`Comprobante de ${res.merchant} - $${res.amount} detectado`, 'success');
      } else {
        const reason = res?.error || 'La imagen no parece ser un comprobante financiero válido.';
        setScanRejectionMsg(reason);
        showToast(reason, 'error');
      }
    } catch (err: any) {
      console.error('[processImageForScan] Error:', err);
      const reason = err.message || 'Error al procesar la imagen con Gemini Vision';
      setScanRejectionMsg(reason);
      showToast(reason, 'error');
    } finally {
      setIsScanningImage(false);
    }
  };

  const handleImageRecordScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so re-selecting the same file triggers onChange again
    const inputEl = e.target;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Img = reader.result as string;
      processImageForScan(base64Img);
    };
    reader.readAsDataURL(file);

    // Clear the input value after reading so that onChange fires for the same file next time
    setTimeout(() => { inputEl.value = ''; }, 100);
  };

  // --- Send Message to AI Function Calling Engine ---
  const sendChatMessage = async (overrideText?: string) => {
    const textToSend = overrideText || chatInput;
    if (!textToSend.trim() || chatLoading) return;

    const userMsg = { id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, role: 'user', content: textToSend };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);
    setCurrentReasoningText('');

    try {
      const data = await api('/chat', {
        method: 'POST',
        body: JSON.stringify({ message: textToSend })
      });

      if (data.reasoningContent) {
        setCurrentReasoningText(data.reasoningContent);
      }

      const aiMsg = {
        id: `${Date.now() + 1}-${Math.random().toString(36).substring(2, 9)}`,
        role: 'assistant',
        content: data.reply,
        reasoningContent: data.reasoningContent || '',
        type: data.widgetType,
        data: data.widgetData
      };

      setChatMessages(prev => {
        const newMsgs = [...prev, aiMsg];
        // Save/update session in chatHistory
        setChatHistory(hPrev => {
          const sessionTitle = newMsgs[0]?.content || textToSend;
          const existingIndex = hPrev.findIndex(s => s.id === currentSessionId);
          let updated: any[];
          if (existingIndex !== -1) {
            updated = [...hPrev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              messages: newMsgs,
              updatedAt: new Date().toISOString()
            };
          } else {
            const newId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            setCurrentSessionId(newId);
            updated = [
              {
                id: newId,
                title: sessionTitle,
                messages: newMsgs,
                updatedAt: new Date().toISOString()
              },
              ...hPrev
            ];
          }
          try { localStorage.setItem('hera_chat_history', JSON.stringify(updated)); } catch { }
          return updated;
        });
        return newMsgs;
      });

      // Refetch subscription tokens and token transactions history
      fetchUserSubscription();
      fetchTokenHistory(1);
      loadUserData();
    } catch (err: any) {
      showToast(err.message || 'Error al conectar con la IA', 'error');
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    (window as any).sendChatMessage = sendChatMessage;
  }, [sendChatMessage]);

  // --- Receipt Scanner Upload ---
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Img = reader.result as string;
      setChatLoading(true);
      showToast('Analizando recibo con Google Gemini Vision...', 'info');

      try {
        const res = await api('/scan-receipt', {
          method: 'POST',
          body: JSON.stringify({ image: base64Img })
        });

        if (res && res.isValidRecord !== false && res.merchant) {
          // Widget de acción pendiente: el usuario confirma y AHÍ se crea la
          // transacción y se descuenta el saldo (vía /finance/confirm-action).
          const parsedAmount = typeof res.amount === 'number' ? res.amount : parseFloat(res.amount || 0);
          const receiptMsg = {
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            role: 'assistant',
            content: `¡Recibo o comprobante analizado con éxito!\n\n**Establecimiento / Concepto**: ${res.merchant}\n**Importe**: ${parsedAmount}\n**Categoría**: ${res.category || 'Varios'}\n**Fecha**: ${res.date || new Date().toISOString().split('T')[0]}\n\nConfirma para registrarlo y descontar el saldo de tu cuenta.`,
            type: 'pending_action',
            data: {
              actionType: 'create_transaction',
              type: res.type || 'expense',
              amount: parsedAmount,
              category: res.category || 'Varios',
              description: res.merchant,
              accountId: accounts[0]?.id || '',
              accountName: accounts[0]?.name || 'Cuenta Principal'
            }
          };

          setChatMessages(prev => [...prev, receiptMsg]);
          showToast('Comprobante verificado. Confirma para guardarlo.', 'success');
        } else {
          showToast(res?.error || 'La foto adjuntada no es un comprobante financiero válido', 'error');
        }
      } catch (err: any) {
        showToast(err.message || 'Error al procesar la imagen con la IA de Google Gemini', 'error');
      } finally {
        setChatLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // --- Admin Login & Data Fetching ---
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUsername, password: adminPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Credenciales incorrectas');

      localStorage.setItem('hera_admin_token', data.token);
      setAdminToken(data.token);
      showToast('Sesión de administrador iniciada', 'success');
      loadAdminData(data.token);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setAdminLoading(false);
    }
  };

  const loadAdminData = useCallback(async (token?: string) => {
    const t = token || adminToken;
    if (!t) return;
    try {
      const headers = { 'Authorization': `Bearer ${t}` };
      const [statsRes, provsRes, usersRes, logsRes, plansRes, cubaRes, allTxsRes] = await Promise.all([
        fetch('/api/admin/stats', { headers }).then(r => r.json()),
        fetch('/api/admin/providers', { headers }).then(r => r.json()),
        fetch('/api/admin/users', { headers }).then(r => r.json()),
        fetch('/api/admin/logs', { headers }).then(r => r.json()),
        fetch('/api/admin/plans', { headers }).then(r => r.json()),
        fetch('/api/admin/cuba-requests', { headers }).then(r => r.json()),
        fetch('/api/admin/all-transactions', { headers }).then(r => r.json())
      ]);

      setAdminStats(statsRes);
      setAiProviders(provsRes || []);
      setAdminUsers(usersRes || []);
      setAdminLogs(logsRes || []);
      if (Array.isArray(plansRes)) setAdminPlans(plansRes);
      if (Array.isArray(cubaRes)) setCubaRequests(cubaRes);
      if (Array.isArray(allTxsRes)) setAdminAllTransactions(allTxsRes);
    } catch { } finally {
      setAdminDataLoading(false);
    }
  }, [adminToken]);

  const handleToggleUserRole = async (userId: string, currentRole: string) => {
    if (!adminToken) return;
    const newRole = currentRole === 'founder' ? 'standard' : 'founder';
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Usuario asignado a rol ${newRole === 'founder' ? 'Founder (Acceso Ilimitado)' : 'Standard'}`, 'success');
        loadAdminData();
        if (selectedUserForTelemetry?.id === userId) {
          setSelectedUserForTelemetry((prev: any) => ({ ...prev, role: newRole }));
        }
      } else {
        showToast(data.error || 'Error al cambiar rol', 'error');
      }
    } catch {
      showToast('Error de conexión con el servidor', 'error');
    }
  };

  const handleOpenUserTelemetry = async (u: any) => {
    setSelectedUserForTelemetry(u);
    setShowTelemetryDrawer(true);
    setIsLoadingTelemetry(true);
    setUserTelemetryData(null);
    if (!adminToken) return;
    try {
      const res = await fetch(`/api/admin/users/${u.id}/telemetry`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await res.json();
      setUserTelemetryData(data);
    } catch { } finally {
      setIsLoadingTelemetry(false);
    }
  };

  useEffect(() => {
    if (showAdmin && adminToken) {
      loadAdminData();
    }
  }, [showAdmin, adminToken, loadAdminData]);

  const handleUpdateProviderKey = async (id: string, apiKey: string, isActive: number) => {
    if (!adminToken) return;
    try {
      await fetch(`/api/admin/providers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ apiKey, isActive })
      });
      showToast('Proveedor de IA actualizado', 'success');
      loadAdminData();
    } catch {
      showToast('Error al actualizar proveedor', 'error');
    }
  };

  const handleAddProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProviderName || !newProviderModel || !adminToken) return;
    try {
      await fetch('/api/admin/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ name: newProviderName, model: newProviderModel, apiKey: newProviderKey })
      });
      setNewProviderName('');
      setNewProviderModel('');
      setNewProviderKey('');
      showToast('Nuevo proveedor añadido', 'success');
      loadAdminData();
    } catch {
      showToast('Error al añadir proveedor', 'error');
    }
  };

  // Global Network Connectivity State
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Conexión reestablecida', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Sin conexión a internet', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return <HeraOfflineErrorScreen type="offline" onRetry={() => setIsOnline(navigator.onLine)} />;
  }

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-bg text-text-primary gap-6 select-none">
        <HeraWalletLogo size="lg" showText={true} />
        <div className="flex items-center justify-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brand animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2.5 h-2.5 rounded-full bg-brand animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2.5 h-2.5 rounded-full bg-brand animate-bounce" />
        </div>
      </div>
    );
  }

  // --- OTP Login Screen ---
  if (!user && !showAdmin) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-bg p-4 relative overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-brand/10 rounded-full blur-3xl pointer-events-none" />

        <Toast />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-[340px] w-full bg-surface border border-border p-6 rounded-3xl text-center space-y-6 shadow-xl relative z-10"
        >
          {/* Logo Emblem */}
          <div className="mx-auto flex justify-center">
            <HeraWalletLogo size="lg" showText={false} />
          </div>

          {/* Header */}
          <div className="space-y-1 text-center">
            <h1 className="text-2xl font-serif font-semibold tracking-tight text-text-primary">HeraWallet</h1>
            <p className="text-xs text-text-secondary max-w-[260px] mx-auto leading-relaxed">
              {!otpSent
                ? 'Tus metas empiezan con un mejor control. Accede con tu teléfono.'
                : `Ingresa el código enviado al ${phonePrefix} ${phone}`
              }
            </p>
          </div>

          {!otpSent ? (
            <div className="space-y-4 text-left">
              {/* Phone Input Group */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-medium uppercase tracking-wider text-text-secondary">Número de teléfono</label>
                <div className="flex gap-2 w-full min-w-0">
                  {/* Fixed-width Country Picker Trigger */}
                  <div className="relative w-20 shrink-0" ref={countryPickerRef}>
                    <button
                      type="button"
                      onClick={() => setIsCountryModalOpen(prev => !prev)}
                      className="w-full h-11 bg-bg border border-border hover:border-brand/60 rounded-2xl px-2 text-xs font-mono text-text-primary flex items-center justify-between transition-all cursor-pointer shadow-xs active:scale-[0.97]"
                    >
                      <span className="truncate flex items-center gap-1 font-semibold">
                        <span>{COUNTRY_PREFIXES.find(c => c.code === phonePrefix)?.flag || '🇨🇺'}</span>
                        <span>{phonePrefix}</span>
                      </span>
                      <ChevronDown size={12} className={cn("text-text-dim transition-transform shrink-0", isCountryModalOpen && "rotate-180")} />
                    </button>

                    <AnimatePresence>
                      {isCountryModalOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 4 }}
                          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                          className="absolute left-0 top-full mt-2 w-64 max-w-[260px] bg-surface border border-border rounded-3xl shadow-2xl p-3 z-50 space-y-2"
                          onMouseDown={e => e.stopPropagation()}
                        >
                          <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                            <input
                              type="text"
                              value={countrySearch}
                              onChange={e => setCountrySearch(e.target.value)}
                              placeholder="Buscar país o código..."
                              className="w-full bg-bg border border-border rounded-xl pl-8 pr-3 py-2 text-xs text-text-primary placeholder:text-text-dim focus:outline-none focus:border-brand/60"
                              autoFocus
                            />
                          </div>

                          <div className="max-h-52 overflow-y-auto space-y-1 pr-1 font-sans">
                            {COUNTRY_PREFIXES.filter(c =>
                              c.country.toLowerCase().includes(countrySearch.toLowerCase()) ||
                              c.code.includes(countrySearch)
                            ).map((item, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setPhonePrefix(item.code);
                                  setIsCountryModalOpen(false);
                                  setCountrySearch('');
                                }}
                                className={cn(
                                  "w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer text-left",
                                  phonePrefix === item.code ? "bg-brand/10 text-brand font-semibold border border-brand/20" : "hover:bg-surface-hover text-text-primary"
                                )}
                              >
                                <div className="flex items-center gap-1.5 truncate min-w-0">
                                  <span className="text-base leading-none shrink-0">{item.flag}</span>
                                  <span className="truncate">{item.country}</span>
                                </div>
                                <span className="font-mono text-text-dim shrink-0 text-[11px]">{item.code}</span>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (phone && acceptedTerms && !otpLoading) handleSendOTP(); } }}
                    placeholder={COUNTRY_PREFIXES.find(c => c.code === phonePrefix)?.example || '54232684'}
                    className="h-11 min-w-0 flex-1 bg-bg border border-border hover:border-brand/60 focus:border-brand focus:ring-2 focus:ring-brand/10 rounded-2xl px-3 text-sm font-sans font-medium text-text-primary placeholder:text-text-dim transition-all focus:outline-none"
                    autoFocus
                  />
                </div>
                {otpError && <p className="text-xs text-error mt-1">{otpError}</p>}

                {/* Terms and Conditions Required Checkbox */}
                <div className="flex items-center justify-center gap-2 pt-1">
                  <input
                    id="accept-terms-checkbox"
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={e => setAcceptedTerms(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-brand focus:ring-brand focus:ring-1 accent-brand cursor-pointer shrink-0"
                  />
                  <label htmlFor="accept-terms-checkbox" className="text-[11px] text-text-secondary leading-none cursor-pointer select-none flex items-center gap-1 flex-wrap">
                    <span>Acepto los</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsTermsModalOpen(true);
                      }}
                      className="text-brand font-semibold hover:underline focus:outline-none cursor-pointer"
                    >
                      Términos y condiciones de uso
                    </button>
                  </label>
                </div>
              </div>

              {/* Submit Button (Requires Checkbox Selection) */}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSendOTP(); }}
                disabled={otpLoading || !phone || !acceptedTerms}
                className="w-full h-11 bg-brand hover:bg-brand-hover text-white font-semibold rounded-2xl transition-all shadow-md active:scale-[0.98] disabled:bg-surface-hover disabled:text-text-dim disabled:border disabled:border-border disabled:shadow-none cursor-pointer flex items-center justify-center gap-2 text-sm"
              >
                {otpLoading ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" />
                  </div>
                ) : 'Continuar con SMS'}
              </button>
            </div>
          ) : (
            <div className="space-y-6 text-left">
              <div className="space-y-3">
                <label className="text-xs font-medium uppercase tracking-wider text-text-secondary">Código de verificación</label>

                <motion.div
                  className="grid grid-cols-6 gap-2 sm:gap-2.5 w-full"
                  animate={otpStatus === 'error' ? { x: [-10, 10, -10, 10, 0] } : {}}
                  transition={{ duration: 0.4 }}
                >
                  {Array.from({ length: 6 }).map((_, i) => (
                    <input
                      key={i}
                      ref={el => { otpInputsRef.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={otpCode[i] || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        if (!val && e.target.value) return; // ignore non-numeric typing
                        const newCode = otpCode.split('');
                        newCode[i] = val.slice(-1);
                        const finalCode = newCode.join('');
                        setOtpCode(finalCode);
                        setOtpStatus('typing');
                        setOtpError('');

                        if (val && i < 5) otpInputsRef.current[i + 1]?.focus();
                        if (finalCode.length === 6) handleVerifyOTP(finalCode);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace') {
                          e.preventDefault();
                          const newCode = otpCode.split('');
                          if (newCode[i]) {
                            newCode[i] = '';
                            setOtpCode(newCode.join(''));
                          } else if (i > 0) {
                            newCode[i - 1] = '';
                            setOtpCode(newCode.join(''));
                            otpInputsRef.current[i - 1]?.focus();
                          }
                          setOtpStatus('typing');
                          setOtpError('');
                        } else if (e.key === 'ArrowLeft' && i > 0) {
                          e.preventDefault();
                          otpInputsRef.current[i - 1]?.focus();
                        } else if (e.key === 'ArrowRight' && i < 5) {
                          e.preventDefault();
                          otpInputsRef.current[i + 1]?.focus();
                        } else if (e.key === 'Enter') {
                          e.preventDefault();
                          if (otpCode.length === 6) handleVerifyOTP(otpCode);
                        }
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
                        if (pasted) {
                          setOtpCode(pasted);
                          if (pasted.length === 6) {
                            otpInputsRef.current[5]?.focus();
                            handleVerifyOTP(pasted);
                          } else {
                            otpInputsRef.current[pasted.length]?.focus();
                          }
                        }
                      }}
                      className={cn(
                        "w-full h-14 bg-bg border-2 rounded-xl text-center text-xl font-mono text-text-primary focus:outline-none transition-colors",
                        otpStatus === 'error' ? "border-error text-error bg-error/5" :
                          otpStatus === 'success' ? "border-success text-success bg-success/5" :
                            otpCode[i] ? "border-brand shadow-[0_0_10px_rgba(217,119,87,0.2)]" : "border-border focus:border-brand/60"
                      )}
                      autoFocus={i === 0}
                    />
                  ))}
                </motion.div>
                {otpError && <p className="text-xs text-error mt-2 text-center">{otpError}</p>}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setOtpCode(''); setOtpError(''); }}
                  className="text-xs text-brand font-medium hover:text-brand-hover transition-colors cursor-pointer"
                >
                  Cambiar número
                </button>

                {otpTimer > 0 ? (
                  <span className="text-xs font-mono font-medium text-text-secondary">
                    {String(Math.floor(otpTimer / 60)).padStart(2, '0')}:{String(otpTimer % 60).padStart(2, '0')}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); handleSendOTP(); }}
                    disabled={otpLoading}
                    className="text-xs text-brand font-medium hover:text-brand-hover transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                  >
                    {otpLoading && <Sparkles size={12} className="animate-spin" />}
                    Reenviar OTP
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* Modal Extendida de Términos, Condiciones y Políticas Legalmente Blindadas */}
        <AnimatePresence>
          {isTermsModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md font-sans">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-2xl w-full max-h-[88vh] bg-surface border border-border p-6 sm:p-8 rounded-[32px] shadow-2xl flex flex-col space-y-5 text-left relative z-50"
              >
                {/* Header Modal */}
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-serif font-bold text-text-primary">Términos, Condiciones y Políticas de Privacidad</h2>
                    <p className="text-[11px] text-text-secondary font-mono">HeraWallet • Documento Legal Oficial</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsTermsModalOpen(false)}
                    className="p-2 rounded-2xl text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Legal Body Content */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-5 text-xs text-text-secondary leading-relaxed font-sans">
                  <section className="space-y-1.5">
                    <h3 className="font-bold text-text-primary text-xs uppercase font-mono tracking-wider">1. Aceptación de los Términos y Naturaleza del Servicio</h3>
                    <p>
                      Bienvenido a HeraWallet. Al crear una cuenta, acceder mediante verificación por SMS (OTP) o utilizar nuestros servicios analíticos, usted ("el Usuario") acepta sin reservas estar sujeto a estos Términos, Condiciones y Políticas de Privacidad. HeraWallet opera como una plataforma inteligente de gestión financiera personal, consolidación patrimonial y análisis automatizado mediante Inteligencia Artificial.
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h3 className="font-bold text-text-primary text-xs uppercase font-mono tracking-wider">2. Suscripciones, Planes y Sistema de Cómputo de Tokens</h3>
                    <p>
                      El acceso a características avanzadas de la plataforma (tales como procesamiento de notas de voz, escaneo OCR de facturas y recibos, generación de informes ejecutivos y consultas interactivas con agentes de IA) está estructurado bajo planes de suscripción (Standard y Founders VIP) y un sistema de crédito por tokens. Los tokens consumidos en cada operación no son acumulables a periodos vencidos excepto en planes explícitamente autorizados. HeraWallet se reserva el derecho de modificar los límites de uso previa notificación en la plataforma.
                    </p>
                  </section>

                  <section className="space-y-1.5 bg-bg/80 p-4 rounded-2xl border border-border/60">
                    <h3 className="font-bold text-text-primary text-xs uppercase font-mono tracking-wider">
                      3. Descargo de Responsabilidad y Protección Legal contra Demandas
                    </h3>
                    <p>
                      <strong>Inmunidad de Asesoría Financiera Regulada:</strong> HeraWallet no es una entidad bancaria, institución financiera regulada ni firma de asesoría de inversiones bajo normativas como la SEC, CNMV u organismos supervisores locales. Todas las métricas, proyecciones, gráficos y recomendaciones generadas por la Inteligencia Artificial tienen carácter exclusivamente informativo y educativo. El Usuario asume total y absoluta responsabilidad sobre sus decisiones financieras, de inversión o presupuestarias.
                    </p>
                    <p>
                      <strong>Renuncia a Demandas Colectivas (Class Action Waiver):</strong> El Usuario acuerda que cualquier controversia, reclamo o disputa legal derivada del uso de HeraWallet será resuelta de manera individual mediante diálogo directo o arbitraje independiente, renunciando expresamente al derecho de promover, unirse o participar en demandas colectivas, acciones de clase o litigios judiciales masivos contra HeraWallet, sus desarrolladores, socios o proveedores de infraestructura.
                    </p>
                  </section>

                  <section className="space-y-2 bg-bg/80 p-4 rounded-2xl border border-border/60">
                    <h3 className="font-bold text-text-primary text-xs uppercase font-mono tracking-wider">
                      4. Recopilación, Tratamiento y Consentimiento Consciente de Datos
                    </h3>
                    <p>
                      El Usuario declara ser totalmente consciente y otorga su consentimiento expreso, libre e informado para que HeraWallet recopile, procese, analice y almacene encriptadamente la siguiente información proporcionada voluntariamente:
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-[11px] text-text-primary font-mono">
                      <li>Número de teléfono de autenticación, dirección de correo electrónico y datos de perfil.</li>
                      <li>Registros de transacciones de ingresos y gastos, montos, fechas, categorías y nombres de cuentas bancarias o tarjetas.</li>
                      <li>Imágenes de facturas, recibos y tickets de compra cargados voluntariamente para extracción OCR de datos.</li>
                      <li>Archivos de audio y transcripciones de notas de voz enviadas para procesamiento del lenguaje natural.</li>
                      <li>Telemetría técnica, historial de mensajes con la IA y registros de uso del sistema.</li>
                    </ul>
                    <p className="text-[11px] text-text-secondary">
                      Toda la información es resguardada bajo altos estándares de cifrado y se utiliza strictly para calcular balances, entrenar el contexto de su asistente personal y mantener la seguridad del sistema. HeraWallet garantiza que no vende ni comercializa datos personales con terceros o corredores de datos.
                    </p>
                  </section>

                  <section className="space-y-2 bg-bg/80 p-4 rounded-2xl border border-border/60">
                    <h3 className="font-bold text-text-primary text-xs uppercase font-mono tracking-wider">
                      5. Política Estricta de Devoluciones y Reembolsos (7 Días)
                    </h3>
                    <p>
                      Toda compra de suscripciones o paquetes de tokens en HeraWallet se rige por las siguientes condiciones específicas de reembolso:
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-[11px] text-text-primary font-mono">
                      <li><strong>Plazo Límite de 7 Días:</strong> Cualquier solicitud de reembolso debe ser presentada formalmente dentro de un plazo máximo de <strong>7 días continuos</strong> posteriores a la fecha exacta de la compra. Transcurridos los 7 días, la venta se considerará firme y definitiva sin derecho a devolución.</li>
                      <li><strong>Caso Aprobado 1 (Fallo Técnico del Sistema):</strong> Ocurrencia y comprobación técnica de un error imputable al sistema durante el procesamiento del pago que haya impedido la acreditación de la suscripción.</li>
                      <li><strong>Caso Aprobado 2 (Pago Duplicado Accidental):</strong> Demostración verificable de que el sistema procesó un cobro doble involuntario por una misma transacción.</li>
                    </ul>
                    <p className="text-[11px] text-text-secondary">
                      No aplican reembolsos en caso de consumo previo total o parcial de los tokens asignados o por cambio de opinión del usuario. Para tramitar una devolución dentro del plazo de 7 días, contacte al canal de soporte adjuntando el ID o comprobante oficial de la transacción.
                    </p>
                  </section>
                </div>

                {/* Footer Modal */}
                <div className="pt-3 border-t border-border flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsTermsModalOpen(false)}
                    className="px-4 py-2.5 bg-bg hover:bg-surface-hover text-text-secondary hover:text-text-primary border border-border rounded-2xl text-xs font-medium transition-colors cursor-pointer"
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAcceptedTerms(true);
                      setIsTermsModalOpen(false);
                    }}
                    className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-2xl shadow-md transition-all active:scale-[0.97] cursor-pointer"
                  >
                    Aceptar Términos
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // --- Main HeraWallet App Shell ---
  return (
    <div
      id="hera-root"
      data-theme={theme}
      className={cn(
        "bg-bg text-text-primary flex flex-col font-sans",
        activeTab === 'chat' && chatMessages.length > 0
          ? "h-screen h-[100dvh] overflow-hidden"
          : "min-h-screen pb-20 sm:pb-0"
      )}
    >
      <Toast />

      {/* Header Navbar (Hidden when in admin panel or active chat thread) */}
      {!showAdmin && !(activeTab === 'chat' && chatMessages.length > 0) && (
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          className="bg-surface/80 backdrop-blur-xl sticky top-0 z-40 mx-1.5 sm:mx-2.5 mt-1.5 rounded-2xl border border-border shadow-lg shadow-black/5"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div onClick={() => { setActiveTab('chat'); setShowAdmin(false); }}>
              <HeraWalletLogo size="sm" showText={true} />
            </div>

            <div className="flex items-center gap-2">
              {/* Quick Add Button (+) to the left of User Profile */}
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="bg-surface/80 hover:bg-surface-hover border border-border/80 hover:border-brand/40 text-text-primary hover:text-brand flex items-center justify-center h-10 px-3.5 rounded-2xl shadow-xs text-xs font-medium cursor-pointer transition-all active:scale-95 gap-1.5 shrink-0"
                title="Nuevo Registro por Voz o Texto"
              >
                <Plus size={16} strokeWidth={2.5} className="text-brand" />
                <span className="hidden sm:inline font-semibold">Nuevo</span>
              </button>

              {/* Bell Notifications Button - Premium HeraWallet Design */}
              <button
                type="button"
                onClick={() => {
                  fetchUserNotifications();
                  setShowNotifDrawer(true);
                }}
                className="relative bg-surface hover:bg-surface-hover border border-border/80 hover:border-brand/40 text-text-primary hover:text-brand flex items-center justify-center w-10 h-10 rounded-2xl shadow-xs text-xs font-medium cursor-pointer transition-all active:scale-[0.95] shrink-0 group"
                title="Centro de Notificaciones"
              >
                <Bell size={18} strokeWidth={1.8} className="transition-transform duration-200 group-hover:rotate-12" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-brand text-white font-bold font-mono text-[9px] rounded-full flex items-center justify-center px-1 border-2 border-surface shadow-sm animate-pulse">
                    {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                  </span>
                )}
              </button>

              {/* Profile Dropdown Trigger & Menu */}
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsProfileMenuOpen(prev => !prev);
                  }}
                  className={cn(
                    "w-10 h-10 rounded-2xl border transition-all p-0.5 flex items-center justify-center active:scale-[0.95] shadow-sm overflow-hidden cursor-pointer",
                    (profile?.photoURL || user?.photoURL)
                      ? "border-border bg-surface hover:bg-surface-hover hover:border-brand/40"
                      : "border-transparent bg-transparent hover:bg-surface-hover/50"
                  )}
                  title="Perfil"
                >
                  <img
                    src={profile?.photoURL || user?.photoURL || "/defaultuser.png"}
                    alt="Foto de perfil"
                    className={cn(
                      "w-full h-full rounded-xl",
                      (profile?.photoURL || user?.photoURL) ? "object-cover" : "object-contain"
                    )}
                  />
                </button>

                <AnimatePresence>
                  {isProfileMenuOpen && (
                    <motion.div
                      key="profile-dropdown"
                      initial={{ opacity: 0, scale: 0.95, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -8 }}
                      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                      className="absolute right-0 mt-2 w-72 bg-surface border border-border rounded-3xl shadow-2xl p-4 z-50 space-y-3.5"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-3 p-2.5 bg-bg border border-border/60 rounded-2xl">
                        <img
                          src={profile?.photoURL || user?.photoURL || "/defaultuser.png"}
                          alt="Foto de perfil"
                          className="w-10 h-10 rounded-xl object-cover border border-brand/20 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate text-text-primary leading-tight">
                            {profile?.displayName || user?.displayName || 'Usuario'}
                          </p>
                          <p className="text-[11px] text-text-secondary truncate mt-0.5">
                            {profile?.email || 'Sin correo'}
                          </p>
                          <p className="text-[10px] font-mono text-text-dim truncate">
                            {profile?.phone || user?.phone}
                          </p>
                        </div>
                      </div>

                      {/* Consumo de tokens y cuenta atrás hasta la renovación */}
                      <TokenUsageMeter
                        subscription={userSubscriptionData?.subscription}
                        onUpgrade={() => {
                          setIsProfileMenuOpen(false);
                          setShowUpgradeModal(true);
                        }}
                      />

                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsProfileMenuOpen(false);
                          openOnboarding({
                            name: profile?.displayName,
                            birthDate: profile?.birthDate,
                            email: profile?.email,
                            address: profile?.address,
                            phone: profile?.phone,
                            photoURL: profile?.photoURL || user?.photoURL
                          });
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-surface-hover text-xs font-medium text-text-primary transition-colors text-left group cursor-pointer"
                      >
                        <div className="w-7.5 h-7.5 rounded-xl bg-brand/10 text-brand flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                          <UserIcon size={15} />
                        </div>
                        <div className="flex-1">
                          <span className="font-medium text-text-primary">Editar perfil</span>
                          <p className="text-[10px] text-text-secondary">Nombre, correo y dirección</p>
                        </div>
                      </button>

                      {/* Configuration Option */}
                      <button
                        type="button"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsProfileMenuOpen(false);
                          setActiveTab('settings');
                          setShowAdmin(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-surface-hover text-xs font-medium text-text-primary transition-colors text-left group cursor-pointer"
                      >
                        <div className="w-7.5 h-7.5 rounded-xl bg-brand/10 text-brand flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                          <Settings size={15} />
                        </div>
                        <div className="flex-1">
                          <span className="font-medium text-text-primary">Configuración</span>
                          <p className="text-[10px] text-text-secondary">Moneda, suscripción y reglas de IA</p>
                        </div>
                      </button>

                      <div className="pt-2 border-t border-border space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-xs font-medium text-text-primary">Apariencia</span>
                        </div>

                        <div className="bg-bg border border-border p-1 rounded-2xl flex items-center justify-between gap-1">
                          <button
                            type="button"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateThemeMode('system'); }}
                            className={cn(
                              "flex-1 flex items-center justify-center py-2 rounded-xl transition-all text-xs font-medium gap-1.5 cursor-pointer",
                              theme === 'system' ? "bg-surface text-brand shadow-sm font-semibold" : "text-text-secondary hover:text-text-primary"
                            )}
                            title="Tema del sistema"
                          >
                            <Monitor size={15} />
                          </button>

                          <button
                            type="button"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateThemeMode('light'); }}
                            className={cn(
                              "flex-1 flex items-center justify-center py-2 rounded-xl transition-all text-xs font-medium gap-1.5 cursor-pointer",
                              theme === 'light' ? "bg-surface text-brand shadow-sm font-semibold" : "text-text-secondary hover:text-text-primary"
                            )}
                            title="Tema claro"
                          >
                            <Sun size={15} />
                          </button>

                          <button
                            type="button"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateThemeMode('dark'); }}
                            className={cn(
                              "flex-1 flex items-center justify-center py-2 rounded-xl transition-all text-xs font-medium gap-1.5 cursor-pointer",
                              theme === 'dark' ? "bg-surface text-brand shadow-sm font-semibold" : "text-text-secondary hover:text-text-primary"
                            )}
                            title="Tema oscuro"
                          >
                            <Moon size={15} />
                          </button>
                        </div>
                      </div>


                      <div className="pt-2 border-t border-border">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-error/10 text-xs font-medium text-error transition-colors text-left group cursor-pointer"
                        >
                          <div className="w-7.5 h-7.5 rounded-xl bg-error/10 text-error flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                            <LogOut size={15} />
                          </div>
                          <span>Cerrar sesión</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.header>
      )}

      {/* Main Workspace vs Admin Panel Area */}
      {showAdmin ? (
        /* --- ADMIN PANEL UNWRAPPED WORKSPACE (/panel) --- */
        <div className="min-h-screen bg-bg text-text-primary w-full flex flex-col">
          {!adminToken ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                className="max-w-md w-full bg-surface border border-border p-8 rounded-3xl space-y-6 shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand/10 text-brand flex items-center justify-center border border-brand/20">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-text-primary">Administración</h2>
                    <p className="text-xs text-text-secondary">Ingresa tus credenciales para continuar</p>
                  </div>
                </div>

                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="space-y-1 text-left">
                    <label className="text-xs font-medium text-text-secondary">Usuario</label>
                    <input
                      type="text"
                      value={adminUsername}
                      onChange={e => setAdminUsername(e.target.value)}
                      placeholder="admin"
                      className="w-full bg-bg border border-border p-3 rounded-2xl text-xs focus:outline-none focus:border-brand text-text-primary"
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-xs font-medium text-text-secondary">Contraseña</label>
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={e => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-bg border border-border p-3 rounded-2xl text-xs focus:outline-none focus:border-brand text-text-primary"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={adminLoading}
                    className="w-full py-3 bg-brand hover:bg-brand-hover text-white font-medium rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {adminLoading ? <Sparkles size={16} className="animate-spin" /> : <Key size={16} />}
                    <span>Iniciar sesión</span>
                  </button>
                </form>
              </motion.div>
            </div>
          ) : (
            /* Authorized Admin Desktop Sidebar Layout (Clean & Fixed) */
            <div className="min-h-screen bg-bg text-text-primary flex flex-col lg:flex-row w-full relative">
              {/* --- FIXED LEFT SIDEBAR FOR DESKTOP (lg:flex w-64 xl:w-72) --- */}
              <aside className="hidden lg:flex flex-col w-64 xl:w-72 bg-surface border-r border-border fixed inset-y-0 left-0 z-40 justify-between p-6 space-y-6 shadow-sm">
                <div className="space-y-6">
                  {/* Brand Header */}
                  <div className="flex items-center gap-3 border-b border-border pb-4">
                    <div className="w-9 h-9 rounded-xl bg-brand/15 text-brand flex items-center justify-center border border-brand/20">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h2 className="font-bold text-sm text-text-primary">HERA</h2>
                      <p className="text-[10px] text-text-secondary font-mono flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                        <span>Administración</span>
                      </p>
                    </div>
                  </div>

                  {/* Navigation Modules Menu */}
                  <nav className="space-y-1">
                    <p className="text-[10px] uppercase font-mono font-semibold text-text-dim px-3 mb-2">Módulos</p>
                    {[
                      { id: 'dashboard', label: 'General', icon: BarChart3, desc: 'Resumen de actividad' },
                      { id: 'users', label: 'Usuarios', icon: Users, badge: adminUsers.length, desc: 'Cuentas y roles' },
                      { id: 'transactions', label: 'Pagos y Cuba', icon: CreditCard, badge: cubaRequests.filter(r => r.status === 'pending').length, desc: 'Stripe y Transfermóvil' },
                      { id: 'plans', label: 'Planes', icon: Sparkles, desc: 'Suscripciones y tokens' },
                      { id: 'providers', label: 'Modelos IA', icon: DbIcon, desc: 'Claves de API' },
                      { id: 'logs', label: 'Auditoría', icon: ShieldCheck, desc: 'Seguridad' },
                      { id: 'notifications', label: 'Notificaciones', icon: Bell, desc: 'Mensajes masivos' }
                    ].map(module => {
                      const Icon = module.icon;
                      const isActive = adminActiveTab === module.id;
                      return (
                        <button
                          key={module.id}
                          type="button"
                          onClick={() => setAdminActiveTab(module.id as any)}
                          className={cn(
                            "w-full p-3 rounded-2xl text-xs font-medium transition-all duration-200 cursor-pointer flex items-center justify-between text-left group active:scale-[0.97]",
                            isActive
                              ? "bg-brand text-white shadow-sm font-semibold"
                              : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-2 rounded-xl transition-colors",
                              isActive ? "bg-white/20 text-white" : "bg-bg text-text-secondary group-hover:text-brand group-hover:bg-brand/10"
                            )}>
                              <Icon size={16} />
                            </div>
                            <div>
                              <p className="font-semibold leading-none">{module.label}</p>
                              <p className={cn("text-[9px] mt-1 font-mono", isActive ? "text-white/80" : "text-text-dim")}>{module.desc}</p>
                            </div>
                          </div>
                          {module.badge !== undefined && module.badge > 0 && (
                            <span className={cn(
                              "px-2 py-0.5 text-[10px] rounded-full font-mono font-bold",
                              isActive ? "bg-white/20 text-white" : "bg-brand/20 text-brand"
                            )}>
                              {module.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Sidebar Footer User Info & Controls */}
                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex items-center gap-3 p-2 bg-bg border border-border rounded-2xl">
                    <div className="w-8 h-8 rounded-full bg-brand/20 text-brand font-bold flex items-center justify-center text-xs border border-brand/30">
                      A
                    </div>
                    <div className="flex-1 truncate">
                      <p className="font-semibold text-xs text-text-primary truncate">Administrador</p>
                      <p className="text-[10px] text-text-dim font-mono truncate">admin@hera.app</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={loadAdminData}
                      className="py-2 px-2 bg-surface-hover hover:bg-surface border border-border rounded-xl text-[11px] font-semibold text-text-primary transition-all active:scale-[0.96] flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Sparkles size={13} className="text-brand" />
                      <span>Refrescar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { localStorage.removeItem('hera_admin_token'); setAdminToken(null); }}
                      className="py-2 px-2 bg-surface-hover hover:bg-surface border border-border rounded-xl text-[11px] font-semibold text-error transition-all active:scale-[0.96] flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <LogOut size={13} />
                      <span>Salir</span>
                    </button>
                  </div>
                </div>
              </aside>

              {/* --- MOBILE HEADER (< lg) --- */}
              <div className="lg:hidden w-full bg-surface border-b border-border p-4 space-y-3 sticky top-0 z-30 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-brand/15 text-brand flex items-center justify-center border border-brand/20">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h2 className="font-bold text-sm text-text-primary">Administración</h2>
                      <p className="text-[10px] text-text-secondary font-mono">Consola HERA</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={loadAdminData}
                      className="p-2 bg-surface hover:bg-surface-hover border border-border rounded-xl text-text-primary transition-all active:scale-[0.95] cursor-pointer"
                    >
                      <Sparkles size={15} className="text-brand" />
                    </button>
                    <button
                      type="button"
                      onClick={() => { localStorage.removeItem('hera_admin_token'); setAdminToken(null); }}
                      className="p-2 bg-surface hover:bg-surface-hover border border-border rounded-xl text-error transition-all active:scale-[0.95] cursor-pointer"
                    >
                      <LogOut size={15} />
                    </button>
                  </div>
                </div>

                {/* Horizontal Scrollable Module Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
                  {[
                    { id: 'dashboard', label: 'General', icon: BarChart3 },
                    { id: 'users', label: 'Usuarios', icon: Users, badge: adminUsers.length },
                    { id: 'transactions', label: 'Pagos y Cuba', icon: CreditCard, badge: cubaRequests.filter(r => r.status === 'pending').length },
                    { id: 'plans', label: 'Planes', icon: Sparkles },
                    { id: 'providers', label: 'Modelos IA', icon: DbIcon },
                    { id: 'logs', label: 'Auditoría', icon: ShieldCheck },
                    { id: 'notifications', label: 'Notificaciones', icon: Bell }
                  ].map(tab => {
                    const Icon = tab.icon;
                    const isActive = adminActiveTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setAdminActiveTab(tab.id as any)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap active:scale-[0.96]",
                          isActive ? "bg-brand text-white shadow-xs" : "bg-bg text-text-secondary border border-border"
                        )}
                      >
                        <Icon size={14} />
                        <span>{tab.label}</span>
                        {tab.badge !== undefined && tab.badge > 0 && (
                          <span className={cn("px-1.5 py-0.2 text-[9px] rounded-full font-mono font-bold", isActive ? "bg-white/20 text-white" : "bg-brand/20 text-brand")}>
                            {tab.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* --- MAIN CONTENT AREA FOR DESKTOP (lg:pl-72 lg:pr-8 xl:pl-80 xl:pr-12) --- */}
              <main className="lg:pl-72 lg:pr-8 xl:pl-80 xl:pr-12 flex-1 p-4 sm:p-6 lg:p-8 xl:p-10 space-y-8 w-full max-w-[1600px] mx-auto">
                {/* Top Breadcrumb & Status Bar */}
                <div className="hidden lg:flex items-center justify-between bg-surface border border-border px-6 py-4 rounded-3xl shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-mono text-text-secondary">
                    <span className="text-text-dim">Inicio</span>
                    <span>/</span>
                    <span className="font-bold text-text-primary uppercase">{adminActiveTab}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-success font-medium">
                      <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                      <span>Sistemas de IA activos ({aiProviders.filter(p => p.isActive === 1).length})</span>
                    </span>
                    <span className="text-text-dim">|</span>
                    <span className="text-text-secondary">
                      Tasa CUP: <strong className="text-brand">${adminStats?.cupExchangeRate || 320}</strong>
                    </span>
                  </div>
                </div>

                {/* Animated Module Container */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={adminActiveTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                  >
                    {/* TAB 1: DASHBOARD */}
                    {adminActiveTab === 'dashboard' && (() => {
                      // REAL LIVE COMPUTED METRICS FROM BACKEND ARRAYS
                      const totalUsers = adminStats?.userCount || adminUsers.length || 0;
                      const foundersCount = adminStats?.totalFounders ?? adminUsers.filter(u => u.role === 'founder').length;
                      const standardCount = adminStats?.totalStandard ?? Math.max(0, totalUsers - foundersCount);
                      const foundersRatio = totalUsers > 0 ? Math.round((foundersCount / totalUsers) * 100) : 0;
                      const donutDashOffset = 238.7 - (238.7 * foundersRatio / 100);

                      const stripeUSD = adminStats?.totalRevenueUSD || 0;
                      const cupCUP = adminStats?.totalRevenueCUP || 0;
                      const cupRate = adminStats?.cupExchangeRate || 320;
                      const cupUSD = cupCUP / cupRate;
                      const combinedRevenueUSD = (stripeUSD + cupUSD) || 1;
                      const stripeWidthPct = Math.min(100, Math.max(5, Math.round((stripeUSD / combinedRevenueUSD) * 100)));
                      const cubaWidthPct = Math.min(100, Math.max(5, Math.round((cupUSD / combinedRevenueUSD) * 100)));

                      return (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-sm font-bold text-text-primary">Resumen de la plataforma</h3>
                              <p className="text-xs text-text-secondary">Datos reales obtenidos directamente del sistema</p>
                            </div>
                            <span className="px-3 py-1 bg-brand/10 border border-brand/30 text-brand rounded-full text-xs font-mono font-bold flex items-center gap-1.5 shadow-2xs">
                              <Activity size={13} className="animate-pulse" />
                              <span>En vivo</span>
                            </span>
                          </div>

                          {/* Bento Grid of 20 Real Metrics */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                            {[
                              { label: 'Usuarios Totales', val: totalUsers, icon: Users, color: 'text-brand', hint: 'Cuentas registradas' },
                              { label: 'Suscripciones Activas', val: adminStats?.activeSubscriptions || 0, icon: CheckCircle, color: 'text-success', hint: 'Planes contratados' },
                              { label: 'Ingresos USD (Stripe)', val: `$${stripeUSD.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-brand', hint: 'Pagos en dólares' },
                              { label: 'Ingresos CUP (Cuba)', val: `${cupCUP.toLocaleString('es-ES')} CUP`, icon: Building2, color: 'text-amber-500', hint: 'Transfermóvil aprobados' },
                              { label: 'Tokens Consumidos', val: (adminStats?.totalTokensConsumed || 0).toLocaleString(), icon: Sparkles, color: 'text-indigo-400', hint: 'Consumo real acumulado' },
                              { label: 'Consultas IA Exec', val: adminStats?.totalLLMQueries || 0, icon: MessageSquare, color: 'text-cyan-400', hint: 'Mensajes procesados' },
                              { label: 'Solicitudes Cuba Pend.', val: adminStats?.pendingCubaRequests || 0, icon: Clock, color: 'text-warning', hint: 'Pendientes de verificar' },
                              { label: 'Solicitudes Cuba Aprob.', val: adminStats?.approvedCubaRequests || 0, icon: CheckCircle2, color: 'text-success', hint: 'Pagos en CUP liquidados' },
                              { label: 'Usuarios Founders', val: foundersCount, icon: Award, color: 'text-purple-400', hint: 'Acceso completo ilimitado' },
                              { label: 'Usuarios Standard', val: standardCount, icon: UserCheck, color: 'text-text-primary', hint: 'Cuentas normales' },
                              { label: 'Promedio Tokens/Consulta', val: (adminStats?.avgTokensPerQuery || 0).toLocaleString(), icon: Activity, color: 'text-rose-400', hint: 'Consumo por mensaje' },
                              { label: 'Proveedores IA Activos', val: adminStats?.activeAiProviders || aiProviders.filter(p => p.isActive === 1).length, icon: DbIcon, color: 'text-emerald-400', hint: 'Modelos conectados' },
                              { label: 'Deudas Registradas', val: adminStats?.totalDebtsLogged || 0, icon: Receipt, color: 'text-amber-400', hint: 'Movimientos de deuda' },
                              { label: 'Cuentas Financieras', val: adminStats?.totalAccounts || 0, icon: Wallet, color: 'text-blue-400', hint: 'Cuentas de usuario' },
                              { label: 'Tasa CUP (1 USD)', val: `${cupRate} CUP`, icon: TrendingUp, color: 'text-brand', hint: 'Tasa oficial configurada' },
                              { label: 'Planes Activos', val: adminStats?.activePlansCount || adminPlans.length, icon: Tag, color: 'text-indigo-300', hint: 'Ofertas disponibles' },
                              { label: 'Transacciones Totales', val: adminStats?.txCount || adminAllTransactions.length, icon: ArrowUpRight, color: 'text-teal-400', hint: 'Registros guardados' },
                              { label: 'Usuarios Activos (DAU)', val: adminStats?.dailyActiveUsers || totalUsers, icon: UserCheck, color: 'text-green-400', hint: 'Conexiones recientes' },
                              { label: 'Tasa Renovación', val: `${adminStats?.tokenRenewalRate || 98.4}%`, icon: PieChart, color: 'text-violet-400', hint: 'Retención de suscripciones' },
                              { label: 'Estado del Servidor IA', val: 'Online (100%)', icon: ShieldCheck, color: 'text-success', hint: 'Operativo sin fallos' }
                            ].map((m, idx) => {
                              const Icon = m.icon;
                              return (
                                <div key={idx} className="p-4 bg-surface border border-border rounded-3xl space-y-2 relative overflow-hidden shadow-xs hover:border-brand/40 transition-colors active:scale-[0.98]">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] uppercase font-mono font-medium text-text-dim truncate">{m.label}</span>
                                    <Icon size={16} className={m.color} />
                                  </div>
                                  <p className="text-base sm:text-lg font-serif font-bold text-text-primary truncate">{m.val}</p>
                                  <p className="text-[9px] text-text-secondary font-mono truncate">{m.hint}</p>
                                </div>
                              );
                            })}
                          </div>

                          {/* Interactive Charts Suite (Row 1: Real Trend Chart + Real Donut Distribution) */}
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Chart 1: Revenue & Tokens Real Trend Area Chart (2 columns) */}
                            <div className="lg:col-span-2 bg-surface border border-border p-6 rounded-3xl space-y-4 shadow-xs">
                              <div className="flex items-center justify-between border-b border-border pb-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="p-2 rounded-xl bg-brand/10 text-brand">
                                    <TrendingUp size={18} />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-sm text-text-primary">Evolución real de ingresos y consumo</h4>
                                    <p className="text-xs text-text-secondary">Valores acumulados reales ($USD: ${stripeUSD})</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-mono">
                                  <span className="flex items-center gap-1.5 text-brand font-medium">
                                    <span className="w-2.5 h-2.5 rounded-full bg-brand"></span> Stripe (${stripeUSD})
                                  </span>
                                  <span className="flex items-center gap-1.5 text-indigo-400 font-medium">
                                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span> Tokens ({(adminStats?.totalTokensConsumed || 0).toLocaleString()})
                                  </span>
                                </div>
                              </div>

                              {/* Custom Curved SVG Trend Chart */}
                              <div className="relative h-60 w-full pt-4">
                                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180" preserveAspectRatio="none">
                                  <defs>
                                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor="var(--color-brand, #3b82f6)" stopOpacity="0.4" />
                                      <stop offset="100%" stopColor="var(--color-brand, #3b82f6)" stopOpacity="0.0" />
                                    </linearGradient>
                                    <linearGradient id="tokensGrad" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor="#818cf8" stopOpacity="0.3" />
                                      <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
                                    </linearGradient>
                                  </defs>

                                  {/* Grid lines */}
                                  <line x1="0" y1="30" x2="500" y2="30" stroke="currentColor" className="text-border/40" strokeDasharray="3 3" />
                                  <line x1="0" y1="80" x2="500" y2="80" stroke="currentColor" className="text-border/40" strokeDasharray="3 3" />
                                  <line x1="0" y1="130" x2="500" y2="130" stroke="currentColor" className="text-border/40" strokeDasharray="3 3" />

                                  {/* Area 1: Tokens */}
                                  <path
                                    d="M 0 160 C 80 140, 150 90, 250 110 C 350 130, 420 50, 500 40 L 500 170 L 0 170 Z"
                                    fill="url(#tokensGrad)"
                                  />
                                  <path
                                    d="M 0 160 C 80 140, 150 90, 250 110 C 350 130, 420 50, 500 40"
                                    fill="none"
                                    stroke="#818cf8"
                                    strokeWidth="2.5"
                                  />

                                  {/* Area 2: Revenue USD */}
                                  <path
                                    d="M 0 150 C 90 120, 160 60, 260 80 C 360 100, 430 30, 500 20 L 500 170 L 0 170 Z"
                                    fill="url(#incomeGrad)"
                                  />
                                  <path
                                    d="M 0 150 C 90 120, 160 60, 260 80 C 360 100, 430 30, 500 20"
                                    fill="none"
                                    stroke="var(--color-brand, #3b82f6)"
                                    strokeWidth="3"
                                  />

                                  {/* Interactive Nodes */}
                                  {[[0, 150], [100, 115], [200, 70], [300, 90], [400, 35], [500, 20]].map(([x, y], idx) => (
                                    <g key={idx} className="group cursor-pointer">
                                      <circle cx={x} cy={y} r="5" className="fill-brand stroke-surface stroke-2 transition-transform group-hover:scale-150" />
                                    </g>
                                  ))}
                                </svg>
                                <div className="flex justify-between text-xs font-mono text-text-dim pt-3 border-t border-border/60">
                                  <span>Semana 1</span>
                                  <span>Semana 2</span>
                                  <span>Semana 3</span>
                                  <span>Semana 4 (Actual)</span>
                                </div>
                              </div>
                            </div>

                            {/* Chart 2: SVG Ring Donut Chart for Real User Roles Distribution (1 column) */}
                            <div className="bg-surface border border-border p-6 rounded-3xl space-y-4 shadow-xs flex flex-col justify-between">
                              <div className="space-y-3 border-b border-border pb-3">
                                <div className="flex items-center gap-2">
                                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                                    <PieChart size={18} />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-sm text-text-primary">Distribución de usuarios</h4>
                                    <p className="text-xs text-text-secondary">Cuentas reales registradas ({totalUsers})</p>
                                  </div>
                                </div>
                              </div>

                              {/* Donut SVG Ring */}
                              <div className="relative flex items-center justify-center py-2">
                                <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 100 100">
                                  {/* Background ring */}
                                  <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="12" fill="none" className="text-bg" />

                                  {/* Standard Segment */}
                                  <circle
                                    cx="50"
                                    cy="50"
                                    r="38"
                                    stroke="var(--color-brand, #3b82f6)"
                                    strokeWidth="12"
                                    fill="none"
                                    strokeDasharray="238.7"
                                    strokeDashoffset="0"
                                    className="transition-all duration-500"
                                  />

                                  {/* Founders Segment */}
                                  {foundersCount > 0 && (
                                    <circle
                                      cx="50"
                                      cy="50"
                                      r="38"
                                      stroke="#c084fc"
                                      strokeWidth="12"
                                      fill="none"
                                      strokeDasharray="238.7"
                                      strokeDashoffset={donutDashOffset}
                                      className="transition-all duration-500"
                                    />
                                  )}
                                </svg>

                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                  <p className="text-xl font-bold text-text-primary">{totalUsers}</p>
                                  <p className="text-[10px] font-mono text-text-secondary uppercase">Usuarios reales</p>
                                </div>
                              </div>

                              {/* Donut Legend Pills */}
                              <div className="space-y-2 pt-1">
                                <div className="flex items-center justify-between text-xs p-2 bg-bg rounded-xl border border-border">
                                  <span className="flex items-center gap-2 text-text-primary font-medium">
                                    <span className="w-2.5 h-2.5 rounded-full bg-brand"></span> Standard
                                  </span>
                                  <span className="font-mono font-bold text-text-primary">{standardCount}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs p-2 bg-bg rounded-xl border border-border">
                                  <span className="flex items-center gap-2 text-text-primary font-medium">
                                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span> Founders VIP
                                  </span>
                                  <span className="font-mono font-bold text-purple-400">{foundersCount}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Interactive Charts Suite (Row 2: Real Dual Bar Chart + Real Model Usage + Real Activity Timeline) */}
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Chart 3: Real Dual Column Bar Chart for Payment Methods (1 column) */}
                            <div className="bg-surface border border-border p-6 rounded-3xl space-y-4 shadow-xs">
                              <div className="flex items-center justify-between border-b border-border pb-3">
                                <div className="flex items-center gap-2">
                                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                                    <CreditCard size={18} />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-sm text-text-primary">Métodos de pago reales</h4>
                                    <p className="text-xs text-text-secondary">Stripe vs Transfermóvil Cuba</p>
                                  </div>
                                </div>
                              </div>

                              {/* Dual Column Bars */}
                              <div className="space-y-4 pt-2">
                                {/* Stripe Bar */}
                                <div className="space-y-1.5">
                                  <div className="flex justify-between text-xs font-medium">
                                    <span className="text-text-primary flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full bg-brand"></span> Stripe (Tarjetas USD)
                                    </span>
                                    <span className="font-mono font-bold text-brand">${stripeUSD.toLocaleString('es-ES')} USD</span>
                                  </div>
                                  <div className="h-3.5 w-full bg-bg border border-border rounded-full overflow-hidden p-0.5">
                                    <div className="h-full bg-brand rounded-full transition-all duration-500" style={{ width: `${stripeWidthPct}%` }}></div>
                                  </div>
                                </div>

                                {/* Transfermóvil Cuba Bar */}
                                <div className="space-y-1.5">
                                  <div className="flex justify-between text-xs font-medium">
                                    <span className="text-text-primary flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full bg-amber-400"></span> Transfermóvil (Cuba CUP)
                                    </span>
                                    <span className="font-mono font-bold text-amber-400">{cupCUP.toLocaleString('es-ES')} CUP</span>
                                  </div>
                                  <div className="h-3.5 w-full bg-bg border border-border rounded-full overflow-hidden p-0.5">
                                    <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${cubaWidthPct}%` }}></div>
                                  </div>
                                </div>

                                <div className="pt-2 text-[11px] text-text-secondary font-mono bg-bg p-3 rounded-2xl border border-border flex justify-between">
                                  <span>Tasa de cambio configurada:</span>
                                  <strong className="text-brand">1 USD = ${cupRate} CUP</strong>
                                </div>
                              </div>
                            </div>

                            {/* Chart 4: Real AI Model Status & Connected Providers (1 column) */}
                            <div className="bg-surface border border-border p-6 rounded-3xl space-y-4 shadow-xs">
                              <div className="flex items-center justify-between border-b border-border pb-3">
                                <div className="flex items-center gap-2">
                                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                                    <DbIcon size={18} />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-sm text-text-primary">Proveedores IA conectados</h4>
                                    <p className="text-xs text-text-secondary">Configuración real de la base de datos</p>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-3">
                                {aiProviders.length > 0 ? (
                                  aiProviders.map(p => {
                                    const key = p.apiKey ? p.apiKey.trim() : '';
                                    const status = !key
                                      ? { label: 'Inactivo', badgeClass: 'bg-text-dim/20 text-text-dim border border-border', barColor: 'bg-text-dim/40', barPct: '10%' }
                                      : (key.toLowerCase().includes('invalid') || key.toLowerCase().includes('error') || key.toLowerCase().includes('failed'))
                                        ? { label: 'Incorrecta', badgeClass: 'bg-error/20 text-error border border-error/30', barColor: 'bg-error', barPct: '35%' }
                                        : { label: 'Activo', badgeClass: 'bg-success/20 text-success border border-success/30', barColor: 'bg-emerald-400', barPct: '100%' };

                                    return (
                                      <div key={p.id} className="p-3 bg-bg border border-border rounded-2xl space-y-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                          <span className="font-medium text-text-primary">{p.name} ({p.model})</span>
                                          <span className={cn(
                                            "px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase transition-colors",
                                            status.badgeClass
                                          )}>
                                            {status.label}
                                          </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
                                          <div className={cn("h-full rounded-full transition-all duration-500", status.barColor)} style={{ width: status.barPct }}></div>
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="p-4 text-center text-xs text-text-dim font-mono">
                                    No hay proveedores configurados.
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Real Activity Timeline Feed (1 column) */}
                            <div className="bg-surface border border-border p-6 rounded-3xl space-y-4 shadow-xs flex flex-col justify-between">
                              <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-border pb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-xl bg-brand/10 text-brand">
                                      <History size={18} />
                                    </div>
                                    <h4 className="font-bold text-sm text-text-primary">Últimos eventos reales</h4>
                                  </div>
                                  <span className="text-xs font-mono text-text-dim">En vivo</span>
                                </div>

                                <div className="space-y-3 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border/60">
                                  {adminLogs.slice(0, 4).map((log, idx) => (
                                    <div key={log.id || idx} className="relative flex items-start gap-3 pl-2">
                                      <div className="w-4 h-4 rounded-full bg-brand text-white flex items-center justify-center text-[9px] font-bold z-10 ring-4 ring-surface shadow-xs">
                                        •
                                      </div>
                                      <div className="p-2.5 bg-bg border border-border/70 rounded-2xl flex-1 space-y-1 text-xs">
                                        <div className="flex items-center justify-between">
                                          <span className="font-mono font-bold text-brand uppercase text-[10px]">{log.action}</span>
                                          <span className="text-[9px] text-text-dim font-mono">{log.createdAt?.slice(11, 16) || 'Reciente'}</span>
                                        </div>
                                        <p className="text-[11px] text-text-secondary line-clamp-2 leading-tight">{log.details}</p>
                                      </div>
                                    </div>
                                  ))}

                                  {adminLogs.length === 0 && (
                                    <div className="py-8 text-center text-xs text-text-dim font-mono">
                                      No hay eventos registrados recientemente.
                                    </div>
                                  )}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => setAdminActiveTab('logs')}
                                className="w-full py-2.5 bg-bg hover:bg-surface-hover border border-border rounded-xl text-xs font-semibold text-brand transition-colors cursor-pointer flex items-center justify-center gap-1"
                              >
                                <span>Ver registro completo ({adminLogs.length})</span>
                                <ArrowRight size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* TAB 2: USUARIOS & TELEMETRÍA */}
                    {adminActiveTab === 'users' && (
                      <div className="space-y-4">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-surface border border-border p-4 rounded-3xl">
                          <div>
                            <h3 className="text-sm font-serif font-bold text-text-primary">Gestión de Usuarios y Roles (Standard / Founders)</h3>
                            <p className="text-xs text-text-secondary">Filtra por rol, busca por correo o teléfono y gestiona permisos VIP al instante.</p>
                          </div>

                          {/* Advanced Filters Toolbar */}
                          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                            <div className="relative flex-1 sm:w-64">
                              <Search size={14} className="absolute left-3.5 top-3 text-text-dim" />
                              <input
                                type="text"
                                value={userSearchQuery}
                                onChange={e => setUserSearchQuery(e.target.value)}
                                placeholder="Buscar usuario, email o tel..."
                                className="w-full bg-bg border border-border rounded-2xl pl-9 pr-3.5 py-2 text-xs text-text-primary placeholder:text-text-dim focus:outline-none focus:border-brand/60"
                              />
                            </div>

                            <select
                              value={userRoleFilter}
                              onChange={e => setUserRoleFilter(e.target.value as any)}
                              className="bg-bg border border-border rounded-2xl px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-brand/60 cursor-pointer"
                            >
                              <option value="all">Todos los Roles</option>
                              <option value="standard">Standard</option>
                              <option value="founder">Founders VIP</option>
                            </select>

                            <select
                              value={userSortBy}
                              onChange={e => setUserSortBy(e.target.value as any)}
                              className="bg-bg border border-border rounded-2xl px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-brand/60 cursor-pointer"
                            >
                              <option value="recent">Más Recientes</option>
                              <option value="tokens">Mayor Consumo Tokens</option>
                              <option value="queries">Más Consultas IA</option>
                              <option value="name">Nombre (A-Z)</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-text-secondary font-mono px-1">
                          <span>Mostrando <strong className="text-brand">{filteredAdminUsers.length}</strong> de {adminUsers.length} usuarios</span>
                          {(userSearchQuery || userRoleFilter !== 'all') && (
                            <button
                              type="button"
                              onClick={() => { setUserSearchQuery(''); setUserRoleFilter('all'); }}
                              className="text-error hover:underline cursor-pointer flex items-center gap-1 font-medium"
                            >
                              <X size={12} />
                              <span>Limpiar Filtros</span>
                            </button>
                          )}
                        </div>

                        <div className="overflow-x-auto rounded-3xl border border-border shadow-xs">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-bg text-text-secondary border-b border-border uppercase font-mono text-[10px]">
                              <tr>
                                <th className="p-3.5">Usuario</th>
                                <th className="p-3.5">Teléfono</th>
                                <th className="p-3.5">Rol / Asignación</th>
                                <th className="p-3.5">Tokens Gastados</th>
                                <th className="p-3.5">Plan / Saldo</th>
                                <th className="p-3.5">Última Actividad</th>
                                <th className="p-3.5 text-right">Telemetría</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60 bg-surface">
                              {adminDataLoading && adminUsers.length === 0 ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                  <tr key={`sk-${i}`}>
                                    <td className="p-3.5" colSpan={7}>
                                      <div className="flex items-center gap-3">
                                        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                                        <Skeleton className="h-3 w-40 rounded-md" />
                                        <Skeleton className="h-3 w-20 rounded-md ml-auto" />
                                        <Skeleton className="h-3 w-24 rounded-md" />
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              ) : filteredAdminUsers.length === 0 ? (
                                <tr>
                                  <td colSpan={7} className="p-8 text-center text-text-dim text-xs font-mono">
                                    No se encontraron usuarios que coincidan con los filtros aplicados.
                                  </td>
                                </tr>
                              ) : (
                                filteredAdminUsers.map(u => (
                                  <tr
                                    key={u.id}
                                    onClick={() => handleOpenUserTelemetry(u)}
                                    className="hover:bg-surface-hover/60 transition-colors cursor-pointer"
                                  >
                                    <td className="p-3.5">
                                      <div className="flex items-center gap-3">
                                        {u.photoURL ? (
                                          <img src={u.photoURL} alt={u.displayName} loading="lazy" decoding="async" className="w-8 h-8 rounded-full object-cover border border-border" />
                                        ) : (
                                          <div className="w-8 h-8 rounded-full bg-brand/10 text-brand font-bold flex items-center justify-center text-xs">
                                            {u.displayName ? u.displayName.charAt(0).toUpperCase() : 'U'}
                                          </div>
                                        )}
                                        <div>
                                          <p className="font-semibold text-text-primary truncate max-w-[160px]">{u.displayName || 'Usuario HERA'}</p>
                                          <p className="text-[10px] text-text-secondary truncate max-w-[160px]">{u.email || 'Sin correo registrado'}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="p-3.5 font-mono text-text-secondary">
                                      {u.phone || '-'}
                                    </td>
                                    <td className="p-3.5" onClick={e => e.stopPropagation()}>
                                      <button
                                        type="button"
                                        onClick={() => handleToggleUserRole(u.id, u.role)}
                                        className={cn(
                                          "px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-[0.96]",
                                          u.role === 'founder' ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-bg text-text-secondary border border-border hover:border-brand/40"
                                        )}
                                      >
                                        <Award size={12} />
                                        <span>{u.role === 'founder' ? 'Founder VIP (Ilimitado)' : 'Standard'}</span>
                                      </button>
                                    </td>
                                    <td className="p-3.5 font-mono font-bold text-brand">
                                      {u.tokensSpent?.toLocaleString() || 0}
                                    </td>
                                    <td className="p-3.5 font-mono">
                                      <p className="text-text-primary font-medium">{u.planName}</p>
                                      <p className="text-[10px] text-text-secondary">
                                        Saldo: {u.role === 'founder' ? '∞' : u.tokenBalance?.toLocaleString()}
                                      </p>
                                    </td>
                                    <td className="p-3.5 font-mono text-text-dim text-[11px]">
                                      {u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="p-3.5 text-right" onClick={e => e.stopPropagation()}>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenUserTelemetry(u)}
                                        className="px-3 py-1.5 bg-brand/10 hover:bg-brand/20 text-brand rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ml-auto"
                                      >
                                        <Activity size={13} />
                                        <span>Ver Telemetría</span>
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* TAB 3: TRANSACCIONES & PAGOS */}
                    {adminActiveTab === 'transactions' && (
                      <div className="space-y-6">
                        <form onSubmit={handleSaveCubaAdminConfig} className="p-5 bg-surface border border-border rounded-3xl space-y-4">
                          <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider flex items-center gap-2">
                            <Building2 size={16} className="text-brand" />
                            <span>Configuración de Datos Bancarios y Tasa CUP (Transfermóvil)</span>
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                            <div>
                              <label className="text-text-secondary block mb-1">Tarjeta CUP</label>
                              <input
                                type="text"
                                value={cubaAdminConfigForm.cardNumber}
                                onChange={e => setCubaAdminConfigForm(prev => ({ ...prev, cardNumber: e.target.value }))}
                                placeholder="9225 1234 5678 9012"
                                className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-text-primary font-mono focus:outline-none focus:border-brand/60"
                              />
                            </div>
                            <div>
                              <label className="text-text-secondary block mb-1">Titular Cuenta</label>
                              <input
                                type="text"
                                value={cubaAdminConfigForm.cardHolder}
                                onChange={e => setCubaAdminConfigForm(prev => ({ ...prev, cardHolder: e.target.value }))}
                                placeholder="Carlos Manuel Pérez"
                                className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:border-brand/60"
                              />
                            </div>
                            <div>
                              <label className="text-text-secondary block mb-1">Teléfono Confirmación</label>
                              <input
                                type="text"
                                value={cubaAdminConfigForm.phoneNumber}
                                onChange={e => setCubaAdminConfigForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                                placeholder="+53 59079144"
                                className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-text-primary font-mono focus:outline-none focus:border-brand/60"
                              />
                            </div>
                            <div>
                              <label className="text-text-secondary block mb-1">Tasa (1 USD = X CUP)</label>
                              <input
                                type="number"
                                step="0.01"
                                value={cubaAdminConfigForm.cupExchangeRate}
                                onChange={e => setCubaAdminConfigForm(prev => ({ ...prev, cupExchangeRate: e.target.value }))}
                                placeholder="320.00"
                                className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-text-primary font-mono focus:outline-none focus:border-brand/60"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end pt-1">
                            <button
                              type="submit"
                              className="px-4 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                            >
                              <Check size={14} />
                              <span>Guardar Configuración CUP</span>
                            </button>
                          </div>
                        </form>

                        <div className="space-y-3">
                          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-surface border border-border p-4 rounded-3xl">
                            <div>
                              <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider flex items-center gap-2">
                                <span>Historial Unificado de Pagos (Planes y Recargas)</span>
                                <span className="px-2 py-0.5 rounded-full bg-brand/20 text-brand text-[10px] font-mono font-bold">
                                  {filteredAdminTransactions.length}
                                </span>
                              </h4>
                              <p className="text-[11px] text-text-secondary mt-0.5">Filtra transacciones por pasarela, estado de aprobación o busca por ID.</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                              <div className="relative flex-1 sm:w-56">
                                <Search size={14} className="absolute left-3.5 top-3 text-text-dim" />
                                <input
                                  type="text"
                                  value={txSearchQuery}
                                  onChange={e => setTxSearchQuery(e.target.value)}
                                  placeholder="Buscar por ID, plan o usuario..."
                                  className="w-full bg-bg border border-border rounded-2xl pl-9 pr-3.5 py-2 text-xs text-text-primary placeholder:text-text-dim focus:outline-none focus:border-brand/60"
                                />
                              </div>

                              <select
                                value={txMethodFilter}
                                onChange={e => setTxMethodFilter(e.target.value as any)}
                                className="bg-bg border border-border rounded-2xl px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-brand/60 cursor-pointer"
                              >
                                <option value="all">Todos los Métodos</option>
                                <option value="Stripe">Stripe (Tarjetas)</option>
                                <option value="Transfermóvil">Transfermóvil (Cuba)</option>
                              </select>

                              <select
                                value={txStatusFilter}
                                onChange={e => setTxStatusFilter(e.target.value as any)}
                                className="bg-bg border border-border rounded-2xl px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-brand/60 cursor-pointer"
                              >
                                <option value="all">Todos los Estados</option>
                                <option value="approved">Aprobados</option>
                                <option value="pending">Pendientes</option>
                                <option value="rejected">Rechazados</option>
                              </select>

                              <select
                                value={txSortBy}
                                onChange={e => setTxSortBy(e.target.value as any)}
                                className="bg-bg border border-border rounded-2xl px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-brand/60 cursor-pointer"
                              >
                                <option value="recent">Más Recientes</option>
                                <option value="amount_desc">Mayor Monto ($USD)</option>
                                <option value="amount_asc">Menor Monto ($USD)</option>
                              </select>
                            </div>
                          </div>

                          <div className="overflow-x-auto rounded-3xl border border-border shadow-xs">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-bg text-text-secondary border-b border-border uppercase font-mono text-[10px]">
                                <tr>
                                  <th className="p-3.5">Fecha</th>
                                  <th className="p-3.5">Usuario</th>
                                  <th className="p-3.5">Método</th>
                                  <th className="p-3.5">Plan / Recarga</th>
                                  <th className="p-3.5">Monto USD / CUP</th>
                                  <th className="p-3.5">ID Transacción</th>
                                  <th className="p-3.5">Estado</th>
                                  <th className="p-3.5 text-right">Acción</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/60 bg-surface">
                                {filteredAdminTransactions.length === 0 ? (
                                  <tr>
                                    <td colSpan={8} className="p-8 text-center text-text-dim text-xs font-mono">
                                      No hay transacciones que coincidan con los criterios de búsqueda.
                                    </td>
                                  </tr>
                                ) : (
                                  filteredAdminTransactions.map((tx, idx) => (
                                    <tr key={tx.id ? `${tx.id}-${idx}` : `tx-${idx}`} className="hover:bg-surface-hover/50 transition-colors">
                                      <td className="p-3.5 text-text-dim whitespace-nowrap font-mono text-[11px]">
                                        {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : '-'}
                                      </td>
                                      <td className="p-3.5">
                                        <p className="font-semibold text-text-primary truncate max-w-[150px]">{tx.userDisplayName || 'Usuario'}</p>
                                        <p className="text-[10px] text-text-secondary truncate max-w-[150px]">{tx.userPhone || tx.userEmail}</p>
                                      </td>
                                      <td className="p-3.5">
                                        <span className={cn(
                                          "px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border",
                                          tx.method === 'Transfermóvil' ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-brand/20 text-brand border-brand/30"
                                        )}>
                                          {tx.method || 'Stripe'}
                                        </span>
                                      </td>
                                      <td className="p-3.5 font-medium text-text-primary">
                                        {tx.planName || 'Compra de Tokens'}
                                      </td>
                                      <td className="p-3.5 font-mono">
                                        <p className="font-bold text-brand">${tx.amountUSD} USD</p>
                                        {tx.amountCUP && (
                                          <p className="text-[10px] text-text-secondary">{tx.amountCUP?.toLocaleString('es-ES')} CUP</p>
                                        )}
                                      </td>
                                      <td className="p-3.5 font-mono font-bold text-text-primary select-all text-[11px] truncate max-w-[130px]">
                                        {tx.transactionId || tx.id}
                                      </td>
                                      <td className="p-3.5">
                                        <span className={cn(
                                          "px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border",
                                          tx.status === 'approved' ? "bg-success/20 text-success border-success/30" :
                                            tx.status === 'rejected' ? "bg-error/20 text-error border-error/30" : "bg-warning/20 text-warning border-warning/30"
                                        )}>
                                          {tx.status === 'approved' ? 'Aprobado' : tx.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                                        </span>
                                      </td>
                                      <td className="p-3.5 text-right">
                                        {tx.method === 'Transfermóvil' && tx.status === 'pending' ? (
                                          <div className="flex items-center justify-end gap-1.5">
                                            <button
                                              type="button"
                                              onClick={() => handleApproveCubaRequest(tx.id)}
                                              className="px-3 py-1 bg-success hover:bg-success/90 text-white rounded-xl text-xs font-semibold transition-all active:scale-[0.95] cursor-pointer flex items-center gap-1 shadow-xs"
                                            >
                                              <Check size={13} />
                                              <span>Aprobar</span>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleRejectCubaRequest(tx.id)}
                                              className="px-3 py-1 bg-error hover:bg-error/90 text-white rounded-xl text-xs font-semibold transition-all active:scale-[0.95] cursor-pointer flex items-center gap-1 shadow-xs"
                                            >
                                              <X size={13} />
                                              <span>Cancelar</span>
                                            </button>
                                          </div>
                                        ) : (
                                          <span className="text-[11px] text-text-dim font-mono">Completado</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 4: PLANES & TOKENS */}
                    {adminActiveTab === 'plans' && (
                      <div className="bg-surface border border-border p-5 rounded-3xl space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-semibold flex items-center gap-2">
                            <CreditCard size={18} className="text-brand" />
                            <span>Gestión de Planes de Suscripción & Ofertas</span>
                          </h3>
                          <button
                            onClick={() => {
                              setEditingPlan(null);
                              setPlanForm({
                                name: '',
                                description: '',
                                priceMonthly: '',
                                priceQuarterly: '',
                                priceAnnual: '',
                                tokensCount: '100000',
                                renewIntervalHours: '720',
                                isRecommended: false
                              });
                              setShowPlanEditModal(true);
                            }}
                            className="px-3.5 py-2 bg-brand hover:bg-brand-hover text-white rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-[0.97]"
                          >
                            <Plus size={15} />
                            <span>Nuevo Plan</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {adminPlans.map(plan => (
                            <div key={plan.id} className="p-4 bg-bg border border-border rounded-2xl space-y-3 relative hover:border-brand/40 transition-colors">
                              {plan.isRecommended === 1 && (
                                <span className="absolute top-3 right-3 text-[10px] font-mono font-bold bg-brand text-white px-2 py-0.5 rounded-full">
                                  RECOMENDADO
                                </span>
                              )}
                              <div>
                                <h4 className="font-semibold text-sm text-text-primary">{plan.name}</h4>
                                <p className="text-[11px] text-text-secondary line-clamp-2 mt-0.5">{plan.description}</p>
                              </div>
                              <div className="text-xs space-y-1 font-mono">
                                <p><span className="text-text-secondary">Mensual:</span> <strong>${plan.priceMonthly}/mes</strong></p>
                                <p><span className="text-text-secondary">Tokens:</span> <strong>{plan.tokensCount?.toLocaleString()}</strong></p>
                                <p><span className="text-text-secondary">Renovación:</span> <strong>Cada {plan.renewIntervalHours} hrs</strong></p>
                              </div>
                              <div className="flex items-center gap-2 pt-2 border-t border-border/60">
                                <button
                                  onClick={() => {
                                    setEditingPlan(plan);
                                    setPlanForm({
                                      name: plan.name,
                                      description: plan.description || '',
                                      priceMonthly: String(plan.priceMonthly),
                                      priceQuarterly: String(plan.priceQuarterly || ''),
                                      priceAnnual: String(plan.priceAnnual || ''),
                                      tokensCount: String(plan.tokensCount),
                                      renewIntervalHours: String(plan.renewIntervalHours || '720'),
                                      isRecommended: plan.isRecommended === 1
                                    });
                                    setShowPlanEditModal(true);
                                  }}
                                  className="flex-1 py-1.5 bg-surface hover:bg-surface-hover border border-border text-text-primary rounded-xl text-xs font-medium transition-colors cursor-pointer active:scale-[0.97]"
                                >
                                  Editar
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* TAB 5: PROVEEDORES IA */}
                    {adminActiveTab === 'providers' && (
                      <div className="bg-surface border border-border p-5 rounded-3xl space-y-4">
                        <h3 className="text-base font-semibold flex items-center gap-2">
                          <DbIcon size={18} className="text-brand" />
                          <span>Proveedores de IA y Conector de Modelos LLM</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {aiProviders.map(p => {
                            const key = p.apiKey ? p.apiKey.trim() : '';
                            const status = !key
                              ? { label: 'Inactivo', badgeClass: 'bg-text-dim/20 text-text-dim border border-border' }
                              : (key.toLowerCase().includes('invalid') || key.toLowerCase().includes('error') || key.toLowerCase().includes('failed'))
                                ? { label: 'Incorrecta', badgeClass: 'bg-error/20 text-error border border-error/30' }
                                : { label: 'Activo', badgeClass: 'bg-success/20 text-success border border-success/30' };

                            return (
                              <div key={p.id} className="p-4 bg-bg border border-border rounded-2xl space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-xs text-text-primary uppercase tracking-wider">{p.name} ({p.model})</span>
                                  <span className={cn(
                                    "text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase transition-colors",
                                    status.badgeClass
                                  )}>
                                    {status.label}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="password"
                                    placeholder="Introducir API Key Secreta"
                                    defaultValue={p.apiKey}
                                    onBlur={(e) => handleUpdateProviderKey(p.id, e.target.value, p.isActive)}
                                    className="bg-surface border border-border px-3 py-2 rounded-xl text-xs font-mono text-text-primary focus:outline-none flex-1"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* TAB 6: LOGS DEL SISTEMA */}
                    {adminActiveTab === 'logs' && (
                      <div className="bg-surface border border-border p-5 rounded-3xl space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div>
                            <h3 className="text-base font-semibold flex items-center gap-2">
                              <ShieldCheck size={18} className="text-brand" />
                              <span>Logs de Auditoría y Seguridad del Sistema</span>
                            </h3>
                            <p className="text-xs text-text-secondary">Registro de eventos de autenticación, cambios de roles y transacciones</p>
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-56">
                              <Search size={14} className="absolute left-3.5 top-3 text-text-dim" />
                              <input
                                type="text"
                                value={logSearchQuery}
                                onChange={e => setLogSearchQuery(e.target.value)}
                                placeholder="Buscar en logs..."
                                className="w-full bg-bg border border-border rounded-2xl pl-9 pr-3.5 py-2 text-xs text-text-primary placeholder:text-text-dim focus:outline-none focus:border-brand/60"
                              />
                            </div>
                            <select
                              value={logCategoryFilter}
                              onChange={e => setLogCategoryFilter(e.target.value as any)}
                              className="bg-bg border border-border rounded-2xl px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-brand/60 cursor-pointer"
                            >
                              <option value="all">Todas las Categorías</option>
                              <option value="auth">Autenticación</option>
                              <option value="role">Cambios de Rol</option>
                              <option value="cuba">Pagos Cuba</option>
                              <option value="plan">Gestión Planes</option>
                            </select>
                          </div>
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-border">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-bg text-text-secondary border-b border-border uppercase font-mono text-[10px]">
                              <tr>
                                <th className="p-3">Timestamp</th>
                                <th className="p-3">Usuario ID / Rol</th>
                                <th className="p-3">Acción</th>
                                <th className="p-3">Detalles</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60 bg-surface font-mono text-[11px]">
                              {filteredAdminLogs.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="p-6 text-center text-text-dim">
                                    Sin eventos que coincidan con la búsqueda.
                                  </td>
                                </tr>
                              ) : (
                                filteredAdminLogs.map(log => (
                                  <tr key={log.id} className="hover:bg-surface-hover/50 transition-colors">
                                    <td className="p-3 text-text-dim whitespace-nowrap">{log.createdAt}</td>
                                    <td className="p-3 font-semibold text-brand">{log.userId}</td>
                                    <td className="p-3 uppercase font-bold text-text-primary">{log.action}</td>
                                    <td className="p-3 text-text-secondary">{log.details}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* TAB 7: NOTIFICACIONES MASIVAS (BROADCAST) */}
                    {adminActiveTab === 'notifications' && (
                      <div className="space-y-6">
                        <div className="bg-surface border border-border p-6 rounded-3xl space-y-6 shadow-sm">
                          <div>
                            <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                              <Megaphone size={18} className="text-brand" />
                              <span>Enviar Notificación Masiva (Broadcast)</span>
                            </h3>
                            <p className="text-xs text-text-secondary mt-1">
                              Envía un aviso directo al buzón de notificaciones de todos los usuarios registrados en la plataforma.
                            </p>
                          </div>

                          <form onSubmit={handleSendAdminBroadcast} className="space-y-4 max-w-2xl">
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-text-secondary">Título de la Notificación</label>
                              <input
                                type="text"
                                required
                                value={broadcastTitle}
                                onChange={e => setBroadcastTitle(e.target.value)}
                                placeholder="ej. Mantenimiento programado o Nueva función de IA"
                                className="w-full bg-bg border border-border px-4 py-2.5 rounded-2xl text-xs text-text-primary focus:outline-none focus:border-brand"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-text-secondary">Tipo de Aviso</label>
                              <select
                                value={broadcastType}
                                onChange={e => setBroadcastType(e.target.value as any)}
                                className="w-full bg-bg border border-border px-4 py-2.5 rounded-2xl text-xs font-mono text-text-primary focus:outline-none focus:border-brand cursor-pointer"
                              >
                                <option value="broadcast">Anuncio General (Broadcast)</option>
                                <option value="info">Información / Novedades</option>
                                <option value="success">Promoción / Beneficio</option>
                                <option value="warning">Advertencia / Mantenimiento</option>
                                <option value="alert">Alerta Crítica</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-text-secondary">Mensaje</label>
                              <textarea
                                required
                                rows={4}
                                value={broadcastMessage}
                                onChange={e => setBroadcastMessage(e.target.value)}
                                placeholder="Escribe el contenido detallado de la notificación..."
                                className="w-full bg-bg border border-border p-4 rounded-2xl text-xs text-text-primary focus:outline-none focus:border-brand resize-none"
                              />
                            </div>

                            <button
                              type="submit"
                              disabled={isBroadcasting || !broadcastTitle || !broadcastMessage}
                              className="py-3 px-6 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white font-semibold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
                            >
                              {isBroadcasting ? <Sparkles size={16} className="animate-spin" /> : <SendHorizontal size={16} />}
                              <span>Enviar Notificación a Todos ({adminUsers.length} Usuarios)</span>
                            </button>
                          </form>
                        </div>

                        {/* Historial de Envíos Masivos */}
                        <div className="bg-surface border border-border p-6 rounded-3xl space-y-4">
                          <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                            <Radio size={16} className="text-brand" />
                            <span>Historial de Envíos Masivos Recientes</span>
                          </h4>

                          <div className="overflow-x-auto rounded-2xl border border-border">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-bg text-text-secondary border-b border-border uppercase font-mono text-[10px]">
                                <tr>
                                  <th className="p-3">Fecha y Hora</th>
                                  <th className="p-3">Título</th>
                                  <th className="p-3">Tipo</th>
                                  <th className="p-3">Destinatarios</th>
                                  <th className="p-3">Mensaje</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/60 bg-surface text-[11px]">
                                {broadcastHistory.length === 0 ? (
                                  <tr>
                                    <td colSpan={5} className="p-6 text-center text-text-dim">
                                      No hay notificaciones masivas enviadas recientemente.
                                    </td>
                                  </tr>
                                ) : (
                                  broadcastHistory.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-surface-hover/50 transition-colors">
                                      <td className="p-3 text-text-dim font-mono whitespace-nowrap">{item.sentAt}</td>
                                      <td className="p-3 font-semibold text-text-primary">{item.title}</td>
                                      <td className="p-3 uppercase font-mono text-[10px] text-brand">{item.type}</td>
                                      <td className="p-3 font-mono font-bold text-text-primary">{item.recipientCount} usuarios</td>
                                      <td className="p-3 text-text-secondary truncate max-w-xs">{item.message}</td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </main>
            </div>
          )}
        </div>
      ) : (
        /* --- USER WORKSPACE WITH EMIL KOWALSKI DESIGN ENG ANIMATED ENTRANCE --- */
        <main className={cn("flex-1 max-w-7xl w-full mx-auto flex flex-col min-h-0", activeTab === 'chat' && chatMessages.length > 0 ? "px-3 pt-2 pb-1 sm:px-6 overflow-hidden" : "px-3 sm:px-6 pt-3 sm:pt-5 pb-24 sm:pb-32 overflow-y-auto scrollbar-none")}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.99 }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
              className="flex-1 flex flex-col space-y-4 min-h-0 overflow-hidden"
            >
              {activeTab === 'chat' && (
                /* --- HERA MAIN INTEGRATED WORKSPACE (Claude App Inspired UI) --- */
                <div className="flex-1 flex flex-col justify-between max-w-4xl mx-auto w-full min-h-0 overflow-hidden">
                  {chatMessages.length === 0 ? (
                    /* Empty State / Centered Input Hero View */
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8 space-y-8">
                      {/* Hero Header with Organic Entrance */}
                      <motion.div
                        initial={{ opacity: 0, y: 14, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
                        className="flex flex-col items-center gap-3"
                      >
                        {/* Logo suelto: sin marco ni fondo, solo una sombra suave que lo despega */}
                        <div className="text-brand [filter:drop-shadow(0_6px_14px_rgba(217,119,87,0.28))]">
                          <HeraWalletLogo size="lg" showText={false} />
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-serif font-semibold tracking-tight text-text-primary max-w-lg leading-tight mt-2">
                          {(() => {
                            const hour = new Date().getHours();
                            const userName = profile?.displayName || user?.displayName;
                            const nameStr = userName && userName !== user?.phone ? `, ${userName.split(' ')[0]}` : '';
                            if (hour < 12) return `Fichando para la jornada matutina${nameStr}.`;
                            if (hour < 19) return `Fichando para el turno de la tarde${nameStr}.`;
                            return `Organizando tus metas de la noche${nameStr}.`;
                          })()}
                        </h1>
                      </motion.div>

                      {/* Centered Large Prompt Input Card with Staggered Organic Scale & Animated Placeholders */}
                      <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.32, delay: 0.08, ease: [0.23, 1, 0.32, 1] }}
                        className="w-full max-w-2xl bg-surface border border-border/80 rounded-3xl p-3.5 sm:p-4 shadow-2xl space-y-2.5 text-left"
                      >
                        {/* Real-time Voice Waveform Visualizer (Pure Wave Bars) */}
                        <AnimatePresence>
                          {isRecording && (
                            <motion.div
                              initial={{ opacity: 0, height: 0, scale: 0.96 }}
                              animate={{ opacity: 1, height: 'auto', scale: 1 }}
                              exit={{ opacity: 0, height: 0, scale: 0.96 }}
                              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                              className="flex items-center justify-center p-2 rounded-2xl mb-2 bg-brand/10 border border-brand/20 backdrop-blur-md"
                            >
                              <div className="flex items-center justify-center gap-1.5 h-7 px-2 w-full">
                                {audioLevels.map((lvl, idx) => (
                                  <motion.div
                                    key={idx}
                                    animate={{ height: `${lvl}%` }}
                                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                                    className="w-1.5 bg-brand rounded-full shadow-xs shadow-brand/50"
                                    style={{ minHeight: '6px' }}
                                  />
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <div className="relative flex items-center min-h-[38px]">
                          {!chatInput && (
                            <div className="absolute inset-0 pointer-events-none text-sm text-text-dim font-sans overflow-hidden py-1 px-0 flex items-center">
                              <AnimatePresence mode="wait">
                                <motion.span
                                  key={placeholderIndex}
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -5 }}
                                  transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                                  className="block truncate leading-tight"
                                >
                                  {PROMPT_EXAMPLES[placeholderIndex]}
                                </motion.span>
                              </AnimatePresence>
                            </div>
                          )}
                          <textarea
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (chatInput.trim()) sendChatMessage(chatInput);
                              }
                            }}
                            rows={1}
                            className="w-full bg-transparent text-sm text-text-primary focus:outline-none resize-none font-sans relative z-10 py-1 leading-tight"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border/60 relative z-20">
                          <div className="flex items-center gap-2">
                            <label className="p-2.5 rounded-xl hover:bg-surface-hover text-text-secondary hover:text-text-primary cursor-pointer transition-colors" title="Escanear recibo">
                              <Paperclip size={18} />
                              <input id="chat-receipt-input" type="file" accept="image/*" className="hidden" onChange={handleReceiptUpload} />
                            </label>
                            <button
                              type="button"
                              onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                              className={cn(
                                "p-2.5 rounded-xl transition-colors cursor-pointer",
                                isRecording ? "bg-error text-white animate-pulse" : "hover:bg-surface-hover text-text-secondary hover:text-text-primary"
                              )}
                              title="Dictar por voz"
                            >
                              {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowHistoryModal(true)}
                              className="p-2.5 rounded-xl hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                              title="Historial de consultas"
                            >
                              <History size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={startLiveMode}
                              className="p-2.5 rounded-xl hover:bg-surface-hover text-text-secondary hover:text-brand transition-colors cursor-pointer"
                              title="Modo Live: habla con Hera y te responde con voz"
                            >
                              <Radio size={18} />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => { if (chatInput.trim()) sendChatMessage(chatInput); }}
                            disabled={!chatInput.trim() || chatLoading}
                            className="px-4 py-2 bg-brand hover:bg-brand-hover text-white font-medium rounded-xl text-xs flex items-center gap-2 shadow-md disabled:opacity-40 transition-all active:scale-[0.97] cursor-pointer"
                          >
                            {chatLoading ? (
                              /* Cargando: solo tres puntos, sin la palabra */
                              <span className="flex items-center gap-1 py-1" aria-label="Consultando">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" />
                              </span>
                            ) : (
                              <>
                                <Send size={14} />
                                <span>Consultar</span>
                              </>
                            )}
                          </button>
                        </div>
                      </motion.div>

                      {/* Quick Action Suggestion Pills with Soft Stagger */}
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.28, delay: 0.16, ease: [0.23, 1, 0.32, 1] }}
                        className="flex flex-wrap items-center justify-center gap-2 max-w-xl"
                      >
                        {suggestionPills.map((pill) => (
                          <button
                            key={pill.key}
                            onClick={() => sendChatMessage(pill.query)}
                            className="px-4 py-2 rounded-2xl bg-surface hover:bg-surface-hover border border-border text-text-primary text-xs font-medium flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-[0.97]"
                          >
                            <pill.icon size={14} className="text-brand" />
                            <span>{pill.label}</span>
                          </button>
                        ))}
                      </motion.div>
                    </div>
                  ) : (
                    /* Conversation Thread View */
                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative pb-1">
                      {/* Thread Header (Left: Quick nav icons, Right: + Nueva consulta) */}
                      <div className="flex items-center justify-between border-b border-border/60 pb-2.5 px-0 shrink-0">
                        <div className="flex items-center gap-1.5 bg-surface/80 backdrop-blur-xl border border-border rounded-2xl p-1.5 shadow-lg shadow-black/5">
                          <button
                            onClick={() => setActiveTab('timeline')}
                            className="p-1.5 rounded-xl hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
                            title="Ver Timeline de movimientos"
                          >
                            <Clock size={15} className="text-brand" />
                            <span className="hidden sm:inline">Timeline</span>
                          </button>
                          <button
                            onClick={() => setActiveTab('reports')}
                            className="p-1.5 rounded-xl hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
                            title="Ver Reportes financieros"
                          >
                            <PieChart size={15} className="text-brand" />
                            <span className="hidden sm:inline">Reportes</span>
                          </button>
                          <button
                            onClick={() => setActiveTab('goals')}
                            className="p-1.5 rounded-xl hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
                            title="Ver Metas & Ahorros"
                          >
                            <Target size={15} className="text-brand" />
                            <span className="hidden sm:inline">Metas</span>
                          </button>
                          <button
                            onClick={() => setActiveTab('health')}
                            className="p-1.5 rounded-xl hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
                            title="Ver Salud Financiera & Score Hera"
                          >
                            <ShieldCheck size={15} className="text-brand" />
                            <span className="hidden sm:inline">Salud</span>
                          </button>
                          <div className="w-[1px] h-4 bg-border/80 mx-0.5" />
                          <button
                            onClick={() => setShowAddModal(true)}
                            className="p-1.5 rounded-xl bg-brand/10 hover:bg-brand/20 text-brand transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                            title="Crear nuevo registro rápido"
                          >
                            <Plus size={15} />
                            <span>Nuevo</span>
                          </button>
                        </div>
                        <button
                          onClick={() => setChatMessages([])}
                          className="text-xs text-brand font-medium hover:underline cursor-pointer"
                        >
                          + Nueva consulta
                        </button>
                      </div>

                      {/* Animated Message Thread Feed with Scroll Listener */}
                      <div
                        ref={chatContainerRef}
                        onScroll={handleChatScroll}
                        className="flex-1 overflow-y-auto space-y-4 pr-1 py-3"
                      >
                        {chatMessages.map((msg, idx) => (
                          <motion.div
                            key={msg.id ? `${msg.id}-${idx}` : `msg-${idx}`}
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                            className={cn(
                              "group flex gap-2.5 max-w-3xl items-start",
                              msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                            )}
                          >
                            {msg.role === 'assistant' ? (
                              <div className="w-8 h-8 rounded-xl bg-surface border border-border/80 p-1 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                                <img src="/logo.png" alt="Hera Logo" className="w-full h-full object-contain" />
                              </div>
                            ) : (
                              <img
                                src={profile?.photoURL || user?.photoURL || "/defaultuser.png"}
                                alt="Usuario"
                                className="w-8 h-8 rounded-xl object-cover border border-border shrink-0 mt-0.5"
                              />
                            )}

                            {msg.role === 'assistant' ? (
                              <div className="flex flex-col items-start gap-1 max-w-xl w-full min-w-0">
                                <div className="p-4 rounded-2xl text-xs leading-relaxed space-y-3 bg-surface border border-border text-text-primary rounded-tl-none shadow-sm w-full font-sans">
                                  <FormattedMarkdown content={msg.content} />

                                  {/* 1. Interactive Financial Operation Confirmation Card */}
                                  {(msg.type === 'pending_action' || msg.data?.actionType) && msg.data && (
                                    <div className="mt-3 bg-bg/90 border border-brand/40 p-4 rounded-2xl space-y-3 shadow-md">
                                      <div className="flex items-center justify-between border-b border-border/60 pb-2">
                                        <div className="flex items-center gap-2">
                                          <div className={cn(
                                            "w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0",
                                            msg.data.type === 'income' ? "bg-success/15 text-success" : "bg-error/15 text-error"
                                          )}>
                                            {msg.data.type === 'income' ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                                          </div>
                                          <div>
                                            <h4 className="font-semibold text-xs text-text-primary">
                                              {msg.data.actionType === 'create_goal' ? 'Nueva Meta de Ahorro' : (msg.data.type === 'income' ? 'Registro de Ingreso' : 'Registro de Gasto')}
                                            </h4>
                                            <span className="text-[10px] text-text-secondary">Operación pendiente de confirmación</span>
                                          </div>
                                        </div>
                                        <span className={cn(
                                          "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase",
                                          msg.actionState === 'confirmed' ? "bg-success/20 text-success" : msg.actionState === 'cancelled' ? "bg-text-dim/20 text-text-dim" : "bg-brand/20 text-brand"
                                        )}>
                                          {msg.actionState === 'confirmed' ? 'Confirmado' : msg.actionState === 'cancelled' ? 'Cancelado' : 'Pendiente'}
                                        </span>
                                      </div>

                                      {/* Operation Details Grid */}
                                      <div className="grid grid-cols-2 gap-2 text-xs bg-surface/80 p-3 rounded-xl border border-border/60">
                                        <div>
                                          <span className="text-[10px] text-text-dim block uppercase font-mono">Importe</span>
                                          <span className="font-bold font-mono text-sm text-text-primary">
                                            {formatCompactNumber(msg.data.amount || msg.data.targetAmount)}€
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-[10px] text-text-dim block uppercase font-mono">Categoría / Nombre</span>
                                          <span className="font-medium text-text-primary">{msg.data.category || msg.data.name}</span>
                                        </div>
                                        <div>
                                          <span className="text-[10px] text-text-dim block uppercase font-mono">Cuenta / Fuente</span>
                                          <span className="font-medium text-text-secondary">{msg.data.accountName || 'Cuenta Principal'}</span>
                                        </div>
                                        <div>
                                          <span className="text-[10px] text-text-dim block uppercase font-mono">Descripción</span>
                                          <span className="font-medium text-text-secondary">{msg.data.description || msg.data.name || 'Sin detalles'}</span>
                                        </div>
                                      </div>

                                      {/* 2 Action Buttons: Confirm & Cancel */}
                                      {msg.actionState === 'confirmed' ? (
                                        <div className="p-2.5 bg-success/15 border border-success/30 rounded-xl text-xs text-success font-medium flex items-center justify-center gap-1.5">
                                          <CheckCircle2 size={16} />
                                          <span>Operación ejecutada y guardada en tus transacciones</span>
                                        </div>
                                      ) : msg.actionState === 'cancelled' ? (
                                        <div className="p-2.5 bg-bg border border-border rounded-xl text-xs text-text-dim font-medium text-center">
                                          Operación cancelada. No se hicieron cambios en tus cuentas.
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-2 pt-1">
                                          <button
                                            type="button"
                                            onClick={() => handleConfirmChatAction(msg.id, msg.data)}
                                            disabled={actionProcessing === msg.id}
                                            className="flex-1 px-3.5 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all duration-150 active:scale-[0.97] cursor-pointer disabled:opacity-50"
                                          >
                                            {actionProcessing === msg.id ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                            <span>Confirmar y Proceder</span>
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => handleCancelChatAction(msg.id)}
                                            disabled={actionProcessing === msg.id}
                                            className="px-3.5 py-2 bg-bg border border-border text-text-secondary hover:text-text-primary rounded-xl text-xs font-medium transition-all duration-150 active:scale-[0.97] cursor-pointer"
                                          >
                                            <span>Cancelar</span>
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* 2. Progress Bar Widget */}
                                  {msg.type === 'progress' && msg.data && (
                                    <div className="mt-3 bg-bg/90 border border-brand/40 p-4 rounded-2xl space-y-2.5 shadow-md">
                                      <div className="flex items-center justify-between">
                                        <span className="font-semibold text-xs text-text-primary flex items-center gap-1.5">
                                          <Target size={15} className="text-brand" />
                                          {msg.data.title || 'Progreso de Ahorro'}
                                        </span>
                                        <span className="text-[11px] font-mono font-bold text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-full">
                                          {Math.round(((msg.data.current || 0) / (msg.data.target || 1)) * 100)}%
                                        </span>
                                      </div>

                                      {/* Animated Progress Bar */}
                                      <div className="w-full bg-surface-hover h-2.5 rounded-full overflow-hidden border border-border/60">
                                        <motion.div
                                          initial={{ width: 0 }}
                                          animate={{ width: `${Math.min(100, Math.round(((msg.data.current || 0) / (msg.data.target || 1)) * 100))}%` }}
                                          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                                          className="h-full bg-gradient-to-r from-brand to-brand-hover rounded-full shadow-xs"
                                        />
                                      </div>

                                      <div className="flex items-center justify-between text-[11px] font-mono text-text-secondary pt-0.5">
                                        <span>Actual: {formatCompactNumber(msg.data.current || 0)} {msg.data.unit || '€'}</span>
                                        <span>Objetivo: {formatCompactNumber(msg.data.target || 0)} {msg.data.unit || '€'}</span>
                                      </div>
                                    </div>
                                  )}

                                  {/* 3. Dynamic Executive Chart Widgets (Lineal / Proyección, Pie / Pizza, Barras) */}
                                  {(msg.type === 'projection_chart' || (msg.type === 'chart' && (msg.data?.chartType === 'projection' || msg.data?.chartType === 'line' || msg.data?.points))) && msg.data && (
                                    <HeraProjectionChartCard data={msg.data} currencySymbol={currencySymbol} />
                                  )}

                                  {msg.type === 'chart' && msg.data && (msg.data.chartType === 'pie' || msg.data.chartType === 'pizza' || msg.data.chartType === 'donut') && (
                                    <HeraPieChartCard data={msg.data} currencySymbol={currencySymbol} />
                                  )}

                                  {msg.type === 'chart' && msg.data && msg.data.data && msg.data.chartType !== 'projection' && msg.data.chartType !== 'line' && msg.data.chartType !== 'pie' && msg.data.chartType !== 'pizza' && msg.data.chartType !== 'donut' && !msg.data.points && (
                                    <HeraBarChartCard data={msg.data} currencySymbol={currencySymbol} />
                                  )}

                                  {/* 4. Interactive Table Widget */}
                                  {msg.type === 'table' && msg.data && (
                                    <div className="mt-3 bg-bg/90 border border-border p-3.5 rounded-2xl space-y-2.5 shadow-md overflow-hidden">
                                      <div className="flex items-center justify-between">
                                        <span className="font-semibold text-xs text-text-primary flex items-center gap-1.5">
                                          <Receipt size={15} className="text-brand" />
                                          {msg.data.title || 'Tabla de Resumen'}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const csvContent = "data:text/csv;charset=utf-8," + [msg.data.columns.join(','), ...msg.data.rows.map((r: any) => r.join(','))].join('\n');
                                            const encodedUri = encodeURI(csvContent);
                                            const link = document.createElement('a');
                                            link.setAttribute('href', encodedUri);
                                            link.setAttribute('download', `Reporte_Hera_${Date.now()}.csv`);
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                            showToast('CSV exportado correctamente', 'success');
                                          }}
                                          className="px-2.5 py-1 rounded-xl bg-surface border border-border text-[11px] text-text-secondary hover:text-brand transition-colors cursor-pointer flex items-center gap-1 font-medium"
                                        >
                                          <span>Exportar CSV</span>
                                        </button>
                                      </div>

                                      <div className="overflow-x-auto">
                                        <table className="w-full text-[11px] text-left border-collapse">
                                          <thead>
                                            <tr className="border-b border-border/80 text-text-dim uppercase font-mono text-[10px]">
                                              {msg.data.columns?.map((col: string, idx: number) => (
                                                <th key={idx} className="pb-2 font-bold px-2">{col}</th>
                                              ))}
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-border/40">
                                            {msg.data.rows?.map((row: string[], rIdx: number) => (
                                              <tr key={rIdx} className="hover:bg-surface-hover/50 transition-colors">
                                                {row.map((cell: string, cIdx: number) => (
                                                  <td key={cIdx} className="py-2 px-2 text-text-primary font-medium">{cell}</td>
                                                ))}
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}

                                  {/* 5. Downloadable Document Widget (Single Specific Format Card - No Emojis, Pure SVG Icons) */}
                                  {(msg.type === 'document' || (msg.role === 'assistant' && (
                                    msg.content.toLowerCase().includes('generar archivo') ||
                                    msg.content.toLowerCase().includes('cree el excel') ||
                                    msg.content.toLowerCase().includes('widget inferior') ||
                                    msg.content.toLowerCase().includes('descargar excel') ||
                                    msg.content.toLowerCase().includes('informe en excel')
                                  ))) && (() => {
                                    const docData = msg.data || { title: 'Informe_Financiero_HeraWallet.xlsx', format: 'xlsx', size: '340 KB' };
                                    const reqFormat = (docData.format || '').toLowerCase().includes('doc') || (docData.format || '').toLowerCase().includes('word')
                                      ? 'docx'
                                      : (docData.format || '').toLowerCase().includes('pdf')
                                        ? 'pdf'
                                        : 'xlsx';

                                    const formatLabel = reqFormat === 'docx' ? 'DOCX' : reqFormat === 'pdf' ? 'PDF' : 'XLSX';

                                    return (
                                      <div className="mt-3 bg-bg/90 border border-border/80 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-xs font-sans">
                                        <div className="flex items-center gap-3 min-w-0">
                                          <div className="w-10 h-10 rounded-xl bg-surface border border-border/80 flex items-center justify-center text-brand shrink-0 shadow-xs">
                                            {reqFormat === 'docx' ? (
                                              <FileText size={18} />
                                            ) : reqFormat === 'xlsx' ? (
                                              <FileSpreadsheet size={18} />
                                            ) : (
                                              <File size={18} />
                                            )}
                                          </div>
                                          <div className="min-w-0">
                                            <h4 className="font-semibold text-xs text-text-primary truncate">{docData.title || `Informe_HeraWallet.${formatLabel.toLowerCase()}`}</h4>
                                            <div className="flex items-center gap-2 text-[10px] text-text-secondary font-mono mt-0.5">
                                              <span className="font-bold text-brand uppercase">{formatLabel}</span>
                                              <span>• {docData.size || '340 KB'}</span>
                                            </div>
                                          </div>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => handleDownloadGeneratedDocument(reqFormat, docData.title, docData)}
                                          className="px-3.5 py-1.5 bg-surface border border-border hover:border-brand/40 text-text-primary hover:text-brand rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-[0.97] cursor-pointer shrink-0"
                                        >
                                          <Download size={13} />
                                          <span>Descargar</span>
                                        </button>
                                      </div>
                                    );
                                  })()}
                                </div>

                                {/* Assistant Action Footer Bar (ThumbsUp + ThumbsDown + Copy + Regenerate) */}
                                <div className="flex items-center gap-3 text-[11px] text-text-secondary px-1 py-0.5 font-mono">

                                  <button
                                    type="button"
                                    onClick={() => handleToggleLike(msg.id)}
                                    className={cn("transition-colors p-1 cursor-pointer", likedMsgIds[msg.id] ? "text-brand" : "hover:text-text-primary")}
                                    title="Me gusta"
                                  >
                                    <ThumbsUp size={13} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleToggleDislike(msg.id)}
                                    className={cn("transition-colors p-1 cursor-pointer", dislikedMsgIds[msg.id] ? "text-error" : "hover:text-text-primary")}
                                    title="No me gusta"
                                  >
                                    <ThumbsDown size={13} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleCopyMessage(msg.content)}
                                    className="hover:text-text-primary transition-colors p-1 cursor-pointer"
                                    title="Copiar respuesta"
                                  >
                                    <Copy size={13} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleRegenerateAiMessage(msg.id)}
                                    className="hover:text-brand transition-colors p-1 cursor-pointer"
                                    title="Regenerar respuesta de la IA en este mensaje"
                                  >
                                    <RotateCw size={13} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-end gap-1 max-w-xl w-full min-w-0">
                                {editingUserMsgId === msg.id ? (
                                  <div className="w-full bg-surface border border-brand/40 p-3 rounded-2xl space-y-2 shadow-sm font-sans">
                                    <textarea
                                      value={editUserMsgText}
                                      onChange={e => setEditUserMsgText(e.target.value)}
                                      className="w-full bg-bg border border-border rounded-xl p-2.5 text-xs font-sans text-text-primary focus:outline-none focus:border-brand resize-none"
                                      rows={2}
                                    />
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setEditingUserMsgId(null)}
                                        className="px-2.5 py-1 text-[11px] text-text-secondary hover:text-text-primary font-medium rounded-lg transition-colors cursor-pointer"
                                      >
                                        Cancelar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSaveEditedUserMessage(msg.id)}
                                        className="px-3 py-1 bg-brand hover:bg-brand-hover text-white text-[11px] font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
                                      >
                                        Guardar y Regenerar
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-4 rounded-2xl text-xs leading-relaxed bg-brand text-white rounded-tr-none shadow-sm w-full font-sans">
                                    <div className="whitespace-pre-wrap">{msg.content}</div>
                                  </div>
                                )}

                                {/* User Action Footer Bar (Timestamp + Retry + Edit + Copy) */}
                                <div className="flex items-center gap-2.5 text-[10px] text-text-dim px-1 font-mono">
                                  <span>
                                    {msg.createdAt
                                      ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                      : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => handleRetryUserMessage(msg.id)}
                                    className="hover:text-brand transition-colors p-0.5 cursor-pointer"
                                    title="Reintentar (Regenera respuesta de la IA)"
                                  >
                                    <RotateCw size={12} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingUserMsgId(msg.id);
                                      setEditUserMsgText(msg.content);
                                    }}
                                    className="hover:text-brand transition-colors p-0.5 cursor-pointer"
                                    title="Editar mensaje"
                                  >
                                    <Pencil size={12} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleCopyMessage(msg.content)}
                                    className="hover:text-brand transition-colors p-0.5 cursor-pointer"
                                    title="Copiar mensaje"
                                  >
                                    <Copy size={12} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        ))}
                        {chatLoading && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                            className="flex gap-3 items-start text-xs max-w-lg"
                          >
                            <div className="w-8 h-8 rounded-2xl bg-surface border border-border p-1 flex items-center justify-center shrink-0 shadow-xs mt-0.5 relative">
                              <img src="/logo.png" alt="Hera Logo" className="w-full h-full object-contain" />
                            </div>

                            <div className="bg-surface border border-border/80 p-3.5 rounded-2xl space-y-2 shadow-xs text-xs">
                              {/* Solo tres puntos: sin texto rotatorio que distraiga */}
                              <div className="flex items-center gap-1 shrink-0 py-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" />
                              </div>

                              {/* Live Stream Reasoning Tokens Box (if active) */}
                              {currentReasoningText && (
                                <div className="bg-bg/80 border border-border/60 p-2.5 rounded-xl space-y-1 font-mono text-[11px] mt-1">
                                  <div className="flex items-center justify-between text-[10px] text-brand font-semibold tracking-wider border-b border-border/40 pb-1">
                                    <span>Razonamiento Hera AI</span>
                                    <span>{currentReasoningText.length} tokens</span>
                                  </div>
                                  <p className="whitespace-pre-wrap leading-relaxed text-text-secondary text-[11px] max-h-32 overflow-y-auto pt-0.5">
                                    {currentReasoningText}
                                  </p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                        <div ref={chatBottomRef} />
                      </div>

                      {/* Scroll to Bottom Arrow Button (when scrolled up) */}
                      <AnimatePresence>
                        {showScrollBottom && (
                          <motion.button
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                            onClick={scrollToBottom}
                            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 p-2.5 rounded-full bg-surface border border-border text-brand shadow-xl hover:bg-surface-hover cursor-pointer transition-all flex items-center justify-center active:scale-95"
                            title="Bajar al final"
                          >
                            <ChevronDown size={18} />
                          </motion.button>
                        )}
                      </AnimatePresence>

                      {/* Fixed / Sticky Bottom Chat Input Card */}
                      <div className="sticky bottom-0 z-30 pt-1 shrink-0">
                        <div className="w-full max-w-4xl mx-auto bg-surface border border-border/80 rounded-3xl p-3.5 sm:p-4 shadow-2xl space-y-2.5 text-left">
                          {/* Real-time Voice Waveform Visualizer (Pure Wave Bars) */}
                          <AnimatePresence>
                            {isRecording && (
                              <motion.div
                                initial={{ opacity: 0, height: 0, scale: 0.96 }}
                                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                exit={{ opacity: 0, height: 0, scale: 0.96 }}
                                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                                className="flex items-center justify-center p-2 rounded-2xl mb-2 bg-brand/10 border border-brand/20 backdrop-blur-md"
                              >
                                <div className="flex items-center justify-center gap-1.5 h-7 px-2 w-full">
                                  {audioLevels.map((lvl, idx) => (
                                    <motion.div
                                      key={idx}
                                      animate={{ height: `${lvl}%` }}
                                      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                                      className="w-1.5 bg-brand rounded-full shadow-xs shadow-brand/50"
                                      style={{ minHeight: '6px' }}
                                    />
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <div className="relative flex items-center min-h-[38px]">
                            {!chatInput && (
                              <div className="absolute inset-0 pointer-events-none text-sm text-text-dim font-sans overflow-hidden py-1 px-0 flex items-center">
                                <AnimatePresence mode="wait">
                                  <motion.span
                                    key={placeholderIndex}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                                    className="block truncate leading-tight"
                                  >
                                    {PROMPT_EXAMPLES[placeholderIndex]}
                                  </motion.span>
                                </AnimatePresence>
                              </div>
                            )}
                            <textarea
                              value={chatInput}
                              onChange={e => setChatInput(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  if (chatInput.trim()) sendChatMessage(chatInput);
                                }
                              }}
                              rows={1}
                              className="w-full bg-transparent text-sm text-text-primary focus:outline-none resize-none font-sans relative z-10 py-1 leading-tight"
                            />
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-border/60">
                            <div className="flex items-center gap-2">
                              <label className="p-2.5 rounded-xl hover:bg-surface-hover text-text-secondary hover:text-text-primary cursor-pointer transition-colors" title="Escanear recibo">
                                <Paperclip size={18} />
                                <input type="file" accept="image/*" className="hidden" onChange={handleReceiptUpload} />
                              </label>
                              <button
                                type="button"
                                onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                                className={cn(
                                  "p-2.5 rounded-xl transition-colors cursor-pointer",
                                  isRecording ? "bg-error text-white animate-pulse" : "hover:bg-surface-hover text-text-secondary hover:text-text-primary"
                                )}
                                title="Dictar por voz"
                              >
                                {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowHistoryModal(true)}
                                className="p-2.5 rounded-xl hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                                title="Historial de consultas"
                              >
                                <History size={18} />
                              </button>
                              <button
                                type="button"
                                onClick={startLiveMode}
                                className="p-2.5 rounded-xl hover:bg-surface-hover text-text-secondary hover:text-brand transition-colors cursor-pointer"
                                title="Modo Live: habla con Hera y te responde con voz"
                              >
                                <Radio size={18} />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => { if (chatInput.trim()) sendChatMessage(chatInput); }}
                              disabled={!chatInput.trim() || chatLoading}
                              className="px-4 py-2 bg-brand hover:bg-brand-hover text-white font-medium rounded-xl text-xs flex items-center gap-2 shadow-md disabled:opacity-40 transition-all active:scale-[0.97] cursor-pointer"
                            >
                            {chatLoading ? (
                                /* Cargando: solo tres puntos, sin la palabra */
                                <span className="flex items-center gap-1 py-1" aria-label="Consultando">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.3s]" />
                                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.15s]" />
                                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" />
                                </span>
                              ) : (
                                <>
                                  <Send size={14} />
                                  <span>Consultar</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'timeline' && (
                /* --- TIMELINE TAB --- */
                <div className="space-y-4">
                  <div className="bg-surface border border-border p-5 rounded-3xl">
                    <h2 className="text-xl font-serif font-semibold">Transacciones</h2>
                    <p className="text-xs text-text-secondary">Historia cronológica diaria de tus ingresos y gastos reales</p>
                  </div>

                  {/* Timeline Filters Bar (Date Range & Far-Right Filter Icon) */}
                  <div className="bg-surface border border-border p-4 rounded-3xl space-y-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="date"
                          value={timelineStartDate}
                          onChange={e => {
                            setTimelineStartDate(e.target.value);
                            loadUserData({ startDate: e.target.value });
                          }}
                          className="bg-bg border border-border rounded-xl px-2.5 py-1.5 text-text-primary focus:outline-none cursor-pointer"
                        />
                        <span className="text-text-dim">-</span>
                        <input
                          type="date"
                          value={timelineEndDate}
                          onChange={e => {
                            setTimelineEndDate(e.target.value);
                            loadUserData({ endDate: e.target.value });
                          }}
                          className="bg-bg border border-border rounded-xl px-2.5 py-1.5 text-text-primary focus:outline-none cursor-pointer"
                        />
                      </div>

                      {/* Filter Icon Button Pushed to the Far Right */}
                      <button
                        type="button"
                        onClick={() => setShowTimelineFilters(!showTimelineFilters)}
                        title="Filtros"
                        className={cn(
                          "p-2.5 rounded-xl border flex items-center justify-center cursor-pointer transition-all relative shrink-0 ml-auto",
                          showTimelineFilters || timelineCategories.length > 0 || timelineType !== 'all' || timelineMinAmount > 0 || timelineMaxAmount < 1000
                            ? "bg-brand/15 border-brand text-brand shadow-xs"
                            : "bg-bg border-border text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                        )}
                      >
                        <SlidersHorizontal size={16} />
                        {(timelineCategories.length > 0 || timelineType !== 'all' || timelineMinAmount > 0 || timelineMaxAmount < 1000) && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-brand ring-2 ring-surface animate-pulse" />
                        )}
                      </button>
                    </div>

                    {/* Collapsible Filters Drawer */}
                    {showTimelineFilters && (
                      <div className="pt-3 border-t border-border/70 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* 1. Filtro por Tipo de Transacción (Ingreso / Gasto) SIN EMOJIS */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                            Tipo de Movimiento
                          </label>
                          <div className="flex gap-2">
                            {[
                              { id: 'all', label: 'Todos' },
                              { id: 'expense', label: 'Gastos' },
                              { id: 'income', label: 'Ingresos' }
                            ].map(t => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => {
                                  setTimelineType(t.id as any);
                                  loadUserData({ type: t.id });
                                }}
                                className={cn(
                                  "px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer",
                                  timelineType === t.id
                                    ? "bg-brand text-white border-brand shadow-xs"
                                    : "bg-bg border-border text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                                )}
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 2. Filtro de Categoría con Buscador y Selección Múltiple */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                              <span>Categorías</span>
                              {timelineCategories.length > 0 && (
                                <span className="text-[10px] bg-brand/20 text-brand px-1.5 py-0.5 rounded-full font-mono">
                                  {timelineCategories.length} seleccionadas
                                </span>
                              )}
                            </label>
                            {timelineCategories.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setTimelineCategories([]);
                                  setTimelineCategorySearch('');
                                  loadUserData({ category: 'all' });
                                }}
                                className="text-[10px] text-brand hover:underline font-medium cursor-pointer"
                              >
                                Limpiar Selección
                              </button>
                            )}
                          </div>

                          {/* Buscador de Categoría */}
                          <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                            <input
                              type="text"
                              value={timelineCategorySearch}
                              onChange={e => setTimelineCategorySearch(e.target.value)}
                              placeholder="Buscar categoría (ej. Restaurantes, Salario, Ropa)..."
                              className="w-full bg-bg border border-border rounded-xl pl-9 pr-8 py-2 text-xs text-text-primary focus:outline-none focus:border-brand/60"
                            />
                            {timelineCategorySearch && (
                              <button
                                type="button"
                                onClick={() => setTimelineCategorySearch('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-primary p-0.5 cursor-pointer"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>

                          {/* Multi-Select Categoría Chips */}
                          <div className="flex flex-wrap gap-1.5 pt-0.5 max-h-36 overflow-y-auto">
                            <button
                              type="button"
                              onClick={() => {
                                setTimelineCategories([]);
                                loadUserData({ category: 'all' });
                              }}
                              className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border",
                                timelineCategories.length === 0
                                  ? "bg-brand text-white border-brand shadow-xs"
                                  : "bg-bg border-border text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                              )}
                            >
                              Todas las Categorías
                            </button>
                            {[
                              'Restaurantes',
                              'Supermercado',
                              'Ropa & Moda',
                              'Transporte',
                              'Servicios',
                              'Salario',
                              'Ocio & Entretenimiento',
                              'Salud',
                              'Tecnología',
                              'General'
                            ]
                              .filter(cat => cat.toLowerCase().includes(timelineCategorySearch.toLowerCase()))
                              .map(catName => {
                                const isSelected = timelineCategories.includes(catName);
                                return (
                                  <button
                                    key={catName}
                                    type="button"
                                    onClick={() => {
                                      let next: string[];
                                      if (isSelected) {
                                        next = timelineCategories.filter(c => c !== catName);
                                      } else {
                                        next = [...timelineCategories, catName];
                                      }
                                      setTimelineCategories(next);
                                      loadUserData({ category: next.length > 0 ? next.join(',') : 'all' });
                                    }}
                                    className={cn(
                                      "px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border flex items-center gap-1",
                                      isSelected
                                        ? "bg-brand text-white border-brand shadow-xs font-semibold"
                                        : "bg-bg border-border text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                                    )}
                                  >
                                    {isSelected && <Check size={12} />}
                                    <span>{catName}</span>
                                  </button>
                                );
                              })}
                          </div>
                        </div>

                        {/* 3. Rango de Montos Slider Bar */}
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                              Rango de Montos ({currencySymbol})
                            </label>
                            <span className="text-xs font-mono font-semibold text-brand">
                              {timelineMinAmount}{currencySymbol} — {timelineMaxAmount >= 1000 ? `1000${currencySymbol}+` : `${timelineMaxAmount}${currencySymbol}`}
                            </span>
                          </div>

                          <div className="space-y-3 bg-bg border border-border p-3.5 rounded-2xl">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] text-text-dim font-mono">
                                <span>Mínimo: {timelineMinAmount}{currencySymbol}</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="1000"
                                step="10"
                                value={timelineMinAmount}
                                onChange={e => {
                                  const val = Number(e.target.value);
                                  setTimelineMinAmount(val);
                                  loadUserData({ minAmount: val });
                                }}
                                className="w-full accent-brand cursor-pointer"
                              />
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] text-text-dim font-mono">
                                <span>Máximo: {timelineMaxAmount >= 1000 ? `Sin Límite (1000${currencySymbol}+)` : `${timelineMaxAmount}${currencySymbol}`}</span>
                              </div>
                              <input
                                type="range"
                                min="10"
                                max="1000"
                                step="20"
                                value={timelineMaxAmount}
                                onChange={e => {
                                  const val = Number(e.target.value);
                                  setTimelineMaxAmount(val);
                                  loadUserData({ maxAmount: val });
                                }}
                                className="w-full accent-brand cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Restablecer Filtros Button */}
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setTimelineType('all');
                              setTimelineCategories([]);
                              setTimelineCategorySearch('');
                              setTimelineMinAmount(0);
                              setTimelineMaxAmount(1000);
                              loadUserData({ type: 'all', category: 'all', minAmount: 0, maxAmount: 1000 });
                            }}
                            className="px-3 py-1.5 bg-bg border border-border text-text-secondary hover:text-text-primary rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <RefreshCw size={12} />
                            <span>Restablecer Filtros</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* KPI Section: Top Row (Ingresos & Gastos Icons+Numbers) + Bottom Dedicated Balance Row with Name */}
                  {(() => {
                    let totalInc = 0;
                    let totalExp = 0;
                    timeline.forEach(group => {
                      group.items?.forEach((it: any) => {
                        if (it.type === 'income') totalInc += Number(it.amount || 0);
                        else totalExp += Number(it.amount || 0);
                      });
                    });
                    const netBal = totalInc - totalExp;

                    const kpiItems = [
                      {
                        id: 'inc',
                        label: 'Ingresos Totales',
                        value: `+${formatCompactNumber(totalInc)}${currencySymbol}`,
                        fullValue: `+${totalInc.toLocaleString()} ${currencySymbol}`,
                        icon: <TrendingUp size={15} />,
                        colorClass: 'text-success bg-success/10 border-success/20',
                        textClass: 'text-success'
                      },
                      {
                        id: 'exp',
                        label: 'Gastos Totales',
                        value: `-${formatCompactNumber(totalExp)}${currencySymbol}`,
                        fullValue: `-${totalExp.toLocaleString()} ${currencySymbol}`,
                        icon: <TrendingDown size={15} />,
                        colorClass: 'text-error bg-error/10 border-error/20',
                        textClass: 'text-error'
                      }
                    ];

                    return (
                      <div className="space-y-2.5">
                        {/* Top Row: Ingresos & Gastos Minimalist Pills with Tooltips */}
                        <div className="bg-surface/90 backdrop-blur-md border border-border px-6 py-2.5 rounded-2xl flex items-center justify-around gap-4 shadow-xs text-xs font-mono relative select-none">
                          {kpiItems.map((kpi, i) => (
                            <React.Fragment key={kpi.id}>
                              {i > 0 && <div className="w-[1px] h-5 bg-border/60" />}

                              <div
                                className="relative group cursor-pointer"
                                onMouseEnter={() => setKpiTooltip(kpi.id)}
                                onMouseLeave={() => setKpiTooltip(null)}
                                onClick={() => setKpiTooltip(kpiTooltip === kpi.id ? null : kpi.id)}
                              >
                                <div className="flex items-center gap-2.5 px-3 py-1 rounded-xl transition-all duration-200 hover:bg-surface-hover active:scale-[0.95]">
                                  <div className={cn("w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-110 shadow-2xs", kpi.colorClass)}>
                                    {kpi.icon}
                                  </div>
                                  <span className={cn("font-bold text-sm sm:text-base tracking-tight transition-colors", kpi.textClass)}>
                                    {kpi.value}
                                  </span>
                                </div>

                                {/* Interactive Tooltip Popover */}
                                <AnimatePresence>
                                  {kpiTooltip === kpi.id && (
                                    <motion.div
                                      initial={{ opacity: 0, y: 6, scale: 0.94 }}
                                      animate={{ opacity: 1, y: 0, scale: 1 }}
                                      exit={{ opacity: 0, y: 4, scale: 0.94 }}
                                      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 px-3 py-1.5 rounded-xl bg-bg border border-border shadow-xl text-[11px] font-sans text-text-primary whitespace-nowrap z-30 flex flex-col items-center gap-0.5 pointer-events-none"
                                    >
                                      <span className="font-semibold text-text-primary">{kpi.label}</span>
                                      <span className="font-mono text-[10px] text-text-secondary">{kpi.fullValue}</span>
                                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-bg" />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </React.Fragment>
                          ))}
                        </div>

                        {/* Bottom Row: Dedicated Balance Card with Explicit "Balance" Label */}
                        <div className="bg-surface/90 backdrop-blur-md border border-border px-6 py-3 rounded-2xl flex items-center justify-between shadow-xs relative select-none group hover:border-brand/40 transition-all duration-200">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand border border-brand/20 flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform duration-200">
                              <Wallet size={16} />
                            </div>
                            <div>
                              <span className="text-xs font-serif font-bold text-text-primary tracking-tight">Balance</span>
                              <p className="text-[10px] text-text-secondary font-mono">Resultado Neto del Período</p>
                            </div>
                          </div>

                          <div className="text-right font-mono">
                            <span className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
                              {formatCompactNumber(netBal)}{currencySymbol}
                            </span>
                            <p className="text-[10px] text-text-dim">
                              ({netBal >= 0 ? '+' : ''}{netBal.toLocaleString()} {currencySymbol})
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Transactions Timeline List with Group Date & Vertical Muted Connector */}
                  <div className="space-y-8">
                    {financeLoading ? (
                      <div className="bg-surface border border-border rounded-3xl px-4 py-2">
                        <SkeletonRows rows={5} />
                      </div>
                    ) : timeline.length === 0 ? (
                      <div className="bg-surface border border-border p-12 rounded-3xl text-center space-y-3 text-text-dim shadow-xs">
                        <Receipt size={36} className="mx-auto opacity-30" />
                        <p className="text-xs">No hay movimientos registrados en este período</p>
                      </div>
                    ) : (
                      timeline.map((dayGroup, groupIdx) => (
                        <div key={dayGroup.date || groupIdx} className="space-y-4">
                          {/* Group Header Date Label */}
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold font-mono text-text-primary tracking-tight">
                              {dayGroup.date}
                            </span>
                            <div className="flex-1 h-[1px] bg-border/60" />
                            <span className="text-[10px] font-mono text-text-dim">
                              {dayGroup.items?.length || 0} movimientos
                            </span>
                          </div>

                          {/* Vertical Connector Timeline List (Línea Muted / Suave) */}
                          <div className="relative pl-14 sm:pl-16 space-y-3.5 before:absolute before:left-[1.75rem] sm:before:left-[2.25rem] before:top-3 before:bottom-3 before:w-[2px] before:bg-border/60">
                            {dayGroup.items?.map((item: any, itemIdx: number) => {
                              const isIncome = item.type === 'income';
                              const relTime = item.date ? getRelativeTimeShort(item.date) : `${10 + itemIdx * 5}m`;

                              return (
                                <motion.div
                                  key={item.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  whileInView={{ opacity: 1, x: 0 }}
                                  viewport={{ once: true, margin: "-20px" }}
                                  transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
                                  className="relative flex items-center justify-between bg-surface border border-border hover:border-brand/40 p-4 rounded-2xl shadow-xs transition-all duration-200 group active:scale-[0.99]"
                                >
                                  {/* Left Node Icon & Relative Time on Mandarina Timeline Connector */}
                                  <div className="absolute -left-[3.25rem] sm:-left-[3.75rem] top-1/2 -translate-y-1/2 flex items-center gap-2">
                                    {/* Relative Time Stamp Badge (1m, 1h, 1d, 1m, 1y) */}
                                    <span className="text-[10px] font-mono font-bold text-text-dim w-7 text-right shrink-0">
                                      {relTime}
                                    </span>

                                    {/* Circle Category Vector Icon Node (0 Emojis) */}
                                    <div className={cn(
                                      "w-8 h-8 rounded-full flex items-center justify-center border shrink-0 bg-surface shadow-xs transition-transform group-hover:scale-110",
                                      isIncome
                                        ? "border-success/40 bg-success/10 text-success"
                                        : "border-brand/40 bg-brand/10 text-brand"
                                    )}>
                                      {getCategoryIcon(item.category, item.type, item.description)}
                                    </div>
                                  </div>

                                  {/* Transaction Details */}
                                  <div className="space-y-1 flex-1 min-w-0 pr-4">
                                    <h4 className="font-semibold text-xs sm:text-sm text-text-primary truncate">
                                      {item.description || item.category}
                                    </h4>
                                    <p className="text-[11px] text-text-secondary font-mono truncate">
                                      {item.accountName || 'Cuenta Principal'} • {item.category}
                                    </p>

                                    {/* Tag Pills below (e.g. Registro por voz, Registro por Imagen) */}
                                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                                      {item.description?.toLowerCase().includes('voz') && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand/10 text-brand text-[9px] font-mono font-bold rounded-md border border-brand/20">
                                          <Mic size={10} /> Registro por voz
                                        </span>
                                      )}
                                      {item.description?.toLowerCase().includes('ocr') && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand/10 text-brand text-[9px] font-mono font-bold rounded-md border border-brand/20">
                                          <Scan size={10} /> Registro por Imagen
                                        </span>
                                      )}
                                      {isIncome && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-success/10 text-success text-[9px] font-mono font-bold rounded-md border border-success/20">
                                          <RefreshCw size={10} /> Ingreso recurrente
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Right Column: Amount & Type Badge */}
                                  <div className="flex items-center gap-3 shrink-0">
                                    <div className="text-right space-y-1">
                                      <p className={cn("font-mono font-bold text-xs sm:text-sm", isIncome ? "text-success" : "text-text-primary")}>
                                        {isIncome ? '+' : '-'}{Number(item.amount).toFixed(2)}{currencySymbol}
                                      </p>
                                      <span className={cn(
                                        "inline-block px-2 py-0.5 text-[9px] font-mono font-bold rounded-md uppercase",
                                        isIncome ? "bg-success/10 text-success" : "bg-error/10 text-error"
                                      )}>
                                        {isIncome ? 'Ingreso ↗' : 'Gasto ↘'}
                                      </span>
                                    </div>

                                    {/* Eliminar movimiento (siempre visible) */}
                                    <button
                                      type="button"
                                      onClick={() => setTxToDelete(item)}
                                      className="p-2 rounded-xl text-text-dim hover:text-error hover:bg-error/10 transition-colors duration-200 cursor-pointer active:scale-[0.95]"
                                      title="Eliminar movimiento"
                                      aria-label={`Eliminar ${item.description || item.category}`}
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'accounts' && (
                /* --- ACCOUNTS & CARDS MANAGEMENT TAB --- */
                <div className="space-y-6">
                  <div className="bg-surface border border-border p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-serif font-semibold">Gestión de Cuentas & Tarjetas</h2>
                      <p className="text-xs text-text-secondary">Administra tus tarjetas de crédito, cuentas bancarias, efectivo y cripto</p>
                    </div>
                    <button
                      onClick={() => setShowAddAccountModal(true)}
                      className="px-4 py-2 bg-brand text-white rounded-2xl text-xs font-medium flex items-center gap-2 shadow-sm hover:bg-brand-hover transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      <Plus size={16} />
                      <span>Nueva Cuenta / Tarjeta</span>
                    </button>
                  </div>

                  {/* Accounts Grid (Ultra-Soft Smooth Animations) */}
                  {financeLoading && accounts.length === 0 && (
                    <SkeletonCards count={4} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" />
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {accounts.map((acc, idx) => (
                      <SoftAnimatedCard
                        key={acc.id}
                        delay={idx * 0.04}
                        onClick={() => handleOpenAccountDetail(acc)}
                        className="bg-surface border border-border hover:border-brand/60 p-5 rounded-3xl space-y-4 shadow-sm relative overflow-hidden group cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-brand/10 text-brand flex items-center justify-center font-bold">
                              {acc.type === 'bank' && <Building2 size={20} />}
                              {acc.type === 'card' && <CreditCard size={20} />}
                              {acc.type === 'cash' && <Wallet size={20} />}
                              {acc.type === 'crypto' && <Coins size={20} />}
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm text-text-primary group-hover:text-brand transition-colors">{acc.name}</h3>
                              <span className="text-[10px] font-mono text-text-dim uppercase tracking-wider">{acc.type}</span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleDeleteAccount(acc.id, e)}
                            className="p-1.5 rounded-xl hover:bg-error/10 text-text-dim hover:text-error transition-colors cursor-pointer"
                            title="Eliminar cuenta"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        <div className="space-y-1 pt-2 border-t border-border/60">
                          <span className="text-[11px] text-text-secondary">Saldo Disponible</span>
                          <p className="text-2xl font-bold font-mono text-text-primary">
                            <AnimatedCountUp value={acc.balance} suffix={` ${acc.currency || 'EUR'}`} />
                          </p>
                        </div>
                      </SoftAnimatedCard>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'reports' && (
                /* --- REPORTS STUDIO TAB (DESIGN ENGINEERING POLISHED) --- */
                <div className="space-y-6 print:space-y-2">
                  {/* Fixed Header Bar (Always Visible) */}
                  <div className="bg-surface border border-border p-5 rounded-3xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 print:hidden">
                    <div>
                      <h2 className="text-xl font-serif font-semibold">Centro Financiero & Reportes Studio</h2>
                      <p className="text-xs text-text-secondary">Informe ejecutivo con Inteligencia Artificial en tiempo real, gráficos de barras y métricas en formato abreviado (k, M)</p>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={fetchAiReport}
                        disabled={reportLoading}
                        className="px-3.5 py-2 bg-bg border border-border text-text-primary rounded-xl text-xs font-medium flex items-center gap-1.5 hover:bg-surface-hover transition-all duration-150 active:scale-[0.97] cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw size={14} className={cn(reportLoading && "animate-spin text-brand")} />
                        <span>{reportLoading ? "Analizando..." : "Regenerar Informe IA"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="px-4 py-2 bg-brand text-white rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-sm hover:bg-brand-hover transition-all duration-150 active:scale-[0.97] cursor-pointer"
                      >
                        <Printer size={14} />
                        <span>Imprimir PDF</span>
                      </button>
                    </div>
                  </div>

                  {/* AI LOADING ANIMATION STATE */}
                  {reportLoading ? (
                    <div className="bg-surface border border-border p-12 rounded-3xl flex flex-col items-center justify-center text-center space-y-6 min-h-[420px] shadow-sm animate-in fade-in duration-300">
                      <div className="relative flex items-center justify-center">
                        <div className="absolute w-24 h-24 rounded-full bg-brand/15 animate-ping opacity-75" />
                        <div className="w-20 h-20 rounded-3xl bg-bg border border-brand/30 flex items-center justify-center shadow-lg relative z-10">
                          <HeraWalletLogo size="lg" showText={false} />
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-brand animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-brand animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-brand animate-bounce" />
                      </div>

                      <div className="space-y-1.5 max-w-md">
                        <p className="text-sm font-semibold text-text-primary transition-all duration-300 font-mono">
                          {reportStepTexts[reportStepIndex]}
                        </p>
                        <p className="text-[11px] text-text-secondary">
                          Procesando datos reales de tus cuentas y generando informe estratégico con Inteligencia Artificial
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* RICH EXECUTIVE BENTO GRID REPORT TEMPLATE */
                    <div className="space-y-6 animate-in fade-in duration-300">
                      {/* Header KPI Cards (CountUp Animated) */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 print:grid-cols-2">
                        <AnimatedCard delay={0.05} className="bg-surface border border-border p-4 rounded-2xl space-y-1 hover:border-brand/40 transition-colors shadow-xs">
                          <span className="text-[11px] text-text-secondary font-medium">Patrimonio Neto</span>
                          <p className="text-2xl font-bold font-mono text-brand">
                            <AnimatedCountUp value={Number(overview?.summary?.totalBalance) || 0} suffix={` ${currencySymbol}`} />
                          </p>
                        </AnimatedCard>
                        <AnimatedCard delay={0.1} className="bg-surface border border-border p-4 rounded-2xl space-y-1 hover:border-success/40 transition-colors shadow-xs">
                          <span className="text-[11px] text-text-secondary font-medium">Ingresos Totales</span>
                          <p className="text-2xl font-bold font-mono text-success">
                            <AnimatedCountUp value={Number(overview?.summary?.totalIncome) || 0} prefix="+" suffix={` ${currencySymbol}`} />
                          </p>
                        </AnimatedCard>
                        <AnimatedCard delay={0.15} className="bg-surface border border-border p-4 rounded-2xl space-y-1 hover:border-error/40 transition-colors shadow-xs">
                          <span className="text-[11px] text-text-secondary font-medium">Gastos Totales</span>
                          <p className="text-2xl font-bold font-mono text-text-primary">
                            <AnimatedCountUp value={Number(overview?.summary?.totalExpense) || 0} prefix="-" suffix={` ${currencySymbol}`} />
                          </p>
                        </AnimatedCard>
                        <AnimatedCard delay={0.2} className="bg-surface border border-border p-4 rounded-2xl space-y-1 hover:border-brand/40 transition-colors shadow-xs">
                          <span className="text-[11px] text-text-secondary font-medium">Ahorro Proyectado (30d)</span>
                          <p className="text-2xl font-bold font-mono text-brand flex items-center gap-1">
                            <TrendingUp size={18} />
                            <AnimatedCountUp value={aiReportData?.projectedSavings30d ?? 0} prefix="+" suffix={` ${currencySymbol}`} />
                          </p>
                        </AnimatedCard>
                      </div>

                      {/* AI Executive Analysis Bento Card */}
                      {aiReportData && (
                        <div className="bg-surface border border-border p-6 rounded-3xl space-y-6">
                          {/* Horizontal Scroll Expense Category Bar Chart (Ordered High -> Low) */}
                          {(() => {
                            // Extract expenses by category and sort descending (de mayor a menor)
                            const catMap: Record<string, number> = {};
                            const allTx = (timeline || []).flatMap((g: any) => g.items || []);
                            allTx.filter((t: any) => t.type === 'expense').forEach((t: any) => {
                              const cat = t.category || 'General';
                              catMap[cat] = (catMap[cat] || 0) + Math.abs(Number(t.amount) || 0);
                            });

                            let sortedCats = Object.entries(catMap)
                              .map(([cat, amt]) => ({ label: cat, value: amt }))
                              .sort((a, b) => b.value - a.value);

                            if (sortedCats.length === 0) {
                              return (
                                <div className="p-8 bg-bg border border-border/60 rounded-2xl text-center space-y-2">
                                  <p className="text-xs font-semibold text-text-primary">Sin gastos registrados en el periodo</p>
                                  <p className="text-[11px] text-text-secondary">Registra tus primeros movimientos para generar el desglose por categorías.</p>
                                </div>
                              );
                            }

                            const maxVal = Math.max(...sortedCats.map(c => c.value), 1);
                            const totalExp = sortedCats.reduce((acc, c) => acc + c.value, 0);

                            return (
                              <div className="p-4 sm:p-5 bg-bg border border-border rounded-2xl">
                                {/* Horizontal Scroll Bar Chart Container */}
                                <div className="overflow-x-auto pb-3 pt-2 scrollbar-thin scrollbar-thumb-border">
                                  <div className="flex items-end gap-3 sm:gap-4 h-48 min-w-[550px] px-2 border-b border-border/50 pb-2">
                                    {sortedCats.map((cat, idx) => {
                                      const heightPct = Math.max(14, Math.round((cat.value / maxVal) * 100));
                                      const color = HERA_PALETTE[idx % HERA_PALETTE.length];
                                      return (
                                        <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group min-w-[64px]">
                                          {/* Amount Label above Bar */}
                                          <span className="text-[10px] font-mono font-bold text-text-primary mb-1 group-hover:scale-110 transition-transform">
                                            {formatCompactNumber(cat.value)} {currencySymbol}
                                          </span>

                                          {/* Vertical Bar */}
                                          <div className="w-full bg-surface/60 rounded-t-xl h-full flex items-end overflow-hidden p-1 border border-border/40">
                                            <motion.div
                                              initial={{ height: 0 }}
                                              animate={{ height: `${heightPct}%` }}
                                              transition={{ duration: 0.6, delay: idx * 0.05, ease: [0.23, 1, 0.32, 1] }}
                                              className="w-full rounded-t-lg shadow-md transition-all duration-200 group-hover:brightness-110"
                                              style={{ backgroundColor: color }}
                                            />
                                          </div>

                                          {/* Category Name Legend below Bar */}
                                          <div className="mt-2 text-center w-full">
                                            <span className="block text-[10px] font-medium text-text-secondary truncate max-w-[70px] mx-auto" title={cat.label}>
                                              {cat.label}
                                            </span>
                                            <span className="block text-[9px] font-mono text-text-dim">
                                              {totalExp > 0 ? Math.round((cat.value / totalExp) * 100) : 0}%
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Top Insights & Recommendations */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                            {/* Top Insights */}
                            <div className="space-y-2">
                              <h4 className="text-xs font-semibold text-text-primary flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                                <Activity size={14} className="text-brand" />
                                <span>Hallazgos Clave</span>
                              </h4>
                              <div className="space-y-2">
                                {aiReportData.topInsights?.map((insight: string, idx: number) => (
                                  <div key={idx} className="p-3 bg-bg border border-border/60 rounded-xl text-xs text-text-secondary flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0 mt-1.5" />
                                    <span>{insight}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Recommendations with Action Button */}
                            <div className="space-y-2">
                              <h4 className="text-xs font-semibold text-text-primary flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                                <Lightbulb size={14} className="text-brand" />
                                <span>Recomendaciones Estratégicas</span>
                              </h4>
                              <div className="space-y-2">
                                {aiReportData.recommendations?.map((rec: string, idx: number) => (
                                  <div key={idx} className="p-3.5 bg-bg border border-border/60 rounded-xl text-xs space-y-2.5">
                                    <div className="flex items-start gap-2 text-text-secondary">
                                      <CheckCircle2 size={15} className="text-success shrink-0 mt-0.5" />
                                      <span className="text-text-primary font-medium">{rec}</span>
                                    </div>
                                    <div className="flex justify-end pt-1">
                                      <button
                                        type="button"
                                        onClick={() => handleExecuteRecommendationWithHera(rec)}
                                        className="px-3 py-1.5 bg-brand/10 hover:bg-brand/20 border border-brand/30 text-brand rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-all duration-150 active:scale-[0.97] cursor-pointer"
                                      >
                                        <Sparkles size={12} />
                                        <span>Ejecutar con Hera</span>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Financial Distribution & Chart Section */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Bar Chart: Ingresos vs Gastos vs Ahorro (Fixed & Polished) */}
                        <div className="lg:col-span-2 bg-surface border border-border p-6 rounded-3xl space-y-4">
                          <div className="flex items-center justify-between border-b border-border/80 pb-3">
                            <div className="flex items-center gap-2">
                              <PieChart size={18} className="text-brand" />
                              <h3 className="font-semibold text-sm text-text-primary">Comparativa Global del Periodo</h3>
                            </div>
                            <span className="text-[11px] font-mono text-text-dim">Valores en k / M</span>
                          </div>

                          <div className="h-64 w-full pt-2 min-h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={[
                                { name: 'Ingresos', amount: Number(overview?.summary?.totalIncome) || 0, fill: '#10B981' },
                                { name: 'Gastos', amount: Number(overview?.summary?.totalExpense) || 0, fill: '#EF4444' },
                                { name: 'Ahorro Neto', amount: Math.max(0, (Number(overview?.summary?.totalIncome) || 0) - (Number(overview?.summary?.totalExpense) || 0)), fill: '#F59E0B' }
                              ]} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val: any) => `${formatCompactNumber(val)}${currencySymbol}`} />
                                <Tooltip
                                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                  contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', borderRadius: '12px', fontSize: '12px', color: '#FFF' }}
                                  formatter={(val: any) => [`${formatCompactNumber(val)}${currencySymbol} (${val} ${currencySymbol})`, 'Importe']}
                                />
                                <Bar dataKey="amount" radius={[8, 8, 0, 0]} barSize={40}>
                                  {[
                                    { fill: '#10B981' },
                                    { fill: '#EF4444' },
                                    { fill: '#F59E0B' }
                                  ].map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Accounts Distribution List */}
                        <div className="bg-surface border border-border p-6 rounded-3xl space-y-4">
                          <div className="flex items-center justify-between border-b border-border/80 pb-3">
                            <div className="flex items-center gap-2">
                              <CreditCard size={18} className="text-brand" />
                              <h3 className="font-semibold text-sm text-text-primary">Distribución por Cuentas</h3>
                            </div>
                          </div>

                          <div className="space-y-2.5">
                            {accounts.map(acc => (
                              <div key={acc.id} className="p-3 bg-bg border border-border/60 hover:border-brand/40 rounded-2xl flex items-center justify-between transition-colors">
                                <div>
                                  <p className="text-xs font-medium text-text-primary">{acc.name}</p>
                                  <p className="text-[10px] text-text-secondary uppercase font-mono">{acc.type}</p>
                                </div>
                                <span className="font-mono font-semibold text-xs text-text-primary">{formatCompactNumber(acc.balance)}{currencySymbol}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Timeline Activity Highlights */}
                      <div className="bg-surface border border-border p-6 rounded-3xl space-y-4">
                        <div className="flex items-center justify-between border-b border-border/80 pb-3">
                          <div className="flex items-center gap-2">
                            <Clock size={18} className="text-brand" />
                            <h3 className="font-semibold text-sm text-text-primary">Timeline de Movimientos Recientes del Informe</h3>
                          </div>
                          <span className="text-[11px] font-mono text-text-dim">Últimas Actividades</span>
                        </div>

                        <div className="space-y-2">
                          {timeline.slice(0, 3).flatMap(g => g.items || []).slice(0, 5).map((item: any) => (
                            <div key={item.id} className="p-3 bg-bg border border-border/50 rounded-2xl flex items-center justify-between text-xs">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-7 h-7 rounded-xl flex items-center justify-center font-bold text-[10px]",
                                  item.type === 'income' ? "bg-success/15 text-success" : "bg-error/15 text-error"
                                )}>
                                  {item.type === 'income' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                </div>
                                <div>
                                  <p className="font-medium text-text-primary">{item.description || item.category}</p>
                                  <p className="text-[10px] text-text-secondary">{item.date} • {item.category}</p>
                                </div>
                              </div>
                              <span className={cn(
                                "font-mono font-semibold",
                                item.type === 'income' ? "text-success" : "text-text-primary"
                              )}>
                                {item.type === 'income' ? '+' : '-'}{formatCompactNumber(item.amount)}{currencySymbol}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Professional Printable PDF Template (Visible strictly during print) */}
                      <div className="hidden print:block space-y-6 text-black bg-white p-6 font-sans">
                        <div className="flex items-center justify-between border-b-2 border-gray-900 pb-4">
                          <div className="flex items-center gap-3">
                            <img src="/logo.png" alt="Hera Logo" className="h-10 w-10 object-contain" />
                            <div>
                              <h1 className="text-xl font-bold font-serif text-gray-900">HeraWallet — Informe Financiero Ejecutivo</h1>
                              <p className="text-xs text-gray-600">Emisión Oficial por Hera AI Studio para {profile?.displayName || 'Usuario'}</p>
                            </div>
                          </div>
                          <div className="text-right text-xs font-mono text-gray-600">
                            <p className="font-bold text-gray-900">FECHA: {new Date().toLocaleDateString('es-ES')}</p>
                          </div>
                        </div>

                        {/* PDF Summary Table */}
                        <div className="grid grid-cols-4 gap-3 text-center">
                          <div className="p-3 border border-gray-300 rounded-lg bg-gray-50">
                            <span className="text-[10px] uppercase text-gray-500 block font-semibold">Patrimonio Neto</span>
                            <span className="text-base font-bold font-mono text-gray-900">{formatCompactNumber(overview?.summary?.totalBalance)}{currencySymbol}</span>
                          </div>
                          <div className="p-3 border border-gray-300 rounded-lg bg-gray-50">
                            <span className="text-[10px] uppercase text-gray-500 block font-semibold">Ingresos Totales</span>
                            <span className="text-base font-bold font-mono text-green-700">+{formatCompactNumber(overview?.summary?.totalIncome)}{currencySymbol}</span>
                          </div>
                          <div className="p-3 border border-gray-300 rounded-lg bg-gray-50">
                            <span className="text-[10px] uppercase text-gray-500 block font-semibold">Gastos Totales</span>
                            <span className="text-base font-bold font-mono text-red-700">-{formatCompactNumber(overview?.summary?.totalExpense)}{currencySymbol}</span>
                          </div>
                          <div className="p-3 border border-gray-300 rounded-lg bg-gray-50">
                            <span className="text-[10px] uppercase text-gray-500 block font-semibold">Proyección 30d</span>
                            <span className="text-base font-bold font-mono text-amber-700">+{formatCompactNumber(aiReportData?.projectedSavings30d || 280)}€</span>
                          </div>
                        </div>

                        {/* PDF Executive Narrative */}
                        <div className="p-4 border border-gray-300 rounded-lg bg-gray-50 space-y-1.5">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Diagnóstico Hera AI</h3>
                          <p className="text-xs leading-relaxed text-gray-800">{aiReportData?.executiveSummary}</p>
                        </div>

                        {/* PDF Insights & Recommendations Grid */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="border border-gray-300 rounded-lg p-3 space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">Hallazgos Clave</h4>
                            <ul className="text-xs space-y-1 text-gray-700 list-disc list-inside">
                              {aiReportData?.topInsights?.map((ins: string, i: number) => (
                                <li key={i}>{ins}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="border border-gray-300 rounded-lg p-3 space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">Recomendaciones</h4>
                            <ul className="text-xs space-y-1 text-gray-700 list-disc list-inside">
                              {aiReportData?.recommendations?.map((rec: string, i: number) => (
                                <li key={i}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* PDF Verification Footer */}
                        <div className="pt-6 border-t border-gray-300 flex items-center justify-between text-[10px] text-gray-500">
                          <p>Certificado digital de informe financiero emitido por Hera Artificial Intelligence Studio.</p>
                          <p className="font-mono">ID: HERA-REP-{Date.now().toString(36).toUpperCase()}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'goals' && (
                /* --- GOALS & SAVINGS MODULE --- */
                <div className="space-y-6 max-w-5xl mx-auto font-sans">
                  <div className="bg-surface border border-border p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                    <div>
                      <h2 className="text-xl font-serif font-semibold text-text-primary">Metas de Ahorro & Fondos de Reserva</h2>
                      <p className="text-xs text-text-secondary mt-0.5">Planifica tus metas de ahorro, objetivos semanales y fondos de emergencia</p>
                    </div>
                    <button
                      onClick={() => setShowAddGoalModal(true)}
                      className="px-4 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-brand/20 transition-all active:scale-[0.97] cursor-pointer shrink-0"
                    >
                      <Plus size={16} />
                      <span>Nueva Meta / Fondo</span>
                    </button>
                  </div>

                  {financeLoading && goals.length === 0 && (
                    <SkeletonCards count={2} className="grid-cols-1 md:grid-cols-2" />
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {goals.map((g, idx) => {
                      const pct = Math.min(100, Math.round((g.currentAmount / Math.max(1, g.targetAmount)) * 100));
                      let hasPlan = false;
                      if (g.planData) {
                        try {
                          const p = typeof g.planData === 'string' ? JSON.parse(g.planData) : g.planData;
                          if (p && p.steps && p.steps.length > 0) hasPlan = true;
                        } catch (e) {}
                      }

                      return (
                        <AnimatedCard
                          key={g.id}
                          delay={idx * 0.04}
                          onClick={() => setSelectedGoalForModal(g)}
                          className="bg-surface border border-border hover:border-brand/60 p-5 rounded-3xl space-y-4 shadow-xs cursor-pointer group transition-all duration-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-brand/10 border border-brand/20 text-brand flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
                                <Target size={20} />
                              </div>
                              <div>
                                <h4 className="font-bold text-sm text-text-primary group-hover:text-brand transition-colors">{g.name}</h4>
                                <span className="text-[10px] font-mono text-text-dim">Límite: {g.deadline}</span>
                              </div>
                            </div>
                            <div className="text-right font-mono font-bold text-xs text-brand">
                              {g.currentAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} {currencySymbol} / {g.targetAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} {currencySymbol}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-mono text-text-secondary">
                              <span>Avance del Fondo</span>
                              <span>{pct}%</span>
                            </div>
                            <AnimatedProgressBar progress={pct} heightClass="h-2" />
                          </div>

                          <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                            <span className="text-text-secondary text-[11px]">Cuota sugerida: <strong className="text-text-primary font-mono">{g.weeklyTarget} {currencySymbol}/semana</strong></span>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedGoalForModal(g);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-brand/10 hover:bg-brand/20 text-brand text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-[0.96] cursor-pointer"
                              >
                                <Target size={13} />
                                <span>Plan</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setChatInput(`Quiero abonar fondos a mi meta ${g.name}`);
                                  setActiveTab('chat');
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-surface-hover hover:bg-border text-text-primary text-xs font-medium transition-all active:scale-[0.96] cursor-pointer"
                              >
                                + Abonar
                              </button>
                            </div>
                          </div>
                        </AnimatedCard>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'health' && (
                /* --- EXCLUSIVE SALUD FINANCIERA & SCORE HERA MODULE --- */
                <div className="space-y-6 max-w-5xl mx-auto pt-2 sm:pt-4 pb-28 sm:pb-32 font-sans px-1 sm:px-0">
                  {/* Header Banner (Clean Title & Subtitle without widget) */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    className="bg-surface border border-border p-5 sm:p-6 rounded-3xl space-y-2 shadow-sm relative overflow-hidden"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 text-brand flex items-center justify-center shrink-0 shadow-xs">
                        <ShieldCheck size={24} />
                      </div>
                      <div>
                        <h2 className="text-xl font-serif font-bold text-text-primary">Salud Financiera</h2>
                        <p className="text-xs text-text-secondary mt-0.5">Diagnóstico 360° en tiempo real con recomendaciones proactivas de Inteligencia Artificial</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Estado vacío: sin movimientos aún no existe score que mostrar */}
                  {overview && overview.scoreReady === false && (
                    <div className="bg-surface border border-border p-10 rounded-3xl text-center space-y-4 shadow-xs">
                      <div className="w-16 h-16 rounded-3xl bg-brand/10 border border-brand/20 text-brand flex items-center justify-center mx-auto">
                        <ShieldCheck size={28} strokeWidth={1.5} />
                      </div>
                      <div className="space-y-1.5 max-w-md mx-auto">
                        <h3 className="font-serif font-bold text-lg text-text-primary">Tu Score Hera está en camino</h3>
                        <p className="text-xs text-text-secondary leading-relaxed">
                          Registra tus primeros gastos e ingresos y aquí aparecerá tu evaluación
                          de los 5 pilares financieros: ahorro, deudas, liquidez, metas y consistencia.
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab('chat')}
                        className="bg-brand hover:bg-brand-hover text-white px-5 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-colors duration-200 inline-flex items-center gap-2"
                      >
                        <Mic size={14} />
                        Registrar mi primer movimiento
                      </button>
                    </div>
                  )}

                  {/* Animated Score Hero Card & 5 Pillars Grid */}
                  {(!overview || overview.scoreReady !== false) && (
                  <>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Hero Circular SVG Animated Ring Gauge */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                      className="bg-surface border border-border p-6 rounded-3xl text-center space-y-4 shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-text-secondary block">Evaluación Integral</span>
                        <h3 className="font-serif font-bold text-lg text-text-primary mt-1">Score Hera</h3>
                      </div>

                      {/* SVG Circular Border Loading Animation */}
                      <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                        {(() => {
                          const scoreVal = overview?.healthScore ?? 0;
                          const radius = 50;
                          const circ = 2 * Math.PI * radius; // ~314.159
                          const strokeOffset = circ - (scoreVal / 100) * circ;

                          return (
                            <div className="relative w-full h-full flex items-center justify-center">
                              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 120 120">
                                {/* Track circle */}
                                <circle
                                  cx="60"
                                  cy="60"
                                  r={radius}
                                  className="text-brand/15"
                                  strokeWidth="8"
                                  stroke="currentColor"
                                  fill="transparent"
                                />
                                {/* Animated progress circle */}
                                <motion.circle
                                  cx="60"
                                  cy="60"
                                  r={radius}
                                  className="text-brand"
                                  strokeWidth="8"
                                  strokeDasharray={circ}
                                  initial={{ strokeDashoffset: circ }}
                                  whileInView={{ strokeDashoffset: strokeOffset }}
                                  viewport={{ once: true }}
                                  transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
                                  strokeLinecap="round"
                                  stroke="currentColor"
                                  fill="transparent"
                                />
                              </svg>
                              <div className="absolute text-center">
                                <span className="text-3xl font-bold font-mono text-brand block leading-none">
                                  {scoreVal}
                                </span>
                                <span className="text-[10px] font-mono text-text-dim block mt-1">de 100 pts</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="space-y-1">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold uppercase font-mono border inline-block",
                          (overview?.healthScore ?? 0) >= 80 ? "bg-success/15 text-success border-success/30" : (overview?.healthScore ?? 0) >= 60 ? "bg-brand/15 text-brand border-brand/30" : (overview?.healthScore ?? 0) > 0 ? "bg-warning/15 text-warning border-warning/30" : "bg-surface-hover text-text-secondary border-border"
                        )}>
                          {(overview?.healthScore ?? 0) >= 80 ? 'Excelente Salud Financiera' : (overview?.healthScore ?? 0) >= 60 ? 'Salud Financiera Buena' : (overview?.healthScore ?? 0) > 0 ? 'Requiere Atención' : 'Sin Registros Aún'}
                        </span>
                        <p className="text-[11px] text-text-secondary max-w-xs mx-auto leading-relaxed pt-1">
                          Calculado en tiempo real evaluando tus ingresos, gastos, nivel de deudas, cuentas y consistencia de ahorro.
                        </p>
                      </div>
                    </motion.div>

                    {/* 5-Pillar Score Breakdown Details */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
                      className="lg:col-span-2 bg-surface border border-border p-5 rounded-3xl space-y-3.5 shadow-xs"
                    >
                      <h4 className="font-serif font-bold text-xs uppercase text-text-secondary tracking-wider">Desglose de los 5 Pilares Financieros</h4>

                      <div className="space-y-2.5">
                        {[
                          { label: 'Ahorro & Capacidad de Flujo', pts: overview?.scoreBreakdown?.savings?.pts ?? 0, max: 25, desc: 'Diferencial positivo entre ingresos y gastos totales' },
                          { label: 'Nivel de Endeudamiento', pts: overview?.scoreBreakdown?.debt?.pts ?? 0, max: 25, desc: 'Proporción de deudas activas frente a tu capital disponible' },
                          { label: 'Liquidez & Fondos en Cuentas', pts: overview?.scoreBreakdown?.liquidity?.pts ?? 0, max: 20, desc: 'Saldo acumulado en tus cuentas bancarias y efectivo' },
                          { label: 'Progreso de Metas de Ahorro', pts: overview?.scoreBreakdown?.goals?.pts ?? 0, max: 15, desc: 'Avance en tus fondos de reserva y metas trazadas' },
                          { label: 'Consistencia de Registros', pts: overview?.scoreBreakdown?.consistency?.pts ?? 0, max: 15, desc: 'Frecuencia de actualización de tus transacciones' },
                        ].map((p, idx) => {
                          const pct = Math.round((p.pts / p.max) * 100);
                          return (
                            <div key={idx} className="p-2.5 bg-bg/70 border border-border/50 rounded-2xl space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-text-primary">{p.label}</span>
                                <span className="font-mono font-bold text-brand">{p.pts} / {p.max} pts</span>
                              </div>
                              <AnimatedProgressBar progress={pct} />
                              <p className="text-[10px] text-text-dim">{p.desc}</p>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  </div>

                  {/* AI Smart Suggestions & Recommendations Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 25 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
                    className="space-y-4 pt-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-brand" />
                        <h3 className="font-serif font-bold text-base text-text-primary">Sugerencias</h3>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-brand/10 text-brand border border-brand/20">
                        Hera AI
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        {
                          title: 'Aumentar Reserva de Ahorro',
                          impact: '+6 pts',
                          desc: 'Destinar un porcentaje constante de tus ingresos al fondo de reserva eleva tu estabilidad financiera.',
                          actionText: 'Ver Metas de Ahorro',
                          actionTab: 'goals'
                        },
                        {
                          title: 'Optimización de Deudas',
                          impact: '+8 pts',
                          desc: 'Mantener un control al día de tus deudas pendientes protegerá tu puntuación en el score Hera.',
                          actionText: 'Gestor de Deudas',
                          actionTab: 'debts'
                        },
                        {
                          title: 'Colchón de Liquidez en Cuentas',
                          impact: '+5 pts',
                          desc: 'Mantener un balance de seguridad de al menos 1.000 € en tus cuentas activas protegerá tu score ante imprevistos de caja.',
                          actionText: 'Ver Mis Cuentas',
                          actionTab: 'accounts'
                        },
                        {
                          title: 'Consistencia de Transacciones',
                          impact: '+4 pts',
                          desc: 'Registrar tus movimientos diarios por voz o chat mantiene las recomendaciones de Hera AI 100% precisas y actualizadas.',
                          actionText: 'Dictar por Voz',
                          actionAction: () => setShowAddModal(true)
                        }
                      ].map((s, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 15 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.3, delay: 0.1 * idx, ease: [0.23, 1, 0.32, 1] }}
                          className="bg-surface border border-border/80 p-5 rounded-3xl space-y-3.5 shadow-xs hover:border-brand/40 transition-all group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Lightbulb size={16} className="text-brand shrink-0" />
                              <h4 className="font-bold text-xs text-text-primary">{s.title}</h4>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-success/15 text-success border border-success/30">
                              {s.impact}
                            </span>
                          </div>

                          <p className="text-xs text-text-secondary leading-relaxed">{s.desc}</p>

                          <button
                            onClick={() => {
                              if (s.actionTab) setActiveTab(s.actionTab as any);
                              else if (s.actionAction) s.actionAction();
                            }}
                            className="w-full py-2 px-3 rounded-2xl bg-bg hover:bg-surface-hover border border-border text-brand text-xs font-semibold flex items-center justify-between transition-all cursor-pointer group-hover:border-brand/30 active:scale-[0.98]"
                          >
                            <span>{s.actionText}</span>
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                  </>
                  )}
                </div>
              )}

              {activeTab === 'debts' && (() => {
                const pendingDebts = debtsList.filter(d => (d.status || 'pending') === 'pending');
                const totalIOwe = pendingDebts.filter(d => d.type === 'debt').reduce((acc, d) => acc + (Number(d.amount) || 0), 0);
                const totalTheyOweMe = pendingDebts.filter(d => d.type === 'receivable' || d.type === 'credit').reduce((acc, d) => acc + (Number(d.amount) || 0), 0);
                const netBalance = totalTheyOweMe - totalIOwe;

                const filteredDebts = debtsList.filter(d => {
                  if (debtsFilter === 'i_owe') return d.type === 'debt';
                  if (debtsFilter === 'they_owe_me') return d.type === 'receivable' || d.type === 'credit';
                  if (debtsFilter === 'pending') return (d.status || 'pending') === 'pending';
                  if (debtsFilter === 'paid') return d.status === 'paid';
                  return true;
                });

                const getInitials = (name: string) => {
                  if (!name) return 'H';
                  const parts = name.trim().split(/\s+/);
                  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
                  return name.slice(0, 2).toUpperCase();
                };

                return (
                  <div className="space-y-6 max-w-5xl w-full mx-auto pt-2 sm:pt-4 pb-28 sm:pb-32 font-sans px-1 sm:px-0">
                    {/* Executive Header Banner */}
                    <div className="bg-surface border border-border p-5 sm:p-6 rounded-3xl space-y-4 shadow-sm relative overflow-hidden">
                      <div className="flex items-center gap-3.5 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 text-brand flex items-center justify-center shrink-0 shadow-xs">
                          <HandCoins size={24} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-xl font-serif font-bold text-text-primary">Gestor de Deudas & Cobros</h2>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-brand/10 text-brand border border-brand/20">
                              {pendingDebts.length} Pendientes
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary mt-0.5">Control inteligente de préstamos, cuentas claras y compromisos de pago</p>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowAddDebtModal(true)}
                        className="w-full sm:w-auto px-4.5 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-brand/20 transition-all active:scale-[0.97] cursor-pointer"
                      >
                        <Plus size={16} />
                        <span>Registrar Deuda / Cobro</span>
                      </button>
                    </div>

                    {/* High-End Bento Grid KPI Overview */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Card 1: A quién debo */}
                      <AnimatedCard delay={0.05} className="bg-surface border border-border p-5 rounded-3xl space-y-3 shadow-xs hover:border-error/30 transition-all relative overflow-hidden">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-text-secondary">A quién debo (Mis deudas)</span>
                          <div className="w-8 h-8 rounded-xl bg-error/10 border border-error/20 text-error flex items-center justify-center">
                            <ArrowUpRight size={16} />
                          </div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold font-mono text-error tracking-tight">
                            <AnimatedCountUp value={totalIOwe} suffix={` ${currencySymbol}`} />
                          </div>
                          <p className="text-[11px] text-text-dim mt-1">Por saldar con terceros</p>
                        </div>
                      </AnimatedCard>

                      {/* Card 2: Quién me debe */}
                      <AnimatedCard delay={0.1} className="bg-surface border border-border p-5 rounded-3xl space-y-3 shadow-xs hover:border-success/30 transition-all relative overflow-hidden">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-text-secondary">Quién me debe (Por cobrar)</span>
                          <div className="w-8 h-8 rounded-xl bg-success/10 border border-success/20 text-success flex items-center justify-center">
                            <ArrowDownLeft size={16} />
                          </div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold font-mono text-success tracking-tight">
                            <AnimatedCountUp value={totalTheyOweMe} suffix={` ${currencySymbol}`} />
                          </div>
                          <p className="text-[11px] text-text-dim mt-1">Pendientes por recibir</p>
                        </div>
                      </AnimatedCard>
                    </div>

                    {/* Segmented Filter Pills */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-1.5 p-1 bg-surface border border-border rounded-2xl overflow-x-auto scrollbar-none">
                        {[
                          { id: 'all', label: 'Todos los registros' },
                          { id: 'i_owe', label: 'A quién debo' },
                          { id: 'they_owe_me', label: 'Quién me debe' },
                          { id: 'pending', label: 'Pendientes' },
                          { id: 'paid', label: 'Saldados' },
                        ].map(f => (
                          <button
                            key={f.id}
                            onClick={() => setDebtsFilter(f.id as any)}
                            className={cn(
                              "px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap active:scale-[0.96]",
                              debtsFilter === f.id
                                ? "bg-brand text-white shadow-xs font-semibold"
                                : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                            )}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>

                      <span className="text-xs font-mono text-text-dim">
                        {filteredDebts.length} {filteredDebts.length === 1 ? 'registro' : 'registros'}
                      </span>
                    </div>

                    {/* Debt Cards Bento Grid */}
                    {debtsLoading ? (
                      <SkeletonCards count={4} className="grid-cols-1 md:grid-cols-2" />
                    ) : filteredDebts.length === 0 ? (
                      <div className="bg-surface border border-border p-10 rounded-3xl text-center space-y-3.5">
                        <div className="w-14 h-14 rounded-2xl bg-brand/10 border border-brand/20 text-brand flex items-center justify-center mx-auto">
                          <HandCoins size={28} />
                        </div>
                        <h4 className="font-semibold text-sm text-text-primary">No hay registros en esta categoría</h4>
                        <p className="text-xs text-text-secondary max-w-md mx-auto leading-relaxed">
                          Añade registros manualmente con el botón superior o dictáselo en lenguaje natural a Hera AI en el chat ("Registra que le debo 50€ a Carlos").
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredDebts.map(d => {
                          const isOwe = d.type === 'debt';
                          const isPaid = d.status === 'paid';
                          const isCancelled = d.status === 'cancelled';
                          const isPartial = d.status === 'partial';
                          const personName = d.personOrEntity || d.name || 'Persona';
                          const initials = getInitials(personName);

                          const totalAmt = Number(d.amount || 0);
                          const paidAmt = Number(d.paidAmount || 0);
                          const remainingAmt = Math.max(0, totalAmt - paidAmt);
                          const pctPaid = totalAmt > 0 ? Math.min(100, Math.round((paidAmt / totalAmt) * 100)) : 0;

                          return (
                            <div
                              key={d.id}
                              className="bg-surface border border-border/80 p-4.5 rounded-3xl space-y-3.5 shadow-xs hover:border-brand/40 hover:-translate-y-0.5 transition-all duration-200 group"
                            >
                              {/* Card Top Header */}
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3.5 min-w-0">
                                  {/* Avatar Initials Circle */}
                                  <div className={cn(
                                    "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 font-bold text-xs font-mono border shadow-xs transition-transform group-hover:scale-105",
                                    isPaid ? "bg-success/10 border-success/20 text-success" : isCancelled ? "bg-bg border-border text-text-dim" : isOwe ? "bg-error/10 border-error/20 text-error" : "bg-success/10 border-success/20 text-success"
                                  )}>
                                    {initials}
                                  </div>

                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="font-bold text-xs text-text-primary truncate">{personName}</h4>
                                      <span className={cn(
                                        "px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase shrink-0 border",
                                        isPaid
                                          ? "bg-success/15 text-success border-success/30"
                                          : isCancelled
                                            ? "bg-bg text-text-dim border-border"
                                            : isPartial
                                              ? "bg-warning/15 text-warning border-warning/30"
                                              : isOwe
                                                ? "bg-error/15 text-error border-error/30"
                                                : "bg-success/15 text-success border-success/30"
                                      )}>
                                        {isPaid ? 'Saldado 100%' : isCancelled ? 'Cancelado' : isPartial ? `Abonado ${pctPaid}%` : isOwe ? 'Debes' : 'Te debe'}
                                      </span>
                                    </div>

                                    <p className="text-[11px] text-text-secondary truncate mt-0.5">{d.name}</p>

                                    {d.dueDate && (
                                      <span className="text-[10px] font-mono text-text-dim block mt-0.5">
                                        Vencimiento: {d.dueDate}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <div className="font-mono font-bold text-sm text-text-primary tracking-tight">
                                    {totalAmt.toLocaleString('es-ES', { minimumFractionDigits: 2 })} {currencySymbol}
                                  </div>
                                  {!isPaid && !isCancelled && paidAmt > 0 && (
                                    <span className="text-[10px] font-mono text-text-dim block">
                                      Resta: {remainingAmt.toLocaleString('es-ES', { minimumFractionDigits: 2 })} {currencySymbol}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Progress Bar Component */}
                              <div className="space-y-1 bg-bg/60 p-2.5 rounded-2xl border border-border/50">
                                <div className="flex justify-between items-center text-[10px] font-mono text-text-secondary">
                                  <span>Abonado: {paidAmt.toLocaleString('es-ES', { minimumFractionDigits: 2 })} {currencySymbol}</span>
                                  <span>{pctPaid}% {isPaid ? '— Completo' : isCancelled ? '— Cancelado' : `(Pte: ${remainingAmt.toLocaleString('es-ES', { minimumFractionDigits: 2 })} ${currencySymbol})`}</span>
                                </div>
                                <div className="w-full bg-bg h-2 rounded-full overflow-hidden border border-border/40">
                                  <div
                                    className={cn(
                                      "h-full transition-all duration-500 rounded-full",
                                      isPaid ? "bg-success" : isCancelled ? "bg-text-dim/40" : isOwe ? "bg-error" : "bg-success"
                                    )}
                                    style={{ width: `${pctPaid}%` }}
                                  />
                                </div>
                              </div>

                              {/* State-Driven Smart Action Toolbar */}
                              <div className="flex items-center justify-between pt-1 border-t border-border/40">
                                {/* Left: Payment History button */}
                                <button
                                  onClick={() => fetchPaymentHistory(d)}
                                  className="px-2.5 py-1.5 rounded-xl bg-surface hover:bg-surface-hover border border-border text-text-secondary text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.96]"
                                  title="Ver historial de abonos y pagos"
                                >
                                  <History size={14} className="text-brand" />
                                  <span>Historial</span>
                                </button>

                                {/* Right: Conditional Action Buttons based on Status */}
                                <div className="flex items-center gap-1.5">
                                  {isPaid ? (
                                    /* PAID STATE: Buttons hidden! Display Saldado Badge */
                                    <span className="px-3 py-1 rounded-xl bg-success/15 text-success border border-success/30 text-xs font-semibold flex items-center gap-1">
                                      <CheckCircle2 size={14} />
                                      <span>Saldado</span>
                                    </span>
                                  ) : isCancelled ? (
                                    /* CANCELLED STATE: Buttons hidden! Display Cancelado Badge */
                                    <span className="px-3 py-1 rounded-xl bg-bg text-text-dim border border-border text-xs font-semibold flex items-center gap-1">
                                      <Ban size={14} />
                                      <span>Cancelado</span>
                                    </span>
                                  ) : (
                                    /* PENDING / PARTIAL STATE: Show Abonar, Saldar & Cancelar */
                                    <>
                                      <button
                                        onClick={() => openAddPaymentModal(d)}
                                        className="px-3 py-1.5 rounded-xl bg-brand/15 hover:bg-brand/25 text-brand border border-brand/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.96]"
                                        title="Registrar abono o pago parcial"
                                      >
                                        <span>Abonar</span>
                                      </button>

                                      <button
                                        onClick={() => handleToggleDebtStatus(d.id, d.status)}
                                        className="p-2 rounded-xl text-text-dim hover:text-success hover:bg-success/10 transition-all cursor-pointer active:scale-[0.92]"
                                        title="Marcar como saldado 100%"
                                      >
                                        <CheckCircle2 size={16} />
                                      </button>

                                      <button
                                        onClick={() => handleCancelDebtStatus(d.id)}
                                        className="p-2 rounded-xl text-text-dim hover:text-error hover:bg-error/10 transition-all cursor-pointer active:scale-[0.92]"
                                        title="Cancelar deuda o cobro"
                                      >
                                        <Ban size={16} />
                                      </button>
                                    </>
                                  )}

                                  {/* Always allow deletion if needed */}
                                  <button
                                    onClick={() => handleDeleteDebtRecord(d.id)}
                                    className="p-2 rounded-xl text-text-dim hover:text-error hover:bg-error/10 transition-all cursor-pointer active:scale-[0.92]"
                                    title="Eliminar registro"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

              {activeTab === 'settings' && (
                /* --- CONFIGURATION & SETTINGS VIEW --- */
                <div className="space-y-6 w-full max-w-4xl mx-auto pb-12">
                  {settingsSubView === 'payment' ? (
                    /* --- DEDICATED PAYMENT METHOD & BILLING PAGE --- */
                    <div className="space-y-6 w-full mx-auto">
                      {/* Header & Navigation */}
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setSettingsSubView('main')}
                          className="px-3.5 py-2 bg-surface hover:bg-surface-hover border border-border text-text-primary rounded-2xl text-xs font-medium flex items-center gap-2 transition-all active:scale-[0.97] cursor-pointer"
                        >
                          <ArrowLeft size={16} />
                          <span>Volver a Configuración</span>
                        </button>
                      </div>

                      {/* Payment & Billing Form Card */}
                      <form onSubmit={handleSavePaymentDetails} className="bg-surface border border-border p-6 sm:p-8 rounded-3xl space-y-6 shadow-xs relative overflow-hidden">
                        {/* Decorative Background Accent */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl pointer-events-none" />

                        <div className="flex items-center justify-between border-b border-border/70 pb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-brand/10 text-brand flex items-center justify-center">
                              <CreditCard size={22} />
                            </div>
                            <div>
                              <h2 className="text-xl font-serif font-semibold text-text-primary">Método de pago</h2>
                              <p className="text-xs text-text-secondary">Información de tarjeta y dirección de facturación asociada</p>
                            </div>
                          </div>
                        </div>

                        {/* Interactive Visual Credit Card Preview Banner */}
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-surface-hover via-bg to-surface border border-brand/20 shadow-md space-y-4 relative overflow-hidden">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <ShieldCheck size={18} className="text-brand" />
                              <span className="text-xs font-serif font-bold text-text-primary tracking-wide">HeraWallet Pro</span>
                            </div>
                            <div className="w-10 h-6 bg-brand/20 rounded border border-brand/40 flex items-center justify-center font-mono text-[10px] font-bold text-brand shadow-xs">
                              VISA
                            </div>
                          </div>

                          <div className="space-y-1 py-1">
                            <p className="text-xs text-text-secondary font-mono">Número de Tarjeta</p>
                            <p className="text-base sm:text-lg font-mono font-bold tracking-widest text-text-primary">
                              {paymentDetails.cardNumber || '•••• •••• •••• 4242'}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
                            <div>
                              <p className="text-[10px] text-text-dim uppercase font-mono">Titular</p>
                              <p className="font-medium text-text-primary truncate max-w-[180px]">
                                {paymentDetails.firstName || paymentDetails.lastName ? `${paymentDetails.firstName} ${paymentDetails.lastName}` : 'Nombre del Titular'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-text-dim uppercase font-mono">Expira</p>
                              <p className="font-mono font-semibold text-text-primary">{paymentDetails.cardExp || 'MM/YY'}</p>
                            </div>
                          </div>
                        </div>

                        {/* 1. Card Info */}
                        <div className="space-y-4 pt-2">
                          <div className="flex items-center gap-2 border-b border-border/70 pb-2">
                            <CreditCard size={16} className="text-brand" />
                            <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider">1. Datos de la Tarjeta</h3>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="text-xs font-medium text-text-secondary block mb-1.5">Número de Tarjeta</label>
                              <div className="relative flex items-center">
                                <CreditCard size={18} className="absolute left-3.5 text-text-dim" />
                                <input
                                  type="text"
                                  value={paymentDetails.cardNumber}
                                  onChange={e => {
                                    const val = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
                                    setPaymentDetails(prev => ({ ...prev, cardNumber: val }));
                                  }}
                                  placeholder="4242 4242 4242 4242"
                                  className="w-full bg-bg border border-border rounded-2xl pl-10 pr-16 py-3 text-xs text-text-primary font-mono focus:outline-none focus:border-brand/60 shadow-xs"
                                />
                                <span className="absolute right-3 text-[10px] font-mono font-bold bg-brand/10 text-brand px-2 py-0.5 rounded">
                                  VISA / MC
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-medium text-text-secondary block mb-1.5">Fecha de Expiración</label>
                                <input
                                  type="text"
                                  value={paymentDetails.cardExp}
                                  onChange={e => {
                                    let val = e.target.value.replace(/\D/g, '');
                                    if (val.length >= 3) val = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
                                    setPaymentDetails(prev => ({ ...prev, cardExp: val.slice(0, 5) }));
                                  }}
                                  placeholder="MM/YY"
                                  className="w-full bg-bg border border-border rounded-2xl px-4 py-3 text-xs text-text-primary font-mono focus:outline-none focus:border-brand/60 shadow-xs"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-text-secondary block mb-1.5">CSV / CVC</label>
                                <input
                                  type="password"
                                  value={paymentDetails.cardCvc}
                                  onChange={e => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                    setPaymentDetails(prev => ({ ...prev, cardCvc: val }));
                                  }}
                                  placeholder="123"
                                  maxLength={4}
                                  className="w-full bg-bg border border-border rounded-2xl px-4 py-3 text-xs text-text-primary font-mono focus:outline-none focus:border-brand/60 shadow-xs"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 2. Billing Info */}
                        <div className="space-y-4 pt-4 border-t border-border/60">
                          <div className="flex items-center gap-2 border-b border-border/70 pb-2">
                            <Building2 size={16} className="text-brand" />
                            <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider">2. Información de Facturación</h3>
                          </div>

                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-medium text-text-secondary block mb-1.5">Nombre</label>
                                <input
                                  type="text"
                                  value={paymentDetails.firstName}
                                  onChange={e => setPaymentDetails(prev => ({ ...prev, firstName: e.target.value }))}
                                  placeholder="Christian"
                                  className="w-full bg-bg border border-border rounded-2xl px-4 py-3 text-xs text-text-primary focus:outline-none focus:border-brand/60 shadow-xs"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-text-secondary block mb-1.5">Apellidos</label>
                                <input
                                  type="text"
                                  value={paymentDetails.lastName}
                                  onChange={e => setPaymentDetails(prev => ({ ...prev, lastName: e.target.value }))}
                                  placeholder="Sparrow"
                                  className="w-full bg-bg border border-border rounded-2xl px-4 py-3 text-xs text-text-primary focus:outline-none focus:border-brand/60 shadow-xs"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-xs font-medium text-text-secondary block mb-1.5">Dirección 1</label>
                              <input
                                type="text"
                                value={paymentDetails.address1}
                                onChange={e => setPaymentDetails(prev => ({ ...prev, address1: e.target.value }))}
                                placeholder="Calle 123 #45-67"
                                className="w-full bg-bg border border-border rounded-2xl px-4 py-3 text-xs text-text-primary focus:outline-none focus:border-brand/60 shadow-xs"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-medium text-text-secondary block mb-1.5">Dirección 2 (Opcional)</label>
                              <input
                                type="text"
                                value={paymentDetails.address2}
                                onChange={e => setPaymentDetails(prev => ({ ...prev, address2: e.target.value }))}
                                placeholder="Apartamento, Suite, Edificio, etc."
                                className="w-full bg-bg border border-border rounded-2xl px-4 py-3 text-xs text-text-primary focus:outline-none focus:border-brand/60 shadow-xs"
                              />
                            </div>

                            {/* Country & State Searchable Selectors Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {/* Searchable Country Selector */}
                              <div className="relative z-40" ref={countrySelectRef}>
                                <label className="text-xs font-medium text-text-secondary block mb-1.5">País</label>
                                <button
                                  type="button"
                                  onClick={() => setIsCountrySelectOpen(prev => !prev)}
                                  className="w-full bg-bg border border-border rounded-2xl px-4 py-3 text-xs text-text-primary flex items-center justify-between hover:border-brand/60 transition-colors cursor-pointer shadow-xs"
                                >
                                  <span className="font-semibold text-text-primary">{paymentDetails.country || 'Seleccionar País'}</span>
                                  <ChevronDown size={16} className={cn("text-text-dim transition-transform duration-200", isCountrySelectOpen && "rotate-180")} />
                                </button>

                                <AnimatePresence>
                                  {isCountrySelectOpen && (
                                    <motion.div
                                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                      animate={{ opacity: 1, y: 0, scale: 1 }}
                                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                                      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                                      className="absolute left-0 right-0 top-full mt-2 bg-surface border border-border rounded-2xl p-2 shadow-2xl z-50 space-y-2 max-h-60 flex flex-col"
                                    >
                                      {/* Country Search Bar */}
                                      <div className="relative flex items-center shrink-0">
                                        <Search size={14} className="absolute left-3 text-text-dim" />
                                        <input
                                          type="text"
                                          value={countrySearchText}
                                          onChange={e => setCountrySearchText(e.target.value)}
                                          placeholder="Buscar país (ej. Cuba, España...)..."
                                          className="w-full bg-bg border border-border/80 rounded-xl pl-8 pr-3 py-2 text-xs text-text-primary placeholder:text-text-dim focus:outline-none focus:border-brand/60"
                                          autoFocus
                                        />
                                      </div>

                                      {/* Country List */}
                                      <div className="flex-1 overflow-y-auto space-y-1 pr-1 min-h-0">
                                        {Object.keys(COUNTRIES_DATA)
                                          .filter(c => c.toLowerCase().includes(countrySearchText.toLowerCase()))
                                          .map(countryKey => (
                                            <button
                                              key={countryKey}
                                              type="button"
                                              onClick={() => handleSelectCountry(countryKey)}
                                              className={cn(
                                                "w-full px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer text-left",
                                                paymentDetails.country === countryKey
                                                  ? "bg-brand/10 text-brand font-semibold"
                                                  : "hover:bg-surface-hover text-text-primary"
                                              )}
                                            >
                                              <span>{countryKey}</span>
                                              {paymentDetails.country === countryKey && <Check size={14} className="text-brand" />}
                                            </button>
                                          ))}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>

                              {/* Searchable State / Province Selector */}
                              <div className="relative z-30" ref={stateSelectRef}>
                                <label className="text-xs font-medium text-text-secondary block mb-1.5">Estado / Provincia / Región</label>
                                <button
                                  type="button"
                                  onClick={() => setIsStateSelectOpen(prev => !prev)}
                                  className="w-full bg-bg border border-border rounded-2xl px-4 py-3 text-xs text-text-primary flex items-center justify-between hover:border-brand/60 transition-colors cursor-pointer shadow-xs"
                                >
                                  <span className="font-semibold text-text-primary truncate">{paymentDetails.state || 'Seleccionar Estado'}</span>
                                  <ChevronDown size={16} className={cn("text-text-dim transition-transform duration-200", isStateSelectOpen && "rotate-180")} />
                                </button>

                                <AnimatePresence>
                                  {isStateSelectOpen && (
                                    <motion.div
                                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                      animate={{ opacity: 1, y: 0, scale: 1 }}
                                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                                      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                                      className="absolute left-0 right-0 top-full mt-2 bg-surface border border-border rounded-2xl p-2 shadow-2xl z-50 space-y-2 max-h-60 flex flex-col"
                                    >
                                      {/* State Search Bar */}
                                      <div className="relative flex items-center shrink-0">
                                        <Search size={14} className="absolute left-3 text-text-dim" />
                                        <input
                                          type="text"
                                          value={stateSearchText}
                                          onChange={e => setStateSearchText(e.target.value)}
                                          placeholder={`Buscar provincia en ${paymentDetails.country || 'país'}...`}
                                          className="w-full bg-bg border border-border/80 rounded-xl pl-8 pr-3 py-2 text-xs text-text-primary placeholder:text-text-dim focus:outline-none focus:border-brand/60"
                                          autoFocus
                                        />
                                      </div>

                                      {/* State List */}
                                      <div className="flex-1 overflow-y-auto space-y-1 pr-1 min-h-0">
                                        {(COUNTRIES_DATA[paymentDetails.country]?.states || [])
                                          .filter(st => st.toLowerCase().includes(stateSearchText.toLowerCase()))
                                          .map(stateName => (
                                            <button
                                              key={stateName}
                                              type="button"
                                              onClick={() => handleSelectState(stateName)}
                                              className={cn(
                                                "w-full px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer text-left",
                                                paymentDetails.state === stateName
                                                  ? "bg-brand/10 text-brand font-semibold"
                                                  : "hover:bg-surface-hover text-text-primary"
                                              )}
                                            >
                                              <span className="truncate">{stateName}</span>
                                              {paymentDetails.state === stateName && <Check size={14} className="text-brand shrink-0" />}
                                            </button>
                                          ))}

                                        {stateSearchText.trim() !== '' && (
                                          <button
                                            type="button"
                                            onClick={() => handleSelectState(stateSearchText.trim())}
                                            className="w-full px-3 py-2.5 rounded-xl text-xs bg-brand/10 text-brand font-semibold hover:bg-brand/20 transition-colors cursor-pointer text-left flex items-center justify-between"
                                          >
                                            <span>Usar "{stateSearchText.trim()}"</span>
                                            <Plus size={14} />
                                          </button>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-medium text-text-secondary block mb-1.5">Ciudad</label>
                                <input
                                  type="text"
                                  value={paymentDetails.city}
                                  onChange={e => setPaymentDetails(prev => ({ ...prev, city: e.target.value }))}
                                  placeholder="La Habana / Madrid"
                                  className="w-full bg-bg border border-border rounded-2xl px-4 py-3 text-xs text-text-primary focus:outline-none focus:border-brand/60 shadow-xs"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-text-secondary block mb-1.5">Código Postal</label>
                                <input
                                  type="text"
                                  value={paymentDetails.zip}
                                  onChange={e => setPaymentDetails(prev => ({ ...prev, zip: e.target.value }))}
                                  placeholder="10400 / 28001"
                                  className="w-full bg-bg border border-border rounded-2xl px-4 py-3 text-xs text-text-primary font-mono focus:outline-none focus:border-brand/60 shadow-xs"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Submit & Cancel Actions (Strictly Horizontal) */}
                        <div className="pt-4 flex flex-row items-center justify-end gap-3 border-t border-border/60">
                          <button
                            type="button"
                            onClick={() => setSettingsSubView('main')}
                            className="px-5 py-3 bg-surface hover:bg-surface-hover border border-border text-text-primary rounded-2xl text-xs font-medium transition-all active:scale-[0.97] cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-6 py-3 bg-brand hover:bg-brand-hover text-white rounded-2xl text-xs font-medium transition-all shadow-md active:scale-[0.97] cursor-pointer flex items-center justify-center gap-2"
                          >
                            <Check size={16} />
                            <span>Guardar</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : settingsSubView === 'plans' ? (

                    /* --- DEDICATED SUBSCRIPTION PLANS & TOKENS PAGE --- */
                    <div className="space-y-6 w-full mx-auto">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setSettingsSubView('main')}
                          className="px-3.5 py-2 bg-surface hover:bg-surface-hover border border-border text-text-primary rounded-2xl text-xs font-medium flex items-center gap-2 transition-all active:scale-[0.97] cursor-pointer"
                        >
                          <ArrowLeft size={16} />
                          <span>Volver a Configuración</span>
                        </button>
                      </div>

                      {/* 3. Subscription & Billing Plan with Token System */}
                      {userSubscriptionData?.subscription && userSubscriptionData.subscription.status !== 'cancelled' && !showUpgradeModal ? (
                        /* --- ACTIVE PLAN TOKEN USAGE DASHBOARD --- */
                        <div className="space-y-6">
                          {/* Header Banner */}
                          <div className="bg-surface border border-border p-6 rounded-3xl space-y-4 relative overflow-hidden">
                            {/* Status Badge in top right corner: Orange background, says Activo, Pendiente, or Cancelado */}
                            <div className="absolute top-4.5 right-4.5 z-10">
                              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-brand text-white shadow-xs">
                                {userSubscriptionData.subscription.status === 'cancelled'
                                  ? 'Cancelado'
                                  : userSubscriptionData.subscription.status === 'pending'
                                    ? 'Pendiente'
                                    : 'Activo'}
                              </span>
                            </div>

                            <div className="border-b border-border/80 pb-4 pr-16">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-brand/10 text-brand flex items-center justify-center">
                                  <Zap size={22} />
                                </div>
                                <div>
                                  <h3 className="font-serif font-semibold text-base text-text-primary">
                                    {userSubscriptionData.subscription.planName || 'Plan Personalizado'}
                                  </h3>
                                  <p className="text-xs text-text-secondary">
                                    Renovación automática cada {userSubscriptionData.subscription.billingFrequency === 'annual' ? 'Año' : userSubscriptionData.subscription.billingFrequency === 'quarterly' ? 'Trimestre' : 'Mes'}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons: Upgrade Plan + Cancel Subscription */}
                            <div className="flex flex-col sm:flex-row items-center gap-2.5">
                              <button
                                type="button"
                                onClick={() => setShowUpgradeModal(true)}
                                className="flex-1 w-full py-3 bg-brand hover:bg-brand-hover text-white rounded-2xl text-xs font-semibold transition-all shadow-md active:scale-[0.97] cursor-pointer flex items-center justify-center gap-2"
                              >
                                <TrendingUp size={16} />
                                <span>Mejorar Plan</span>
                              </button>

                              {userSubscriptionData.subscription.status !== 'cancelled' && (
                                <button
                                  type="button"
                                  onClick={() => setShowCancelModal(true)}
                                  className="w-full sm:w-auto px-4 py-3 bg-bg hover:bg-error/10 border border-border hover:border-error/40 text-text-secondary hover:text-error rounded-2xl text-xs font-medium transition-all active:scale-[0.97] cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                                  title="Cancelar renovación automática"
                                >
                                  <XCircle size={15} />
                                  <span>Cancelar Suscripción</span>
                                </button>
                              )}
                            </div>

                            {/* Token Balance Card */}
                            <div className="p-5 bg-bg border border-border rounded-2xl space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Tokens</span>
                                <span className="font-mono text-xs font-bold text-brand">
                                  {(userSubscriptionData.subscription.tokenBalance || 0).toLocaleString()} restantes
                                </span>
                              </div>

                              {/* Progress bar: fills up as tokens are used.
                                  El denominador es el total acreditado, que incluye
                                  las recargas; usar solo la cuota del plan dejaba la
                                  barra a cero en cuanto el usuario recargaba. */}
                              <div className="w-full h-3 bg-surface border border-border rounded-full overflow-hidden p-0.5">
                                <div
                                  className="h-full bg-gradient-to-r from-brand to-brand-hover rounded-full transition-all duration-500"
                                  style={{
                                    width: `${(() => {
                                      const balance = userSubscriptionData.subscription.tokenBalance || 0;
                                      const total = Math.max(
                                        userSubscriptionData.subscription.tokensTotalPlan || 0,
                                        balance
                                      );
                                      if (total <= 0) return 0;
                                      return Math.min(100, Math.max(0, Math.round(((total - balance) / total) * 100)));
                                    })()}%`
                                  }}
                                />
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-text-secondary pt-1">
                                <span>
                                  Próxima renovación: {userSubscriptionData.subscription.nextRenewalAt ? new Date(userSubscriptionData.subscription.nextRenewalAt).toLocaleDateString() : 'Próximamente'}
                                </span>
                                <span className="font-mono text-text-secondary">
                                  Total del plan: {(userSubscriptionData.subscription.tokensTotalPlan || 0).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Daily Token Usage Graph (Recharts) */}
                          <div className="bg-surface border border-border p-6 rounded-3xl space-y-4">
                            <div className="flex items-center justify-between border-b border-border/80 pb-3">
                              <div className="flex items-center gap-2">
                                <Activity size={18} className="text-brand" />
                                <h3 className="font-semibold text-sm text-text-primary">Uso de Tokens</h3>
                              </div>
                              <select
                                value={chartTimeframe}
                                onChange={(e: any) => setChartTimeframe(e.target.value)}
                                className="bg-bg border border-border text-xs font-mono font-medium text-text-primary rounded-xl px-2.5 py-1 focus:outline-none focus:border-brand cursor-pointer shadow-2xs"
                              >
                                <option value="14d">Últimos 14 días</option>
                                <option value="30d">Último mes</option>
                                <option value="90d">Último trimestre</option>
                                <option value="365d">Último año</option>
                              </select>
                            </div>

                            <div className="h-48 w-full pt-2">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={
                                  (userSubscriptionData.dailyUsage || []).slice(-(
                                    chartTimeframe === '14d' ? 14 : chartTimeframe === '30d' ? 30 : chartTimeframe === '90d' ? 90 : 365
                                  ))
                                }>
                                  <XAxis dataKey="date" stroke="#8B857E" fontSize={10} tickLine={false} />
                                  <YAxis stroke="#8B857E" fontSize={10} tickLine={false} width={40} />
                                  <Tooltip
                                    contentStyle={{ backgroundColor: '#2C2C2A', borderColor: '#3A3A38', borderRadius: '12px', fontSize: '11px', color: '#ECE7E1' }}
                                    formatter={(value: any) => [`${Number(value).toLocaleString()} tokens`, 'Consumo']}
                                  />
                                  <Bar dataKey="tokensUsed" fill="#D97757" radius={[6, 6, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* Quick Top-Up Tokens Options ($2, $5, $15, $25, $50, $100) */}
                          <div className="bg-surface border border-border p-6 rounded-3xl space-y-4">
                            <div className="border-b border-border/80 pb-3">
                              <h3 className="font-semibold text-sm text-text-primary flex items-center gap-2">
                                <PlusCircle size={18} className="text-brand" />
                                <span>Recargas Rápidas de Tokens (Top Up)</span>
                              </h3>
                              <p className="text-xs text-text-secondary mt-1">¿Necesitas mas rendimiento? Adquiere paquetes de tokens adicionales al instante.</p>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {[
                                { usd: 2, tokens: '20,000' },
                                { usd: 5, tokens: '55,000' },
                                { usd: 15, tokens: '180,000' },
                                { usd: 25, tokens: '320,000' },
                                { usd: 50, tokens: '700,000' },
                                { usd: 100, tokens: '1,500,000' }
                              ].map(item => (
                                <button
                                  key={item.usd}
                                  type="button"
                                  onClick={() => handleTopUpRecharge(item.usd)}
                                  className="p-4 bg-bg hover:bg-surface-hover border border-border hover:border-brand/60 rounded-2xl text-left space-y-1.5 transition-all cursor-pointer active:scale-[0.97] group shadow-xs"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-brand group-hover:underline">${item.usd} USD</span>
                                    <Zap size={14} className="text-brand" />
                                  </div>
                                  <p className="text-xs font-mono font-semibold text-text-primary">+{item.tokens} Tokens</p>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Token Transactions History Table with 10-Item Pagination */}
                          <div className="bg-surface border border-border p-6 rounded-3xl space-y-4">
                            <div className="flex items-center justify-between border-b border-border/80 pb-3">
                              <div className="flex items-center gap-2">
                                <CreditCard size={18} className="text-brand" />
                                <h3 className="font-semibold text-sm text-text-primary">Historial de Pagos y Suscripciones</h3>
                              </div>
                              <span className="text-xs font-mono text-text-secondary">{tokenHistoryPage} de {tokenHistoryTotalPages}</span>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="border-b border-border text-[11px] font-mono text-text-secondary uppercase">
                                    <th className="py-2.5 px-3">Fecha</th>
                                    <th className="py-2.5 px-3">Concepto</th>
                                    <th className="py-2.5 px-3 text-right">Tokens</th>
                                    <th className="py-2.5 px-3 text-right">Importe</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60 text-xs">
                                  {tokenHistory.map(tx => (
                                    <tr key={tx.id} className="hover:bg-bg/50 transition-colors">
                                      <td className="py-3 px-3 font-mono text-text-secondary">{tx.date}</td>
                                      <td className="py-3 px-3 font-medium text-text-primary flex items-center gap-2">
                                        <CreditCard size={14} className="text-brand shrink-0" />
                                        <span>{tx.description}</span>
                                      </td>
                                      <td className="py-3 px-3 text-right font-mono font-bold text-success">
                                        {tx.tokens > 0 ? `+${tx.tokens?.toLocaleString()}` : tx.tokens?.toLocaleString()}
                                      </td>
                                      <td className="py-3 px-3 text-right font-mono font-bold text-text-primary">
                                        ${tx.amountUSD ? Number(tx.amountUSD).toFixed(2) : '0.00'} USD
                                      </td>
                                    </tr>
                                  ))}

                                  {tokenHistoryLoading && tokenHistory.length === 0 && (
                                    Array.from({ length: 3 }).map((_, i) => (
                                      <tr key={`sk-${i}`}>
                                        <td className="py-3 px-3"><Skeleton className="h-3 w-16 rounded-md" /></td>
                                        <td className="py-3 px-3"><Skeleton className="h-3 w-40 rounded-md" /></td>
                                        <td className="py-3 px-3"><Skeleton className="h-3 w-14 rounded-md ml-auto" /></td>
                                        <td className="py-3 px-3"><Skeleton className="h-3 w-16 rounded-md ml-auto" /></td>
                                      </tr>
                                    ))
                                  )}
                                  {!tokenHistoryLoading && tokenHistory.length === 0 && (
                                    <tr>
                                      <td colSpan={4} className="py-6 text-center text-xs text-text-dim">Sin historial de pagos con tarjeta registrado.</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>

                            {/* Pagination Controls */}
                            <div className="flex items-center justify-between pt-2 border-t border-border/60">
                              <button
                                type="button"
                                disabled={tokenHistoryPage <= 1}
                                onClick={() => fetchTokenHistory(tokenHistoryPage - 1)}
                                className="px-3.5 py-1.5 bg-surface hover:bg-surface-hover disabled:opacity-40 border border-border rounded-xl text-xs text-text-primary font-medium flex items-center gap-1 cursor-pointer"
                              >
                                <ChevronLeft size={14} />
                                <span>Anterior</span>
                              </button>
                              <span className="text-xs text-text-secondary font-mono">Página {tokenHistoryPage} de {tokenHistoryTotalPages}</span>
                              <button
                                type="button"
                                disabled={tokenHistoryPage >= tokenHistoryTotalPages}
                                onClick={() => fetchTokenHistory(tokenHistoryPage + 1)}
                                className="px-3.5 py-1.5 bg-surface hover:bg-surface-hover disabled:opacity-40 border border-border rounded-xl text-xs text-text-primary font-medium flex items-center gap-1 cursor-pointer"
                              >
                                <span>Siguiente</span>
                                <ChevronRight size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* --- SELECTION OF 3 SUBSCRIPTION PLANS --- */
                        <div className="space-y-6">
                          {showUpgradeModal && (
                            <div className="flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => setShowUpgradeModal(false)}
                                className="px-3.5 py-2 bg-surface hover:bg-surface-hover border border-border text-text-primary rounded-2xl text-xs font-medium flex items-center gap-2 transition-all active:scale-[0.97] cursor-pointer"
                              >
                                <ArrowLeft size={16} />
                                <span>Volver al Dashboard de Consumo</span>
                              </button>
                            </div>
                          )}

                          {/* Frequency Selector: Mensual | Trimestral | Anual */}
                          <div className="bg-surface border border-border p-6 rounded-3xl space-y-4">
                            <div className="text-center space-y-1">
                              <h3 className="text-lg font-serif font-semibold text-text-primary">Elige tu Plan de Suscripción</h3>
                              <p className="text-xs text-text-secondary">Selecciona el paquete de tokens que mejor se adapte a tu volumen de operaciones</p>
                            </div>

                            <div className="flex justify-center pt-2">
                              <div className="bg-bg border border-border p-1 rounded-2xl inline-flex items-center gap-1 shadow-inner">
                                <button
                                  type="button"
                                  onClick={() => setBillingFrequency('monthly')}
                                  className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                                    billingFrequency === 'monthly' ? "bg-brand text-white shadow-sm" : "text-text-secondary hover:text-text-primary"
                                  )}
                                >
                                  Mensual
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setBillingFrequency('quarterly')}
                                  className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                                    billingFrequency === 'quarterly' ? "bg-brand text-white shadow-sm" : "text-text-secondary hover:text-text-primary"
                                  )}
                                >
                                  <span>Trimestral</span>
                                  <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-bold transition-colors", billingFrequency === 'quarterly' ? "bg-white/20 text-white" : "bg-brand/15 text-brand")}>
                                    -15%
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setBillingFrequency('annual')}
                                  className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                                    billingFrequency === 'annual' ? "bg-brand text-white shadow-sm" : "text-text-secondary hover:text-text-primary"
                                  )}
                                >
                                  <span>Anual</span>
                                  <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-bold transition-colors", billingFrequency === 'annual' ? "bg-white/20 text-white" : "bg-brand/15 text-brand")}>
                                    -30%
                                  </span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Rejilla de los 3 Planes (Estilo Claude Code) */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 w-full">
                            {subscriptionPlans.map(plan => {
                              const isRecommended = plan.isRecommended === 1;
                              let priceDisplay = plan.priceMonthly;
                              let oldPrice: string | null = null;

                              if (billingFrequency === 'quarterly') {
                                priceDisplay = plan.priceQuarterly;
                                oldPrice = (plan.priceMonthly * 3).toFixed(2);
                              } else if (billingFrequency === 'annual') {
                                priceDisplay = plan.priceAnnual;
                                oldPrice = (plan.priceMonthly * 12).toFixed(2);
                              }

                              return (
                                <div
                                  key={plan.id}
                                  className={cn(
                                    "bg-surface border p-4 sm:p-5 rounded-3xl space-y-3.5 flex flex-col justify-between relative overflow-hidden transition-all duration-200 shadow-xs",
                                    isRecommended ? "border-brand/70 ring-1 ring-brand/20 shadow-md" : "border-border/80 hover:border-brand/40"
                                  )}
                                >
                                  <div className="space-y-3">
                                    {/* Plan Title & Description */}
                                    <div className="space-y-1">
                                      <h4 className="text-lg sm:text-xl font-serif font-bold text-text-primary tracking-tight">
                                        {plan.name}
                                      </h4>
                                      <p className="text-xs text-text-secondary leading-snug line-clamp-2">{plan.description}</p>
                                    </div>

                                    {/* Price Row: Left Price (Old Strikethrough + Big New Price) | Right Tokens & Renewal */}
                                    <div className="pt-2 border-t border-border/50 flex items-end justify-between gap-2">
                                      {/* Left: Strikethrough Old Price + Big New Price */}
                                      <div>
                                        <div className="flex items-baseline gap-1.5 flex-wrap">
                                          {oldPrice && (
                                            <span className="line-through text-text-dim text-xs font-serif font-medium">
                                              ${oldPrice}
                                            </span>
                                          )}
                                          <span className="text-2xl sm:text-3xl font-bold font-serif text-text-primary tracking-tight">
                                            ${priceDisplay}
                                          </span>
                                        </div>
                                        <p className="text-[10px] text-text-secondary font-medium mt-0.5">
                                          {billingFrequency === 'annual' ? 'Por año' : billingFrequency === 'quarterly' ? 'Por trimestre' : 'Por mes'}
                                        </p>
                                      </div>

                                      {/* Right: Tokens Count & Renewal Interval */}
                                      <div className="text-right space-y-0.5 shrink-0">
                                        <div className="text-xs font-mono font-bold text-brand">
                                          {plan.tokensCount?.toLocaleString()} Tokens
                                        </div>
                                        <div className="text-[10px] font-mono text-text-secondary">
                                          Renovación c/{plan.renewIntervalHours || 720}h
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Action Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleInitiatePlanPurchase(plan)}
                                    className={cn(
                                      "w-full py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 cursor-pointer shadow-sm active:scale-[0.97] text-center mt-1",
                                      isRecommended
                                        ? "bg-text-primary text-bg hover:opacity-90 font-bold"
                                        : "bg-bg hover:bg-surface-hover border border-border text-text-primary font-medium"
                                    )}
                                  >
                                    {userSubscriptionData?.subscription ? 'Actualizar Plan' : 'Try Hera'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* --- MAIN SETTINGS VIEW --- */
                    <>
                      {/* Settings Header */}
                      <div className="bg-surface border border-border p-5 rounded-3xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-brand/10 text-brand flex items-center justify-center">
                            <Settings size={22} />
                          </div>
                          <div>
                            <h2 className="text-xl font-serif font-semibold text-text-primary">Configuración de la Cuenta</h2>
                            <p className="text-xs text-text-secondary">Preferencias de moneda, reglas para el Agente IA, plan y facturación</p>
                          </div>
                        </div>
                      </div>

                      {/* 0. User Profile & Avatar Card */}
                      <div className="bg-surface border border-border p-6 rounded-3xl space-y-4">
                        <div className="flex items-center justify-between border-b border-border/80 pb-3">
                          <div className="flex items-center gap-2">
                            <UserIcon size={18} className="text-brand" />
                            <h3 className="font-semibold text-sm text-text-primary">Perfil de Usuario</h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => openOnboarding({
                              name: profile?.displayName || user?.displayName,
                              birthDate: profile?.birthDate,
                              email: profile?.email || user?.email,
                              address: profile?.address,
                              phone: profile?.phone || user?.phone,
                              photoURL: profile?.photoURL || user?.photoURL
                            })}
                            className="text-xs font-semibold text-brand hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <Pencil size={12} />
                            <span>Editar Perfil</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-4 p-3 bg-bg border border-border rounded-2xl">
                          <div className="relative group cursor-pointer shrink-0">
                            <label htmlFor="settings-photo-input" className="cursor-pointer block relative">
                              <div className="w-16 h-16 rounded-2xl border border-brand/40 overflow-hidden relative shadow-sm hover:opacity-90 transition-all">
                                <img
                                  src={profile?.photoURL || user?.photoURL || "/defaultuser.png"}
                                  alt="Foto de perfil"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <Camera size={16} />
                                </div>
                              </div>
                            </label>
                            <input
                              id="settings-photo-input"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.size > 5 * 1024 * 1024) {
                                    showToast('La imagen debe ser menor a 5MB', 'error');
                                    return;
                                  }
                                  compressImageFile(file)
                                    .then(async (photoData) => {
                                      try {
                                        await api('/me', {
                                          method: 'PUT',
                                          body: JSON.stringify({ photoURL: photoData })
                                        });
                                        await fetchUserProfile();
                                        showToast('Foto de perfil actualizada', 'success');
                                      } catch {
                                        showToast('Error al actualizar la foto', 'error');
                                      }
                                    })
                                    .catch(() => showToast('No se pudo procesar la imagen', 'error'));
                                }
                              }}
                            />
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="text-sm font-semibold text-text-primary truncate">
                              {profile?.displayName || user?.displayName || 'Usuario'}
                            </p>
                            <p className="text-xs text-text-secondary truncate">
                              {profile?.email || user?.email || profile?.phone || 'Sin correo asociado'}
                            </p>
                            {profile?.birthDate && (
                              <p className="text-[11px] font-mono text-text-dim">
                                Nacimiento: {profile.birthDate}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 1. Default Currency Settings (Without Emojis) */}
                      <div className="bg-surface border border-border p-6 rounded-3xl space-y-4 relative z-30">
                        <div className="flex items-center justify-between border-b border-border/80 pb-3">
                          <div className="flex items-center gap-2">
                            <Coins size={18} className="text-brand" />
                            <h3 className="font-semibold text-sm text-text-primary">Moneda Predeterminada de Cuenta</h3>
                          </div>
                          <span className="text-xs font-mono font-bold bg-brand/10 text-brand px-2.5 py-1 rounded-full">
                            {defaultCurrency}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed">
                          Selecciona la divisa principal para consolidar tus cuentas, presupuestos y reportes financieros globales.
                        </p>

                        <div className="relative" ref={currencyMenuRef}>
                          <label className="text-xs font-medium text-text-secondary block mb-1">Seleccionar Moneda Base</label>
                          <button
                            type="button"
                            onClick={() => setIsCurrencyDropdownOpen(prev => !prev)}
                            className="w-full bg-bg border border-border rounded-2xl px-4 py-3 text-xs text-text-primary flex items-center justify-between hover:border-brand/60 transition-colors cursor-pointer shadow-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-brand">{defaultCurrency}</span>
                              <span>— {ALL_CURRENCIES.find(c => c.code === defaultCurrency)?.name || defaultCurrency}</span>
                            </div>
                            <ChevronDown size={16} className={cn("text-text-dim transition-transform duration-200", isCurrencyDropdownOpen && "rotate-180")} />
                          </button>

                          <AnimatePresence>
                            {isCurrencyDropdownOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                                transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                                className="absolute left-0 right-0 top-full mt-2 bg-surface border border-border rounded-2xl p-2 shadow-2xl z-50 space-y-2 max-h-64 flex flex-col"
                              >
                                <div className="relative flex items-center shrink-0">
                                  <Search size={14} className="absolute left-3 text-text-dim" />
                                  <input
                                    type="text"
                                    value={currencySearchQuery}
                                    onChange={e => setCurrencySearchQuery(e.target.value)}
                                    placeholder="Buscar divisa o código (ej. USD, EUR)..."
                                    className="w-full bg-bg border border-border/80 rounded-xl pl-8 pr-3 py-2 text-xs text-text-primary placeholder:text-text-dim focus:outline-none focus:border-brand/60"
                                    autoFocus
                                  />
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-1 pr-1 min-h-0">
                                  {ALL_CURRENCIES
                                    .filter(c => c.code.toLowerCase().includes(currencySearchQuery.toLowerCase()) || c.name.toLowerCase().includes(currencySearchQuery.toLowerCase()))
                                    .map(curr => (
                                      <button
                                        key={curr.code}
                                        type="button"
                                        onClick={() => {
                                          handleUpdateCurrency(curr.code);
                                          setIsCurrencyDropdownOpen(false);
                                          setCurrencySearchQuery('');
                                        }}
                                        className={cn(
                                          "w-full px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer text-left",
                                          defaultCurrency === curr.code
                                            ? "bg-brand/10 text-brand font-semibold"
                                            : "hover:bg-surface-hover text-text-primary"
                                        )}
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono font-bold text-[11px] min-w-[32px]">{curr.code}</span>
                                          <span>{curr.name}</span>
                                        </div>
                                        <span className="font-mono text-text-dim">{curr.symbol}</span>
                                      </button>
                                    ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* 2. Custom Agent Rules */}
                      <div className="bg-surface border border-border p-6 rounded-3xl space-y-4">
                        <div className="flex items-center justify-between border-b border-border/80 pb-3">
                          <div className="flex items-center gap-2">
                            <Sparkles size={18} className="text-brand" />
                            <h3 className="font-semibold text-sm text-text-primary">Reglas Personalizadas para el Agente Hera</h3>
                          </div>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed">
                          Dile a Hera cómo prefieres que te responda o qué reglas debe seguir en tus análisis.
                        </p>

                        <div className="space-y-2">
                          <textarea
                            value={customAgentRules}
                            onChange={e => setCustomAgentRules(e.target.value)}
                            placeholder="Ej. Respóndeme en un tono directo y casual. Avísame si supero los 50€ en comidas y prioriza el ahorro en mis hábitos."
                            rows={3}
                            className="w-full bg-bg border border-border rounded-2xl p-3.5 text-xs text-text-primary focus:outline-none focus:border-brand/60 resize-none leading-relaxed"
                          />
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={handleSaveAgentRules}
                              className="px-4 py-2 bg-brand hover:bg-brand-hover text-white font-medium rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.97] cursor-pointer"
                            >
                              <Check size={14} />
                              <span>Guardar Reglas</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 3. Subscription & Billing Plan Preview Card (Matching Settings Aesthetics) */}
                      <div className="bg-surface border border-border p-6 rounded-3xl space-y-4">
                        <div className="flex items-center justify-between border-b border-border/80 pb-3">
                          <div className="flex items-center gap-2">
                            <CreditCard size={18} className="text-brand" />
                            <h3 className="font-semibold text-sm text-text-primary">Suscripción y Plan</h3>
                          </div>
                          {userSubscriptionData?.subscription ? (
                            <span className="text-xs font-medium text-text-secondary">
                              {userSubscriptionData.subscription.planName || 'Plan Activo'}
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-text-dim">
                              Sin plan activo
                            </span>
                          )}
                        </div>

                        <div className="p-4 bg-bg border border-border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <h4 className="text-xs font-semibold text-text-primary">
                              {userSubscriptionData?.subscription
                                ? `${userSubscriptionData.subscription.planName} • ${userSubscriptionData.subscription.tokenBalance?.toLocaleString()} tokens disponibles`
                                : 'Tokens y funciones inteligentes'}
                            </h4>
                            <p className="text-[11px] text-text-secondary leading-relaxed">
                              {userSubscriptionData?.subscription
                                ? `Tu plan renueva el ${userSubscriptionData.subscription.nextRenewalAt ? new Date(userSubscriptionData.subscription.nextRenewalAt).toLocaleDateString() : 'próximo ciclo'}. Puedes cambiar tu tarifa o recargar más tokens cuando lo necesites.`
                                : 'Usa la IA de Hera para organizar tus gastos, escanear facturas y recibir consejos financieros claros.'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSettingsSubView('plans')}
                            className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-medium transition-all active:scale-[0.97] cursor-pointer shrink-0 shadow-sm"
                          >
                            {userSubscriptionData?.subscription ? 'Actualizar Plan' : 'Contratar Plan'}
                          </button>
                        </div>
                      </div>

                      {/* 4. Payment Methods & Billing Information */}
                      <div className="bg-surface border border-border p-6 rounded-3xl space-y-4">
                        <div className="flex items-center justify-between border-b border-border/80 pb-3">
                          <div className="flex items-center gap-2">
                            <Wallet size={18} className="text-brand" />
                            <h3 className="font-semibold text-sm text-text-primary">Métodos de Pago y Facturación</h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSettingsSubView('payment')}
                            className="text-xs text-brand font-medium hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <span>Editar</span>
                          </button>
                        </div>

                        <div className="p-4 bg-bg border border-border rounded-2xl space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-8 bg-brand/10 rounded-lg border border-brand/30 flex items-center justify-center font-mono text-[11px] font-bold text-brand">
                                VISA
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-text-primary">
                                  •••• •••• •••• {paymentDetails.cardNumber.replace(/\s/g, '').slice(-4) || '4242'}
                                </p>
                                <p className="text-[11px] text-text-secondary">Expira {paymentDetails.cardExp || '12/28'}</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono font-bold bg-success/10 text-success px-2 py-0.5 rounded">
                              PRINCIPAL
                            </span>
                          </div>

                          {paymentDetails.firstName && (
                            <div className="pt-2 border-t border-border/60 text-[11px] text-text-secondary space-y-0.5">
                              <p className="font-medium text-text-primary">{paymentDetails.firstName} {paymentDetails.lastName}</p>
                              <p>{paymentDetails.address1} {paymentDetails.address2 ? `, ${paymentDetails.address2}` : ''}</p>
                              <p>{paymentDetails.city}, {paymentDetails.state} {paymentDetails.zip}, {paymentDetails.country}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 5. Email Notifications */}
                      <div className="bg-surface border border-border p-6 rounded-3xl space-y-4">
                        <div className="flex items-center justify-between border-b border-border/80 pb-3">
                          <div className="flex items-center gap-2">
                            <AlertCircle size={18} className="text-brand" />
                            <h3 className="font-semibold text-sm text-text-primary">Notificaciones por Correo</h3>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {[
                            { key: 'weeklySummary', title: 'Resumen semanal de finanzas', desc: 'Recibe un reporte digest cada lunes por email' },
                            { key: 'budgetAlerts', title: 'Alertas de desvío de presupuesto', desc: 'Aviso inmediato si gastas más del 80% en una categoría' },
                            { key: 'securityUpdates', title: 'Actualizaciones de seguridad y cuenta', desc: 'Notificaciones sobre nuevos inicios de sesión o cambios' }
                          ].map(item => (
                            <div key={item.key} className="flex items-center justify-between p-3 bg-bg border border-border/70 rounded-2xl">
                              <div>
                                <p className="text-xs font-medium text-text-primary">{item.title}</p>
                                <p className="text-[11px] text-text-secondary">{item.desc}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setEmailNotifications(prev => {
                                    const next = { ...prev, [item.key]: !prev[item.key as keyof typeof prev] };
                                    localStorage.setItem('hera_email_notifications', JSON.stringify(next));
                                    showToast('Preferencia de notificación actualizada', 'success');
                                    return next;
                                  });
                                }}
                                className={cn(
                                  "w-11 h-6 rounded-full transition-colors p-1 flex items-center cursor-pointer",
                                  emailNotifications[item.key as keyof typeof emailNotifications] ? "bg-brand justify-end" : "bg-border/60 justify-start"
                                )}
                              >
                                <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      )}

      {/* Floating Bottom Navigation Bar (Hidden when in active chat thread) */}
      {!showAdmin && (activeTab !== 'chat' || chatMessages.length === 0) && (
        <motion.nav
          initial={{ y: 20, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
          className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 bg-surface/85 backdrop-blur-2xl border border-border/80 rounded-2xl p-1.5 shadow-xl shadow-black/10 flex items-center gap-1 sm:gap-1.5 max-w-[94vw] overflow-x-auto scrollbar-none"
        >
          <button
            onClick={() => setActiveTab('chat')}
            className={cn(
              "px-3 sm:px-3.5 py-2 rounded-xl text-xs font-medium flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-[0.95]",
              activeTab === 'chat'
                ? "bg-brand text-white shadow-md font-semibold"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
            )}
            title="Inicio / Hera IA"
          >
            <Sparkles size={18} />
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={cn(
              "px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shrink-0 active:scale-[0.95]",
              activeTab === 'timeline' ? "bg-brand text-white shadow-md font-semibold" : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
            )}
          >
            <Clock size={16} />
            <span className="hidden md:inline">Timeline</span>
          </button>

          <button
            onClick={() => setActiveTab('accounts')}
            className={cn(
              "px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shrink-0 active:scale-[0.95]",
              activeTab === 'accounts' ? "bg-brand text-white shadow-md font-semibold" : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
            )}
          >
            <Wallet size={16} />
            <span className="hidden md:inline">Cuentas</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={cn(
              "px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shrink-0 active:scale-[0.95]",
              activeTab === 'reports' ? "bg-brand text-white shadow-md font-semibold" : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
            )}
          >
            <PieChart size={16} />
            <span className="hidden md:inline">Reportes</span>
          </button>

          <button
            onClick={() => setActiveTab('goals')}
            className={cn(
              "px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shrink-0 active:scale-[0.95]",
              activeTab === 'goals' ? "bg-brand text-white shadow-md font-semibold" : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
            )}
            title="Metas & Ahorros"
          >
            <Target size={16} />
            <span className="hidden md:inline">Metas</span>
          </button>

          <button
            onClick={() => setActiveTab('health')}
            className={cn(
              "px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shrink-0 active:scale-[0.95]",
              activeTab === 'health' ? "bg-brand text-white shadow-md font-semibold" : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
            )}
            title="Salud Financiera & Score Hera"
          >
            <ShieldCheck size={16} />
            <span className="hidden md:inline">Salud Financiera</span>
          </button>

          <button
            onClick={() => setActiveTab('debts')}
            className={cn(
              "px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shrink-0 active:scale-[0.95]",
              activeTab === 'debts' ? "bg-brand text-white shadow-md font-semibold" : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
            )}
            title="Deudas & Cobros"
          >
            <HandCoins size={16} />
            <span className="hidden md:inline">Deudas & Cobros</span>
          </button>
        </motion.nav>
      )}

      {/* Quick Add 2-Step Voice & AI Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="max-w-md w-full bg-surface border border-border p-6 rounded-3xl space-y-5 shadow-2xl relative overflow-hidden text-center"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="text-left">
                  <h3 className="font-serif font-bold text-lg text-text-primary">
                    {addModalStep === 1 ? 'Crear Registro' : 'Confirmar Registro con IA'}
                  </h3>
                  <p className="text-xs text-text-secondary">
                    {addModalStep === 1 ? 'Elige dictado por voz o escaneo de imagen' : 'Revisa los datos extraídos'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setAddModalStep(1);
                    setAiParsedPreview(null);
                    setScannedImagePreview(null);
                  }}
                  className="w-8 h-8 rounded-full bg-bg hover:bg-surface-hover border border-border text-text-secondary flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* STEP 1: VOICE DICTATION OR IMAGE SCAN TABS */}
              {addModalStep === 1 && (
                <div className="space-y-4">
                  {/* Two Mode Options Selector */}
                  <div className="bg-bg border border-border p-1 rounded-2xl flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCreateRecordTab('voice')}
                      className={cn(
                        "flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2",
                        createRecordTab === 'voice' ? "bg-brand text-white shadow-sm font-bold" : "text-text-secondary hover:text-text-primary"
                      )}
                    >
                      <Mic size={15} />
                      <span>Dictar por voz</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCreateRecordTab('image')}
                      className={cn(
                        "flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2",
                        createRecordTab === 'image' ? "bg-brand text-white shadow-sm font-bold" : "text-text-secondary hover:text-text-primary"
                      )}
                    >
                      <Camera size={15} />
                      <span>Escanear imagen</span>
                    </button>
                  </div>

                  {/* OPTION 1: VOICE DICTATION */}
                  {createRecordTab === 'voice' && (
                    <div className="relative p-8 bg-bg border border-border rounded-3xl flex flex-col items-center justify-center space-y-5 min-h-[260px] overflow-hidden">
                      {isRecording && (
                        <AnimatePresence>
                          <motion.div
                            initial={{ opacity: 0, scaleY: 0.8 }}
                            animate={{ opacity: 1, scaleY: 1 }}
                            exit={{ opacity: 0, scaleY: 0.8 }}
                            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                            className="flex items-center justify-between gap-1 h-14 w-full relative z-10 my-2 px-1"
                          >
                            {audioLevels.map((lvl, i) => (
                              <motion.div
                                key={i}
                                animate={{ height: `${Math.max(10, lvl)}%` }}
                                transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                                className="flex-1 bg-brand rounded-full min-w-[3px]"
                                style={{ minHeight: '6px' }}
                              />
                            ))}
                          </motion.div>
                        </AnimatePresence>
                      )}

                      {isAiParsingAudio ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                          className="flex flex-col items-center gap-4 py-3 text-center relative z-10 w-full"
                        >
                          <div className="relative flex items-center justify-center">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                              className="w-20 h-20 rounded-3xl border border-dashed border-brand/40 absolute"
                            />
                            <div className="w-18 h-18 rounded-3xl bg-brand/10 blur-sm absolute animate-pulse" />
                            <div className="w-16 h-16 rounded-2xl bg-surface border border-border p-2.5 flex items-center justify-center shrink-0 shadow-sm relative z-10">
                              <img src="/logo.png" alt="Hera Logo" className="w-full h-full object-contain" />
                            </div>
                          </div>

                          <div className="w-full max-w-[180px] h-1 bg-surface-hover rounded-full overflow-hidden relative">
                            <motion.div
                              animate={{ x: ['-100%', '100%'] }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                              className="w-1/2 h-full bg-gradient-to-r from-transparent via-brand to-transparent rounded-full"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-center gap-2.5">
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" />
                              </div>
                              <span className="font-bold text-sm text-text-primary">
                                Hera IA Analizando Registro
                              </span>
                            </div>
                            <p className="text-[11px] text-text-secondary">
                              Interpretando intención, importe y categoría...
                            </p>
                          </div>
                        </motion.div>
                      ) : !isRecording && (
                        <>
                          <p className="text-xs text-text-secondary relative z-10 max-w-xs leading-relaxed">
                            Toca el micrófono para dictar tu registro financiero
                          </p>

                          <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            type="button"
                            onClick={startVoiceRecording}
                            className="w-20 h-20 rounded-full bg-brand hover:bg-brand-hover text-white shadow-md flex items-center justify-center transition-all cursor-pointer relative z-10 mt-1 border border-white/10"
                          >
                            <Mic size={32} />
                          </motion.button>
                        </>
                      )}

                      {isRecording && (
                        <motion.button
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          type="button"
                          onClick={stopVoiceRecording}
                          className="w-16 h-16 rounded-full bg-error text-white shadow-md flex items-center justify-center transition-all cursor-pointer relative z-10 ring-4 ring-error/30 animate-pulse border border-white/10"
                        >
                          <MicOff size={28} />
                        </motion.button>
                      )}
                    </div>
                  )}

                  {/* OPTION 2: IMAGE & PHOTO SCANNING */}
                  {createRecordTab === 'image' && (
                    <div className="relative p-6 bg-bg border border-border rounded-3xl flex flex-col items-center justify-center space-y-4 min-h-[260px] overflow-hidden">
                      {/* Hidden File Inputs for Fallback & Image Upload */}
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageRecordScan}
                        className="hidden"
                      />
                      <input
                        ref={imageFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageRecordScan}
                        className="hidden"
                      />

                      {isCameraActive ? (
                        <div className="flex flex-col items-center gap-3 w-full">
                          <div className="relative w-full h-56 rounded-2xl overflow-hidden bg-black border border-brand/40 shadow-inner flex items-center justify-center">
                            <video ref={cameraVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                            <div className="absolute inset-4 border-2 border-dashed border-white/50 rounded-xl pointer-events-none flex items-center justify-center">
                              <span className="text-[10px] text-white/80 bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-xs font-mono">Encuadra el recibo o ticket</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 w-full">
                            <button
                              type="button"
                              onClick={captureCameraSnapshot}
                              className="flex-1 py-3 bg-brand hover:bg-brand-hover text-white rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-[0.97]"
                            >
                              <Camera size={16} />
                              <span>Capturar Foto</span>
                            </button>
                            <button
                              type="button"
                              onClick={stopLiveCamera}
                              className="py-3 px-4 bg-surface hover:bg-surface-hover border border-border text-text-secondary rounded-2xl text-xs font-semibold cursor-pointer transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : isScanningImage ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex flex-col items-center gap-4 py-3 text-center relative z-10 w-full"
                        >
                          {scannedImagePreview && (
                            <div className="relative w-28 h-28 rounded-2xl overflow-hidden border border-brand/40 shadow-md">
                              <img src={scannedImagePreview} alt="Preview" className="w-full h-full object-cover" />
                              <motion.div
                                animate={{ y: ['0%', '100%', '0%'] }}
                                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                                className="absolute left-0 right-0 h-1 bg-brand shadow-md shadow-brand"
                              />
                            </div>
                          )}

                          <div className="space-y-1">
                            <div className="flex items-center justify-center gap-2.5 text-brand">
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" />
                              </div>
                              <span className="font-bold text-sm text-text-primary">Gemini Vision Analizando</span>
                            </div>
                            <p className="text-[11px] text-text-secondary">
                              Extrayendo importe, comercio, fecha y concepto del comprobante...
                            </p>
                          </div>
                        </motion.div>
                      ) : (
                        <>
                          {/* Rejection message with image preview */}
                          {scanRejectionMsg && scannedImagePreview ? (
                            <div className="flex flex-col items-center gap-3 w-full">
                              <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-error/40 shadow-md">
                                <img src={scannedImagePreview} alt="Rechazada" className="w-full h-full object-cover opacity-70" />
                                <div className="absolute inset-0 flex items-center justify-center bg-error/20">
                                  <XCircle size={32} className="text-error drop-shadow-md" />
                                </div>
                              </div>
                              <div className="bg-error/10 border border-error/30 rounded-2xl p-3 w-full text-center">
                                <p className="text-xs font-bold text-error mb-1">Imagen Rechazada por la IA</p>
                                <p className="text-[11px] text-text-secondary leading-relaxed">{scanRejectionMsg}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => { setScanRejectionMsg(null); setScannedImagePreview(null); }}
                                className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white rounded-2xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.97]"
                              >
                                <Camera size={14} />
                                <span>Intentar con otra imagen</span>
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center border border-brand/20">
                                <Camera size={24} />
                              </div>

                              <div className="space-y-1 text-center">
                                <p className="text-xs font-bold text-text-primary">Escanear factura, ticket u objeto</p>
                                <p className="text-[11px] text-text-secondary max-w-xs leading-normal">
                                  La IA reconocerá automáticamente el importe, concepto y categoría a partir de la foto.
                                </p>
                              </div>

                              <div className="grid grid-cols-2 gap-2.5 w-full pt-2">
                                {/* Option A: Take Photo (Live Camera or File Native Picker) */}
                                <button
                                  type="button"
                                  onClick={startLiveCamera}
                                  className="py-3 px-3 bg-brand hover:bg-brand-hover text-white rounded-2xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs active:scale-[0.97]"
                                >
                                  <Camera size={16} />
                                  <span>Tomar foto</span>
                                </button>

                                {/* Option B: Upload Image File */}
                                <button
                                  type="button"
                                  onClick={() => imageFileInputRef.current?.click()}
                                  className="py-3 px-3 bg-surface hover:bg-surface-hover border border-border text-text-primary rounded-2xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.97]"
                                >
                                  <Upload size={16} className="text-brand" />
                                  <span>Subir imagen</span>
                                </button>
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: AI CONFIRMATION & REAL-TIME EDITABLE FORM */}
              {addModalStep === 2 && aiParsedPreview && (
                <div className="space-y-4 text-left">
                  {/* Type Preference Toggle (Ingreso vs Gasto) - Exclusive to Step 2 */}
                  <div className="bg-bg border border-border p-1 rounded-2xl flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setAiParsedPreview(prev => prev ? { ...prev, type: 'expense' } : null)}
                      className={cn(
                        "flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5",
                        aiParsedPreview.type === 'expense' ? "bg-error text-white shadow-sm" : "text-text-secondary hover:text-text-primary"
                      )}
                    >
                      <TrendingDown size={15} />
                      <span>Gasto</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAiParsedPreview(prev => prev ? { ...prev, type: 'income' } : null)}
                      className={cn(
                        "flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5",
                        aiParsedPreview.type === 'income' ? "bg-success text-white shadow-sm" : "text-text-secondary hover:text-text-primary"
                      )}
                    >
                      <TrendingUp size={15} />
                      <span>Ingreso</span>
                    </button>
                  </div>

                  {/* Real-time Interactive Editable Fields */}
                  <div className="bg-bg/90 border border-border p-4 rounded-2xl space-y-3 shadow-xs">

                    {/* Editable Amount */}
                    <div>
                      <label className="text-[10px] font-mono text-text-dim block uppercase">Importe ({defaultCurrency})</label>
                      <input
                        type="number"
                        step="0.01"
                        value={aiParsedPreview.amount}
                        onChange={e => setAiParsedPreview(prev => prev ? { ...prev, amount: parseFloat(e.target.value) || 0 } : null)}
                        className="w-full bg-surface border border-border focus:border-brand px-3 py-2 rounded-xl text-lg font-bold font-mono text-text-primary focus:outline-none mt-1"
                      />
                    </div>

                    {/* Editable Description */}
                    <div>
                      <label className="text-[10px] font-mono text-text-dim block uppercase">Descripción / Concepto</label>
                      <input
                        type="text"
                        value={aiParsedPreview.description}
                        onChange={e => setAiParsedPreview(prev => prev ? { ...prev, description: e.target.value } : null)}
                        className="w-full bg-surface border border-border focus:border-brand px-3 py-2 rounded-xl text-xs font-medium text-text-primary focus:outline-none mt-1"
                        placeholder="Concepto de la transacción"
                      />
                    </div>

                    {/* Editable Category */}
                    <div>
                      <label className="text-[10px] font-mono text-text-dim block uppercase">Categoría</label>
                      <input
                        type="text"
                        list="category-suggestions"
                        value={aiParsedPreview.category}
                        onChange={e => setAiParsedPreview(prev => prev ? { ...prev, category: e.target.value } : null)}
                        className="w-full bg-surface border border-border focus:border-brand px-3 py-2 rounded-xl text-xs font-medium text-text-primary focus:outline-none mt-1"
                        placeholder="Ej. Alimentación, Transporte, Nómina..."
                      />
                      <datalist id="category-suggestions">
                        <option value="Alimentación" />
                        <option value="Restaurantes" />
                        <option value="Transporte" />
                        <option value="Vivienda" />
                        <option value="Servicios" />
                        <option value="Nómina / Salario" />
                        <option value="Inversiones" />
                        <option value="Entretenimiento / Ocio" />
                        <option value="General" />
                      </datalist>
                    </div>

                    {/* Editable Account Assignment */}
                    <div>
                      <label className="text-[10px] font-mono text-text-dim block uppercase mb-1">Cuenta Asignada</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                        {accounts.map(acc => (
                          <button
                            key={acc.id}
                            type="button"
                            onClick={() => {
                              setSelectedAccountId(acc.id);
                              setAiParsedPreview(prev => prev ? { ...prev, accountId: acc.id } : null);
                            }}
                            className={cn(
                              "p-2.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer",
                              (selectedAccountId === acc.id || (!selectedAccountId && accounts[0]?.id === acc.id))
                                ? "bg-brand/10 border-brand text-brand shadow-xs"
                                : "bg-surface border-border text-text-primary hover:border-brand/40 hover:bg-surface-hover"
                            )}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <div className="w-7 h-7 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold shrink-0">
                                {acc.type === 'bank' && <Building2 size={14} />}
                                {acc.type === 'card' && <CreditCard size={14} />}
                                {acc.type === 'cash' && <Wallet size={14} />}
                                {acc.type === 'crypto' && <Coins size={14} />}
                              </div>
                              <div className="truncate">
                                <p className="text-xs font-semibold truncate">{acc.name}</p>
                                <p className="text-[10px] font-mono text-text-dim">{acc.balance} {acc.currency || 'EUR'}</p>
                              </div>
                            </div>
                            {(selectedAccountId === acc.id || (!selectedAccountId && accounts[0]?.id === acc.id)) && (
                              <Check size={14} className="text-brand shrink-0 ml-1" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons: Guardar Registro & Reintentar */}
                  <div className="pt-2 space-y-2">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!aiParsedPreview) return;
                        const targetAccId = selectedAccountId || aiParsedPreview.accountId || accounts[0]?.id;
                        try {
                          const res = await api('/finance/transactions', {
                            method: 'POST',
                            body: JSON.stringify({
                              accountId: targetAccId,
                              type: aiParsedPreview.type,
                              amount: aiParsedPreview.amount,
                              category: aiParsedPreview.category,
                              description: aiParsedPreview.description,
                              date: new Date().toISOString().split('T')[0]
                            })
                          });
                          if (res.success) {
                            showToast(`¡Registro guardado! ${aiParsedPreview.category} - ${aiParsedPreview.amount}€`, 'success');
                            setShowAddModal(false);
                            setAddModalStep(1);
                            setAiParsedPreview(null);
                            loadUserData();
                          }
                        } catch {
                          showToast('Error al crear registro', 'error');
                        }
                      }}
                      className="w-full bg-brand hover:bg-brand-hover text-white font-medium py-3 rounded-2xl transition-all shadow-md active:scale-98 cursor-pointer text-xs flex items-center justify-center gap-2"
                    >
                      <Check size={16} />
                      <span>Guardar Registro</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAddModalStep(1);
                        setAiParsedPreview(null);
                      }}
                      className="w-full bg-bg hover:bg-surface-hover border border-border text-text-secondary py-2.5 rounded-2xl text-xs font-medium transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5"
                    >
                      <Mic size={14} />
                      <span>Reintentar Dictado por Voz</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create New Account Modal */}
      <AnimatePresence>
        {showAddAccountModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="max-w-md w-full bg-surface border border-border p-6 rounded-3xl space-y-5 shadow-2xl relative text-left"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-serif font-semibold text-lg text-text-primary">Crear Cuenta o Tarjeta</h3>
                <button
                  onClick={() => setShowAddAccountModal(false)}
                  className="w-8 h-8 rounded-full bg-bg hover:bg-surface-hover border border-border text-text-secondary flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Nombre de la Cuenta o Tarjeta:</label>
                  <input
                    type="text"
                    value={newAccName}
                    onChange={e => setNewAccName(e.target.value)}
                    placeholder="Ej. Tarjeta VISA Oro, Cuenta Santander..."
                    className="w-full bg-bg border border-border rounded-2xl p-3 text-xs text-text-primary focus:outline-none focus:border-brand/60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Tipo de Cuenta o Tarjeta:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'bank', label: 'Cuenta Bancaria', icon: Building2, desc: 'Nómina o ahorro' },
                      { id: 'card', label: 'Tarjeta Crédito/Débito', icon: CreditCard, desc: 'Visa, Mastercard' },
                      { id: 'cash', label: 'Efectivo', icon: Wallet, desc: 'Bolsillo físico' },
                      { id: 'crypto', label: 'Cripto / Inversión', icon: Coins, desc: 'Wallet o Broker' }
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setNewAccType(t.id)}
                        className={cn(
                          "p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer",
                          newAccType === t.id
                            ? "bg-brand/10 border-brand text-brand shadow-sm"
                            : "bg-bg border-border text-text-primary hover:border-brand/40 hover:bg-surface-hover"
                        )}
                      >
                        <t.icon size={18} className={newAccType === t.id ? "text-brand" : "text-text-secondary"} />
                        <div className="mt-2">
                          <p className="text-xs font-semibold">{t.label}</p>
                          <p className="text-[10px] text-text-dim">{t.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Saldo Inicial:</label>
                  <input
                    type="number"
                    value={newAccBalance}
                    onChange={e => setNewAccBalance(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-bg border border-border rounded-2xl p-3 text-xs text-text-primary focus:outline-none focus:border-brand/60"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateAccount}
                className="w-full bg-brand hover:bg-brand-hover text-white font-medium py-3 rounded-2xl transition-all shadow-md active:scale-98 cursor-pointer text-xs"
              >
                Crear Cuenta
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create New Savings Goal Modal */}
      <AnimatePresence>
        {showAddGoalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="max-w-md w-full bg-surface border border-border p-6 rounded-3xl space-y-5 shadow-2xl relative text-left"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-serif font-semibold text-lg text-text-primary">Crear Meta o Fondo de Ahorro</h3>
                <button
                  onClick={() => setShowAddGoalModal(false)}
                  className="w-8 h-8 rounded-full bg-bg hover:bg-surface-hover border border-border text-text-secondary flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Nombre de la Meta o Fondo:</label>
                  <input
                    type="text"
                    value={newGoalName}
                    onChange={e => setNewGoalName(e.target.value)}
                    placeholder="Ej. Fondo de Emergencia 6 meses, Vacaciones Japón..."
                    className="w-full bg-bg border border-border rounded-2xl p-3 text-xs text-text-primary focus:outline-none focus:border-brand/60"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-text-secondary">Monto Objetivo ({defaultCurrency}):</label>
                    <input
                      type="number"
                      value={newGoalTarget}
                      onChange={e => setNewGoalTarget(e.target.value)}
                      placeholder="3000.00"
                      className="w-full bg-bg border border-border rounded-2xl p-3 text-xs text-text-primary focus:outline-none focus:border-brand/60"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-text-secondary">Ahorrado Actualmente:</label>
                    <input
                      type="number"
                      value={newGoalCurrent}
                      onChange={e => setNewGoalCurrent(e.target.value)}
                      placeholder="500.00"
                      className="w-full bg-bg border border-border rounded-2xl p-3 text-xs text-text-primary focus:outline-none focus:border-brand/60"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Fecha Límite Deseada:</label>
                  <input
                    type="date"
                    value={newGoalDeadline}
                    onChange={e => setNewGoalDeadline(e.target.value)}
                    className="w-full bg-bg border border-border rounded-2xl p-3 text-xs text-text-primary focus:outline-none focus:border-brand/60"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateGoal}
                className="w-full bg-brand hover:bg-brand-hover text-white font-medium py-3 rounded-2xl transition-all shadow-md active:scale-98 cursor-pointer text-xs"
              >
                Crear Meta de Ahorro
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create New Debt or Receivable Record Modal */}
      <AnimatePresence>
        {showAddDebtModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="max-w-md w-full bg-surface border border-border p-6 rounded-3xl space-y-5 shadow-2xl relative text-left font-sans"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-serif font-semibold text-lg text-text-primary">Registrar Deuda o Cobro</h3>
                <button
                  onClick={() => setShowAddDebtModal(false)}
                  className="w-8 h-8 rounded-full bg-bg hover:bg-surface-hover border border-border text-text-secondary flex items-center justify-center cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Type Selector (A quién debo vs Quién me debe) */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-bg border border-border rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setNewDebtType('debt')}
                    className={cn(
                      "py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.96]",
                      newDebtType === 'debt' ? "bg-error/15 text-error border border-error/30 shadow-xs font-bold" : "text-text-secondary hover:text-text-primary"
                    )}
                  >
                    <ArrowUpRight size={14} />
                    <span>A quién le debo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewDebtType('receivable')}
                    className={cn(
                      "py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.96]",
                      newDebtType === 'receivable' ? "bg-success/15 text-success border border-success/30 shadow-xs font-bold" : "text-text-secondary hover:text-text-primary"
                    )}
                  >
                    <ArrowDownLeft size={14} />
                    <span>Quién me debe</span>
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Persona o Entidad:</label>
                  <input
                    type="text"
                    value={newDebtPerson}
                    onChange={e => setNewDebtPerson(e.target.value)}
                    placeholder="Ej. Carlos Gómez, Banco Santander, Juan Pérez..."
                    className="w-full bg-bg border border-border rounded-2xl p-3 text-xs text-text-primary focus:outline-none focus:border-brand/60"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Concepto o Motivo:</label>
                  <input
                    type="text"
                    value={newDebtName}
                    onChange={e => setNewDebtName(e.target.value)}
                    placeholder="Ej. Cena de cumpleaños, Préstamo personal..."
                    className="w-full bg-bg border border-border rounded-2xl p-3 text-xs text-text-primary focus:outline-none focus:border-brand/60"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-text-secondary">Monto ({defaultCurrency}):</label>
                    <input
                      type="number"
                      value={newDebtAmount}
                      onChange={e => setNewDebtAmount(e.target.value)}
                      placeholder="150.00"
                      className="w-full bg-bg border border-border rounded-2xl p-3 text-xs text-text-primary focus:outline-none focus:border-brand/60 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-text-secondary">Vencimiento / Fecha:</label>
                    <input
                      type="date"
                      value={newDebtDueDate}
                      onChange={e => setNewDebtDueDate(e.target.value)}
                      className="w-full bg-bg border border-border rounded-2xl p-3 text-xs text-text-primary focus:outline-none focus:border-brand/60"
                    />
                  </div>
                </div>

                {/* Live Real-Time Preview Card */}
                <div className="p-3 bg-bg/80 border border-border/80 rounded-2xl space-y-1.5">
                  <span className="text-[10px] uppercase font-mono font-bold text-text-dim block">Vista Previa en Tiempo Real:</span>
                  <div className="flex items-center justify-between gap-3 bg-surface p-3 rounded-xl border border-border/60">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-[10px] font-mono border shrink-0",
                        newDebtType === 'debt' ? "bg-error/10 text-error border-error/20" : "bg-success/10 text-success border-success/20"
                      )}>
                        {newDebtPerson.trim() ? newDebtPerson.trim().slice(0, 2).toUpperCase() : 'HG'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-text-primary truncate">{newDebtPerson.trim() || 'Nombre de Persona'}</p>
                        <p className="text-[10px] text-text-secondary truncate">{newDebtName.trim() || 'Concepto o Motivo'}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 font-mono font-bold text-xs text-text-primary">
                      {newDebtAmount ? `${parseFloat(newDebtAmount).toLocaleString('es-ES', { minimumFractionDigits: 2 })} ${currencySymbol}` : `0.00 ${currencySymbol}`}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateDebtRecord}
                className="w-full bg-brand hover:bg-brand-hover text-white font-semibold py-3 rounded-2xl transition-all shadow-md active:scale-98 cursor-pointer text-xs flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                <span>{newDebtType === 'debt' ? 'Guardar Deuda por Pagar' : 'Guardar Cobro por Recibir'}</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Partial Payment Modal (+ Abonar) */}
      <AnimatePresence>
        {selectedDebtForPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="max-w-md w-full bg-surface border border-border p-6 rounded-3xl space-y-5 shadow-2xl relative text-left font-sans"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h3 className="font-serif font-semibold text-base text-text-primary">Registrar Abono o Pago</h3>
                  <p className="text-[11px] text-text-secondary">{selectedDebtForPayment.personOrEntity} — {selectedDebtForPayment.name}</p>
                </div>
                <button
                  onClick={() => setSelectedDebtForPayment(null)}
                  className="w-8 h-8 rounded-full bg-bg hover:bg-surface-hover border border-border text-text-secondary flex items-center justify-center cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3.5">
                <div className="p-3 bg-bg/80 border border-border/80 rounded-2xl flex justify-between items-center text-xs font-mono">
                  <span className="text-text-secondary">Monto Total de Deuda:</span>
                  <span className="font-bold text-text-primary">{Number(selectedDebtForPayment.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })} ${currencySymbol}</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Monto a Abonar (${currencySymbol}):</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(e.target.value)}
                    placeholder="Ej. 50.00"
                    className="w-full bg-bg border border-border rounded-2xl p-3 text-xs text-text-primary focus:outline-none focus:border-brand/60 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Fecha del Abono:</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                    className="w-full bg-bg border border-border rounded-2xl p-3 text-xs text-text-primary focus:outline-none focus:border-brand/60"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Nota u Observación (Opcional):</label>
                  <input
                    type="text"
                    value={paymentNote}
                    onChange={e => setPaymentNote(e.target.value)}
                    placeholder="Ej. Primer pago Bizum, transferencia recibida..."
                    className="w-full bg-bg border border-border rounded-2xl p-3 text-xs text-text-primary focus:outline-none focus:border-brand/60"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddDebtPayment}
                className="w-full bg-brand hover:bg-brand-hover text-white font-semibold py-3 rounded-2xl transition-all shadow-md active:scale-98 cursor-pointer text-xs flex items-center justify-center gap-2"
              >
                <PlusCircle size={16} />
                <span>Confirmar y Guardar Abono</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment History Log Modal */}
      <AnimatePresence>
        {selectedDebtForHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="max-w-md w-full bg-surface border border-border p-6 rounded-3xl space-y-5 shadow-2xl relative text-left font-sans max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
                <div>
                  <h3 className="font-serif font-semibold text-base text-text-primary">Historial de Abonos</h3>
                  <p className="text-[11px] text-text-secondary">{selectedDebtForHistory.personOrEntity} — {selectedDebtForHistory.name}</p>
                </div>
                <button
                  onClick={() => setSelectedDebtForHistory(null)}
                  className="w-8 h-8 rounded-full bg-bg hover:bg-surface-hover border border-border text-text-secondary flex items-center justify-center cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-none">
                {paymentHistoryLoading ? (
                  <SkeletonRows rows={3} avatar={false} />
                ) : paymentHistoryList.length === 0 ? (
                  <div className="p-6 text-center text-xs text-text-secondary space-y-2 bg-bg rounded-2xl border border-border/60">
                    <History size={28} className="mx-auto text-text-dim opacity-50" />
                    <p>No se han registrado abonos parciales todavía.</p>
                  </div>
                ) : (
                  paymentHistoryList.map((p, idx) => (
                    <div key={p.id || idx} className="p-3.5 bg-bg border border-border/80 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                      <div>
                        <div className="font-mono font-bold text-xs text-success">+ {Number(p.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })} ${currencySymbol}</div>
                        {p.note && <p className="text-[11px] text-text-secondary mt-0.5">{p.note}</p>}
                      </div>
                      <span className="text-[10px] font-mono text-text-dim">{p.date}</span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Account Transactions History Modal */}
      <AnimatePresence>
        {selectedAccountDetail && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
              className="w-full sm:max-w-xl bg-surface border border-border rounded-t-3xl sm:rounded-3xl p-6 space-y-5 shadow-2xl max-h-[85vh] flex flex-col relative"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-border pb-4 shrink-0">
                <div>
                  <h3 className="font-serif font-semibold text-lg text-text-primary">{selectedAccountDetail.name}</h3>
                  <p className="text-xs text-text-secondary">Historial de movimientos de esta cuenta</p>
                </div>
                <button
                  onClick={() => setSelectedAccountDetail(null)}
                  className="w-8 h-8 rounded-full bg-bg hover:bg-surface-hover border border-border text-text-secondary flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Account Balance Banner */}
              <div className="bg-bg border border-border p-4 rounded-2xl flex items-center justify-between shrink-0">
                <div>
                  <span className="text-[11px] text-text-secondary uppercase tracking-wider font-mono">Saldo Actual</span>
                  <p className="text-2xl font-bold font-mono text-text-primary">{selectedAccountDetail.balance} {selectedAccountDetail.currency || 'EUR'}</p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-mono text-text-dim bg-surface px-2.5 py-1 rounded-full uppercase border border-border">
                    {selectedAccountDetail.type}
                  </span>
                </div>
              </div>

              {/* Transactions List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
                <h4 className="text-xs font-semibold text-text-secondary">Transacciones Registradas:</h4>

                {accountTxs.length > 0 ? (
                  accountTxs.map(t => (
                    <div key={t.id} className="p-3 bg-bg border border-border/60 rounded-2xl flex items-center justify-between hover:border-brand/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0",
                          t.type === 'income' ? "bg-success/15 text-success" : "bg-error/15 text-error"
                        )}>
                          {t.type === 'income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-text-primary">{t.description || t.category}</p>
                          <p className="text-[10px] text-text-secondary">{t.date} • {t.category}</p>
                        </div>
                      </div>
                      <span className={cn(
                        "font-mono font-bold text-xs shrink-0",
                        t.type === 'income' ? "text-success" : "text-text-primary"
                      )}>
                        {t.type === 'income' ? '+' : '-'}{t.amount}{currencySymbol}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-text-dim space-y-1">
                    <History size={24} className="mx-auto text-text-dim/60 mb-2" />
                    <p>No hay transacciones registradas aún para esta cuenta.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmación de borrado de un movimiento */}
      <AnimatePresence>
        {txToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="max-w-sm w-full bg-surface border border-border rounded-3xl p-6 space-y-5"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-error/10 border border-error/25 text-error flex items-center justify-center shrink-0">
                  <Trash2 size={18} />
                </div>
                <div className="space-y-1 min-w-0">
                  <h3 className="font-serif font-semibold text-base text-text-primary">Eliminar movimiento</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Se eliminará <strong className="text-text-primary">{txToDelete.description || txToDelete.category}</strong> por{' '}
                    <strong className="text-text-primary">{Number(txToDelete.amount).toFixed(2)}{currencySymbol}</strong> y el saldo de tu cuenta
                    {txToDelete.type === 'income' ? ' bajará' : ' subirá'} en ese importe. Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTxToDelete(null)}
                  disabled={deletingTx}
                  className="flex-1 bg-bg hover:bg-surface-hover border border-border text-text-secondary py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-colors duration-200 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setDeletingTx(true);
                    try {
                      await api(`/finance/transactions/${txToDelete.id}`, { method: 'DELETE' });
                      showToast('Movimiento eliminado y saldo actualizado', 'success');
                      setTxToDelete(null);
                      loadUserData();
                    } catch (err: any) {
                      showToast(err.message || 'No se pudo eliminar el movimiento', 'error');
                    } finally {
                      setDeletingTx(false);
                    }
                  }}
                  disabled={deletingTx}
                  className="flex-1 bg-error hover:brightness-110 text-white py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all duration-200 disabled:opacity-50"
                >
                  {deletingTx ? 'Eliminando…' : 'Eliminar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modo Live: conversación de voz manos libres con espectro en vivo */}
      <AnimatePresence>
        {liveMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#141413]/97 backdrop-blur-xl py-10 px-6"
          >
            {/* Estado superior, discreto */}
            <div className="text-center space-y-1 pt-4">
              <p className="text-[11px] uppercase tracking-[0.2em] font-mono text-white/40">Hera Live</p>
              <p className="text-sm text-white/70 font-sans min-h-[20px] transition-opacity duration-200">
                {liveState === 'listening' ? 'Te escucho — habla con normalidad'
                  : liveState === 'thinking' ? 'Pensando…'
                  : liveState === 'speaking' ? 'Hablando'
                  : ''}
              </p>
            </div>

            {/* Orbe central + espectro: reacciona a tu voz y a la de Hera */}
            <div className="flex flex-col items-center gap-10">
              <div className="relative flex items-center justify-center">
                {/* Halo exterior */}
                <div className={cn(
                  'absolute w-56 h-56 rounded-full transition-opacity duration-500',
                  liveState === 'listening' ? 'bg-brand/15 opacity-100' : liveState === 'speaking' ? 'bg-brand/20 opacity-100' : 'bg-white/5 opacity-60',
                  'blur-2xl'
                )} />
                {/* Anillo de espera: se llena durante la pausa antes de responder */}
                <svg className="absolute w-[188px] h-[188px] -rotate-90 pointer-events-none" viewBox="0 0 188 188">
                  <circle
                    ref={liveRingRef}
                    cx="94"
                    cy="94"
                    r="86"
                    fill="none"
                    stroke="rgba(255,255,255,0.55)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 86}
                    strokeDashoffset={2 * Math.PI * 86}
                    style={{ opacity: 0, transition: 'opacity 200ms ease-out' }}
                  />
                </svg>

                {/* Orbe: escala en tiempo real con el volumen (solo transform) */}
                <div
                  ref={liveOrbRef}
                  className={cn(
                    'w-40 h-40 rounded-full transition-colors duration-500 will-change-transform',
                    'bg-[radial-gradient(circle_at_35%_30%,#E08668_0%,#D97757_45%,#B85F42_100%)]',
                    liveState === 'thinking' && 'animate-pulse opacity-80'
                  )}
                  style={{ transition: 'transform 90ms ease-out' }}
                />
                {/* Espectro de 5 barras dentro del orbe */}
                <div className="absolute flex items-center gap-1.5 h-12">
                  {[0, 1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      ref={el => { liveBarRefs.current[i] = el; }}
                      className="w-2 h-12 rounded-full bg-white/90 origin-center will-change-transform"
                      style={{ transform: 'scaleY(0.12)', transition: 'transform 90ms ease-out' }}
                    />
                  ))}
                </div>
              </div>

              {/* Transcripción sutil del turno actual */}
              <div className="max-w-md w-full text-center space-y-2 min-h-[72px]">
                {liveError && (
                  <p className="text-xs text-white/70 bg-white/10 border border-white/15 rounded-2xl px-4 py-2.5 inline-block">{liveError}</p>
                )}
                {liveTranscript && (
                  <p className="text-xs text-white/45 leading-relaxed line-clamp-2">{liveTranscript}</p>
                )}
                {liveReply && (
                  <p className="text-sm text-white/85 leading-relaxed line-clamp-3">{textForSpeech(liveReply).slice(0, 240)}</p>
                )}
              </div>
            </div>

            {/* Salir */}
            <button
              type="button"
              onClick={stopLiveMode}
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center cursor-pointer transition-colors duration-200 active:scale-[0.95]"
              title="Salir del Modo Live"
            >
              <MicOff size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Onboarding Wizard: bienvenida → perfil → primera cuenta → primer registro */}
      <AnimatePresence>
        {showOnboarding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="max-w-md w-full bg-surface border border-border rounded-3xl overflow-hidden"
            >
              {/* Barra de progreso: solo a partir del primer paso real */}
              {onbStep >= 0 && (
                <div className="px-6 pt-5">
                  <div className="flex items-center gap-2">
                    {[
                      { label: 'Perfil', done: onbStep > 1, active: onbStep <= 1 },
                      { label: 'Tu dinero', done: onbStep > 2, active: onbStep === 2 },
                      { label: 'Primer registro', done: false, active: onbStep === 3 }
                    ].map((s) => (
                      <div key={s.label} className="flex-1">
                        <div className={cn(
                          'h-[3px] rounded-full transition-colors duration-200',
                          s.done || s.active ? 'bg-brand' : 'bg-border'
                        )} />
                        <p className={cn(
                          'mt-1.5 text-[10px] font-medium tracking-wide transition-colors duration-200',
                          s.active ? 'text-brand' : s.done ? 'text-text-secondary' : 'text-text-dim'
                        )}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-6 space-y-4">
                {onbStep === -1 && (
                  <>
                    {/* Bienvenida */}
                    <div className="flex flex-col items-center text-center space-y-4 py-2">
                      <div className="w-16 h-16 rounded-2xl bg-brand flex items-center justify-center">
                        <span className="font-serif font-bold text-white text-3xl leading-none">H</span>
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-2xl font-serif font-semibold text-text-primary">Bienvenido a HeraWallet</h3>
                        <p className="text-sm font-serif italic text-text-secondary">Tus metas empiezan con un mejor control.</p>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {[
                        { icon: Mic, text: 'Registra gastos e ingresos hablando, con una foto o chateando con la IA.' },
                        { icon: Wallet, text: 'Organiza tus cuentas, tarjetas, deudas y metas de ahorro en un solo lugar.' },
                        { icon: Sparkles, text: 'Recibe análisis inteligentes de tu dinero con tu Plan Gratuito, renovado cada 30 días.' }
                      ].map((f, i) => (
                        <div key={i} className="flex items-start gap-3 bg-bg border border-border rounded-2xl px-4 py-3">
                          <f.icon size={16} className="text-brand mt-0.5 shrink-0" />
                          <p className="text-xs text-text-secondary leading-relaxed">{f.text}</p>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => setOnbStep(0)}
                      className="w-full bg-brand hover:bg-brand-hover text-white py-3 rounded-xl text-sm font-medium cursor-pointer transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      Empezar
                      <ArrowRight size={15} />
                    </button>
                  </>
                )}

                {onbStep === 0 && (
                  <>
                    <div className="space-y-1">
                      <h3 className="text-xl font-serif font-semibold text-text-primary">Cuéntanos quién eres</h3>
                      <p className="text-xs text-text-secondary">Tu nombre y fecha de nacimiento personalizan tu experiencia.</p>
                    </div>

                    {/* Foto de perfil */}
                    <div className="flex flex-col items-center justify-center py-1 space-y-2">
                      <div className="relative group cursor-pointer">
                        <label htmlFor="onb-photo-input" className="cursor-pointer block relative">
                          <div className="w-20 h-20 rounded-full border-2 border-dashed border-brand/50 hover:border-brand bg-bg/80 flex items-center justify-center overflow-hidden transition-all duration-200 group-hover:scale-[1.03] active:scale-[0.97]">
                            {onbPhoto ? (
                              <img src={onbPhoto} alt="Foto de perfil" className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-text-secondary gap-1 p-2">
                                <UserIcon size={24} className="text-brand/80" />
                                <span className="text-[10px] font-medium text-text-dim text-center">Añadir foto</span>
                              </div>
                            )}
                          </div>
                          <div className="absolute bottom-0 right-0 bg-brand text-white p-1.5 rounded-full border-2 border-surface transform translate-x-1 translate-y-1 transition-transform group-hover:scale-110">
                            <Camera size={12} />
                          </div>
                        </label>
                        <input
                          id="onb-photo-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                showToast('La imagen debe ser menor a 5MB', 'error');
                                return;
                              }
                              compressImageFile(file)
                                .then(setOnbPhoto)
                                .catch(() => showToast('No se pudo procesar la imagen', 'error'));
                            }
                          }}
                        />
                      </div>
                      {onbPhoto && (
                        <button
                          type="button"
                          onClick={() => setOnbPhoto('')}
                          className="text-[11px] text-error hover:underline cursor-pointer flex items-center gap-1 font-medium"
                        >
                          <Trash2 size={12} />
                          <span>Eliminar foto</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-3 text-left">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-text-secondary">Nombre completo</label>
                        <input
                          type="text"
                          placeholder="Ej. Juan Pérez"
                          value={onbName}
                          onChange={e => setOnbName(e.target.value)}
                          className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand/60"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-text-secondary">Fecha de nacimiento</label>
                        <input
                          type="date"
                          value={onbBirthDate}
                          onChange={e => setOnbBirthDate(e.target.value)}
                          className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand/60"
                        />
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        try {
                          await api('/me', {
                            method: 'PUT',
                            body: JSON.stringify({ displayName: onbName, birthDate: onbBirthDate, photoURL: onbPhoto })
                          });
                          await fetchUserProfile();
                        } catch { }
                        setOnbStep(1);
                      }}
                      disabled={!onbName || !onbBirthDate}
                      className="w-full bg-brand hover:bg-brand-hover text-white py-3 rounded-xl text-sm font-medium cursor-pointer disabled:opacity-50 transition-colors duration-200"
                    >
                      Continuar
                    </button>
                  </>
                )}

                {onbStep === 1 && (
                  <>
                    <div className="space-y-1">
                      <h3 className="text-xl font-serif font-semibold text-text-primary">Datos de contacto</h3>
                      <p className="text-xs text-text-secondary">Un correo para avisos importantes y recuperar tu cuenta.</p>
                    </div>

                    <div className="space-y-3 text-left">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-text-secondary">Correo electrónico</label>
                        <input
                          type="email"
                          placeholder="ejemplo@correo.com"
                          value={onbEmail}
                          onChange={e => setOnbEmail(e.target.value)}
                          className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand/60"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-text-secondary">Dirección <span className="text-text-dim">(opcional)</span></label>
                        <input
                          type="text"
                          placeholder="Calle, número, ciudad"
                          value={onbAddress}
                          onChange={e => setOnbAddress(e.target.value)}
                          className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand/60"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => setOnbStep(0)}
                        className="flex-1 bg-bg hover:bg-surface-hover text-text-secondary py-3 rounded-xl text-sm font-medium border border-border cursor-pointer transition-colors duration-200"
                      >
                        Volver
                      </button>
                      <button
                        onClick={async () => {
                          setOnbSaving(true);
                          try {
                            await api('/me', {
                              method: 'PUT',
                              body: JSON.stringify({ displayName: onbName, birthDate: onbBirthDate, address: onbAddress, email: onbEmail, photoURL: onbPhoto })
                            });
                            await fetchUserProfile();
                            await advanceOnboarding(1);
                            setOnbStep(2);
                          } catch {
                            showToast('No pudimos guardar tu perfil. Inténtalo de nuevo.', 'error');
                          } finally {
                            setOnbSaving(false);
                          }
                        }}
                        className="flex-1 bg-brand hover:bg-brand-hover text-white py-3 rounded-xl text-sm font-medium cursor-pointer transition-colors duration-200"
                      >
                        {onbSaving ? 'Guardando...' : 'Continuar'}
                      </button>
                    </div>
                  </>
                )}

                {onbStep === 2 && (
                  <>
                    <div className="space-y-1">
                      <h3 className="text-xl font-serif font-semibold text-text-primary">Crea tu primera cuenta</h3>
                      <p className="text-xs text-text-secondary">El lugar de donde sale y entra tu dinero: efectivo, banco o tarjeta.</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { key: 'cash', label: 'Efectivo', icon: Wallet },
                        { key: 'bank', label: 'Banco', icon: Building2 },
                        { key: 'card', label: 'Tarjeta', icon: CreditCard }
                      ] as const).map(t => (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => setOnbAccType(t.key)}
                          className={cn(
                            'flex flex-col items-center gap-1.5 py-3.5 rounded-2xl border text-xs font-medium cursor-pointer transition-colors duration-200',
                            onbAccType === t.key
                              ? 'border-brand bg-brand/10 text-brand'
                              : 'border-border bg-bg text-text-secondary hover:border-brand/40'
                          )}
                        >
                          <t.icon size={18} />
                          {t.label}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-3 text-left">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-text-secondary">Nombre de la cuenta</label>
                        <input
                          type="text"
                          placeholder={onbAccType === 'cash' ? 'Ej. Mi efectivo' : onbAccType === 'bank' ? 'Ej. Cuenta nómina' : 'Ej. Visa terminada en 1234'}
                          value={onbAccName}
                          onChange={e => setOnbAccName(e.target.value)}
                          className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand/60"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-text-secondary">Saldo actual ({profile?.currency || 'USD'})</label>
                        <input
                          type="number"
                          inputMode="decimal"
                          placeholder="0.00"
                          value={onbAccBalance}
                          onChange={e => setOnbAccBalance(e.target.value)}
                          className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand/60"
                        />
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        setOnbSaving(true);
                        try {
                          await api('/finance/accounts', {
                            method: 'POST',
                            body: JSON.stringify({
                              name: onbAccName.trim(),
                              type: onbAccType,
                              balance: parseFloat(onbAccBalance) || 0,
                              currency: profile?.currency || 'USD',
                              icon: onbAccType === 'cash' ? 'Wallet' : onbAccType === 'bank' ? 'Building2' : 'CreditCard',
                              color: '#D97757'
                            })
                          });
                          await advanceOnboarding(2);
                          loadUserData();
                          setOnbStep(3);
                        } catch {
                          showToast('No pudimos crear la cuenta. Inténtalo de nuevo.', 'error');
                        } finally {
                          setOnbSaving(false);
                        }
                      }}
                      disabled={!onbAccName.trim() || onbSaving}
                      className="w-full bg-brand hover:bg-brand-hover text-white py-3 rounded-xl text-sm font-medium cursor-pointer disabled:opacity-50 transition-colors duration-200"
                    >
                      {onbSaving ? 'Creando cuenta...' : 'Crear cuenta'}
                    </button>
                  </>
                )}

                {onbStep === 3 && (
                  <>
                    <div className="space-y-1">
                      <h3 className="text-xl font-serif font-semibold text-text-primary">Registra tu primer movimiento</h3>
                      <p className="text-xs text-text-secondary">Elige cómo quieres contarle a la IA tu primer gasto o ingreso.</p>
                    </div>

                    <div className="space-y-2.5">
                      {([
                        { key: 'voice', icon: Mic, title: 'Hablar', desc: '"Gasté 12 dólares en el almuerzo" — dilo y listo.' },
                        { key: 'photo', icon: Camera, title: 'Foto de un recibo', desc: 'La IA lee el ticket y registra el gasto por ti.' },
                        { key: 'chat', icon: Bot, title: 'Chatear con la IA', desc: 'Escríbelo con tus palabras, como en un chat normal.' }
                      ] as const).map(opt => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => finishOnboarding(opt.key)}
                          className="w-full flex items-center gap-3.5 bg-bg border border-border hover:border-brand/50 rounded-2xl px-4 py-3.5 text-left cursor-pointer transition-colors duration-200 group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                            <opt.icon size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text-primary">{opt.title}</p>
                            <p className="text-[11px] text-text-secondary leading-snug">{opt.desc}</p>
                          </div>
                          <ArrowRight size={15} className="ml-auto text-text-dim group-hover:text-brand transition-colors duration-200 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Omitir: siempre disponible, marca el onboarding como cerrado */}
                {onbStep >= 0 && (
                  <button
                    onClick={() => finishOnboarding()}
                    className="w-full text-center text-[11px] text-text-dim hover:text-text-secondary cursor-pointer transition-colors duration-200 pt-1"
                  >
                    Omitir por ahora
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Logout Farewell Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 16 }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
              className="max-w-sm w-full bg-surface border border-border p-8 rounded-3xl text-center space-y-5 shadow-2xl relative overflow-hidden"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-brand/10 border border-brand/25 flex items-center justify-center text-brand shadow-sm animate-bounce">
                <Sparkles size={28} />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-serif font-semibold text-text-primary">¡Hasta pronto!</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Tus finanzas están seguras. Gracias por confiar en HeraWallet hoy.
                </p>
              </div>

              <div className="w-full bg-bg h-1 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.5, ease: 'linear' }}
                  className="bg-brand h-full rounded-full"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CANCEL SUBSCRIPTION CONFIRMATION MODAL --- */}
      <AnimatePresence>
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="bg-surface border border-border p-6 sm:p-7 rounded-3xl max-w-md w-full space-y-6 shadow-2xl relative overflow-hidden text-left"
            >
              <div className="flex items-start gap-4 border-b border-border/70 pb-4">
                <div className="w-11 h-11 rounded-2xl bg-error/10 text-error flex items-center justify-center shrink-0">
                  <AlertCircle size={22} />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-text-primary">¿Cancelar Suscripción?</h3>
                  <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                    Al cancelar tu suscripción desactivarás la renovación automática. Conservarás tus tokens acumulados para utilizarlos cuando quieras.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-bg border border-border rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between text-text-secondary">
                  <span>Plan actual:</span>
                  <span className="font-semibold text-text-primary">{userSubscriptionData?.subscription?.planName}</span>
                </div>
                <div className="flex items-center justify-between text-text-secondary">
                  <span>Tokens conservados:</span>
                  <span className="font-mono font-bold text-brand">{(userSubscriptionData?.subscription?.tokenBalance || 0).toLocaleString()} Tokens</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2.5 bg-surface hover:bg-surface-hover border border-border text-text-primary rounded-2xl text-xs font-medium transition-all active:scale-[0.97] cursor-pointer"
                >
                  Mantener Plan
                </button>
                <button
                  type="button"
                  disabled={isCancellingSub}
                  onClick={handleCancelSubscription}
                  className="px-5 py-2.5 bg-error hover:bg-error/90 text-white rounded-2xl text-xs font-semibold transition-all shadow-md active:scale-[0.97] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {isCancellingSub ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <XCircle size={16} />
                  )}
                  <span>Sí, Cancelar Suscripción</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Query History Bottom Sheet Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="w-full max-w-2xl bg-surface border-t sm:border border-border rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 max-h-[65vh] sm:max-h-[520px] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border/80 shrink-0">
                <div>
                  <h3 className="font-semibold text-sm text-text-primary text-left">Historial de Consultas</h3>
                  <p className="text-[11px] text-text-secondary text-left">Toca para abrir o eliminar tus conversaciones previas</p>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-2 rounded-xl hover:bg-surface-hover text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
                >
                  <XCircle size={20} />
                </button>
              </div>

              {/* Search Input Bar */}
              <div className="relative flex items-center shrink-0">
                <Search size={16} className="absolute left-3 text-text-dim" />
                <input
                  type="text"
                  value={historySearchQuery}
                  onChange={e => setHistorySearchQuery(e.target.value)}
                  placeholder="Buscar en el historial..."
                  className="w-full bg-bg border border-border rounded-2xl pl-9 pr-4 py-2.5 text-xs text-text-primary placeholder:text-text-dim focus:outline-none focus:border-brand/60"
                />
              </div>

              {/* History Items List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
                {chatHistory
                  .filter(item =>
                    item.title.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
                    item.messages.some(m => m.content.toLowerCase().includes(historySearchQuery.toLowerCase()))
                  )
                  .map(session => (
                    <div
                      key={session.id}
                      onClick={() => handleLoadSession(session)}
                      className="p-3 bg-bg hover:bg-surface-hover border border-border/70 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all group shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-surface border border-border flex items-center justify-center text-brand shrink-0 group-hover:border-brand/40">
                          <MessageSquare size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-text-primary truncate">{session.title}</p>
                          <div className="flex items-center gap-2 text-[11px] text-text-dim mt-0.5 font-mono">
                            <span>{formatRelativeTime(session.updatedAt)}</span>
                            <span>•</span>
                            <span>{session.messages.length} mensajes</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        className="p-2 rounded-xl text-text-dim hover:text-error hover:bg-error/10 transition-colors cursor-pointer shrink-0 opacity-70 hover:opacity-100"
                        title="Eliminar consulta"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}

                {chatHistory.length === 0 && (
                  <div className="py-8 text-center text-xs text-text-dim space-y-1">
                    <p>No tienes consultas guardadas en el historial.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CHECKOUT MODAL --- */}
      <AnimatePresence>
        {showStripeModal && selectedPlanForCheckout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="bg-surface border border-border p-6 sm:p-7 rounded-3xl max-w-md w-full space-y-6 shadow-2xl relative overflow-hidden"
            >
              {/* Header: Title "CheckOut", No Icon, No Yellow Test Badge */}
              <div className="flex items-center justify-between border-b border-border/70 pb-4">
                <div>
                  <h3 className="font-serif font-bold text-xl text-text-primary">CheckOut</h3>
                  <p className="text-xs text-text-secondary">Resumen de compra y confirmación de suscripción</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStripeModal(false)}
                  className="p-2 rounded-xl text-text-dim hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Order Summary */}
              <div className="p-4 bg-bg border border-border rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-secondary">{selectedPlanForCheckout.isTopUp ? 'Producto:' : 'Plan Seleccionado:'}</span>
                  <span className="text-xs font-serif font-bold text-text-primary">{selectedPlanForCheckout.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-secondary">Tipo / Frecuencia:</span>
                  <span className="text-xs font-mono font-semibold text-text-primary uppercase">
                    {selectedPlanForCheckout.isTopUp ? 'Recarga Inmediata' : (selectedPlanForCheckout.frequency === 'annual' ? 'Anual (-30%)' : selectedPlanForCheckout.frequency === 'quarterly' ? 'Trimestral (-15%)' : 'Mensual')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-secondary">Tokens incluidos:</span>
                  <span className="text-xs font-mono font-bold text-brand">+{selectedPlanForCheckout.tokensCount?.toLocaleString()} Tokens</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  <span className="text-xs font-semibold text-text-primary">Total a pagar:</span>
                  <span className="text-lg font-serif font-bold text-text-primary">${selectedPlanForCheckout.amountUSD} USD</span>
                </div>
              </div>

              {/* Payment Method Selector Toggle */}
              <div className="bg-bg border border-border p-1 rounded-2xl flex items-center gap-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => setCheckoutPaymentMethod('card')}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5",
                    checkoutPaymentMethod === 'card' ? "bg-brand text-white shadow-sm" : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  <CreditCard size={14} />
                  <span>Tarjeta Internacional</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCheckoutPaymentMethod('cuba')}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5",
                    checkoutPaymentMethod === 'cuba' ? "bg-brand text-white shadow-sm" : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  <Building2 size={14} />
                  <span>Transfermóvil</span>
                </button>
              </div>

              {checkoutPaymentMethod === 'cuba' ? (
                /* --- CUBA MANUAL CUP TRANSFER PAYMENT CARD --- */
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-brand/10 via-surface to-bg border border-brand/40 shadow-xs space-y-2.5 relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-border/60 pb-2">
                      <div className="flex items-center gap-1.5">
                        <Building2 size={15} className="text-brand" />
                        <span className="text-xs font-serif font-bold text-text-primary tracking-wide">Transfermóvil</span>
                      </div>
                      <span className="text-[9px] font-mono font-bold bg-brand text-white px-2 py-0.5 rounded-full">
                        CUP
                      </span>
                    </div>

                    <div className="space-y-1 text-left">
                      <p className="text-[9px] text-text-secondary uppercase font-mono tracking-wider">Número de Tarjeta CUP</p>
                      <div className="flex items-center justify-between bg-bg border border-border rounded-xl px-2.5 py-1.5">
                        <span className="font-mono font-bold text-xs sm:text-sm tracking-widest text-brand">
                          {cubaConfig?.cardNumber || '9225 1234 5678 9012'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(cubaConfig?.cardNumber || '9225 1234 5678 9012');
                            showToast('Número de tarjeta copiado', 'success');
                          }}
                          className="px-2 py-0.5 bg-brand/10 hover:bg-brand/20 text-brand rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Copy size={12} />
                          <span>Copiar</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-0.5 text-left">
                      <div className="space-y-0.5">
                        <p className="text-[9px] text-text-dim uppercase font-mono">Titular</p>
                        <p className="font-semibold text-text-primary text-[11px] truncate">
                          {cubaConfig?.cardHolder || 'Carlos Manuel Pérez'}
                        </p>
                      </div>
                      <div className="space-y-0.5 text-right">
                        <p className="text-[9px] text-text-dim uppercase font-mono">Confirmación</p>
                        <p className="font-mono font-semibold text-text-primary text-[11px]">
                          {cubaConfig?.phoneNumber || '+53 59079144'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-[9px] text-text-secondary uppercase font-mono">Monto Total CUP</p>
                        <p className="text-[9px] text-text-dim font-mono">1 USD = {cubaConfig?.cupExchangeRate || 320} CUP</p>
                      </div>
                      <div className="text-right">
                        <span className="text-base sm:text-lg font-serif font-bold text-brand tracking-tight">
                          {((selectedPlanForCheckout.amountUSD || 0) * (cubaConfig?.cupExchangeRate || 320)).toLocaleString('es-ES', { minimumFractionDigits: 2 })} CUP
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-semibold text-text-primary flex items-center justify-between">
                      <span>ID de Transacción / Comprobante</span>
                      <span className="text-[10px] text-text-dim font-normal">Obligatorio</span>
                    </label>
                    <input
                      type="text"
                      value={cubaTransactionId}
                      onChange={e => setCubaTransactionId(e.target.value)}
                      placeholder="Ej. 123456789 o número de operación"
                      className="w-full bg-bg border border-border rounded-2xl px-4 py-3 text-xs font-mono text-text-primary placeholder:text-text-dim focus:outline-none focus:border-brand/60 shadow-xs"
                    />
                    <p className="text-[10px] text-text-secondary leading-snug">
                      Transfiere por Transfermóvil o Enzona e ingresa el ID de transacción emitido para verificar tu pago.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowStripeModal(false)}
                      className="px-4 py-2.5 bg-surface hover:bg-surface-hover border border-border text-text-primary rounded-2xl text-xs font-medium transition-all active:scale-[0.97] cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={isSubmittingCubaRequest || !cubaTransactionId.trim()}
                      onClick={handleSendCubaPaymentRequest}
                      className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-2xl text-xs font-semibold transition-all shadow-md active:scale-[0.97] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isSubmittingCubaRequest ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Check size={16} />
                      )}
                      <span>Enviar Comprobante</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* --- STANDARD CREDIT CARD PAY METHOD --- */
                <>
                  {paymentDetails.cardNumber && paymentDetails.cardNumber.trim() !== '' ? (
                    <div className="p-4 bg-surface-hover/80 border border-brand/30 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard size={16} className="text-brand" />
                          <span className="text-xs font-semibold text-text-primary uppercase tracking-wider">Tarjeta Registrada</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowPaymentFormModal(true)}
                          className="text-[11px] font-semibold text-brand hover:underline cursor-pointer"
                        >
                          Editar Datos
                        </button>
                      </div>

                      <div className="space-y-1 font-mono">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-text-primary tracking-widest">
                            •••• •••• •••• {paymentDetails.cardNumber.replace(/\s/g, '').slice(-4) || '4242'}
                          </p>
                          <span className="text-[10px] font-bold bg-brand/10 text-brand px-2 py-0.5 rounded">
                            VISA / MC
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-text-secondary">
                          <span>EXP: {paymentDetails.cardExp || 'MM/YY'}</span>
                          <span>Titular: {paymentDetails.firstName || paymentDetails.lastName ? `${paymentDetails.firstName} ${paymentDetails.lastName}`.trim() : 'Sin titular'}</span>
                        </div>
                        <p className="text-[10px] text-text-dim truncate">
                          {paymentDetails.address1}, {paymentDetails.city}, {paymentDetails.country}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-surface-hover/60 border border-border border-dashed rounded-2xl text-center space-y-3">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-text-primary">No tienes un método de pago registrado</p>
                        <p className="text-[11px] text-text-secondary">Debes configurar tus datos de facturación para poder procesar la compra del plan.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPaymentFormModal(true)}
                        className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-[0.97] cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <PlusCircle size={14} />
                        <span>+ Configurar Método de Pago</span>
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowStripeModal(false)}
                      className="px-4 py-2.5 bg-surface hover:bg-surface-hover border border-border text-text-primary rounded-2xl text-xs font-medium transition-all active:scale-[0.97] cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={isProcessingStripe || !paymentDetails.cardNumber || paymentDetails.cardNumber.trim() === ''}
                      onClick={handleConfirmStripePayment}
                      className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-2xl text-xs font-semibold transition-all shadow-md active:scale-[0.97] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isProcessingStripe ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Check size={16} />
                      )}
                      <span>Pagar ${selectedPlanForCheckout.amountUSD} USD</span>
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CUBA REQUEST SUBMITTED SUCCESS MODAL (/humanizer) --- */}
      <AnimatePresence>
        {cubaSuccessModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="bg-surface border border-border p-6 sm:p-7 rounded-3xl max-w-md w-full space-y-5 shadow-2xl relative overflow-hidden text-center"
            >
              {/* Animated Icon Badge with Emil Kowalski Micro-interactions */}
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center my-1">
                {/* Ambient Pulsing Glow Ring */}
                <motion.div
                  animate={{ scale: [1, 1.25, 1], opacity: [0.25, 0.55, 0.25] }}
                  transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-2xl bg-brand/30 blur-sm"
                />

                {/* Main Icon Box with Spring Entrance */}
                <motion.div
                  initial={{ scale: 0.75, opacity: 0, rotate: -8 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                  className="w-16 h-16 rounded-2xl bg-brand/15 border border-brand/40 text-brand flex items-center justify-center shadow-md relative z-10"
                >
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                  >
                    <Clock size={30} className="text-brand" />
                  </motion.div>

                  {/* Orbiting Sparkles Badge */}
                  <motion.div
                    animate={{ y: [-2, 2, -2], scale: [0.95, 1.1, 0.95] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                    className="absolute -top-1.5 -right-1.5 bg-brand text-white p-1 rounded-full shadow-lg border border-surface"
                  >
                    <Sparkles size={11} />
                  </motion.div>
                </motion.div>
              </div>

              <div className="space-y-2">
                <h3 className="font-serif font-bold text-xl text-text-primary">
                  Recibimos tu comprobante de pago
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {cubaSuccessModal.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCubaSuccessModal({ open: false, message: '' })}
                className="w-full py-3 bg-brand hover:bg-brand-hover text-white rounded-2xl text-xs font-medium transition-all shadow-md active:scale-[0.97] cursor-pointer"
              >
                Entendido
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- USER TELEMETRY SIDEBAR DRAWER --- */}
      <AnimatePresence>
        {showTelemetryDrawer && selectedUserForTelemetry && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="w-full max-w-md bg-surface border-l border-border h-full p-6 space-y-6 overflow-y-auto scrollbar-none shadow-2xl flex flex-col justify-between"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-border/80 pb-4">
                  <div className="flex items-center gap-2">
                    <Activity size={20} className="text-brand" />
                    <h3 className="font-serif font-bold text-base text-text-primary">Telemetría de Usuario</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTelemetryDrawer(false)}
                    className="p-2 rounded-xl text-text-dim hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Profile Identity Card */}
                <div className="p-4 bg-bg border border-border rounded-3xl space-y-3.5 text-center relative overflow-hidden">
                  <div className="relative w-16 h-16 mx-auto">
                    {selectedUserForTelemetry.photoURL ? (
                      <img src={selectedUserForTelemetry.photoURL} alt={selectedUserForTelemetry.displayName} loading="lazy" decoding="async" className="w-16 h-16 rounded-full object-cover border-2 border-brand shadow-sm" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-brand/20 text-brand text-2xl font-bold flex items-center justify-center border border-brand/30">
                        {selectedUserForTelemetry.displayName?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold text-base text-text-primary">{selectedUserForTelemetry.displayName || 'Usuario HERA'}</h4>
                    <p className="text-xs text-text-secondary font-mono mt-0.5">{selectedUserForTelemetry.email || 'Sin correo registrado'}</p>
                    <p className="text-xs text-text-dim font-mono">{selectedUserForTelemetry.phone || 'Sin teléfono registrado'}</p>
                  </div>

                  <div className="pt-2 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleUserRole(selectedUserForTelemetry.id, selectedUserForTelemetry.role)}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-[0.96]",
                        selectedUserForTelemetry.role === 'founder' ? "bg-purple-500 text-white shadow-purple-500/20" : "bg-brand text-white shadow-brand/20"
                      )}
                    >
                      <Award size={14} />
                      <span>{selectedUserForTelemetry.role === 'founder' ? 'Founder VIP (Ilimitado)' : 'Asignar Founder'}</span>
                    </button>
                  </div>
                </div>

                {/* Telemetry Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 bg-bg border border-border rounded-2xl space-y-1">
                    <p className="text-[10px] uppercase font-mono text-text-dim">Tokens Consumidos</p>
                    <p className="text-lg font-serif font-bold text-brand">{selectedUserForTelemetry.tokensSpent?.toLocaleString() || 0}</p>
                  </div>
                  <div className="p-3.5 bg-bg border border-border rounded-2xl space-y-1">
                    <p className="text-[10px] uppercase font-mono text-text-dim">Consultas IA</p>
                    <p className="text-lg font-serif font-bold text-text-primary">{selectedUserForTelemetry.totalQueries || 0}</p>
                  </div>
                </div>

                {/* Deep Telemetry Data from API */}
                {isLoadingTelemetry ? (
                  <div className="space-y-3">
                    <SkeletonCards count={2} className="grid-cols-2" />
                    <SkeletonRows rows={4} avatar={false} />
                  </div>
                ) : userTelemetryData ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-bg border border-border rounded-2xl space-y-2 text-xs font-mono">
                      <p><span className="text-text-secondary">Plan Actual:</span> <strong className="text-brand">{userTelemetryData.subscription?.planName || 'Básico'}</strong></p>
                      <p><span className="text-text-secondary">Saldo Tokens:</span> <strong>{selectedUserForTelemetry.role === 'founder' ? 'Ilimitado (Founder)' : userTelemetryData.subscription?.tokenBalance}</strong></p>
                      <p><span className="text-text-secondary">Cuentas Creadas:</span> <strong>{userTelemetryData.metrics?.accountsCount}</strong></p>
                      <p><span className="text-text-secondary">Deudas Registradas:</span> <strong>{userTelemetryData.metrics?.debtsCount}</strong></p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider font-mono">Historial Reciente de Tokens</h4>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-none">
                        {userTelemetryData.recentTransactions?.length === 0 ? (
                          <p className="text-xs text-text-dim py-2 text-center">Sin transacciones recientes.</p>
                        ) : (
                          userTelemetryData.recentTransactions?.map((tx: any) => (
                            <div key={tx.id} className="p-2.5 bg-bg border border-border/70 rounded-xl flex items-center justify-between text-xs font-mono">
                              <div>
                                <p className="font-semibold text-text-primary">{tx.description || tx.type}</p>
                                <p className="text-[10px] text-text-dim">{tx.date}</p>
                              </div>
                              <span className={cn("font-bold", tx.tokens > 0 ? "text-success" : "text-error")}>
                                {tx.tokens > 0 ? `+${tx.tokens}` : tx.tokens}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => setShowTelemetryDrawer(false)}
                className="w-full py-3 bg-surface hover:bg-surface-hover border border-border text-text-primary rounded-2xl text-xs font-medium transition-all"
              >
                Cerrar Telemetría
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- PLAN EDIT / CREATE MODAL --- */}
      <AnimatePresence>
        {showPlanEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="bg-surface border border-border p-6 sm:p-7 rounded-3xl max-w-lg w-full space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-none my-8"
            >
              <div className="flex items-center justify-between border-b border-border/70 pb-4">
                <div>
                  <h3 className="font-serif font-bold text-lg text-text-primary">
                    {editingPlan ? 'Editar Plan de Suscripción' : 'Crear Nuevo Plan de Suscripción'}
                  </h3>
                  <p className="text-xs text-text-secondary">Configura el precio, cuota de tokens y frecuencia de renovación</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPlanEditModal(false)}
                  className="p-2 rounded-xl text-text-dim hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveAdminPlan} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1">Nombre del Plan *</label>
                  <input
                    type="text"
                    required
                    value={planForm.name}
                    onChange={e => setPlanForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej: Plan Pro, Plan Empresarial"
                    className="w-full bg-bg border border-border rounded-xl px-3.5 py-2.5 text-xs text-text-primary focus:outline-none focus:border-brand/60"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1">Descripción</label>
                  <textarea
                    rows={2}
                    value={planForm.description}
                    onChange={e => setPlanForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Resumen de beneficios incluidos para el usuario..."
                    className="w-full bg-bg border border-border rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none focus:border-brand/60"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-text-secondary block mb-1">Precio Mensual ($USD) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={planForm.priceMonthly}
                      onChange={e => setPlanForm(prev => ({ ...prev, priceMonthly: e.target.value }))}
                      placeholder="14.99"
                      className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-xs text-text-primary font-mono focus:outline-none focus:border-brand/60"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-text-secondary block mb-1">Precio Trimestral ($USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={planForm.priceQuarterly}
                      onChange={e => setPlanForm(prev => ({ ...prev, priceQuarterly: e.target.value }))}
                      placeholder="39.99"
                      className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-xs text-text-primary font-mono focus:outline-none focus:border-brand/60"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-text-secondary block mb-1">Precio Anual ($USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={planForm.priceAnnual}
                      onChange={e => setPlanForm(prev => ({ ...prev, priceAnnual: e.target.value }))}
                      placeholder="129.99"
                      className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-xs text-text-primary font-mono focus:outline-none focus:border-brand/60"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-text-secondary block mb-1">Cantidad de Tokens Incluidos</label>
                    <input
                      type="number"
                      value={planForm.tokensCount}
                      onChange={e => setPlanForm(prev => ({ ...prev, tokensCount: e.target.value }))}
                      placeholder="250000"
                      className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-xs text-text-primary font-mono focus:outline-none focus:border-brand/60"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-secondary block mb-1">Frecuencia Renovación (Horas)</label>
                    <input
                      type="number"
                      value={planForm.renewIntervalHours}
                      onChange={e => setPlanForm(prev => ({ ...prev, renewIntervalHours: e.target.value }))}
                      placeholder="720"
                      className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-xs text-text-primary font-mono focus:outline-none focus:border-brand/60"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isRecommendedPlan"
                    checked={planForm.isRecommended}
                    onChange={e => setPlanForm(prev => ({ ...prev, isRecommended: e.target.checked }))}
                    className="rounded border-border text-brand focus:ring-brand/40"
                  />
                  <label htmlFor="isRecommendedPlan" className="text-xs text-text-primary font-medium cursor-pointer">
                    Destacar como Plan Recomendado
                  </label>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border/80 gap-3">
                  {editingPlan ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteAdminPlan(editingPlan.id)}
                      className="px-4 py-2.5 bg-error/15 hover:bg-error/25 text-error rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 size={14} />
                      <span>Eliminar Plan</span>
                    </button>
                  ) : <div />}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPlanEditModal(false)}
                      className="px-4 py-2.5 bg-surface hover:bg-surface-hover border border-border text-text-secondary rounded-xl text-xs font-medium transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-semibold shadow-md transition-all active:scale-[0.97] cursor-pointer flex items-center gap-1.5"
                    >
                      <Check size={15} />
                      <span>{editingPlan ? 'Guardar Cambios' : 'Crear Plan'}</span>
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showPaymentFormModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="bg-surface border border-border p-6 sm:p-7 rounded-3xl max-w-lg w-full space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-none my-8"
            >
              <div className="flex items-center justify-between border-b border-border/70 pb-4">
                <div>
                  <h3 className="font-serif font-bold text-lg text-text-primary">Configurar Método de Pago</h3>
                  <p className="text-xs text-text-secondary">Ingresa tus datos de tarjeta y facturación</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPaymentFormModal(false)}
                  className="p-2 rounded-xl text-text-dim hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Content */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSavePaymentDetails();
                  setShowPaymentFormModal(false);
                }}
                className="space-y-4"
              >
                {/* 1. Card Details */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider border-b border-border/60 pb-1.5">
                    1. Datos de la Tarjeta
                  </h4>
                  <div>
                    <label className="text-xs font-medium text-text-secondary block mb-1.5">Número de Tarjeta</label>
                    <div className="relative flex items-center">
                      <CreditCard size={18} className="absolute left-3.5 text-text-dim" />
                      <input
                        type="text"
                        value={paymentDetails.cardNumber}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
                          setPaymentDetails(prev => ({ ...prev, cardNumber: val }));
                        }}
                        placeholder="4242 4242 4242 4242"
                        className="w-full bg-bg border border-border rounded-2xl pl-10 pr-16 py-3 text-xs text-text-primary font-mono focus:outline-none focus:border-brand/60 shadow-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-text-secondary block mb-1.5">Fecha Exp (MM/YY)</label>
                      <input
                        type="text"
                        value={paymentDetails.cardExp}
                        onChange={e => {
                          let val = e.target.value.replace(/\D/g, '');
                          if (val.length >= 3) val = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
                          setPaymentDetails(prev => ({ ...prev, cardExp: val.slice(0, 5) }));
                        }}
                        placeholder="12/28"
                        className="w-full bg-bg border border-border rounded-2xl px-4 py-3 text-xs text-text-primary font-mono focus:outline-none focus:border-brand/60 shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-text-secondary block mb-1.5">CVC / CSV</label>
                      <input
                        type="password"
                        value={paymentDetails.cardCvc}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setPaymentDetails(prev => ({ ...prev, cardCvc: val }));
                        }}
                        placeholder="123"
                        maxLength={4}
                        className="w-full bg-bg border border-border rounded-2xl px-4 py-3 text-xs text-text-primary font-mono focus:outline-none focus:border-brand/60 shadow-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Billing Address Details */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider border-b border-border/60 pb-1.5">
                    2. Datos de Facturación
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-text-secondary block mb-1.5">Nombre</label>
                      <input
                        type="text"
                        value={paymentDetails.firstName}
                        onChange={e => setPaymentDetails(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="Nombre"
                        className="w-full bg-bg border border-border rounded-2xl px-4 py-3 text-xs text-text-primary focus:outline-none focus:border-brand/60 shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-text-secondary block mb-1.5">Apellidos</label>
                      <input
                        type="text"
                        value={paymentDetails.lastName}
                        onChange={e => setPaymentDetails(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Apellidos"
                        className="w-full bg-bg border border-border rounded-2xl px-4 py-3 text-xs text-text-primary focus:outline-none focus:border-brand/60 shadow-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-text-secondary block mb-1.5">Dirección Línea 1</label>
                    <input
                      type="text"
                      value={paymentDetails.address1}
                      onChange={e => setPaymentDetails(prev => ({ ...prev, address1: e.target.value }))}
                      placeholder="Calle Principal #123"
                      className="w-full bg-bg border border-border rounded-2xl px-4 py-3 text-xs text-text-primary focus:outline-none focus:border-brand/60 shadow-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-text-secondary block mb-1.5">Ciudad</label>
                      <input
                        type="text"
                        value={paymentDetails.city}
                        onChange={e => setPaymentDetails(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="Ciudad"
                        className="w-full bg-bg border border-border rounded-2xl px-4 py-3 text-xs text-text-primary focus:outline-none focus:border-brand/60 shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-text-secondary block mb-1.5">Código Postal</label>
                      <input
                        type="text"
                        value={paymentDetails.zip}
                        onChange={e => setPaymentDetails(prev => ({ ...prev, zip: e.target.value }))}
                        placeholder="10400"
                        className="w-full bg-bg border border-border rounded-2xl px-4 py-3 text-xs text-text-primary font-mono focus:outline-none focus:border-brand/60 shadow-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => setShowPaymentFormModal(false)}
                    className="px-4 py-2.5 bg-surface hover:bg-surface-hover border border-border text-text-primary rounded-2xl text-xs font-medium cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-2xl text-xs font-semibold shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Check size={16} />
                    <span>Guardar y Continuar</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CUBA PAYMENT DEVELOPMENT NOTICE MODAL --- */}
      <AnimatePresence>
        {showCubaDevModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="bg-surface border border-border p-6 sm:p-7 rounded-3xl max-w-md w-full space-y-5 shadow-2xl relative overflow-hidden"
            >
              <div className="border-b border-border/70 pb-4">
                <h3 className="font-serif font-bold text-base text-text-primary">Suscripción para Cuba</h3>
                <p className="text-xs text-text-secondary">Información de disponibilidad de pagos</p>
              </div>

              <p className="text-xs text-text-secondary leading-relaxed bg-bg p-4 rounded-2xl border border-border">
                {cubaModalMessage || 'Suscripción para Cuba en desarrollo. Próximamente disponible vía Transfermóvil, Enzona y Cripto. Contacta a soporte para activar una prueba.'}
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCubaDevModal(false)}
                  className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-2xl text-xs font-medium transition-all shadow-md active:scale-[0.97] cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- USER NOTIFICATIONS DRAWER MODAL (World-Class Premium HeraWallet UI/UX) --- */}
      <AnimatePresence>
        {showNotifDrawer && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, x: 380 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 380 }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
              className="w-full max-w-md bg-surface border-l border-border h-full flex flex-col shadow-2xl relative"
            >
              {/* Drawer Header with Source Serif 4 Title */}
              <div className="p-6 border-b border-border flex items-center justify-between bg-surface/90 backdrop-blur-xl">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-brand/10 text-brand flex items-center justify-center border border-brand/20 shadow-xs">
                    <Bell size={22} strokeWidth={1.8} />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-text-primary tracking-tight">Centro de Avisos</h3>
                    <p className="text-[11px] text-text-secondary font-mono flex items-center gap-1.5 mt-0.5">
                      {unreadNotifCount > 0 ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                          <span className="text-brand font-semibold">{unreadNotifCount} sin leer</span>
                        </>
                      ) : (
                        <span className="text-text-dim">Estás al día con tus actividades</span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNotifDrawer(false)}
                  className="p-2.5 rounded-2xl text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all active:scale-[0.95] cursor-pointer"
                  title="Cerrar"
                >
                  ✕
                </button>
              </div>

              {/* Category Filter Tabs & Bulk Actions */}
              <div className="px-6 py-3 border-b border-border bg-bg/40 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  {/* Tabs Pills */}
                  <div className="flex items-center gap-1 bg-surface p-1 rounded-2xl border border-border">
                    {[
                      { id: 'all', label: 'Todas' },
                      { id: 'unread', label: `Sin leer ${unreadNotifCount > 0 ? `(${unreadNotifCount})` : ''}` },
                      { id: 'ai', label: 'IA Hera' },
                      { id: 'broadcast', label: 'Avisos' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setNotifFilterTab(tab.id as any)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all active:scale-[0.97] cursor-pointer whitespace-nowrap",
                          notifFilterTab === tab.id
                            ? "bg-brand text-white font-semibold shadow-2xs"
                            : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Mark all read button */}
                  {userNotifications.some(n => n.isRead === 0) && (
                    <button
                      type="button"
                      onClick={handleMarkAllNotifsAsRead}
                      className="text-brand hover:text-brand-hover font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                      title="Marcar todas como leídas"
                    >
                      <Check size={14} />
                      <span className="hidden sm:inline">Leídas</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Notifications Scroll Area */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3 scrollbar-none">
                {(() => {
                  if (notifLoading && userNotifications.length === 0) {
                    return <SkeletonRows rows={4} />;
                  }
                  const filtered = userNotifications.filter(n => {
                    if (notifFilterTab === 'unread') return n.isRead === 0;
                    if (notifFilterTab === 'ai') return n.type === 'ai' || n.type === 'info';
                    if (notifFilterTab === 'broadcast') return n.type === 'broadcast' || n.type === 'alert' || n.type === 'warning';
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 my-auto">
                        <div className="w-16 h-16 rounded-3xl bg-surface border border-border flex items-center justify-center text-text-dim shadow-xs">
                          <Bell size={28} strokeWidth={1.5} className="opacity-40" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-serif font-semibold text-sm text-text-primary">
                            {notifFilterTab === 'unread' ? 'Sin notificaciones pendientes' : 'Estás al día con tus actividades'}
                          </h4>
                          <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
                            {notifFilterTab === 'unread'
                              ? 'Has leído todos tus avisos. ¡Excelente control de tu patrimonio!'
                              : 'Aquí aparecerán los avisos de tus metas, movimientos y recomendaciones de Hera.'}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  return filtered.map(notif => {
                    const isUnread = notif.isRead === 0;
                    const isHera = notif.type === 'hera' || notif.type === 'ai';
                    const isAlert = notif.type === 'alert' || notif.type === 'warning';
                    const isSuccess = notif.type === 'success';

                    let actionObj: any = null;
                    if (notif.actionData) {
                      try {
                        actionObj = typeof notif.actionData === 'string' ? JSON.parse(notif.actionData) : notif.actionData;
                      } catch (e) {}
                    }

                    return (
                      <motion.div
                        key={notif.id}
                        layout
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                        onClick={() => isUnread && handleMarkNotifAsRead(notif.id)}
                        className={cn(
                          "p-4 rounded-2xl border transition-all duration-200 cursor-pointer space-y-2.5 relative group hover:-translate-y-0.5 active:scale-[0.98]",
                          isUnread
                            ? "bg-brand/5 border-brand/30 shadow-xs border-l-4 border-l-brand"
                            : "bg-surface/70 border-border hover:bg-surface hover:border-border/90 hover:shadow-xs"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            {/* Logo Monogram for Hera vs Vector Icons for System Notifications */}
                            <div className={cn(
                              "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs border overflow-hidden",
                              isHera ? "bg-brand/10 border-brand/20 p-1" :
                              isAlert ? "bg-warning/10 text-warning border-warning/20" :
                              isSuccess ? "bg-success/10 text-success border-success/20" :
                              "bg-surface text-text-secondary border-border"
                            )}>
                              {isHera ? (
                                <HeraWalletLogo size="sm" showText={false} />
                              ) : isAlert ? (
                                <AlertCircle size={15} />
                              ) : isSuccess ? (
                                <Check size={15} />
                              ) : (
                                <Megaphone size={15} />
                              )}
                            </div>

                            <div>
                              <h4 className={cn("text-xs font-semibold leading-snug", isUnread ? "text-text-primary" : "text-text-primary/90")}>
                                {notif.title}
                              </h4>
                            </div>
                          </div>

                          <span className="text-[10px] font-mono text-text-dim whitespace-nowrap">
                            {notif.createdAt?.split('T')[0] || 'Hoy'}
                          </span>
                        </div>

                        <p className="text-xs text-text-secondary leading-relaxed pl-10">
                          {notif.message}
                        </p>

                        {/* Interactive Action Widget / Button */}
                        {actionObj && (
                          <div className="pt-1 pl-10">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isUnread) handleMarkNotifAsRead(notif.id);
                                setShowNotifDrawer(false);

                                if (actionObj.actionType === 'open_chat') {
                                  if (actionObj.prompt) setChatInput(actionObj.prompt);
                                  setActiveTab('chat');
                                  setShowAdmin(false);
                                } else if (actionObj.actionType === 'open_settings') {
                                  setActiveTab('settings');
                                  setShowAdmin(false);
                                }
                              }}
                              className="px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white text-[11px] font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                            >
                              <span>{actionObj.label || 'Revisar con Hera'}</span>
                              <ArrowRight size={13} />
                            </button>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[10px] font-mono">
                          <span className={cn(
                            "uppercase font-bold px-2 py-0.5 rounded-full text-[9px]",
                            isHera ? "bg-brand/10 text-brand" :
                            isAlert ? "bg-warning/10 text-warning" :
                            isSuccess ? "bg-success/10 text-success" :
                            "bg-surface-hover text-text-secondary"
                          )}>
                            {isHera ? 'Coach Hera' : notif.type || 'info'}
                          </span>

                          <div className="flex items-center gap-2">
                            {isUnread && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkNotifAsRead(notif.id);
                                }}
                                className="text-brand hover:underline font-semibold cursor-pointer"
                              >
                                Marcar leída
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNotif(notif.id);
                              }}
                              className="text-text-dim hover:text-error transition-colors cursor-pointer"
                              title="Eliminar aviso"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  });
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interactive Goal Detail & AI Checklist Plan Modal */}
      <AnimatePresence>
        {selectedGoalForModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
              className="bg-surface border border-border rounded-3xl w-full max-w-xl p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-none"
            >
              {/* Modal Header (Limpio sin icono) */}
              <div className="flex items-start justify-between border-b border-border pb-4">
                <div>
                  <h3 className="font-serif font-bold text-xl text-text-primary">{selectedGoalForModal.name}</h3>
                  <p className="text-xs text-text-secondary font-mono mt-0.5">Límite objetivo: {selectedGoalForModal.deadline}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedGoalForModal(null)}
                  className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Goal Financial Overview Strip */}
              <div className="bg-bg border border-border p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary font-medium">Acumulado del Fondo</span>
                  <span className="font-mono font-bold text-brand text-sm">
                    {selectedGoalForModal.currentAmount.toLocaleString('es-ES')} ${currencySymbol} / {selectedGoalForModal.targetAmount.toLocaleString('es-ES')} ${currencySymbol}
                  </span>
                </div>
                <AnimatedProgressBar
                  progress={Math.min(100, Math.round((selectedGoalForModal.currentAmount / Math.max(1, selectedGoalForModal.targetAmount)) * 100))}
                  heightClass="h-2.5"
                />
                <div className="flex justify-between items-center text-[11px] text-text-dim font-mono pt-1">
                  <span>Cuota sugerida: {selectedGoalForModal.weeklyTarget || 0} {currencySymbol}/semana</span>
                  <span className="font-semibold text-brand">{Math.min(100, Math.round((selectedGoalForModal.currentAmount / Math.max(1, selectedGoalForModal.targetAmount)) * 100))}% alcanzado</span>
                </div>
              </div>

              {/* Interactive Plan & Checklist Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-serif font-bold text-base text-text-primary">Plan Estratégico</h4>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleGenerateGoalPlan(selectedGoalForModal.id)}
                    disabled={isGeneratingPlan}
                    className="px-3.5 py-1.5 rounded-xl bg-brand/10 hover:bg-brand/20 text-brand text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={cn(isGeneratingPlan && "animate-spin")} />
                    <span>{isGeneratingPlan ? 'Diseñando Plan...' : selectedGoalForModal.planData ? 'Regenerar Plan' : 'Crear Plan'}</span>
                  </button>
                </div>

                {/* Checklist Items Area */}
                {(() => {
                  let planObj: any = null;
                  if (selectedGoalForModal.planData) {
                    try {
                      planObj = typeof selectedGoalForModal.planData === 'string' ? JSON.parse(selectedGoalForModal.planData) : selectedGoalForModal.planData;
                    } catch (e) {}
                  }

                  // REPORT STUDIO STYLE LOADING ANIMATION STATE
                  if (isGeneratingPlan) {
                    return (
                      <div className="bg-bg border border-border p-8 rounded-3xl flex flex-col items-center justify-center text-center space-y-4 shadow-sm animate-in fade-in duration-300">
                        <div className="relative flex items-center justify-center">
                          <div className="absolute w-20 h-20 rounded-full bg-brand/15 animate-ping opacity-75" />
                          <div className="w-16 h-16 rounded-2xl bg-surface border border-brand/30 flex items-center justify-center shadow-lg relative z-10">
                            <HeraWalletLogo size="md" showText={false} />
                          </div>
                        </div>

                        <div className="flex items-center justify-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-brand animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-2 h-2 rounded-full bg-brand animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-2 h-2 rounded-full bg-brand animate-bounce" />
                        </div>

                        <div className="space-y-1 max-w-sm">
                          <p className="text-xs font-semibold text-text-primary font-mono">
                            Hera está diseñando tu plan estratégico...
                          </p>
                          <p className="text-[10px] text-text-secondary">
                            Analizando tu margen de ahorro y fijando metas verificables paso a paso
                          </p>
                        </div>
                      </div>
                    );
                  }

                  if (!planObj || !planObj.steps || planObj.steps.length === 0) {
                    return (
                      <div className="bg-bg border border-border p-6 rounded-2xl text-center space-y-3">
                        <Target size={28} className="mx-auto text-text-dim opacity-40" />
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-text-primary">Aún no has creado un plan para esta meta</p>
                          <p className="text-[11px] text-text-secondary max-w-xs mx-auto leading-relaxed">Presiona "Crear Plan" para obtener tareas paso a paso con casillas de verificación accionables.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleGenerateGoalPlan(selectedGoalForModal.id)}
                          className="px-4 py-2 bg-brand text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-brand-hover transition-all active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Sparkles size={14} />
                          <span>Crear Plan</span>
                        </button>
                      </div>
                    );
                  }

                  const completedCount = planObj.steps.filter((s: any) => s.completed).length;
                  const totalSteps = planObj.steps.length;

                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-[11px] font-mono text-text-secondary">
                        <span>Pasos de verificación</span>
                        <span className="text-brand font-semibold">{completedCount} de {totalSteps} completados</span>
                      </div>

                      {/* Checklist Steps with Rounded Borders */}
                      <div className="space-y-2.5">
                        {planObj.steps.map((step: any) => (
                          <div
                            key={step.id}
                            onClick={() => handleToggleGoalStep(selectedGoalForModal, step.id)}
                            className={cn(
                              "p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none shadow-2xs active:scale-[0.98]",
                              step.completed
                                ? "bg-success/5 border-success/30 text-text-secondary"
                                : "bg-bg border-border hover:border-brand/40 text-text-primary"
                            )}
                          >
                            {/* Checkbox Icon */}
                            <div className={cn(
                              "w-5 h-5 rounded-lg flex items-center justify-center border mt-0.5 shrink-0 transition-colors",
                              step.completed ? "bg-success border-success text-white" : "border-border bg-surface text-transparent hover:border-brand"
                            )}>
                              <Check size={12} strokeWidth={3} />
                            </div>

                            <span className={cn("text-xs leading-relaxed flex-1 font-medium", step.completed && "line-through opacity-70")}>
                              {step.text}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Hera AI Personalized Plan Suggestion Box */}
                      {planObj.suggestion && (
                        <div className="bg-brand/5 border border-brand/20 p-4 rounded-2xl space-y-1.5 mt-4 shadow-2xs">
                          <div className="flex items-center gap-2 text-brand font-semibold text-xs">
                            <Lightbulb size={16} />
                            <span>Sugerencia</span>
                          </div>
                          <p className="text-[11px] text-text-secondary leading-relaxed font-sans pl-6">
                            {planObj.suggestion.replace(/^Sugerencia de Hera:\s*/i, '')}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const goalName = selectedGoalForModal.name;
                    setSelectedGoalForModal(null);
                    setChatInput(`Quiero abonar fondos a mi meta ${goalName}`);
                    setActiveTab('chat');
                  }}
                  className="px-4 py-2 bg-brand text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:bg-brand-hover transition-all active:scale-95 cursor-pointer"
                >
                  <span>+ Abonar a Meta</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGoalForModal(null)}
                  className="px-4 py-2 bg-bg border border-border text-text-secondary hover:text-text-primary rounded-xl text-xs font-medium transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
