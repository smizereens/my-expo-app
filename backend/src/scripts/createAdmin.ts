// backend/src/scripts/createAdmin.ts
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function createAdmin() {
  try {
    const username = 'admin';
    const password = 'admin123'; // ПОМЕНЯЙ НА БЕЗОПАСНЫЙ ПАРОЛЬ!
    
    // Проверяем, нет ли уже админа
    const existingAdmin = await prisma.user.findUnique({
      where: { username }
    });

    if (existingAdmin) {
      console.log('❌ Админ уже существует!');
      return;
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Создаем админа
    const admin = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: 'admin'
      },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true
      }
    });

    console.log('✅ Админ создан успешно!');
    console.log('📋 Данные для входа:');
    console.log(`   Логин: ${username}`);
    console.log(`   Пароль: ${password}`);
    console.log('');
    console.log('⚠️  ОБЯЗАТЕЛЬНО смени пароль после первого входа!');
    console.log('💡 Используй этот аккаунт для создания других пользователей');
    
  } catch (error) {
    console.error('❌ Ошибка при создании админа:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();