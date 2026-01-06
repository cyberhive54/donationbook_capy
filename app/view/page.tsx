'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { AlertCircle } from 'lucide-react';

export default function ViewFestival() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    
    if (!c || c.length < 4) {
      setError('Please enter a valid festival code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check if festival exists
      const { data: festival, error: festivalError } = await supabase
        .from('festivals')
        .select('id, code, event_name')
        .eq('code', c)
        .maybeSingle();

      if (festivalError) {
        console.error('Error checking festival:', festivalError);
        setError('Failed to verify festival code. Please try again.');
        setLoading(false);
        return;
      }

      if (!festival) {
        setError('This festival code does not exist or has been changed. Please check the code and try again.');
        setLoading(false);
        return;
      }

      // Festival exists, redirect
      router.push(`/f/${c}`);
    } catch (err) {
      console.error('Error:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">View a Festival</h1>
        <p className="text-sm text-gray-600 mb-6 text-center">Enter the festival code shared by your admin</p>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Invalid Festival Code</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError(''); // Clear error when user types
            }}
            placeholder="Enter festival code (e.g., 8 letters)"
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 mb-4 uppercase ${
              error 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            disabled={loading}
          />
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Verifying...
              </span>
            ) : (
              'Continue'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Don't have a festival code?{' '}
            <a href="/" className="text-blue-600 hover:underline">
              Create a new festival
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
