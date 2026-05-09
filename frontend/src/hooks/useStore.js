import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => { localStorage.setItem('token', token); set({ user, token }); },
      logout: () => { localStorage.removeItem('token'); set({ user: null, token: null }); }
    }),
    { name: 'auth-store', partialize: (s) => ({ user: s.user, token: s.token }) }
  )
);

export const useAnalysisStore = create((set, get) => ({
  code: '',
  mode: 'review',
  language: 'JavaScript',
  result: null,
  loading: false,
  chatHistory: [],
  setCode: (code) => set({ code }),
  setMode: (mode) => set({ mode }),
  setLanguage: (language) => set({ language }),
  setResult: (result) => set({ result }),
  setLoading: (loading) => set({ loading }),
  addChat: (role, content) => set(s => ({ chatHistory: [...s.chatHistory, { role, content }] })),
  resetChat: () => set({ chatHistory: [] }),
  reset: () => set({ result: null, chatHistory: [] })
}));
