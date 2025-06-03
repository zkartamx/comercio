import { Product, User, Role, Order, OrderStatus, PaymentStatus, OrderItem, SaleRecord, SaleSource, ProductRequest, RequestStatus, CartItem, Address, BillingInfo } from '../types';
import { translations } from '../localization'; // For Gemini prompt, ideally backend handles its own localization

// --- SIMULATED BACKEND DATABASE ---
let dbUsers: User[] = [
  { id: 'admin01', username: 'admin', password: 'password123', role: Role.ADMIN, displayName: 'Administrador Principal', createdAt: new Date().toISOString() },
  { id: 'Vendedor001', username: 'vendedor1', password: 'password123', role: Role.SELLER, displayName: 'Juan Pérez (Vendedor001)', createdAt: new Date().toISOString() },
  { id: 'Vendedor002', username: 'vendedor2', password: 'password123', role: Role.SELLER, displayName: 'Maria López (Vendedor002)', createdAt: new Date().toISOString() },
  { id: 'Vendedor003', username: 'vendedor3', password: 'password123', role: Role.SELLER, displayName: 'Carlos Sánchez (Vendedor003)', createdAt: new Date().toISOString() },
  { 
    id: 'cust_001', 
    username: 'cliente@example.com', // For customers, username is email
    email: 'cliente@example.com',
    password: 'password123', 
    role: Role.CUSTOMER, 
    displayName: 'Cliente Ejemplo Registrado',
    address: { street: 'Calle Falsa 123', city: 'Ciudad Ejemplo', state: 'Estado Ejemplo', zip: '12345', country: 'México', phone: '555-1234'},
    billingInfo: { 
        rfc: 'XAXX010101000', 
        razonSocial: 'Cliente Ejemplo SA de CV', 
        cfdiUse: 'G03', 
        fiscalAddress: { street: 'Av. Fiscal 789', city: 'Ciudad Fiscal', state: 'Estado Fiscal', zip: '67890', country: 'México'},
        email: 'facturacion@example.com'
    },
    createdAt: new Date().toISOString()
  },
];

let dbProducts: Product[] = [
  {
    id: 'prod_1',
    name: 'Audífonos Inalámbricos Premium',
    description: 'Experimenta un sonido inmersivo con nuestros audífonos inalámbricos con cancelación de ruido. Larga duración de batería y diseño cómodo.',
    price: 2999.00,
    imageUrl: 'https://picsum.photos/seed/headphones/400/300',
    stock: 50,
  },
  {
    id: 'prod_2',
    name: 'Monitor de Actividad Inteligente',
    description: 'Monitorea tu actividad, ritmo cardíaco y patrones de sueño con este elegante monitor de actividad. Resistente al agua y con GPS.',
    price: 1590.00,
    imageUrl: 'https://picsum.photos/seed/tracker/400/300',
    stock: 120,
  },
   {
    id: 'prod_3',
    name: 'Granos de Café Orgánico (1kg)',
    description: 'Granos de café orgánico de origen único, tostados artesanalmente. Perfectos para una infusión rica y aromática.',
    price: 440.00,
    imageUrl: 'https://picsum.photos/seed/coffee/400/300',
    stock: 200,
  },
  {
    id: 'prod_4',
    name: 'Silla de Oficina Ergonómica',
    description: 'Mejora tu postura y comodidad con esta silla de oficina ergonómica ajustable. Respaldo de malla transpirable y soporte lumbar.',
    price: 5980.00,
    imageUrl: 'https://picsum.photos/seed/chair/400/300',
    stock: 30,
  },
  {
    id: 'prod_5',
    name: 'Bocina Bluetooth Portátil',
    description: 'Bocina Bluetooth compacta pero potente con bajos profundos y agudos claros. Hasta 12 horas de reproducción.',
    price: 920.00,
    imageUrl: 'https://picsum.photos/seed/speaker/400/300',
    stock: 75,
  },
];

let dbOrders: Order[] = [];
let dbSales: SaleRecord[] = [];
let dbProductRequests: ProductRequest[] = [];
let currentSessionUser: User | null = null;
const SIMULATED_DELAY = 500;

// --- AUTHENTICATION ---

