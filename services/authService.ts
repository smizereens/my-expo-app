// services/authService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './api';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export interface User {
  id: string;
  username: string;
  role: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

class AuthService {
  // Вход в систему
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
      const { token, user } = response.data;
      
      // Сохраняем токен и данные пользователя
      await this.setAuthData(token, user);
      
      console.log('✅ Успешная авторизация:', user.username);
      return response.data;
    } catch (error: any) {
      console.error('❌ Ошибка авторизации:', error.response?.data || error.message);
      throw error.response?.data || new Error('Ошибка входа в систему');
    }
  }

  // Выход из системы
  async logout(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
      // Очищаем заголовок Authorization в axios
      delete apiClient.defaults.headers.common['Authorization'];
      console.log('✅ Выход из системы выполнен');
    } catch (error) {
      console.error('❌ Ошибка при выходе:', error);
    }
  }

  // Сохранение данных авторизации
  private async setAuthData(token: string, user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      
      // Устанавливаем токен в axios для всех последующих запросов
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (error) {
      console.error('❌ Ошибка сохранения данных авторизации:', error);
      throw new Error('Не удалось сохранить данные авторизации');
    }
  }

  // Получение токена
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('❌ Ошибка получения токена:', error);
      return null;
    }
  }

  // Получение данных пользователя
  async getUser(): Promise<User | null> {
    try {
      const userJson = await AsyncStorage.getItem(USER_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('❌ Ошибка получения данных пользователя:', error);
      return null;
    }
  }

  // Проверка авторизации
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    const user = await this.getUser();
    return !!(token && user);
  }

  // Инициализация - восстановление токена при запуске приложения
  async initializeAuth(): Promise<User | null> {
    try {
      const token = await this.getToken();
      const user = await this.getUser();
      
      if (token && user) {
        // Устанавливаем токен в axios
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Проверяем валидность токена через API
        try {
          const response = await apiClient.get<{ user: User }>('/auth/me');
          const currentUser = response.data.user;
          
          // Обновляем данные пользователя если они изменились
          if (JSON.stringify(currentUser) !== JSON.stringify(user)) {
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(currentUser));
          }
          
          console.log('✅ Авторизация восстановлена:', currentUser.username);
          return currentUser;
        } catch (error) {
          // Токен недействителен - очищаем данные
          console.log('❌ Токен недействителен, требуется повторный вход');
          await this.logout();
          return null;
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Ошибка инициализации авторизации:', error);
      await this.logout();
      return null;
    }
  }

  // Получение информации о текущем пользователе с сервера
  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<{ user: User }>('/auth/me');
      const user = response.data.user;
      
      // Обновляем локальные данные
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      
      return user;
    } catch (error: any) {
      console.error('❌ Ошибка получения данных пользователя:', error.response?.data || error.message);
      throw error.response?.data || new Error('Не удалось получить данные пользователя');
    }
  }
}

// Экспортируем singleton
export const authService = new AuthService();
export default authService;