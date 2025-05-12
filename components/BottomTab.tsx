import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type TabItem = {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: string;
};

const tabs: TabItem[] = [
  { name: 'home', label: 'Главная', icon: 'home-outline', href: '/' },
  { name: 'orders', label: 'Заказы', icon: 'list-outline', href: '/orders' },
  { name: 'new', label: 'Новый', icon: 'add-circle', href: '/new-order' },
  { name: 'products', label: 'Товары', icon: 'cube-outline', href: '/manage-products' }, // Заменяем Статистику на Товары
  { name: 'profile', label: 'Профиль', icon: 'person-outline', href: '/profile' },
];

export const BottomTab = () => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  
  return (
    <View 
      className="flex-row bg-white border-t border-neutral-200"
      style={{ paddingBottom: insets.bottom }}
    >
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        // Для кнопки "Новый" используем другой стиль
        const isNewButton = tab.name === 'new';
        
        return (
          <TouchableOpacity
            key={tab.name}
            onPress={() => router.push(tab.href as any)} // Утверждение типа для href
            className={`flex-1 items-center ${isNewButton ? 'pt-1' : 'py-2'}`}
            accessibilityLabel={tab.label}
            activeOpacity={0.7}
          >
            {isNewButton ? (
              <View className="items-center">
                <View className="bg-primary-600 rounded-full p-3 -mt-5 shadow-md shadow-primary-300">
                  <Ionicons name={tab.icon} size={24} color="white" />
                </View>
                <Text className="text-[10px] mt-1 text-neutral-600">{tab.label}</Text>
              </View>
            ) : (
              <>
                <Ionicons
                  name={isActive ? tab.icon.replace('-outline', '') as keyof typeof Ionicons.glyphMap : tab.icon} // Утверждение типа для иконки
                  size={22}
                  color={isActive ? '#4F46E5' : '#6B7280'}
                />
                <Text className={`text-[10px] mt-1 ${isActive ? 'text-primary-600 font-medium' : 'text-neutral-600'}`}>
                  {tab.label}
                </Text>
              </>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
