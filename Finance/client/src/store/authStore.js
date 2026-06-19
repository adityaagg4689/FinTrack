import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../utils/supabase';
let authListenerInitialized = false;

const useAuthStore = create(
  persist(
    (set, get) => {
      // Initialize Supabase auth listener
      if (!authListenerInitialized) {
        authListenerInitialized = true;
        supabase.auth.onAuthStateChange((event, session) => {
          if (session) {
            set({
              user: session.user,
              token: session.access_token,
            });
          } else if (event === 'SIGNED_OUT') {
            set({ user: null, token: null });
          }
        });
      }

      return {
        user: null,
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

            // Note: Supabase returns user but no session when email already exists.
            // This is an implementation detail that could change in future Supabase versions.
            if (data.user && !data.session) {
              set({
                isLoading: false,
                error: 'An account with this email already exists. Please sign in instead.'
              });
              return { success: false };
            }

            set({
              user: data.user,
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
          try {
            await supabase.auth.signOut();
          } catch (error) {
            console.error('Logout error:', error);
          }
          set({ user: null, token: null, isLoading: false });
        },

        getSession: async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session && !get().user) {
              set({
                user: session.user,
                token: session.access_token ?? null,
              });
            } else if (!session) {
              set({ user: null, token: null });
            }
            return session;
          } catch (error) {
            console.error('Get session error:', error);
            return null;
          }
        },

        clearError: () => set({ error: null }),
      };
    },
    {
      name: 'auth-storage',
      // Only persist user and token — not session (contains refresh token)
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);

export default useAuthStore;