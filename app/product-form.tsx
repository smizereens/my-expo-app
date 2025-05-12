import { useState, useEffect, useCallback } from 'react';
import { View, Text, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Container } from '~/components/Container';
import { Header } from '~/components/Header';
import { Input } from '~/components/Input';
import { Button } from '~/components/Button';
import { Card } from '~/components/Card';
import { 
  fetchProductById, 
  createProduct, 
  updateProduct, 
  Product,
  ProductPayload
} from '~/services/productService';

export default function ProductFormScreen() {
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const isEditing = !!productId;

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  
  const [isLoading, setIsLoading] = useState(false); // Для загрузки существующего товара или сохранения
  const [error, setError] = useState<string | null>(null);

  const loadProductDetails = useCallback(async () => {
    if (isEditing && productId) {
      setIsLoading(true);
      setError(null);
      try {
        const product = await fetchProductById(productId);
        setName(product.name);
        setPrice(product.price.toString());
        setDescription(product.description || '');
      } catch (err: any) {
        setError(err.message || 'Не удалось загрузить данные товара.');
      } finally {
        setIsLoading(false);
      }
    }
  }, [isEditing, productId]);

  useEffect(() => {
    loadProductDetails();
  }, [loadProductDetails]); // Загружаем при первом рендере, если редактируем

  const handleSubmit = async () => {
    const parsedPrice = parseFloat(price);
    if (!name.trim()) {
      Alert.alert('Ошибка', 'Название товара не может быть пустым.');
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      Alert.alert('Ошибка', 'Цена должна быть положительным числом.');
      return;
    }

    const payload: ProductPayload = {
      name: name.trim(),
      price: parsedPrice,
      description: description.trim() || null,
    };

    setIsLoading(true);
    setError(null);

    try {
      if (isEditing && productId) {
        await updateProduct(productId, payload);
        Alert.alert('Успех', 'Товар успешно обновлен.');
      } else {
        await createProduct(payload);
        Alert.alert('Успех', 'Товар успешно создан.');
      }
      router.back(); // Возвращаемся на предыдущий экран (список товаров)
    } catch (submitError: any) {
      setError(submitError.message || `Не удалось ${isEditing ? 'обновить' : 'создать'} товар.`);
      Alert.alert('Ошибка', submitError.message || `Не удалось ${isEditing ? 'обновить' : 'создать'} товар.`);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading && isEditing && !name) { // Показываем индикатор только при начальной загрузке данных для редактирования
    return (
      <Container>
        <Header title={isEditing ? "Редактирование товара" : "Новый товар"} showBackButton />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      </Container>
    );
  }

  return (
    <Container scrollable keyboardAvoiding padded={false}>
      <Header title={isEditing ? "Редактирование товара" : "Новый товар"} showBackButton />
      <View className="p-4">
        <Card>
          <Input
            label="Название товара"
            placeholder="Введите название"
            value={name}
            onChangeText={setName}
            editable={!(isLoading && (name || !isEditing))} // Разрешено редактировать, если не идет сохранение/создание
          />
          <Input
            label="Цена (₽)"
            placeholder="Введите цену"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            editable={!(isLoading && (name || !isEditing))}
          />
          <Input
            label="Описание (необязательно)"
            placeholder="Введите описание товара"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            className="min-h-[100px] pt-2"
            editable={!(isLoading && (name || !isEditing))}
          />
        </Card>

        {error && <Text className="text-red-500 text-center my-3">{error}</Text>}

        <View className="mt-6 mb-10">
          <Button
            title={isLoading ? (isEditing ? "Сохранение..." : "Создание...") : (isEditing ? "Сохранить изменения" : "Создать товар")}
            onPress={handleSubmit}
            disabled={isLoading}
            loading={isLoading}
          />
        </View>
      </View>
    </Container>
  );
}