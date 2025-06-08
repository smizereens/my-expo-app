// components/EmptyState.tsx
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionTitle?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionTitle,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center py-12">
      <Ionicons name={icon} size={48} color="#D1D5DB" />
      <Text className="text-lg font-semibold text-neutral-900 mt-4 mb-2">
        {title}
      </Text>
      <Text className="text-neutral-600 text-center mb-4">
        {description}
      </Text>
      {actionTitle && onAction && (
        <Button
          title={actionTitle}
          variant="outlined"
          size="sm"
          onPress={onAction}
        />
      )}
    </View>
  );
}