/**
 * Simulates a user login.
 * @param {string} credential - Username for Admin/Seller, Email for Customer.
 * @param {string} passwordInput - The password input.
 * @param {Role} roleToLoginAs - The role the user is attempting to log in as.
 * @returns {Promise<User>} A promise that resolves with the user object on successful login.
 * @throws {Error} If login fails.
 */
export const login = (credential: string, passwordInput: string, roleToLoginAs: Role): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = dbUsers.find(u => 
        ( (roleToLoginAs === Role.CUSTOMER && u.email === credential) || (roleToLoginAs !== Role.CUSTOMER && u.username === credential) ) &&
        u.role === roleToLoginAs
      );

      if (user && user.password === passwordInput) {
        currentSessionUser = { ...user };
        const { password, ...userToReturn } = currentSessionUser; // Don't send password to frontend
        resolve(userToReturn);
      } else {
        reject(new Error(translations.loginFailedError || 'Credenciales incorrectas o rol no válido.'));
      }
    }, SIMULATED_DELAY);
  });
};

/**
 * Simulates customer registration.
 * @param {Pick<User, 'displayName' | 'email' | 'password'>} customerData - Data for the new customer.
 * @returns {Promise<User>} Resolves with the new user object (without password).
 * @throws {Error} If email already exists or data is invalid.
 */
export const registerCustomer = (customerData: Pick<User, 'displayName' | 'email' | 'password'>): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!customerData.email || !customerData.password || !customerData.displayName) {
        reject(new Error("Nombre para mostrar, correo electrónico y contraseña son obligatorios."));
        return;
      }
      if (dbUsers.some(u => u.email === customerData.email && u.role === Role.CUSTOMER)) {
        reject(new Error(translations.emailAlreadyExists || "Este correo electrónico ya está registrado."));
        return;
      }
      const newCustomer: User = {
        id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        username: customerData.email, // For customers, username is email
        email: customerData.email,
        password: customerData.password, // Store password (hash in real app)
        role: Role.CUSTOMER,
        displayName: customerData.displayName,
        createdAt: new Date().toISOString(),
        // address and billingInfo can be added later via profile update
      };
      dbUsers.push(newCustomer);
      currentSessionUser = { ...newCustomer }; // Log in the new user
      const { password, ...userToReturn } = currentSessionUser;
      resolve(userToReturn);
    }, SIMULATED_DELAY);
  });
};

export const logout = (): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      currentSessionUser = null;
      resolve();
    }, SIMULATED_DELAY / 2);
  });
};

export const checkAuth = (): Promise<User | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (currentSessionUser) {
        const { password, ...userToReturn } = currentSessionUser;
        resolve(userToReturn);
      } else {
        resolve(null);
      }
    }, SIMULATED_DELAY / 3);
  });
};

// --- USER PROFILE MANAGEMENT (CUSTOMER) ---
/**
 * Simulates updating a customer's profile.
 * @param {string} userId - The ID of the user to update.
 * @param {Partial<User>} dataToUpdate - The data fields to update.
 * @returns {Promise<User>} Resolves with the updated user object (without password).
 * @throws {Error} If user not found, or trying to update forbidden fields.
 */
export const updateUserProfile = (userId: string, dataToUpdate: Partial<User>): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const userIndex = dbUsers.findIndex(u => u.id === userId);
      if (userIndex === -1) {
        reject(new Error("Usuario no encontrado."));
        return;
      }
      if (dbUsers[userIndex].id !== currentSessionUser?.id) {
        reject(new Error("No autorizado para actualizar este perfil.")); // Basic check
        return;
      }

      // Fields that can be updated by customer
      const allowedUpdates: (keyof User)[] = ['displayName', 'address', 'billingInfo'];
      // Password update is special
      if (dataToUpdate.password && dataToUpdate['currentPassword']) { // Assuming 'currentPassword' is passed for verification
         if (dbUsers[userIndex].password === dataToUpdate['currentPassword']) {
             dbUsers[userIndex].password = dataToUpdate.password;
         } else {
             reject(new Error(translations.errorPasswordChange || "La contraseña actual es incorrecta."));
             return;
         }
      }


      for (const key of allowedUpdates) {
        if (dataToUpdate[key] !== undefined) {
          (dbUsers[userIndex] as any)[key] = dataToUpdate[key];
        }
      }
      
      // Update current session user as well if it's the same user
      if (currentSessionUser && currentSessionUser.id === userId) {
        currentSessionUser = { ...dbUsers[userIndex] };
      }
      
      const { password, ...updatedUserToReturn } = dbUsers[userIndex];
      resolve(updatedUserToReturn);
    }, SIMULATED_DELAY);
  });
};


