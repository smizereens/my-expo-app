# План Разработки: Мобильное Приложение для Управления Заказами OMS

## 1. Обзор и Цели

Разработка кроссплатформенного мобильного приложения для управления заказами в малом бизнесе. Приложение предназначено для внутреннего персонала (сотрудников, менеджеров).

**Ключевые функции:**
*   Управление заказами: создание, просмотр, обновление статуса, архивация.
*   Базовое управление каталогом товаров.

**Технологический стек:**
*   **Фронтенд:** Expo (React Native) - уже частично разработан.
*   **Бэкенд:** Node.js, Express.js.
*   **База данных:** PostgreSQL.
*   **ORM:** Prisma.

## 2. Фазы Разработки

### Фаза 1: Настройка Бэкенда и Базовые Модели Данных (с Prisma)

1.  **Инициализация проекта бэкенда:**
    *   Настройка Node.js и Express.js.
    *   Установка зависимостей: `express`, `prisma`, `@prisma/client`, `dotenv`, `cors`.
    *   Базовая структура папок проекта.
2.  **Настройка базы данных PostgreSQL:**
    *   Создание базы данных.
3.  **Интеграция Prisma:**
    *   `npx prisma init --datasource-provider postgresql`
    *   Настройка строки подключения в `.env` и `schema.prisma`.
4.  **Определение моделей данных в `schema.prisma`:**
    *   **`Product` (Товар):**
        ```prisma
        model Product {
          id          String   @id @default(uuid())
          name        String
          price       Float
          description String?
          createdAt   DateTime @default(now())
          updatedAt   DateTime @updatedAt
          orderItems  OrderItem[] // Связь с позициями заказа
        }
        ```
    *   **`Order` (Заказ):**
        ```prisma
        model Order {
          id            String      @id @default(uuid())
          displayId     String      @unique // Удобный для пользователя ID, генерируется на бэкенде
          customerName  String
          customerPhone String?
          customerEmail String?
          status        OrderStatus @default(NEW) // Enum для статусов
          totalAmount   Float       // Общая сумма заказа
          note          String?     // Примечание к заказу
          createdAt     DateTime    @default(now())
          updatedAt     DateTime    @updatedAt
          items         OrderItem[] // Связь с позициями заказа
        }
        ```
    *   **`OrderItem` (Позиция заказа):**
        ```prisma
        model OrderItem {
          id              String   @id @default(uuid())
          order           Order    @relation(fields: [orderId], references: [id])
          orderId         String   // Внешний ключ к Order
          product         Product  @relation(fields: [productId], references: [id])
          productId       String   // Внешний ключ к Product
          quantity        Int
          priceAtPurchase Float    // Цена товара на момент покупки
          createdAt       DateTime @default(now())
          updatedAt       DateTime @updatedAt
        }
        ```
    *   **`OrderStatus` (Enum для статусов заказа):**
        ```prisma
        enum OrderStatus {
          NEW        // Новый
          PROCESSING // В работе
          COMPLETED  // Готов (Выполнен)
          CANCELLED  // Отменен
          ARCHIVED   // Архивирован
        }
        ```
5.  **Генерация Prisma Client:**
    *   `npx prisma generate`
6.  **Создание и применение миграций:**
    *   `npx prisma migrate dev --name init` (или другое осмысленное имя миграции)

    **Диаграмма связей (ERD):**
    ```mermaid
    erDiagram
        Product {
            String id PK
            String name
            Float price
            String description
            DateTime createdAt
            DateTime updatedAt
        }

        Order {
            String id PK
            String displayId UK
            String customerName
            String customerPhone
            String customerEmail
            OrderStatus status
            Float totalAmount
            String note
            DateTime createdAt
            DateTime updatedAt
        }

        OrderItem {
            String id PK
            String orderId FK
            String productId FK
            Integer quantity
            Float priceAtPurchase
            DateTime createdAt
            DateTime updatedAt
        }

        Order ||--o{ OrderItem : contains
        Product ||--o{ OrderItem : "references"

        Order {
          OrderStatus status "Enum: NEW, PROCESSING, COMPLETED, CANCELLED, ARCHIVED"
        }
    ```

### Фаза 2: Разработка API Endpoints (Бэкенд, префикс `/api`)

1.  **API для Товаров (`/api/products`)**
    *   **`POST /`**: Создание нового товара.
        *   Тело: `{ name: string, price: number, description?: string }`
        *   Ответ (201): Созданный товар.
    *   **`GET /`**: Получение списка всех товаров.
        *   Ответ (200): Массив товаров.
    *   **`GET /:id`**: Получение информации о конкретном товаре.
        *   Ответ (200): Данные товара. (404 если не найден)
    *   **`PUT /:id`**: Обновление информации о товаре.
        *   Тело: `{ name?: string, price?: number, description?: string }`
        *   Ответ (200): Обновленный товар. (404 если не найден)
    *   **`DELETE /:id`**: Удаление товара.
        *   Логика: Запретить удаление, если товар использован хотя бы в одном `OrderItem`.
        *   Ответ (204): No Content. (404 если не найден, 400 если используется)

