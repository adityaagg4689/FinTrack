import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../utils/supabase';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      token: null,
      isLoading: false,
      error: null,

      register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name } }
          });
          
          if (error) throw error;
          
          // Detect duplicate email - Supabase returns user but no session when email exists
          if (data.user && !data.session) {
            set({ 
              isLoading: false, 
              error: 'An account with this email already exists. Please sign in instead.' 
            });
            return { success: false };
          }
          
          set({
            user: data.user,
            session: data.session,
            token: data.session?.access_token ?? null,
            isLoading: false,
          });
          
          return { success: true };
        } catch (error) {
          set({ isLoading: false, error: error.message });
          return { success: false, error: error.message };
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (error) throw error;
          
          set({
            user: data.user,
            session: data.session,
            token: data.session?.access_token ?? null,
            isLoading: false,
          });
          
          return { success: true };
        } catch (error) {
          set({ isLoading: false, error: error.message });
          return { success: false, error: error.message };
        }
      },

      logout: async () => {
        set({ isLoading: true });
        await supabase.auth.signOut();
        set({ user: null, session: null, token: null, isLoading: false });
      },

      getSession: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && !get().user) {
          set({ user: session.user, session: session, token: session?.access_token ?? null });
        } else if (!session) {
          set({ token: null });
        }
        return session;
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      getStorage: () => localStorage,
    }
  )
);

export default useAuthStore;
