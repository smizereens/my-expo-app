import React from 'react';
import { View, Text, ViewProps } from 'react-native';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  rounded?: boolean;
} & ViewProps;

export const Badge = ({ 
  label, 
  variant = 'default', 
  size = 'md', 
  rounded = true,
  ...viewProps 
}: BadgeProps) => {
  const variantClasses = {
    default: 'bg-neutral-100 text-neutral-800',
    primary: 'bg-primary-100 text-primary-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-amber-100 text-amber-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-sky-100 text-sky-800',
  };

  const sizeClasses = {
    sm: 'py-0.5 px-2 text-xs',
    md: 'py-1 px-2.5 text-xs',
    lg: 'py-1 px-3 text-sm',
  };

  const roundedClass = rounded ? 'rounded-full' : 'rounded';
  const textColorClass = variantClasses[variant].split(' ')[1];
  const bgColorClass = variantClasses[variant].split(' ')[0];
  const textSizeClass = sizeClasses[size].split(' ')[2];

  return (
    <View 
      className={`${bgColorClass} ${roundedClass} ${sizeClasses[size].split(' ').slice(0, 2).join(' ')} ${viewProps.className || ''}`}
      {...viewProps}
    >
      <Text className={`${textColorClass} ${textSizeClass} font-medium text-center`}>
        {label}
      </Text>
    </View>
  );
};
