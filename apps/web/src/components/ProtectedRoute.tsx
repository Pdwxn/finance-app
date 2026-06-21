'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/auth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useAuthStore(s => s.token);

  useEffect(() => {
    useAuthStore.getState().loadFromStorage();
  }, []);

  useEffect(() => {
    const currentToken = useAuthStore.getState().token;
    if (!currentToken) {
      router.push('/login');
    }
  }, [token, router]);

  if (!useAuthStore.getState().token) return null;

  return <>{children}</>;
}
