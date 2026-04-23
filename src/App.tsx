/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import OfferingForm from './components/OfferingForm';
import AdminDashboard from './components/AdminDashboard';
import { LayoutDashboard, PenTool, Flower2, Quote } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<'user' | 'admin'>('user');

  return (
    <div className="flex flex-col md:flex-row min-h-screen font-sans text-natural-ink bg-natural-bg">
      {/* SIDEBAR: Branding and Instructions */}
      <aside className="w-full md:w-80 bg-natural-olive text-natural-paper p-8 md:p-10 flex flex-col justify-between border-r border-stone-200 sticky top-0 md:h-screen z-50">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-natural-gold rounded-full flex items-center justify-center shadow-lg transform -rotate-12">
              <Flower2 className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-serif font-bold leading-tight">Vyas Puja<br/>Offerings</h1>
          </div>
          
          <div className="space-y-8 opacity-90">
            <div className="relative">
              <Quote className="absolute -top-4 -left-4 w-8 h-8 opacity-20 text-white" />
              <p className="text-sm italic leading-relaxed pl-2">
                "The spiritual master is not God, but he is the representative of God, and as such he is to be respected as God."
              </p>
            </div>
            
            <div className="h-px bg-white/20 w-12"></div>
            
            <nav className="space-y-2">
              <button
                onClick={() => setView('user')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold tracking-wide uppercase transition-all ${
                  view === 'user' 
                  ? 'bg-natural-gold text-white shadow-md scale-105' 
                  : 'bg-white/5 text-natural-paper/60 hover:bg-white/10'
                }`}
              >
                <PenTool className="w-4 h-4" /> Submit Offering
              </button>
              <button
                onClick={() => setView('admin')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold tracking-wide uppercase transition-all ${
                  view === 'admin' 
                  ? 'bg-natural-gold text-white shadow-md scale-105' 
                  : 'bg-white/5 text-natural-paper/60 hover:bg-white/10'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" /> Admin Panel
              </button>
            </nav>

            <ul className="text-[10px] space-y-4 tracking-widest uppercase font-bold opacity-40 pt-4">
              <li className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${view === 'user' ? 'bg-natural-gold' : 'bg-white/30'}`}></span> Form Interface
              </li>
              <li className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${view === 'admin' ? 'bg-natural-gold' : 'bg-white/30'}`}></span> Data Logging
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 md:mt-0 text-[10px] uppercase font-bold tracking-[0.2em] opacity-30">
          ISKCON System v2.6.4
        </div>
      </aside>

      {/* MAIN: Content Area */}
      <main className="flex-1 p-6 md:p-12 overflow-x-hidden">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl md:text-5xl font-serif text-stone-900 mb-2 font-bold leading-tight">
              {view === 'user' ? 'Submission Form' : 'Dashboard'}
            </h2>
            <p className="text-stone-500 text-sm md:text-base font-medium">
              {view === 'user' 
                ? 'Submit your heartfelt offerings for the pleasure of Srila Prabhupada.' 
                : 'Manage and monitor all devotee submissions.'}
            </p>
          </div>
          <div className="self-start px-4 py-1.5 bg-stone-100 border border-stone-200 rounded text-[11px] font-black text-stone-400 tracking-widest uppercase">
            {view === 'user' ? 'Live System' : 'Verified Admin'}
          </div>
        </header>

        <div className="max-w-5xl">
          {view === 'user' ? <OfferingForm /> : <AdminDashboard />}
        </div>

        <footer className="mt-20 border-t border-stone-200/60 pt-8 flex flex-col md:flex-row items-center justify-between text-[11px] text-stone-400 uppercase tracking-widest font-bold gap-4">
          <p>Logged to: <span className="text-natural-olive">VYAS-PUJA-MASTER-2026</span></p>
          <p>© {new Date().getFullYear()} ISKCON Management</p>
        </footer>
      </main>
    </div>
  );
}
