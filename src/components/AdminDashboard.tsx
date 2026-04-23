import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Download, Search, Filter, RefreshCw, FileSpreadsheet, MapPin, User, Phone, LogIn, LogOut, ShieldCheck, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { db, auth, handleFirestoreError } from '../lib/firebase';

interface Submission {
  id: string;
  timestamp: string;
  language: string;
  state: string;
  city: string;
  name: string;
  contact: string;
  formatType: string;
  fileName: string;
  fileIndex: number;
  totalFiles: number;
}

export default function AdminDashboard() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterLang, setFilterLang] = useState('');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (u) {
        fetchSubmissions();
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
      setError("Failed to sign in. Please try again.");
    }
  };

  const handleLogout = () => signOut(auth);

  const fetchSubmissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'offerings'), orderBy('timestamp', 'desc'), limit(1000));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Submission[];
      setSubmissions(data);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('permission-denied')) {
        setError("Access Denied: You do not have admin privileges. Contact the administrator.");
      } else {
        setError("Failed to fetch data from Firestore.");
      }
    } finally {
      setLoading(false);
    }
  };

  const filtered = submissions.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                         s.contact.toLowerCase().includes(search.toLowerCase());
    const matchesState = !filterState || s.state === filterState;
    const matchesLang = !filterLang || s.language === filterLang;
    return matchesSearch && matchesState && matchesLang;
  });

  const exportToExcel = () => {
    const dataToExport = filtered.map(s => ({
      Timestamp: new Date(s.timestamp).toLocaleString(),
      Language: s.language,
      State: s.state,
      City: s.city,
      Name: s.name,
      Contact: s.contact,
      'Format Type': s.formatType,
      'File Name': s.fileName,
      'File Index': s.fileIndex,
      'Total Files': s.totalFiles
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Submissions");
    XLSX.writeFile(wb, `Vyas_Puja_Offerings_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const states = Array.from(new Set(submissions.map(s => s.state))).sort();
  const langs = Array.from(new Set(submissions.map(s => s.language))).sort();

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl shadow-xl">
        <RefreshCw className="w-10 h-10 text-orange-500 animate-spin mb-4" />
        <p className="text-gray-500">Checking authorization...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center p-16 bg-white rounded-[2rem] shadow-2xl shadow-stone-200/50 border border-stone-100">
        <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-stone-100">
          <ShieldCheck className="w-10 h-10 text-natural-olive" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4">Admin Access</h2>
        <p className="text-stone-500 mb-10 leading-relaxed font-medium">Please sign in with your authorized credentials to manage the offerings.</p>
        <button 
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-stone-100 text-stone-700 px-6 py-4 rounded-xl font-bold hover:bg-stone-50 transition-all shadow-sm group"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 group-hover:scale-110 transition-transform" alt="Google" />
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white p-8 rounded-[2rem] shadow-2xl shadow-stone-200/30 border border-stone-50">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-3xl font-serif font-bold text-stone-900">Dashboard</h2>
            <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest border border-green-200">Session Active</div>
          </div>
          <p className="text-stone-400 text-sm font-medium">
            Monitoring as <span className="text-natural-gold font-bold">{user.email}</span>
          </p>
        </div>
        <div className="flex gap-3 w-full xl:w-auto">
          <button 
            onClick={exportToExcel}
            className="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-green-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-green-700 transition-all shadow-xl shadow-green-100"
          >
            <FileSpreadsheet className="w-5 h-5" /> Export Data
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 bg-stone-100 text-stone-500 px-6 py-4 rounded-xl font-bold hover:bg-stone-200 transition-colors border border-stone-200"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-4 p-5 bg-red-50 border border-red-100 text-red-700 rounded-2xl shadow-lg shadow-red-100/50"
        >
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="font-bold text-sm uppercase tracking-wide">{error}</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search by devotee or contact..."
            className="w-full pl-14 pr-6 py-4 bg-white border border-stone-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-natural-gold shadow-sm font-medium"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="relative group">
          <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300 w-5 h-5 pointer-events-none group-focus-within:text-natural-gold" />
          <select 
            className="w-full pl-14 pr-6 py-4 bg-white border border-stone-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-natural-gold appearance-none font-medium shadow-sm transition-all"
            value={filterState}
            onChange={e => setFilterState(e.target.value)}
          >
            <option value="">Filter State</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="relative group">
          <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300 w-5 h-5 pointer-events-none group-focus-within:text-natural-gold" />
          <select 
            className="w-full pl-14 pr-6 py-4 bg-white border border-stone-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-natural-gold appearance-none font-medium shadow-sm transition-all"
            value={filterLang}
            onChange={e => setFilterLang(e.target.value)}
          >
            <option value="">Filter Language</option>
            {langs.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-2xl shadow-stone-200/40 border border-stone-100 overflow-hidden">
        {loading ? (
          <div className="p-32 text-center">
            <RefreshCw className="w-12 h-12 text-natural-gold animate-spin mx-auto mb-6" />
            <p className="text-stone-400 font-bold uppercase tracking-widest text-[10px]">Processing Database...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-32 text-center">
            <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-stone-100">
              <Search className="w-8 h-8 text-stone-200" />
            </div>
            <p className="text-stone-400 font-bold uppercase tracking-widest text-[11px]">No matching records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-100">
                  <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Devotee Identity</th>
                  <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Regional Source</th>
                  <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Content Info</th>
                  <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Date Logged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-natural-bg/50 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-natural-paper border-2 border-stone-100 rounded-2xl flex items-center justify-center text-natural-olive font-black text-xl shadow-sm group-hover:scale-110 group-hover:bg-white transition-all">
                          {s.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-stone-900 group-hover:text-natural-gold transition-colors">{s.name}</p>
                          <p className="text-xs text-stone-400 font-medium flex items-center gap-1.5 mt-1">
                            <Phone className="w-3.5 h-3.5" /> {s.contact}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-stone-700">{s.city}</p>
                      <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3 h-3" /> {s.state}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        s.formatType === 'text' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        s.formatType === 'image' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                        'bg-natural-gold/10 text-natural-gold border-natural-gold/20'
                      }`}>
                        {s.formatType}
                      </span>
                      <p className="text-[11px] text-stone-400 font-medium mt-2 truncate max-w-[180px] italic">{s.fileName}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs font-black text-stone-700 uppercase tracking-tighter">Part {s.fileIndex} of {s.totalFiles}</p>
                      <p className="text-[10px] text-stone-400 italic font-bold tracking-tight mt-1">{s.language}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-stone-900">
                        {new Date(s.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-[10px] text-stone-400 font-medium mt-1">
                        {new Date(s.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
