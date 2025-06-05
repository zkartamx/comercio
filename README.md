# Sales Channel Pro

## Descripción

Sales Channel Pro es una aplicación web diseñada para gestionar un canal de ventas. Permite a los clientes navegar productos, realizar pedidos, registrarse y gestionar sus perfiles; a los vendedores registrar ventas y solicitar productos; y a los administradores monitorear la demanda, gestionar productos, vendedores, y obtener resúmenes de ventas impulsados por IA (actualmente simulado).

## Características Principales

*   **Portal de Cliente:**
    *   Navegación y búsqueda de productos.
    *   Carrito de compras.
    *   Proceso de checkout y confirmación de pedido.
    *   Notificación de pedido por WhatsApp al administrador (simulada su apertura).
    *   **Registro y gestión de cuentas de cliente.**
    *   **Gestión de perfiles de usuario (nombre, contraseña).**
    *   **Gestión de direcciones de envío guardadas.**
    *   **Gestión de datos de facturación guardados.**
    *   **Visualización del historial de pedidos.**
*   **Portal de Vendedor (Requiere Autenticación):**
    *   Registro de ventas directas.
    *   Solicitud de reposición de stock de productos.
*   **Panel de Administración (Requiere Autenticación):**
    *   Visualización y gestión del estado de pedidos de clientes (incluyendo estado de pago).
*   Visualización de ventas de vendedores.
*   Búsqueda y filtrado en pedidos de clientes y ventas de vendedores para agilizar la revisión.
    *   Gestión de solicitudes de productos de vendedores (aprobación/rechazo/surtido).
    *   Gestión de Productos (CRUD):
        *   Agregar nuevos productos al catálogo.
        *   Ver y editar detalles de productos existentes.
        *   Eliminar productos.
    *   Gestión de Vendedores (CRUD):
        *   Agregar nuevos vendedores al sistema.
        *   Ver y eliminar vendedores existentes.
    *   Resumen de Ventas con IA: Generación de un análisis de tendencias de ventas (actualmente simulado, diseñado para usar la API de Gemini).

## Stack Tecnológico (Frontend)

*   **React 19** con Hooks
*   **TypeScript** para tipado estático
*   **Tailwind CSS** para la interfaz de usuario (configuración en `index.html`)
*   **Simulación de API de Google Gemini** para el resumen de ventas (la lógica de la IA está simulada en `services/apiService.ts`).

## Backend Simulado (`services/apiService.ts`)

Este proyecto utiliza `services/apiService.ts` para simular un backend completo. Todas las operaciones de datos (CRUD, autenticación) se realizan contra arrays en memoria dentro de este archivo.

*   **Persistencia de Datos:** Los datos persisten únicamente durante la sesión activa del navegador. Un refresco completo de la página (F5) reiniciará los datos a su estado inicial definido en `apiService.ts`, a menos que la funcionalidad esté integrada con el guardado de estado del entorno Framer si se usa allí.
*   **Retrasos Simulados:** Todas las "llamadas API" tienen un retraso simulado para imitar la asincronía del mundo real.
*   **Autenticación Simulada:** Implementa un sistema básico de usuarios y roles.
*   **Usuarios por Defecto:**
    *   **Administrador:**
        *   Usuario: `admin`
        *   Contraseña: `password123`
    *   **Vendedores:**
        *   Usuario: `vendedor1`, Contraseña: `password123`
        *   Usuario: `vendedor2`, Contraseña: `password123`
        *   Usuario: `vendedor3`, Contraseña: `password123`
    *   **Cliente Ejemplo Registrado:**
        *   Email: `cliente@example.com`
        *   Contraseña: `password123`

## Cómo Empezar / Ejecutar la Aplicación

Esta aplicación está diseñada para ejecutarse en un entorno que soporte módulos ES6 y React.
1.  Asegúrate de tener un entorno de desarrollo web (como Node.js para herramientas, aunque no es estrictamente necesario para solo ejecutar este HTML/TSX en algunos sandboxes).
2.  Sirve el archivo `index.html` a través de un servidor web simple o ábrelo directamente en un navegador moderno.
    *   En un entorno tipo Framer, la importación de `index.tsx` desde `index.html` se maneja automáticamente.
