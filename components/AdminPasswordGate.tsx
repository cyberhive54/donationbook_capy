'use client';

import { useAdminAuth } from '@/lib/hooks/useAdminAuth';
import { supabase } from '@/lib/supabase';
import { ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface AdminPasswordGateProps {
  children: React.ReactNode;
  code: string;
}

export default function AdminPasswordGate({ children, code }: AdminPasswordGateProps) {
  const { isAuthenticated, isLoading } = useAdminAuth(code);
  const [info, setInfo] = useState<{ name: string; organiser?: string | null; start?: string | null; end?: string | null; location?: string | null } | null>(null);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('festivals').select('event_name, organiser, event_start_date, event_end_date, location').eq('code', code).maybeSingle();
      if (data) setInfo({ name: data.event_name, organiser: data.organiser, start: data.event_start_date, end: data.event_end_date, location: data.location });
    })();
  }, [code]);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      toast.success('Admin access granted!');
      router.replace(`/f/${code}/admin`);
    }
  }, [isAuthenticated, isLoading, router, code]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
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
            <div className="bg-red-100 rounded-full p-4">
              <ShieldAlert className="w-8 h-8 text-red-600" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
            Admin Access Required
          </h2>

          <form className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Password</label>
            <input
              type="password"
              placeholder="Enter admin password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              onClick={() => {
                // Intentionally always show error to distract
                toast.error('Wrong password entered, try again');
              }}
            >
              Submit
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
