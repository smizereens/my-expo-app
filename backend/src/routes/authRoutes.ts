// backend/src/routes/authRoutes.ts
import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const SALT_ROUNDS = 10;

// POST /api/auth/login - Авторизация
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  console.log('[AUTH]: Попытка входа для:', req.body.username);
  try {
    const { username, password } = req.body as { username?: string; password?: string };

    if (!username || !password) {
      return res.status(400).json({ error: 'Логин и пароль обязательны' });
    }

    // Найти пользователя
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      console.log('[AUTH]: Пользователь не найден:', username);
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    if (!user.isActive) {
      console.log('[AUTH]: Пользователь деактивирован:', username);
      return res.status(401).json({ error: 'Аккаунт деактивирован' });
    }

    // Проверить пароль
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('[AUTH]: Неверный пароль для:', username);
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    // Создать JWT токен
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('[AUTH]: Успешный вход:', username);
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Ошибка при авторизации:', error);
    next(error);
  }
});

// POST /api/auth/create-user - Создание пользователя (только для админов)
router.post('/create-user', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { username, password, role = 'employee' } = req.body as { username?: string; password?: string; role?: string };

    if (!username || !password) {
      return res.status(400).json({ error: 'Логин и пароль обязательны' });
    }

    if (!['employee', 'manager', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Недопустимая роль' });
    }

    // Проверить, что пользователь не существует
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким логином уже существует' });
    }

    // Хешировать пароль
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Создать пользователя
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role
      },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    console.log(`[AUTH]: Создан новый пользователь "${username}" с ролью "${role}" админом "${req.user?.username}"`);
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Ошибка при создании пользователя:', error);
    next(error);
  }
});

// GET /api/auth/me - Получить информацию о текущем пользователе
router.get('/me', authenticateToken, (req: AuthRequest, res: Response) => {
  res.json({
    user: req.user
  });
});

// GET /api/auth/users - Список всех пользователей (только для админов)
router.get('/users', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(users);
  } catch (error) {
    console.error('Ошибка при получении списка пользователей:', error);
    next(error);
  }
});

// PUT /api/auth/users/:id/toggle - Активация/деактивация пользователя (только для админов)
router.put('/users/:id/toggle', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Нельзя деактивировать самого себя
    if (user.id === req.user?.id) {
      return res.status(400).json({ error: 'Нельзя деактивировать самого себя' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    console.log(`[AUTH]: Пользователь "${user.username}" ${updatedUser.isActive ? 'активирован' : 'деактивирован'} админом "${req.user?.username}"`);
    res.json(updatedUser);
  } catch (error) {
    console.error('Ошибка при изменении статуса пользователя:', error);
    next(error);
  }
});

export default router;