3.  **Clave API de Gemini (para funcionalidad real de IA):**
    *   La aplicación espera que una variable de entorno `process.env.API_KEY` esté preconfigurada y accesible en el contexto de ejecución donde se inicializaría el cliente de la API de Gemini.
    *   **Actualmente, la funcionalidad de IA está simulada en `services/apiService.ts` y no realiza llamadas reales a la API de Gemini.** Para habilitar llamadas reales, se debería implementar `geminiService.ts` y modificar `apiService.ts` para que lo utilice, además de configurar la API Key.

## Estructura del Proyecto

```
/
├── public/                     # Archivos estáticos (si los hubiera)
├── components/                 # Componentes reutilizables de React
│   ├── Header.tsx
│   ├── Modal.tsx
│   └── ProductCard.tsx
├── services/                   # Lógica de servicios, incluyendo la simulación del backend
│   ├── apiService.ts           # Simulación del backend y lógica de "negocio"
│   └── (geminiService.ts)      # (Archivo vacío, para futura integración real con Gemini API)
├── views/                      # Componentes de React que representan las vistas principales
│   ├── AdminView.tsx
│   ├── CustomerView.tsx
│   ├── LoginView.tsx
│   ├── ProfileView.tsx         # NUEVO: Vista de perfil de cliente
│   ├── RegisterView.tsx        # NUEVO: Vista de registro de cliente
│   └── SellerView.tsx
├── App.tsx                     # Componente raíz de la aplicación, maneja el estado global y el enrutamiento de vistas
├── constants.ts                # Constantes de la aplicación (ej. número de WhatsApp)
├── index.html                  # Punto de entrada HTML
├── index.tsx                   # Punto de entrada de React, monta App.tsx
├── localization.ts             # Traducciones de la interfaz (actualmente solo en español)
├── metadata.json               # Metadatos de la aplicación para el entorno Framer
├── README.md                   # Este archivo
└── types.ts                    # Definiciones de tipos de TypeScript
```

## Archivos Clave

*   **`App.tsx`**: Orquesta la aplicación. Maneja el estado global principal (productos, carrito, usuario actual, vista actual), la lógica de autenticación, y las acciones de alto nivel que interactúan con `apiService.ts`.
*   **`services/apiService.ts`**: El corazón de la simulación del backend. Define los datos iniciales, las funciones para obtener y modificar datos, y la lógica de autenticación y autorización simulada.
*   **`localization.ts`**: Contiene todas las cadenas de texto visibles por el usuario, permitiendo una fácil internacionalización. Actualmente, solo contiene traducciones al español.
*   **`types.ts`**: Define todas las interfaces y tipos de datos TypeScript utilizados en la aplicación, asegurando la consistencia y ayudando a prevenir errores.
*   **`views/*View.tsx`**: Cada archivo en este directorio representa una pantalla principal o portal dentro de la aplicación. `ProfileView.tsx` y `RegisterView.tsx` son clave para la funcionalidad de cuentas de cliente.

## Autenticación

*   **Roles:**
    *   **Cliente:** Puede navegar productos y agregar al carrito sin iniciar sesión. Para finalizar una compra, ver el historial de pedidos, o gestionar su perfil (direcciones, datos de facturación), el cliente debe registrarse e iniciar sesión.
    *   **Vendedor:** Requiere inicio de sesión.
    *   **Administrador:** Requiere inicio de sesión.
*   **Flujo:** Al intentar acceder a una vista protegida (Vendedor, Admin, o Perfil de Cliente) sin una sesión activa, el usuario es redirigido a `LoginView`. Después de un inicio de sesión exitoso, se le redirige a la vista deseada. Los clientes pueden registrarse a través de `RegisterView`.
*   **Credenciales por Defecto (ver `services/apiService.ts`):**
    *   Admin: `admin` / `password123`
    *   Vendedores: `vendedor1` / `password123`, `vendedor2` / `password123`, etc.
    *   Cliente ejemplo: `cliente@example.com` / `password123`

## Portal de Cliente - Gestión de Cuenta

