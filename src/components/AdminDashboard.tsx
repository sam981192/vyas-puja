import React, { useEffect, useState } from 'react';
import { Download, Search, Filter, RefreshCw, FileSpreadsheet, Archive, MapPin, FileText, Globe, SlidersHorizontal, Save, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
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
  id: string;
  created_at: string;
  name: string;
  contact: string;
  language: string;
  state: string;
  city: string;
  formatType: string;
  totalFiles: number;
  files: string[];
  fileIds: string[];
  fileUrls?: string[];
  allUrls?: string[];
  downloadUrl: string;
  userId: string;
  fileLogs?: any[];
}

export default function AdminDashboard({ userId }: { userId: string }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [downloadLogs, setDownloadLogs] = useState<any[]>([]);
  const [sendToValues, setSendToValues] = useState<Record<string, string>>({});
  const [statusValues, setStatusValues] = useState<Record<string, string>>({});
  const [dirtyRows, setDirtyRows] = useState<Record<string, boolean>>({});
  const [savingRows, setSavingRows] = useState<Record<string, boolean>>({});
  const [savedRows, setSavedRows] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterLang, setFilterLang] = useState('');
  const [filterFormat, setFilterFormat] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', state: '', lang: '', format: '' });
  const [error, setError] = useState<string | null>(null);

  // Apply an array of updated file_statuses rows into the submissions list
  const applyLogsToSubmissions = (subs: Submission[], updatedLogs: any[]): Submission[] => {
    return subs.map(sub => {
      const newFileLogs = sub.files.map((fileName: string) => {
        const match = updatedLogs.find(l => l.submission_id === sub.id && l.file_name === fileName);
        return match ?? (sub.fileLogs?.find(existing => existing?.file_name === fileName) ?? null);
      });
      return { ...sub, fileLogs: newFileLogs };
    });
  };

  const fetchSubmissions = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      let query = supabase.from('offerings').select('*').order('created_at', { ascending: false });
      if (userId && userId !== 'admin' && userId !== 'priyanka') {
        query = query.eq('user_id', userId);
      }
      const { data: rows, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      const { data: logsData } = await supabase.from('file_statuses').select('*');
      const logRows: any[] = logsData || [];
      setDownloadLogs(logRows);

      const grouped = new Map();
      (rows || []).forEach((row: any) => {
        const key = `${row.name}-${row.contact}-${row.created_at}`;
        if (!grouped.has(key)) {
          grouped.set(key, {
            id: key,
            created_at: row.created_at,
            name: row.name,
            contact: row.contact,
            language: row.language,
            state: row.state,
            city: row.city,
            formatType: row.format_type || 'document',
            totalFiles: Number(row.total_files || 0),
            files: [],
            fileIds: [],
            fileUrls: [],
            userId: row.user_id
          });
        }
        const group = grouped.get(key);
        group.files.push(row.file_name);
        group.fileUrls.push(row.file_url);
        group.fileIds.push(row.id);
      });

      const result = Array.from(grouped.values()).map((s: any) => {
        const fileLogs = s.files.map((fileName: string) =>
          logRows.find((log: any) => log.submission_id === s.id && log.file_name === fileName) || null
        );
        return { ...s, downloadUrl: s.fileUrls[0], allUrls: s.fileUrls, fileLogs };
      });

      setSubmissions(result);

      // Pre-populate send_to inputs from DB (only for rows not yet locally dirtied)
      setSendToValues(prev => {
        const next = { ...prev };
        result.forEach((s: Submission) => {
          if (!(s.id in next) && s.fileLogs?.[0]?.send_to) {
            next[s.id] = s.fileLogs[0].send_to;
          }
        });
        return next;
      });
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch data.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => { fetchSubmissions(); }, []);

  const applyFilters = () => {
    setAppliedFilters({ search, state: filterState, lang: filterLang, format: filterFormat });
  };

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
    const data = sorted.map(s => {
      const log = s.fileLogs?.find(l => l !== null);
      return {
        "Date & Time": formatDate(s.created_at),
        "Name": s.name,
        "Contact": s.contact,
        "Language": s.language,
        "State": s.state,
        "City": s.city,
        "Format Type": s.formatType,
        "Total Files": s.totalFiles,
        "File Names": s.files.join(', '),
        "Submitted By": s.userId,
        "Download Status": log ? log.status : "Pending",
        "Downloaded By": log ? log.downloaded_by : "",
        "Download Date": log ? formatDate(log.downloaded_at) : "",
        "Updated By": log ? log.updated_by : "",
        "Updated Date": log ? formatDate(log.updated_at) : "",
        "Send To": log ? log.send_to : ""
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Offerings");
    XLSX.writeFile(wb, "vyas_puja_offerings.xlsx");
  };

  const exportDownloadedReport = () => {
    const data: any[] = [];
    filtered.forEach(s => {
      s.files.forEach((fileName, idx) => {
        const log = s.fileLogs && s.fileLogs[idx];
        if (log && (log.status === 'Downloaded' || log.status === 'Success')) {
          data.push({
            "file_name": fileName,
            "devotee_name": s.name,
            "state": s.state,
            "city": s.city,
            "contact": s.contact,
            "language": s.language,
            "offering_type": s.formatType,
            "downloaded_by": log.downloaded_by,
            "downloaded_date": formatDate(log.downloaded_at),
            "updated_by": log.updated_by,
            "updated_date": formatDate(log.updated_at),
            "send_to": log.send_to || ''
          });
        }
      });
    });
    if (data.length === 0) { alert('No downloaded files to export.'); return; }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Downloaded Files");
    XLSX.writeFile(wb, "downloaded_files_report.xlsx");
  };

  const downloadFile = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch {
      alert(`Failed to download: ${filename}`);
    }
  };

  const handleSaveStatus = async (s: Submission) => {
    console.log('--- SAVE STATUS CLICKED ---');
    const status = statusValues[s.id] !== undefined ? statusValues[s.id] : (s.fileLogs?.[0]?.status || 'Pending');
    const sendTo = sendToValues[s.id] !== undefined ? sendToValues[s.id] : (s.fileLogs?.[0]?.send_to || '');
    console.log('Saving status:', status, 'send_to:', sendTo);

    setSavingRows(prev => ({ ...prev, [s.id]: true }));

    // Build clean upsert rows — never spread the existing DB row to avoid id conflicts
    const now = new Date().toISOString();
    const upsertRows = s.files.map((fileName, index) => ({
      submission_id: s.id,
      file_name: fileName,
      file_url: s.allUrls?.[index] || '',
      status: status,
      send_to: sendTo,
      updated_by: userId,
      updated_at: now,
      // preserve existing download fields if already set
      downloaded_by: s.fileLogs?.[index]?.downloaded_by || null,
      downloaded_at: s.fileLogs?.[index]?.downloaded_at || null,
    }));

    try {
      const { data, error } = await supabase
        .from('file_statuses')
        .upsert(upsertRows, { onConflict: 'submission_id,file_name' })
        .select();
      console.log('Supabase save response:', { data, error });
      if (error) throw error;

      // Build merged file logs using returned data or our payload
      const returnedLogs: any[] = data || upsertRows;
      const mergedFileLogs = s.files.map((fileName) =>
        returnedLogs.find(l => l.file_name === fileName) ??
        upsertRows.find(u => u.file_name === fileName) ??
        null
      );
      console.log('Updated local fileLogs:', mergedFileLogs);

      // Update submissions state immediately
      setSubmissions(prev => {
        const next = applyLogsToSubmissions(prev, mergedFileLogs.map(l => ({ ...l, submission_id: s.id })));
        const downloaded = next.reduce((acc, curr) =>
          acc + (curr.fileLogs?.filter(l => l && (l.status === 'Downloaded' || l.status === 'Success')).length || 0), 0);
        console.log('Recalculated Downloaded Count after save:', downloaded);
        return next;
      });

      // Clear local overrides so dropdown reads from fileLogs (source of truth)
      setStatusValues(prev => { const n = { ...prev }; delete n[s.id]; return n; });
      setDirtyRows(prev => ({ ...prev, [s.id]: false }));
      setSavedRows(prev => ({ ...prev, [s.id]: true }));
      setTimeout(() => setSavedRows(prev => ({ ...prev, [s.id]: false })), 2000);

      // Background sync to confirm DB state
      fetchSubmissions(true);
    } catch (err) {
      console.error(err);
      alert('Failed to save. Check console. Ensure create_file_statuses.sql was executed in Supabase.');
    } finally {
      setSavingRows(prev => ({ ...prev, [s.id]: false }));
    }
  };

  const downloadSubmissionFiles = async (s: Submission) => {
    if (!s.allUrls || s.allUrls.length === 0) return;

    if (userId === 'priyanka') {
      console.log('--- DOWNLOAD BUTTON CLICKED ---');
      const sendTo = sendToValues[s.id] !== undefined ? sendToValues[s.id] : (s.fileLogs?.[0]?.send_to || '');
      const now = new Date().toISOString();

      // Clean upsert rows — never spread existing DB row
      const upsertRows = s.files.map((fileName, index) => ({
        submission_id: s.id,
        file_name: fileName,
        file_url: s.allUrls?.[index] || '',
        status: 'Downloaded',
        send_to: sendTo,
        updated_by: userId,
        updated_at: now,
        downloaded_by: userId,
        downloaded_at: now,
      }));

      const { data, error } = await supabase
        .from('file_statuses')
        .upsert(upsertRows, { onConflict: 'submission_id,file_name' })
        .select();
      console.log('Supabase download save response:', { data, error });

      if (error) {
        console.error('Save during download failed:', error);
        alert('Failed to save download status. Check console. Ensure create_file_statuses.sql was executed.');
      } else {
        const returnedLogs: any[] = data || upsertRows;
        const mergedFileLogs = s.files.map((fileName) =>
          returnedLogs.find(l => l.file_name === fileName) ??
          upsertRows.find(u => u.file_name === fileName) ??
          null
        );

        setStatusValues(prev => { const n = { ...prev }; delete n[s.id]; return n; });
        setDirtyRows(prev => ({ ...prev, [s.id]: false }));

        setSubmissions(prev => {
          const next = applyLogsToSubmissions(prev, mergedFileLogs.map(l => ({ ...l, submission_id: s.id })));
          const downloaded = next.reduce((acc, curr) =>
            acc + (curr.fileLogs?.filter(l => l && (l.status === 'Downloaded' || l.status === 'Success')).length || 0), 0);
          console.log('Recalculated Downloaded Count after download:', downloaded);
          return next;
        });
      }
    }

    if (s.allUrls.length === 1) {
      await downloadFile(s.allUrls[0], s.files[0] || 'download');
    } else {
      const zip = new JSZip();
      for (let i = 0; i < s.allUrls.length; i++) {
        try {
          const res = await fetch(s.allUrls[i]);
          const blob = await res.blob();
          zip.file(s.files[i] || `file_${i + 1}`, blob);
        } catch { /* skip failed */ }
      }
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${s.name.replace(/\s+/g, '_')}_submission.zip`);
    }
  };

  const downloadAllFiles = async () => {
    const zip = new JSZip();

    // --- Helper: Normalize language ---
    const normalizeLanguage = (lang: string): string => {
      const lower = (lang || '').trim().toLowerCase();
      if (lower === 'hindi') return 'Hindi';
      if (lower === 'english') return 'English';
      return 'Unknown';
    };

    // --- Helper: Clean devotee name for folder ---
    const cleanDevoteeName = (name: string): string => {
      const cleaned = name
        .replace(/[\x00-\x1F<>:"/\\|?*]/g, '') // remove control chars & invalid folder chars
        .trim()
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');
      return cleaned || 'Unknown_Devotee';
    };

    // --- Helper: Get safe YYYY-MM-DD date string ---
    const getSafeDateStr = (dateVal: any): string => {
      if (!dateVal) return 'Unknown-Date';
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return 'Unknown-Date';
      try {
        return d.toISOString().split('T')[0];
      } catch {
        return 'Unknown-Date';
      }
    };

    // --- Phase 1: Pre-scan to count files per devotee per grouping key ---
    interface FileEntry {
      blob: Blob;
      fileName: string;
      language: string;
      devoteeName: string;
      groupKey: string;         // for counting devotees
      statusCategory: string;   // 'pending' | 'downloaded' | 'success'
      dateFolder: string;       // e.g. '2025-08-13-download' or ''
    }

    const fileEntries: FileEntry[] = [];
    const groupCounts: Record<string, number> = {};

    for (const s of filtered) {
      for (let i = 0; i < (s.allUrls?.length || 0); i++) {
        try {
          const res = await fetch(s.allUrls![i]);
          const blob = await res.blob();
          const fileName = s.files[i] || `file_${fileEntries.length + 1}`;
          const language = normalizeLanguage(s.language);
          const devoteeName = cleanDevoteeName(s.name || 'Unknown');

          const log = s.fileLogs?.[i];
          let statusCategory: string;
          let dateFolder: string;

          if (!log || !log.status || log.status === 'Pending') {
            statusCategory = 'pending';
            dateFolder = '';
          } else if (log.status === 'Downloaded') {
            statusCategory = 'downloaded';
            const dateStr = getSafeDateStr(log.downloaded_at);
            dateFolder = `${dateStr}-download`;
          } else if (log.status === 'Success') {
            statusCategory = 'success';
            const dateStr = getSafeDateStr(log.updated_at);
            dateFolder = `${dateStr}-success`;
          } else {
            statusCategory = 'pending';
            dateFolder = '';
          }

          // Group key: status + dateFolder + language + devoteeName
          const groupKey = `${statusCategory}|${dateFolder}|${language}|${devoteeName}`;
          groupCounts[groupKey] = (groupCounts[groupKey] || 0) + 1;

          fileEntries.push({
            blob,
            fileName,
            language,
            devoteeName,
            groupKey,
            statusCategory,
            dateFolder,
          });
        } catch (err) {
          console.error(err);
        }
      }
    }

    if (fileEntries.length === 0) {
      alert('No files found.');
      return;
    }

    // --- Phase 2: Build ZIP structure ---
    const rootFolder = zip.folder('Vyas_Puja')!;

    for (const entry of fileEntries) {
      let categoryFolder: JSZip;

      if (entry.statusCategory === 'pending') {
        categoryFolder = rootFolder.folder('Pending Files')!;
      } else if (entry.statusCategory === 'downloaded') {
        const dlFolder = rootFolder.folder('Downloaded Files')!;
        categoryFolder = dlFolder.folder(entry.dateFolder)!;
      } else {
        // success
        const sFolder = rootFolder.folder('Success Files')!;
        categoryFolder = sFolder.folder(entry.dateFolder)!;
      }

      const langFolder = categoryFolder.folder(entry.language)!;

      // Decide: devotee subfolder or direct in language folder
      const count = groupCounts[entry.groupKey] || 1;
      if (count > 1) {
        const devoteeFolder = langFolder.folder(entry.devoteeName)!;
        devoteeFolder.file(entry.fileName, entry.blob);
      } else {
        langFolder.file(entry.fileName, entry.blob);
      }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'vyas_puja_all_files.zip');
  };


  const states = Array.from(new Set(submissions.map(s => s.state))).sort();
  const langs = Array.from(new Set(submissions.map(s => s.language))).sort();
  const formats = Array.from(new Set(submissions.map(s => s.formatType))).sort();

  const totalSubmissions = submissions.length;
  const totalFiles = submissions.reduce((acc: number, curr) => acc + Number(curr.totalFiles || 0), 0);

  const stateCounts = submissions.reduce((acc, curr) => {
    acc[curr.state] = (acc[curr.state] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  let topState = "N/A";
  let maxCount = 0;
  for (const [state, count] of Object.entries(stateCounts)) {
    const c = count as number;
    if (c > maxCount) { maxCount = c; topState = state; }
  }

  const totalDownloaded = submissions.reduce((acc, curr) => acc + (curr.fileLogs?.filter(l => l !== null && (l.status === 'Downloaded' || l.status === 'Success')).length || 0), 0);
  const totalPending = totalFiles - totalDownloaded;

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
        <div className="flex gap-3 w-full md:w-auto flex-wrap">
          <button id="btn-export-excel" onClick={exportToExcel} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-green-700 transition-all shadow-sm shadow-green-600/20 text-sm cursor-pointer">
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </button>
          <button id="btn-downloaded-report" onClick={exportDownloadedReport} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-teal-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-teal-700 transition-all shadow-sm shadow-teal-600/20 text-sm cursor-pointer">
            <FileSpreadsheet className="w-4 h-4" /> Download Downloaded Files Report
          </button>
          <button id="btn-download-all" onClick={downloadAllFiles} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/20 text-sm cursor-pointer">
            <Archive className="w-4 h-4" /> Download All Files
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm font-medium">{error}</div>
      )}

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
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
        <div className="bg-white p-5 rounded-xl border border-stone-200/60 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-stone-500 font-medium text-xs uppercase tracking-wider">Files Downloaded</h3>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Download className="w-4 h-4" /></div>
          </div>
          <p className="text-3xl font-bold text-stone-900">{totalDownloaded}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-stone-200/60 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-stone-500 font-medium text-xs uppercase tracking-wider">Pending</h3>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Archive className="w-4 h-4" /></div>
          </div>
          <p className="text-3xl font-bold text-stone-900">{totalPending}</p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-4 rounded-xl border border-stone-200/60 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
            <input id="filter-search" type="text" placeholder="Search by name..." className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyFilters()} />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4 pointer-events-none" />
            <select id="filter-state" className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none transition-all" value={filterState} onChange={e => setFilterState(e.target.value)}>
              <option value="">All States</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4 pointer-events-none" />
            <select id="filter-language" className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none transition-all" value={filterLang} onChange={e => setFilterLang(e.target.value)}>
              <option value="">All Languages</option>
              {langs.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4 pointer-events-none" />
            <select id="filter-format" className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none transition-all" value={filterFormat} onChange={e => setFilterFormat(e.target.value)}>
              <option value="">All Formats</option>
              {formats.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <button id="btn-apply-filters" onClick={applyFilters} className="bg-orange-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-orange-700 transition-all text-sm cursor-pointer shadow-sm shadow-orange-600/20">
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
                  <th className="px-5 py-4 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-4 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Send To</th>
                  <th className="px-5 py-4 text-[11px] font-semibold text-stone-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((s, idx) => (
                  <tr key={idx} className="hover:bg-orange-50/30 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-stone-900">{formatDate(s.created_at)}</div>
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
                    <td className="px-5 py-4 whitespace-nowrap">
                      {userId === 'priyanka' ? (
                        <div className="flex flex-col gap-1">
                          <select
                            className="text-xs border border-stone-200 rounded px-2 py-1 focus:outline-none focus:border-orange-500 font-semibold"
                            value={statusValues[s.id] !== undefined ? statusValues[s.id] : (s.fileLogs?.[0]?.status || 'Pending')}
                            onChange={(e) => {
                              setStatusValues(prev => ({ ...prev, [s.id]: e.target.value }));
                              setDirtyRows(prev => ({ ...prev, [s.id]: true }));
                            }}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Downloaded">Downloaded</option>
                            <option value="Success">Success</option>
                          </select>
                        </div>
                      ) : (
                        (() => {
                          const status = s.fileLogs?.[0]?.status || 'Pending';
                          if (status === 'Downloaded') {
                            return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">Downloaded</span>;
                          } else if (status === 'Success') {
                            return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">Success</span>;
                          } else {
                            return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">Pending</span>;
                          }
                        })()
                      )}
                      {s.fileLogs?.[0]?.updated_by && (
                        <div className="text-[10px] text-stone-500 mt-1">
                          Upd: {s.fileLogs[0].updated_by} ({formatDate(s.fileLogs[0].updated_at)})
                        </div>
                      )}
                      {s.fileLogs?.[0]?.downloaded_by && (
                        <div className="text-[10px] text-stone-500 mt-1">
                          Dl: {s.fileLogs[0].downloaded_by} ({formatDate(s.fileLogs[0].downloaded_at)})
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        placeholder="Email / Phone"
                        className="w-28 px-2 py-1 text-xs border border-stone-200 rounded focus:outline-none focus:border-orange-500"
                        value={sendToValues[s.id] !== undefined ? sendToValues[s.id] : (s.fileLogs?.[0]?.send_to || '')}
                        onChange={(e) => {
                          setSendToValues(prev => ({ ...prev, [s.id]: e.target.value }));
                          setDirtyRows(prev => ({ ...prev, [s.id]: true }));
                        }}
                      />
                      {s.fileLogs?.[0]?.send_to && userId !== 'priyanka' && (
                        <div className="text-[10px] text-stone-500 mt-1">
                          Sent: {s.fileLogs[0].send_to}
                        </div>
                      )}
                      {userId === 'priyanka' && dirtyRows[s.id] && (
                        <button
                          onClick={() => handleSaveStatus(s)}
                          disabled={savingRows[s.id]}
                          className="mt-2 flex items-center justify-center gap-1 w-full bg-orange-100 hover:bg-orange-200 text-orange-700 px-2 py-1 rounded text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          <Save className="w-3 h-3" /> Save
                        </button>
                      )}
                      {userId === 'priyanka' && savedRows[s.id] && !dirtyRows[s.id] && (
                        <div className="mt-2 flex items-center justify-center gap-1 w-full text-green-600 text-xs font-semibold">
                          <Check className="w-3 h-3" /> Saved
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => downloadSubmissionFiles(s)}
                        disabled={!s.allUrls || s.allUrls.length === 0}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-stone-200 rounded-lg text-sm font-medium text-stone-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
