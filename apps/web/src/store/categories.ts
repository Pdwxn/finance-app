import { create } from 'zustand';
import { db } from '@finance-app/offline';
import type { Category } from '@finance-app/types';
import { useAuthStore } from './auth';

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

      set({ categories: rows.map(toCategory), isLoading: false });
    } catch {
      set({ error: 'Error al cargar categorías', isLoading: false });
    }
  },

  getCategoryById: id => {
    return get().categories.find(c => c.id === id);
  },
}));
