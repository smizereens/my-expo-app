// app/profile.tsx
import { useState } from 'react';
import { View, Text, TouchableOpacity, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '~/contexts/AuthContext';

import { Container } from '~/components/Container';
import { Header } from '~/components/Header';
import { Card } from '~/components/Card';
import { Button } from '~/components/Button';

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  action?: () => void;
  toggle?: boolean;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  requireAdmin?: boolean; // Для ограничения доступа к функциям
};

export default function ProfileScreen() {
  const { state, logout, refreshUser } = useAuth();
  const { user } = state;

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Функция получения роли на русском
  const getRoleDisplayName = (role: string) => {
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

  // Генерация инициалов для аватара
  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  // Генерация цвета аватара на основе роли
  const getAvatarColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500';
      case 'manager':
        return 'bg-blue-500';
      case 'employee':
        return 'bg-green-500';
      default:
        return 'bg-neutral-500';
    }
  };

  const menuItems: MenuItem[] = [
    {
      icon: 'person-outline',
      title: 'Личные данные',
      subtitle: 'Просмотр информации профиля',
      action: () => Alert.alert('Информация о профиле', `ID: ${user?.id}\nЛогин: ${user?.username}\nРоль: ${getRoleDisplayName(user?.role || '')}`),
    },
    {
      icon: 'key-outline',
      title: 'Сменить пароль',
      subtitle: 'Изменить пароль для входа',
      action: () => Alert.alert('Смена пароля', 'Функция смены пароля будет добавлена в следующих версиях'),
    },
    {
      icon: 'people-outline',
      title: 'Управление пользователями',
      subtitle: 'Создание и управление учетными записями',
      requireAdmin: true,
      action: () => Alert.alert('Управление пользователями', 'Функция управления пользователями будет добавлена в следующих версиях'),
    },
    {
      icon: 'notifications-outline',
      title: 'Уведомления',
      subtitle: 'Настройка уведомлений',
      toggle: true,
      value: notificationsEnabled,
      onValueChange: setNotificationsEnabled,
    },
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

  // Фильтруем пункты меню в зависимости от роли пользователя
  const filteredMenuItems = menuItems.filter(item => {
    if (item.requireAdmin) {
      return user?.role === 'admin';
    }
    return true;
  });

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

  // Если пользователь не загружен (не должно происходить на этом экране)
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
            {/* Аватар с инициалами */}
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
                  {getRoleDisplayName(user.role)}
                </Text>
              </View>
            </View>
            
            {/* Индикатор статуса (онлайн) */}
            <View className="w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          </View>
        </Card>
        
        {/* Меню настроек */}
        <Card className="mb-4">
          {filteredMenuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={item.action}
              disabled={item.toggle}
              className={`flex-row items-center justify-between py-3.5 ${
                index < filteredMenuItems.length - 1 ? 'border-b border-neutral-100' : ''
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
        
        {/* Дополнительная информация для разработки */}
        {__DEV__ && (
          <View className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <Text className="text-yellow-800 text-xs font-medium mb-1">Debug Info:</Text>
            <Text className="text-yellow-700 text-xs">
              User ID: {user.id}{'\n'}
              Username: {user.username}{'\n'}
              Role: {user.role}
            </Text>
          </View>
        )}
      </View>
    </Container>
  );
}
