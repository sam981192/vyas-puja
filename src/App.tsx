import { useState, useEffect } from 'react';
import OfferingForm from './components/OfferingForm';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import { Flower2, Send, ShieldCheck, LogOut, User, BarChart3 } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<'submit' | 'admin'>('submit');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUserId(storedUser);
      setView(storedUser === 'priyanka' ? 'admin' : 'submit');
    }
  }, []);

  const handleLogin = (id: string) => {
    localStorage.setItem('user', id);
    setUserId(id);
    setView(id === 'priyanka' ? 'admin' : 'submit');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUserId(null);
  };

  const goToCountAllOffering = () => {
    window.open(
      'https://sam981192.github.io/offering-collection/',
      '_blank',
      'noopener,noreferrer'
    );
  };

  if (!userId) {
    return (
      <div className="min-h-screen font-sans bg-[#F8F9FA] flex flex-col items-center justify-center p-4">
        <Login onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-stone-800 bg-[#F8F9FA] flex flex-col">
      {/* TOP NAVIGATION */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-stone-200/60 sticky top-0 z-50 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-md shadow-orange-500/20 transform -rotate-6">
              <Flower2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-serif font-bold text-stone-900 tracking-tight hidden sm:block">
              Vyas Puja Offerings
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Count All Offering Button */}
            <button
              onClick={goToCountAllOffering}
              className="flex items-center gap-1.5 px-3 md:px-5 py-2 rounded-lg text-xs md:text-sm font-semibold bg-stone-100/80 text-stone-600 hover:text-orange-600 hover:bg-white shadow-sm transition-all duration-200"
            >
              <BarChart3 className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden md:inline">Count All Offering</span>
            </button>

            {/* Nav Buttons */}
            {userId !== 'priyanka' && (
              <nav className="flex items-center bg-stone-100/80 rounded-xl p-1 gap-1">
                <button
                  id="nav-submit"
                  onClick={() => setView('submit')}
                  className={`flex items-center gap-1.5 px-3 md:px-5 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all duration-200 ${
                    view === 'submit'
                      ? 'bg-white text-orange-600 shadow-sm shadow-stone-200/60'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <Send className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="hidden md:inline">Submit</span>
                </button>

                <button
                  id="nav-admin"
                  onClick={() => setView('admin')}
                  className={`flex items-center gap-1.5 px-3 md:px-5 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all duration-200 ${
                    view === 'admin'
                      ? 'bg-white text-orange-600 shadow-sm shadow-stone-200/60'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="hidden md:inline">Admin</span>
                </button>
              </nav>
            )}

            {/* User Info & Logout */}
            <div className="flex items-center gap-3 border-l border-stone-200 pl-4">
              <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-stone-600 bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200">
                <User className="w-4 h-4 text-orange-500" />
                <span className="capitalize">{userId}</span>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-8">
        {view === 'submit' && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-8 text-center">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 mb-2 tracking-tight">
                Vyas Puja Offering
              </h2>
              <p className="text-stone-500 text-sm md:text-base">Make your offering</p>
            </div>
            <OfferingForm userId={userId} />
          </div>
        )}

        {view === 'admin' && <AdminDashboard userId={userId} />}
      </main>

      <footer className="border-t border-stone-200/60 bg-white/60 backdrop-blur-sm py-5 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-xs text-stone-400 font-medium">
          <p>© {new Date().getFullYear()} ISKCON Management</p>
          <p className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            System Online
          </p>
        </div>
      </footer>
    </div>
  );
}
