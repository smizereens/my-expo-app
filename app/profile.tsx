import { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
};

export default function ProfileScreen() {
  const [user] = useState({
    name: 'Иван Петров',
    email: 'ivan.petrov@example.com',
    role: 'Администратор',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const menuItems: MenuItem[] = [
    {
      icon: 'person-outline',
      title: 'Личные данные',
      subtitle: 'Изменить информацию профиля',
      action: () => Alert.alert('Личные данные', 'Здесь будет форма редактирования данных'),
    },
    {
      icon: 'lock-closed-outline',
      title: 'Безопасность',
      subtitle: 'Изменить пароль, 2FA',
      action: () => Alert.alert('Безопасность', 'Здесь будут настройки безопасности'),
    },
    {
      icon: 'notifications-outline',
      title: 'Уведомления',
      toggle: true,
      value: notificationsEnabled,
      onValueChange: setNotificationsEnabled,
    },
    // {
    //   icon: 'moon-outline',
    //   title: 'Темная тема',
    //   toggle: true,
    //   value: darkModeEnabled,
    //   onValueChange: setDarkModeEnabled,
    // },
    {
      icon: 'help-circle-outline',
      title: 'Поддержка',
      subtitle: 'Связаться с поддержкой',
      action: () => Alert.alert('Поддержка', 'Здесь будет форма обращения в поддержку'),
    },
    {
      icon: 'information-circle-outline',
      title: 'О приложении',
      subtitle: 'Версия 1.0.0',
      action: () => Alert.alert('О приложении', 'Приложение для управления заказами v1.0.0'),
    },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Выход из аккаунта',
      'Вы уверены, что хотите выйти?',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Выйти', style: 'destructive', onPress: () => {} },
      ]
    );
  };

  return (
    <Container scrollable padded={false}>
      <Header title="Профиль" />
      
      <View className="p-4">
        {/* Информация о пользователе */}
        <Card className="mb-4">
          <View className="flex-row items-center">
            <Image
              source={{ uri: user.avatar }}
              className="w-16 h-16 rounded-full"
            />
            
            <View className="ml-4 flex-1">
              <Text className="text-lg font-semibold text-neutral-900">{user.name}</Text>
              <Text className="text-neutral-500">{user.email}</Text>
              <View className="bg-primary-100 rounded-full px-2 py-0.5 self-start mt-1">
                <Text className="text-xs text-primary-700 font-medium">{user.role}</Text>
              </View>
            </View>
          </View>
        </Card>
        
        {/* Меню настроек */}
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
      </View>
    </Container>
  );
}
