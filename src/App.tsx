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
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfYear, endOfYear, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn, formatCurrency } from './lib/utils';
import { Transaction, TransactionType, Frequency, Category, RecurringTransaction, AISuggestion, Account, UserProfile } from './types';
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

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'dashboard' | 'transactions' | 'accounts' | 'recurring' | 'settings'>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'transaction' | 'account' | 'category'>('transaction');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [notifications, setNotifications] = useState<{id: string, title: string, content: string, date: string, read: boolean}[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const allCategories = useMemo(() => [...CATEGORIES, ...customCategories], [customCategories]);

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

    return () => {
      unsubAccounts();
      unsubTransactions();
      unsubRecurring();
      unsubCategories();
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

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const date = parseISO(t.date);
      let start, end;
      const now = new Date();

      switch (timeRange) {
        case 'day': start = startOfDay(now); end = endOfDay(now); break;
        case 'week': start = startOfWeek(now, { weekStartsOn: 1 }); end = endOfWeek(now, { weekStartsOn: 1 }); break;
        case 'month': start = startOfMonth(now); end = endOfMonth(now); break;
        case 'year': start = startOfYear(now); end = endOfYear(now); break;
        default: return true;
      }
      
      const inRange = isWithinInterval(date, { start, end });
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           allCategories.find(c => c.id === t.categoryId)?.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      return inRange && matchesSearch;
    });
  }, [transactions, timeRange, searchTerm, allCategories]);

  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpenses;
  const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0);

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

  const handleAddTransaction = async (data: any) => {
    if (!user) return;
    try {
      const { isRecurring, frequency, notify, ...txData } = data;
      
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
      
      // Notification
      const newNotif = {
        id: Math.random().toString(36).substr(2, 9),
        title: editingTransaction ? 'Transacción Actualizada' : 'Nueva Transacción',
        content: `${txData.type === 'income' ? 'Ingreso' : 'Gasto'} de ${formatCurrency(txData.amount)} registrado correctamente.`,
        date: new Date().toISOString(),
        read: false
      };
      setNotifications(prev => [newNotif, ...prev]);

      setIsModalOpen(false);
      setEditingTransaction(null);
      showToast(editingTransaction ? 'Transacción actualizada' : 'Transacción registrada');
    } catch (e) {
      console.error(e);
      showToast('Error al procesar la transacción');
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
      
      const newNotif = {
        id: Math.random().toString(36).substr(2, 9),
        title: 'Nueva Cuenta',
        content: `Cuenta "${data.name}" creada con éxito.`,
        date: new Date().toISOString(),
        read: false
      };
      setNotifications(prev => [newNotif, ...prev]);
      
      setIsModalOpen(false);
      showToast('Cuenta agregada');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
      showToast('Error al crear cuenta');
    }
  };

  const handleAddCategory = async (data: any) => {
    if (!user) return;
    const path = `users/${user.uid}/categories`;
    try {
      await addDoc(collection(db, path), { ...data, userId: user.uid });
      
      const newNotif = {
        id: Math.random().toString(36).substr(2, 9),
        title: 'Nueva Categoría',
        content: `Categoría "${data.name}" añadida.`,
        date: new Date().toISOString(),
        read: false
      };
      setNotifications(prev => [newNotif, ...prev]);

      setIsModalOpen(false);
      showToast('Categoría agregada');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
      showToast('Error al crear categoría');
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
          <div className="w-20 h-20 bg-orange-primary mx-auto rounded-3xl flex items-center justify-center shadow-2xl shadow-orange-primary/30">
            <Wallet className="text-white w-10 h-10" />
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
    <div className="flex h-screen bg-bg text-text-primary overflow-hidden font-sans transition-colors duration-300">
        {/* Sidebar */}
        <aside className="w-64 bg-sidebar border-r border-border flex flex-col z-20">
          <div className="p-6 border-b border-border flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-primary rounded-xl flex items-center justify-center shadow-lg shadow-orange-primary/20">
              <Wallet className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl tracking-tight">Hera</h1>
              <span className="text-[10px] uppercase tracking-widest text-orange-secondary font-bold">Smart Finance</span>
            </div>
          </div>

          <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto custom-scrollbar">
            <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
            <NavItem icon={<ArrowUpRight size={20} />} label="Transacciones" active={activeView === 'transactions'} onClick={() => setActiveView('transactions')} />
            <NavItem icon={<CreditCard size={20} />} label="Mis Cuentas" active={activeView === 'accounts'} onClick={() => setActiveView('accounts')} />
            <NavItem icon={<Repeat size={20} />} label="Programados" active={activeView === 'recurring'} onClick={() => setActiveView('recurring')} />
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
        <main className="flex-1 flex flex-col min-w-0 relative">
          <header className="h-16 border-b border-border bg-sidebar/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
            <div className="flex items-center gap-4 flex-1 max-w-xl">
              <div className="relative w-full group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-orange-primary transition-colors" size={16} />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar transacciones, categorías..." 
                  className="w-full bg-surface-2 border border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-orange-primary/50 transition-all"
                />
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
                        className="absolute right-0 mt-2 w-80 bg-surface border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
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

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <AnimatePresence mode="wait">
              {activeView === 'dashboard' && (
                <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                      <h2 className="text-3xl font-display font-bold">Hola, {user.displayName?.split(' ')[0]}</h2>
                      <p className="text-text-secondary mt-1">Aquí tienes un resumen de tus finanzas hoy.</p>
                    </div>
                    <div className="flex items-center gap-2 bg-surface rounded-xl p-1 border border-border">
                      {(['day', 'week', 'month', 'year'] as const).map((range) => (
                        <button key={range} onClick={() => setTimeRange(range)} className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize", timeRange === range ? "bg-orange-primary text-white shadow-md" : "text-text-secondary hover:text-text-primary")}>
                          {range === 'day' ? 'Hoy' : range === 'week' ? 'Semana' : range === 'month' ? 'Mes' : 'Año'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <KPICard title="Saldo Total" value={formatCurrency(totalBalance)} trend="up" color="blue" icon={<Wallet size={24} />} />
                    <KPICard title="Balance Periodo" value={formatCurrency(balance)} trend={balance >= 0 ? 'up' : 'down'} color={balance >= 0 ? 'green' : 'red'} icon={<TrendingUp size={24} />} />
                    <KPICard title="Ingresos" value={formatCurrency(totalIncome)} trend="up" color="green" icon={<ArrowUpRight size={24} />} />
                    <KPICard title="Gastos" value={formatCurrency(totalExpenses)} trend="down" color="red" icon={<ArrowDownLeft size={24} />} />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                      <div className="bg-surface border border-border rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-8">
                          <h3 className="font-bold flex items-center gap-2"><TrendingUp size={18} className="text-orange-primary" /> Flujo de Caja</h3>
                        </div>
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={getChartData(filteredTransactions)}>
                              <defs>
                                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1EE07A" stopOpacity={0.3}/><stop offset="95%" stopColor="#1EE07A" stopOpacity={0}/></linearGradient>
                                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FF4757" stopOpacity={0.3}/><stop offset="95%" stopColor="#FF4757" stopOpacity={0}/></linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#7A7874', fontSize: 10 }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#7A7874', fontSize: 10 }} tickFormatter={(val) => `$${val}`} />
                              <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }} />
                              <Area type="monotone" dataKey="ingresos" stroke="#1EE07A" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                              <Area type="monotone" dataKey="gastos" stroke="#FF4757" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-border flex items-center justify-between">
                          <h3 className="font-bold">Transacciones Recientes</h3>
                          <button onClick={() => setActiveView('transactions')} className="text-xs text-orange-primary font-bold hover:underline">Ver todo</button>
                        </div>
                        <div className="divide-y divide-border">
                          {filteredTransactions.slice(0, 5).map((t) => (
                            <TransactionItem key={t.id} transaction={t} accounts={accounts} categories={allCategories} onEdit={() => { setEditingTransaction(t); setModalType('transaction'); setIsModalOpen(true); }} onDelete={() => handleDeleteTransaction(t)} />
                          ))}
                          {filteredTransactions.length === 0 && <div className="p-12 text-center text-text-dim">No hay movimientos recientes.</div>}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8">
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
                    <div><h2 className="text-3xl font-display font-bold">Historial</h2><p className="text-text-secondary">Gestiona todos tus movimientos financieros.</p></div>
                    <div className="flex items-center gap-3">
                      <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border border-border hover:bg-surface-2 transition-all"><Filter size={18} /> Filtrar</button>
                      <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border border-border hover:bg-surface-2 transition-all"><Download size={18} /> Exportar</button>
                    </div>
                  </div>
                  <div className="bg-surface border border-border rounded-2xl overflow-hidden divide-y divide-border">
                    {filteredTransactions.map((t) => (
                      <TransactionItem key={t.id} transaction={t} accounts={accounts} categories={allCategories} onEdit={() => { setEditingTransaction(t); setModalType('transaction'); setIsModalOpen(true); }} onDelete={() => handleDeleteTransaction(t)} />
                    ))}
                  </div>
                </motion.div>
              )}

              {activeView === 'accounts' && (
                <motion.div key="accounts" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div><h2 className="text-3xl font-display font-bold">Mis Cuentas</h2><p className="text-text-secondary">Gestiona tus tarjetas, bancos y efectivo.</p></div>
                    <button onClick={() => { setModalType('account'); setIsModalOpen(true); }} className="bg-orange-primary text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-orange-primary/20"><Plus size={18} /> Nueva Cuenta</button>
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
                    <div><h2 className="text-3xl font-display font-bold">Programados</h2><p className="text-text-secondary">Automatiza tus ingresos y gastos recurrentes.</p></div>
                    <button onClick={() => { setModalType('transaction'); setEditingTransaction(null); setIsModalOpen(true); }} className="bg-orange-primary text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-orange-primary/20 transition-all active:scale-95"><Plus size={18} /> Nueva Programación</button>
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

              {activeView === 'settings' && (
                <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <div><h2 className="text-3xl font-display font-bold">Configuración</h2><p className="text-text-secondary">Personaliza tu experiencia en Hera.</p></div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-surface border border-border rounded-2xl p-6 space-y-6">
                      <h3 className="font-bold flex items-center gap-2"><Settings size={18} className="text-orange-primary" /> Preferencias</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-surface-2 rounded-xl border border-border">
                          <div>
                            <p className="text-sm font-bold">Tema de la aplicación</p>
                            <p className="text-[10px] text-text-secondary">Cambia entre modo claro y oscuro</p>
                          </div>
                          <button 
                            onClick={toggleTheme}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-3 border border-border hover:border-orange-primary/50 transition-all"
                          >
                            {theme === 'dark' ? <Sun size={16} className="text-orange-primary" /> : <Moon size={16} className="text-blue-accent" />}
                            <span className="text-xs font-bold">{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
                          </button>
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

                    <div className="bg-surface border border-border rounded-2xl p-6 space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold flex items-center gap-2"><ShoppingBag size={18} className="text-orange-primary" /> Mis Categorías</h3>
                        <button onClick={() => { setModalType('category'); setIsModalOpen(true); }} className="text-[10px] font-bold uppercase tracking-widest text-orange-primary hover:text-orange-secondary transition-colors">+ Nueva</button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {allCategories.map(c => {
                          const Icon = IconMap[c.icon] || MoreHorizontal;
                          const isCustom = customCategories.some(cc => cc.id === c.id);
                          return (
                            <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-2 border border-border group">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${c.color}15`, color: c.color }}><Icon size={16} /></div>
                                <span className="text-xs font-medium">{c.name}</span>
                              </div>
                              {isCustom && (
                                <button onClick={async () => { if(confirm('¿Eliminar categoría?')) await deleteDoc(doc(db, 'users', user.uid, 'categories', c.id)); }} className="opacity-0 group-hover:opacity-100 p-1 text-text-dim hover:text-red-accent transition-all"><X size={12} /></button>
                              )}
                            </div>
                          );
                        })}
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
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-border flex items-center justify-between bg-sidebar/50">
                  <h3 className="font-display font-bold text-xl">
                    {modalType === 'transaction' ? (editingTransaction ? 'Editar Registro' : 'Nuevo Registro') : 
                     modalType === 'account' ? 'Nueva Cuenta' : 'Nueva Categoría'}
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
                  }} className="p-6 space-y-6">
                    <div className="flex p-1 bg-surface-2 rounded-xl border border-border">
                      <label className="flex-1 cursor-pointer"><input type="radio" name="type" value="expense" defaultChecked={editingTransaction?.type !== 'income'} className="sr-only peer" /><div className="py-2 text-center rounded-lg text-sm font-bold transition-all peer-checked:bg-red-accent peer-checked:text-white text-text-secondary">Gasto</div></label>
                      <label className="flex-1 cursor-pointer"><input type="radio" name="type" value="income" defaultChecked={editingTransaction?.type === 'income'} className="sr-only peer" /><div className="py-2 text-center rounded-lg text-sm font-bold transition-all peer-checked:bg-green-accent peer-checked:text-white text-text-secondary">Ingreso</div></label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5"><label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Monto</label><div className="relative"><DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={16} /><input required name="amount" type="number" step="0.01" defaultValue={editingTransaction?.amount || 0} className="w-full bg-surface-2 border border-border rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-orange-primary/50" /></div></div>
                      <div className="space-y-1.5"><label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Fecha</label><div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={16} /><input required name="date" type="date" defaultValue={editingTransaction ? format(parseISO(editingTransaction.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')} className="w-full bg-surface-2 border border-border rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-orange-primary/50" /></div></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5"><label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Cuenta</label><select required name="accountId" defaultValue={editingTransaction?.accountId} className="w-full bg-surface-2 border border-border rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-orange-primary/50 appearance-none">{accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance)})</option>)}</select></div>
                      <div className="space-y-1.5"><label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Categoría</label><CategorySelect name="categoryId" defaultValue={editingTransaction?.categoryId} categories={allCategories} /></div>
                    </div>
                    <div className="space-y-1.5"><label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Descripción (Opcional)</label><textarea name="description" defaultValue={editingTransaction?.description} className="w-full bg-surface-2 border border-border rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-orange-primary/50 min-h-[80px] resize-none" /></div>
                    
                    {!editingTransaction && (
                      <div className="space-y-4 p-5 bg-surface-2 rounded-2xl border border-border relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Repeat size={40} className="text-orange-primary" /></div>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input type="checkbox" name="isRecurring" className="w-5 h-5 rounded-lg border-border text-orange-primary focus:ring-orange-primary transition-all" />
                          <span className="text-sm font-bold group-hover:text-orange-primary transition-colors">¿Convertir en movimiento recurrente?</span>
                        </label>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Frecuencia</label>
                            <div className="relative">
                              <select name="frequency" className="w-full bg-surface border border-border rounded-xl py-2.5 px-4 text-xs focus:outline-none focus:border-orange-primary/50 appearance-none">
                                <option value="daily">Cada día</option>
                                <option value="weekly">Cada semana</option>
                                <option value="monthly">Cada mes</option>
                                <option value="yearly">Cada año</option>
                              </select>
                              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Notificaciones</label>
                            <div className="relative">
                              <select name="notify" className="w-full bg-surface border border-border rounded-xl py-2.5 px-4 text-xs focus:outline-none focus:border-orange-primary/50 appearance-none">
                                <option value="true">Activadas</option>
                                <option value="false">Desactivadas</option>
                              </select>
                              <Bell size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="pt-4 flex gap-3"><button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl text-sm font-bold border border-border hover:bg-surface-2 transition-all">Cancelar</button><button type="submit" className="flex-1 py-3 rounded-xl text-sm font-bold bg-orange-primary text-white hover:bg-orange-secondary shadow-lg shadow-orange-primary/20 transition-all active:scale-95">{editingTransaction ? 'Guardar' : 'Registrar'}</button></div>
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
                    <div className="space-y-1.5"><label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Descripción (Opcional)</label><textarea name="description" className="w-full bg-surface-2 border border-border rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-orange-primary/50 min-h-[80px] resize-none" /></div>
                    <div className="pt-4 flex gap-3"><button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl text-sm font-bold border border-border hover:bg-surface-2 transition-all">Cancelar</button><button type="submit" className="flex-1 py-3 rounded-xl text-sm font-bold bg-orange-primary text-white hover:bg-orange-secondary shadow-lg shadow-orange-primary/20 transition-all active:scale-95">Crear Cuenta</button></div>
                  </form>
                ) : (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    handleAddCategory({
                      name: fd.get('name'),
                      icon: fd.get('icon'),
                      color: fd.get('color'),
                    });
                  }} className="p-6 space-y-6">
                    <div className="space-y-1.5"><label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Nombre de la Categoría</label><input required name="name" placeholder="ej. Gimnasio, Mascotas..." className="w-full bg-surface-2 border border-border rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-orange-primary/50" /></div>
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
                    <div className="space-y-1.5"><label className="text-[10px] uppercase font-bold tracking-widest text-text-dim">Descripción (Opcional)</label><textarea name="description" className="w-full bg-surface-2 border border-border rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-orange-primary/50 min-h-[80px] resize-none" /></div>
                    <div className="pt-4 flex gap-3"><button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl text-sm font-bold border border-border hover:bg-surface-2 transition-all">Cancelar</button><button type="submit" className="flex-1 py-3 rounded-xl text-sm font-bold bg-orange-primary text-white hover:bg-orange-secondary shadow-lg shadow-orange-primary/20 transition-all active:scale-95">Crear Categoría</button></div>
                  </form>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <Toast />
      </div>
  );
}

// --- Subcomponents ---

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

function TransactionItem({ transaction, accounts, categories, onEdit, onDelete }: any) {
  const category = categories.find((c: any) => c.id === transaction.categoryId) || categories[categories.length - 1];
  const account = accounts.find((a: any) => a.id === transaction.accountId);
  const Icon = IconMap[category.icon] || MoreHorizontal;

  return (
    <div className="group flex items-center gap-4 p-4 hover:bg-surface-2 transition-all cursor-pointer">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${category.color}15`, color: category.color }}><Icon size={20} /></div>
      <div className="flex-1 min-w-0">
        <h5 className="text-sm font-bold truncate group-hover:text-orange-primary transition-colors">{transaction.description}</h5>
        <p className="text-[10px] text-text-dim uppercase tracking-wider font-medium">{category.name} • {account?.name} • {format(parseISO(transaction.date), 'dd MMM yyyy', { locale: es })}</p>
      </div>
      <div className="text-right flex items-center gap-4">
        <div className={cn("text-sm font-bold", transaction.type === 'income' ? "text-green-accent" : "text-text-primary")}>{transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}</div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-2 text-text-dim hover:text-text-primary transition-colors"><Settings size={14} /></button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 text-text-dim hover:text-red-accent transition-colors"><X size={14} /></button>
        </div>
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

function Toast() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  (window as any).showToast = (msg: string) => { setMessage(msg); setVisible(true); setTimeout(() => setVisible(false), 3000); };
  return (
    <AnimatePresence>
      {visible && (
        <motion.div initial={{ opacity: 0, y: 20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 20, x: '-50%' }} className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-surface-2 border border-border-2 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-orange-primary/20 text-orange-primary flex items-center justify-center"><Check size={16} /></div>
          <span className="text-sm font-bold">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function showToast(msg: string) { if ((window as any).showToast) (window as any).showToast(msg); }

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
