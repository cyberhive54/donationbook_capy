'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function useAdminAuth(code: string) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    const checkAuth = async () => {
      const urlPassword = searchParams.get('p');
      const today = todayStr();
      
      const storedAuth = localStorage.getItem(`adminPasswordAuth:${code}`);
      if (storedAuth) {
        try {
          const parsed = JSON.parse(storedAuth);
          const { data: festival } = await supabase
            .from('festivals')
            .select('admin_password_updated_at, updated_at')
            .eq('code', code)
            .single();
          const token = festival?.admin_password_updated_at || festival?.updated_at;
          if (parsed.authenticated && parsed.date === today && parsed.token === token) {
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
          } else {
            localStorage.removeItem(`adminPasswordAuth:${code}`);
          }
        } catch (error) {
          localStorage.removeItem(`adminPasswordAuth:${code}`);
        }
      }

      if (urlPassword) {
        try {
          const { data, error: fetchError } = await supabase
            .from('festivals')
            .select('admin_password, admin_password_updated_at, updated_at')
            .eq('code', code)
            .single();

          if (fetchError) throw fetchError;

          if (data && data.admin_password === urlPassword) {
            const token = data.admin_password_updated_at || data.updated_at;
            localStorage.setItem(
              `adminPasswordAuth:${code}`,
              JSON.stringify({ authenticated: true, date: today, token })
            );
            setIsAuthenticated(true);
          }
        } catch (error) {
          console.error('Error verifying admin password:', error);
        }
      }

      setIsLoading(false);
    };

    if (code) checkAuth();
  }, [searchParams, code]);

  return { isAuthenticated, isLoading };
}
