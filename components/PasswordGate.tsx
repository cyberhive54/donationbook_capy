'use client';

import { useEffect, useState } from 'react';
import { usePasswordAuth } from '@/lib/hooks/usePasswordAuth';
import { supabase } from '@/lib/supabase';
import { Lock } from 'lucide-react';
import toast from 'react-hot-toast';

interface PasswordGateProps {
  children: React.ReactNode;
  code: string;
}

export default function PasswordGate({ children, code }: PasswordGateProps) {
  const { isAuthenticated, isLoading, requiresPassword, verifyPassword } = usePasswordAuth(code);
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [info, setInfo] = useState<{ name: string; organiser?: string | null; start?: string | null; end?: string | null; location?: string | null } | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('festivals').select('event_name, organiser, event_start_date, event_end_date, location').eq('code', code).maybeSingle();
      if (data) setInfo({ name: data.event_name, organiser: data.organiser, start: data.event_start_date, end: data.event_end_date, location: data.location });
    })();
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      toast.error('Please enter a password');
      return;
    }

    setIsVerifying(true);
    const isValid = await verifyPassword(password);
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
            Please Enter Password to View Content
          </h2>
          <p className="text-center text-gray-600 mb-6">
            Ask admin for password
          </p>

          <form onSubmit={handleSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              disabled={isVerifying}
            />
            
            <button
              type="submit"
              disabled={isVerifying}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isVerifying ? 'Verifying...' : 'Submit'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
