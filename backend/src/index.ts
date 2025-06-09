import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from './middleware/auth';

dotenv.config(); // Загружает переменные окружения из .env файла

const app: Express = express();
const port = process.env.PORT || 3001; // Порт для бэкенда, можно изменить

const prisma = new PrismaClient();

// Middlewares
app.use(cors()); // Разрешает CORS-запросы (важно для взаимодействия с фронтендом)
app.use(express.json()); // Для парсинга JSON-тел запросов
app.use(express.urlencoded({ extended: true })); // Для парсинга URL-encoded тел запросов

// Простой тестовый роут (публичный)
app.get('/api', (req: Request, res: Response) => {
  res.json({ message: 'Добро пожаловать в API управления заказами!' });
});

// Импорт и подключение auth роутов (ПУБЛИЧНЫЕ)
import authRoutes from './routes/authRoutes';
app.use('/api/auth', authRoutes);

// Импорт защищенных роутов
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';
import userRoutes from './routes/userRoutes';

// Применяем middleware аутентификации ко всем защищенным роутам
app.use('/api/products', authenticateToken, productRoutes);
app.use('/api/orders', authenticateToken, orderRoutes);
app.use('/api/users', authenticateToken, userRoutes);

// Обработчик ошибок (простой)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Что-то пошло не так!');
});

const server = app.listen(port, () => {
  console.log(`[server]: Сервер запущен на http://localhost:${port}`);
  console.log(`[server]: API endpoints:`);
  console.log(`[server]: POST http://localhost:${port}/api/auth/login - Авторизация`);
  console.log(`[server]: GET  http://localhost:${port}/api/auth/me - Информация о пользователе`);
  console.log(`[server]: GET  http://localhost:${port}/api/products - Товары (требует токен)`);
  console.log(`[server]: GET  http://localhost:${port}/api/orders - Заказы (требует токен)`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    prisma.$disconnect()
      .then(() => console.log('Prisma Client disconnected'))
      .catch(async (e: any) => { // Явно указываем тип для e
        console.error('Error disconnecting Prisma Client', e);
      })
      .finally(() => process.exit(0));
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    prisma.$disconnect()
      .then(() => console.log('Prisma Client disconnected'))
      .catch(async (e: any) => { // Явно указываем тип для e
        console.error('Error disconnecting Prisma Client', e);
      })
      .finally(() => process.exit(0));
  });
});

export default app; // Экспортируем для возможных тестов