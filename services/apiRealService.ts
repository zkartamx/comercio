// Adaptación del frontend para consumir la nueva API real usando fetch nativo
// Cambia la importación en tu app para usar este archivo en vez del simulado
import { User, OrderPlacementPayload, RequestStatus } from '../types';

const API_BASE = 'http://localhost:4000/api';

let authToken: string | null = localStorage.getItem('authToken'); // This will still be used by setAuthToken for its internal logic and potentially by other parts if needed directly, but getHeaders will now use localStorage directly.

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
}

function getHeaders(isJson = true) {
  const headers: Record<string, string> = {};
  const currentToken = localStorage.getItem('authToken');
  if (isJson) headers['Content-Type'] = 'application/json';
  if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`;
  return headers;
}

// --- AUTH ---
export async function checkAuth() {
  const currentToken = localStorage.getItem('authToken');
  console.log('[apiService.checkAuth] currentToken from localStorage:', currentToken);
  if (!currentToken) {
    throw new Error('No auth token found in localStorage');
  }
  const res = await fetch(`${API_BASE}/users/me`, {
    method: 'GET',
    headers: getHeaders(),
  });
  if (!res.ok) {
    // Si el token no es válido o ha expirado, el backend debería devolver un error (ej. 401)
    throw new Error('Failed to authenticate with token');
  }
  const userData = await res.json();
  // Asumimos que el endpoint /users/me devuelve directamente el objeto del usuario
  // Si devuelve { user: {...} }, entonces necesitaríamos retornar userData.user
  return userData; 
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error('Login incorrecto');
  const data = await res.json();
  setAuthToken(data.token);
  return data;
}

export async function registerCustomer({ email, password, name }: { email: string, password: string, name: string }) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email, password, name })
  });
  if (!res.ok) {
    let errorMessage = 'Failed to register';
    try {
      const errorData = await res.json();
      if (errorData && (errorData.error || errorData.message)) {
        errorMessage = errorData.error || errorData.message;
      }
    } catch (e) {
      console.error('Could not parse error response:', e);
    }
    throw new Error(errorMessage);
  }
  const data = await res.json();
  if (data.token) {
    setAuthToken(data.token);
  }
  return data; // Contains user object and token
}

export function logout() {
  setAuthToken(null); // Esto limpiará la variable y localStorage
}

// --- PRODUCTOS ---
export async function updateProduct(productId: string, productData: any) { // TODO: Define productData type
  console.warn('updateProduct called with:', productId, productData);
  const res = await fetch(`${API_BASE}/products/${productId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(productData)
  });
  if (!res.ok) throw new Error('No se pudo actualizar el producto');
  return res.json();
}

export async function deleteProduct(productId: string) {
  console.warn('deleteProduct called with:', productId);
  const res = await fetch(`${API_BASE}/products/${productId}`, {
    method: 'DELETE',
    headers: getHeaders(false) // No body for DELETE typically
  });
  if (!res.ok) {
    let errorMessage = 'No se pudo eliminar el producto';
    try {
      const errorData = await res.json();
      if (errorData && (errorData.error || errorData.message)) {
        errorMessage = errorData.error || errorData.message;
      }
    } catch (e) {
      // No se pudo parsear el JSON del error, o no había cuerpo
      console.error('Could not parse error response for deleteProduct or no error body:', e);
    }
    throw new Error(errorMessage);
  }
  // DELETE might return 204 No Content, or the deleted item. Adjust as needed.
  if (res.status === 204) return { message: 'Producto eliminado con éxito' }; 
  return res.json();
}
export async function getProducts() {
  const res = await fetch(`${API_BASE}/products`, { headers: getHeaders(false) });
  if (!res.ok) throw new Error('No se pudieron obtener los productos');
  return res.json();
}

export async function addProduct(product: { name: string, description: string, price: number, stock: number, imageUrl?: string }) {
  const res = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(product)
  });
  if (!res.ok) throw new Error('No se pudo crear el producto');
  return res.json();
}

// --- PEDIDOS ---
export async function getCustomerOrders() {
  console.log('[apiService.getCustomerOrders] Fetching orders for current user');
  console.warn('getCustomerOrders called');
  const res = await fetch(`${API_BASE}/orders/my`, { headers: getHeaders() }); // Or /users/me/orders
  if (!res.ok) throw new Error('No se pudieron obtener los pedidos del cliente');
  return res.json();
}
export async function getOrders() {
  const res = await fetch(`${API_BASE}/orders`, { headers: getHeaders() });
  if (!res.ok) throw new Error('No se pudieron obtener los pedidos');
  return res.json();
}

export async function placeOrder(order: OrderPlacementPayload) {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(order)
  });
  if (!res.ok) throw new Error('No se pudo crear el pedido');
  return res.json();
}


