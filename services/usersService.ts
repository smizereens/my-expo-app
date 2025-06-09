// services/usersService.ts
import apiClient from './api';

export type UserRole = 'admin' | 'manager' | 'employee';

export interface User {
  id: string;
  username: string;
  email?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface CreateUserData {
  username: string;
  email?: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
  password?: string;
}

class UsersService {
  // Получить всех пользователей (только для админов и менеджеров)
  async getUsers(params?: { role?: UserRole; status?: string; search?: string }): Promise<User[]> {
    try {
      const response = await apiClient.get<User[]>('/users', { params });
      console.log('✅ Пользователи загружены:', response.data.length);
      return response.data;
    } catch (error: any) {
      console.error('❌ Ошибка загрузки пользователей:', error.response?.data || error.message);
      throw error.response?.data || new Error('Не удалось загрузить пользователей');
    }
  }

  // Создать нового пользователя
  async createUser(userData: CreateUserData): Promise<User> {
    try {
      const response = await apiClient.post<User>('/users', userData);
      console.log('✅ Пользователь создан:', response.data.username);
      return response.data;
    } catch (error: any) {
      console.error('❌ Ошибка создания пользователя:', error.response?.data || error.message);
      throw error.response?.data || new Error('Не удалось создать пользователя');
    }
  }

  // Обновить пользователя
  async updateUser(id: string, userData: UpdateUserData): Promise<User> {
    try {
      const response = await apiClient.put<User>(`/users/${id}`, userData);
      console.log('✅ Пользователь обновлен:', response.data.username);
      return response.data;
    } catch (error: any) {
      console.error('❌ Ошибка обновления пользователя:', error.response?.data || error.message);
      throw error.response?.data || new Error('Не удалось обновить пользователя');
    }
  }

  // Изменить роль пользователя
  async updateUserRole(id: string, role: UserRole): Promise<User> {
    return this.updateUser(id, { role });
  }

  // Активировать/деактивировать пользователя
  async toggleUserStatus(id: string, isActive: boolean): Promise<User> {
    return this.updateUser(id, { isActive });
  }

  // Удалить пользователя
  async deleteUser(id: string): Promise<void> {
    try {
      await apiClient.delete(`/users/${id}`);
      console.log('✅ Пользователь удален:', id);
    } catch (error: any) {
      console.error('❌ Ошибка удаления пользователя:', error.response?.data || error.message);
      throw error.response?.data || new Error('Не удалось удалить пользователя');
    }
  }
}

// Утилиты для работы с ролями
export const getRoleDisplayName = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return 'Администратор';
    case 'manager':
      return 'Менеджер';
    case 'employee':
      return 'Сотрудник';
    default:
      return role;
  }
};

export const getRoleColor = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return 'text-red-600 bg-red-100';
    case 'manager':
      return 'text-blue-600 bg-blue-100';
    case 'employee':
      return 'text-green-600 bg-green-100';
    default:
      return 'text-neutral-600 bg-neutral-100';
  }
};

export const getRoleIcon = (role: UserRole): keyof typeof import('@expo/vector-icons').Ionicons.glyphMap => {
  switch (role) {
    case 'admin':
      return 'shield-checkmark';
    case 'manager':
      return 'briefcase';
    case 'employee':
      return 'person';
    default:
      return 'person';
  }
};

// Проверка прав доступа
export const canManageUsers = (userRole: UserRole): boolean => {
  return userRole === 'admin';
};

export const canViewUsers = (userRole: UserRole): boolean => {
  return userRole === 'admin' || userRole === 'manager';
};

// Экспортируем singleton
export const usersService = new UsersService();
export default usersService;