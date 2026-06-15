import React, { useState } from 'react';
import { ShieldCheck, LogIn } from 'lucide-react';

interface LoginProps {
  onLogin: (userId: string) => void;
}

const USERS = {
  admin: 'admin123',
  gungun: 'gungun123',
  aarti: 'aarti123',
  priyanka: 'priyanka123',
};

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const userKey = username.toLowerCase().trim();
    if (USERS[userKey as keyof typeof USERS] === password) {
      onLogin(userKey);
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-xl border border-stone-100">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8 text-orange-600" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-stone-900">Secure Login</h2>
        <p className="text-stone-500 mt-2">Access your Vyas Puja Offerings</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-2">Username</label>
          <input
            type="text"
            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-2">Password</label>
          <input
            type="password"
            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm font-semibold rounded-lg border border-red-100 text-center">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-700 transition-all shadow-md shadow-orange-600/20"
        >
          <LogIn className="w-5 h-5" />
          Login
        </button>
      </form>
    </div>
  );
}
