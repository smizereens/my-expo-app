import React from 'react';
import { View, Text, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type HeaderProps = {
  title: string;
  showBackButton?: boolean;
  rightAction?: React.ReactNode;
  transparent?: boolean;
};

export const Header = ({ 
  title, 
  showBackButton = false, 
  rightAction, 
  transparent = false 
}: HeaderProps) => {
  const insets = useSafeAreaInsets();
  const paddingTop = Platform.OS === 'ios' ? insets.top : insets.top + (StatusBar.currentHeight || 0);

  return (
    <View 
      className={`px-4 ${transparent ? '' : 'bg-white shadow-sm shadow-neutral-200'}`}
      style={{ paddingTop }}
    >
      <StatusBar 
        barStyle={transparent ? 'light-content' : 'dark-content'} 
        backgroundColor="transparent" 
        translucent 
      />
      
      <View className="flex-row items-center justify-between h-14">
        <View className="flex-row items-center">
          {showBackButton && (
            <TouchableOpacity 
              onPress={() => router.back()} 
              className="mr-3 p-2 -ml-2"
            >
              <Ionicons name="chevron-back" size={24} color="#374151" />
            </TouchableOpacity>
          )}
          
          <Text className="text-lg font-semibold text-neutral-900">{title}</Text>
        </View>
        
        {rightAction && (
          <View>{rightAction}</View>
        )}
      </View>
    </View>
  );
};
