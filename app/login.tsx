// app/login.tsx
import { useState } from 'react';
import { View, Text, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '~/contexts/AuthContext';

import { Container } from '~/components/Container';
import { Input } from '~/components/Input';
import { Button } from '~/components/Button';
import { Card } from '~/components/Card';

export default function LoginScreen() {
  const { login, state, clearError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    // Валидация
    if (!username.trim()) {
      Alert.alert('Ошибка', 'Введите логин');
      return;
    }
    
    if (!password.trim()) {
      Alert.alert('Ошибка', 'Введите пароль');
      return;
    }

    try {
      clearError(); // Очищаем предыдущие ошибки
      await login({ username: username.trim(), password: password.trim() });
      // После успешного логина AuthContext автоматически перенаправит на главный экран
    } catch (error: any) {
      // Ошибка уже обработана в AuthContext, показываем пользователю
      const errorMessage = error.error || error.message || 'Неизвестная ошибка';
      Alert.alert('Ошибка входа', errorMessage);
    }
  };

  // Быстрый вход для тестирования (только в development)
  const handleQuickLogin = () => {
    setUsername('admin');
    setPassword('admin123');
  };

  return (
    <Container backgroundColor="bg-primary-50">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1 justify-center"
      >
        <View className="px-6">
          {/* Логотип/Заголовок */}
          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-primary-600 rounded-full items-center justify-center mb-4 shadow-lg">
              <Ionicons name="storefront" size={32} color="white" />
            </View>
            <Text className="text-2xl font-bold text-neutral-900 mb-2">
              Управление заказами
            </Text>
            <Text className="text-neutral-600 text-center">
              Войдите в систему для продолжения работы
            </Text>
          </View>

          {/* Форма входа */}
          <Card className="mb-6">
            <Input
              label="Логин"
              placeholder="Введите ваш логин"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              leftIcon={<Ionicons name="person-outline" size={20} color="#6B7280" />}
              error={state.error && state.error.toLowerCase().includes('логин') ? state.error : undefined}
            />
            
            <Input
              label="Пароль"
              placeholder="Введите ваш пароль"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#6B7280" />}
              rightIcon={
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#6B7280"
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              error={state.error && !state.error.toLowerCase().includes('логин') ? state.error : undefined}
            />

            <Button
              title={state.isLoading ? "Вход в систему..." : "Войти"}
              onPress={handleLogin}
              loading={state.isLoading}
              disabled={state.isLoading}
              size="lg"
              className="mt-2"
              icon={!state.isLoading ? <Ionicons name="log-in" size={20} color="white" /> : undefined}
            />
          </Card>

          {/* Быстрый вход для разработки */}
          {__DEV__ && (
            <View className="items-center">
              <Text className="text-neutral-500 text-sm mb-2">Для тестирования:</Text>
              <Button
                title="Войти как администратор"
                variant="outlined"
                size="sm"
                onPress={handleQuickLogin}
                icon={<Ionicons name="flash" size={16} color="#4F46E5" />}
              />
            </View>
          )}

          {/* Информация */}
          <View className="mt-8 items-center">
            <Text className="text-neutral-400 text-xs text-center">
              Не удается войти? Обратитесь к администратору{'\n'}
              для получения учетных данных
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Container>
  );
}