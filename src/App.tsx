import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  ArrowRight,
  MessageSquare,
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
  Filter,
  Brain,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { cn } from './lib/utils';
import { UserProfile } from './types';
import api, { signOut, setToken, getToken, setUser } from './api';

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

  return (
    <div className="space-y-2 text-xs leading-relaxed font-sans text-text-primary">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (trimmed.startsWith('### ')) {
          return <h4 key={idx} className="font-serif font-semibold text-sm text-text-primary mt-2">{renderFormattedText(trimmed.slice(4))}</h4>;
        }
        if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
          return <h3 key={idx} className="font-serif font-semibold text-base text-text-primary mt-2 border-b border-border/50 pb-1">{renderFormattedText(trimmed.replace(/^#+\s*/, ''))}</h3>;
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex gap-2 items-start pl-1">
              <span className="text-brand font-bold shrink-0 mt-0.5">•</span>
              <span>{renderFormattedText(trimmed.slice(2))}</span>
            </div>
          );
        }
        if (/^\d+\.\s/.test(trimmed)) {
          const num = trimmed.match(/^(\d+)\.\s/)?.[1];
          const rest = trimmed.replace(/^\d+\.\s/, '');
          return (
            <div key={idx} className="flex gap-2 items-start pl-1">
              <span className="font-mono font-bold text-brand shrink-0">{num}.</span>
              <span>{renderFormattedText(rest)}</span>
            </div>
          );
        }
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        return <p key={idx}>{renderFormattedText(line)}</p>;
      })}
    </div>
  );
}