2.  **API для Заказов (`/api/orders`)**
    *   **`POST /`**: Создание нового заказа.
        *   Тело: `{ customerName: string, customerPhone?: string, customerEmail?: string, note?: string, items: [{ productId: string, quantity: number }] }`
        *   Логика бэкенда:
            *   Валидация данных (наличие `productId`, `quantity > 0`).
            *   Создание `Order` с начальным статусом `NEW`.
            *   Генерация `displayId` (например, "ORD-00001").
            *   Для каждого `item`: найти `Product`, сохранить `priceAtPurchase` в `OrderItem`.
            *   Расчет `totalAmount` для `Order`.
        *   Ответ (201): Полные данные созданного заказа, включая `items`.
    *   **`GET /`**: Получение списка заказов.
        *   Query Params: `status?: string`, `search?: string` (по `displayId` или `customerName`).
        *   Ответ (200): Массив заказов (для краткости можно не включать детальные `items`, но добавить `itemCount` и `totalAmount`).
    *   **`GET /:id`**: Получение детальной информации о заказе (используется UUID заказа).
        *   Ответ (200): Полная информация о заказе, включая `items` с деталями товаров (название, цена на момент покупки, количество). (404 если не найден)
    *   **`PUT /:id/status`**: Обновление статуса заказа.
        *   Тело: `{ status: OrderStatus }`
        *   Логика бэкенда (валидация переходов):
            *   `NEW` -> `PROCESSING`, `CANCELLED`
            *   `PROCESSING` -> `COMPLETED`, `CANCELLED`
            *   `COMPLETED` -> `ARCHIVED`
            *   `CANCELLED` -> `ARCHIVED`
        *   Ответ (200): Обновленный заказ. (404 если не найден, 400 при невалидном переходе)

### Фаза 3: Интеграция Фронтенда с Бэкендом

1.  **Настройка сервисного слоя на фронтенде:**
    *   Создание функций для взаимодействия с API бэкенда (например, с использованием `axios` или `fetch`).
2.  **Интеграция экрана "Новый заказ" ([`app/new-order.tsx`](app/new-order.tsx)):**
    *   Загрузка списка доступных товаров с бэкенда (`GET /api/products`) для выбора.
    *   Отправка данных нового заказа на бэкенд (`POST /api/orders`).
3.  **Интеграция экрана "Заказы" ([`app/orders.tsx`](app/orders.tsx)):**
    *   Загрузка списка заказов с бэкенда (`GET /api/orders`) с учетом фильтров (`status`) и поиска (`search`).
    *   Обновление списка при изменении фильтров/поиска.
4.  **Интеграция экрана "Детали заказа" ([`app/order-details.tsx`](app/order-details.tsx)):**
    *   Загрузка детальной информации о заказе с бэкенда (`GET /api/orders/:id`).
    *   Реализация возможности изменения статуса заказа через `PUT /api/orders/:id/status` в соответствии с логикой кнопок:
        *   "Начать обработку" (`NEW` -> `PROCESSING`)
        *   "Отметить как выполненный" (`PROCESSING` -> `COMPLETED`)
        *   "Отменить заказ" (`NEW` или `PROCESSING` -> `CANCELLED`)
        *   Добавить кнопку "Архивировать заказ" (для статусов `COMPLETED` или `CANCELLED` -> `ARCHIVED`).
5.  **Создание и интеграция раздела "Управление товарами":**
    *   Новые экраны для отображения списка товаров, создания, редактирования и удаления товаров.
    *   Взаимодействие с API `/api/products`.

### Фаза 4: Тестирование и Доработка

1.  **Тестирование основного функционала:**
    *   Создание и редактирование товаров.
    *   Создание заказов с различными товарами.
    *   Просмотр списка заказов, применение фильтров и поиска.
    *   Просмотр деталей заказа.
    *   Изменение статусов заказов, включая архивацию.
    *   Проверка логики запрета удаления используемых товаров.
2.  **Исправление ошибок и доработка на основе обратной связи.**

## 3. Дальнейшие возможные улучшения

*   Аутентификация пользователей (сотрудники, менеджеры) с ролями.
*   Более продвинутое управление каталогом товаров (категории, изображения).
*   Уведомления (например, о новых заказах).
*   Дашборд с базовой аналитикой (количество заказов, суммы).
*   Печать/экспорт деталей заказа.
*   Пагинация для списков товаров и заказов.