'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../store/auth';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    await login(email, password);
    const token = useAuthStore.getState().token;
    if (token) router.push('/');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-8 text-center">
          Iniciar sesión
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors"
              placeholder="user@example.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors"
              placeholder="••••••"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-sm text-[var(--color-danger)]">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full h-11 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="text-[var(--color-primary)] hover:underline">
            Registrarse
          </Link>
        </p>
      </div>
    </div>
  );
}