const COUNTRY_PREFIXES = [
  { flag: '🇨🇺', code: '+53', country: 'Cuba', example: '54232684' },
  { flag: '🇪🇸', code: '+34', country: 'España', example: '612 345 678' },
  { flag: '🇺🇸', code: '+1', country: 'Estados Unidos', example: '202 555 0123' },
  { flag: '🇲🇽', code: '+52', country: 'México', example: '55 1234 5678' },
  { flag: '🇦🇷', code: '+54', country: 'Argentina', example: '11 1234 5678' },
  { flag: '🇨🇱', code: '+56', country: 'Chile', example: '9 1234 5678' },
  { flag: '🇨🇴', code: '+57', country: 'Colombia', example: '300 123 4567' },
  { flag: '🇵🇪', code: '+51', country: 'Perú', example: '912 345 678' },
  { flag: '🇻🇪', code: '+58', country: 'Venezuela', example: '412 123 4567' },
  { flag: '🇩🇴', code: '+1809', country: 'República Dominicana', example: '809 123 4567' },
  { flag: '🇨🇷', code: '+506', country: 'Costa Rica', example: '8888 8888' },
  { flag: '🇪🇨', code: '+593', country: 'Ecuador', example: '99 123 4567' },
  { flag: '🇺🇾', code: '+598', country: 'Uruguay', example: '99 123 456' },
  { flag: '🇬🇹', code: '+502', country: 'Guatemala', example: '5123 4567' },
  { flag: '🇵🇦', code: '+507', country: 'Panamá', example: '6123 4567' },
  { flag: '🇧🇴', code: '+591', country: 'Bolivia', example: '7123 4567' },
  { flag: '🇵🇾', code: '+595', country: 'Paraguay', example: '981 123 456' },
  { flag: '🇸🇻', code: '+503', country: 'El Salvador', example: '7123 4567' },
  { flag: '🇭🇳', code: '+504', country: 'Honduras', example: '9123 4567' },
  { flag: '🇳🇮', code: '+505', country: 'Nicaragua', example: '8123 4567' },
  { flag: '🇵🇷', code: '+1787', country: 'Puerto Rico', example: '787 123 4567' },
  { flag: '🇧🇷', code: '+55', country: 'Brasil', example: '11 91234 5678' },
  { flag: '🇵🇹', code: '+351', country: 'Portugal', example: '912 345 678' },
  { flag: '🇮🇹', code: '+39', country: 'Italia', example: '312 345 6789' },
  { flag: '🇫🇷', code: '+33', country: 'Francia', example: '6 12 34 56 78' },
  { flag: '🇩🇪', code: '+49', country: 'Alemania', example: '151 23456789' },
  { flag: '🇬🇧', code: '+44', country: 'Reino Unido', example: '7123 456789' }
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
  const [activeTab, setActiveTab] = useState<'chat' | 'timeline' | 'reports' | 'goals'>('chat');
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
  const countryPickerRef = useRef<HTMLDivElement>(null);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

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

  // User Finance Data State
  const [overview, setOverview] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
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
  const [audioLevels, setAudioLevels] = useState<number[]>([15, 25, 35, 20, 45, 30, 60, 40, 25, 35, 20, 15]);
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

  // Quick Add 2-Step Voice AI Flow State
  const [addModalStep, setAddModalStep] = useState<1 | 2>(1);
  const [isAiParsingAudio, setIsAiParsingAudio] = useState(false);
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
  const [chatThinkingStepIndex, setChatThinkingStepIndex] = useState(0);
  const [currentReasoningText, setCurrentReasoningText] = useState('');
  const [actionProcessing, setActionProcessing] = useState<string | null>(null);

  const chatThinkingStepTexts = [
    "Analizando consulta...",
    "Evaluando saldos...",
    "Procesando contexto...",
    "Sintetizando..."
  ];

  // Chat History & Bottom Sheet Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
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
      return saved ? JSON.parse(saved) : [
        {
          id: 'demo-1',
          title: '¿En qué he gastado más este mes en restaurantes?',
          messages: [
            { id: '1', role: 'user', content: '¿En qué he gastado más este mes en restaurantes?' },
            { id: '2', role: 'assistant', content: 'Tus gastos en la categoría Restaurantes suman **145.50€** este mes. El mayor gasto fue de **45.00€** en *Restaurante El Patio*.' }
          ],
          updatedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString()
        },
        {
          id: 'demo-2',
          title: '¿Cómo va mi meta del fondo de emergencia?',
          messages: [
            { id: '1', role: 'user', content: '¿Cómo va mi meta del fondo de emergencia?' },
            { id: '2', role: 'assistant', content: 'Tu meta **Fondo de Emergencia** lleva un avance del **61%** (3,050€ de 5,000€). Vas según el plan proyectado.' }
          ],
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
        }
      ];
    } catch {
      return [];
    }
  });

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
      try { localStorage.setItem('hera_chat_history', JSON.stringify(filtered)); } catch {}
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
    { code: 'USD', name: 'Dólar Estadounidense', flag: '🇺🇸', symbol: '$' },
    { code: 'EUR', name: 'Euro (Unión Europea)', flag: '🇪🇺', symbol: '€' },
    { code: 'CUP', name: 'Peso Cubano', flag: '🇨🇺', symbol: '$' },
    { code: 'MXN', name: 'Peso Mexicano', flag: '🇲🇽', symbol: '$' },
    { code: 'ARS', name: 'Peso Argentino', flag: '🇦🇷', symbol: '$' },
    { code: 'COP', name: 'Peso Colombiano', flag: '🇨🇴', symbol: '$' },
    { code: 'CLP', name: 'Peso Chileno', flag: '🇨🇱', symbol: '$' },
    { code: 'BRL', name: 'Real Brasileño', flag: '🇧🇷', symbol: 'R$' },
    { code: 'GBP', name: 'Libra Esterlina', flag: '🇬🇧', symbol: '£' },
    { code: 'JPY', name: 'Yen Japonés', flag: '🇯🇵', symbol: '¥' },
    { code: 'CAD', name: 'Dólar Canadiense', flag: '🇨🇦', symbol: 'C$' },
    { code: 'AUD', name: 'Dólar Australiano', flag: '🇦🇺', symbol: 'A$' },
    { code: 'CHF', name: 'Franco Suizo', flag: '🇨🇭', symbol: 'CHF' },
    { code: 'CNY', name: 'Yuan Chino', flag: '🇨🇳', symbol: '¥' },
    { code: 'INR', name: 'Rupia India', flag: '🇮🇳', symbol: '₹' },
    { code: 'KRW', name: 'Won Surcoreano', flag: '🇰🇷', symbol: '₩' },
    { code: 'PEN', name: 'Sol Peruano', flag: '🇵🇪', symbol: 'S/' },
    { code: 'UYU', name: 'Peso Uruguayo', flag: '🇺🇾', symbol: '$U' },
    { code: 'DOP', name: 'Peso Dominicano', flag: '🇩🇴', symbol: 'RD$' },
    { code: 'CRC', name: 'Colón Costarricense', flag: '🇨🇷', symbol: '₡' },
    { code: 'GTQ', name: 'Quetzal Guatemalteco', flag: '🇬🇹', symbol: 'Q' },
    { code: 'HNL', name: 'Lempira Hondureño', flag: '🇭🇳', symbol: 'L' },
    { code: 'NIO', name: 'Córdoba Nicaragüense', flag: '🇳🇮', symbol: 'C$' },
    { code: 'PAB', name: 'Balboa Panameño', flag: '🇵🇦', symbol: 'B/.' },
    { code: 'PYG', name: 'Guaraní Paraguayo', flag: '🇵🇾', symbol: '₲' },
    { code: 'VES', name: 'Bolívar Venezolano', flag: '🇻🇪', symbol: 'Bs.' },
    { code: 'SEK', name: 'Corona Sueca', flag: '🇸🇪', symbol: 'kr' },
    { code: 'NOK', name: 'Corona Noruega', flag: '🇳🇴', symbol: 'kr' },
    { code: 'DKK', name: 'Corona Danesa', flag: '🇩🇰', symbol: 'kr' },
    { code: 'PLN', name: 'Złoty Polaco', flag: '🇵🇱', symbol: 'zł' },
    { code: 'TRY', name: 'Lira Turca', flag: '🇹🇷', symbol: '₺' },
    { code: 'AED', name: 'Dírham de EAU', flag: '🇦🇪', symbol: 'AED' },
    { code: 'SAR', name: 'Riyal Saudí', flag: '🇸🇦', symbol: 'SAR' },
    { code: 'EGP', name: 'Libra Egipcia', flag: '🇪🇬', symbol: 'E£' }
  ];

  const handleUpdateCurrency = (code: string) => {
    setDefaultCurrency(code);
    localStorage.setItem('hera_currency', code);
    if (profile) {
      setProfile(prev => prev ? { ...prev, defaultCurrency: code } : null);
    }
    showToast(`Moneda predeterminada cambiada a ${code}`, 'success');
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

  const handleChatScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 100;
    setShowScrollBottom(isScrolledUp);
  };

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleEditMessage = (msgId: string, content: string) => {
    setChatInput(content);
    const msgIndex = chatMessages.findIndex(m => m.id === msgId);
    if (msgIndex !== -1) {
      setChatMessages(prev => prev.slice(0, msgIndex));
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
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  const [timelineCategories, setTimelineCategories] = useState<string[]>([]);
  const [timelineType, setTimelineType] = useState<'all' | 'expense' | 'income'>('all');
  const [timelineCategorySearch, setTimelineCategorySearch] = useState('');
  const [timelineStartDate, setTimelineStartDate] = useState(firstDayOfMonth);
  const [timelineEndDate, setTimelineEndDate] = useState(lastDayOfMonth);
  const [showTimelineFilters, setShowTimelineFilters] = useState(false);
  const [timelineMinAmount, setTimelineMinAmount] = useState<number>(0);
  const [timelineMaxAmount, setTimelineMaxAmount] = useState<number>(1000);

  // Admin Panel State
  const [adminToken, setAdminToken] = useState<string | null>(localStorage.getItem('hera_admin_token'));
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [aiProviders, setAiProviders] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [newProviderName, setNewProviderName] = useState('');
  const [newProviderModel, setNewProviderModel] = useState('');
  const [newProviderKey, setNewProviderKey] = useState('');

  const openOnboarding = useCallback((initialData: { name?: string; birthDate?: string; email?: string; address?: string; phone?: string; photoURL?: string }) => {
    setOnbStep(0);
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
      if (maxAmt > 0 && maxAmt < 5000) queryParts.push(`maxAmount=${maxAmt}`);

      const queryStr = queryParts.length ? `?${queryParts.join('&')}` : '';

      const [ovData, tlData] = await Promise.all([
        api('/finance/overview'),
        api(`/finance/timeline${queryStr}`)
      ]);
      setOverview(ovData);
      setAccounts(ovData.accounts || []);
      setGoals(ovData.goals || []);
      setTimeline(tlData || []);
    } catch {}
  }, [timelineStartDate, timelineEndDate, timelineCategories, timelineType, timelineMinAmount, timelineMaxAmount]);

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
      api('/me', { method: 'PUT', body: JSON.stringify({ theme: newTheme }) }).catch(() => {});
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
    const fullPhone = phonePrefix + phone;
    if (phone.length < 3) {
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
        body: JSON.stringify({ phone: fullPhone })
      });
      showToast(`Código de prueba: ${data.devCode || '000000'}`, 'info');
    } catch (err: any) {
      showToast('Código de prueba: 000000', 'info');
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
    const fullPhone = phonePrefix + phone;
    try {
      const data = await api('/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone: fullPhone, code })
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

      if (data.isNewUser || !data.user.displayName || data.user.displayName === fullPhone || !data.user.birthDate) {
        openOnboarding({ name: data.user.displayName, phone: fullPhone, photoURL: data.user.photoURL });
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
            const barsCount = 12;
            const step = Math.floor(bufferLength / barsCount) || 1;
            const levels: number[] = [];
            for (let i = 0; i < barsCount; i++) {
              const rawVal = dataArray[i * step] || 0;
              const pct = Math.max(15, Math.min(100, Math.round((rawVal / 255) * 100)));
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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
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
        };
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
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
  };

  // --- Send Message to AI Function Calling Engine ---
  const sendChatMessage = async (overrideText?: string) => {
    const textToSend = overrideText || chatInput;
    if (!textToSend.trim() || chatLoading) return;

    const userMsg = { id: Date.now().toString(), role: 'user', content: textToSend };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);
    setCurrentReasoningText('');
    setChatThinkingStepIndex(0);

    const stepInterval = setInterval(() => {
      setChatThinkingStepIndex(prev => (prev + 1) % 4);
    }, 1100);

    try {
      const data = await api('/chat', {
        method: 'POST',
        body: JSON.stringify({ message: textToSend })
      });

      if (data.reasoningContent) {
        setCurrentReasoningText(data.reasoningContent);
      }

      const aiMsg = {
        id: (Date.now() + 1).toString(),
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
            const newId = Date.now().toString();
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
          try { localStorage.setItem('hera_chat_history', JSON.stringify(updated)); } catch {}
          return updated;
        });
        return newMsgs;
      });
      loadUserData();
    } catch (err: any) {
      showToast('Error al conectar con la IA', 'error');
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
      showToast('Escaneando recibo con IA...', 'info');

      try {
        const res = await api('/scan-receipt', {
          method: 'POST',
          body: JSON.stringify({ image: base64Img })
        });

        const receiptMsg = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `¡Recibo escaneado y registrado con éxito!\n\n**Comercio**: ${res.merchant}\n**Importe**: ${res.amount}€\n**Categoría**: ${res.category}\n**Fecha**: ${res.date}`,
          type: 'receipt_summary',
          data: res
        };

        setChatMessages(prev => [...prev, receiptMsg]);
        loadUserData();
        showToast('Transacción registrada automáticamente', 'success');
      } catch (err: any) {
        showToast('Error al escanear recibo', 'error');
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
      const res = await fetch('http://localhost:4000/api/admin/login', {
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
      const [statsRes, provsRes, usersRes, logsRes] = await Promise.all([
        fetch('http://localhost:4000/api/admin/stats', { headers }).then(r => r.json()),
        fetch('http://localhost:4000/api/admin/providers', { headers }).then(r => r.json()),
        fetch('http://localhost:4000/api/admin/users', { headers }).then(r => r.json()),
        fetch('http://localhost:4000/api/admin/logs', { headers }).then(r => r.json())
      ]);

      setAdminStats(statsRes);
      setAiProviders(provsRes || []);
      setAdminUsers(usersRes || []);
      setAdminLogs(logsRes || []);
    } catch {}
  }, [adminToken]);

  useEffect(() => {
    if (showAdmin && adminToken) {
      loadAdminData();
    }
  }, [showAdmin, adminToken, loadAdminData]);

  const handleUpdateProviderKey = async (id: string, apiKey: string, isActive: number) => {
    if (!adminToken) return;
    try {
      await fetch(`http://localhost:4000/api/admin/providers/${id}`, {
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
      await fetch('http://localhost:4000/api/admin/providers', {
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

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-bg text-text-primary">
        <HeraWalletLogo size="lg" showText={true} />
        <div className="mt-6 flex items-center gap-2 text-xs text-text-secondary">
          <Sparkles size={14} className="animate-spin text-brand" />
          <span>Cargando tu espacio HeraWallet...</span>
        </div>
      </div>
    );
  }

  // --- OTP Login Screen ---
  if (!user && !showAdmin) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-bg p-4">
        <Toast />
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          className="max-w-md w-full bg-surface border border-border p-8 sm:p-10 rounded-3xl text-center space-y-8 shadow-xl"
        >
          <div className="mx-auto flex justify-center">
            <HeraWalletLogo size="lg" showText={false} />
          </div>

          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-serif font-semibold tracking-tight text-text-primary">HeraWallet</h1>
            <p className="text-xs text-text-secondary max-w-xs mx-auto">
              {!otpSent 
                ? 'Tus metas empiezan con un mejor control. Accede con tu número de teléfono.'
                : 'Ya estás a un solo paso de cumplir tus metas.'
              }
            </p>
          </div>
          
          {!otpSent ? (
            <div className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-text-secondary">Número de teléfono</label>
                <div className="flex gap-2">
                  {/* Custom Country Picker (28% width, trigger shows only flag & prefix, modal has search) */}
                  <div className="relative w-[28%]" ref={countryPickerRef}>
                    <button
                      type="button"
                      onClick={() => setIsCountryModalOpen(prev => !prev)}
                      className="w-full h-full bg-bg border border-border hover:border-brand/60 rounded-2xl px-2.5 py-3 text-xs font-mono text-text-primary flex items-center justify-between transition-all cursor-pointer shadow-sm active:scale-[0.97]"
                    >
                      <span className="truncate flex items-center gap-1 font-semibold">
                        <span>{COUNTRY_PREFIXES.find(c => c.code === phonePrefix)?.flag || '🇨🇺'}</span>
                        <span>{phonePrefix}</span>
                      </span>
                      <ChevronDown size={14} className={cn("text-text-dim transition-transform shrink-0 ml-0.5", isCountryModalOpen && "rotate-180")} />
                    </button>

                    <AnimatePresence>
                      {isCountryModalOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 4 }}
                          transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                          className="absolute left-0 top-full mt-2 w-72 bg-surface border border-border rounded-3xl shadow-2xl p-3 z-50 space-y-2"
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

                          <div className="max-h-56 overflow-y-auto space-y-1 pr-1 font-sans">
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
                                  "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left",
                                  phonePrefix === item.code ? "bg-brand/10 text-brand font-semibold border border-brand/20" : "hover:bg-surface-hover text-text-primary"
                                )}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className="text-base leading-none">{item.flag}</span>
                                  <span className="truncate">{item.country}</span>
                                </div>
                                <span className="font-mono text-text-dim shrink-0">{item.code}</span>
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
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSendOTP(); } }}
                    placeholder={COUNTRY_PREFIXES.find(c => c.code === phonePrefix)?.example || '54232684'}
                    className="flex-1 bg-bg border border-border rounded-2xl px-4 py-3 text-sm font-sans text-text-primary placeholder:text-text-dim focus:outline-none focus:border-brand/60"
                    autoFocus
                  />
                </div>
                {otpError && <p className="text-xs text-error mt-1">{otpError}</p>}
              </div>

              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSendOTP(); }}
                disabled={otpLoading || !phone}
                className="w-full bg-brand hover:bg-brand-hover text-white font-medium py-3.5 rounded-2xl transition-all shadow-md active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                {otpLoading ? <Sparkles size={16} className="animate-spin" /> : 'Continuar con SMS'}
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
      
      {/* Header Navbar (Hidden when in active chat thread) */}
      {!(activeTab === 'chat' && chatMessages.length > 0) && (
        <header className="bg-surface/80 backdrop-blur-xl sticky top-0 z-40 mx-1.5 sm:mx-2.5 mt-1.5 rounded-2xl border border-border shadow-lg shadow-black/5">
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
      </header>
      )}

      {/* Main Workspace Area */}
      <main className={cn("flex-1 max-w-7xl w-full mx-auto flex flex-col min-h-0 overflow-hidden", activeTab === 'chat' && chatMessages.length > 0 ? "px-3 pt-2 pb-1 sm:px-6" : "p-3 sm:p-6")}>
        {showAdmin ? (
          /* --- ADMIN PANEL (/panel) --- */
          <div className="space-y-6">
            {!adminToken ? (
              <motion.div 
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                className="max-w-md mx-auto bg-surface border border-border p-8 sm:p-10 rounded-3xl text-center space-y-8 shadow-xl"
              >
                <div className="mx-auto flex justify-center">
                  <ShieldCheck size={28} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-serif font-bold text-text-primary">Panel de Administración</h2>
                  <p className="text-xs text-text-secondary">Autenticación requerida para acceder al área de control del sistema.</p>
                </div>

                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="space-y-1 text-left">
                    <label className="text-xs font-medium text-text-secondary">Usuario Administrador</label>
                    <input 
                      type="text" 
                      value={adminUsername} 
                      onChange={e => setAdminUsername(e.target.value)} 
                      placeholder="admin" 
                      className="w-full bg-bg border border-border p-3 rounded-2xl text-xs focus:outline-none focus:border-brand text-text-primary" 
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-xs font-medium text-text-secondary font-mono">Clave Secreta</label>
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
                    <span>Iniciar Sesión en Panel</span>
                  </button>
                </form>
              </motion.div>
            ) : (
              /* Authorized Admin View */
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-surface border border-border p-4 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                      <Users size={20} />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-text-primary">Administrador Autenticado</h2>
                      <p className="text-[11px] text-text-secondary font-mono">Gestión global de API Keys y logs de seguridad</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { localStorage.removeItem('hera_admin_token'); setAdminToken(null); }}
                    className="px-3 py-1.5 bg-surface hover:bg-surface-hover border border-border rounded-xl text-xs text-error font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <LogOut size={14} />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>

                {/* System Providers API Keys */}
                <div className="bg-surface border border-border p-5 rounded-3xl space-y-4">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <DbIcon size={18} className="text-brand" />
                    Proveedores de IA y Modelos LLM
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {aiProviders.map(p => (
                      <div key={p.id} className="p-4 bg-bg border border-border rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-text-primary uppercase tracking-wider">{p.name}</span>
                          <span className={cn(
                            "text-[10px] font-mono px-2 py-0.5 rounded-full font-bold",
                            p.isActive === 1 ? "bg-success/20 text-success" : "bg-text-dim/20 text-text-dim"
                          )}>
                            {p.isActive === 1 ? 'ACTIVO' : 'INACTIVO'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="password" 
                            placeholder="Introducir API Key" 
                            defaultValue={p.apiKey}
                            onBlur={(e) => handleUpdateProviderKey(p.id, e.target.value, p.isActive)}
                            className="bg-surface border border-border px-3 py-1.5 rounded-xl text-xs font-mono text-text-primary focus:outline-none flex-1" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* --- USER WORKSPACE --- */
          <div className="flex-1 flex flex-col space-y-4 min-h-0 overflow-hidden">
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
                      <div className="w-16 h-16 rounded-3xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shadow-sm">
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
                        </div>

                        <button
                          type="button"
                          onClick={() => { if (chatInput.trim()) sendChatMessage(chatInput); }}
                          disabled={!chatInput.trim() || chatLoading}
                          className="px-4 py-2 bg-brand hover:bg-brand-hover text-white font-medium rounded-xl text-xs flex items-center gap-2 shadow-md disabled:opacity-40 transition-all active:scale-[0.97] cursor-pointer"
                        >
                          {chatLoading ? <Sparkles size={14} className="animate-spin" /> : <Send size={14} />}
                          <span>Consultar</span>
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
                      {[
                        { label: 'Transacciones', query: '¿En qué he gastado más este mes?', icon: Receipt },
                        { label: 'Ahorros', query: '¿Cuál es mi saldo de ahorro y capacidad de reserva?', icon: Coins },
                        { label: 'Metas', query: '¿Cómo van mis metas de ahorro?', icon: Target },
                        { label: 'Score', query: '¿Cuál es mi Score Financiero?', icon: Activity },
                        { label: 'Reportes', query: 'Genera un informe rápido de mi patrimonio', icon: PieChart }
                      ].map((pill, idx) => (
                        <button
                          key={idx}
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
                          title="Ver Score financiero"
                        >
                          <Activity size={15} className="text-brand" />
                          <span className="hidden sm:inline">Score</span>
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
                      {chatMessages.map(msg => (
                        <motion.div
                          key={msg.id}
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

                          <div className={cn(
                            "p-4 rounded-2xl text-xs leading-relaxed space-y-3 max-w-xl relative",
                            msg.role === 'user'
                              ? "bg-brand text-white rounded-tr-none shadow-sm"
                              : "bg-surface border border-border text-text-primary rounded-tl-none shadow-sm"
                          )}>
                            {msg.role === 'assistant' ? (
                              <>
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

                                {/* 3. Mini Chart Widget */}
                                {msg.type === 'chart' && msg.data && msg.data.data && (
                                  <div className="mt-3 bg-bg/90 border border-border p-4 rounded-2xl space-y-2 shadow-md">
                                    <div className="flex items-center justify-between">
                                      <span className="font-semibold text-xs text-text-primary flex items-center gap-1.5">
                                        <PieChart size={15} className="text-brand" />
                                        {msg.data.title || 'Gráfico de Análisis'}
                                      </span>
                                    </div>
                                    <div className="h-44 w-full pt-2">
                                      <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={msg.data.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                          <XAxis dataKey="label" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                          <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `${formatCompactNumber(v)}`} />
                                          <Tooltip 
                                            formatter={(value: any) => [`${formatCompactNumber(Number(value))} €`, 'Importe']}
                                            contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', fontSize: '11px', color: '#f8fafc' }}
                                          />
                                          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                            {msg.data.data.map((_: any, idx: number) => (
                                              <Cell key={idx} fill={idx % 2 === 0 ? 'var(--color-brand, #3b82f6)' : '#10b981'} />
                                            ))}
                                          </Bar>
                                        </BarChart>
                                      </ResponsiveContainer>
                                    </div>
                                  </div>
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
                                          {msg.data.rows?.map((row: any[], rIdx: number) => (
                                            <tr key={rIdx} className="hover:bg-surface/50 transition-colors">
                                              {row.map((cell: any, cIdx: number) => (
                                                <td key={cIdx} className="py-2 px-2 text-text-primary font-medium">
                                                  {cell}
                                                </td>
                                              ))}
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}

                                {/* 5. Downloadable Document Card Widget */}
                                {msg.type === 'document' && msg.data && (
                                  <div className="mt-3 bg-bg/90 border border-brand/40 p-4 rounded-2xl space-y-3 shadow-md flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-2xl bg-brand/10 border border-brand/30 flex items-center justify-center text-brand shrink-0">
                                        <Printer size={20} />
                                      </div>
                                      <div>
                                        <h4 className="font-semibold text-xs text-text-primary">{msg.data.title || 'Informe Ejecutivo PDF'}</h4>
                                        <div className="flex items-center gap-2 text-[10px] text-text-secondary font-mono mt-0.5">
                                          <span className="bg-brand/20 text-brand px-1.5 py-0.2 rounded font-bold">{msg.data.format || 'PDF'}</span>
                                          <span>{msg.data.size || '340 KB'}</span>
                                          <span>• {msg.data.date || 'Hoy'}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        window.print();
                                        showToast('Abriendo ventana de impresión / PDF...', 'info');
                                      }}
                                      className="px-3.5 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.97] cursor-pointer shrink-0"
                                    >
                                      <Printer size={14} />
                                      <span>Descargar / Imprimir</span>
                                    </button>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="whitespace-pre-wrap">{msg.content}</div>
                            )}
                          </div>

                          {/* Edit Badge for User Messages (Always Visible) */}
                          {msg.role === 'user' && (
                            <button
                              type="button"
                              onClick={() => handleEditMessage(msg.id, msg.content)}
                              className="self-center p-1.5 rounded-xl bg-surface border border-border text-text-secondary hover:text-brand hover:border-brand/40 transition-all cursor-pointer shadow-xs shrink-0"
                              title="Editar este mensaje"
                            >
                              <Pencil size={13} />
                            </button>
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
                            <div className="flex items-center gap-3">
                              {/* 3 Emil-Style Animated Bouncing Dots (No badge background) */}
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" />
                              </div>

                              <span className="font-medium text-text-primary text-xs font-sans tracking-tight">
                                {chatThinkingStepTexts[chatThinkingStepIndex]}
                              </span>
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
                          </div>

                          <button
                            type="button"
                            onClick={() => { if (chatInput.trim()) sendChatMessage(chatInput); }}
                            disabled={!chatInput.trim() || chatLoading}
                            className="px-4 py-2 bg-brand hover:bg-brand-hover text-white font-medium rounded-xl text-xs flex items-center gap-2 shadow-md disabled:opacity-40 transition-all active:scale-[0.97] cursor-pointer"
                          >
                            {chatLoading ? <Sparkles size={14} className="animate-spin" /> : <Send size={14} />}
                            <span>Consultar</span>
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
                            Rango de Montos (€)
                          </label>
                          <span className="text-xs font-mono font-semibold text-brand">
                            {timelineMinAmount}€ — {timelineMaxAmount >= 1000 ? '1000€+' : `${timelineMaxAmount}€`}
                          </span>
                        </div>

                        <div className="space-y-3 bg-bg border border-border p-3.5 rounded-2xl">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-text-dim font-mono">
                              <span>Mínimo: {timelineMinAmount}€</span>
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
                              <span>Máximo: {timelineMaxAmount >= 1000 ? 'Sin Límite (1000€+)' : `${timelineMaxAmount}€`}</span>
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

                <div className="space-y-4">
                  {timeline.map((dayGroup, idx) => (
                    <div key={idx} className="bg-surface border border-border p-4 rounded-3xl space-y-3">
                      <div className="flex items-center justify-between border-b border-border/60 pb-2">
                        <span className="text-xs font-mono font-bold text-brand uppercase">{dayGroup.date}</span>
                        <span className="text-[11px] text-text-dim">{dayGroup.items?.length || 0} movimientos</span>
                      </div>

                      <div className="space-y-2">
                        {dayGroup.items?.map((item: any) => (
                          <div key={item.id} className="p-3 bg-bg border border-border/50 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs",
                                item.type === 'income' ? "bg-success/15 text-success" : "bg-error/15 text-error"
                              )}>
                                {item.type === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                              </div>
                              <div>
                                <p className="text-xs font-medium text-text-primary">{item.description || item.category}</p>
                                <p className="text-[10px] text-text-secondary">{item.accountName || 'Cuenta'} • {item.category}</p>
                              </div>
                            </div>
                            <span className={cn(
                              "font-mono font-semibold text-xs",
                              item.type === 'income' ? "text-success" : "text-text-primary"
                            )}>
                              {item.type === 'income' ? '+' : '-'}{item.amount}€
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
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

                {/* Accounts Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {accounts.map(acc => (
                    <div 
                      key={acc.id} 
                      onClick={() => handleOpenAccountDetail(acc)}
                      className="bg-surface border border-border hover:border-brand/60 p-5 rounded-3xl space-y-4 shadow-sm relative overflow-hidden group cursor-pointer transition-all active:scale-[0.98]"
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
                        <p className="text-2xl font-bold font-mono text-text-primary">{acc.balance} {acc.currency || 'EUR'}</p>
                      </div>
                    </div>
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
                    {/* Header KPI Cards (Formatted in k, M) */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 print:grid-cols-2">
                      <div className="bg-surface border border-border p-4 rounded-2xl space-y-1 hover:border-brand/40 transition-colors">
                        <span className="text-[11px] text-text-secondary font-medium">Patrimonio Neto</span>
                        <p className="text-2xl font-bold font-mono text-brand">
                          {formatCompactNumber(overview?.summary?.totalBalance)}€
                        </p>
                      </div>
                      <div className="bg-surface border border-border p-4 rounded-2xl space-y-1 hover:border-success/40 transition-colors">
                        <span className="text-[11px] text-text-secondary font-medium">Ingresos Totales</span>
                        <p className="text-2xl font-bold font-mono text-success">
                          +{formatCompactNumber(overview?.summary?.totalIncome)}€
                        </p>
                      </div>
                      <div className="bg-surface border border-border p-4 rounded-2xl space-y-1 hover:border-error/40 transition-colors">
                        <span className="text-[11px] text-text-secondary font-medium">Gastos Totales</span>
                        <p className="text-2xl font-bold font-mono text-text-primary">
                          -{formatCompactNumber(overview?.summary?.totalExpense)}€
                        </p>
                      </div>
                      <div className="bg-surface border border-border p-4 rounded-2xl space-y-1 hover:border-brand/40 transition-colors">
                        <span className="text-[11px] text-text-secondary font-medium">Ahorro Proyectado (30d)</span>
                        <p className="text-2xl font-bold font-mono text-brand flex items-center gap-1">
                          <TrendingUp size={18} />
                          <span>+{formatCompactNumber(aiReportData?.projectedSavings30d || 280)}€</span>
                        </p>
                      </div>
                    </div>

                    {/* AI Executive Analysis Bento Card */}
                    {aiReportData && (
                      <div className="bg-surface border border-border p-6 rounded-3xl space-y-6">
                        <div className="flex items-center justify-between border-b border-border/80 pb-4">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-brand/10 text-brand">
                              <Sparkles size={20} />
                            </div>
                            <div>
                              <h3 className="font-semibold text-base text-text-primary">Diagnóstico Hera</h3>
                              <p className="text-xs text-text-secondary">Análisis financiero ejecutivo en tiempo real por Hera AI</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 bg-success/15 border border-success/30 px-3 py-1.5 rounded-full">
                            <ShieldCheck size={14} className="text-success" />
                            <span className="text-xs font-mono font-bold text-success">
                              HEALTH SCORE: {aiReportData.healthScore || 88}/100
                            </span>
                          </div>
                        </div>

                        {/* Executive Summary Paragraph */}
                        <div className="p-4 bg-bg border border-border rounded-2xl">
                          <p className="text-xs text-text-primary leading-relaxed">
                            {aiReportData.executiveSummary}
                          </p>
                        </div>

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
                              { name: 'Ingresos', amount: Number(overview?.summary?.totalIncome) || 3300, fill: '#10B981' },
                              { name: 'Gastos', amount: Number(overview?.summary?.totalExpense) || 1511.89, fill: '#EF4444' },
                              { name: 'Ahorro Neto', amount: Math.max(0, (Number(overview?.summary?.totalIncome) || 3300) - (Number(overview?.summary?.totalExpense) || 1511.89)), fill: '#F59E0B' }
                            ]} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                              <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                              <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val: any) => `${formatCompactNumber(val)}€`} />
                              <Tooltip 
                                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', borderRadius: '12px', fontSize: '12px', color: '#FFF' }} 
                                formatter={(val: any) => [`${formatCompactNumber(val)}€ (${val}€)`, 'Importe']}
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
                              <span className="font-mono font-semibold text-xs text-text-primary">{formatCompactNumber(acc.balance)}€</span>
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
                              {item.type === 'income' ? '+' : '-'}{formatCompactNumber(item.amount)}€
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
                          <p>SCORE: {aiReportData?.healthScore || 88}/100</p>
                        </div>
                      </div>

                      {/* PDF Summary Table */}
                      <div className="grid grid-cols-4 gap-3 text-center">
                        <div className="p-3 border border-gray-300 rounded-lg bg-gray-50">
                          <span className="text-[10px] uppercase text-gray-500 block font-semibold">Patrimonio Neto</span>
                          <span className="text-base font-bold font-mono text-gray-900">{formatCompactNumber(overview?.summary?.totalBalance)}€</span>
                        </div>
                        <div className="p-3 border border-gray-300 rounded-lg bg-gray-50">
                          <span className="text-[10px] uppercase text-gray-500 block font-semibold">Ingresos Totales</span>
                          <span className="text-base font-bold font-mono text-green-700">+{formatCompactNumber(overview?.summary?.totalIncome)}€</span>
                        </div>
                        <div className="p-3 border border-gray-300 rounded-lg bg-gray-50">
                          <span className="text-[10px] uppercase text-gray-500 block font-semibold">Gastos Totales</span>
                          <span className="text-base font-bold font-mono text-red-700">-{formatCompactNumber(overview?.summary?.totalExpense)}€</span>
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
              /* --- GOALS, SAVINGS & SCORE TAB --- */
              <div className="space-y-6">
                <div className="bg-surface border border-border p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-serif font-semibold">Score Financiero & Control de Metas y Ahorros</h2>
                    <p className="text-xs text-text-secondary">Diagnóstico propio 0-100, planes de ahorro y fondos de emergencia</p>
                  </div>
                  <button
                    onClick={() => setShowAddGoalModal(true)}
                    className="px-4 py-2 bg-brand text-white rounded-2xl text-xs font-medium flex items-center gap-2 shadow-sm hover:bg-brand-hover transition-colors cursor-pointer self-start sm:self-auto shrink-0"
                  >
                    <Plus size={16} />
                    <span>Nueva Meta / Fondo</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Score Card */}
                  <div className="bg-surface border border-border p-6 rounded-3xl text-center space-y-4">
                    <span className="text-xs uppercase font-medium tracking-wider text-text-secondary">Score Hera</span>
                    <div className="w-28 h-28 mx-auto rounded-full border-4 border-brand/30 flex items-center justify-center text-3xl font-bold font-mono text-brand bg-brand/5 shadow-inner">
                      {overview?.healthScore || 84}/100
                    </div>
                    <p className="text-xs text-text-secondary">Salud financiera excelente. Fondo de emergencia cubierto en un 61%.</p>
                  </div>

                  {/* Goals Cards */}
                  <div className="md:col-span-2 space-y-3">
                    {goals.map(g => (
                      <div key={g.id} className="bg-surface border border-border p-4 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm">{g.name}</span>
                          <span className="text-xs font-mono font-bold text-brand">{g.currentAmount}€ / {g.targetAmount}€</span>
                        </div>
                        <div className="w-full bg-bg h-2 rounded-full overflow-hidden">
                          <div className="bg-brand h-full rounded-full transition-all" style={{ width: `${Math.min(100, (g.currentAmount / g.targetAmount) * 100)}%` }} />
                        </div>
                        <div className="flex justify-between text-[11px] text-text-dim font-mono">
                          <span>Cuota semanal recomendada: {g.weeklyTarget}€/sem</span>
                          <span>Límite: {g.deadline}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              /* --- CONFIGURATION & SETTINGS VIEW --- */
              <div className="space-y-6 max-w-4xl mx-auto pb-12">
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

                {/* 1. Default Currency Settings */}
                <div className="bg-surface border border-border p-6 rounded-3xl space-y-4 relative z-30">
                  <div className="flex items-center justify-between border-b border-border/80 pb-3">
                    <div className="flex items-center gap-2">
                      <DollarSign size={18} className="text-brand" />
                      <h3 className="font-semibold text-sm text-text-primary">Moneda Predeterminada</h3>
                    </div>
                    <span className="text-xs font-mono font-bold bg-brand/10 text-brand px-2.5 py-1 rounded-full flex items-center gap-1.5">
                      <span>{ALL_CURRENCIES.find(c => c.code === defaultCurrency)?.flag}</span>
                      <span>{defaultCurrency} ({ALL_CURRENCIES.find(c => c.code === defaultCurrency)?.symbol || '$'})</span>
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Selecciona la divisa principal en la que se calcularán tus balances, informes y análisis financieros automáticos.
                  </p>

                  {/* Custom Searchable Currency Dropdown with Country Flags */}
                  <div className="relative" ref={currencyMenuRef}>
                    <label className="text-xs font-medium text-text-secondary block mb-1.5">Seleccionar Divisa Global:</label>
                    
                    <button
                      type="button"
                      onClick={() => setIsCurrencyDropdownOpen(prev => !prev)}
                      className="w-full bg-bg border border-border rounded-2xl px-4 py-3 text-xs text-text-primary flex items-center justify-between hover:border-brand/60 transition-colors cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{ALL_CURRENCIES.find(c => c.code === defaultCurrency)?.flag}</span>
                        <span className="font-mono font-bold">{defaultCurrency}</span>
                        <span className="text-text-secondary">— {ALL_CURRENCIES.find(c => c.code === defaultCurrency)?.name}</span>
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
                          {/* Live Search Bar */}
                          <div className="relative flex items-center shrink-0">
                            <Search size={14} className="absolute left-3 text-text-dim" />
                            <input
                              type="text"
                              value={currencySearchQuery}
                              onChange={e => setCurrencySearchQuery(e.target.value)}
                              placeholder="Buscar por país o código (ej. EUR, Cuba, México...)..."
                              className="w-full bg-bg border border-border/80 rounded-xl pl-8 pr-3 py-2 text-xs text-text-primary placeholder:text-text-dim focus:outline-none focus:border-brand/60"
                              autoFocus
                            />
                          </div>

                          {/* Currency List */}
                          <div className="flex-1 overflow-y-auto space-y-1 pr-1 min-h-0">
                            {ALL_CURRENCIES
                              .filter(c => 
                                c.code.toLowerCase().includes(currencySearchQuery.toLowerCase()) ||
                                c.name.toLowerCase().includes(currencySearchQuery.toLowerCase())
                              )
                              .map(c => (
                                <button
                                  key={c.code}
                                  type="button"
                                  onClick={() => {
                                    handleUpdateCurrency(c.code);
                                    setIsCurrencyDropdownOpen(false);
                                    setCurrencySearchQuery('');
                                  }}
                                  className={cn(
                                    "w-full px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer text-left",
                                    defaultCurrency === c.code 
                                      ? "bg-brand/10 text-brand font-semibold" 
                                      : "hover:bg-surface-hover text-text-primary"
                                  )}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span className="text-base">{c.flag}</span>
                                    <span className="font-mono font-bold w-10">{c.code}</span>
                                    <span className="text-text-secondary truncate">{c.name}</span>
                                  </div>
                                  <span className="font-semibold text-text-secondary font-mono">{c.symbol}</span>
                                </button>
                              ))}

                            {ALL_CURRENCIES.filter(c => 
                              c.code.toLowerCase().includes(currencySearchQuery.toLowerCase()) ||
                              c.name.toLowerCase().includes(currencySearchQuery.toLowerCase())
                            ).length === 0 && (
                              <p className="p-3 text-center text-xs text-text-dim">No se encontraron monedas para "{currencySearchQuery}"</p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* 2. Custom Agent Hera Rules */}
                <div className="bg-surface border border-border p-6 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between border-b border-border/80 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles size={18} className="text-brand" />
                      <h3 className="font-semibold text-sm text-text-primary">Reglas Personalizadas para el Agente Hera</h3>
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Escribe instrucciones o preferencias que Hera recordará en cada consulta (ej. "Recomiéndame presupuestos ajustados", "Alertar si gasto más de 50€ en una comida", "Trátame de usted").
                  </p>

                  <div className="space-y-2">
                    <textarea
                      value={customAgentRules}
                      onChange={e => setCustomAgentRules(e.target.value)}
                      placeholder="Escribe aquí tus reglas personalizadas..."
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

                {/* 3. AI Providers API Keys Configuration (DeepSeek & Gemini) */}
                <div className="bg-surface border border-border p-6 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between border-b border-border/80 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles size={18} className="text-brand" />
                      <h3 className="font-semibold text-sm text-text-primary">Configuración de Modelos IA (DeepSeek & Gemini)</h3>
                    </div>
                    <span className="text-[11px] font-mono font-bold bg-brand/10 text-brand px-2.5 py-0.5 rounded-full">
                      RESPUESTAS REALES LLM
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Ingresa tus claves API para activar el pensamiento y razonamiento directo de DeepSeek V3/R1 y Gemini Flash.
                  </p>

                  <div className="space-y-4 pt-1">
                    {/* DeepSeek Key */}
                    <div className="bg-bg border border-border p-4 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                          <Sparkles size={14} className="text-brand" />
                          <span>DeepSeek API Key (deepseek-chat / deepseek-reasoner)</span>
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={deepseekKeyInput}
                          onChange={e => setDeepseekKeyInput(e.target.value)}
                          placeholder="sk-..."
                          className="flex-1 bg-surface border border-border rounded-xl px-3.5 py-2.5 text-xs text-text-primary focus:outline-none focus:border-brand/60 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveAiKey('DeepSeek', deepseekKeyInput)}
                          className="px-4 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-medium transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
                        >
                          Guardar
                        </button>
                      </div>
                    </div>

                    {/* Gemini Key */}
                    <div className="bg-bg border border-border p-4 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                          <Sparkles size={14} className="text-brand" />
                          <span>Google Gemini API Key (gemini-1.5-flash / Vision)</span>
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={geminiKeyInput}
                          onChange={e => setGeminiKeyInput(e.target.value)}
                          placeholder="AIzaSy..."
                          className="flex-1 bg-surface border border-border rounded-xl px-3.5 py-2.5 text-xs text-text-primary focus:outline-none focus:border-brand/60 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveAiKey('Gemini', geminiKeyInput)}
                          className="px-4 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-medium transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
                        >
                          Guardar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Subscription & Billing Plan (Pro / Premium) */}
                <div className="bg-surface border border-border p-6 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between border-b border-border/80 pb-3">
                    <div className="flex items-center gap-2">
                      <CreditCard size={18} className="text-brand" />
                      <h3 className="font-semibold text-sm text-text-primary">Suscripción y Plan</h3>
                    </div>
                    <span className="text-xs font-mono font-bold bg-success/20 text-success px-2.5 py-1 rounded-full">
                      PLAN PRO • ACTIVO
                    </span>
                  </div>

                  <div className="p-4 bg-bg border border-border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold text-text-primary">HeraWallet Pro Ilimitado</h4>
                      <p className="text-[11px] text-text-secondary">Acceso total a Whisper Local, OCR de Facturas y Modelos LLM sin límites.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => showToast('Gestionar suscripción y facturación en Stripe (Próximamente)', 'info')}
                      className="px-4 py-2 bg-surface hover:bg-surface-hover border border-border text-text-primary rounded-xl text-xs font-medium transition-colors cursor-pointer shrink-0"
                    >
                      Gestionar Plan
                    </button>
                  </div>
                </div>

                {/* 4. Payment Methods */}
                <div className="bg-surface border border-border p-6 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between border-b border-border/80 pb-3">
                    <div className="flex items-center gap-2">
                      <Wallet size={18} className="text-brand" />
                      <h3 className="font-semibold text-sm text-text-primary">Métodos de Pago</h3>
                    </div>
                  </div>

                  <div className="p-4 bg-bg border border-border rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-6 bg-brand/20 rounded border border-brand/30 flex items-center justify-center font-mono text-[10px] font-bold text-brand">
                        VISA
                      </div>
                      <div>
                        <p className="text-xs font-medium text-text-primary">•••• •••• •••• 4242</p>
                        <p className="text-[10px] text-text-secondary">Expira 12/28</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => showToast('Actualizar método de pago (Próximamente)', 'info')}
                      className="text-xs text-brand font-medium hover:underline cursor-pointer"
                    >
                      Editar
                    </button>
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
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Bottom Navigation Bar (Hidden when in active chat thread) */}
      {!showAdmin && (activeTab !== 'chat' || chatMessages.length === 0) && (
        <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 bg-surface/80 backdrop-blur-xl border border-border rounded-2xl p-1.5 shadow-lg shadow-black/5 flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('chat')}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-medium flex items-center justify-center transition-all cursor-pointer",
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
              "px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer",
              activeTab === 'timeline' ? "bg-brand text-white shadow-md font-semibold" : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
            )}
          >
            <Clock size={16} />
            <span className="hidden sm:inline">Timeline</span>
          </button>

          <button
            onClick={() => setActiveTab('accounts')}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer",
              activeTab === 'accounts' ? "bg-brand text-white shadow-md font-semibold" : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
            )}
          >
            <Wallet size={16} />
            <span className="hidden sm:inline">Cuentas</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer",
              activeTab === 'reports' ? "bg-brand text-white shadow-md font-semibold" : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
            )}
          >
            <PieChart size={16} />
            <span className="hidden sm:inline">Reportes</span>
          </button>

          <button
            onClick={() => setActiveTab('goals')}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer",
              activeTab === 'goals' ? "bg-brand text-white shadow-md font-semibold" : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
            )}
            title="Metas & Ahorros"
          >
            <Target size={16} />
            <span className="hidden sm:inline">Metas & Ahorros</span>
          </button>
        </nav>
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
                <h3 className="font-serif font-semibold text-lg text-text-primary text-left">
                  {addModalStep === 1 ? 'Dictar Registro por Voz' : 'Confirmar Registro con IA'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setAddModalStep(1);
                    setAiParsedPreview(null);
                  }}
                  className="w-8 h-8 rounded-full bg-bg hover:bg-surface-hover border border-border text-text-secondary flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* STEP 1: VOICE DICTATION & AI PROCESSING */}
              {addModalStep === 1 && (
                <div className="space-y-4">
                  {/* Segmented Type Preference Toggle (Ingreso vs Gasto) */}
                  <div className="bg-bg border border-border p-1 rounded-2xl flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setAddType('expense')}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5",
                        addType === 'expense' ? "bg-error text-white shadow-sm" : "text-text-secondary hover:text-text-primary"
                      )}
                    >
                      <TrendingDown size={14} />
                      <span>Gasto</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAddType('income')}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5",
                        addType === 'income' ? "bg-success text-white shadow-sm" : "text-text-secondary hover:text-text-primary"
                      )}
                    >
                      <TrendingUp size={14} />
                      <span>Ingreso</span>
                    </button>
                  </div>

                  {/* Voice Soundwave & Mic Container */}
                  <div className="p-8 bg-bg border border-border rounded-2xl flex flex-col items-center justify-center space-y-4 min-h-44">
                    <AnimatePresence>
                      {isRecording && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="flex items-center justify-center gap-1.5 h-10 py-1 w-full"
                        >
                          {audioLevels.map((lvl, i) => (
                            <motion.div
                              key={i}
                              animate={{ height: `${lvl}%` }}
                              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                              className="w-1.5 bg-brand rounded-full shadow-xs shadow-brand/50"
                              style={{ minHeight: '6px' }}
                            />
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {isAiParsingAudio ? (
                      <div className="flex flex-col items-center gap-2 py-2 text-brand">
                        <Sparkles size={24} className="animate-spin" />
                        <p className="text-xs font-medium">Analizando audio e interpretando intención con IA...</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-text-secondary">
                          {isRecording ? "Escuchando... habla de forma natural" : "Toca el micrófono y dicta tu registro (ej. 'Créame un gasto de un pantalón')"}
                        </p>

                        <button
                          type="button"
                          onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                          className={cn(
                            "w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-95 cursor-pointer mt-2",
                            isRecording ? "bg-error animate-pulse" : "bg-brand hover:bg-brand-hover"
                          )}
                        >
                          {isRecording ? <MicOff size={26} /> : <Mic size={26} />}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2: AI CONFIRMATION & PRE-SELECTED DETAILS */}
              {addModalStep === 2 && aiParsedPreview && (
                <div className="space-y-4 text-left">
                  {/* AI Result Card */}
                  <div className="bg-bg border border-border p-4.5 rounded-2xl space-y-2.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold bg-brand/10 text-brand px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                        <Sparkles size={12} /> Registro a Crear por IA
                      </span>
                      <span className="text-xs font-bold text-brand bg-brand/10 px-2.5 py-0.5 rounded-md font-mono">{aiParsedPreview.category}</span>
                    </div>

                    <div className="pt-1">
                      <h4 className="text-base font-semibold text-text-primary capitalize">{aiParsedPreview.description}</h4>
                      <p className="text-2xl font-bold font-mono text-text-primary mt-1">{aiParsedPreview.amount} {defaultCurrency}</p>
                    </div>
                  </div>

                  {/* Pre-selected Type Toggle */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-text-secondary">Tipo Preseleccionado:</label>
                    <div className="bg-bg border border-border p-1 rounded-2xl flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setAiParsedPreview(prev => prev ? { ...prev, type: 'expense' } : null)}
                        className={cn(
                          "flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5",
                          aiParsedPreview.type === 'expense' ? "bg-error text-white shadow-sm" : "text-text-secondary hover:text-text-primary"
                        )}
                      >
                        <TrendingDown size={14} />
                        <span>Gasto</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAiParsedPreview(prev => prev ? { ...prev, type: 'income' } : null)}
                        className={cn(
                          "flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5",
                          aiParsedPreview.type === 'income' ? "bg-success text-white shadow-sm" : "text-text-secondary hover:text-text-primary"
                        )}
                      >
                        <TrendingUp size={14} />
                        <span>Ingreso</span>
                      </button>
                    </div>
                  </div>

                  {/* Pre-selected Account / Card Picker */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-secondary">Cuenta o Tarjeta Asignada:</label>
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
                              : "bg-bg border-border text-text-primary hover:border-brand/40 hover:bg-surface-hover"
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

                  {/* Action Buttons */}
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
                            showToast(`¡Registro creado! ${aiParsedPreview.category} - ${aiParsedPreview.amount}€`, 'success');
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
                      <span>Confirmar y Crear Registro</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAddModalStep(1);
                        setAiParsedPreview(null);
                      }}
                      className="w-full bg-bg hover:bg-surface-hover border border-border text-text-secondary py-2.5 rounded-2xl text-xs font-medium transition-colors cursor-pointer text-center"
                    >
                      Volver a Dictar por Voz
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
                        {t.type === 'income' ? '+' : '-'}{t.amount}€
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

      {/* Onboarding Dialog */}
      <AnimatePresence>
        {showOnboarding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full bg-surface border border-border p-6 rounded-3xl space-y-4"
            >
              <h3 className="text-xl font-serif font-semibold">
                {onbStep === 0 ? 'Bienvenido a HeraWallet' : 'Casi listos'}
              </h3>
              <p className="text-xs text-text-secondary">
                {onbStep === 0 
                  ? 'Queremos conocerte un poco mejor para personalizar tu experiencia.' 
                  : 'Solo necesitamos un par de datos de contacto para asegurar tu cuenta.'}
              </p>
              
              <div className="space-y-3.5 text-xs text-left">
                {onbStep === 0 ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-text-secondary">Nombre completo</label>
                      <input 
                        type="text" 
                        placeholder="Ej. Juan Pérez" 
                        value={onbName} 
                        onChange={e => setOnbName(e.target.value)} 
                        className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-text-primary focus:outline-none focus:border-brand/60" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-text-secondary">Fecha de nacimiento</label>
                      <input 
                        type="date" 
                        value={onbBirthDate} 
                        onChange={e => setOnbBirthDate(e.target.value)} 
                        className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-text-primary focus:outline-none focus:border-brand/60" 
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-text-secondary">Correo electrónico</label>
                      <input 
                        type="email" 
                        placeholder="ejemplo@correo.com" 
                        value={onbEmail} 
                        onChange={e => setOnbEmail(e.target.value)} 
                        className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-text-primary focus:outline-none focus:border-brand/60" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-text-secondary">Dirección</label>
                      <input 
                        type="text" 
                        placeholder="Calle, número, ciudad" 
                        value={onbAddress} 
                        onChange={e => setOnbAddress(e.target.value)} 
                        className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-text-primary focus:outline-none focus:border-brand/60" 
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                {onbStep === 0 ? (
                  <>
                    <button 
                      onClick={() => setShowOnboarding(false)} 
                      className="flex-1 bg-bg hover:bg-surface-hover text-text-secondary py-2.5 rounded-xl text-xs font-medium border border-border cursor-pointer"
                    >
                      Omitir
                    </button>
                    <button 
                      onClick={() => setOnbStep(1)} 
                      disabled={!onbName || !onbBirthDate}
                      className="flex-1 bg-brand hover:bg-brand-hover text-white py-2.5 rounded-xl text-xs font-medium cursor-pointer disabled:opacity-50 transition-colors"
                    >
                      Continuar
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => setOnbStep(0)} 
                      className="flex-1 bg-bg hover:bg-surface-hover text-text-secondary py-2.5 rounded-xl text-xs font-medium border border-border cursor-pointer"
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
                          setShowOnboarding(false);
                          showToast('Perfil actualizado correctamente', 'success');
                        } catch {
                          showToast('Error al guardar', 'error');
                        } finally {
                          setOnbSaving(false);
                        }
                      }} 
                      className="flex-1 bg-brand hover:bg-brand-hover text-white py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-colors"
                    >
                      {onbSaving ? 'Guardando...' : 'Comenzar'}
                    </button>
                  </>
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
    </div>
  );
}