// --- DATA FETCHING ---
export const getProducts = (): Promise<Product[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(dbProducts.map(p => ({...p})));
    }, SIMULATED_DELAY);
  });
};

const requireAuth = (role?: Role): Promise<User> => {
  return new Promise((resolve, reject) => {
    if (!currentSessionUser) {
      reject(new Error("Acceso denegado. Se requiere autenticación."));
      return;
    }
    if (role && currentSessionUser.role !== role) {
      reject(new Error(`Acceso denegado. Se requiere rol de ${role}.`));
      return;
    }
    resolve(currentSessionUser); // Return current user if auth passes
  });
};


export const getOrders = (): Promise<Order[]> => {
  return requireAuth(Role.ADMIN).then(() => new Promise((resolve) => {
    setTimeout(() => {
      resolve(dbOrders.map(o => ({...o})));
    }, SIMULATED_DELAY);
  }));
};

/**
 * Simulates fetching orders for a specific customer. (Customer Only)
 * @param {string} userId - The ID of the customer.
 * @returns {Promise<Order[]>} Resolves with an array of the customer's orders.
 */
export const getCustomerOrders = (userId: string): Promise<Order[]> => {
  return requireAuth(Role.CUSTOMER).then(user => {
    if (user.id !== userId) {
      return Promise.reject(new Error("No autorizado para ver estos pedidos."));
    }
    return new Promise((resolve) => {
      setTimeout(() => {
        const customerOrders = dbOrders.filter(order => order.userId === userId);
        resolve(customerOrders.map(o => ({ ...o })));
      }, SIMULATED_DELAY);
    });
  });
};


export const getSales = (): Promise<SaleRecord[]> => {
 return requireAuth(Role.ADMIN).then(() => new Promise((resolve) => {
    setTimeout(() => {
      resolve(dbSales.map(s => ({...s})));
    }, SIMULATED_DELAY);
  }));
};

export const getProductRequests = (): Promise<ProductRequest[]> => {
  return requireAuth(Role.ADMIN).then(() => new Promise((resolve) => {
    setTimeout(() => {
      resolve(dbProductRequests.map(pr => ({...pr})));
    }, SIMULATED_DELAY);
  }));
};

// --- DATA MUTATION ---
export const placeOrder = (orderData: Omit<Order, 'id' | 'createdAt' | 'status' | 'paymentStatus'>): Promise<Order> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // If userId is provided (customer is logged in), ensure they are the one placing the order
      if (orderData.userId && (!currentSessionUser || currentSessionUser.id !== orderData.userId || currentSessionUser.role !== Role.CUSTOMER)) {
         reject(new Error("Conflicto de sesión de usuario al realizar el pedido."));
         return;
      }

      const newOrder: Order = {
        ...orderData, // This includes userId, customerName, customerEmail, shippingAddress, billingRequested, billingDetails
        id: `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        createdAt: new Date().toISOString(),
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.UNPAID, // New orders are unpaid by default
      };
      
      let stockSufficient = true;
      const stockUpdates: { productId: string; newStock: number }[] = [];

      for (const item of newOrder.items) {
        const productIndex = dbProducts.findIndex(p => p.id === item.productId);
        if (productIndex === -1) {
          reject(new Error(`Producto con ID ${item.productId} no encontrado.`));
          return;
        }
        if (dbProducts[productIndex].stock < item.quantity) {
          stockSufficient = false;
          break;
        }
        stockUpdates.push({ productId: item.productId, newStock: dbProducts[productIndex].stock - item.quantity });
      }

      if (!stockSufficient) {
        reject(new Error("Stock insuficiente para uno o más productos."));
        return;
      }

      stockUpdates.forEach(update => {
        const productIndex = dbProducts.findIndex(p => p.id === update.productId);
        if (productIndex !== -1) { 
            dbProducts[productIndex].stock = update.newStock;
        }
      });

      dbOrders.unshift(newOrder); // Add to beginning for easier visibility

      const newSaleRecord: SaleRecord = {
        id: `sale_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        orderId: newOrder.id,
        items: newOrder.items.map(item => ({ ...item })),
        totalAmount: newOrder.totalAmount,
        saleDate: new Date().toISOString(),
        source: SaleSource.ONLINE,
      };
      dbSales.unshift(newSaleRecord);
      resolve({ ...newOrder });
    }, SIMULATED_DELAY);
  });
};

