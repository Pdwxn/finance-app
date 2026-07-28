'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useAuthStore(s => s.token);

  useEffect(() => {
    useAuthStore.getState().loadFromStorage();
  }, []);

  useEffect(() => {
    const currentToken = useAuthStore.getState().token;
    if (!currentToken) {
      router.replace('/login');
    }
  }, [token, router]);

  if (!useAuthStore.getState().token) return null;

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-surface)]">
      {children}
    </div>
  );
}
