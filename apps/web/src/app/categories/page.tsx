'use client';

import { useEffect, useState } from 'react';
import { PlusIcon, TagIcon } from '@heroicons/react/24/outline';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Sheet } from '@/components/Sheet';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { SwipeDeleteAction } from '@/hooks/useSwipeToDelete';
import { useCategoriesStore } from '@/store/categories';
import type { Category } from '@finance-app/types';

const ICON_OPTIONS = ['🍔', '🛒', '🚗', '🏠', '⚡', '💊', '🍿', '🛍️', '📚', '💰', '💻', '📈', '📥', '💸', '🎮', '👕', '✈️', '🏥', '🐱', '🎵'];
const COLOR_OPTIONS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#6366f1', '#8b5cf6', '#ec4899', '#78716c'];

export default function CategoriesPage() {
  const { categories, isLoading, fetchCategories, createCategory, updateCategory, deleteCategory } = useCategoriesStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [name, setName] = useState('');
  const [type, setType] = useState<Category['type']>('expense');
  const [icon, setIcon] = useState('🍔');
  const [color, setColor] = useState('#ef4444');
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const resetForm = () => {
    setName('');
    setType('expense');
    setIcon('🍔');
    setColor('#ef4444');
    setFormError(null);
  };

  const openCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const openEdit = (cat: Category) => {
    setName(cat.name);
    setType(cat.type);
    setIcon(cat.icon);
    setColor(cat.color);
    setEditTarget(cat);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) { setFormError('El nombre es obligatorio'); return; }
    if (!icon.trim()) { setFormError('El icono es obligatorio'); return; }
    if (!color.trim()) { setFormError('El color es obligatorio'); return; }

    setFormLoading(true);
    if (editTarget) {
      await updateCategory(editTarget.id, { name: name.trim(), type, icon: icon.trim(), color: color.trim() });
    } else {
      await createCategory({ name: name.trim(), type, icon: icon.trim(), color: color.trim() });
    }
    setFormLoading(false);
    setCreateOpen(false);
    setEditTarget(null);
    resetForm();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    await deleteCategory(deleteTarget.id);
    setDeleteLoading(false);
    setDeleteTarget(null);
  };

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');

  return (
    <ProtectedRoute>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[var(--color-text)]">Categorías</h2>
          <button onClick={openCreate}
            className="flex items-center justify-center w-10 h-10 rounded-lg text-[var(--color-primary)] hover:bg-[var(--color-surface-alt)] transition-colors">
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <Skeleton className="h-16 w-full" count={6} />
        ) : categories.length === 0 ? (
          <EmptyState icon={TagIcon} title="Sin categorías" subtitle="Crea tu primera categoría" />
        ) : (
          <div className="flex flex-col gap-6">
            {expenseCategories.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">Gastos</h3>
                <div className="flex flex-col gap-1">
                  {expenseCategories.map(cat => (
                    <div key={cat.id} data-swipe-id={cat.id} className="relative overflow-hidden">
                      <SwipeDeleteAction onDelete={() => setDeleteTarget(cat)} />
                      <button onClick={() => openEdit(cat)}
                        className="relative z-10 w-full flex items-center gap-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-3 hover:bg-[var(--color-surface-alt)] transition-colors text-left">
                        <span className="text-xl">{cat.icon}</span>
                        <span className="text-sm font-medium text-[var(--color-text)] flex-1">{cat.name}</span>
                        <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {incomeCategories.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">Ingresos</h3>
                <div className="flex flex-col gap-1">
                  {incomeCategories.map(cat => (
                    <div key={cat.id} data-swipe-id={cat.id} className="relative overflow-hidden">
                      <SwipeDeleteAction onDelete={() => setDeleteTarget(cat)} />
                      <button onClick={() => openEdit(cat)}
                        className="relative z-10 w-full flex items-center gap-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-3 hover:bg-[var(--color-surface-alt)] transition-colors text-left">
                        <span className="text-xl">{cat.icon}</span>
                        <span className="text-sm font-medium text-[var(--color-text)] flex-1">{cat.name}</span>
                        <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Sheet open={createOpen || !!editTarget} onClose={() => { setCreateOpen(false); setEditTarget(null); resetForm(); }}
        title={editTarget ? 'Editar categoría' : 'Nueva categoría'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Nombre</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              placeholder="Ej: Comida" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Tipo</label>
            <select value={type} onChange={e => setType(e.target.value as Category['type'])}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]">
              <option value="expense">Gasto</option>
              <option value="income">Ingreso</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Icono</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {ICON_OPTIONS.map(opt => (
                <button key={opt} type="button" onClick={() => setIcon(opt)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-colors ${icon === opt ? 'ring-2 ring-[var(--color-primary)] bg-[var(--color-surface-alt)]' : 'hover:bg-[var(--color-surface-alt)]'}`}>
                  {opt}
                </button>
              ))}
            </div>
            <input type="text" value={icon} onChange={e => setIcon(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              placeholder="O escribe un emoji" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Color</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {COLOR_OPTIONS.map(opt => (
                <button key={opt} type="button" onClick={() => setColor(opt)}
                  className={`w-9 h-9 rounded-lg transition-colors ${color === opt ? 'ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-[var(--color-surface)]' : ''}`}
                  style={{ backgroundColor: opt }} />
              ))}
            </div>
            <input type="text" value={color} onChange={e => setColor(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              placeholder="#ff0000" />
          </div>
          {formError && <p className="text-sm text-[var(--color-danger)]">{formError}</p>}
          <button type="submit" disabled={formLoading}
            className="w-full h-11 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-colors">
            {formLoading ? 'Guardando…' : editTarget ? 'Guardar' : 'Crear'}
          </button>
        </form>
      </Sheet>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar categoría"
        message={`¿Eliminar la categoría "${deleteTarget?.name}"?`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteLoading}
      />
    </ProtectedRoute>
  );
}
