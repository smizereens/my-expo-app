import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, View, Text } from 'react-native';

type CardProps = {
  children: React.ReactNode;
  title?: string;
  onPress?: () => void;
  disabled?: boolean;
  footer?: React.ReactNode;
} & TouchableOpacityProps;

export const Card = ({ 
  children, 
  title, 
  onPress, 
  disabled = false, 
  footer,
  ...touchableProps 
}: CardProps) => {
  const CardContainer = onPress ? TouchableOpacity : View;

  return (
    <CardContainer
      disabled={disabled}
      onPress={onPress}
      {...touchableProps}
      className={`bg-white rounded-xl shadow-md shadow-neutral-200 overflow-hidden ${disabled ? 'opacity-70' : ''} ${touchableProps.className || ''}`}
    >
      {title && (
        <View className="p-4 border-b border-neutral-100">
          <Text className="font-semibold text-lg text-neutral-900">{title}</Text>
        </View>
      )}
      <View className="p-4">
        {children}
      </View>
      {footer && (
        <View className="px-4 py-3 bg-neutral-50 border-t border-neutral-100">
          {footer}
        </View>
      )}
    </CardContainer>
  );
};