Los clientes que se registran e inician sesión pueden acceder a la vista "Mi Perfil" (`ProfileView.tsx`) donde pueden:
*   **Editar Perfil:** Actualizar su nombre para mostrar y cambiar su contraseña.
*   **Gestionar Direcciones:** Guardar y modificar su dirección de envío principal.
*   **Gestionar Datos de Facturación:** Guardar y modificar su información fiscal para facturas.
*   **Ver Historial de Pedidos:** Consultar una lista de todos los pedidos que han realizado.

## Panel de Administración - Gestión de Productos

La sección "Gestionar Productos" en el Panel de Administración permite:
*   **Crear:** Añadir nuevos productos con nombre, descripción, precio, stock inicial y URL de imagen.
*   **Leer:** Ver una lista de todos los productos existentes con sus detalles e imagen.
*   **Actualizar:** Editar la información de cualquier producto existente a través de un modal.
*   **Eliminar:** Borrar productos del sistema (con confirmación).

## Panel de Administración - Gestión de Vendedores

La sección "Gestionar Vendedores" en el Panel de Administración permite:
*   **Crear:** Añadir nuevos usuarios vendedores con nombre de usuario, contraseña y nombre para mostrar.
*   **Leer:** Ver una lista de todos los vendedores existentes.
*   **Eliminar:** Borrar vendedores del sistema (con confirmación).

## Panel de Administración - Resumen de Ventas con IA

*   **Propósito:** Proveer a los administradores un análisis inteligente de las tendencias de ventas, productos populares, y posibles recomendaciones.
*   **Implementación Actual:** Esta funcionalidad está **simulada** dentro de `services/apiService.ts`. La función `getSalesSummary` genera un texto de resumen basado en los datos de ventas recientes sin realizar una llamada real a la API de Gemini.
*   **Diseño Futuro:** Está diseñado para que, en una implementación real, se llame a un backend que a su vez utilice la API de Gemini (por ejemplo, el modelo `gemini-2.5-flash-preview-04-17`) para generar el análisis.

## Notas de Desarrollo

*   **Estilo:** Se utiliza Tailwind CSS para un desarrollo rápido de la UI. La configuración de Tailwind (colores personalizados, fuentes) se encuentra directamente en `index.html`.
*   **Gestión de Estado:** Principalmente a través del estado local de los componentes React y el levantamiento del estado a `App.tsx` para datos globales. No se utiliza una librería de gestión de estado externa como Redux o Zustand para mantener la simplicidad.
*   **Internacionalización (i18n):** Todas las cadenas de texto de la UI se gestionan a través del objeto `translations` en `localization.ts` y la función `t()` en `App.tsx` (pasada como prop). Esto facilita la adición de nuevos idiomas.

## Consideraciones para Despliegue en el Mundo Real

*   **Seguridad:**
    *   La autenticación simulada y las contraseñas en texto plano en `apiService.ts` **DEBEN SER REEMPLAZADAS** por un sistema de autenticación robusto y seguro (ej. OAuth 2.0, JWT) con hashing de contraseñas.
    *   Las claves API (como la de Gemini) **NUNCA** deben exponerse en el código del cliente. Deben manejarse en un backend seguro.
*   **Base de Datos:** Reemplazar los arrays en memoria de `apiService.ts` con una base de datos real (ej. PostgreSQL, MongoDB, Firebase Firestore) para la persistencia de datos.
*   **Integración con la API de Gemini:**
    *   La llamada real a la API de Gemini debe realizarse desde un servidor backend para proteger la clave API y gestionar las solicitudes de manera eficiente.
    *   Implementar la lógica en `geminiService.ts` (o un archivo similar en el backend) y que `apiService.ts` (o su equivalente en el backend) lo utilice.
*   **Manejo de Errores:** Aunque hay manejo básico de errores y notificaciones, se podría mejorar con un sistema más robusto y granular.
*   **Escalabilidad:** Considerar una arquitectura de backend apropiada (ej. microservicios, serverless) si se espera un alto volumen de usuarios o datos.
*   **Validación:** Añadir validación más exhaustiva tanto en el frontend como en el backend.
*   **Optimización:** Para aplicaciones grandes, considerar la división de código (code splitting), lazy loading de componentes, y optimización de imágenes.

Este README provee una base. Se recomienda actualizarlo continuamente a medida que el proyecto evoluciona.