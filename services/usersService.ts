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

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  admins: number;
  managers: number;
  employees: number;
}

class UsersService {
  // Получить всех пользователей (только для админов и менеджеров)
  async getUsers(): Promise<User[]> {
    try {
      const response = await apiClient.get<User[]>('/users');
      console.log('✅ Пользователи загружены:', response.data.length);
      return response.data;
    } catch (error: any) {
      console.error('❌ Ошибка загрузки пользователей:', error.response?.data || error.message);
      throw error.response?.data || new Error('Не удалось загрузить пользователей');
    }
  }

  // Получить пользователя по ID
  async getUser(id: string): Promise<User> {
    try {
      const response = await apiClient.get<User>(`/users/${id}`);
      console.log('✅ Пользователь загружен:', response.data.username);
      return response.data;
    } catch (error: any) {
      console.error('❌ Ошибка загрузки пользователя:', error.response?.data || error.message);
      throw error.response?.data || new Error('Не удалось загрузить пользователя');
    }
  }

  // Создать нового пользователя (только для админов)
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

  // Изменить роль пользователя (только для админов)
  async updateUserRole(id: string, role: UserRole): Promise<User> {
    return this.updateUser(id, { role });
  }

  // Активировать/деактивировать пользователя (только для админов)
  async toggleUserStatus(id: string, isActive: boolean): Promise<User> {
    return this.updateUser(id, { isActive });
  }

  // Сбросить пароль пользователя (только для админов)
  async resetUserPassword(id: string, newPassword: string): Promise<void> {
    try {
      await apiClient.post(`/users/${id}/reset-password`, { password: newPassword });
      console.log('✅ Пароль пользователя сброшен:', id);
    } catch (error: any) {
      console.error('❌ Ошибка сброса пароля:', error.response?.data || error.message);
      throw error.response?.data || new Error('Не удалось сбросить пароль');
    }
  }

  // Удалить пользователя (только для админов, осторожно!)
  async deleteUser(id: string): Promise<void> {
    try {
      await apiClient.delete(`/users/${id}`);
      console.log('✅ Пользователь удален:', id);
    } catch (error: any) {
      console.error('❌ Ошибка удаления пользователя:', error.response?.data || error.message);
      throw error.response?.data || new Error('Не удалось удалить пользователя');
    }
  }

  // Получить статистику пользователей
  async getUsersStats(): Promise<UserStats> {
    try {
      const users = await this.getUsers();
      
      const stats: UserStats = {
        total: users.length,
        active: users.filter(u => u.isActive).length,
        inactive: users.filter(u => !u.isActive).length,
        admins: users.filter(u => u.role === 'admin').length,
        managers: users.filter(u => u.role === 'manager').length,
        employees: users.filter(u => u.role === 'employee').length,
      };

      console.log('✅ Статистика пользователей:', stats);
      return stats;
    } catch (error: any) {
      console.error('❌ Ошибка загрузки статистики пользователей:', error.response?.data || error.message);
      throw error.response?.data || new Error('Не удалось загрузить статистику');
    }
  }

  // Поиск пользователей
  async searchUsers(query: string): Promise<User[]> {
    try {
      const response = await apiClient.get<User[]>(`/users/search?q=${encodeURIComponent(query)}`);
      console.log('✅ Поиск пользователей:', response.data.length, 'результатов для:', query);
      return response.data;
    } catch (error: any) {
      console.error('❌ Ошибка поиска пользователей:', error.response?.data || error.message);
      throw error.response?.data || new Error('Не удалось выполнить поиск');
    }
  }

  // Получить пользователей по роли
  async getUsersByRole(role: UserRole): Promise<User[]> {
    try {
      const response = await apiClient.get<User[]>(`/users?role=${role}`);
      console.log('✅ Пользователи по роли загружены:', response.data.length, 'для роли:', role);
      return response.data;
    } catch (error: any) {
      console.error('❌ Ошибка загрузки пользователей по роли:', error.response?.data || error.message);
      throw error.response?.data || new Error('Не удалось загрузить пользователей');
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

export const canEditUser = (currentUserRole: UserRole, targetUserRole: UserRole): boolean => {
  // Только админы могут редактировать пользователей
  if (currentUserRole !== 'admin') return false;
  
  // Админы могут редактировать всех
  return true;
};

export const canDeleteUser = (currentUserRole: UserRole, targetUserRole: UserRole): boolean => {
  // Только админы могут удалять пользователей
  if (currentUserRole !== 'admin') return false;
  
  // Нельзя удалять других админов (безопасность)
  if (targetUserRole === 'admin') return false;
  
  return true;
};

// Экспортируем singleton
export const usersService = new UsersService();
export default usersService;