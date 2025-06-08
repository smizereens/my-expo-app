// contexts/AuthContext.tsx
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import authService, { User, LoginCredentials } from '~/services/authService';

// Типы для состояния авторизации
type AuthState = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
};

// Типы для действий
type AuthAction =
  | { type: 'AUTH_LOADING' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' };

// Типы для контекста
type AuthContextType = {
  state: AuthState;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
};

// Начальное состояние
const initialState: AuthState = {
  user: null,
  isLoading: true, // true при запуске приложения
  isAuthenticated: false,
  error: null,
};

// Reducer для управления состоянием
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_LOADING':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

// Создаем контекст
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider компонент
type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Инициализация при запуске приложения
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        dispatch({ type: 'AUTH_LOADING' });
        const user = await authService.initializeAuth();
        
        if (user) {
          dispatch({ type: 'AUTH_SUCCESS', payload: user });
        } else {
          dispatch({ type: 'AUTH_FAILURE', payload: '' }); // Нет ошибки, просто не авторизован
        }
      } catch (error: any) {
        console.error('❌ Ошибка инициализации авторизации:', error);
        dispatch({ type: 'AUTH_FAILURE', payload: 'Ошибка инициализации приложения' });
      }
    };

    initializeAuth();
  }, []);

  // Функция входа
  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'AUTH_LOADING' });
      const { user } = await authService.login(credentials);
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
    } catch (error: any) {
      const errorMessage = error.error || error.message || 'Ошибка входа в систему';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error; // Пробрасываем ошибку для обработки в компоненте
    }
  };

  // Функция выхода
  const logout = async () => {
    try {
      await authService.logout();
      dispatch({ type: 'AUTH_LOGOUT' });
    } catch (error: any) {
      console.error('❌ Ошибка при выходе:', error);
      // Даже если произошла ошибка, выполняем logout локально
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  // Обновление данных пользователя
  const refreshUser = async () => {
    try {
      const user = await authService.getCurrentUser();
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
    } catch (error: any) {
      console.error('❌ Ошибка обновления данных пользователя:', error);
      // Если токен недействителен, выполняем logout
      await logout();
    }
  };

  // Очистка ошибки
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    state,
    login,
    logout,
    refreshUser,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook для использования контекста
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Экспорт типов для использования в других файлах
export type { User, LoginCredentials, AuthState };