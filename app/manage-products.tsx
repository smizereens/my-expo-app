import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Container } from '~/components/Container';
import { Header } from '~/components/Header';
import { Button } from '~/components/Button';
import { fetchProducts, deleteProduct, Product } from '~/services/productService';

// Компонент для отображения одного товара в списке
const ProductListItem = ({ item, onEdit, onDelete }: { item: Product, onEdit: () => void, onDelete: () => void }) => (
  <View className="bg-white p-4 mb-3 rounded-lg shadow-sm flex-row items-center justify-between">
    <View className="flex-1">
      <Text className="text-base font-semibold text-neutral-900">{item.name}</Text>
      <Text className="text-sm text-neutral-600">{item.price.toLocaleString()} ₽</Text>
      {item.description && <Text className="text-xs text-neutral-500 mt-1" numberOfLines={2}>{item.description}</Text>}
    </View>
    <View className="flex-row items-center">
      <TouchableOpacity onPress={onEdit} className="p-2">
        <Ionicons name="pencil-outline" size={22} color="#4F46E5" />
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} className="p-2 ml-2">
        <Ionicons name="trash-outline" size={22} color="#EF4444" />
      </TouchableOpacity>
    </View>
  </View>
);

export default function ManageProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'Не удалось загрузить список товаров.');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Используем useFocusEffect для перезагрузки данных при каждом фокусе на экране
  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts])
  );

  const handleDeleteProduct = (productId: string, productName: string) => {
    Alert.alert(
      'Удалить товар',
      `Вы уверены, что хотите удалить товар "${productName}"? Это действие нельзя будет отменить.`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(productId);
              Alert.alert('Успех', `Товар "${productName}" успешно удален.`);
              loadProducts(); // Перезагружаем список
            } catch (deleteError: any) {
              let errorMessage = 'Не удалось удалить товар.';
              let errorTitle = 'Ошибка удаления';

              if (deleteError.isAxiosError && deleteError.response) {
                // Ошибка от Axios с ответом сервера
                const serverErrorMessage = deleteError.response.data?.error || deleteError.message;
                const serverErrorDetails = deleteError.response.data?.details;
                
                if (deleteError.response.status === 400 && serverErrorMessage && serverErrorMessage.startsWith("Невозможно удалить товар")) {
                  errorTitle = 'Информация'; // Меняем заголовок для ожидаемого случая
                  errorMessage = serverErrorMessage + (serverErrorDetails ? `\nДетали: ${serverErrorDetails}` : '');
                } else {
                  errorMessage = serverErrorMessage + (serverErrorDetails ? `\nДетали: ${serverErrorDetails}` : '');
                }
              } else if (deleteError.message) {
                // Другие типы ошибок (например, из new Error() в сервисе, если ответ не пришел)
                errorMessage = deleteError.message;
              }
              
              Alert.alert(errorTitle, errorMessage);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <Container>
        <Header title="Управление товарами" showBackButton />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Header title="Ошибка" showBackButton />
        <View className="flex-1 items-center justify-center p-4">
          <Ionicons name="cloud-offline-outline" size={48} color="#EF4444" />
          <Text className="text-red-500 text-lg mt-4 text-center">{error}</Text>
          <Button title="Попробовать снова" onPress={loadProducts} className="mt-6" />
        </View>
      </Container>
    );
  }

  return (
    <Container padded={false}>
      <Header 
        title="Управление товарами" 
        showBackButton 
        rightAction={
          <TouchableOpacity className="p-2 mr-2" onPress={() => router.push('/product-form')}>
            <Ionicons name="add-circle-outline" size={28} color="#4F46E5" />
          </TouchableOpacity>
        }
      />
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductListItem
            item={item}
            onEdit={() => router.push({ pathname: '/product-form', params: { productId: item.id } })}
            onDelete={() => handleDeleteProduct(item.id, item.name)}
          />
        )}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center pt-20">
            <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
            <Text className="text-neutral-500 text-base mt-2">Список товаров пуст</Text>
            <Text className="text-neutral-400 text-sm text-center mt-1">
              Нажмите "+", чтобы добавить первый товар.
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 70 }}
      />
    </Container>
  );
}