export const addSaleRecord = (saleData: Omit<SaleRecord, 'id' | 'saleDate' | 'source'>): Promise<SaleRecord> => {
  return requireAuth(Role.SELLER).then(user => new Promise((resolve, reject) => {
    setTimeout(() => {
      const newSale: SaleRecord = {
        ...saleData,
        sellerId: user.id, 
        id: `sale_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        saleDate: new Date().toISOString(),
        source: SaleSource.SELLER,
      };

      let stockSufficient = true;
      const stockUpdates: { productId: string; newStock: number }[] = [];

      for (const item of newSale.items) {
        const productIndex = dbProducts.findIndex(p => p.id === item.productId);
        if (productIndex === -1) {
          reject(new Error(`Producto con ID ${item.productId} no encontrado.`));
          return;
        }
        if (dbProducts[productIndex].stock < item.quantity) {
          stockSufficient = false;
          break;
        }
        stockUpdates.push({ productId: item.productId, newStock: dbProducts[productIndex].stock - item.quantity });
      }

      if (!stockSufficient) {
        reject(new Error("Stock insuficiente para uno o más productos."));
        return;
      }

      stockUpdates.forEach(update => {
        const productIndex = dbProducts.findIndex(p => p.id === update.productId);
        if (productIndex !== -1) {
            dbProducts[productIndex].stock = update.newStock;
        }
      });
      
      dbSales.unshift(newSale);
      resolve({ ...newSale });
    }, SIMULATED_DELAY);
  }));
};

export const addProductRequest = (
  requestData: Pick<ProductRequest, 'productId' | 'quantityRequested' | 'notes'>
): Promise<ProductRequest> => {
 return requireAuth(Role.SELLER).then(user => new Promise((resolve, reject) => {
    setTimeout(() => {
      const product = dbProducts.find(p => p.id === requestData.productId);
      if (!product) {
        reject(new Error(`Producto con ID ${requestData.productId} no encontrado.`));
        return;
      }

      const newRequest: ProductRequest = {
        productId: requestData.productId,
        quantityRequested: requestData.quantityRequested,
        notes: requestData.notes,
        sellerId: user.id, 
        productName: product.name,
        id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        requestDate: new Date().toISOString(),
        status: RequestStatus.PENDING,
      };
      dbProductRequests.unshift(newRequest);
      resolve({ ...newRequest });
    }, SIMULATED_DELAY);
  }));
};

export const updateOrderStatus = (orderId: string, status: OrderStatus): Promise<Order> => {
  return requireAuth(Role.ADMIN).then(() => new Promise((resolve, reject) => {
    setTimeout(() => {
      const orderIndex = dbOrders.findIndex(o => o.id === orderId);
      if (orderIndex > -1) {
        dbOrders[orderIndex].status = status;
        resolve({ ...dbOrders[orderIndex] });
      } else {
        reject(new Error(`Pedido con ID ${orderId} no encontrado.`));
      }
    }, SIMULATED_DELAY / 2);
  }));
};

export const updateOrderPaymentStatus = (orderId: string, paymentStatus: PaymentStatus): Promise<Order> => {
  return requireAuth(Role.ADMIN).then(() => new Promise((resolve, reject) => {
    setTimeout(() => {
      const orderIndex = dbOrders.findIndex(o => o.id === orderId);
      if (orderIndex > -1) {
        dbOrders[orderIndex].paymentStatus = paymentStatus;
        resolve({ ...dbOrders[orderIndex] });
      } else {
        reject(new Error(`Pedido con ID ${orderId} no encontrado.`));
      }
    }, SIMULATED_DELAY / 2);
  }));
};

export const updateRequestStatus = (requestId: string, status: RequestStatus): Promise<ProductRequest> => {
 return requireAuth(Role.ADMIN).then(() => new Promise((resolve, reject) => {
    setTimeout(() => {
      const requestIndex = dbProductRequests.findIndex(r => r.id === requestId);
      if (requestIndex > -1) {
        const oldStatus = dbProductRequests[requestIndex].status;
        dbProductRequests[requestIndex].status = status;

        if (status === RequestStatus.FULFILLED && oldStatus !== RequestStatus.FULFILLED) {
          const productIndex = dbProducts.findIndex(p => p.id === dbProductRequests[requestIndex].productId);
          if (productIndex > -1) {
            dbProducts[productIndex].stock += dbProductRequests[requestIndex].quantityRequested;
          } else {
            console.warn(`Producto ID ${dbProductRequests[requestIndex].productId} no encontrado al surtir solicitud ${requestId}. El stock no fue actualizado.`);
          }
        }
        resolve({ ...dbProductRequests[requestIndex] });
      } else {
        reject(new Error(`Solicitud de producto con ID ${requestId} no encontrada.`));
      }
    }, SIMULATED_DELAY / 2);
  }));
};

export const addProduct = (productData: Omit<Product, 'id'>): Promise<Product> => {
  return requireAuth(Role.ADMIN).then(() => new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!productData.name?.trim() || !productData.description?.trim() || productData.price == null || productData.stock == null || !productData.imageUrl?.trim()) {
        reject(new Error("Todos los campos del producto son obligatorios."));
        return;
      }
      if (typeof productData.price !== 'number' || productData.price <= 0) {
        reject(new Error("El precio debe ser un número positivo."));
        return;
      }
      if (typeof productData.stock !== 'number' || productData.stock < 0) {
        reject(new Error("El stock debe ser un número no negativo."));
        return;
      }
       try { new URL(productData.imageUrl); } catch (_) {
            reject(new Error("La URL de la imagen no es válida.")); return;
       }
      const newProduct: Product = {
        ...productData,
        id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      };
      dbProducts.unshift(newProduct);
      resolve({ ...newProduct });
    }, SIMULATED_DELAY);
  }));
};

export const updateProduct = (productId: string, productData: Partial<Omit<Product, 'id'>>): Promise<Product> => {
  return requireAuth(Role.ADMIN).then(() => new Promise((resolve, reject) => {
    setTimeout(() => {
      const productIndex = dbProducts.findIndex(p => p.id === productId);
      if (productIndex === -1) {
        reject(new Error(`Producto con ID ${productId} no encontrado.`));
        return;
      }
      if (productData.price !== undefined && (typeof productData.price !== 'number' || productData.price <= 0)) {
        reject(new Error("El precio debe ser un número positivo.")); return;
      }
      if (productData.stock !== undefined && (typeof productData.stock !== 'number' || productData.stock < 0)) {
        reject(new Error("El stock debe ser un número no negativo.")); return;
      }
      if (productData.name !== undefined && !productData.name.trim()) {
        reject(new Error("El nombre no puede estar vacío.")); return;
      }
      if (productData.description !== undefined && !productData.description.trim()) {
        reject(new Error("La descripción no puede estar vacía.")); return;
      }
      if (productData.imageUrl !== undefined) {
         if(!productData.imageUrl.trim()){ reject(new Error("La URL de imagen no puede estar vacía.")); return; }
         try { new URL(productData.imageUrl); } catch (_) {
            reject(new Error("La URL de la imagen no es válida.")); return;
         }
       }
      dbProducts[productIndex] = { ...dbProducts[productIndex], ...productData };
      resolve({ ...dbProducts[productIndex] });
    }, SIMULATED_DELAY);
  }));
};

export const deleteProduct = (productId: string): Promise<void> => {
  return requireAuth(Role.ADMIN).then(() => new Promise((resolve, reject) => {
    setTimeout(() => {
      const productIndex = dbProducts.findIndex(p => p.id === productId);
      if (productIndex === -1) {
        reject(new Error(`Producto con ID ${productId} no encontrado.`));
        return;
      }
      dbProducts.splice(productIndex, 1);
      resolve();
    }, SIMULATED_DELAY);
  }));
};

// --- USER MANAGEMENT (SELLERS by Admin) ---
export const getUsers = (): Promise<User[]> => {
  return requireAuth(Role.ADMIN).then(() => new Promise((resolve) => {
    setTimeout(() => {
      resolve(dbUsers.map(u => {
        const { password, ...userWithoutPassword } = u;
        return userWithoutPassword;
      }));
    }, SIMULATED_DELAY / 2);
  }));
};

export const addSeller = (sellerData: Omit<User, 'id' | 'role'>): Promise<User> => {
  return requireAuth(Role.ADMIN).then(() => new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!sellerData.username?.trim() || !sellerData.password?.trim() || !sellerData.displayName?.trim()) {
        reject(new Error("Nombre de usuario, contraseña y nombre para mostrar son obligatorios."));
        return;
      }
      if (dbUsers.find(u => u.username === sellerData.username.trim() && u.role === Role.SELLER)) {
        reject(new Error(`El nombre de usuario "${sellerData.username.trim()}" ya existe para un vendedor.`));
        return;
      }

      const newSeller: User = {
        id: `seller_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        username: sellerData.username.trim(),
        password: sellerData.password,
        role: Role.SELLER,
        displayName: sellerData.displayName.trim(),
        createdAt: new Date().toISOString(),
      };
      dbUsers.push(newSeller);
      const { password, ...sellerToReturn } = newSeller;
      resolve(sellerToReturn);
    }, SIMULATED_DELAY);
  }));
};

