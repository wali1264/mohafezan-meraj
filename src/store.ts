import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  role: string;
  photoBase64: string;
  createdAt: number;
}

export interface ScanLog {
  userId: string;
  time: number;
  gate: string;
  verified: boolean;
  error?: string;
}

interface AppState {
  users: User[];
  logs: ScanLog[];
  addUser: (user: User) => void;
  addLog: (log: ScanLog) => void;
  getUserById: (id: string) => User | undefined;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      users: [],
      logs: [],
      addUser: (user) => set((state) => ({ users: [...state.users, user] })),
      addLog: (log) => set((state) => ({ logs: [log, ...state.logs] })),
      getUserById: (id) => get().users.find((u) => u.id === id),
    }),
    {
      name: 'secure-qr-storage',
    }
  )
);
