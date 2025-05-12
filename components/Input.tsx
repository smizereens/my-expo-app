import React, { forwardRef } from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

type InputProps = {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
} & TextInputProps;

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, helper, leftIcon, rightIcon, ...inputProps }, ref) => {
    const hasError = !!error;
    const borderColorClass = hasError 
      ? 'border-error' 
      : inputProps.editable === false 
        ? 'border-neutral-200' 
        : 'border-neutral-300 focus:border-primary-500';

    return (
      <View className="mb-4">
        {label && (
          <Text className="text-sm font-medium text-neutral-700 mb-1">{label}</Text>
        )}
        
        <View className={`flex-row items-center border rounded-lg bg-white ${borderColorClass}`}>
          {leftIcon && (
            <View className="pl-3 pr-2">
              {leftIcon}
            </View>
          )}
          
          <TextInput
            ref={ref}
            className={`flex-1 py-3 px-3 text-base text-neutral-900 ${inputProps.editable === false ? 'bg-neutral-100' : ''}`}
            placeholderTextColor="#9CA3AF"
            {...inputProps}
          />
          
          {rightIcon && (
            <View className="pr-3 pl-2">
              {rightIcon}
            </View>
          )}
        </View>
        
        {(error || helper) && (
          <Text 
            className={`text-xs mt-1 ${hasError ? 'text-error' : 'text-neutral-500'}`}
          >
            {error || helper}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';
