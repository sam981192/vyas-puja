import { useEffect, useState } from 'react';
import { Download, Search, Filter, RefreshCw, FileSpreadsheet, Archive, MapPin, FileText, Globe, SlidersHorizontal } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';

const formatDate = (date: string) => {
  const d = new Date(date);
  return isNaN(d.getTime())
    ? "N/A"
    : d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
};

interface Submission {
  created_at: string;
  name: string;
  contact: string;
  language: string;
  state: string;
  city: string;
  formatType: string;
  totalFiles: number;
  files: string[];
  fileUrls?: string[];
  allUrls?: string[];
  downloadUrl: string;
  userId: string;
}

export default function AdminDashboard({ userId }: { userId: string }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterLang, setFilterLang] = useState('');
  const [filterFormat, setFilterFormat] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', state: '', lang: '', format: '' });
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('offerings').select('*').order('created_at', { ascending: false });

      if (userId && userId !== 'admin') {
        query = query.eq('user_id', userId);
      }

      const { data: rows, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      const grouped = new Map();
      (rows || []).forEach(row => {
        const key = `${row.name}-${row.contact}-${row.created_at}`;
        if (!grouped.has(key)) {
          grouped.set(key, {
            created_at: row.created_at,
            name: row.name,
            contact: row.contact,
            language: row.language,
            state: row.state,
            city: row.city,
            formatType: row.format_type,
            totalFiles: row.total_files,
            files: [],
            fileUrls: [],
            userId: row.user_id
          });
        }
        const group = grouped.get(key);
        group.files.push(row.file_name);
        group.fileUrls.push(row.file_url);
      });

      const result = Array.from(grouped.values()).map((s: any) => {
        return { ...s, downloadUrl: s.fileUrls[0], allUrls: s.fileUrls };
      });

      setSubmissions(result);
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubmissions(); }, []);

  const applyFilters = () => {
    setAppliedFilters({ search, state: filterState, lang: filterLang, format: filterFormat });
  };

  // Auto-apply on first load
  useEffect(() => {
    setAppliedFilters({ search, state: filterState, lang: filterLang, format: filterFormat });
  }, []);

  const filtered = submissions.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(appliedFilters.search.toLowerCase()) ||
                         s.contact.toLowerCase().includes(appliedFilters.search.toLowerCase());
    const matchesState = !appliedFilters.state || s.state === appliedFilters.state;
    const matchesLang = !appliedFilters.lang || s.language === appliedFilters.lang;
    const matchesFormat = !appliedFilters.format || s.formatType === appliedFilters.format;
    return matchesSearch && matchesState && matchesLang && matchesFormat;
  });

  const exportToExcel = () => {
    const sorted = [...filtered].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const data = sorted.map(s => ({
      "Date & Time": formatDate(s.created_at),
      "Name": s.name,
      "Contact": s.contact,
      "Language": s.language,
      "State": s.state,
      "City": s.city,
      "Format Type": s.formatType,
      "Total Files": s.totalFiles,
      "File Names": s.files.join(', '),
      "Submitted By": s.userId
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Offerings");

    XLSX.writeFile(wb, "vyas_puja_offerings.xlsx");
  };

  const downloadAllFiles = () => {
    const allUrls: string[] = [];
    filtered.forEach(s => {
      s.allUrls?.forEach(url => allUrls.push(url));
    });
    
    allUrls.forEach((url, index) => {
      setTimeout(() => {
        window.open(url, '_blank');
      }, index * 200);
    });
  };

  const states = Array.from(new Set(submissions.map(s => s.state))).sort();
  const langs = Array.from(new Set(submissions.map(s => s.language))).sort();
  const formats = Array.from(new Set(submissions.map(s => s.formatType))).sort();

  const totalSubmissions = submissions.length;
  const totalFiles = submissions.reduce((acc, curr) => acc + curr.totalFiles, 0);

  const stateCounts = submissions.reduce((acc, curr) => {
    acc[curr.state] = (acc[curr.state] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  let topState = "N/A";
  let maxCount = 0;
  for (const [state, count] of Object.entries(stateCounts)) {
    if (count > maxCount) { maxCount = count; topState = state; }
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3">
            <SlidersHorizontal className="w-3 h-3" /> Control Room
          </div>
          <h2 className="text-3xl font-serif font-bold text-stone-900">All Offerings</h2>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            id="btn-export-excel"
            onClick={exportToExcel}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-green-700 transition-all shadow-sm shadow-green-600/20 text-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </button>
          <button
            id="btn-download-all"
            onClick={downloadAllFiles}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/20 text-sm cursor-pointer"
          >
            <Archive className="w-4 h-4" /> Download All Files
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm font-medium">{error}</div>
      )}

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-stone-200/60 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-stone-500 font-medium text-xs uppercase tracking-wider">Submissions</h3>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText className="w-4 h-4" /></div>
          </div>
          <p className="text-3xl font-bold text-stone-900">{totalSubmissions}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-stone-200/60 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-stone-500 font-medium text-xs uppercase tracking-wider">Files</h3>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Archive className="w-4 h-4" /></div>
          </div>
          <p className="text-3xl font-bold text-stone-900">{totalFiles}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-stone-200/60 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-stone-500 font-medium text-xs uppercase tracking-wider">Top State</h3>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><MapPin className="w-4 h-4" /></div>
          </div>
          <p className="text-xl font-bold text-stone-900 truncate" title={topState}>{topState}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-stone-200/60 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-stone-500 font-medium text-xs uppercase tracking-wider">Showing</h3>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Search className="w-4 h-4" /></div>
          </div>
          <p className="text-3xl font-bold text-stone-900">{filtered.length}</p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-4 rounded-xl border border-stone-200/60 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
            <input
              id="filter-search"
              type="text"
              placeholder="Search by name..."
              className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && applyFilters()}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4 pointer-events-none" />
            <select
              id="filter-state"
              className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none transition-all"
              value={filterState}
              onChange={e => setFilterState(e.target.value)}
            >
              <option value="">All States</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4 pointer-events-none" />
            <select
              id="filter-language"
              className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none transition-all"
              value={filterLang}
              onChange={e => setFilterLang(e.target.value)}
            >
              <option value="">All Languages</option>
              {langs.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4 pointer-events-none" />
            <select
              id="filter-format"
              className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none transition-all"
              value={filterFormat}
              onChange={e => setFilterFormat(e.target.value)}
            >
              <option value="">All Formats</option>
              {formats.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <button
            id="btn-apply-filters"
            onClick={applyFilters}
            className="bg-orange-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-orange-700 transition-all text-sm cursor-pointer shadow-sm shadow-orange-600/20"
          >
            Apply
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border border-stone-200/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center">
            <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mb-4" />
            <p className="text-stone-500 font-medium text-sm">Loading records...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-stone-400" />
            </div>
            <p className="text-stone-600 font-semibold mb-1">No offerings found</p>
            <p className="text-stone-400 text-sm">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50/80 border-b border-stone-200">
                  <th className="px-5 py-4 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-5 py-4 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Name</th>
                  <th className="px-5 py-4 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Contact</th>
                  <th className="px-5 py-4 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Language</th>
                  <th className="px-5 py-4 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">State</th>
                  <th className="px-5 py-4 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">City</th>
                  <th className="px-5 py-4 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Format Type</th>
                  <th className="px-5 py-4 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Total Files</th>
                  <th className="px-5 py-4 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">File Names</th>
                  <th className="px-5 py-4 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Submitted By</th>
                  <th className="px-5 py-4 text-[11px] font-semibold text-stone-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((s, idx) => (
                  <tr key={idx} className="hover:bg-orange-50/30 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-stone-900">
                        {formatDate(s.created_at)}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-stone-900">{s.name}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-stone-600">{s.contact}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700">{s.language}</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-stone-600">{s.state}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-stone-600">{s.city}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                        s.formatType === 'text' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        s.formatType === 'image' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        s.formatType === 'audio' ? 'bg-pink-50 text-pink-700 border border-pink-200' :
                        'bg-orange-50 text-orange-700 border border-orange-200'
                      }`}>
                        {s.formatType.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-center">
                      <span className="font-bold text-stone-800">{s.totalFiles}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-stone-600 max-w-xs truncate" title={s.files.join(', ')}>
                      {s.files.join(', ')}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-stone-600 capitalize">
                      {s.userId}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => {
                          s.allUrls?.forEach((url: string, index: number) => {
                            setTimeout(() => window.open(url, '_blank'), index * 100);
                          });
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-stone-200 rounded-lg text-sm font-medium text-stone-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all shadow-sm cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
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
