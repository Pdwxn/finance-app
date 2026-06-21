'use client';

import { ProtectedRoute } from '../components/ProtectedRoute';

export default function Home() {
  return (
    <ProtectedRoute>
      <div className="p-4">
        <h2 className="text-xl font-semibold text-[var(--color-text)]">Dashboard</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Bienvenido a Finance App
        </p>
      </div>
    </ProtectedRoute>
  );
}
