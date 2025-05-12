import { useLocalSearchParams } from 'expo-router';
import { View, Text } from 'react-native';

import { Container } from '~/components/Container';
import { Header } from '~/components/Header';
import { Card } from '~/components/Card';

export default function Details() {
  const { name } = useLocalSearchParams<{ name: string }>();

  return (
    <Container padded={false}>
      <Header title="Детали" showBackButton />
      
      <View className="p-4">
        <Card>
          <Text className="text-lg font-semibold text-neutral-900">
            Детали для пользователя {name}
          </Text>
          <Text className="text-neutral-600 mt-2">
            Это тестовая страница для демонстрации навигации.
          </Text>
        </Card>
      </View>
    </Container>
  );
}
