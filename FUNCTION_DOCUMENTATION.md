# Documentación de Funciones del Proyecto

## Índice

1.  [Funciones del Backend](#funciones-del-backend)
    1.  [Módulo de Autenticación (`auth.ts`, `userController.ts`, etc.)](#módulo-de-autenticación-authts-usercontrollerts-etc)
        1.  [Middlewares de Validación (`middlewares/validate.ts`)](#middlewares-de-validación-middlewaresvalidatets)
        2.  [Middlewares de Autenticación/Autorización (`middlewares/auth.ts`)](#middlewares-de-autenticaciónautorización-middlewaresauthts)
    2.  [Módulo de Productos (`productController.ts`, etc.)](#módulo-de-productos-productcontrollerts-etc)
    3.  [Módulo de Órdenes (`orderController.ts`, etc.)](#módulo-de-órdenes-ordercontrollerts-etc)
2.  [Funciones del Frontend](#funciones-del-frontend)
    1.  [Vista de Registro (`RegisterView.tsx`)](#vista-de-registro-registerviewtsx)


Este documento detalla las funciones clave y su comportamiento dentro del proyecto Sales Channel Pro.

## Funciones del Backend

Aquí se describirán las funciones principales del lado del servidor, incluyendo controladores, servicios, middleware, etc.

### Módulo de Autenticación (`auth.ts`, `userController.ts`, etc.)

*   **`checkEmailExists(req: Request, res: Response)`**
    *   **Tipo:** Controlador de ruta Express, función asíncrona (`async`).
    *   **Ruta HTTP Asociada:** `GET /api/users/check-email`
    *   **Descripción:** Verifica si un correo electrónico proporcionado como parámetro de consulta (`query parameter`) ya existe en la base de datos de usuarios.
    *   **Parámetros de Solicitud (Query):**
        *   `email` (string): El correo electrónico a verificar. Es obligatorio.
    *   **Respuestas HTTP:**
        *   `200 OK`:
            *   **Cuerpo (JSON):** `{ "exists": true }` si el correo existe.
            *   **Cuerpo (JSON):** `{ "exists": false }` si el correo no existe.
        *   `400 Bad Request`:
            *   **Cuerpo (JSON):** `{ "error": "Email is required as a query parameter." }` si no se proporciona el parámetro `email` o no es un string.
        *   `500 Internal Server Error`:
            *   **Cuerpo (JSON):** `{ "error": "Error checking email existence" }` si ocurre un error durante la consulta a la base de datos.
    *   **Lógica Principal:**
        1.  Extrae el `email` de `req.query`.
        2.  Valida que `email` se haya proporcionado y sea un string. Si no, responde con un error 400.
        3.  Utiliza `prisma.user.findUnique` para buscar un usuario con el `email` proporcionado.
        4.  Si se encuentra un usuario, responde con `{ exists: true }`.
        5.  Si no se encuentra un usuario, responde con `{ exists: false }`.
        6.  Si ocurre cualquier error durante la interacción con Prisma, lo registra en la consola y responde con un error 500.
    *   **Uso:** Esta función es consumida por el frontend (ej. `RegisterView.tsx` y `CustomerView.tsx`) para verificar la disponibilidad de un correo electrónico en tiempo real durante el proceso de registro o de ingreso de datos de cliente.

*   **`register(req: Request, res: Response)`**
    *   **Tipo:** Controlador de ruta Express, función asíncrona (`async`).
    *   **Ruta HTTP Asociada:** `POST /api/auth/register`
    *   **Middleware Previo:** `validateRegister` (para validación de los datos de entrada).
    *   **Descripción:** Registra un nuevo usuario de tipo "cliente" en el sistema.
    *   **Parámetros de Solicitud (Body):**
        *   `email` (string): El correo electrónico del nuevo usuario. Debe ser único.
        *   `password` (string): La contraseña para el nuevo usuario.
        *   `name` (string): El nombre del nuevo usuario.
        *   *Nota: El campo `role` se ignora si se envía en el body; se asigna `Role.customer` por defecto.*
    *   **Respuestas HTTP:**
        *   `201 Created`:
            *   **Cuerpo (JSON):**
                ```json
                {
                  "message": "Cliente creado exitosamente",
                  "user": {
                    "id": "...",
                    "email": "...",
                    "name": "...",
                    "displayName": "...", 
                    "role": "customer"
                  },
                  "token": "jwt.token.here" 
                }
                ```
        *   `400 Bad Request`:
            *   **Cuerpo (JSON):** `{ "error": "Email ya registrado" }` si el correo electrónico ya existe.
            *   **Cuerpo (JSON):** `{ "error": "El valor para el campo '<campo>' ya existe y debe ser único." }` si ocurre una violación de restricción única de Prisma (además del email, aunque el email es el chequeo explícito principal).
        *   `500 Internal Server Error`:
            *   **Cuerpo (JSON):** `{ "error": "Error interno del servidor al registrar el cliente" }` si ocurre un error inesperado.
    *   **Lógica Principal:**
        1.  Extrae `email`, `password`, y `name` del `req.body`.
        2.  Define `defaultRole` como `Role.customer`.
        3.  Verifica si ya existe un usuario con el `email` proporcionado usando `prisma.user.findUnique`. Si existe, responde con error 400.
        4.  Hashea la `password` usando `bcrypt.hash`.
        5.  Crea el nuevo usuario en la base de datos usando `prisma.user.create` con los datos proporcionados y el `defaultRole`.
        6.  Genera un token JWT (`jsonwebtoken.sign`) para el nuevo usuario, incluyendo `userId`, `email`, y `role` en el payload. El token expira en '1h'.
        7.  Responde con estado 201, un mensaje de éxito, los datos del usuario (excluyendo la contraseña) y el token JWT.
        8.  **Manejo de Errores (Catch):**
            *   Si es un error conocido de Prisma por restricción única (código `P2002`), responde con un error 400 específico.
            *   Para otros errores, registra el error en consola y responde con un error 500 genérico.
    *   **Uso:** Esta función es el endpoint principal para que los nuevos clientes se registren en la aplicación.

*   **`login(req: Request, res: Response)`**
    *   **Tipo:** Controlador de ruta Express, función asíncrona (`async`).
    *   **Ruta HTTP Asociada:** `POST /api/auth/login`
    *   **Middleware Previo:** `validateLogin` (para validación de los datos de entrada).
    *   **Descripción:** Autentica a un usuario existente y le proporciona un token JWT.
    *   **Parámetros de Solicitud (Body):**
        *   `email` (string): El correo electrónico del usuario.
        *   `password` (string): La contraseña del usuario.
    *   **Respuestas HTTP:**
        *   `200 OK`:
            *   **Cuerpo (JSON):**
                ```json
                {
                  "token": "jwt.token.here",
                  "user": {
                    "id": "...",
                    "email": "...",
                    "name": "...",
                    "displayName": "...", 
                    "role": "user_role_lowercase" 
                  }
                }
                ```
        *   `401 Unauthorized`:
            *   **Cuerpo (JSON):** `{ "error": "Credenciales inválidas" }` si el email no existe o la contraseña no coincide.
        *   `500 Internal Server Error`:
            *   **Cuerpo (JSON):** `{ "error": "Error en el login" }` si ocurre un error inesperado.
    *   **Lógica Principal:**
        1.  Extrae `email` y `password` del `req.body`.
        2.  Busca al usuario por `email` usando `prisma.user.findUnique`. Si no se encuentra, responde con error 401.
        3.  Compara la `password` proporcionada con la contraseña hasheada almacenada usando `bcrypt.compare`. Si no coinciden, responde con error 401.
        4.  Convierte el rol del usuario a minúsculas.
        5.  Genera un token JWT (`jsonwebtoken.sign`) para el usuario, incluyendo `userId` y `role` (en minúsculas) en el payload. El token expira en '7d'.
        6.  Responde con estado 200, el token JWT y los datos del usuario (nombre, email, id, rol).
        7.  **Manejo de Errores (Catch):**
            *   Si ocurre cualquier error, responde con un error 500 genérico.
    *   **Uso:** Permite a los usuarios registrados iniciar sesión en la aplicación y obtener un token para acceder a rutas protegidas.

*   **`registerSeller(req: Request, res: Response)`**
    *   **Tipo:** Controlador de ruta Express, función asíncrona (`async`).
    *   **Ruta HTTP Asociada:** `POST /api/auth/register-seller`
    *   **Middleware Previo:** `validateRegisterSeller` (para validación de los datos de entrada).
    *   **Descripción:** Registra un nuevo usuario de tipo "vendedor" en el sistema.
    *   **Parámetros de Solicitud (Body):**
        *   `username` (string): El nombre de usuario para el vendedor. Potencialmente único.
        *   `password` (string): La contraseña para el nuevo vendedor.
        *   `name` (string): El nombre completo del vendedor.
        *   `email` (string): El correo electrónico del vendedor. Debe ser único en la tabla de usuarios.
    *   **Respuestas HTTP:**
        *   `201 Created`:
            *   **Cuerpo (JSON):**
                ```json
                {
                  "message": "Registro exitoso",
                  "user": {
                    "id": "...",
                    "email": "...",
                    "name": "...",
                    "username": "...",
                    "role": "seller"
                    
                  }
                }
                ```
        *   `400 Bad Request`:
            *   **Cuerpo (JSON):** `{ "error": "Todos los campos son obligatorios: username, password, name, email" }` si falta alguno de los campos.
            *   **Cuerpo (JSON):** `{ "error": "Este correo electrónico ya está registrado." }` si el email ya existe.
            *   **Cuerpo (JSON):** `{ "error": "Este nombre de usuario ya está en uso." }` si el username ya existe (si la restricción de unicidad está activa para username y es violada).
            *   **Cuerpo (JSON):** `{ "error": "El valor para el campo '<campo>' ya existe y debe ser único." }` para otras violaciones de unicidad de Prisma.
        *   `500 Internal Server Error`:
            *   **Cuerpo (JSON):** `{ "error": "Error interno del servidor al registrar el vendedor" }` si ocurre un error inesperado.
    *   **Lógica Principal:**
        1.  Extrae `username`, `password`, `name`, y `email` del `req.body`.
        2.  Realiza una validación básica para asegurar que todos los campos estén presentes.
        3.  Verifica si el `email` ya existe en la base de datos usando `prisma.user.findUnique`. Si existe, responde con error 400.
        4.  (Opcionalmente, si se implementa la unicidad de `username`, se verificaría aquí).
        5.  Hashea la `password` usando `bcrypt.hash`.
        6.  Crea el nuevo usuario en la base de datos usando `prisma.user.create` con los datos proporcionados y el rol "seller".
        7.  Excluye la contraseña hasheada del objeto de usuario que se enviará en la respuesta.
        8.  Responde con estado 201, un mensaje de éxito y los datos del nuevo vendedor.
        9.  **Manejo de Errores (Catch):**
            *   Si es un error conocido de Prisma por restricción única (código `P2002`, ej. para `username`), responde con un error 400 específico.
            *   Para otros errores, registra el error en consola y responde con un error 500 genérico.
    *   **Uso:** Permite el registro de nuevos vendedores en el sistema, típicamente desde una interfaz de administración o un portal específico para vendedores.

#### Middlewares de Validación (`middlewares/validate.ts`)

*   **`validateRegister(req: Request, res: Response, next: NextFunction)`**
    *   **Tipo:** Middleware de Express.
    *   **Asociado a Rutas:** `POST /api/auth/register` (se ejecuta antes del controlador `register`).
    *   **Descripción:** Valida los datos de entrada (`email`, `password`, `name`) para el registro de un nuevo usuario de tipo cliente.
    *   **Parámetros de Solicitud (Body) Esperados:**
        *   `email` (string): El correo electrónico del usuario.
        *   `password` (string): La contraseña del usuario.
        *   `name` (string): El nombre del usuario.
    *   **Lógica de Validación y Respuestas:**
        *   Si los campos `email`, `password`, o `name` faltan:
            *   Responde `400 Bad Request` con `{ "error": "Todos los campos son requeridos: email, password, name" }`.
        *   Si `email` no es un string o no incluye `@`:
            *   Responde `400 Bad Request` con `{ "error": "Email inválido" }`.
        *   Si `password` no es un string o tiene menos de 6 caracteres:
            *   Responde `400 Bad Request` con `{ "error": "La contraseña debe tener al menos 6 caracteres" }`.
        *   Si todas las validaciones son exitosas:
            *   Llama a `next()` para pasar el control al siguiente middleware o al controlador de la ruta.
    *   **Uso:** Este middleware se utiliza para asegurar que los datos proporcionados para el registro de un nuevo cliente cumplan con los requisitos básicos de formato y presencia antes de que el controlador `register` intente crear el usuario en la base de datos.

*   **`validateLogin(req: Request, res: Response, next: NextFunction)`**
    *   **Tipo:** Middleware de Express.
    *   **Asociado a Rutas:** `POST /api/auth/login` (se ejecuta antes del controlador `login`).
    *   **Descripción:** Valida los datos de entrada (`email`, `password`) para el inicio de sesión de un usuario.
    *   **Parámetros de Solicitud (Body) Esperados:**
        *   `email` (string): El correo electrónico del usuario.
        *   `password` (string): La contraseña del usuario.
    *   **Lógica de Validación y Respuestas:**
        *   Si los campos `email` o `password` faltan:
            *   Responde `400 Bad Request` con `{ "error": "Email y contraseña son requeridos" }`.
        *   Si todas las validaciones son exitosas:
            *   Llama a `next()` para pasar el control al siguiente middleware o al controlador de la ruta.
    *   **Uso:** Este middleware asegura que se proporcionen tanto el email como la contraseña antes de que el controlador `login` intente autenticar al usuario.

*   **`validateRegisterSeller(req: Request, res: Response, next: NextFunction)`**
    *   **Tipo:** Middleware de Express.
    *   **Asociado a Rutas:** `POST /api/auth/register-seller` (se ejecuta antes del controlador `registerSeller`).
    *   **Descripción:** Valida los datos de entrada (`username`, `email`, `password`, `name`) para el registro de un nuevo usuario de tipo vendedor.
    *   **Parámetros de Solicitud (Body) Esperados:**
        *   `username` (string): El nombre de usuario del vendedor.
        *   `email` (string): El correo electrónico del vendedor.
        *   `password` (string): La contraseña del vendedor.
        *   `name` (string): El nombre completo del vendedor.
    *   **Lógica de Validación y Respuestas:**
        *   Si los campos `username`, `email`, `password`, o `name` faltan:
            *   Responde `400 Bad Request` con `{ "error": "Todos los campos son requeridos: username, email, password, name" }`.
        *   Si `username` no es un string o tiene menos de 3 caracteres:
            *   Responde `400 Bad Request` con `{ "error": "El nombre de usuario debe tener al menos 3 caracteres" }`.
        *   Si `email` no es un string o no incluye `@`:
            *   Responde `400 Bad Request` con `{ "error": "Email inválido" }`.
        *   Si `password` no es un string o tiene menos de 6 caracteres:
            *   Responde `400 Bad Request` con `{ "error": "La contraseña debe tener al menos 6 caracteres" }`.
        *   Si `name` no es un string o tiene menos de 2 caracteres:
            *   Responde `400 Bad Request` con `{ "error": "El nombre debe tener al menos 2 caracteres" }`.
        *   Si todas las validaciones son exitosas:
            *   Llama a `next()` para pasar el control al siguiente middleware o al controlador de la ruta.
    *   **Uso:** Este middleware se utiliza para asegurar que los datos proporcionados para el registro de un nuevo vendedor cumplan con los requisitos básicos de formato y presencia antes de que el controlador `registerSeller` intente crear el usuario.

#### Middlewares de Autenticación/Autorización (`middlewares/auth.ts`)

*   **`authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction)`**
    *   **Tipo:** Middleware de Express.
    *   **Interfaz de Solicitud Extendida:** Utiliza `AuthenticatedRequest`, que extiende `express.Request` para añadir una propiedad opcional `user` (de tipo `JwtPayload`).
    *   **Descripción:** Verifica la presencia y validez de un token JWT (Bearer token) en el encabezado `Authorization` de la solicitud. Si el token es válido, decodifica el payload y lo adjunta a `req.user`.
    *   **Lógica de Funcionamiento:**
        1.  Obtiene el encabezado `Authorization` de `req.headers`.
        2.  Si el encabezado no existe o no comienza con `Bearer `:
            *   Responde `401 Unauthorized` con `{ "error": "Token requerido" }`.
        3.  Extrae el token de la cadena `Bearer <token>`.
        4.  Intenta verificar el token usando `jwt.verify(token, JWT_SECRET)`:
            *   Si la verificación es exitosa:
                *   El payload decodificado (casteado a `JwtPayload`) se asigna a `req.user`.
                *   Llama a `next()` para pasar el control al siguiente middleware o controlador.
            *   Si la verificación falla (ej. token inválido, expirado):
                *   Responde `401 Unauthorized` con `{ "error": "Token inválido" }`.
    *   **Uso:** Este middleware se utiliza para proteger rutas que requieren que un usuario esté autenticado. Coloca la información del usuario autenticado en `req.user` para que los siguientes middlewares o controladores puedan acceder a ella.

*   **`optionalAuthenticate(req: AuthenticatedRequest, res: Response, next: NextFunction)`**
    *   **Tipo:** Middleware de Express.
    *   **Interfaz de Solicitud Extendida:** Utiliza `AuthenticatedRequest`.
    *   **Descripción:** Intenta autenticar al usuario si se proporciona un token JWT (Bearer token) en el encabezado `Authorization`. Si el token es válido, decodifica el payload y lo adjunta a `req.user`. Si no se proporciona token, o si el token es inválido, `req.user` permanecerá `undefined` y la solicitud continuará al siguiente manejador. No bloquea la solicitud si la autenticación falla o está ausente.
    *   **Lógica de Funcionamiento:**
        1.  Obtiene el encabezado `Authorization` de `req.headers`.
        2.  Si el encabezado existe y comienza con `Bearer `:
            *   Extrae el token.
            *   Intenta verificar el token usando `jwt.verify(token, JWT_SECRET)`:
                *   Si la verificación es exitosa:
                    *   El payload decodificado (casteado a `JwtPayload`) se asigna a `req.user`.
                *   Si la verificación falla (ej. token inválido, expirado):
                    *   Se registra una advertencia (`console.warn`).
                    *   `req.user` permanece `undefined`.
        3.  Si no hay encabezado `Authorization` o si el token fue inválido, `req.user` es `undefined`.
        4.  Siempre llama a `next()` para pasar el control al siguiente middleware o controlador, independientemente del resultado de la autenticación.
    *   **Uso:** Este middleware se utiliza para rutas que pueden ofrecer funcionalidades extendidas o personalizadas para usuarios autenticados, but que también son accesibles para usuarios no autenticados. Permite que el controlador de la ruta verifique la existencia de `req.user` para determinar el estado de autenticación.

*   **`authorize(roles: string[])`**
    *   **Tipo:** Middleware Factory de Express (devuelve un middleware de Express).
    *   **Parámetro de la Factory:**
        *   `roles` (array de strings): Un array de roles permitidos para acceder a la ruta.
    *   **Middleware Devuelto:** `(req: AuthenticatedRequest, res: Response, next: NextFunction)`
        *   **Interfaz de Solicitud Extendida:** Espera que `req` sea una `AuthenticatedRequest` y que `req.user` haya sido poblado por un middleware `authenticate` previo.
        *   **Descripción:** Verifica si el rol del usuario autenticado (obtenido de `req.user.role`) está incluido en el array de `roles` permitidos.
        *   **Lógica de Funcionamiento:**
            1.  Obtiene el objeto `user` de `req.user`.
            2.  Si `req.user` no existe (usuario no autenticado) o si `user.role` no está incluido en el array `roles` proporcionado a la factory:
                *   Responde `403 Forbidden` con `{ "error": "No autorizado" }`.
            3.  Si el rol del usuario está permitido:
                *   Llama a `next()` para pasar el control al siguiente middleware o controlador.
    *   **Uso:** Este middleware se utiliza para implementar control de acceso basado en roles (RBAC). Se coloca después del middleware `authenticate` en la cadena de middlewares de una ruta para asegurar que solo los usuarios con roles específicos puedan acceder a ella. Ejemplo de uso en una ruta: `router.get('/admin-only', authenticate, authorize(['admin']), adminController.getData);`

*   **`getProfile(req: Request, res: Response)`**
    *   **Controlador:** `userController.ts`
    *   **Tipo:** Controlador de ruta Express, función asíncrona (`async`).
    *   **Ruta HTTP Asociada:** `GET /api/users/me` (típicamente, esta ruta está protegida y requiere autenticación).
    *   **Middleware Previo:** `authenticate` (implícito, ya que `req.user.userId` es accedido para obtener el ID del usuario autenticado).
    *   **Descripción:** Obtiene y devuelve el perfil del usuario actualmente autenticado.
    *   **Parámetros de Solicitud:** Ninguno explícito en la ruta o query. El `userId` se extrae del token JWT procesado por el middleware `authenticate` y disponible en `req.user.userId`.
    *   **Respuestas HTTP:**
        *   `200 OK`:
            *   **Cuerpo (JSON):** Un objeto con los detalles del perfil del usuario.
                ```json
                {
                  "id": "string",
                  "email": "string",
                  "name": "string",
                  "role": "string", 
                  "createdAt": "DateTime",
                  "updatedAt": "DateTime",
                  "defaultShippingAddress": "Json?", 
                  "defaultBillingDetails": "Json?" 
                }
                ```
        *   `404 Not Found`:
            *   **Cuerpo (JSON):** `{ "error": "Usuario no encontrado" }` (si el `userId` del token no corresponde a un usuario en la base de datos).
        *   `500 Internal Server Error`:
            *   **Cuerpo (JSON):** `{ "error": "Error obteniendo perfil" }` (si ocurre un error durante la consulta a la base de datos u otro problema inesperado).
    *   **Lógica Principal:**
        1.  Obtiene el `userId` del objeto `req.user` (que es poblado por el middleware `authenticate`).
        2.  Utiliza `prisma.user.findUnique` para buscar al usuario por su `id`.
        3.  Selecciona explícitamente los campos a devolver: `id`, `email`, `name`, `role`, `createdAt`, `updatedAt`, `defaultShippingAddress`, y `defaultBillingDetails`.
        4.  Si se encuentra el usuario:
            *   Convierte el valor del campo `role` a minúsculas.
            *   Responde con un JSON conteniendo los datos del perfil del usuario.
        5.  Si el usuario no se encuentra, responde con un error 404.
        6.  Si ocurre cualquier otro error durante el proceso, responde con un error 500.
    *   **Observaciones:**
        *   La función utiliza `// @ts-ignore` antes de acceder a `req.user.userId`. Sería ideal que `req` fuera tipado como `AuthenticatedRequest` (definido en `middlewares/auth.ts`) para evitar esto y tener un tipado más seguro.
    *   **Uso:** Esta función es esencial para que el frontend recupere los detalles del usuario logueado, permitiendo personalizar la interfaz, gestionar permisos y mostrar información relevante del perfil.

*   **`updateProfile(req: Request, res: Response)`**
    *   **Controlador:** `userController.ts`
    *   **Tipo:** Controlador de ruta Express, función asíncrona (`async`).
    *   **Ruta HTTP Asociada:** `PUT /api/users/me` o `PATCH /api/users/me` (típicamente, esta ruta está protegida y requiere autenticación).
    *   **Middleware Previo:** `authenticate` (implícito, ya que `req.user?.userId` es accedido).
    *   **Descripción:** Actualiza el perfil del usuario actualmente autenticado. Permite modificar el nombre, la dirección de envío por defecto y los detalles de facturación por defecto.
    *   **Parámetros del Cuerpo de la Solicitud (JSON):**
        *   `name` (string, opcional): El nuevo nombre del usuario.
        *   `defaultShippingAddress` (JSON object, opcional): El nuevo objeto de dirección de envío por defecto.
        *   `defaultBillingDetails` (JSON object, opcional): El nuevo objeto de detalles de facturación por defecto.
        *   *Nota: Al menos uno de estos campos debe estar presente en la solicitud.*
    *   **Respuestas HTTP:**
        *   `200 OK`:
            *   **Cuerpo (JSON):** Un objeto con los detalles actualizados del perfil del usuario (excluyendo la contraseña).
                ```json
                {
                  "id": "string",
                  "email": "string",
                  "name": "string",
                  "role": "string",
                  "defaultShippingAddress": "Json?",
                  "defaultBillingDetails": "Json?",
                  "createdAt": "DateTime",
                  "updatedAt": "DateTime"
                }
                ```
        *   `400 Bad Request`:
            *   **Cuerpo (JSON):** `{ "error": "No se proporcionaron datos para actualizar." }` (si ninguno de los campos opcionales `name`, `defaultShippingAddress`, `defaultBillingDetails` se incluye en el cuerpo de la solicitud).
        *   `401 Unauthorized`:
            *   **Cuerpo (JSON):** `{ "error": "Usuario no autenticado." }` (si no se puede obtener `userId` de `req.user`, indicando que el usuario no está autenticado).
        *   `500 Internal Server Error`:
            *   **Cuerpo (JSON):** `{ "error": "Error al actualizar el perfil del usuario." }` (si ocurre un error durante la actualización en la base de datos u otro problema inesperado).
    *   **Lógica Principal:**
        1.  Obtiene el `userId` del objeto `req.user` (poblado por el middleware `authenticate`). Si no existe, responde 401.
        2.  Extrae `name`, `defaultShippingAddress`, y `defaultBillingDetails` del cuerpo de la solicitud (`req.body`).
        3.  Valida que al menos uno de los campos a actualizar esté presente. Si no, responde 400.
        4.  Construye un objeto `dataToUpdate` solo con los campos que se proporcionaron y tienen valor.
        5.  Utiliza `prisma.user.update` para actualizar el usuario en la base de datos, usando `userId` en la cláusula `where` y `dataToUpdate` para los datos.
        6.  Selecciona explícitamente los campos a devolver en la respuesta, excluyendo la contraseña.
        7.  Si la actualización es exitosa, responde con el objeto del usuario actualizado.
        8.  Si ocurre un error durante la actualización, lo registra en la consola y responde con un error 500.
    *   **Observaciones:**
        *   La función utiliza `// @ts-ignore` antes de acceder a `req.user?.userId`. Sería ideal que `req` fuera tipado como `AuthenticatedRequest` para un tipado más seguro.
        *   La función no permite actualizar el email ni la contraseña del usuario. Estas operaciones generalmente se manejan en puntos finales separados debido a su sensibilidad y posibles flujos de verificación adicionales (ej. confirmación por correo electrónico).
    *   **Uso:** Permite a los usuarios autenticados modificar la información de su perfil, como su nombre y direcciones predeterminadas.

*   **`listUsers(req: Request, res: Response)`**
    *   **Controlador:** `userController.ts`
    *   **Tipo:** Controlador de ruta Express, función asíncrona (`async`).
    *   **Ruta HTTP Asociada:** `GET /api/users` (típicamente, esta ruta está protegida y requiere autenticación y autorización para roles de administrador).
    *   **Middleware Previo:** `authenticate`, `authorize(['admin'])` (implícito, ya que esta funcionalidad es típicamente para administradores).
    *   **Descripción:** Obtiene y devuelve una lista de todos los usuarios registrados en el sistema, con una selección de sus campos.
    *   **Parámetros de Solicitud:** Ninguno.
    *   **Respuestas HTTP:**
        *   `200 OK`:
            *   **Cuerpo (JSON):** Un array de objetos, donde cada objeto representa un usuario.
                ```json
                [
                  {
                    "id": "string",
                    "email": "string",
                    "name": "string",
                    "username": "string?", 
                    "role": "string", 
                    "createdAt": "DateTime"
                  }
                ]
                ```
        *   `500 Internal Server Error`:
            *   **Cuerpo (JSON):** `{ "error": "Error listando usuarios" }` (si ocurre un error durante la consulta a la base de datos).
    *   **Lógica Principal:**
        1.  Utiliza `prisma.user.findMany()` para obtener todos los usuarios.
        2.  Selecciona explícitamente los campos: `id`, `email`, `name`, `username`, `role`, y `createdAt`.
        3.  Mapea sobre la lista de usuarios resultante para convertir el campo `role` de cada usuario a minúsculas.
        4.  Responde con el array de usuarios transformados.
        5.  Si ocurre cualquier error durante el proceso, responde con un error 500.
    *   **Uso:** Esta función se utiliza principalmente con fines administrativos, para permitir a los administradores ver una lista de todos los usuarios en el sistema.

*   **`deleteUser(req: Request, res: Response)`**
    *   **Controlador:** `userController.ts`
    *   **Tipo:** Controlador de ruta Express, función asíncrona (`async`).
    *   **Ruta HTTP Asociada:** `DELETE /api/users/:id` (típicamente, esta ruta está protegida y requiere autenticación y autorización para roles de administrador).
    *   **Middleware Previo:** `authenticate`, `authorize(['admin'])` (implícito, ya que esta funcionalidad es típicamente para administradores).
    *   **Descripción:** Elimina un usuario específico del sistema basado en su ID.
    *   **Parámetros de Ruta:**
        *   `id` (string): El ID numérico del usuario a eliminar, pasado como parámetro en la URL.
    *   **Respuestas HTTP:**
        *   `204 No Content`: Éxito, el usuario fue eliminado. No hay cuerpo en la respuesta.
        *   `400 Bad Request`:
            *   **Cuerpo (JSON):** `{ "message": "El ID del usuario proporcionado no es un número válido." }` (si el `id` proporcionado en la ruta no es un número).
        *   `404 Not Found`:
            *   **Cuerpo (JSON):** `{ "message": "Usuario no encontrado" }` (si no existe un usuario con el `id` proporcionado).
        *   `409 Conflict`:
            *   **Cuerpo (JSON):** `{ "message": "No se puede eliminar el usuario porque tiene registros relacionados (por ejemplo, pedidos). Elimine primero esos registros." }` (si la eliminación del usuario viola una restricción de clave externa, detectado por el código de error `P2003` de Prisma).
        *   `500 Internal Server Error`:
            *   **Cuerpo (JSON):** `{ "message": "Error interno del servidor al eliminar el usuario" }` (para otros errores inesperados durante el proceso).
    *   **Lógica Principal:**
        1.  Obtiene el `id` del usuario a eliminar de `req.params.id`.
        2.  Convierte el `id` a un número entero. Si no es un número válido, responde 400.
        3.  Utiliza `prisma.user.findUnique` para verificar si el usuario existe. Si no, responde 404.
        4.  (Sección comentada en el código actual: Opcionalmente, podría impedir la eliminación de administradores o la auto-eliminación).
        5.  Utiliza `prisma.user.delete` para eliminar al usuario de la base de datos.
        6.  Si la eliminación es exitosa, responde 204.
        7.  Si ocurre un error durante la eliminación:
            *   Registra el error en la consola.
            *   Si el error es de Prisma con código `P2003` (restricción de clave externa), responde 409.
            *   Para otros errores, responde 500.
    *   **Observaciones:**
        *   La función maneja específicamente el error `P2003` de Prisma para proporcionar un mensaje más claro al cliente cuando no se puede eliminar un usuario debido a dependencias (ej. pedidos existentes).
        *   Existe una sección de código comentada que podría usarse para implementar lógica adicional, como prevenir la eliminación de usuarios con rol 'ADMIN'.
    *   **Uso:** Esta función es utilizada por administradores para eliminar usuarios del sistema. Es importante el manejo del error 409 para informar sobre dependencias que impiden la eliminación.

### Módulo de Productos (`productController.ts`, etc.)

*   **`listProducts(_req: Request, res: Response)`**
    *   **Controlador:** `productController.ts`
    *   **Tipo:** Controlador de ruta Express, función asíncrona (`async`).
    *   **Ruta HTTP Asociada:** `GET /api/products` (típicamente).
    *   **Middleware Previo:** Ninguno explícito (generalmente es una ruta pública).
    *   **Descripción:** Obtiene y devuelve una lista de todos los productos disponibles.
    *   **Parámetros de Solicitud:** Ninguno (el parámetro `_req` no se utiliza).
    *   **Respuestas HTTP:**
        *   `200 OK`:
            *   **Cuerpo (JSON):** Un array de objetos, donde cada objeto representa un producto. La estructura exacta del objeto producto dependerá del modelo `Product` en `schema.prisma` (ej. `id`, `name`, `description`, `price`, `stock`, `imageUrl`, `createdAt`, `updatedAt`).
                ```json
                [
                  {
                    "id": "number",
                    "name": "string",
                    "description": "string?",
                    "price": "Decimal", 
                    "stock": "number",
                    "imageUrl": "string?",
                    "createdAt": "DateTime",
                    "updatedAt": "DateTime"
                  }
                ]
                ```
        *   `500 Internal Server Error`:
            *   **Cuerpo (JSON):** `{ "error": "Error listando productos" }` (si ocurre un error durante la consulta a la base de datos).
    *   **Lógica Principal:**
        1.  Utiliza `prisma.product.findMany()` para obtener todos los registros de la tabla de productos.
        2.  Responde con el array de productos en formato JSON.
        3.  Si ocurre cualquier error durante el proceso, responde con un error 500.
    *   **Uso:** Esta función se utiliza para mostrar el catálogo de productos a los usuarios, tanto en la vista de cliente como potencialmente en paneles de administración.

*   **`getProduct(req: Request, res: Response)`**
    *   **Controlador:** `productController.ts`
    *   **Tipo:** Controlador de ruta Express, función asíncrona (`async`).
    *   **Ruta HTTP Asociada:** `GET /api/products/:id` (típicamente).
    *   **Middleware Previo:** Ninguno explícito (generalmente es una ruta pública).
    *   **Descripción:** Obtiene y devuelve los detalles de un producto específico basado en su ID.
    *   **Parámetros de Ruta:**
        *   `id` (string): El ID numérico del producto a obtener, pasado como parámetro en la URL.
    *   **Respuestas HTTP:**
        *   `200 OK`:
            *   **Cuerpo (JSON):** Un objeto con los detalles del producto encontrado. La estructura es la misma que para los elementos en la respuesta de `listProducts`.
                ```json
                {
                  "id": "number",
                  "name": "string",
                  "description": "string?",
                  "price": "Decimal", 
                  "stock": "number",
                  "imageUrl": "string?",
                  "createdAt": "DateTime",
                  "updatedAt": "DateTime"
                }
                ```
        *   `404 Not Found`:
            *   **Cuerpo (JSON):** `{ "error": "Producto no encontrado" }` (si no existe un producto con el `id` proporcionado).
        *   `500 Internal Server Error`:
            *   **Cuerpo (JSON):** `{ "error": "Error obteniendo producto" }` (si ocurre un error durante la consulta a la base de datos, o si el `id` no es un número válido, aunque esto último podría mejorarse con una validación explícita y un error 400).
    *   **Lógica Principal:**
        1.  Obtiene el `id` del producto de `req.params.id`.
        2.  Utiliza `prisma.product.findUnique` para buscar el producto por su `id` (convertido a número).
        3.  Si el producto no se encuentra, responde con un error 404.
        4.  Si se encuentra, responde con el objeto del producto en formato JSON.
        5.  Si ocurre cualquier otro error durante el proceso (ej. `id` no numérico que cause fallo en `Number(id)` o error de base de datos), responde con un error 500.
    *   **Uso:** Se utiliza para mostrar la página de detalles de un producto específico.

*   **`createProduct(req: Request, res: Response)`**
    *   **Controlador:** `productController.ts`
    *   **Tipo:** Controlador de ruta Express, función asíncrona (`async`).
    *   **Ruta HTTP Asociada:** `POST /api/products` (típicamente).
    *   **Middleware Previo:** `authenticate`, `authorize(['admin', 'seller'])` (implícito, ya que la creación de productos suele estar restringida a administradores o vendedores).
    *   **Descripción:** Crea un nuevo producto con la información proporcionada en el cuerpo de la solicitud.
    *   **Parámetros del Cuerpo de la Solicitud (JSON):**
        *   `name` (string): Nombre del producto (requerido).
        *   `description` (string): Descripción del producto (requerido).
        *   `price` (number/Decimal): Precio del producto (requerido).
        *   `stock` (number): Cantidad en stock del producto (requerido).
        *   `imageUrl` (string, opcional): URL de la imagen del producto. Si se proporciona una cadena vacía o solo espacios, se guardará como `null`.
    *   **Respuestas HTTP:**
        *   `201 Created`:
            *   **Cuerpo (JSON):** Un objeto con los detalles del producto recién creado. La estructura es la misma que para `getProduct`.
                ```json
                {
                  "id": "number",
                  "name": "string",
                  "description": "string",
                  "price": "Decimal",
                  "stock": "number",
                  "imageUrl": "string?",
                  "createdAt": "DateTime",
                  "updatedAt": "DateTime"
                }
                ```
        *   `500 Internal Server Error`:
            *   **Cuerpo (JSON):** `{ "error": "Error creando producto" }` (si ocurre un error durante la creación en la base de datos, por ejemplo, si faltan campos requeridos que no son validados explícitamente antes de llamar a Prisma, o por problemas de base de datos).
    *   **Lógica Principal:**
        1.  Extrae `name`, `description`, `price`, `stock`, y `imageUrl` del cuerpo de la solicitud (`req.body`).
        2.  Prepara un objeto `productData` con los campos requeridos para `Prisma.ProductCreateInput`.
        3.  Si `imageUrl` se proporciona, se recorta (`trim()`). Si resulta en una cadena vacía, se asigna `null` a `productData.imageUrl`; de lo contrario, se asigna la URL recortada.
        4.  Utiliza `prisma.product.create` para guardar el nuevo producto en la base de datos.
        5.  Si la creación es exitosa, responde con el estado `201 Created` y el objeto del producto creado.
        6.  Si ocurre un error, lo registra en la consola y responde con un error 500.
    *   **Observaciones:**
        *   La función asume que los campos `name`, `description`, `price`, y `stock` siempre estarán presentes y serán del tipo correcto. Una validación más robusta (quizás con un middleware de validación) podría añadirse para manejar casos de datos faltantes o incorrectos y devolver errores 400 más específicos.
    *   **Uso:** Utilizada por administradores o vendedores para añadir nuevos productos al catálogo.

*   **`updateProduct(req: Request, res: Response)`**
    *   **Controlador:** `productController.ts`
    *   **Tipo:** Controlador de ruta Express, función asíncrona (`async`).
    *   **Ruta HTTP Asociada:** `PUT /api/products/:id` o `PATCH /api/products/:id` (típicamente).
    *   **Middleware Previo:** `authenticate`, `authorize(['admin', 'seller'])` (implícito, ya que la modificación de productos suele estar restringida).
    *   **Descripción:** Actualiza los detalles de un producto existente, identificado por su ID.
    *   **Parámetros de Ruta:**
        *   `id` (string): El ID numérico del producto a actualizar.
    *   **Parámetros del Cuerpo de la Solicitud (JSON):**
        *   `name` (string, opcional): Nuevo nombre del producto.
        *   `description` (string, opcional): Nueva descripción del producto.
        *   `price` (number/Decimal, opcional): Nuevo precio del producto.
        *   `stock` (number, opcional): Nueva cantidad en stock.
        *   `imageUrl` (string, opcional): Nueva URL de la imagen del producto. Si se proporciona una cadena vacía o solo espacios, se guardará como `null`.
    *   **Respuestas HTTP:**
        *   `200 OK`:
            *   **Cuerpo (JSON):** Un objeto con los detalles actualizados del producto. La estructura es la misma que para `getProduct`.
        *   `400 Bad Request`:
            *   **Cuerpo (JSON):** `{ "error": "ID de producto inválido." }` (si el `id` proporcionado en la ruta no es un número válido).
        *   `404 Not Found`: (No manejado explícitamente, pero Prisma podría devolver un error si el producto con el ID no existe, que actualmente resultaría en un 500. Sería una mejora manejar esto y devolver 404).
        *   `500 Internal Server Error`:
            *   **Cuerpo (JSON):** `{ "error": "Error actualizando producto" }` (si ocurre un error durante la actualización en la base de datos).
    *   **Lógica Principal:**
        1.  Obtiene el `id` del producto de `req.params.id` y lo convierte a número (`productId`).
        2.  Valida si `productId` es un número. Si no, responde 400.
        3.  Extrae `name`, `description`, `price`, `stock`, y `imageUrl` del cuerpo de la solicitud (`req.body`).
        4.  Prepara un objeto `dataToUpdate` con los campos proporcionados.
        5.  Si `imageUrl` se proporciona, se recorta (`trim()`). Si resulta en una cadena vacía, se asigna `null`; de lo contrario, se asigna la URL recortada.
        6.  Utiliza `prisma.product.update` para actualizar el producto en la base de datos, usando `productId` en la cláusula `where`.
        7.  Si la actualización es exitosa, responde con el objeto del producto actualizado.
        8.  Si ocurre un error (ej. el producto no existe, o hay un problema con los datos que viola restricciones de la BD), lo registra en la consola y responde con un error 500.
    *   **Observaciones:**
        *   Sería una mejora verificar explícitamente si el producto existe antes de intentar actualizarlo y devolver un 404 si no se encuentra. Actualmente, un ID no existente podría llevar a un error 500 genérico desde Prisma.
    *   **Uso:** Utilizada por administradores o vendedores para modificar la información de productos existentes.

*   **`deleteProduct(req: Request, res: Response)`**
    *   **Controlador:** `productController.ts`
    *   **Tipo:** Controlador de ruta Express, función asíncrona (`async`).
    *   **Ruta HTTP Asociada:** `DELETE /api/products/:id` (típicamente).
    *   **Middleware Previo:** `authenticate`, `authorize(['admin', 'seller'])` (implícito, ya que la eliminación de productos suele estar restringida).
    *   **Descripción:** Elimina un producto específico del sistema basado en su ID.
    *   **Parámetros de Ruta:**
        *   `id` (string): El ID numérico del producto a eliminar.
    *   **Respuestas HTTP:**
        *   `204 No Content`: Éxito, el producto fue eliminado. No hay cuerpo en la respuesta.
        *   `400 Bad Request`:
            *   **Cuerpo (JSON):** `{ "error": "ID de producto inválido." }` (si el `id` proporcionado en la ruta no es un número válido).
        *   `404 Not Found`:
            *   **Cuerpo (JSON):** `{ "error": "Producto no encontrado." }` (si no existe un producto con el `id` proporcionado).
        *   `409 Conflict`:
            *   **Cuerpo (JSON):** `{ "error": "No se puede eliminar el producto porque está asociado a uno o más pedidos existentes." }` (si la eliminación del producto viola una restricción de clave externa, detectado por el código de error `P2003` de Prisma).
        *   `500 Internal Server Error`:
            *   **Cuerpo (JSON):** `{ "error": "Error interno del servidor al intentar eliminar el producto." }` (para otros errores inesperados durante el proceso).
    *   **Lógica Principal:**
        1.  Obtiene el `id` del producto de `req.params.id` y lo convierte a número (`productId`).
        2.  Valida si `productId` es un número. Si no, responde 400.
        3.  Utiliza `prisma.product.findUnique` para verificar si el producto existe. Si no, responde 404.
        4.  Utiliza `prisma.product.delete` para eliminar el producto de la base de datos.
        5.  Si la eliminación es exitosa, responde 204.
        6.  Si ocurre un error durante la eliminación:
            *   Si es una instancia de `Prisma.PrismaClientKnownRequestError` y el código es `P2003` (restricción de clave externa), responde 409.
            *   Para otros errores, los registra en la consola y responde 500.
    *   **Observaciones:**
        *   La función maneja específicamente el error `P2003` de Prisma para proporcionar un mensaje claro al cliente cuando no se puede eliminar un producto debido a dependencias (ej. está en pedidos existentes).
    *   **Uso:** Utilizada por administradores o vendedores para eliminar productos del catálogo.

### Módulo de Órdenes (`orderController.ts`, etc.)

*   **`listOrders(req: Request, res: Response)`**
    *   **Controlador:** `orderController.ts`
    *   **Tipo:** Controlador de ruta Express, función asíncrona (`async`).
    *   **Ruta HTTP Asociada:** `GET /api/orders` (típicamente).
    *   **Middleware Previo:** `authenticate`, `authorize(['admin'])` (implícito, ya que listar todas las órdenes es una función administrativa).
    *   **Descripción:** Obtiene y devuelve una lista de todas las órdenes en el sistema. Incluye información del usuario asociado y los ítems de cada orden con sus respectivos productos.
    *   **Parámetros de Solicitud:** Ninguno.
    *   **Respuestas HTTP:**
        *   `200 OK`:
            *   **Cuerpo (JSON):** Un array de objetos de orden. Cada objeto incluye:
                *   Campos propios de la orden (ej. `id`, `userId`, `customerName`, `customerEmail`, `totalAmount`, `shippingAddress`, `billingRequested`, `billingDetails`, `paymentStatus`, `status`, `createdAt`, `updatedAt`).
                *   `user`: Objeto con información del usuario que realizó la orden (si aplica).
                *   `items`: Array de `OrderItem`, cada uno con:
                    *   Campos propios del ítem (ej. `id`, `productId`, `productName`, `quantity`, `priceAtOrder`).
                    *   `product`: Objeto con información del producto.
                ```json
                [
                  {
                    "id": "number",
                    "userId": "number | null",
                    "customerName": "string",
                    "customerEmail": "string",
                    "totalAmount": "Decimal",
                    "shippingAddress": { /* JSON object */ },
                    "billingRequested": "boolean",
                    "billingDetails": { /* JSON object | null */ },
                    "paymentStatus": "string", 
                    "status": "string", 
                    "createdAt": "DateTime",
                    "updatedAt": "DateTime",
                    "user": { /* ...user fields... */ },
                    "items": [
                      {
                        "id": "number",
                        "productId": "number",
                        "productName": "string",
                        "quantity": "number",
                        "priceAtOrder": "Decimal",
                        "product": { /* ...product fields... */ }
                      }
                    ]
                  }
                ]
                ```
        *   `500 Internal Server Error`:
            *   **Cuerpo (JSON):** `{ "error": "Error fetching orders" }` (si ocurre un error durante la consulta a la base de datos).
    *   **Lógica Principal:**
        1.  Utiliza `prisma.order.findMany()` para obtener todos los registros de la tabla de órdenes.
        2.  Incluye en la consulta los datos del `user` asociado y los `items` de la orden, y dentro de cada ítem, los datos del `product`.
        3.  Ordena los resultados por fecha de creación (`createdAt`) en orden descendente.
        4.  Responde con el array de órdenes en formato JSON.
        5.  Si ocurre cualquier error, lo registra en consola y responde con un error 500.
    *   **Uso:** Principalmente para paneles de administración para visualizar y gestionar todas las órdenes del sistema.

*   **`getOrder(req: Request, res: Response)`**
    *   **Controlador:** `orderController.ts`
    *   **Tipo:** Controlador de ruta Express, función asíncrona (`async`).
    *   **Ruta HTTP Asociada:** `GET /api/orders/:id` (típicamente).
    *   **Middleware Previo:** `authenticate` (el usuario debe estar autenticado para ver una orden, y la lógica interna o un middleware `authorize` adicional determinaría si puede ver *esta* orden específica, por ejemplo, si es su propia orden o si es un admin).
    *   **Descripción:** Obtiene y devuelve los detalles de una orden específica basada en su ID. Incluye información del usuario asociado y los ítems de la orden con sus respectivos productos.
    *   **Parámetros de Ruta:**
        *   `id` (string): El ID numérico de la orden a obtener.
    *   **Respuestas HTTP:**
        *   `200 OK`:
            *   **Cuerpo (JSON):** Un objeto con los detalles de la orden encontrada. La estructura es la misma que para un elemento en la respuesta de `listOrders`.
                ```json
                {
                  "id": "number",
                  "userId": "number | null",
                  "customerName": "string",
                  "customerEmail": "string",
                  
                  "user": { /* ...user fields... */ },
                  "items": [
                    {
                      "id": "number",
                      "productId": "number",
                      
                      "product": { /* ...product fields... */ }
                    }
                  ]
                }
                ```
        *   `404 Not Found`:
            *   **Cuerpo (JSON):** `{ "error": "Order not found" }` (si no existe una orden con el `id` proporcionado).
        *   `500 Internal Server Error`:
            *   **Cuerpo (JSON):** `{ "error": "Error fetching order" }` (si ocurre un error durante la consulta a la base de datos, o si el `id` no es un número válido y causa un fallo en `Number(id)`).
    *   **Lógica Principal:**
        1.  Obtiene el `id` de la orden de `req.params.id`.
        2.  Utiliza `prisma.order.findUnique` para buscar la orden por su `id` (convertido a número).
        3.  Incluye en la consulta los datos del `user` asociado y los `items` de la orden, y dentro de cada ítem, los datos del `product`.
        4.  Si la orden no se encuentra, responde con un error 404.
        5.  Si se encuentra, responde con el objeto de la orden en formato JSON.
        6.  Si ocurre cualquier otro error, lo registra en consola y responde con un error 500.
    *   **Uso:** Para que los clientes vean los detalles de una orden específica (si es suya) o para que los administradores vean los detalles de cualquier orden.

*   **`createOrder(req: Request, res: Response)`**
    *   **Controlador:** `orderController.ts`
    *   **Tipo:** Controlador de ruta Express, función asíncrona (`async`).
    *   **Ruta HTTP Asociada:** `POST /api/orders` (típicamente).
    *   **Middleware Previo:** Podría ser `optionalAuthenticate` si se quiere adjuntar `req.user` si hay token, o ninguno si la lógica de usuario/invitado se maneja completamente dentro. La función actual parece manejar la lógica de `userId` internamente.
    *   **Descripción:** Crea una nueva orden. Permite a usuarios registrados realizar pedidos y a invitados realizar pedidos con la opción de crear una cuenta si proporcionan una contraseña. Actualiza el stock de los productos y, si se crea un nuevo usuario o es un usuario existente, intenta actualizar sus direcciones predeterminadas.
    *   **Parámetros del Cuerpo de la Solicitud (JSON):**
        *   `userId` (number, opcional): ID del usuario si está logueado.
        *   `customerName` (string, requerido): Nombre completo del cliente.
        *   `customerEmail` (string, requerido): Email del cliente.
        *   `items` (Array<OrderItemInput>, requerido): Array de ítems del pedido.
            *   `OrderItemInput`:
                *   `productId` (number, requerido): ID del producto.
                *   `productName` (string, requerido): Nombre del producto en el momento del pedido.
                *   `quantity` (number, requerido): Cantidad del producto.
                *   `priceAtOrder` (number/Decimal, requerido): Precio del producto en el momento del pedido.
        *   `totalAmount` (number/Decimal, requerido): Monto total del pedido.
        *   `shippingAddress` (JSON, requerido): Objeto con los detalles de la dirección de envío.
            ```json
            {
              "street": "string",
              "city": "string",
              "state": "string",
              "postalCode": "string",
              "country": "string"
            }
            ```
        *   `billingRequested` (boolean, requerido): Indica si se solicitan datos de facturación.
        *   `billingDetails` (JSON, opcional): Objeto con los detalles de facturación, requerido si `billingRequested` es `true`.
        *   `password` (string, opcional): Contraseña para crear una nueva cuenta si el pedido es de un invitado y desea registrarse.
    *   **Respuestas HTTP:**
        *   `201 Created`:
            *   **Cuerpo (JSON):** Objeto con los detalles de la orden recién creada.
        *   `400 Bad Request`:
            *   **Cuerpo (JSON):** `{ "error": "Missing required fields for order creation." }`
            *   **Cuerpo (JSON):** `{ "error": "Invalid items data. Each item must have productId, productName, quantity, and priceAtOrder." }`
            *   **Cuerpo (JSON):** `{ "error": "Failed to create order. A related record (e.g., product or user) was not found.", "details": { ... } }` (Prisma `P2025`).
            *   **Cuerpo (JSON):** `{ "error": "Stock not available for product X" }`
        *   `409 Conflict`:
            *   **Cuerpo (JSON):** `{ "error": "An account with this email already exists. Please login to place your order or use a different email address." }`
            *   **Cuerpo (JSON):** `{ "error": "Failed to create order due to a conflict. Please check data.", "details": { ... } }` (Prisma `P2002`).
        *   `500 Internal Server Error`:
            *   **Cuerpo (JSON):** `{ "error": "Internal server error while creating order." }`
    *   **Lógica Principal:**
        1.  Validación de campos requeridos y estructura de `items`.
        2.  **Manejo de Usuario:** Si `password` y `customerEmail` son provistos sin `userId`, intenta crear cuenta; si email existe, 409.
        3.  **Transacción de Creación de Orden y Actualización de Stock:**
            *   Inicia `prisma.$transaction`.
            *   Para cada ítem: verifica stock y actualiza (resta cantidad). Si no hay stock, aborta.
            *   Crea `Order` y `OrderItem`.
        4.  **Actualización de Direcciones del Usuario (Post-Transacción):** Si hay `effectiveUserId`, intenta actualizar `defaultShippingAddress` y `defaultBillingDetails` del usuario.
        5.  Responde 201 con la nueva orden o errores correspondientes.
    *   **Observaciones:**
        *   La actualización de stock dentro de la transacción es crucial.
        *   La actualización de direcciones del usuario es un efecto secundario y no revierte el pedido si falla.
    *   **Uso:** Endpoint principal para la creación de pedidos por clientes y invitados.

*   **`getMyOrders(req: Request, res: Response)`**
    *   **Controlador:** `orderController.ts`
    *   **Tipo:** Controlador de ruta Express, función asíncrona (`async`).
    *   **Ruta HTTP Asociada:** `GET /api/orders/my-orders` (típicamente).
    *   **Middleware Previo:** `authenticate` (requerido, ya que obtiene el `userId` de `req.user`).
    *   **Descripción:** Obtiene y devuelve una lista de todas las órdenes realizadas por el usuario autenticado. Incluye los ítems de cada orden con sus respectivos productos.
    *   **Parámetros de Solicitud:** Ninguno (utiliza `req.user.userId` internamente).
    *   **Respuestas HTTP:**
        *   `200 OK`:
            *   **Cuerpo (JSON):** Un array de objetos de orden. La estructura de cada objeto es la misma que para `listOrders`.
        *   `401 Unauthorized`:
            *   **Cuerpo (JSON):** `{ "error": "Usuario no autenticado correctamente." }` (si `req.user.userId` no está presente).
        *   `500 Internal Server Error`:
            *   **Cuerpo (JSON):** `{ "error": "Error fetching user orders" }`.
    *   **Lógica Principal:**
        1.  Obtiene `userId` de `req.user`.
        2.  Si `userId` no existe, responde 401.
        3.  Usa `prisma.order.findMany` para buscar órdenes del `userId`, incluyendo `items` y sus `product`.
        4.  Ordena por `createdAt` descendente.
        5.  Responde con el array de órdenes.
        6.  Maneja errores con 500.
    *   **Uso:** Para que los clientes vean su historial de pedidos.

*   **`updateOrder(req: Request, res: Response)`**
    *   **Controlador:** `orderController.ts`
    *   **Tipo:** Controlador de ruta Express, función asíncrona (`async`).
    *   **Ruta HTTP Asociada:** `PUT /api/orders/:id` o `PATCH /api/orders/:id` (típicamente).
    *   **Middleware Previo:** `authenticate`, `authorize(['admin'])` (implícito).
    *   **Descripción:** Actualiza el estado (`status`) y/o el estado de pago (`paymentStatus`) de una orden específica.
    *   **Parámetros de Ruta:**
        *   `id` (string): El ID numérico de la orden a actualizar.
    *   **Parámetros del Cuerpo de la Solicitud (JSON):**
        *   `status` (string, opcional): Nuevo estado de la orden.
        *   `paymentStatus` (string, opcional): Nuevo estado de pago.
    *   **Respuestas HTTP:**
        *   `200 OK`:
            *   **Cuerpo (JSON):** Objeto con los detalles actualizados de la orden.
        *   `400 Bad Request`:
            *   **Cuerpo (JSON):** `{ "error": "No update data provided." }`
        *   `404 Not Found`:
            *   **Cuerpo (JSON):** `{ "error": "Order not found for updating." }` (Prisma `P2025`).
        *   `500 Internal Server Error`:
            *   **Cuerpo (JSON):** `{ "error": "Error updating order" }`.
    *   **Lógica Principal:**
        1.  Obtiene `id` de `req.params`.
        2.  Extrae `status` y `paymentStatus` de `req.body`.
        3.  Si no se proporcionan datos para actualizar, responde 400.
        4.  Usa `prisma.order.update` para actualizar la orden, incluyendo `items` y `user` en la respuesta.
        5.  Maneja error `P2025` de Prisma con 404, otros errores con 500.
    *   **Observaciones:**
        *   Permite actualizaciones parciales.
        *   Se beneficiaría de validación de los valores de `status` y `paymentStatus` contra enums de Prisma.
    *   **Uso:** Para administradores, para actualizar estado de órdenes y pagos.

*   **`deleteOrder(req: Request, res: Response)`**
    *   **Controlador:** `orderController.ts`
    *   **Tipo:** Controlador de ruta Express, función asíncrona (`async`).
    *   **Ruta HTTP Asociada:** `DELETE /api/orders/:id` (típicamente).
    *   **Middleware Previo:** `authenticate`, `authorize(['admin'])` (implícito).
    *   **Descripción:** Elimina una orden específica y todos sus `OrderItem` asociados dentro de una transacción.
    *   **Parámetros de Ruta:**
        *   `id` (string): El ID numérico de la orden a eliminar.
    *   **Respuestas HTTP:**
        *   `200 OK`:
            *   **Cuerpo (JSON):** `{ "message": "Order with ID X and its items deleted successfully" }`.
        *   `404 Not Found`:
            *   **Cuerpo (JSON):** `{ "message": "Order with ID X not found" }` (Prisma `P2025`).
        *   `500 Internal Server Error`:
            *   **Cuerpo (JSON):** `{ "message": "Error deleting order", "error": "mensaje de error original" }`.
    *   **Lógica Principal:**
        1.  Obtiene `id` de `req.params`.
        2.  Inicia `prisma.$transaction`:
            *   Elimina `OrderItem` asociados a la `orderId`.
            *   Elimina la `Order`.
        3.  Si la transacción es exitosa, responde 200.
        4.  Maneja error `P2025` de Prisma con 404, otros errores con 500.
    *   **Observaciones:**
        *   Uso de transacción para atomicidad es crucial.
        *   Maneja el caso de orden no encontrada con 404.
    *   **Uso:** Para administradores, para eliminar órdenes permanentemente.

## Funciones del Frontend

Aquí se describirán las funciones principales del lado del cliente, incluyendo componentes de React, hooks personalizados, helpers, etc.

### Vista de Registro (`RegisterView.tsx`)

*   **`checkEmailAvailability()`**
    *   **Tipo:** Función asíncrona (`async`).
    *   **Descripción:** Verifica la disponibilidad y el formato de un correo electrónico ingresado por el usuario en el formulario de registro. Se ejecuta típictamente cuando el campo de correo electrónico pierde el foco (`onBlur`).
    *   **Dependencias de Estado (Lectura):**
        *   `email` (string): El valor actual del campo de correo electrónico.
        *   `t` (función): La función de internacionalización para obtener mensajes traducidos.
    *   **Efectos de Estado (Escritura):**
        *   `emailVerificationStatus` ('idle' | 'verifying' | 'verified' | 'exists' | 'error' | 'invalid_format'): Actualiza el estado de la verificación del correo.
        *   `emailVerificationMessage` (string | null): Establece un mensaje para el usuario sobre el resultado de la verificación.
    *   **Lógica Principal:**
        1.  Si el campo `email` está vacío, resetea el estado de verificación a `idle` y borra cualquier mensaje.
        2.  Utiliza la función interna `isValidEmail` para verificar el formato del correo. Si es inválido, establece `emailVerificationStatus` a `invalid_format` y muestra el mensaje de error correspondiente (obtenido con `t('invalidEmailFormatError')`).
        3.  Si el formato es válido, establece `emailVerificationStatus` a `verifying`.
        4.  Realiza una petición `fetch` al endpoint GET `/api/users/check-email?email=<encoded_email>`.
        5.  **Manejo de Respuesta de API:**
            *   Si la respuesta no es `ok` (ej. error de red, error 500):
                *   Si el `status` es `304` (Not Modified), se registra una advertencia y se considera un error, mostrando un mensaje (`t('errorCheckingEmail')`).
                *   Para otros errores, lanza una excepción.
            *   Si la respuesta es `ok`:
                *   Parsea la respuesta JSON. Se espera un objeto con una propiedad booleana `exists`.
                *   Si `data.exists` es `true`, el correo ya está registrado. Establece `emailVerificationStatus` a `exists` y muestra el mensaje (`t('emailAlreadyRegisteredError')`).
                *   Si `data.exists` es `false`, el correo está disponible. Establece `emailVerificationStatus` a `verified` y borra el mensaje (o podría mostrar uno de éxito).
        6.  **Manejo de Errores (Catch):**
            *   Si ocurre cualquier error durante el proceso (fetch, parseo, etc.), se captura.
            *   Establece `emailVerificationStatus` a `error`.
            *   Muestra un mensaje de error genérico (`t('errorCheckingEmail')` o `t('errorNetworkResponse')`) o el mensaje de error de la excepción.
    *   **Uso:** Esta función es crucial para proporcionar retroalimentación inmediata al usuario sobre la validez y disponibilidad de su correo electrónico antes de que intente enviar el formulario de registro.

### Vista de Cliente (`CustomerView.tsx`)

*   ...
