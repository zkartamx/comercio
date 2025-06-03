# Sales Channel Backend

Backend profesional para Sales Channel Pro usando Node.js, Express, TypeScript, Prisma y MySQL.

## Setup rápido

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Configura la base de datos en `.env` (ajusta usuario, password y host de MySQL).
3. Ejecuta las migraciones de Prisma:
   ```bash
   npx prisma migrate dev --name init
   ```
4. Inicia el servidor en desarrollo:
   ```bash
   npm run dev
   ```

## Estructura inicial
- Usuarios, productos y pedidos como modelos principales
- Endpoint de salud en `/api/health`

## Siguiente paso
Agrega controladores y rutas para los módulos de negocio (usuarios, productos, pedidos, autenticación, etc.)
