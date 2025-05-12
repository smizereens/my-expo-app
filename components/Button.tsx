import { forwardRef } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';

type ButtonVariant = 'filled' | 'outlined' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  rounded?: boolean;
} & TouchableOpacityProps;

export const Button = forwardRef<View, ButtonProps>(
  (
    { 
      title, 
      variant = 'filled', 
      size = 'md', 
      loading = false, 
      icon, 
      rounded = true,
      disabled = false,
      ...touchableProps 
    }, 
    ref
  ) => {
    const variantClasses = {
      filled: 'bg-primary-600 border border-primary-600',
      outlined: 'bg-transparent border border-primary-600',
      ghost: 'bg-transparent',
    };

    const textVariantClasses = {
      filled: 'text-white',
      outlined: 'text-primary-600',
      ghost: 'text-primary-600',
    };

    const sizeClasses = {
      sm: 'py-2 px-3',
      md: 'py-3 px-4',
      lg: 'py-4 px-6',
    };

    const textSizeClasses = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    };
    
    const radiusClass = rounded ? 'rounded-full' : 'rounded-lg';
    const disabledClass = disabled ? 'opacity-50' : '';

    return (
      <TouchableOpacity
        ref={ref}
        disabled={disabled || loading}
        {...touchableProps}
        className={`${variantClasses[variant]} ${sizeClasses[size]} ${radiusClass} ${disabledClass} items-center justify-center flex-row shadow-sm active:opacity-80 ${touchableProps.className || ''}`}>
        
        {loading ? (
          <ActivityIndicator 
            size="small" 
            color={variant === 'filled' ? 'white' : '#4F46E5'} 
            className="mr-2" 
          />
        ) : icon ? (
          <View className="mr-2">{icon}</View>
        ) : null}
        
        <Text className={`${textVariantClasses[variant]} ${textSizeClasses[size]} font-semibold text-center`}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  }
);

Button.displayName = 'Button';
