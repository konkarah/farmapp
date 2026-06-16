import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  name: string;
  profile_photo?: string;
  is_active: boolean;
}

interface Farm {
  id: string;
  name: string;
  location: string;
  organization_name: string;
  role_name: string;
  role_id: string;
}

interface AuthState {
  user: User | null;
  farms: Farm[];
  currentFarm: Farm | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User, farms: Farm[]) => void;
  setCurrentFarm: (farm: Farm) => void;
  logout: () => void;
  refreshAccessToken: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      farms: [],
      currentFarm: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken, isAuthenticated: true });
        
        // Set default axios header
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      },

      setUser: (user, farms) => {
        set({ 
          user, 
          farms,
          currentFarm: farms.length > 0 ? farms[0] : null
        });
      },

      setCurrentFarm: (farm) => {
        set({ currentFarm: farm });
      },

      logout: () => {
        set({
          user: null,
          farms: [],
          currentFarm: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false
        });
        
        delete axios.defaults.headers.common['Authorization'];
      },

      refreshAccessToken: async () => {
        try {
          const { refreshToken } = get();
          
          if (!refreshToken) {
            return false;
          }

          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
            { refreshToken }
          );

          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
          
          get().setTokens(newAccessToken, newRefreshToken);
          
          return true;
        } catch (error) {
          get().logout();
          return false;
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        farms: state.farms,
        currentFarm: state.currentFarm
      })
    }
  )
);

// Axios interceptor for token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const success = await useAuthStore.getState().refreshAccessToken();

      if (success) {
        const { accessToken } = useAuthStore.getState();
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        return axios(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);
