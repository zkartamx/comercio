import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  const adminEmail = 'admin@admin.com';
  const adminPassword = 'password123';

  // Verificar si el usuario administrador ya existe
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log(`Admin user with email ${adminEmail} already exists.`);
  } else {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Admin User', // Puedes cambiar este nombre si quieres
        role: Role.admin,
        username: 'admin', // Nombre de usuario, asegúrate que sea único
      },
    });
    console.log(`Created admin user: ${adminUser.email} with role ${adminUser.role}`);
  }

  // Aquí puedes añadir la creación de otros datos iniciales si lo necesitas,
  // por ejemplo, categorías de productos, productos de muestra, etc.

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
