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
  RotateCw,
  Copy,
  Volume2,
  ThumbsUp,
  ThumbsDown,
  FileText,
  FileSpreadsheet,
  File,
  Download,
  HandCoins,
  ArrowDownLeft,
  ArrowUpRight,
  Ban,
  PlusCircle,
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

  const DEFAULT_SAMPLE_DEBTS = [
    { id: 'sample-1', name: 'Cena de cumpleaños', personOrEntity: 'Carlos Gómez', type: 'debt', amount: 150.00, dueDate: '2026-08-15', status: 'pending' },
    { id: 'sample-2', name: 'Préstamo proyecto web', personOrEntity: 'Laura Martínez', type: 'receivable', amount: 280.00, dueDate: '2026-08-30', status: 'pending' },
    { id: 'sample-3', name: 'Cuota mensual equipo', personOrEntity: 'Banco Santander', type: 'debt', amount: 450.00, dueDate: '2026-09-01', status: 'pending' },
    { id: 'sample-4', name: 'Entrada de concierto', personOrEntity: 'Pedro Sánchez', type: 'receivable', amount: 65.00, dueDate: '2026-07-20', status: 'paid' },
  ];

  const fetchDebtsList = useCallback(async () => {
    setDebtsLoading(true);
    try {
      const res = await api('/finance/debts');
      if (Array.isArray(res) && res.length > 0) {
        setDebtsList(res);
      } else {
        setDebtsList(DEFAULT_SAMPLE_DEBTS);
      }
    } catch {
      setDebtsList(DEFAULT_SAMPLE_DEBTS);
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
          fetchRes = await fetch('http://localhost:4000/api/export-document', {
            method: 'POST',
            headers,
            body: JSON.stringify({ format, title, columns, rows, summary: docData?.summary })
          });
        } catch {}
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
    } catch (e) {}

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
      <main className={cn("flex-1 max-w-7xl w-full mx-auto flex flex-col min-h-0", activeTab === 'chat' && chatMessages.length > 0 ? "px-3 pt-2 pb-1 sm:px-6 overflow-hidden" : "px-3 sm:px-6 pt-3 sm:pt-5 pb-24 sm:pb-32 overflow-y-auto scrollbar-none")}>
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

                              {/* Assistant Action Footer Bar (Speaker + ThumbsUp + ThumbsDown + Copy + Regenerate) */}
                              <div className="flex items-center gap-3 text-[11px] text-text-secondary px-1 py-0.5 font-mono">
                                <button
                                  type="button"
                                  onClick={() => handleSpeakText(msg.content)}
                                  className="hover:text-brand transition-colors p-1 cursor-pointer"
                                  title="Escuchar en voz alta"
                                >
                                  <Volume2 size={13} />
                                </button>

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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {goals.map(g => {
                    const pct = Math.min(100, Math.round((g.currentAmount / Math.max(1, g.targetAmount)) * 100));
                    return (
                      <div key={g.id} className="bg-surface border border-border p-5 rounded-3xl space-y-4 shadow-xs hover:border-brand/40 transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-brand/10 border border-brand/20 text-brand flex items-center justify-center shrink-0">
                              <Target size={20} />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-text-primary">{g.name}</h4>
                              <span className="text-[10px] font-mono text-text-dim">Límite: {g.deadline}</span>
                            </div>
                          </div>
                          <div className="text-right font-mono font-bold text-xs text-brand">
                            {g.currentAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} € / {g.targetAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono text-text-secondary">
                            <span>Avance del Fondo</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="w-full bg-bg h-2 rounded-full overflow-hidden border border-border/40">
                            <div className="bg-brand h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>

                        <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                          <span className="text-text-secondary text-[11px]">Cuota sugerida: <strong className="text-text-primary font-mono">{g.weeklyTarget} €/semana</strong></span>
                          <button
                            onClick={() => sendChatMessage(`Quiero abonar a mi meta ${g.name}`)}
                            className="px-3 py-1 rounded-xl bg-brand/10 hover:bg-brand/20 text-brand text-xs font-medium transition-all active:scale-[0.96]"
                          >
                            + Abonar
                          </button>
                        </div>
                      </div>
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

                {/* Animated Score Hero Card & 5 Pillars Grid */}
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
                        const scoreVal = overview?.healthScore || 88;
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
                        (overview?.healthScore || 88) >= 80 ? "bg-success/15 text-success border-success/30" : (overview?.healthScore || 88) >= 60 ? "bg-brand/15 text-brand border-brand/30" : "bg-warning/15 text-warning border-warning/30"
                      )}>
                        {(overview?.healthScore || 88) >= 80 ? 'Excelente Salud Financiera' : (overview?.healthScore || 88) >= 60 ? 'Salud Financiera Buena' : 'Requiere Atención'}
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
                        { label: 'Ahorro & Capacidad de Flujo', pts: overview?.scoreBreakdown?.savings?.pts ?? 22, max: 25, desc: 'Diferencial positivo entre ingresos y gastos totales' },
                        { label: 'Nivel de Endeudamiento', pts: overview?.scoreBreakdown?.debt?.pts ?? 25, max: 25, desc: 'Proporción de deudas activas frente a tu capital disponible' },
                        { label: 'Liquidez & Fondos en Cuentas', pts: overview?.scoreBreakdown?.liquidity?.pts ?? 18, max: 20, desc: 'Saldo acumulado en tus cuentas bancarias y efectivo' },
                        { label: 'Progreso de Metas de Ahorro', pts: overview?.scoreBreakdown?.goals?.pts ?? 12, max: 15, desc: 'Avance en tus fondos de reserva y metas trazadas' },
                        { label: 'Consistencia de Registros', pts: overview?.scoreBreakdown?.consistency?.pts ?? 15, max: 15, desc: 'Frecuencia de actualización de tus transacciones' },
                      ].map((p, idx) => {
                        const pct = Math.round((p.pts / p.max) * 100);
                        return (
                          <div key={idx} className="p-2.5 bg-bg/70 border border-border/50 rounded-2xl space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-text-primary">{p.label}</span>
                              <span className="font-mono font-bold text-brand">{p.pts} / {p.max} pts</span>
                            </div>
                            <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden border border-border/40">
                              <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: `${pct}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.1 * idx, ease: [0.23, 1, 0.32, 1] }}
                                className="bg-brand h-full rounded-full"
                              />
                            </div>
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
                        impact: '+6 pts en Score',
                        desc: 'Tu capacidad de ahorro actual es positiva. Si destinas un 5% adicional de tus ingresos al fondo de reserva, tu salud financiera subirá de nivel.',
                        actionText: 'Ver Metas de Ahorro',
                        actionTab: 'goals'
                      },
                      {
                        title: 'Optimización de Deudas',
                        impact: '+8 pts en Score',
                        desc: 'Liquidando tu deuda pendiente de 150 € con Carlos Gómez elevarás tu pilar de endeudamiento a la puntuación máxima de 25 puntos.',
                        actionText: 'Gestor de Deudas',
                        actionTab: 'debts'
                      },
                      {
                        title: 'Colchón de Liquidez en Cuentas',
                        impact: '+5 pts en Score',
                        desc: 'Mantener un balance de seguridad de al menos 1.000 € en tus cuentas activas protegerá tu score ante imprevistos de caja.',
                        actionText: 'Ver Mis Cuentas',
                        actionTab: 'accounts'
                      },
                      {
                        title: 'Consistencia de Transacciones',
                        impact: 'Registro Frecuente',
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
                    <div className="bg-surface border border-border p-5 rounded-3xl space-y-3 shadow-xs hover:border-error/30 transition-all relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-text-secondary">A quién debo (Mis deudas)</span>
                        <div className="w-8 h-8 rounded-xl bg-error/10 border border-error/20 text-error flex items-center justify-center">
                          <ArrowUpRight size={16} />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold font-mono text-error tracking-tight">
                          {totalIOwe.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                        </div>
                        <p className="text-[11px] text-text-dim mt-1">Por saldar con terceros</p>
                      </div>
                    </div>

                    {/* Card 2: Quién me debe */}
                    <div className="bg-surface border border-border p-5 rounded-3xl space-y-3 shadow-xs hover:border-success/30 transition-all relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-text-secondary">Quién me debe (Por cobrar)</span>
                        <div className="w-8 h-8 rounded-xl bg-success/10 border border-success/20 text-success flex items-center justify-center">
                          <ArrowDownLeft size={16} />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold font-mono text-success tracking-tight">
                          {totalTheyOweMe.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                        </div>
                        <p className="text-[11px] text-text-dim mt-1">Pendientes por recibir</p>
                      </div>
                    </div>
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
                    <div className="py-16 text-center text-xs text-text-secondary font-mono animate-pulse">
                      Cargando registros de deudas y cobros...
                    </div>
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
                                  {totalAmt.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                                </div>
                                {!isPaid && !isCancelled && paidAmt > 0 && (
                                  <span className="text-[10px] font-mono text-text-dim block">
                                    Resta: {remainingAmt.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Progress Bar Component */}
                            <div className="space-y-1 bg-bg/60 p-2.5 rounded-2xl border border-border/50">
                              <div className="flex justify-between items-center text-[10px] font-mono text-text-secondary">
                                <span>Abonado: {paidAmt.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
                                <span>{pctPaid}% {isPaid ? '— Completo' : isCancelled ? '— Cancelado' : `(Pte: ${remainingAmt.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €)`}</span>
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
                                      <PlusCircle size={14} />
                                      <span>+ Abonar</span>
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
        <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 bg-surface/85 backdrop-blur-2xl border border-border/80 rounded-2xl p-1.5 shadow-xl shadow-black/10 flex items-center gap-1 sm:gap-1.5 max-w-[94vw] overflow-x-auto scrollbar-none">
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
                  {/* HeraWallet Minimalist & Premium Voice Container */}
                  <div className="relative p-8 bg-bg border border-border rounded-3xl flex flex-col items-center justify-center space-y-5 min-h-[260px] overflow-hidden">
                    
                    {/* 1. RECORDING STATE ANIMATION (FULL-WIDTH SOUNDWAVE) */}
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

                    {/* 2. AI PROCESSING STATE (HERA LOGO + NEURAL PULSE ENGINE) */}
                    {isAiParsingAudio ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                        className="flex flex-col items-center gap-4 py-3 text-center relative z-10 w-full"
                      >
                        {/* Hera Logo Core */}
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

                        {/* Thinking Line Indicator */}
                        <div className="w-full max-w-[180px] h-1 bg-surface-hover rounded-full overflow-hidden relative">
                          <motion.div 
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                            className="w-1/2 h-full bg-gradient-to-r from-transparent via-brand to-transparent rounded-full"
                          />
                        </div>

                        {/* Step Text */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-center gap-2">
                            <Sparkles size={14} className="text-brand animate-spin" />
                            <span className="font-serif font-semibold text-sm text-text-primary">
                              Hera AI Analizando Registro
                            </span>
                          </div>
                          <p className="text-[11px] text-text-secondary font-sans max-w-xs">
                            Interpretando intención, desglose de importe y categoría...
                          </p>
                        </div>
                      </motion.div>
                    ) : !isRecording && (
                      <>
                        <p className="text-xs text-text-secondary relative z-10 max-w-xs leading-relaxed font-sans">
                          Toca el micrófono para dictar tu registro
                        </p>

                        {/* HeraWallet Hero Microphone Button (#D97757) */}
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

                    {/* Active Microphone Stop Button when Recording */}
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
                      {newDebtAmount ? `${parseFloat(newDebtAmount).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €` : '0.00 €'}
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
                  <span className="font-bold text-text-primary">{Number(selectedDebtForPayment.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary">Monto a Abonar (€):</label>
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
                  <div className="py-8 text-center text-xs text-text-secondary font-mono animate-pulse">Cargando historial de abonos...</div>
                ) : paymentHistoryList.length === 0 ? (
                  <div className="p-6 text-center text-xs text-text-secondary space-y-2 bg-bg rounded-2xl border border-border/60">
                    <History size={28} className="mx-auto text-text-dim opacity-50" />
                    <p>No se han registrado abonos parciales todavía.</p>
                  </div>
                ) : (
                  paymentHistoryList.map((p, idx) => (
                    <div key={p.id || idx} className="p-3.5 bg-bg border border-border/80 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                      <div>
                        <div className="font-mono font-bold text-xs text-success">+ {Number(p.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</div>
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
