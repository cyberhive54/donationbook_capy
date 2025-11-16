'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function usePasswordAuth(code: string) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [requiresPassword, setRequiresPassword] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const { data: festival, error } = await supabase
          .from('festivals')
          .select('requires_user_password, user_password_updated_at, updated_at')
          .eq('code', code)
          .single();
        if (error) throw error;

        const needPass = !!festival?.requires_user_password;
        setRequiresPassword(needPass);

        if (!needPass) {
          setIsAuthenticated(true);
          return;
        }

        const key = `userPasswordAuth:${code}`;
        const auth = localStorage.getItem(key);
        if (auth) {
          try {
            const parsed = JSON.parse(auth);
            const validToday = parsed.date === todayStr();
            const token = parsed.token; // stored timestamp
            const currentToken = festival.user_password_updated_at || festival.updated_at;
            if (validToday && token === currentToken) {
              setIsAuthenticated(true);
              return;
            }
          } catch (e) {
            localStorage.removeItem(key);
          }
        }
        setIsAuthenticated(false);
      } catch (e) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    if (code) checkAuth();
  }, [code]);

  const verifyPassword = async (password: string): Promise<boolean> => {
    try {
      const { data: festival, error } = await supabase
        .from('festivals')
        .select('user_password, user_password_updated_at, updated_at, requires_user_password')
        .eq('code', code)
        .single();
      if (error) throw error;

      if (!festival?.requires_user_password) {
        setIsAuthenticated(true);
        return true;
      }

      if (festival && festival.user_password === password) {
        localStorage.setItem(
          `userPasswordAuth:${code}`,
          JSON.stringify({ authenticated: true, date: todayStr(), token: festival.user_password_updated_at || festival.updated_at })
        );
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  };

  return { isAuthenticated, isLoading, requiresPassword, verifyPassword };
}
