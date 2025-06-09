// app/profile.tsx
import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Switch, Alert, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '~/contexts/AuthContext';
import { useFocusEffect } from 'expo-router';

import { Container } from '~/components/Container';
import { Header } from '~/components/Header';
import { Card } from '~/components/Card';
import { Button } from '~/components/Button';
import { Input } from '~/components/Input';
import { Badge } from '~/components/Badge';
import usersService, { User, UserRole, getRoleDisplayName, getRoleColor, getRoleIcon, canManageUsers, canViewUsers } from '~/services/usersService';

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  action?: () => void;
  toggle?: boolean;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  requireAdmin?: boolean;
};

type UserStats = {
  total: number;
  active: number;
  inactive: number;
  admins: number;
  managers: number;
  employees: number;
};

type CreateUserFormData = {
  username: string;
  password: string;
  role: UserRole;
};

type EditUserFormData = {
  username: string;
  role: UserRole;
  isActive: boolean;
  password: string;
};

export default function ProfileScreen() {
  const { state, logout, refreshUser } = useAuth();
  const { user } = state;

  // Состояния для управления пользователями
  const [users, setUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    total: 0, active: 0, inactive: 0, admins: 0, managers: 0, employees: 0
  });
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  // Состояния для фильтрации и поиска
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Состояния для модальных окон
  const [createUserModalVisible, setCreateUserModalVisible] = useState(false);
  const [editUserModalVisible, setEditUserModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Состояния для форм
  const [createUserForm, setCreateUserForm] = useState<CreateUserFormData>({
    username: '', password: '', role: 'employee'
  });
  const [editUserForm, setEditUserForm] = useState<EditUserFormData>({
    username: '', role: 'employee', isActive: true, password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Общие настройки
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Вспомогательные функции
  const getInitials = (username: string) => username.slice(0, 2).toUpperCase();
  const getAvatarColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'manager': return 'bg-blue-500';
      case 'employee': return 'bg-green-500';
      default: return 'bg-neutral-500';
    }
  };

  // Загрузка пользователей и статистики
  const loadUsers = useCallback(async () => {
    if (!user || !canViewUsers(user.role as UserRole)) return;

    setIsLoadingUsers(true);
    setUsersError(null);
    try {
      const params: any = {};
      if (selectedRole !== 'all') params.role = selectedRole;
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const [usersData] = await Promise.all([
        usersService.getUsers(),
      ]);

      // Фильтруем на клиенте для упрощения
      let filteredUsers = usersData;
      if (selectedRole !== 'all') {
        filteredUsers = filteredUsers.filter((u: User) => u.role === selectedRole);
      }
      if (selectedStatus !== 'all') {
        filteredUsers = filteredUsers.filter((u: User) => 
          selectedStatus === 'active' ? u.isActive : !u.isActive
        );
      }
      if (searchQuery.trim()) {
        filteredUsers = filteredUsers.filter((u: User) => 
          u.username.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setUsers(filteredUsers);
    } catch (error: any) {
      setUsersError(error.message || 'Не удалось загрузить пользователей');
    } finally {
      setIsLoadingUsers(false);
    }
  }, [user, selectedRole, selectedStatus, searchQuery]);

  // Перезагружаем при фокусе на экране
  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers])
  );

  // Обработчики для создания пользователя
  const handleCreateUser = async () => {
    if (!createUserForm.username.trim() || !createUserForm.password.trim()) {
      Alert.alert('Ошибка', 'Заполните все обязательные поля');
      return;
    }

    if (createUserForm.password.length < 6) {
      Alert.alert('Ошибка', 'Пароль должен содержать минимум 6 символов');
      return;
    }

    setIsSubmitting(true);
    try {
      await usersService.createUser({
        username: createUserForm.username.trim(),
        password: createUserForm.password,
        role: createUserForm.role
      });

      Alert.alert('Успех', `Пользователь "${createUserForm.username}" создан`);
      setCreateUserModalVisible(false);
      setCreateUserForm({ username: '', password: '', role: 'employee' });
      loadUsers();
    } catch (error: any) {
      Alert.alert('Ошибка создания', error.message || 'Не удалось создать пользователя');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Обработчики для редактирования пользователя
  const handleEditUser = (userToEdit: User) => {
    setSelectedUser(userToEdit);
    setEditUserForm({
      username: userToEdit.username,
      role: userToEdit.role as UserRole,
      isActive: userToEdit.isActive,
      password: ''
    });
    setEditUserModalVisible(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser || !editUserForm.username.trim()) {
      Alert.alert('Ошибка', 'Заполните все обязательные поля');
      return;
    }

    if (editUserForm.password && editUserForm.password.length < 6) {
      Alert.alert('Ошибка', 'Пароль должен содержать минимум 6 символов');
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData: any = {
        username: editUserForm.username.trim(),
        role: editUserForm.role,
        isActive: editUserForm.isActive
      };

      if (editUserForm.password.trim()) {
        updateData.password = editUserForm.password;
      }

      await usersService.updateUser(selectedUser.id, updateData);
      
      Alert.alert('Успех', `Пользователь "${editUserForm.username}" обновлен`);
      setEditUserModalVisible(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error: any) {
      Alert.alert('Ошибка обновления', error.message || 'Не удалось обновить пользователя');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Переключение статуса пользователя
  const handleToggleUserStatus = async (userToToggle: User) => {
    const action = userToToggle.isActive ? 'деактивировать' : 'активировать';
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} пользователя`,
      `Вы уверены, что хотите ${action} пользователя "${userToToggle.username}"?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          onPress: async () => {
            try {
              await usersService.toggleUserStatus(userToToggle.id, !userToToggle.isActive);
              Alert.alert('Успех', `Пользователь "${userToToggle.username}" ${userToToggle.isActive ? 'деактивирован' : 'активирован'}`);
              loadUsers();
            } catch (error: any) {
              Alert.alert('Ошибка', error.message || `Не удалось ${action} пользователя`);
            }
          }
        }
      ]
    );
  };

  // Основные пункты меню профиля
  const menuItems: MenuItem[] = [
    {
      icon: 'person-outline',
      title: 'Личные данные',
      subtitle: 'Просмотр информации профиля',
      action: () => Alert.alert('Информация о профиле', `ID: ${user?.id}\nЛогин: ${user?.username}\nРоль: ${getRoleDisplayName(user?.role as UserRole)}`),
    },
    // {
    //   icon: 'key-outline',
    //   title: 'Сменить пароль',
    //   subtitle: 'Изменить пароль для входа',
    //   action: () => Alert.alert('Смена пароля', 'Функция смены пароля будет добавлена в следующих версиях'),
    // },
    // {
    //   icon: 'notifications-outline',
    //   title: 'Уведомления',
    //   subtitle: 'Настройка уведомлений',
    //   toggle: true,
    //   value: notificationsEnabled,
    //   onValueChange: setNotificationsEnabled,
    // },
    {
      icon: 'refresh-outline',
      title: 'Обновить данные',
      subtitle: 'Синхронизация с сервером',
      action: async () => {
        try {
          await refreshUser();
          Alert.alert('Успех', 'Данные обновлены');
        } catch (error) {
          Alert.alert('Ошибка', 'Не удалось обновить данные');
        }
      },
    },
    {
      icon: 'help-circle-outline',
      title: 'Поддержка',
      subtitle: 'Связаться с поддержкой',
      action: () => Alert.alert('Поддержка', 'Email: support@company.com\nТелефон: +7 (xxx) xxx-xx-xx'),
    },
    {
      icon: 'information-circle-outline',
      title: 'О приложении',
      subtitle: 'Версия 1.0.0',
      action: () => Alert.alert('О приложении', 'Приложение для управления заказами\nВерсия 1.0.0\n\nРазработано для оптимизации работы с заказами в малом бизнесе.'),
    },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Выход из аккаунта',
      'Вы уверены, что хотите выйти из системы?',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Выйти', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Ошибка при выходе:', error);
            }
          }
        },
      ]
    );
  };

  // Компонент карточки пользователя
  const UserCard = ({ user: userItem }: { user: User }) => (
    <View className="bg-white rounded-xl shadow-sm p-4 mb-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className={`w-12 h-12 rounded-full items-center justify-center ${getAvatarColor(userItem.role)} mr-3`}>
            <Text className="text-white text-sm font-bold">
              {getInitials(userItem.username)}
            </Text>
          </View>
          
          <View className="flex-1">
            <Text className="text-base font-semibold text-neutral-900">{userItem.username}</Text>
            <View className="flex-row items-center mt-1">
              <Ionicons name={getRoleIcon(userItem.role as UserRole)} size={14} color="#6B7280" />
              <Text className="text-xs text-neutral-500 ml-1">{getRoleDisplayName(userItem.role as UserRole)}</Text>
            </View>
          </View>
        </View>

        <View className="flex-row items-center">
          <Badge 
            label={userItem.isActive ? 'Активен' : 'Неактивен'} 
            variant={userItem.isActive ? 'success' : 'error'} 
            size="sm" 
            className="mr-2"
          />
          
          {canManageUsers(user?.role as UserRole) && (
            <View className="flex-row">
              <TouchableOpacity onPress={() => handleEditUser(userItem)} className="p-2">
                <Ionicons name="pencil-outline" size={18} color="#4F46E5" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleToggleUserStatus(userItem)} className="p-2">
                <Ionicons 
                  name={userItem.isActive ? "pause-circle-outline" : "play-circle-outline"} 
                  size={18} 
                  color={userItem.isActive ? "#F59E0B" : "#10B981"} 
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  if (!user) {
    return (
      <Container>
        <Header title="Профиль" />
        <View className="flex-1 items-center justify-center">
          <Text className="text-neutral-500">Загрузка профиля...</Text>
        </View>
      </Container>
    );
  }

  return (
    <Container scrollable padded={false}>
      <Header title="Профиль" />
      
      <View className="p-4">
        {/* Информация о пользователе */}
        <Card className="mb-4">
          <View className="flex-row items-center">
            <View className={`w-16 h-16 rounded-full items-center justify-center ${getAvatarColor(user.role)}`}>
              <Text className="text-white text-lg font-bold">
                {getInitials(user.username)}
              </Text>
            </View>
            
            <View className="ml-4 flex-1">
              <Text className="text-lg font-semibold text-neutral-900">{user.username}</Text>
              <Text className="text-neutral-500 text-sm">ID: {user.id.slice(0, 8)}...</Text>
              <View className="bg-primary-100 rounded-full px-2 py-0.5 self-start mt-1">
                <Text className="text-xs text-primary-700 font-medium">
                  {getRoleDisplayName(user.role as UserRole)}
                </Text>
              </View>
            </View>
            
            <View className="w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          </View>
        </Card>
        
        {/* Управление пользователями (только для админов и менеджеров) */}
        {canViewUsers(user.role as UserRole) && (
          <Card title="Управление пользователями" className="mb-4">
            {/* Статистика */}
            {/* <View className="flex-row flex-wrap -mx-2 mb-4">
              <View className="w-1/3 px-2 mb-2">
                <View className="bg-blue-50 rounded-lg p-3">
                  <Text className="text-blue-600 text-xs font-medium">Всего</Text>
                  <Text className="text-blue-900 text-lg font-bold">{userStats.total}</Text>
                </View>
              </View>
              <View className="w-1/3 px-2 mb-2">
                <View className="bg-green-50 rounded-lg p-3">
                  <Text className="text-green-600 text-xs font-medium">Активных</Text>
                  <Text className="text-green-900 text-lg font-bold">{userStats.active}</Text>
                </View>
              </View>
              <View className="w-1/3 px-2 mb-2">
                <View className="bg-red-50 rounded-lg p-3">
                  <Text className="text-red-600 text-xs font-medium">Неактивных</Text>
                  <Text className="text-red-900 text-lg font-bold">{userStats.inactive}</Text>
                </View>
              </View>
            </View> */}

            {/* Кнопка создания пользователя */}
            {canManageUsers(user.role as UserRole) && (
              <Button
                title="Создать пользователя"
                variant="filled"
                size="sm"
                onPress={() => setCreateUserModalVisible(true)}
                icon={<Ionicons name="person-add" size={16} color="white" />}
                className="mb-4"
              />
            )}

            {/* Фильтры */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-neutral-700 mb-2">Фильтры</Text>
              
              <Input
                placeholder="Поиск по логину..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                leftIcon={<Ionicons name="search" size={16} color="#6B7280" />}
                className="mb-2"
              />

              <View className="flex-row space-x-2">
                <View className="flex-1">
                  <Text className="text-xs text-neutral-600 mb-1">Роль</Text>
                  <View className="bg-white border border-neutral-300 rounded-lg">
                    {/* Упрощенный селектор ролей */}
                    <TouchableOpacity 
                      className="p-3"
                      onPress={() => {
                        Alert.alert('Фильтр по роли', 'Выберите роль', [
                          { text: 'Все', onPress: () => setSelectedRole('all') },
                          { text: 'Админы', onPress: () => setSelectedRole('admin') },
                          { text: 'Менеджеры', onPress: () => setSelectedRole('manager') },
                          { text: 'Сотрудники', onPress: () => setSelectedRole('employee') },
                          { text: 'Отмена', style: 'cancel' }
                        ]);
                      }}
                    >
                      <Text className="text-neutral-900">
                        {selectedRole === 'all' ? 'Все роли' : getRoleDisplayName(selectedRole)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="flex-1">
                  <Text className="text-xs text-neutral-600 mb-1">Статус</Text>
                  <View className="bg-white border border-neutral-300 rounded-lg">
                    <TouchableOpacity 
                      className="p-3"
                      onPress={() => {
                        Alert.alert('Фильтр по статусу', 'Выберите статус', [
                          { text: 'Все', onPress: () => setSelectedStatus('all') },
                          { text: 'Активные', onPress: () => setSelectedStatus('active') },
                          { text: 'Неактивные', onPress: () => setSelectedStatus('inactive') },
                          { text: 'Отмена', style: 'cancel' }
                        ]);
                      }}
                    >
                      <Text className="text-neutral-900">
                        {selectedStatus === 'all' ? 'Все' : 
                         selectedStatus === 'active' ? 'Активные' : 'Неактивные'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            {/* Список пользователей */}
            {isLoadingUsers ? (
              <ActivityIndicator size="large" color="#4F46E5" className="my-4" />
            ) : usersError ? (
              <View className="items-center py-4">
                <Text className="text-red-500 text-center">{usersError}</Text>
                <Button title="Повторить" variant="outlined" size="sm" onPress={loadUsers} className="mt-2" />
              </View>
            ) : users.length > 0 ? (
              <View>
                <Text className="text-sm font-medium text-neutral-700 mb-2">
                  Пользователи ({users.length})
                </Text>
                {users.map((userItem) => (
                  <UserCard key={userItem.id} user={userItem} />
                ))}
              </View>
            ) : (
              <Text className="text-neutral-500 text-center py-4">
                Пользователи не найдены
              </Text>
            )}
          </Card>
        )}
        
        {/* Настройки профиля */}
        <Card className="mb-4">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={item.action}
              disabled={item.toggle}
              className={`flex-row items-center justify-between py-3.5 ${
                index < menuItems.length - 1 ? 'border-b border-neutral-100' : ''
              }`}
            >
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-full bg-neutral-100 items-center justify-center mr-3">
                  <Ionicons name={item.icon} size={18} color="#4B5563" />
                </View>
                
                <View>
                  <Text className="text-neutral-900 font-medium">{item.title}</Text>
                  {item.subtitle && (
                    <Text className="text-neutral-500 text-xs">{item.subtitle}</Text>
                  )}
                </View>
              </View>
              
              {item.toggle ? (
                <Switch
                  value={item.value}
                  onValueChange={item.onValueChange}
                  trackColor={{ false: '#D1D5DB', true: '#818CF8' }}
                  thumbColor={item.value ? '#4F46E5' : '#F9FAFB'}
                />
              ) : (
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              )}
            </TouchableOpacity>
          ))}
        </Card>
        
        {/* Кнопка выхода */}
        <Button
          title="Выйти из аккаунта"
          variant="outlined"
          onPress={handleLogout}
          icon={<Ionicons name="log-out-outline" size={18} color="#4F46E5" />}
        />
        
        {/* Debug Info */}
        {/* {__DEV__ && (
          <View className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <Text className="text-yellow-800 text-xs font-medium mb-1">Debug Info:</Text>
            <Text className="text-yellow-700 text-xs">
              User ID: {user.id}{'\n'}
              Username: {user.username}{'\n'}
              Role: {user.role}
            </Text>
          </View>
        )} */}
      </View>

      {/* Модальное окно создания пользователя */}
      <Modal
        visible={createUserModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCreateUserModalVisible(false)}
      >
        <Container>
          <Header 
            title="Создать пользователя" 
            showBackButton 
            rightAction={
              <TouchableOpacity onPress={() => setCreateUserModalVisible(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            }
          />
          
          <View className="p-4">
            <Card>
              <Input
                label="Логин"
                placeholder="Введите логин"
                value={createUserForm.username}
                onChangeText={(text) => setCreateUserForm(prev => ({ ...prev, username: text }))}
                autoCapitalize="none"
                leftIcon={<Ionicons name="person-outline" size={20} color="#6B7280" />}
              />
              
              <Input
                label="Пароль"
                placeholder="Минимум 6 символов"
                value={createUserForm.password}
                onChangeText={(text) => setCreateUserForm(prev => ({ ...prev, password: text }))}
                secureTextEntry
                leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#6B7280" />}
              />

              <View className="mb-4">
                <Text className="text-sm font-medium text-neutral-700 mb-2">Роль</Text>
                <View className="flex-row space-x-2">
                  {(['employee', 'manager', 'admin'] as UserRole[]).map((role) => (
                    <TouchableOpacity
                      key={role}
                      onPress={() => setCreateUserForm(prev => ({ ...prev, role }))}
                      className={`flex-1 p-3 rounded-lg border ${
                        createUserForm.role === role 
                          ? 'border-primary-600 bg-primary-50' 
                          : 'border-neutral-300 bg-white'
                      }`}
                    >
                      <Text className={`text-center text-sm font-medium ${
                        createUserForm.role === role ? 'text-primary-700' : 'text-neutral-700'
                      }`}>
                        {getRoleDisplayName(role)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </Card>
            
            <View className="mt-4 space-y-3">
              <Button
                title="Создать пользователя"
                onPress={handleCreateUser}
                loading={isSubmitting}
                disabled={isSubmitting}
                icon={<Ionicons name="person-add" size={20} color="white" />}
              />
              <Button
                title="Отмена"
                variant="outlined"
                onPress={() => setCreateUserModalVisible(false)}
                disabled={isSubmitting}
              />
            </View>
          </View>
        </Container>
      </Modal>

      {/* Модальное окно редактирования пользователя */}
      <Modal
        visible={editUserModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditUserModalVisible(false)}
      >
        <Container>
          <Header 
            title="Редактировать пользователя" 
            showBackButton 
            rightAction={
              <TouchableOpacity onPress={() => setEditUserModalVisible(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            }
          />
          
          <View className="p-4">
            <Card>
              <Input
                label="Логин"
                placeholder="Введите логин"
                value={editUserForm.username}
                onChangeText={(text) => setEditUserForm(prev => ({ ...prev, username: text }))}
                autoCapitalize="none"
                leftIcon={<Ionicons name="person-outline" size={20} color="#6B7280" />}
              />
              
              <Input
                label="Новый пароль (оставьте пустым, чтобы не менять)"
                placeholder="Минимум 6 символов"
                value={editUserForm.password}
                onChangeText={(text) => setEditUserForm(prev => ({ ...prev, password: text }))}
                secureTextEntry
                leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#6B7280" />}
              />

              <View className="mb-4">
                <Text className="text-sm font-medium text-neutral-700 mb-2">Роль</Text>
                <View className="flex-row space-x-2">
                  {(['employee', 'manager', 'admin'] as UserRole[]).map((role) => (
                    <TouchableOpacity
                      key={role}
                      onPress={() => setEditUserForm(prev => ({ ...prev, role }))}
                      className={`flex-1 p-3 rounded-lg border ${
                        editUserForm.role === role 
                          ? 'border-primary-600 bg-primary-50' 
                          : 'border-neutral-300 bg-white'
                      }`}
                    >
                      <Text className={`text-center text-sm font-medium ${
                        editUserForm.role === role ? 'text-primary-700' : 'text-neutral-700'
                      }`}>
                        {getRoleDisplayName(role)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View className="flex-row items-center justify-between py-3">
                <Text className="text-sm font-medium text-neutral-700">Активный пользователь</Text>
                <Switch
                  value={editUserForm.isActive}
                  onValueChange={(value) => setEditUserForm(prev => ({ ...prev, isActive: value }))}
                  trackColor={{ false: '#D1D5DB', true: '#818CF8' }}
                  thumbColor={editUserForm.isActive ? '#4F46E5' : '#F9FAFB'}
                />
              </View>
            </Card>
            
            <View className="mt-4 space-y-3">
              <Button
                title="Сохранить изменения"
                onPress={handleUpdateUser}
                loading={isSubmitting}
                disabled={isSubmitting}
                icon={<Ionicons name="checkmark" size={20} color="white" />}
              />
              <Button
                title="Отмена"
                variant="outlined"
                onPress={() => setEditUserModalVisible(false)}
                disabled={isSubmitting}
              />
            </View>
          </View>
        </Container>
      </Modal>
    </Container>
  );
}
