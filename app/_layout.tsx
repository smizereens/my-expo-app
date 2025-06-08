// app/_layout.tsx
import '../global.css';

import { Slot } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomTab } from '~/components/BottomTab';
import { usePathname } from 'expo-router';
import { AuthProvider, useAuth } from '~/contexts/AuthContext';
import LoginScreen from './login';

// Экраны, на которых НЕ нужно показывать BottomTab
const noTabScreens = ['/details', '/order-details', '/login'];

// Компонент для проверки авторизации
function AuthenticatedLayout() {
  const { state } = useAuth();
  const pathname = usePathname();
  const showBottomTab = !noTabScreens.some(screen => pathname.includes(screen));

  // Показываем загрузку при инициализации
  if (state.isLoading) {
    return (
      <SafeAreaProvider>
        <View className="flex-1 bg-neutral-50 items-center justify-center">
          <StatusBar style="dark" />
          <ActivityIndicator size="large" color="#4F46E5" />
          <View className="mt-4">
            <Text className="text-neutral-600 text-base">Загрузка приложения...</Text>
          </View>
        </View>
      </SafeAreaProvider>
    );
  }

  // Если пользователь не авторизован, показываем экран входа
  if (!state.isAuthenticated) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <LoginScreen />
      </SafeAreaProvider>
    );
  }

  // Пользователь авторизован - показываем основное приложение
  return (
    <SafeAreaProvider>
      <View className="flex-1 bg-neutral-50">
        <StatusBar style="dark" />
        <View className="flex-1">
          <Slot />
        </View>
        {showBottomTab && <BottomTab />}
      </View>
    </SafeAreaProvider>
  );
}

// Основной компонент Layout
export default function Layout() {
  return (
    <AuthProvider>
      <AuthenticatedLayout />
    </AuthProvider>
  );
}