export const deleteSeller = (userIdToDelete: string): Promise<void> => {
  return requireAuth(Role.ADMIN).then(adminUser => new Promise((resolve, reject) => {
    setTimeout(() => {
      const userIndex = dbUsers.findIndex(u => u.id === userIdToDelete);
      if (userIndex === -1) {
        reject(new Error(`Vendedor con ID ${userIdToDelete} no encontrado.`)); return;
      }
      if (dbUsers[userIndex].role !== Role.SELLER) {
        reject(new Error(`El usuario con ID ${userIdToDelete} no es un vendedor.`)); return;
      }
      if (adminUser.id === userIdToDelete) { // Should not happen if roles are distinct
         reject(new Error("No puedes eliminar tu propia cuenta de administrador.")); return;
      }
      dbUsers.splice(userIndex, 1);
      resolve();
    }, SIMULATED_DELAY);
  }));
};

// --- AI SUMMARY ---
export const getSalesSummary = (
  salesForSummary: SaleRecord[],
  productsForSummary: Product[],
  currentTranslations: typeof translations
): Promise<{ summary: string }> => {
 return requireAuth(Role.ADMIN).then(() => new Promise((resolve) => {
    setTimeout(() => {
      if (!salesForSummary || salesForSummary.length === 0) {
        resolve({ summary: currentTranslations.geminiNoSalesData || "No hay datos de ventas." });
        return;
      }
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentSales = salesForSummary.filter(sale => new Date(sale.saleDate) >= sevenDaysAgo);

      if (recentSales.length === 0) {
        resolve({ summary: currentTranslations.geminiNoRecentSales || "No hay ventas recientes." });
        return;
      }
      
      let totalRevenueLast7Days = 0;
      const productSalesCount: { [productName: string]: number } = {};

      recentSales.forEach(sale => {
        totalRevenueLast7Days += sale.totalAmount;
        sale.items.forEach(item => {
          const productNameForSummary = item.productName; 
          productSalesCount[productNameForSummary] = (productSalesCount[productNameForSummary] || 0) + item.quantity;
        });
      });

      const popularProductsText = Object.entries(productSalesCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([name, count]) => `${name}: ${count} ${currentTranslations.units || 'unidades'}`)
        .join('\n    - ');

      const mockSummary = `Resumen de Ventas (Simulado):
Estadísticas (Últimos 7 Días):
  - Ventas Totales: ${recentSales.length}
  - Ingresos: $${totalRevenueLast7Days.toFixed(2)} MXN
  - Productos Populares:
    - ${popularProductsText || 'N/A'}
Observaciones:
  - Tendencia positiva en ${Object.keys(productSalesCount)[0] || 'electrónicos'}.
  - Ticket Promedio: $${(totalRevenueLast7Days / recentSales.length).toFixed(2)} MXN.
Recomendaciones:
  - Campaña para ${Object.keys(productSalesCount)[0] || 'producto más vendido'}.
  - Evaluar stock de baja rotación.`;
      resolve({ summary: mockSummary.trim() });
    }, SIMULATED_DELAY * 1.5);
  }));
};