export async function updateOrderStatus(orderId: string, status: string) { // Considera usar tipos específicos para status si los tienes (e.g., OrderStatus)
  const res = await fetch(`${API_BASE}/orders/${orderId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ status }), // Enviamos solo el campo 'status' para actualizar
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: 'Failed to update order status' }));
    console.error('Error updating order status:', errorData); // Log para más detalles
    throw new Error(errorData.message || 'Failed to update order status');
  }
  return res.json();
}

export async function updateOrderPaymentStatus(orderId: string, paymentStatus: string) { // Considera usar tipos específicos
  const res = await fetch(`${API_BASE}/orders/${orderId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ paymentStatus }), // Enviamos solo el campo 'paymentStatus'
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: 'Failed to update order payment status' }));
    console.error('Error updating order payment status:', errorData); // Log para más detalles
    throw new Error(errorData.message || 'Failed to update order payment status');
  }
  return res.json();
}

// --- VENTAS (Sales) ---
export async function addSaleRecord(saleData: any) { // TODO: Define saleData type
  console.warn('addSaleRecord called with:', saleData);
  const res = await fetch(`${API_BASE}/sales`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(saleData)
  });
  if (!res.ok) throw new Error('No se pudo registrar la venta');
  return res.json();
}

export async function getSalesSummary(_sales: any, _products: any, _translations: any) {
  console.warn('getSalesSummary called');
  const res = await fetch(`${API_BASE}/sales/summary`, { headers: getHeaders() });
  if (!res.ok) throw new Error('No se pudo obtener el resumen de ventas');
  return res.json();
}
export async function getSales() {
  const res = await fetch(`${API_BASE}/sales`, { headers: getHeaders() }); 
  if (!res.ok) throw new Error('No se pudieron obtener los registros de ventas');
  return res.json();
}

// --- SOLICITUDES DE PRODUCTOS (Product Requests) ---
export async function addProductRequest(requestData: any) { // TODO: Define requestData type
  console.warn('addProductRequest called with:', requestData);
  const res = await fetch(`${API_BASE}/product-requests`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(requestData)
  });
  if (!res.ok) throw new Error('No se pudo crear la solicitud de producto');
  return res.json();
}

export async function updateRequestStatus(requestId: string, newStatus: RequestStatus, adminNotes?: string) { // adminNotes es opcional
  console.warn('updateRequestStatus called with:', requestId, newStatus, adminNotes);
  const payload: { status: RequestStatus; adminNotes?: string } = { status: newStatus };
  if (adminNotes !== undefined) {
    payload.adminNotes = adminNotes;
  }
  const res = await fetch(`${API_BASE}/product-requests/${requestId}/status`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('No se pudo actualizar el estado de la solicitud');
  return res.json();
}
export async function getProductRequests() {
  const res = await fetch(`${API_BASE}/product-requests`, { headers: getHeaders() });
  if (!res.ok) throw new Error('No se pudieron obtener las solicitudes de productos');
  return res.json();
}

// --- USUARIOS ---
export async function updateUserProfile(userData: any) { // TODO: Define userData type, ensure it matches User type
  console.warn('updateUserProfile called with:', userData);
  const res = await fetch(`${API_BASE}/users/me`, { // Assuming updates current user's profile
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(userData)
  });
  if (!res.ok) throw new Error('No se pudo actualizar el perfil del usuario');
  return res.json();
}

export async function addSeller(sellerData: Omit<User, 'id' | 'role'>): Promise<User> {
  // console.warn('addSeller called with:', sellerData); // Puede ser útil para depurar, pero lo comento por ahora
  const res = await fetch(`${API_BASE}/auth/register-seller`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(sellerData)
  });
  if (!res.ok) {
    // Intenta obtener un mensaje de error más específico del cuerpo de la respuesta
    const errorData = await res.json().catch(() => ({ message: 'Error al agregar vendedor y la respuesta no es JSON o está vacía.' }));
    throw new Error(errorData.error || errorData.message || `Error HTTP ${res.status} al agregar el vendedor.`);
  }
  const responseData = await res.json();
  if (!responseData.user) {
    // Esto no debería suceder si el backend funciona como se espera
    console.error('Respuesta del backend para addSeller no contiene el objeto user:', responseData);
    throw new Error('Respuesta inesperada del servidor al agregar vendedor.');
  }
  return responseData.user;
}

export async function deleteSeller(sellerId: string) {
  console.warn('deleteSeller called with:', sellerId);
  // Endpoint is a guess. Could be /api/users/:id or /api/sellers/:id
  const res = await fetch(`${API_BASE}/users/${sellerId}`, { // Example endpoint, adjust as needed
    method: 'DELETE',
    headers: getHeaders(false)
  });
  if (!res.ok) throw new Error('No se pudo eliminar el vendedor');
  if (res.status === 204) return { message: 'Vendedor eliminado con éxito' };
  return res.json();
}
export async function getUsers() {
  const res = await fetch(`${API_BASE}/users`, { headers: getHeaders() });
  if (!res.ok) throw new Error('No se pudieron obtener los usuarios');
  return res.json();
}

// --- UTILIDAD ---
// La función logout correcta está definida más arriba y maneja localStorage.

// Puedes agregar más funciones según los endpoints que vayas necesitando
