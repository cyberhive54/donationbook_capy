'use client';

import { useEffect, useState } from 'react';
import { usePasswordAuth } from '@/lib/hooks/usePasswordAuth';
import { supabase } from '@/lib/supabase';
import { Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';

interface PasswordGateProps {
  children: React.ReactNode;
  code: string;
}

export default function PasswordGate({ children, code }: PasswordGateProps) {
  const { isAuthenticated, isLoading, requiresPassword, verifyPassword, storedName } = usePasswordAuth(code);
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [info, setInfo] = useState<{ name: string; organiser?: string | null; start?: string | null; end?: string | null; location?: string | null } | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('festivals').select('event_name, organiser, event_start_date, event_end_date, location').eq('code', code).maybeSingle();
      if (data) setInfo({ name: data.event_name, organiser: data.organiser, start: data.event_start_date, end: data.event_end_date, location: data.location });
    })();
  }, [code]);

  // Pre-fill name from localStorage
  useEffect(() => {
    if (storedName) {
      setName(storedName);
    }
  }, [storedName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    
    if (!password.trim()) {
      toast.error('Please enter password');
      return;
    }

    setIsVerifying(true);
    const isValid = await verifyPassword(password, name);
    setIsVerifying(false);

    if (isValid) {
      toast.success('Access granted!');
    } else {
      toast.error('Wrong password entered, retry');
      setPassword('');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (!requiresPassword) {
      return null;
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          {info && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 text-sm">
              <div className="font-semibold text-gray-800">{info.name}</div>
              <div className="text-gray-600">{info.organiser ? `Organiser: ${info.organiser}` : null}</div>
              <div className="text-gray-600">{info.location ? `Location: ${info.location}` : null}</div>
              <div className="text-gray-600">{info.start || info.end ? `Dates: ${info.start || '—'} to ${info.end || '—'}` : null}</div>
            </div>
          )}
          <div className="flex justify-center mb-6">
            <div className="bg-blue-100 rounded-full p-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
            Enter Your Details
          </h2>
          <p className="text-center text-gray-600 mb-6">
            Please provide your name and password to continue
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isVerifying}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isVerifying}
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Ask admin for password
              </p>
            </div>
            
            <button
              type="submit"
              disabled={isVerifying}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isVerifying ? 'Verifying...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
