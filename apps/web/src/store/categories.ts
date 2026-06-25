import { create } from 'zustand';
import { db, enqueue } from '@finance-app/offline';
import type { Category } from '@finance-app/types';
import { useAuthStore } from './auth';

const DEFAULT_CATEGORIES: Array<{
  name: string;
  type: Category['type'];
  icon: string;
  color: string;
}> = [
  // Gastos
  { name: 'Comida', type: 'expense', icon: '🍔', color: '#ef4444' },
  { name: 'Supermercado', type: 'expense', icon: '🛒', color: '#f97316' },
  { name: 'Transporte', type: 'expense', icon: '🚗', color: '#eab308' },
  { name: 'Vivienda', type: 'expense', icon: '🏠', color: '#22c55e' },
  { name: 'Servicios', type: 'expense', icon: '⚡', color: '#14b8a6' },
  { name: 'Salud', type: 'expense', icon: '💊', color: '#06b6d4' },
  { name: 'Entretenimiento', type: 'expense', icon: '🍿', color: '#8b5cf6' },
  { name: 'Shopping', type: 'expense', icon: '🛍️', color: '#ec4899' },
  { name: 'Educación', type: 'expense', icon: '📚', color: '#6366f1' },
  // Ingresos
  { name: 'Salario', type: 'income', icon: '💰', color: '#22c55e' },
  { name: 'Freelance', type: 'income', icon: '💻', color: '#14b8a6' },
  { name: 'Inversiones', type: 'income', icon: '📈', color: '#8b5cf6' },
  { name: 'Otros ingresos', type: 'income', icon: '📥', color: '#6366f1' },
];

function toCategory(row: {
  id: string;
  userId: string;
  name: string;
  type: string;
  icon: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): Category {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    type: row.type as Category['type'],
    icon: row.icon,
    color: row.color,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
  };
}

interface CategoriesState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  getCategoryById: (id: string) => Category | undefined;
  createCategory: (data: {
    name: string;
    type: Category['type'];
    icon: string;
    color: string;
  }) => Promise<void>;
  updateCategory: (
    id: string,
    data: Partial<Pick<Category, 'name' | 'type' | 'icon' | 'color'>>
  ) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  seedDefaultCategories: () => Promise<void>;
}

export const useCategoriesStore = create<CategoriesState>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        set({ categories: [], isLoading: false });
        return;
      }

      const rows = await db.categories
        .where('userId')
        .equals(userId)
        .filter(c => c.deletedAt === null)
        .toArray();

      const categories = rows.map(toCategory);

      if (categories.length === 0) {
        await get().seedDefaultCategories();
        const seededRows = await db.categories
          .where('userId')
          .equals(userId)
          .filter(c => c.deletedAt === null)
          .toArray();
        set({ categories: seededRows.map(toCategory), isLoading: false });
        return;
      }

      set({ categories, isLoading: false });
    } catch {
      set({ error: 'Error al cargar categorías', isLoading: false });
    }
  },

  getCategoryById: id => {
    return get().categories.find(c => c.id === id);
  },

  createCategory: async data => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    const now = new Date();
    const id = crypto.randomUUID();

    await db.categories.add({
      id,
      userId,
      name: data.name,
      type: data.type,
      icon: data.icon,
      color: data.color,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    await enqueue('create', 'categories', id, { ...data, userId });

    const category = toCategory({
      id,
      userId,
      name: data.name,
      type: data.type,
      icon: data.icon,
      color: data.color,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    set(state => ({ categories: [...state.categories, category] }));
  },

  updateCategory: async (id, data) => {
    const now = new Date();
    const updateData: Record<string, unknown> = { ...data, updatedAt: now };

    await db.categories.update(id, updateData);
    await enqueue('update', 'categories', id, data);

    set(state => ({
      categories: state.categories.map(c =>
        c.id === id ? { ...c, ...data, updatedAt: now.toISOString() } : c
      ),
    }));
  },

  deleteCategory: async id => {
    const now = new Date();

    await db.categories.update(id, { deletedAt: now, updatedAt: now });
    await enqueue('delete', 'categories', id, { deletedAt: now.toISOString() });

    set(state => ({
      categories: state.categories.filter(c => c.id !== id),
    }));
  },

  seedDefaultCategories: async () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    for (const cat of DEFAULT_CATEGORIES) {
      const now = new Date();
      const id = crypto.randomUUID();

      await db.categories.add({
        id,
        userId,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.color,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });

      await enqueue('create', 'categories', id, { ...cat, userId });
    }
  },
}));
