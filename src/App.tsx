import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  LayoutDashboard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar, 
  Settings, 
  Plus, 
  Wallet,
  PieChart,
  Repeat,
  Bell,
  Search,
  LogOut,
  ChevronRight,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Tag,
  DollarSign,
  Filter,
  Download,
  MoreHorizontal,
  X,
  Check,
  AlertCircle,
  Lightbulb,
  Home,
  Utensils,
  Car,
  Gamepad,
  HeartPulse,
  ShoppingBag,
  CreditCard,
  Banknote,
  Sun,
  Moon,
  ChevronDown,
  Trash2,
  Target,
  User as UserIcon,
  LogIn,
  Coffee,
  Music,
  Film,
  Gift,
  Plane,
  Briefcase,
  GraduationCap,
  Dumbbell,
  Zap,
  Smartphone,
  Wifi,
  Tv,
  Droplets,
  Flame,
  Shield,
  Heart,
  Star,
  Camera,
  Book,
  Globe,
  ShoppingBag as ShoppingBagIcon,
  Home as HomeIcon,
  Car as CarIcon,
  Utensils as UtensilsIcon,
  Gamepad as GamepadIcon,
  HeartPulse as HeartPulseIcon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart as RePieChart,
  Pie,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfYear, endOfYear, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn, formatCurrency } from './lib/utils';
import { Transaction, TransactionType, Frequency, Category, RecurringTransaction, AISuggestion, Account, UserProfile, FinancialGoal, GoalAutomation, GoalContribution } from './types';
import { CATEGORIES } from './constants';
import { getFinancialSuggestions } from './services/geminiService';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  FirebaseUser
} from './firebase';

// --- Error Handling ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // showToast('Error de permisos en Firestore');
}

// --- Constants ---

const ACCOUNT_TYPES = [
  { id: 'cash', name: 'Efectivo', icon: Banknote, color: '#F5C842' },
  { id: 'card', name: 'Tarjeta', icon: CreditCard, color: '#FF5C1A' },
  { id: 'bank', name: 'Banco', icon: Wallet, color: '#3B9EFF' },
];

// --- Components ---

const IconMap: Record<string, any> = {
  Wallet, Utensils, Home, Car, Gamepad, HeartPulse, ShoppingBag, MoreHorizontal, CreditCard, Banknote,
  Coffee, Music, Film, Gift, Plane, Briefcase, GraduationCap, Dumbbell, Zap, Smartphone, Wifi, Tv,
  Droplets, Flame, Shield, Heart, Star, Camera, Book, Globe
};

function AppLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { container: 'w-8 h-8', icon: 18, text: 'text-lg' },
    md: { container: 'w-10 h-10', icon: 24, text: 'text-xl' },
    lg: { container: 'w-20 h-20', icon: 40, text: 'text-4xl' }
  };
  
  return (
    <div className="flex items-center gap-3">
      <div className={cn(sizes[size].container, "bg-orange-primary rounded-xl flex items-center justify-center shadow-lg shadow-orange-primary/20 relative overflow-hidden group")}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <Target size={sizes[size].icon} className="text-white relative z-10" />
      </div>
      {size !== 'lg' && (
        <div>
          <h1 className={cn("font-display font-bold tracking-tight", sizes[size].text)}>Hera</h1>
          <span className="text-[10px] uppercase tracking-widest text-orange-secondary font-bold">Smart Finance</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'dashboard' | 'transactions' | 'accounts' | 'recurring' | 'categories' | 'goals' | 'settings'>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [automations, setAutomations] = useState<GoalAutomation[]>([]);
  const [goalContributions, setGoalContributions] = useState<GoalContribution[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'transaction' | 'account' | 'category' | 'goal' | 'automation' | 'addFunds'>('transaction');
  const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | null>(null);
  const [selectedGoalDetails, setSelectedGoalDetails] = useState<FinancialGoal | null>(null);
  const [isGoalSidebarOpen, setIsGoalSidebarOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [notifications, setNotifications] = useState<{id: string, title: string, content: string, date: string, read: boolean}[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isRecurringChecked, setIsRecurringChecked] = useState(false);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [selectedTransactionDetails, setSelectedTransactionDetails] = useState<Transaction | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('hera_search_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all' as 'all' | 'income' | 'expense',
    accountId: 'all',
    categoryId: 'all',
    minAmount: '',
    maxAmount: '',
    dateRange: 'all' as 'all' | 'day' | 'week' | 'month' | 'year'
  });

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filters.type === 'all' || t.type === filters.type;
      const matchesAccount = filters.accountId === 'all' || t.accountId === filters.accountId;
      const matchesCategory = filters.categoryId === 'all' || t.categoryId === filters.categoryId;
      const matchesMinAmount = !filters.minAmount || t.amount >= Number(filters.minAmount);
      const matchesMaxAmount = !filters.maxAmount || t.amount <= Number(filters.maxAmount);
      
      let matchesDate = true;
      const tDate = parseISO(t.date);
      if (filters.dateRange === 'day') matchesDate = isWithinInterval(tDate, { start: startOfDay(new Date()), end: endOfDay(new Date()) });
      else if (filters.dateRange === 'week') matchesDate = isWithinInterval(tDate, { start: startOfWeek(new Date()), end: endOfWeek(new Date()) });
      else if (filters.dateRange === 'month') matchesDate = isWithinInterval(tDate, { start: startOfMonth(new Date()), end: endOfMonth(new Date()) });
      else if (filters.dateRange === 'year') matchesDate = isWithinInterval(tDate, { start: startOfYear(new Date()), end: endOfYear(new Date()) });

      return matchesSearch && matchesType && matchesAccount && matchesCategory && matchesMinAmount && matchesMaxAmount && matchesDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchTerm, filters]);

  useEffect(() => {
    localStorage.setItem('hera_search_history', JSON.stringify(searchHistory));
  }, [searchHistory]);

  const addToSearchHistory = (term: string) => {
    if (!term.trim()) return;
    setSearchHistory(prev => {
      const filtered = prev.filter(t => t !== term);
      return [term, ...filtered].slice(0, 10); // Keep 10, but user wants scrollable after 5
    });
  };

  const allCategories = useMemo(() => {
    const merged = [...CATEGORIES];
    customCategories.forEach(cc => {
      const index = merged.findIndex(c => c.id === cc.id);
      if (index !== -1) {
        merged[index] = { ...merged[index], ...cc };
      } else {
        merged.push(cc);
      }
    });
    // Filter out hidden categories
    return merged.filter(c => !profile?.hiddenCategories?.includes(c.id));
  }, [customCategories, profile?.hiddenCategories]);

  // Auth Listener
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const userDoc = await getDoc(doc(db, 'users', u.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as UserProfile;
          setProfile(data);
          setTheme(data.theme || 'dark');
        } else {
          const newProfile: UserProfile = {
            uid: u.uid,
            email: u.email!,
            displayName: u.displayName || '',
            photoURL: u.photoURL || '',
            theme: 'dark',
            currency: 'EUR',
            createdAt: new Date().toISOString()
          };
          const path = `users/${u.uid}`;
          try {
            await setDoc(doc(db, path), newProfile);
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, path);
          }
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  // Theme Sync
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  // Data Listeners
  useEffect(() => {
    if (!user) return;

    const accountsPath = `users/${user.uid}/accounts`;
    const unsubAccounts = onSnapshot(collection(db, accountsPath), (snap) => {
      setAccounts(snap.docs.map(d => ({ ...d.data(), id: d.id } as Account)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, accountsPath));

    const transactionsPath = `users/${user.uid}/transactions`;
    const unsubTransactions = onSnapshot(collection(db, transactionsPath), (snap) => {
      setTransactions(snap.docs.map(d => ({ ...d.data(), id: d.id } as Transaction)).sort((a, b) => b.date.localeCompare(a.date)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, transactionsPath));

    const recurringPath = `users/${user.uid}/recurring`;
    const unsubRecurring = onSnapshot(collection(db, recurringPath), (snap) => {
      setRecurring(snap.docs.map(d => ({ ...d.data(), id: d.id } as RecurringTransaction)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, recurringPath));

    const categoriesPath = `users/${user.uid}/categories`;
    const unsubCategories = onSnapshot(collection(db, categoriesPath), (snap) => {
      setCustomCategories(snap.docs.map(d => ({ ...d.data(), id: d.id } as Category)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, categoriesPath));

    const goalsPath = `users/${user.uid}/goals`;
    const unsubGoals = onSnapshot(collection(db, goalsPath), (snap) => {
      setGoals(snap.docs.map(d => ({ ...d.data(), id: d.id } as FinancialGoal)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, goalsPath));

    const automationsPath = `users/${user.uid}/automations`;
    const unsubAutomations = onSnapshot(collection(db, automationsPath), (snap) => {
      setAutomations(snap.docs.map(d => ({ ...d.data(), id: d.id } as GoalAutomation)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, automationsPath));

    const contributionsPath = `users/${user.uid}/goalContributions`;
    const unsubContributions = onSnapshot(collection(db, contributionsPath), (snap) => {
      setGoalContributions(snap.docs.map(d => ({ ...d.data(), id: d.id } as GoalContribution)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, contributionsPath));

    return () => {
      unsubAccounts();
      unsubTransactions();
      unsubRecurring();
      unsubCategories();
      unsubGoals();
      unsubAutomations();
      unsubContributions();
    };
  }, [user]);

  // AI Suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (transactions.length === 0) return;
      setIsLoadingSuggestions(true);
      const res = await getFinancialSuggestions(transactions);
      setSuggestions(res);
      setIsLoadingSuggestions(false);
    };
    fetchSuggestions();
  }, [transactions.length]);

  // Process Recurring
  useEffect(() => {
    if (!user || recurring.length === 0) return;
    const now = new Date();
    recurring.forEach(async (r) => {
      if (!r.isActive) return;
      const next = parseISO(r.nextOccurrence);
      if (next <= now) {
        const transaction: Omit<Transaction, 'id'> = {
          userId: user.uid,
          accountId: r.accountId,
          type: r.type,
          amount: r.amount,
          categoryId: r.categoryId,
          description: r.description,
          date: r.nextOccurrence,
          isRecurring: true,
          recurringId: r.id
        };
        const txPath = `users/${user.uid}/transactions`;
        try {
          await addDoc(collection(db, txPath), transaction);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, txPath);
        }
        
        // Update account balance
        const account = accounts.find(a => a.id === r.accountId);
        if (account) {
          const newBalance = r.type === 'income' ? account.balance + r.amount : account.balance - r.amount;
          const accPath = `users/${user.uid}/accounts/${r.accountId}`;
          try {
            await updateDoc(doc(db, accPath), { balance: newBalance });
          } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, accPath);
          }
        }

        // Calculate next
        let nextDate = new Date(next);
        if (r.frequency === 'daily') nextDate.setDate(nextDate.getDate() + 1);
        else if (r.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
        else if (r.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
        else if (r.frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
        
        const recPath = `users/${user.uid}/recurring/${r.id}`;
        try {
          await updateDoc(doc(db, recPath), { 
            nextOccurrence: nextDate.toISOString(),
            lastProcessed: now.toISOString()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, recPath);
        }
      }
    });
  }, [recurring, user, accounts]);



  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpenses;
  const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0);

  // Notification Logic
  useEffect(() => {
    if (!user || transactions.length === 0) return;
    
    const newNotifs: any[] = [];
    const sessionAlerts = (window as any).hera_session_alerts || new Set();
    
    // 1. Category Limits
    allCategories.forEach(c => {
      if (c.budgetLimit) {
        const spent = transactions.filter(t => t.categoryId === c.id && t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
        if (spent > c.budgetLimit) {
          const alertId = `limit-exceeded-${c.id}`;
          newNotifs.push({
            id: alertId,
            title: 'Límite Excedido',
            content: `Has superado el presupuesto de ${c.name} (${formatCurrency(spent)} / ${formatCurrency(c.budgetLimit)})`,
            date: new Date().toISOString(),
            read: false
          });
          if (!sessionAlerts.has(alertId)) {
            showToast(`¡Presupuesto excedido en ${c.name}!`, 'error');
            sessionAlerts.add(alertId);
          }
        } else if (spent > c.budgetLimit * 0.8) {
          const alertId = `limit-approaching-${c.id}`;
          newNotifs.push({
            id: alertId,
            title: 'Límite Cercano',
            content: `Estás por alcanzar el presupuesto de ${c.name} (${formatCurrency(spent)} / ${formatCurrency(c.budgetLimit)})`,
            date: new Date().toISOString(),
            read: false
          });
          if (!sessionAlerts.has(alertId)) {
            showToast(`Estás cerca del límite en ${c.name}`, 'warning');
            sessionAlerts.add(alertId);
          }
        }
      }
    });

    (window as any).hera_session_alerts = sessionAlerts;

    // 2. Negative Accounts
    accounts.forEach(a => {
      if (a.balance < 0) {
        newNotifs.push({
          id: `negative-account-${a.id}`,
          title: 'Cuenta en Negativo',
          content: `Tu cuenta "${a.name}" tiene un saldo negativo de ${formatCurrency(a.balance)}`,
          date: new Date().toISOString(),
          read: false
        });
      }
    });

    // 3. 50/30/20 Limits
    const needsActual = transactions.filter(t => t.type === 'expense' && allCategories.find(c => c.id === t.categoryId)?.budgetType === 'need').reduce((acc, t) => acc + t.amount, 0);
    const wantsActual = transactions.filter(t => t.type === 'expense' && allCategories.find(c => c.id === t.categoryId)?.budgetType === 'want').reduce((acc, t) => acc + t.amount, 0);
    const savingsActual = transactions.filter(t => t.type === 'expense' && allCategories.find(c => c.id === t.categoryId)?.budgetType === 'saving').reduce((acc, t) => acc + t.amount, 0);

    const needsTarget = totalIncome * 0.5;
    const wantsTarget = totalIncome * 0.3;
    const savingsTarget = totalIncome * 0.2;

    if (needsActual > needsTarget && totalIncome > 0) {
      newNotifs.push({ id: '50-30-20-needs', title: 'Regla 50/30/20', content: 'Has excedido el 50% recomendado para Necesidades.', date: new Date().toISOString(), read: false });
    }
    if (wantsActual > wantsTarget && totalIncome > 0) {
      newNotifs.push({ id: '50-30-20-wants', title: 'Regla 50/30/20', content: 'Has excedido el 30% recomendado para Deseos.', date: new Date().toISOString(), read: false });
    }
    if (savingsActual > savingsTarget && totalIncome > 0) {
      newNotifs.push({ id: '50-30-20-savings', title: 'Regla 50/30/20', content: 'Has excedido el 20% recomendado para Ahorro/Deuda.', date: new Date().toISOString(), read: false });
    }

    // Filter out existing notifications to avoid duplicates
    const finalNotifs = newNotifs.filter(nn => !notifications.some(n => n.id === nn.id));
    if (finalNotifs.length > 0) {
      setNotifications(prev => [...finalNotifs, ...prev]);
    }
  }, [transactions, accounts, allCategories, totalIncome]);

  const getPieData = (txs: Transaction[]) => {
    const groups: Record<string, { name: string, value: number, color: string }> = {};
    txs.forEach(t => {
      const cat = allCategories.find(c => c.id === t.categoryId) || { name: 'Otros', color: '#7A7874' };
      if (!groups[t.categoryId]) {
        groups[t.categoryId] = { name: cat.name, value: 0, color: cat.color };
      }
      groups[t.categoryId].value += t.amount;
    });
    return Object.values(groups);
  };

  const handleLogin = () => signInWithPopup(auth, googleProvider);
  const handleLogout = () => signOut(auth);

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    if (user) {
      const path = `users/${user.uid}`;
      try {
        await updateDoc(doc(db, path), { theme: newTheme });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    }
  };

  const handleAddFundsToGoal = async (goalId: string, amount: number, source: 'manual' | 'automation' = 'manual', automationId?: string) => {
    if (!user || amount <= 0) return;
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const remaining = goal.targetAmount - goal.currentAmount;
    if (amount > remaining) {
      showToast(`El monto excede la meta. Solo faltan ${formatCurrency(remaining)}`, 'warning');
      return;
    }

    const newAmount = goal.currentAmount + amount;
    const goalPath = `users/${user.uid}/goals/${goalId}`;
    const contribPath = `users/${user.uid}/goalContributions`;

    try {
      await updateDoc(doc(db, goalPath), { currentAmount: newAmount });
      
      const contributionData: any = {
        userId: user.uid,
        goalId,
        amount,
        date: new Date().toISOString(),
        source
      };

      if (automationId) {
        contributionData.automationId = automationId;
      }

      await addDoc(collection(db, contribPath), contributionData);

      if (newAmount >= goal.targetAmount) {
        // Deactivate automations for this goal
        const relatedAutomations = automations.filter(a => a.targetGoalId === goalId && a.isActive);
        for (const auto of relatedAutomations) {
          await updateDoc(doc(db, `users/${user.uid}/automations/${auto.id}`), { isActive: false });
        }
        showToast(`¡Felicidades! Has alcanzado tu meta: ${goal.name}`, 'success');
      } else {
        showToast(`Se han añadido ${formatCurrency(amount)} a ${goal.name}`, 'success');
      }
      
      setIsModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, goalPath);
      showToast('Error al procesar la operación', 'error');
    }
  };

  const handleAddGoal = async (data: any) => {
    if (!user) return;
    const path = `users/${user.uid}/goals`;
    try {
      await addDoc(collection(db, path), {
        ...data,
        userId: user.uid,
        createdAt: new Date().toISOString()
      });
      setIsModalOpen(false);
      showToast('Objetivo creado');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const handleUpdateGoal = async (id: string, data: any) => {
    if (!user) return;
    const path = `users/${user.uid}/goals/${id}`;
    try {
      await updateDoc(doc(db, path), data);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/goals/${id}`;
    try {
      await deleteDoc(doc(db, path));
      showToast('Objetivo eliminado');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleAddAutomation = async (data: any) => {
    if (!user) return;
    const path = `users/${user.uid}/automations`;
    try {
      await addDoc(collection(db, path), {
        ...data,
        userId: user.uid,
        isActive: true
      });
      setIsModalOpen(false);
      showToast('Automatización creada');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const handleDeleteAutomation = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/automations/${id}`;
    try {
      await deleteDoc(doc(db, path));
      showToast('Automatización eliminada');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleAddTransaction = async (data: any) => {
    if (!user) return;
    try {
      const { isRecurring, frequency, notify, ...txData } = data;
      
      if (!txData.description || txData.description.trim() === '') {
        txData.description = txData.type === 'income' ? 'Ingreso' : 'Gasto';
      }

      if (editingTransaction) {
        // Reverse old balance impact
        const oldAccount = accounts.find(a => a.id === editingTransaction.accountId);
        if (oldAccount) {
          const reversedBalance = editingTransaction.type === 'income' ? oldAccount.balance - editingTransaction.amount : oldAccount.balance + editingTransaction.amount;
          const accPath = `users/${user.uid}/accounts/${editingTransaction.accountId}`;
          try {
            await updateDoc(doc(db, accPath), { balance: reversedBalance });
          } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, accPath);
          }
        }
        
        const txPath = `users/${user.uid}/transactions/${editingTransaction.id}`;
        try {
          await updateDoc(doc(db, txPath), txData);
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, txPath);
        }
        
        // Apply new balance impact
        const newAccount = accounts.find(a => a.id === txData.accountId);
        if (newAccount) {
          const currentBalance = newAccount.id === editingTransaction.accountId ? (editingTransaction.type === 'income' ? newAccount.balance - editingTransaction.amount : newAccount.balance + editingTransaction.amount) : newAccount.balance;
          const finalBalance = txData.type === 'income' ? currentBalance + txData.amount : currentBalance - txData.amount;
          const accPath = `users/${user.uid}/accounts/${txData.accountId}`;
          try {
            await updateDoc(doc(db, accPath), { balance: finalBalance });
          } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, accPath);
          }
        }
      } else {
        const txPath = `users/${user.uid}/transactions`;
        let newTxId = '';
        try {
          const docRef = await addDoc(collection(db, txPath), { ...txData, userId: user.uid });
          newTxId = docRef.id;
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, txPath);
        }

        if (isRecurring) {
          const recPath = `users/${user.uid}/recurring`;
          const nextOccurrence = new Date(txData.date);
          if (frequency === 'daily') nextOccurrence.setDate(nextOccurrence.getDate() + 1);
          else if (frequency === 'weekly') nextOccurrence.setDate(nextOccurrence.getDate() + 7);
          else if (frequency === 'monthly') nextOccurrence.setMonth(nextOccurrence.getMonth() + 1);
          else if (frequency === 'yearly') nextOccurrence.setFullYear(nextOccurrence.getFullYear() + 1);

          try {
            await addDoc(collection(db, recPath), {
              ...txData,
              userId: user.uid,
              frequency,
              startDate: txData.date,
              nextOccurrence: nextOccurrence.toISOString(),
              isActive: true,
              notify
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, recPath);
          }
        }

        const account = accounts.find(a => a.id === txData.accountId);
        if (account) {
          const newBalance = txData.type === 'income' ? account.balance + txData.amount : account.balance - txData.amount;
          const accPath = `users/${user.uid}/accounts/${txData.accountId}`;
          try {
            await updateDoc(doc(db, accPath), { balance: newBalance });
          } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, accPath);
          }
        }
      }
      
      // Trigger Automations
      if (txData.type === 'income') {
        const matchingAutomations = automations.filter(a => a.isActive && a.triggerCategoryId === txData.categoryId);
        for (const auto of matchingAutomations) {
          const amountToAdd = auto.type === 'fixed' ? auto.value : (txData.amount * (auto.value / 100));
          if (amountToAdd > 0) {
            await handleAddFundsToGoal(auto.targetGoalId, amountToAdd, 'automation', auto.id);
          }
        }
      }

      setIsModalOpen(false);
      setEditingTransaction(null);
      showToast(editingTransaction ? 'Transacción actualizada' : 'Transacción registrada');
    } catch (e) {
      console.error(e);
      showToast('Error al procesar la transacción', 'error');
    }
  };

  const handleDeleteTransaction = async (t: Transaction) => {
    if (!user) return;
    if (confirm('¿Estás seguro de eliminar esta transacción?')) {
      const txPath = `users/${user.uid}/transactions/${t.id}`;
      try {
        await deleteDoc(doc(db, txPath));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, txPath);
      }
      const account = accounts.find(a => a.id === t.accountId);
      if (account) {
        const newBalance = t.type === 'income' ? account.balance - t.amount : account.balance + t.amount;
        const accPath = `users/${user.uid}/accounts/${t.accountId}`;
        try {
          await updateDoc(doc(db, accPath), { balance: newBalance });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, accPath);
        }
      }
      showToast('Transacción eliminada');
    }
  };

  const handleAddAccount = async (data: any) => {
    if (!user) return;
    const path = `users/${user.uid}/accounts`;
    try {
      await addDoc(collection(db, path), { ...data, userId: user.uid, createdAt: new Date().toISOString() });
      
      setIsModalOpen(false);
      showToast('Cuenta agregada');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
      showToast('Error al crear cuenta', 'error');
    }
  };

  const handleAddCategory = async (data: any) => {
    if (!user) return;
    const path = `users/${user.uid}/categories`;
    try {
      await addDoc(collection(db, path), { ...data, userId: user.uid });
      
      setIsModalOpen(false);
      showToast('Categoría agregada');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
      showToast('Error al crear categoría', 'error');
    }
  };

  const handleUpdateCategory = async (id: string, data: Partial<Category>) => {
    if (!user) return;
    const path = `users/${user.uid}/categories/${id}`;
    try {
      // Check if it's a default category
      const isDefault = CATEGORIES.some(c => c.id === id);
      if (isDefault) {
        // If it's default, we save it as a custom override in the categories collection
        const defaultCat = CATEGORIES.find(c => c.id === id)!;
        await setDoc(doc(db, `users/${user.uid}/categories`, id), { ...defaultCat, ...data, userId: user.uid });
      } else {
        await updateDoc(doc(db, path), data);
      }
      showToast('Categoría actualizada');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!user || !profile) return;
    
    // Custom confirmation dialog instead of window.confirm
    const confirmed = window.confirm('¿Estás seguro de eliminar esta categoría?');
    if (!confirmed) return;

    const isDefault = CATEGORIES.some(c => c.id === id);
    if (isDefault) {
      // Add to hiddenCategories in profile
      const newHidden = [...(profile.hiddenCategories || []), id];
      try {
        await updateDoc(doc(db, `users/${user.uid}`), { hiddenCategories: newHidden });
        setProfile({ ...profile, hiddenCategories: newHidden });
        showToast('Categoría ocultada');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
    } else {
      const path = `users/${user.uid}/categories/${id}`;
      try {
        await deleteDoc(doc(db, path));
        setCustomCategories(prev => prev.filter(c => c.id !== id));
        showToast('Categoría eliminada');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    }
  };

  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-bg"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-primary"></div></div>;

  if (!user) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-bg p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-surface border border-border p-10 rounded-3xl text-center space-y-8 shadow-2xl"
        >
          <div className="mx-auto flex justify-center">
            <AppLogo size="lg" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-display font-bold tracking-tight">Hera</h1>
            <p className="text-text-secondary">Tu asistente financiero inteligente. Gestiona, ahorra y crece.</p>
          </div>
          <button 
            onClick={handleLogin}
            className="w-full bg-orange-primary hover:bg-orange-secondary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-orange-primary/20"
          >
            <LogIn size={20} />
            Continuar con Google
          </button>
          <p className="text-[10px] text-text-dim uppercase tracking-widest font-bold">Seguro • Privado • Inteligente</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={cn("flex h-screen bg-bg text-text-primary overflow-hidden font-sans transition-colors duration-300", theme)}>
        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 bg-sidebar border-r border-border flex-col z-20">
          <div className="p-6 border-b border-border">
            <AppLogo />
          </div>

          <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto custom-scrollbar">
            <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
            <NavItem icon={<ArrowUpRight size={20} />} label="Transacciones" active={activeView === 'transactions'} onClick={() => setActiveView('transactions')} />
            <NavItem icon={<CreditCard size={20} />} label="Mis Cuentas" active={activeView === 'accounts'} onClick={() => setActiveView('accounts')} />
            <NavItem icon={<Repeat size={20} />} label="Programados" active={activeView === 'recurring'} onClick={() => setActiveView('recurring')} />
            <NavItem icon={<Target size={20} />} label="Objetivos" active={activeView === 'goals'} onClick={() => setActiveView('goals')} />
            <NavItem icon={<Tag size={20} />} label="Categorías" active={activeView === 'categories'} onClick={() => setActiveView('categories')} />
            <div className="pt-6 pb-2 px-4 text-[10px] font-bold uppercase tracking-widest text-text-dim">Preferencias</div>
            <NavItem icon={<Settings size={20} />} label="Configuración" active={activeView === 'settings'} onClick={() => setActiveView('settings')} />
          </nav>

          <div className="p-4 border-t border-border space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-2 transition-colors cursor-pointer group" onClick={handleLogout}>
              <img src={user.photoURL || ''} className="w-10 h-10 rounded-full border border-border" alt="Profile" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user.displayName}</p>
                <p className="text-[10px] text-text-secondary truncate">{user.email}</p>
              </div>
              <LogOut size={16} className="text-text-dim group-hover:text-red-accent transition-colors" />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 relative pb-20 lg:pb-0">
          <header className="h-16 border-b border-border bg-sidebar/50 backdrop-blur-md flex items-center justify-between px-4 lg:px-8 sticky top-0 z-10">
            <div className="flex items-center gap-4 flex-1 max-w-xl">
              <div className="lg:hidden">
                <div className="w-8 h-8 bg-orange-primary rounded-lg flex items-center justify-center">
                  <Wallet className="text-white w-5 h-5" />
                </div>
              </div>
              <div className="relative w-full group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-orange-primary transition-colors" size={16} />
                <input 
                  type="text" 
                  value={searchTerm}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addToSearchHistory(searchTerm);
                      setActiveView('transactions');
                    }
                  }}
                  placeholder="Buscar transacciones, categorías..." 
                  className="w-full bg-surface-2 border border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-orange-primary/50 transition-all"
                />
                <AnimatePresence>
                  {isSearchFocused && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[400px] flex flex-col"
                    >
                      <div className="overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {!searchTerm && searchHistory.length > 0 && (
                          <div className="pb-2">
                            <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-text-dim">Recientes</p>
                            {searchHistory.map((h, i) => (
                              <button key={i} onClick={() => { setSearchTerm(h); addToSearchHistory(h); setActiveView('transactions'); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-2 text-sm transition-colors">
                                <Repeat size={14} className="text-text-dim" />
                                <span>{h}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        {searchTerm && (
                          <>
                            {/* Matching Transactions */}
                            {transactions.filter(t => t.description.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5).map(t => (
                              <button key={t.id} onClick={() => { setSelectedTransactionDetails(t); addToSearchHistory(searchTerm); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-2 text-sm transition-colors text-left">
                                <div className="w-8 h-8 rounded-lg bg-orange-primary/10 text-orange-primary flex items-center justify-center shrink-0"><ArrowUpRight size={14} /></div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold truncate">{t.description}</p>
                                  <p className="text-[10px] text-text-dim truncate">{format(parseISO(t.date), 'dd MMM yyyy')}</p>
                                </div>
                                <span className="font-bold text-xs">{formatCurrency(t.amount)}</span>
                              </button>
                            ))}
                            {/* Matching Categories */}
                            {allCategories.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(c => {
                              const Icon = IconMap[c.icon] || Tag;
                              return (
                                <button key={c.id} onClick={() => { setActiveView('categories'); addToSearchHistory(searchTerm); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-2 text-sm transition-colors text-left">
                                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${c.color}15`, color: c.color }}><Icon size={14} /></div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold truncate">{c.name}</p>
                                    <p className="text-[10px] text-text-dim truncate">Categoría</p>
                                  </div>
                                </button>
                              );
                            })}
                            {/* Matching Accounts */}
                            {accounts.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase())).map(a => (
                              <button key={a.id} onClick={() => { setActiveView('accounts'); addToSearchHistory(searchTerm); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-2 text-sm transition-colors text-left">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${a.color}15`, color: a.color }}><CreditCard size={14} /></div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold truncate">{a.name}</p>
                                  <p className="text-[10px] text-text-dim truncate">Cuenta</p>
                                </div>
                              </button>
                            ))}
                          </>
                        )}
                        {!searchTerm && searchHistory.length === 0 && (
                          <div className="p-8 text-center text-text-dim text-xs italic">Escribe para buscar...</div>
                        )}
                        {searchTerm && transactions.filter(t => t.description.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && 
                         allCategories.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 &&
                         accounts.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                          <div className="p-8 text-center text-text-dim text-xs italic">No se encontraron resultados.</div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="p-2 text-text-secondary hover:text-text-primary transition-colors relative"
                >
                  <Bell size={20} />
                  {notifications.some(n => !n.read) && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-orange-primary rounded-full border-2 border-sidebar"></span>
                  )}
                </button>
                <AnimatePresence>
                  {isNotificationsOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="fixed inset-x-4 top-20 lg:absolute lg:inset-auto lg:right-0 lg:top-full lg:mt-2 lg:w-80 bg-surface border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
                      >
                        <div className="p-4 border-b border-border bg-sidebar/50 flex items-center justify-between">
                          <h4 className="font-bold text-sm">Notificaciones</h4>
                          <button onClick={() => setNotifications([])} className="text-[10px] font-bold uppercase tracking-widest text-orange-primary hover:underline">Limpiar</button>
                        </div>
                        <div className="max-h-96 overflow-y-auto divide-y divide-border">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center text-text-dim text-xs">No tienes notificaciones nuevas.</div>
                          ) : (
                            notifications.map(n => (
                              <div key={n.id} className="p-4 hover:bg-surface-2 transition-colors cursor-default">
                                <p className="text-xs font-bold">{n.title}</p>
                                <p className="text-[10px] text-text-secondary mt-1">{n.content}</p>
                                <p className="text-[10px] text-text-dim mt-2">{format(parseISO(n.date), 'HH:mm • dd MMM')}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              <div className="h-6 w-px bg-border mx-2"></div>
              <button 
                onClick={() => {
                  setModalType('transaction');
                  setEditingTransaction(null);
                  setIsModalOpen(true);
                }}
                className="bg-orange-primary hover:bg-orange-secondary text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-orange-primary/20"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Nuevo Registro</span>
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
            <AnimatePresence mode="wait">
              {activeView === 'dashboard' && (
                <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                      <h2 className="text-2xl lg:text-3xl font-display font-bold">Hola, {user.displayName?.split(' ')[0]}</h2>
                      <p className="text-text-secondary mt-1 text-sm lg:text-base hidden sm:block">Aquí tienes un resumen de tus finanzas hoy.</p>
                    </div>
                    <div className="flex items-center gap-1 bg-surface rounded-xl p-1 border border-border overflow-x-auto no-scrollbar">
                      {(['day', 'week', 'month', 'year'] as const).map((range) => (
                        <button key={range} onClick={() => setTimeRange(range)} className={cn("px-3 lg:px-4 py-1.5 rounded-lg text-[10px] lg:text-xs font-bold transition-all capitalize whitespace-nowrap", timeRange === range ? "bg-orange-primary text-white shadow-md" : "text-text-secondary hover:text-text-primary")}>
                          {range === 'day' ? 'Hoy' : range === 'week' ? 'Semana' : range === 'month' ? 'Mes' : 'Año'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    <KPICard title="Saldo Total" value={formatCurrency(totalBalance)} trend="up" color="blue" icon={<Wallet size={24} />} />
                    <KPICard title="Ingresos" value={formatCurrency(totalIncome)} trend="up" color="green" icon={<ArrowUpRight size={24} />} />
                    <KPICard title="Gastos" value={formatCurrency(totalExpenses)} trend="down" color="red" icon={<ArrowDownLeft size={24} />} />
                    <KPICard 
                      title="Tasa de Ahorro" 
                      value={`${totalIncome > 0 ? Math.max(0, Math.round(((totalIncome - totalExpenses) / totalIncome) * 100)) : 0}%`} 
                      trend={totalIncome - totalExpenses > 0 ? 'up' : 'down'} 
                      color="orange" 
                      icon={<TrendingUp size={24} />} 
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                      <div className="bg-surface border border-border rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-8">
                          <h3 className="font-bold flex items-center gap-2 text-sm lg:text-base"><TrendingUp size={18} className="text-orange-primary" /> Flujo de Caja</h3>
                        </div>
                        <div className="h-[250px] lg:h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={getChartData(filteredTransactions)}>
                              <defs>
                                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1EE07A" stopOpacity={0.3}/><stop offset="95%" stopColor="#1EE07A" stopOpacity={0}/></linearGradient>
                                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FF4757" stopOpacity={0.3}/><stop offset="95%" stopColor="#FF4757" stopOpacity={0}/></linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#7A7874', fontSize: 10 }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#7A7874', fontSize: 10 }} tickFormatter={(val) => `$${val}`} />
                              <Tooltip content={<CustomTooltip />} />
                              <Area type="monotone" dataKey="ingresos" stroke="#1EE07A" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                              <Area type="monotone" dataKey="gastos" stroke="#FF4757" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <CustomPieChart 
                          data={getPieData(filteredTransactions.filter(t => t.type === 'income'))}
                          title="Distribución de Ingresos"
                          icon={PieChart}
                          iconColor="text-green-accent"
                        />
                        <CustomPieChart 
                          data={getPieData(filteredTransactions.filter(t => t.type === 'expense'))}
                          title="Distribución de Gastos"
                          icon={PieChart}
                          iconColor="text-red-accent"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-surface border border-border rounded-2xl p-6">
                          <h3 className="font-bold text-sm mb-6 flex items-center gap-2"><TrendingDown size={16} className="text-red-accent" /> Mayores Gastos</h3>
                          <div className="space-y-4">
                            {getPieData(filteredTransactions.filter(t => t.type === 'expense'))
                              .sort((a, b) => b.value - a.value)
                              .slice(0, 4)
                              .map((item, i) => (
                                <div key={i} className="flex items-center justify-between group">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                                      {(() => {
                                        const cat = allCategories.find(c => c.name === item.name);
                                        const Icon = IconMap[cat?.icon || 'Tag'] || Tag;
                                        return <Icon size={16} />;
                                      })()}
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold">{item.name}</p>
                                      <div className="w-24 h-1 bg-surface-2 rounded-full mt-1 overflow-hidden">
                                        <div className="h-full bg-red-accent/50" style={{ width: `${(item.value / totalExpenses) * 100}%` }} />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs font-bold">{formatCurrency(item.value)}</p>
                                    <p className="text-[10px] text-text-dim">{Math.round((item.value / totalExpenses) * 100)}% del total</p>
                                  </div>
                                </div>
                              ))}
                            {totalExpenses === 0 && <p className="text-center text-text-dim text-xs py-4 italic">Sin gastos registrados</p>}
                          </div>
                        </div>

                        <div className="bg-surface border border-border rounded-2xl p-6">
                          <h3 className="font-bold text-sm mb-6 flex items-center gap-2"><Calendar size={16} className="text-blue-accent" /> Próximos Pagos</h3>
                          <div className="space-y-4">
                            {recurring.filter(r => r.type === 'expense').slice(0, 4).map((r, i) => {
                              const cat = allCategories.find(c => c.id === r.categoryId);
                              const Icon = IconMap[cat?.icon || 'Tag'] || Tag;
                              return (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-2 border border-border hover:border-blue-accent/30 transition-all">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${cat?.color || '#7A7874'}15`, color: cat?.color || '#7A7874' }}>
                                      <Icon size={16} />
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold">{r.description}</p>
                                      <p className="text-[10px] text-text-dim capitalize">{r.frequency}</p>
                                    </div>
                                  </div>
                                  <p className="text-xs font-bold text-red-accent">-{formatCurrency(r.amount)}</p>
                                </div>
                              );
                            })}
                            {recurring.length === 0 && <p className="text-center text-text-dim text-xs py-4 italic">No hay pagos recurrentes</p>}
                          </div>
                        </div>
                      </div>

                      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-border flex items-center justify-between">
                          <h3 className="font-bold">Transacciones Recientes</h3>
                          <button onClick={() => setActiveView('transactions')} className="text-xs text-orange-primary font-bold hover:underline">Ver todo</button>
                        </div>
                          <div className="divide-y divide-border">
                            {filteredTransactions.slice(0, 5).map((t) => (
                              <TransactionItem 
                                key={t.id} 
                                transaction={t} 
                                accounts={accounts} 
                                categories={allCategories} 
                                onClick={() => setSelectedTransactionDetails(t)} 
                              />
                            ))}
                            {filteredTransactions.length === 0 && <div className="p-12 text-center text-text-dim">No hay movimientos recientes.</div>}
                          </div>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="bg-surface border border-border rounded-2xl p-6">
                        <h3 className="font-bold flex items-center gap-2 mb-6"><Target size={18} className="text-orange-primary" /> Regla 50/30/20</h3>
                        <div className="space-y-6">
                          {(() => {
                            const needsActual = filteredTransactions.filter(t => t.type === 'expense' && allCategories.find(c => c.id === t.categoryId)?.budgetType === 'need').reduce((acc, t) => acc + t.amount, 0);
                            const wantsActual = filteredTransactions.filter(t => t.type === 'expense' && allCategories.find(c => c.id === t.categoryId)?.budgetType === 'want').reduce((acc, t) => acc + t.amount, 0);
                            const savingsActual = filteredTransactions.filter(t => t.type === 'expense' && allCategories.find(c => c.id === t.categoryId)?.budgetType === 'saving').reduce((acc, t) => acc + t.amount, 0);

                            const needsTarget = totalIncome * 0.5;
                            const wantsTarget = totalIncome * 0.3;
                            const savingsTarget = totalIncome * 0.2;

                            return (
                              <div className="space-y-6">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-text-secondary">Necesidades (50%)</span>
                                    <span className={cn("text-xs font-bold", needsActual > needsTarget ? "text-red-accent" : "text-green-accent")}>
                                      {needsActual > needsTarget ? 'Excedido' : 'En control'}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-surface-2 rounded-xl border border-border">
                                      <p className="text-[10px] text-text-dim uppercase font-bold">Objetivo</p>
                                      <p className="text-sm font-bold">{formatCurrency(needsTarget)}</p>
                                    </div>
                                    <div className="p-3 bg-surface-2 rounded-xl border border-border">
                                      <p className="text-[10px] text-text-dim uppercase font-bold">Gastado</p>
                                      <p className="text-sm font-bold">{formatCurrency(needsActual)}</p>
                                    </div>
                                  </div>
                                  <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (needsActual / (needsTarget || 1)) * 100)}%` }} className={cn("h-full transition-all", needsActual > needsTarget && totalIncome > 0 ? "bg-red-accent" : "bg-blue-accent")} />
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-text-secondary">Deseos (30%)</span>
                                    <span className={cn("text-xs font-bold", wantsActual > wantsTarget ? "text-red-accent" : "text-green-accent")}>
                                      {wantsActual > wantsTarget ? 'Excedido' : 'En control'}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-surface-2 rounded-xl border border-border">
                                      <p className="text-[10px] text-text-dim uppercase font-bold">Objetivo</p>
                                      <p className="text-sm font-bold">{formatCurrency(wantsTarget)}</p>
                                    </div>
                                    <div className="p-3 bg-surface-2 rounded-xl border border-border">
                                      <p className="text-[10px] text-text-dim uppercase font-bold">Gastado</p>
                                      <p className="text-sm font-bold">{formatCurrency(wantsActual)}</p>
                                    </div>
                                  </div>
                                  <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (wantsActual / (wantsTarget || 1)) * 100)}%` }} className={cn("h-full transition-all", wantsActual > wantsTarget && totalIncome > 0 ? "bg-red-accent" : "bg-orange-primary")} />
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-text-secondary">Ahorro (20%)</span>
                                    <span className={cn("text-xs font-bold", savingsActual > savingsTarget ? "text-red-accent" : "text-green-accent")}>
                                      {savingsActual > savingsTarget ? 'Excedido' : 'En control'}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-surface-2 rounded-xl border border-border">
                                      <p className="text-[10px] text-text-dim uppercase font-bold">Objetivo</p>
                                      <p className="text-sm font-bold">{formatCurrency(savingsTarget)}</p>
                                    </div>
                                    <div className="p-3 bg-surface-2 rounded-xl border border-border">
                                      <p className="text-[10px] text-text-dim uppercase font-bold">Gastado</p>
                                      <p className="text-sm font-bold">{formatCurrency(savingsActual)}</p>
                                    </div>
                                  </div>
                                  <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (savingsActual / (savingsTarget || 1)) * 100)}%` }} className={cn("h-full transition-all", savingsActual > savingsTarget && totalIncome > 0 ? "bg-red-accent" : "bg-green-accent")} />
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                          <p className="text-[10px] text-text-dim leading-relaxed italic">Comparativa de gastos reales vs objetivos basados en tus ingresos.</p>
                        </div>
                      </div>

                      <div className="bg-surface-2 border border-border rounded-2xl p-6 relative overflow-hidden">
                        <h3 className="font-bold flex items-center gap-2 mb-4"><Sparkles size={18} className="text-orange-primary" /> Sugerencias IA</h3>
                        <div className="space-y-4">
                          {isLoadingSuggestions ? <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-20 bg-surface-3 animate-pulse rounded-xl"></div>)}</div> : suggestions.map((s, i) => (
                            <div key={i} className="p-4 bg-surface-3 rounded-xl border border-border hover:border-orange-primary/30 transition-all group cursor-default">
                              <div className="flex items-start gap-3">
                                <div className={cn("p-2 rounded-lg shrink-0", s.type === 'saving' ? "bg-green-accent/10 text-green-accent" : s.type === 'warning' ? "bg-red-accent/10 text-red-accent" : "bg-blue-accent/10 text-blue-accent")}>
                                  {s.type === 'saving' ? <TrendingUp size={16} /> : s.type === 'warning' ? <AlertCircle size={16} /> : <Lightbulb size={16} />}
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold group-hover:text-orange-primary transition-colors">{s.title}</h4>
                                  <p className="text-xs text-text-secondary mt-1 leading-relaxed">{s.content}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-surface border border-border rounded-2xl p-6">
                        <h3 className="font-bold flex items-center gap-2 mb-6"><PieChart size={18} className="text-orange-primary" /> Mis Cuentas</h3>
                        <div className="space-y-3">
                          {accounts.map(a => (
                            <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-2 border border-border">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg" style={{ backgroundColor: `${a.color}15`, color: a.color }}>
                                  {(() => {
                                    const type = ACCOUNT_TYPES.find(at => at.id === a.type);
                                    const Icon = type?.icon || Wallet;
                                    return <Icon size={16} />;
                                  })()}
                                </div>
                                <div>
                                  <p className="text-xs font-bold">{a.name}</p>
                                  <p className="text-[10px] text-text-dim">{a.lastDigits ? `**** ${a.lastDigits}` : 'Efectivo'}</p>
                                </div>
                              </div>
                              <p className="text-xs font-bold">{formatCurrency(a.balance)}</p>
                            </div>
                          ))}
                          <button onClick={() => { setModalType('account'); setIsModalOpen(true); }} className="w-full py-2 border border-dashed border-border rounded-xl text-[10px] font-bold uppercase tracking-widest text-text-dim hover:text-orange-primary hover:border-orange-primary/50 transition-all">+ Agregar Cuenta</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeView === 'transactions' && (
                <motion.div key="transactions" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div><h2 className="text-3xl font-display font-bold">Historial</h2><p className="text-text-secondary hidden sm:block">Gestiona todos tus movimientos financieros.</p></div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setIsFilterSidebarOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border border-border hover:bg-surface-2 transition-all"><Filter size={18} /> <span className="hidden sm:inline">Filtrar</span></button>
                      <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border border-border hover:bg-surface-2 transition-all"><Download size={18} /> <span className="hidden sm:inline">Exportar</span></button>
                    </div>
                  </div>
                    <div className="bg-surface border border-border rounded-2xl overflow-hidden divide-y divide-border">
                      {filteredTransactions.map((t) => (
                        <TransactionItem 
                          key={t.id} 
                          transaction={t} 
                          accounts={accounts} 
                          categories={allCategories} 
                          onClick={() => setSelectedTransactionDetails(t)}
                        />
                      ))}
                    </div>
                </motion.div>
              )}

              {activeView === 'accounts' && (
                <motion.div key="accounts" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div><h2 className="text-3xl font-display font-bold">Mis Cuentas</h2><p className="text-text-secondary hidden sm:block">Gestiona tus tarjetas, bancos y efectivo.</p></div>
                    <button onClick={() => { setModalType('account'); setIsModalOpen(true); }} className="bg-orange-primary text-white p-2 sm:px-4 sm:py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-orange-primary/20"><Plus size={18} /> <span className="hidden sm:inline">Nueva Cuenta</span></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {accounts.map(a => (
                      <div key={a.id} className="bg-surface border border-border rounded-2xl p-6 space-y-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity" style={{ color: a.color }}>
                          {(() => {
                            const type = ACCOUNT_TYPES.find(at => at.id === a.type);
                            const Icon = type?.icon || Wallet;
                            return <Icon size={80} />;
                          })()}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="p-3 rounded-xl" style={{ backgroundColor: `${a.color}15`, color: a.color }}>
                            {(() => {
                              const type = ACCOUNT_TYPES.find(at => at.id === a.type);
                              const Icon = type?.icon || Wallet;
                              return <Icon size={24} />;
                            })()}
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="p-2 text-text-dim hover:text-text-primary transition-colors"><Settings size={16} /></button>
                            <button onClick={async () => { if(confirm('¿Eliminar cuenta?')) await deleteDoc(doc(db, 'users', user.uid, 'accounts', a.id)); }} className="p-2 text-text-dim hover:text-red-accent transition-colors"><X size={16} /></button>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">{a.name}</p>
                          <h4 className="text-3xl font-display font-bold mt-1">{formatCurrency(a.balance)}</h4>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-border">
                          <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest">{a.type}</span>
                          {a.lastDigits && <span className="text-[10px] font-mono text-text-secondary">**** {a.lastDigits}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeView === 'recurring' && (
                <motion.div key="recurring" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div><h2 className="text-3xl font-display font-bold">Programados</h2><p className="text-text-secondary hidden sm:block">Automatiza tus ingresos y gastos recurrentes.</p></div>
                    <button onClick={() => { setModalType('transaction'); setEditingTransaction(null); setIsModalOpen(true); }} className="bg-orange-primary text-white p-2 sm:px-4 sm:py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-orange-primary/20 transition-all active:scale-95"><Plus size={18} /> <span className="hidden sm:inline">Nueva Programación</span></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {recurring.map(r => {
                      const cat = allCategories.find(c => c.id === r.categoryId) || allCategories[allCategories.length - 1];
                      const Icon = IconMap[cat.icon] || MoreHorizontal;
                      return (
                        <div key={r.id} className="bg-surface border border-border rounded-2xl p-6 flex flex-col justify-between">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${cat.color}15`, color: cat.color }}><Icon size={24} /></div>
                              <div>
                                <h4 className="font-bold">{r.description}</h4>
                                <p className="text-xs text-text-secondary capitalize">{r.frequency} • {formatCurrency(r.amount)}</p>
                              </div>
                            </div>
                            <div className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest", r.isActive ? "bg-green-accent/10 text-green-accent" : "bg-text-dim/10 text-text-dim")}>{r.isActive ? 'Activo' : 'Pausado'}</div>
                          </div>
                          <div className="flex items-center justify-between pt-4 border-t border-border">
                            <div className="text-[10px] text-text-dim">Próximo: {format(parseISO(r.nextOccurrence), 'dd MMM yyyy', { locale: es })}</div>
                            <div className="flex items-center gap-2">
                              <button className="p-2 text-text-dim hover:text-text-primary transition-colors"><Settings size={16} /></button>
                              <button onClick={async () => { if(confirm('¿Eliminar?')) await deleteDoc(doc(db, 'users', user.uid, 'recurring', r.id)); }} className="p-2 text-text-dim hover:text-red-accent transition-colors"><X size={16} /></button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

                {activeView === 'goals' && (
                  <motion.div key="goals" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <GoalsView 
                      goals={goals} 
                      automations={automations} 
                      onAddGoal={() => { setModalType('goal'); setIsModalOpen(true); }} 
                      onAddAutomation={() => { setModalType('automation'); setIsModalOpen(true); }} 
                      onDeleteGoal={handleDeleteGoal} 
                      onDeleteAutomation={handleDeleteAutomation}
                      onAddFunds={(goal: any) => { setSelectedGoal(goal); setModalType('addFunds'); setIsModalOpen(true); }}
                      onSelectGoal={(goal: any) => { setSelectedGoalDetails(goal); setIsGoalSidebarOpen(true); }}
                      categories={allCategories}
                    />
                  </motion.div>
                )}

              {activeView === 'categories' && (
                  <motion.div key="categories" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div><h2 className="text-3xl font-display font-bold">Categorías</h2><p className="text-text-secondary hidden sm:block">Gestiona tus categorías y establece límites de presupuesto.</p></div>
                      <button onClick={() => { setModalType('category'); setIsModalOpen(true); }} className="bg-orange-primary text-white p-2 sm:px-4 sm:py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-orange-primary/20"><Plus size={18} /> <span className="hidden sm:inline">Nueva Categoría</span></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {allCategories.map(c => {
                        const Icon = IconMap[c.icon] || Tag;
                        const isCustom = customCategories.some(cc => cc.id === c.id);
                        const spent = transactions.filter(t => t.categoryId === c.id && t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
                        const progress = c.budgetLimit ? (spent / c.budgetLimit) * 100 : 0;

                        return (
                          <div key={c.id} className="bg-surface border border-border rounded-2xl p-6 space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${c.color}15`, color: c.color }}><Icon size={20} /></div>
                                <div>
                                  <h4 className="font-bold text-sm">{c.name}</h4>
                                  <span className="text-[10px] uppercase tracking-widest text-text-dim font-bold">{c.budgetType || 'Sin tipo'}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => handleDeleteCategory(c.id)} className="p-2 text-text-dim hover:text-red-accent transition-colors"><Trash2 size={16} /></button>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-text-secondary">Gastado: <span className="font-bold text-text-primary">{formatCurrency(spent)}</span></span>
                                {c.budgetLimit && <span className="text-text-dim">Límite: {formatCurrency(c.budgetLimit)}</span>}
                              </div>
                              {c.budgetLimit && (
                                <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                                  <div className={cn("h-full transition-all", progress > 100 ? "bg-red-accent" : progress > 80 ? "bg-orange-primary" : "bg-green-accent")} style={{ width: `${Math.min(100, progress)}%` }} />
                                </div>
                              )}
                            </div>

                            <div className="pt-4 border-t border-border grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-text-dim">Límite</label>
                                <input 
                                  type="number" 
                                  placeholder="Sin límite"
                                  defaultValue={c.budgetLimit}
                                  onBlur={(e) => handleUpdateCategory(c.id, { budgetLimit: Number(e.target.value) || undefined })}
                                  className="w-full bg-surface-2 border border-border rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-orange-primary/50"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-text-dim">Tipo</label>
                                <select 
                                  defaultValue={c.budgetType}
                                  onChange={(e) => handleUpdateCategory(c.id, { budgetType: e.target.value as any })}
                                  className="w-full bg-surface-2 border border-border rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-orange-primary/50 appearance-none"
                                >
                                  <option value="">Seleccionar</option>
                                  <option value="need">Necesidad</option>
                                  <option value="want">Deseo</option>
                                  <option value="saving">Ahorro</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
                {activeView === 'settings' && (
                  <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <div><h2 className="text-3xl font-display font-bold">Configuración</h2><p className="text-text-secondary">Personaliza tu experiencia en Hera.</p></div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-surface border border-border rounded-2xl p-6 space-y-6">
                      <h3 className="font-bold flex items-center gap-2"><Settings size={18} className="text-orange-primary" /> Preferencias</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-surface-2 rounded-xl border border-border">
                          <div>
                            <p className="text-sm font-bold hidden sm:block">Tema de la aplicación</p>
                            <p className="text-sm font-bold sm:hidden">Tema</p>
                            <p className="text-[10px] text-text-secondary">Cambia entre modo claro y oscuro</p>
                          </div>
                          <button 
                            onClick={toggleTheme}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-3 border border-border hover:border-orange-primary/50 transition-all"
                          >
                            {theme === 'dark' ? <Sun size={16} className="text-orange-primary" /> : <Moon size={16} className="text-blue-accent" />}
                            <span className="text-xs font-bold hidden sm:inline">{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
                            <span className="text-xs font-bold sm:hidden">{theme === 'dark' ? 'Claro' : 'Oscuro'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-surface border border-border rounded-2xl p-6 space-y-6">
                      <h3 className="font-bold flex items-center gap-2"><Lightbulb size={18} className="text-orange-primary" /> Productividad</h3>
                      <div className="space-y-4">
                        <div className="p-4 bg-surface-2 rounded-xl border border-border space-y-2">
                          <p className="text-xs font-bold text-orange-primary uppercase tracking-widest">Consejo de Uso</p>
                          <p className="text-sm leading-relaxed">Usa la barra de búsqueda para encontrar rápidamente transacciones por nombre, categoría o cuenta. ¡Incluso puedes buscar por monto!</p>
                        </div>
                        <div className="p-4 bg-surface-2 rounded-xl border border-border space-y-2">
                          <p className="text-xs font-bold text-blue-accent uppercase tracking-widest">Atajos</p>
                          <p className="text-sm leading-relaxed">Toca cualquier transacción para ver sus detalles y acceder rápidamente a las opciones de edición o eliminación.</p>
                        </div>
                        <div className="p-4 bg-surface-2 rounded-xl border border-border space-y-2">
                          <p className="text-xs font-bold text-green-accent uppercase tracking-widest">Presupuestos</p>
                          <p className="text-sm leading-relaxed">Establece límites en tus categorías para que Hera te avise cuando estés cerca de superarlos.</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-surface border border-border rounded-2xl p-6 space-y-6">
                      <h3 className="font-bold flex items-center gap-2"><UserIcon size={18} className="text-orange-primary" /> Perfil</h3>
                      <div className="flex items-center gap-4 p-4 bg-surface-2 rounded-xl border border-border">
                        <img src={user.photoURL || ''} className="w-16 h-16 rounded-full border-2 border-orange-primary/20" alt="Profile" />
                        <div>
                          <p className="font-bold text-lg">{user.displayName}</p>
                          <p className="text-sm text-text-secondary">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </main>

        {/* Modals */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                className={cn(
                  "relative w-full bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden transition-all duration-300",
                  (modalType === 'goal' || modalType === 'automation') ? "max-w-2xl" : "max-w-lg"
                )}
              >
                <div className="p-6 border-b border-border flex items-center justify-between bg-sidebar/50">
                  <h3 className="font-display font-bold text-xl">
                    {modalType === 'transaction' ? (editingTransaction ? 'Editar Registro' : 'Nuevo Registro') : 
                     modalType === 'account' ? 'Nueva Cuenta' : 
                     modalType === 'category' ? 'Nueva Categoría' :
                     modalType === 'goal' ? 'Nuevo Objetivo Financiero' : 'Nueva Automatización'}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 text-text-dim hover:text-text-primary transition-colors"><X size={20} /></button>
                </div>
                
                {modalType === 'transaction' ? (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    handleAddTransaction({
                      type: fd.get('type'),
                      amount: Number(fd.get('amount')),
                      accountId: fd.get('accountId'),
                      categoryId: fd.get('categoryId'),
                      description: fd.get('description'),
                      date: new Date(fd.get('date') as string).toISOString(),
                      isRecurring: fd.get('isRecurring') === 'on',
                      frequency: fd.get('frequency'),
                      notify: fd.get('notify') === 'true'
                    });
                  }} className="p-4 space-y-4">
                    <div className="flex p-1 bg-surface-2 rounded-xl border border-border">
                      <label className="flex-1 cursor-pointer"><input type="radio" name="type" value="expense" defaultChecked={editingTransaction?.type !== 'income'} className="sr-only peer" /><div className="py-2 text-center rounded-lg text-sm font-bold transition-all peer-checked:bg-red-accent peer-checked:text-white text-text-secondary">Gasto</div></label>
                      <label className="flex-1 cursor-pointer"><input type="radio" name="type" value="income" defaultChecked={editingTransaction?.type === 'income'} className="sr-only peer" /><div className="py-2 text-center rounded-lg text-sm font-bold transition-all peer-checked:bg-green-accent peer-checked:text-white text-text-secondary">Ingreso</div></label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5"><label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Monto</label><div className="relative"><DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={14} /><input required name="amount" type="number" step="0.01" defaultValue={editingTransaction?.amount || 0} className="w-full bg-surface-2 border border-border rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-orange-primary/50" /></div></div>
                      <div className="space-y-1.5"><label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Fecha</label><div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={14} /><input required name="date" type="date" defaultValue={editingTransaction ? format(parseISO(editingTransaction.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')} className="w-full bg-surface-2 border border-border rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-orange-primary/50" /></div></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5"><label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Cuenta</label><select required name="accountId" defaultValue={editingTransaction?.accountId} className="w-full bg-surface-2 border border-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-orange-primary/50 appearance-none">{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
                      <div className="space-y-1.5"><label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Categoría</label><CategorySelect name="categoryId" defaultValue={editingTransaction?.categoryId} categories={allCategories} /></div>
                    </div>
                    <div className="space-y-1.5"><label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Descripción (Opcional)</label><textarea name="description" defaultValue={editingTransaction?.description} className="w-full bg-surface-2 border border-border rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:border-orange-primary/50 min-h-[40px] resize-none" /></div>
                    
                    {!editingTransaction && (
                      <div className="space-y-3 p-4 bg-surface-2 rounded-xl border border-border relative overflow-hidden">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            name="isRecurring" 
                            checked={isRecurringChecked}
                            onChange={(e) => setIsRecurringChecked(e.target.checked)}
                            className="w-4 h-4 rounded border-border text-orange-primary focus:ring-orange-primary transition-all" 
                          />
                          <span className="text-xs font-bold group-hover:text-orange-primary transition-colors">¿Convertir en recurrente?</span>
                        </label>
                        {isRecurringChecked && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="grid grid-cols-2 gap-3 pt-1 overflow-hidden">
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-text-dim">Frecuencia</label>
                              <select name="frequency" className="w-full bg-surface border border-border rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-orange-primary/50 appearance-none">
                                <option value="daily">Diario</option>
                                <option value="weekly">Semanal</option>
                                <option value="monthly">Mensual</option>
                                <option value="yearly">Anual</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-text-dim">Aviso</label>
                              <select name="notify" className="w-full bg-surface border border-border rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-orange-primary/50 appearance-none">
                                <option value="true">Sí</option>
                                <option value="false">No</option>
                              </select>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}
                    <div className="pt-2 flex gap-3"><button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-border hover:bg-surface-2 transition-all">Cancelar</button><button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-orange-primary text-white hover:bg-orange-secondary shadow-lg shadow-orange-primary/20 transition-all active:scale-95">{editingTransaction ? 'Guardar' : 'Registrar'}</button></div>
                  </form>
                ) : modalType === 'account' ? (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    handleAddAccount({
                      name: fd.get('name'),
                      type: fd.get('type'),
                      balance: Number(fd.get('balance')),
                      color: fd.get('color'),
                      lastDigits: fd.get('lastDigits'),
                    });
                  }} className="p-6 space-y-6">
                    <div className="space-y-1.5"><label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Nombre de la Cuenta</label><input required name="name" placeholder="ej. Mi Visa, Efectivo Ahorros..." className="w-full bg-surface-2 border border-border rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-orange-primary/50" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5"><label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Tipo</label><select name="type" className="w-full bg-surface-2 border border-border rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-orange-primary/50">{ACCOUNT_TYPES.map(at => <option key={at.id} value={at.id}>{at.name}</option>)}</select></div>
                      <div className="space-y-1.5"><label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Saldo Inicial</label><input required name="balance" type="number" step="0.01" defaultValue={0} placeholder="0.00" className="w-full bg-surface-2 border border-border rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-orange-primary/50" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5"><label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Últimos 4 dígitos</label><input name="lastDigits" maxLength={4} placeholder="Opcional" className="w-full bg-surface-2 border border-border rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-orange-primary/50" /></div>
                      <div className="space-y-1.5"><label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Color</label><input name="color" type="color" defaultValue="#FF5C1A" className="w-full h-10 bg-surface-2 border border-border rounded-lg p-1 focus:outline-none" /></div>
                    </div>
                    <div className="space-y-1.5"><label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Descripción (Opcional)</label><textarea name="description" className="w-full bg-surface-2 border border-border rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:border-orange-primary/50 min-h-[40px] resize-none" /></div>
                    <div className="pt-4 flex gap-3"><button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl text-sm font-bold border border-border hover:bg-surface-2 transition-all">Cancelar</button><button type="submit" className="flex-1 py-3 rounded-xl text-sm font-bold bg-orange-primary text-white hover:bg-orange-secondary shadow-lg shadow-orange-primary/20 transition-all active:scale-95">Crear Cuenta</button></div>
                  </form>
                ) : modalType === 'category' ? (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    handleAddCategory({
                      name: fd.get('name'),
                      icon: fd.get('icon'),
                      color: fd.get('color'),
                      budgetType: fd.get('budgetType'),
                      budgetLimit: Number(fd.get('budgetLimit')) || undefined,
                    });
                  }} className="p-6 space-y-6">
                    <div className="space-y-1.5"><label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Nombre de la Categoría</label><input required name="name" placeholder="ej. Gimnasio, Mascotas..." className="w-full bg-surface-2 border border-border rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-orange-primary/50" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Tipo de Presupuesto</label>
                        <select name="budgetType" className="w-full bg-surface-2 border border-border rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-orange-primary/50 appearance-none">
                          <option value="">Ninguno</option>
                          <option value="need">Necesidad</option>
                          <option value="want">Deseo</option>
                          <option value="saving">Ahorro</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Límite Mensual</label>
                        <input name="budgetLimit" type="number" placeholder="0.00" className="w-full bg-surface-2 border border-border rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-orange-primary/50" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Icono</label>
                      <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-2 bg-surface-2 border border-border rounded-xl custom-scrollbar">
                        {Object.keys(IconMap).map(iconName => {
                          const Icon = IconMap[iconName];
                          return (
                            <label key={iconName} className="cursor-pointer group">
                              <input type="radio" name="icon" value={iconName} defaultChecked={iconName === 'Wallet'} className="sr-only peer" />
                              <div className="aspect-square rounded-lg flex items-center justify-center border border-transparent peer-checked:border-orange-primary peer-checked:bg-orange-primary/10 hover:bg-surface-3 transition-all">
                                <Icon size={18} className="text-text-dim group-hover:text-text-primary peer-checked:text-orange-primary" />
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    <div className="space-y-1.5"><label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Color</label><input name="color" type="color" defaultValue="#A855F7" className="w-full h-10 bg-surface-2 border border-border rounded-lg p-1 focus:outline-none" /></div>
                    <div className="space-y-1.5"><label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Descripción (Opcional)</label><textarea name="description" className="w-full bg-surface-2 border border-border rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:border-orange-primary/50 min-h-[40px] resize-none" /></div>
                    <div className="pt-4 flex gap-3"><button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl text-sm font-bold border border-border hover:bg-surface-2 transition-all">Cancelar</button><button type="submit" className="flex-1 py-3 rounded-xl text-sm font-bold bg-orange-primary text-white hover:bg-orange-secondary shadow-lg shadow-orange-primary/20 transition-all active:scale-95">Crear Categoría</button></div>
                  </form>
                ) : null}

                {modalType === 'goal' && (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const goalData = {
                      name: formData.get('name'),
                      targetAmount: Number(formData.get('targetAmount')),
                      currentAmount: Number(formData.get('currentAmount')) || 0,
                      deadline: formData.get('deadline'),
                      color: formData.get('color'),
                      icon: formData.get('icon')
                    };
                    if (selectedGoal) {
                      handleUpdateGoal(selectedGoal.id, goalData);
                      setIsModalOpen(false);
                      setSelectedGoal(null);
                      showToast('Objetivo actualizado');
                    } else {
                      handleAddGoal(goalData);
                    }
                  }} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Nombre del Objetivo</label>
                        <input name="name" required defaultValue={selectedGoal?.name} placeholder="Ej: Viaje a Japón, Fondo de Emergencia..." className="w-full bg-surface-2 border border-border rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-orange-primary/50" />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Monto Objetivo</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={14} />
                          <input name="targetAmount" type="number" required defaultValue={selectedGoal?.targetAmount} placeholder="0.00" className="w-full bg-surface-2 border border-border rounded-lg py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-orange-primary/50" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Monto Actual</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={14} />
                          <input name="currentAmount" type="number" defaultValue={selectedGoal?.currentAmount || 0} className="w-full bg-surface-2 border border-border rounded-lg py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-orange-primary/50" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Fecha Límite (Opcional)</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={14} />
                          <input name="deadline" type="date" defaultValue={selectedGoal?.deadline ? format(parseISO(selectedGoal.deadline), 'yyyy-MM-dd') : ''} className="w-full bg-surface-2 border border-border rounded-lg py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-orange-primary/50" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Color</label>
                          <input name="color" type="color" defaultValue={selectedGoal?.color || "#FF7A00"} className="w-full h-10 bg-surface-2 border border-border rounded-lg p-1 focus:outline-none cursor-pointer" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Icono</label>
                          <select name="icon" defaultValue={selectedGoal?.icon || 'Target'} className="w-full bg-surface-2 border border-border rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-orange-primary/50 appearance-none">
                            {Object.keys(IconMap).map(icon => <option key={icon} value={icon}>{icon}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 flex gap-3">
                      <button type="button" onClick={() => { setIsModalOpen(false); setSelectedGoal(null); }} className="flex-1 py-3 rounded-xl text-sm font-bold border border-border hover:bg-surface-2 transition-all">Cancelar</button>
                      <button type="submit" className="flex-1 py-3 rounded-xl text-sm font-bold bg-orange-primary text-white hover:bg-orange-secondary shadow-lg shadow-orange-primary/20 transition-all active:scale-95">{selectedGoal ? 'Guardar Cambios' : 'Crear Objetivo'}</button>
                    </div>
                  </form>
                )}

                {modalType === 'automation' && (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    handleAddAutomation({
                      triggerCategoryId: formData.get('triggerCategoryId'),
                      targetGoalId: formData.get('targetGoalId'),
                      type: formData.get('type'),
                      value: Number(formData.get('value'))
                    });
                  }} className="p-6 space-y-6">
                    <div className="space-y-4">
                      <div className="p-4 bg-orange-primary/5 border border-orange-primary/20 rounded-xl flex gap-3">
                        <Sparkles className="text-orange-primary shrink-0" size={20} />
                        <p className="text-xs leading-relaxed text-text-secondary">Las automatizaciones se activan cuando registras un **Ingreso** en la categoría seleccionada.</p>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Si recibo un ingreso en...</label>
                        <select name="triggerCategoryId" required className="w-full bg-surface-2 border border-border rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-orange-primary/50">
                          {allCategories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Aumentar el objetivo...</label>
                        <select name="targetGoalId" required className="w-full bg-surface-2 border border-border rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-orange-primary/50">
                          {goals.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Tipo de Aumento</label>
                          <select name="type" className="w-full bg-surface-2 border border-border rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-orange-primary/50">
                            <option value="percentage">Porcentaje (%)</option>
                            <option value="fixed">Monto Fijo ($)</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Valor</label>
                          <input name="value" type="number" step="0.01" required placeholder="Ej: 10" className="w-full bg-surface-2 border border-border rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-orange-primary/50" />
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 flex gap-3">
                      <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl text-sm font-bold border border-border hover:bg-surface-2 transition-all">Cancelar</button>
                      <button type="submit" className="flex-1 py-3 rounded-xl text-sm font-bold bg-orange-primary text-white hover:bg-orange-secondary shadow-lg shadow-orange-primary/20 transition-all active:scale-95">Activar Automatización</button>
                    </div>
                  </form>
                )}
                {modalType === 'addFunds' && selectedGoal && (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    handleAddFundsToGoal(selectedGoal.id, Number(formData.get('amount')));
                  }} className="p-6 space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 bg-surface-2 rounded-2xl border border-border">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${selectedGoal.color}15`, color: selectedGoal.color }}>
                          {React.createElement(IconMap[selectedGoal.icon] || Target, { size: 24 })}
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Añadir fondos a</p>
                          <h4 className="font-bold">{selectedGoal.name}</h4>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Monto a depositar</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={16} />
                          <input name="amount" type="number" step="0.01" required autoFocus placeholder="0.00" className="w-full bg-surface-2 border border-border rounded-lg py-3 pl-10 pr-4 text-lg font-bold focus:outline-none focus:border-orange-primary/50" />
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 flex gap-3">
                      <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl text-sm font-bold border border-border hover:bg-surface-2 transition-all">Cancelar</button>
                      <button type="submit" className="flex-1 py-3 rounded-xl text-sm font-bold bg-orange-primary text-white hover:bg-orange-secondary shadow-lg shadow-orange-primary/20 transition-all active:scale-95">Confirmar Depósito</button>
                    </div>
                  </form>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Bottom Nav - Mobile Only */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-sidebar border-t border-border flex items-center justify-around px-2 py-3 z-30 backdrop-blur-lg bg-sidebar/90">
          <BottomNavItem icon={<LayoutDashboard size={20} />} active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
          <BottomNavItem icon={<ArrowUpRight size={20} />} active={activeView === 'transactions'} onClick={() => setActiveView('transactions')} />
          <BottomNavItem icon={<Target size={20} />} active={activeView === 'goals'} onClick={() => setActiveView('goals')} />
          <div className="relative -top-6">
            <button 
              onClick={() => { setModalType('transaction'); setEditingTransaction(null); setIsModalOpen(true); }}
              className="w-14 h-14 bg-orange-primary rounded-full flex items-center justify-center text-white shadow-xl shadow-orange-primary/40 border-4 border-bg active:scale-90 transition-transform"
            >
              <Plus size={28} />
            </button>
          </div>
          <BottomNavItem icon={<Repeat size={20} />} active={activeView === 'recurring'} onClick={() => setActiveView('recurring')} />
          <BottomNavItem icon={<Tag size={20} />} active={activeView === 'categories'} onClick={() => setActiveView('categories')} />
          <BottomNavItem icon={<Settings size={20} />} active={activeView === 'settings'} onClick={() => setActiveView('settings')} />
        </nav>

        <FilterSidebar 
          isOpen={isFilterSidebarOpen} 
          onClose={() => setIsFilterSidebarOpen(false)} 
          filters={filters} 
          setFilters={setFilters}
          accounts={accounts}
          categories={allCategories}
        />

        <TransactionDetailsSidebar 
          transaction={selectedTransactionDetails}
          onClose={() => setSelectedTransactionDetails(null)}
          onEdit={() => { setEditingTransaction(selectedTransactionDetails); setModalType('transaction'); setIsModalOpen(true); }}
          onDelete={() => handleDeleteTransaction(selectedTransactionDetails!)}
          accounts={accounts}
          categories={allCategories}
        />

        <GoalDetailsSidebar 
          goal={selectedGoalDetails}
          contributions={goalContributions.filter(c => c.goalId === selectedGoalDetails?.id)}
          onClose={() => { setSelectedGoalDetails(null); setIsGoalSidebarOpen(false); }}
          isOpen={isGoalSidebarOpen}
          onEdit={() => { setSelectedGoal(selectedGoalDetails); setModalType('goal'); setIsModalOpen(true); }}
          onDelete={() => { handleDeleteGoal(selectedGoalDetails!.id); setSelectedGoalDetails(null); setIsGoalSidebarOpen(false); }}
        />

        <Toast />
      </div>
  );
}

// --- Subcomponents ---

function BottomNavItem({ icon, active, onClick }: { icon: React.ReactNode, active?: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("p-2 rounded-xl transition-all relative", active ? "text-orange-primary" : "text-text-dim")}>
      {active && <motion.div layoutId="bottom-nav-active" className="absolute -top-3 left-1/2 -translate-x-1/2 w-1 h-1 bg-orange-primary rounded-full" />}
      {icon}
    </button>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group relative", active ? "bg-orange-primary/10 text-orange-primary" : "text-text-secondary hover:bg-surface-2 hover:text-text-primary")}>
      {active && <motion.div layoutId="nav-active" className="absolute left-0 w-1 h-6 bg-orange-primary rounded-r-full" />}
      <span className={cn("transition-transform group-hover:scale-110", active ? "text-orange-primary" : "text-text-dim group-hover:text-text-primary")}>{icon}</span>
      {label}
    </button>
  );
}

function KPICard({ title, value, trend, color, icon }: { title: string, value: string, trend: 'up' | 'down', color: string, icon: React.ReactNode }) {
  const colors: any = { green: 'text-green-accent', red: 'text-red-accent', blue: 'text-blue-accent', orange: 'text-orange-primary' };
  const bgColors: any = { green: 'bg-green-accent/10', red: 'bg-red-accent/10', blue: 'bg-blue-accent/10', orange: 'bg-orange-primary/10' };
  return (
    <div className="bg-surface border border-border rounded-2xl p-6 relative overflow-hidden group hover:border-border-2 transition-all">
      <div className={cn("absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity", colors[color])}>{icon}</div>
      <p className="text-[10px] uppercase font-bold tracking-widest text-text-dim mb-2">{title}</p>
      <div className="flex items-end justify-between">
        <h4 className="text-2xl font-display font-bold">{value}</h4>
        <div className={cn("flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full", bgColors[color], colors[color])}>
          {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          12.5%
        </div>
      </div>
    </div>
  );
}

const GoalCard = ({ goal, onDelete, onAddFunds, onClick }: any) => {
  const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
  const Icon = IconMap[goal.icon] || Target;

  return (
    <div 
      onClick={onClick}
      className="bg-surface border border-border rounded-2xl p-6 space-y-4 group hover:border-orange-primary/30 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${goal.color}15`, color: goal.color }}>
            <Icon size={24} />
          </div>
          <div>
            <h4 className="font-bold">{goal.name}</h4>
            <p className="text-xs text-text-dim">Meta: {formatCurrency(goal.targetAmount)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 hover:bg-surface-2 rounded-lg text-text-dim hover:text-red-accent transition-colors"><Trash2 size={14} /></button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-text-secondary">{formatCurrency(goal.currentAmount)}</span>
          <span className="text-text-dim">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }} 
            animate={{ width: `${progress}%` }} 
            className="h-full transition-all"
            style={{ backgroundColor: goal.color }}
          />
        </div>
      </div>

      <div className="pt-2">
        <button 
          onClick={(e) => { e.stopPropagation(); onAddFunds(); }}
          className="w-full py-2 bg-surface-2 hover:bg-orange-primary hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-border hover:border-orange-primary"
        >
          Añadir Fondos
        </button>
      </div>
    </div>
  );
};

const GoalsView = ({ goals, automations, onAddGoal, onAddAutomation, onDeleteGoal, onDeleteAutomation, onAddFunds, onSelectGoal, categories }: any) => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl lg:text-3xl font-display font-bold">Objetivos Financieros</h2>
          <p className="text-text-secondary text-sm lg:text-base hidden sm:block">Ahorra para lo que más importa.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onAddAutomation}
            className="flex items-center gap-2 p-2 sm:px-4 sm:py-2 bg-surface border border-border rounded-xl text-sm font-bold hover:bg-surface-2 transition-all"
          >
            <Repeat size={18} className="text-orange-primary" />
            <span className="hidden sm:inline">Automatizar</span>
          </button>
          <button 
            onClick={onAddGoal}
            className="flex items-center gap-2 p-2 sm:px-4 sm:py-2 bg-orange-primary text-white rounded-xl text-sm font-bold hover:bg-orange-secondary transition-all shadow-lg shadow-orange-primary/20"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Nuevo Objetivo</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((g: any) => (
          <GoalCard 
            key={g.id} 
            goal={g} 
            onDelete={() => onDeleteGoal(g.id)} 
            onAddFunds={() => onAddFunds(g)} 
            onClick={() => onSelectGoal(g)}
          />
        ))}
        {goals.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-4 bg-surface border border-dashed border-border rounded-3xl">
            <div className="w-16 h-16 bg-surface-2 rounded-full flex items-center justify-center mx-auto">
              <Target size={32} className="text-text-dim" />
            </div>
            <div>
              <p className="font-bold">No tienes objetivos aún</p>
              <p className="text-sm text-text-dim">Crea tu primer objetivo de ahorro hoy mismo.</p>
            </div>
            <button onClick={onAddGoal} className="text-orange-primary font-bold hover:underline">Comenzar ahora</button>
          </div>
        )}
      </div>

      {automations.length > 0 && (
        <div className="space-y-6">
          <h3 className="font-bold flex items-center gap-2"><Repeat size={18} className="text-orange-primary" /> Automatizaciones Activas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {automations.map((a: any) => {
              const goal = goals.find((g: any) => g.id === a.targetGoalId);
              const cat = categories.find((c: any) => c.id === a.triggerCategoryId);
              return (
                <div key={a.id} className="bg-surface border border-border rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-green-accent/10 text-green-accent rounded-lg">
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold">
                        {a.type === 'percentage' ? `${a.value}% de` : `${formatCurrency(a.value)} de`} {cat?.name || 'Ingresos'}
                      </p>
                      <p className="text-xs text-text-dim">Destinado a: <span className="text-text-primary font-medium">{goal?.name || 'Objetivo'}</span></p>
                    </div>
                  </div>
                  <button onClick={() => onDeleteAutomation(a.id)} className="p-2 text-text-dim hover:text-red-accent transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

function TransactionItem({ transaction, accounts, categories, onClick }: any) {
  const category = categories.find((c: any) => c.id === transaction.categoryId) || categories[categories.length - 1];
  const account = accounts.find((a: any) => a.id === transaction.accountId);
  const Icon = IconMap[category.icon] || MoreHorizontal;

  return (
    <div 
      onClick={onClick}
      className="group flex items-center gap-4 p-4 hover:bg-surface-2 transition-all cursor-pointer"
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${category.color}15`, color: category.color }}><Icon size={20} /></div>
      <div className="flex-1 min-w-0">
        <h5 className="text-sm font-bold truncate group-hover:text-orange-primary transition-colors">{transaction.description}</h5>
        <p className="text-[10px] text-text-dim uppercase tracking-wider font-medium">{category.name} • {account?.name} • {format(parseISO(transaction.date), 'dd MMM yyyy', { locale: es })}</p>
      </div>
      <div className="text-right">
        <div className={cn("text-sm font-bold", transaction.type === 'income' ? "text-green-accent" : "text-text-primary")}>{transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}</div>
      </div>
    </div>
  );
}

function CategorySelect({ name, defaultValue, categories }: { name: string, defaultValue?: string, categories: Category[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(defaultValue || 'others');
  const cat = categories.find(c => c.id === selected) || categories[categories.length - 1];
  const Icon = IconMap[cat.icon] || MoreHorizontal;

  return (
    <div className="relative">
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between bg-surface-2 border border-border rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-orange-primary/50">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: `${cat.color}15`, color: cat.color }}><Icon size={12} /></div>
          <span>{cat.name}</span>
        </div>
        <ChevronDown size={14} className="text-text-dim" />
      </button>
      <input type="hidden" name={name} value={selected} />
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute top-full left-0 right-0 mt-2 bg-surface-3 border border-border rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto p-2 grid grid-cols-1 gap-1">
            {categories.map(c => {
              const CIcon = IconMap[c.icon] || MoreHorizontal;
              return (
                <button key={c.id} type="button" onClick={() => { setSelected(c.id); setIsOpen(false); }} className={cn("flex items-center gap-3 p-2 rounded-lg text-xs font-medium transition-all", selected === c.id ? "bg-orange-primary/10 text-orange-primary" : "hover:bg-surface-2 text-text-secondary")}>
                  <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: `${c.color}15`, color: c.color }}><CIcon size={14} /></div>
                  {c.name}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TransactionDetailsSidebar({ transaction, onClose, onEdit, onDelete, accounts, categories }: any) {
  if (!transaction) return null;
  const category = categories.find((c: any) => c.id === transaction.categoryId) || categories[categories.length - 1];
  const account = accounts.find((a: any) => a.id === transaction.accountId);
  const Icon = IconMap[category.icon] || Tag;

  return (
    <AnimatePresence>
      {transaction && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" 
          />
          <motion.div 
            initial={{ x: '100%' }} 
            animate={{ x: 0 }} 
            exit={{ x: '100%' }} 
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-surface border-l border-border z-[70] shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-border flex items-center justify-between bg-sidebar/50">
              <h3 className="font-display font-bold text-xl">Detalle de Registro</h3>
              <button onClick={onClose} className="p-2 text-text-dim hover:text-text-primary transition-colors"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center shadow-xl" style={{ backgroundColor: `${category.color}15`, color: category.color }}>
                  <Icon size={40} />
                </div>
                <div>
                  <h4 className="text-2xl font-display font-bold">{transaction.description}</h4>
                  <p className="text-text-dim uppercase tracking-widest text-[10px] font-bold mt-1">{category.name}</p>
                </div>
                <div className={cn("text-4xl font-display font-bold", transaction.type === 'income' ? "text-green-accent" : "text-text-primary")}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-surface-2 rounded-2xl border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-primary/10 text-orange-primary flex items-center justify-center"><CreditCard size={20} /></div>
                    <div>
                      <p className="text-[10px] text-text-dim uppercase font-bold">Cuenta</p>
                      <p className="text-sm font-bold">{account?.name}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-surface-2 rounded-2xl border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-primary/10 text-orange-primary flex items-center justify-center"><Calendar size={20} /></div>
                    <div>
                      <p className="text-[10px] text-text-dim uppercase font-bold">Fecha</p>
                      <p className="text-sm font-bold">{format(parseISO(transaction.date), 'dd MMMM yyyy', { locale: es })}</p>
                    </div>
                  </div>
                </div>
                {transaction.isRecurring && (
                  <div className="flex items-center justify-between p-4 bg-surface-2 rounded-2xl border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-primary/10 text-orange-primary flex items-center justify-center"><Repeat size={20} /></div>
                      <div>
                        <p className="text-[10px] text-text-dim uppercase font-bold">Recurrente</p>
                        <p className="text-sm font-bold">Cada {transaction.frequency}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-border bg-sidebar/30 flex gap-3">
              <button 
                onClick={() => { onEdit(); onClose(); }}
                className="flex-1 py-3 rounded-xl text-sm font-bold border border-border hover:bg-surface-2 transition-all flex items-center justify-center gap-2"
              >
                <Settings size={18} /> Editar
              </button>
              <button 
                onClick={() => { onDelete(); onClose(); }}
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-red-accent/10 text-red-accent hover:bg-red-accent hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={18} /> Eliminar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function GoalDetailsSidebar({ goal, contributions, onClose, isOpen, onEdit, onDelete }: any) {
  const [filter, setFilter] = useState<'all' | 'manual' | 'automation'>('all');
  const filteredContributions = contributions
    .filter((c: any) => filter === 'all' || c.source === filter)
    .sort((a: any, b: any) => b.date.localeCompare(a.date));

  const progress = goal ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
  const Icon = goal ? (IconMap[goal.icon] || Target) : Target;

  return (
    <AnimatePresence>
      {isOpen && goal && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" 
          />
          <motion.div 
            initial={{ x: '100%' }} 
            animate={{ x: 0 }} 
            exit={{ x: '100%' }} 
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-surface border-l border-border z-[70] shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-border flex items-center justify-between bg-sidebar/50">
              <h3 className="font-display font-bold text-xl flex items-center gap-2">Detalles del Objetivo</h3>
              <button onClick={onClose} className="p-2 text-text-dim hover:text-text-primary transition-colors"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {/* Header Info */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${goal.color}15`, color: goal.color }}>
                    <Icon size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{goal.name}</h2>
                    <p className="text-sm text-text-dim">Creado el {format(parseISO(goal.createdAt), 'dd MMM yyyy', { locale: es })}</p>
                  </div>
                </div>

                <div className="bg-surface-2 border border-border rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-dim uppercase tracking-widest">Progreso Actual</span>
                    <span className="text-lg font-bold text-orange-primary">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-3 bg-surface rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${progress}%` }} 
                      className="h-full transition-all"
                      style={{ backgroundColor: goal.color }}
                    />
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-text-dim mb-1">Ahorrado</p>
                      <p className="text-xl font-bold">{formatCurrency(goal.currentAmount)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-text-dim mb-1">Meta</p>
                      <p className="text-xl font-bold text-text-secondary">{formatCurrency(goal.targetAmount)}</p>
                    </div>
                  </div>
                  {goal.deadline && (
                    <div className="pt-4 border-t border-border flex items-center gap-2 text-xs text-text-dim">
                      <Calendar size={14} />
                      <span>Fecha límite: {format(parseISO(goal.deadline), 'dd MMM yyyy', { locale: es })}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* History */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm uppercase tracking-widest text-text-dim">Historial de Aportes</h4>
                  <div className="flex bg-surface-2 rounded-lg p-1 border border-border">
                    {(['all', 'manual', 'automation'] as const).map(f => (
                      <button 
                        key={f}
                        onClick={() => setFilter(f)}
                        className={cn("px-2 py-1 text-[10px] font-bold rounded-md transition-all", filter === f ? "bg-orange-primary text-white" : "text-text-dim hover:text-text-primary")}
                      >
                        {f === 'all' ? 'Todo' : f === 'manual' ? 'Manual' : 'Auto'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredContributions.length === 0 ? (
                    <div className="py-8 text-center border-2 border-dashed border-border rounded-2xl">
                      <p className="text-xs text-text-dim">No hay aportes registrados aún.</p>
                    </div>
                  ) : (
                    filteredContributions.map((c: any) => (
                      <div key={c.id} className="bg-surface-2 border border-border rounded-xl p-4 flex items-center justify-between group hover:border-orange-primary/30 transition-all">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", c.source === 'automation' ? "bg-purple-accent/10 text-purple-accent" : "bg-blue-accent/10 text-blue-accent")}>
                            {c.source === 'automation' ? <Repeat size={14} /> : <UserIcon size={14} />}
                          </div>
                          <div>
                            <p className="text-sm font-bold">{formatCurrency(c.amount)}</p>
                            <p className="text-[10px] text-text-dim">{format(parseISO(c.date), 'dd MMM, HH:mm', { locale: es })}</p>
                          </div>
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim">
                          {c.source === 'automation' ? 'Automático' : 'Manual'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border bg-sidebar/30 flex gap-3">
              <button 
                onClick={() => { onEdit(); }}
                className="flex-1 py-3 rounded-xl text-sm font-bold border border-border hover:bg-surface-2 transition-all flex items-center justify-center gap-2"
              >
                <Settings size={18} /> Editar
              </button>
              <button 
                onClick={() => { onDelete(); }}
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-red-accent/10 text-red-accent hover:bg-red-accent hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={18} /> Eliminar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function FilterSidebar({ isOpen, onClose, filters, setFilters, accounts, categories }: any) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" 
          />
          <motion.div 
            initial={{ x: '100%' }} 
            animate={{ x: 0 }} 
            exit={{ x: '100%' }} 
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-surface border-l border-border z-[70] shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-border flex items-center justify-between bg-sidebar/50">
              <h3 className="font-display font-bold text-xl flex items-center gap-2"><Filter size={20} className="text-orange-primary" /> Filtros</h3>
              <button onClick={onClose} className="p-2 text-text-dim hover:text-text-primary transition-colors"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              <div className="space-y-3">
                <label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Rango de Fecha</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['all', 'day', 'week', 'month', 'year'] as const).map(range => (
                    <button 
                      key={range} 
                      onClick={() => setFilters({ ...filters, dateRange: range })}
                      className={cn("px-3 py-2 rounded-xl text-xs font-bold border transition-all", filters.dateRange === range ? "bg-orange-primary border-orange-primary text-white" : "border-border hover:bg-surface-2 text-text-secondary")}
                    >
                      {range === 'all' ? 'Todo' : range === 'day' ? 'Hoy' : range === 'week' ? 'Semana' : range === 'month' ? 'Mes' : 'Año'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Tipo</label>
                <div className="flex gap-2">
                  {(['all', 'income', 'expense'] as const).map(type => (
                    <button 
                      key={type} 
                      onClick={() => setFilters({ ...filters, type })}
                      className={cn("flex-1 px-3 py-2 rounded-xl text-xs font-bold border transition-all", filters.type === type ? "bg-orange-primary border-orange-primary text-white" : "border-border hover:bg-surface-2 text-text-secondary")}
                    >
                      {type === 'all' ? 'Todo' : type === 'income' ? 'Ingreso' : 'Gasto'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Cuenta</label>
                <select 
                  value={filters.accountId} 
                  onChange={(e) => setFilters({ ...filters, accountId: e.target.value })}
                  className="w-full bg-surface-2 border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-orange-primary/50"
                >
                  <option value="all">Todas las cuentas</option>
                  {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Categoría</label>
                <select 
                  value={filters.categoryId} 
                  onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
                  className="w-full bg-surface-2 border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-orange-primary/50"
                >
                  <option value="all">Todas las categorías</option>
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Rango de Monto</label>
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="number" 
                    placeholder="Min" 
                    value={filters.minAmount}
                    onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                    className="w-full bg-surface-2 border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-orange-primary/50"
                  />
                  <input 
                    type="number" 
                    placeholder="Max" 
                    value={filters.maxAmount}
                    onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                    className="w-full bg-surface-2 border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-orange-primary/50"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-border bg-sidebar/30 flex gap-3">
              <button 
                onClick={() => setFilters({ type: 'all', accountId: 'all', categoryId: 'all', minAmount: '', maxAmount: '', dateRange: 'all' })}
                className="flex-1 py-3 rounded-xl text-sm font-bold border border-border hover:bg-surface-2 transition-all"
              >
                Limpiar
              </button>
              <button 
                onClick={onClose}
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-orange-primary text-white hover:bg-orange-secondary shadow-lg shadow-orange-primary/20 transition-all"
              >
                Aplicar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
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
  
  const iconColor = type === 'success' ? 'bg-green-accent/20 text-green-accent' :
                    type === 'error' ? 'bg-red-accent/20 text-red-accent' :
                    type === 'warning' ? 'bg-orange-primary/20 text-orange-primary' :
                    'bg-blue-accent/20 text-blue-accent';

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed top-6 left-0 right-0 flex justify-center z-[100] pointer-events-none px-4">
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }} 
            className="bg-surface-2 border border-border px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[280px] max-w-full pointer-events-auto"
          >
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", iconColor)}>
              <Icon size={16} />
            </div>
            <span className="text-sm font-bold text-text-primary">{message}</span>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function showToast(msg: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') { 
  if ((window as any).showToast) (window as any).showToast(msg, type); 
}

function getChartData(transactions: Transaction[]) {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    return { name: format(d, 'EEE', { locale: es }), date: format(d, 'yyyy-MM-dd'), ingresos: 0, gastos: 0 };
  });
  transactions.forEach(t => {
    const dateStr = format(parseISO(t.date), 'yyyy-MM-dd');
    const day = last7Days.find(d => d.date === dateStr);
    if (day) { if (t.type === 'income') day.ingresos += t.amount; else day.gastos += t.amount; }
  });
  return last7Days;
}

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface border border-border p-3 rounded-xl shadow-2xl backdrop-blur-md">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
            <p className="text-xs font-bold text-text-secondary">{entry.name}:</p>
            <p className="text-sm font-bold text-text-primary">{formatCurrency(entry.value)}</p>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

function CustomPieChart({ data, title, icon: Icon, iconColor }: any) {
  const total = data.reduce((acc: number, curr: any) => acc + curr.value, 0);
  
  return (
    <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col h-full">
      <h3 className="font-bold text-sm mb-6 flex items-center gap-2">
        <Icon size={16} className={iconColor} /> {title}
      </h3>
      <div className="flex-1 flex flex-col lg:flex-row items-center gap-6">
        <div className="h-[180px] w-full lg:w-1/2 relative">
          <ResponsiveContainer width="100%" height="100%">
            <RePieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </RePieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] text-text-dim uppercase font-bold tracking-widest">Total</span>
            <span className="text-lg font-display font-bold">{formatCurrency(total)}</span>
          </div>
        </div>
        <div className="w-full lg:w-1/2 space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar pr-2">
          {data.sort((a: any, b: any) => b.value - a.value).map((item: any, i: number) => (
            <div key={i} className="flex items-center justify-between text-xs group">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-text-secondary truncate group-hover:text-text-primary transition-colors">{item.name}</span>
              </div>
              <span className="font-bold ml-2">{formatCurrency(item.value)}</span>
            </div>
          ))}
          {data.length === 0 && (
            <div className="h-full flex items-center justify-center text-text-dim italic text-[10px]">
              Sin datos
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
