
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import CustomerView from './views/CustomerView';
import SellerView from './views/SellerView';
import AdminView from './views/AdminView';
import LoginView from './views/LoginView';
import RegisterView from './views/RegisterView'; // New
import ProfileView from './views/ProfileView';   // New
import { Product, CartItem, Order, OrderItem, SaleRecord, ProductRequest, View, Role, User, OrderStatus, PaymentStatus, TranslationKey, SaleCreationPayload, RequestStatus, OrderPlacementPayload } from './types';
import { ADMIN_WHATSAPP_NUMBER } from './constants';
import { translations } from './localization'; 
import * as apiService from './services/apiRealService';

const LOCAL_STORAGE_GUEST_CART_KEY = 'proSalesGuestCart';
const LOCAL_STORAGE_USER_CART_KEY_PREFIX = 'proSalesUserCart_';

/**
 * Main application component.
 * Manages global state, view routing, authentication, and interactions with the API service.
 */
const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.CUSTOMER);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [intendedView, setIntendedView] = useState<View | null>(null); 
  const [intendedRoleForLogin, setIntendedRoleForLogin] = useState<Role | null>(null);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]); // Admin orders
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]); // Logged-in customer's orders
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [productRequests, setProductRequests] = useState<ProductRequest[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [lastOrderConfirmationDetails, setLastOrderConfirmationDetails] = useState<{ order: Order; bankInstructions: string } | null>(null);

  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingAdminData, setIsLoadingAdminData] = useState(false); // Combined loader for admin
  const [isLoadingCustomerOrders, setIsLoadingCustomerOrders] = useState(false);
  const [isLoadingAddProduct, setIsLoadingAddProduct] = useState(false);
  const [isLoadingUpdateProduct, setIsLoadingUpdateProduct] = useState(false);
  const [isLoadingDeleteProduct, setIsLoadingDeleteProduct] = useState(false);
  const [isLoadingAddSeller, setIsLoadingAddSeller] = useState(false);
  const [isLoadingDeleteSeller, setIsLoadingDeleteSeller] = useState(false);
  const [isLoadingProfileUpdate, setIsLoadingProfileUpdate] = useState(false);


  const t = useCallback((key: TranslationKey, replacements?: Record<string, string | number>) => {
    let translatedString = translations[key] || key.toString();
    if (replacements) {
      Object.keys(replacements).forEach(placeholder => {
        translatedString = translatedString.replace(new RegExp(`{${placeholder}}`, 'g'), String(replacements[placeholder]));
      });
    }
    return translatedString;
  }, []);

  useEffect(() => {
    document.documentElement.lang = 'es-MX';
    document.title = t('appName');
  }, [t]);

  // Load cart from localStorage when currentUser is resolved or on initial load for guest
  useEffect(() => {
    let loadedCart: CartItem[] = [];
    try {
      const guestCartJson = localStorage.getItem(LOCAL_STORAGE_GUEST_CART_KEY);
      let userCartJson = null;

      if (currentUser && currentUser.id) {
        // User is logged in, prioritize their cart
        userCartJson = localStorage.getItem(`${LOCAL_STORAGE_USER_CART_KEY_PREFIX}${currentUser.id}`);
        if (userCartJson) {
          loadedCart = JSON.parse(userCartJson);
        } else if (guestCartJson) {
          // User is logged in, no specific user cart found, but a guest cart exists.
          // Load guest cart; the save-effect will migrate it to be user-specific.
          loadedCart = JSON.parse(guestCartJson);
        }
      } else {
        // No user logged in (or currentUser is still null during initial checks)
        if (guestCartJson) {
          loadedCart = JSON.parse(guestCartJson);
        }
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      // Fallback to empty cart if parsing fails or no cart found
    }
    setCart(loadedCart);
  }, [currentUser]); // Re-run when currentUser is resolved

  // Save cart to localStorage whenever it changes or user logs in/out
  useEffect(() => {
    try {
      if (currentUser && currentUser.id) {
        localStorage.setItem(`${LOCAL_STORAGE_USER_CART_KEY_PREFIX}${currentUser.id}`, JSON.stringify(cart));
        // If there was a guest cart and now user is logged in, we might want to clear guest cart if cart is not empty
        // For simplicity, if user logs in and cart is populated (either from their previous session or guest), it's saved under user.
        // If they then log out, it might become the new guest cart if not handled explicitly on logout.
        if (cart.length > 0) { // Only clear guest cart if user cart has items, to avoid clearing a guest cart if user logs in with empty cart
            localStorage.removeItem(LOCAL_STORAGE_GUEST_CART_KEY); 
        }
      } else {
        localStorage.setItem(LOCAL_STORAGE_GUEST_CART_KEY, JSON.stringify(cart));
      }
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cart, currentUser]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = useCallback((messageKey: TranslationKey, type: 'success' | 'error', replacements?: Record<string, string | number>) => {
    setNotification({ message: t(messageKey, replacements), type });
  }, [t]);

  const fetchProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const fetchedProducts = await apiService.getProducts();
      setProducts(fetchedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      showNotification('errorFetchingProducts' as TranslationKey, 'error'); 
    } finally {
      setIsLoadingProducts(false);
    }
  }, [showNotification]);

  const fetchAdminData = useCallback(async () => {
    if (currentUser?.role === Role.ADMIN) {
      setIsLoadingAdminData(true);
      try {
        const [fetchedOrders, fetchedSales, fetchedRequests, fetchedUsers] = await Promise.all([
          apiService.getOrders(),
          apiService.getSales(),
          apiService.getProductRequests(),
          apiService.getUsers()
        ]);
        setOrders(fetchedOrders);
        setSales(fetchedSales);
        setProductRequests(fetchedRequests);
        setAllUsers(fetchedUsers);
      } catch (error) {
        console.error("Error fetching admin data:", error);
        showNotification('errorFetchingAdminData' as TranslationKey, 'error'); 
      } finally {
        setIsLoadingAdminData(false);
      }
    } else {
      setOrders([]);
      setSales([]);
      setProductRequests([]);
      setAllUsers([]);
    }
  }, [currentUser, showNotification]);

  const fetchCustomerOrders = useCallback(async () => {
    if (currentUser?.role === Role.CUSTOMER && currentUser.id) {
      setIsLoadingCustomerOrders(true);
      try {
        const custOrders = await apiService.getCustomerOrders();
        setCustomerOrders(custOrders);
      } catch (error) {
        console.error("Error fetching customer orders:", error);
        showNotification('errorFetchingAdminData' as TranslationKey, 'error'); // Generic error for now
      } finally {
        setIsLoadingCustomerOrders(false);
      }
    } else {
      setCustomerOrders([]);
    }
  }, [currentUser, showNotification]);


  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (currentUser) {
      // Si hay un usuario y no hay una vista intencionada específica (ej. de un flujo de redirección)
      // y la vista actual no coincide con el rol del usuario, la ajustamos.
      if (!intendedView) {
        if (currentUser.role === Role.ADMIN && currentView !== View.ADMIN) {
          setCurrentView(View.ADMIN);
        } else if (currentUser.role === Role.SELLER && currentView !== View.SELLER) {
          setCurrentView(View.SELLER);
        } else if (currentUser.role === Role.CUSTOMER && currentView !== View.CUSTOMER && currentView !== View.PROFILE) {
          setCurrentView(View.CUSTOMER);
        }
      }

      // Cargar datos basados en el rol
      if (currentUser.role === Role.ADMIN) {
        fetchAdminData();
      } else if (currentUser.role === Role.CUSTOMER) {
        fetchCustomerOrders();
      }
      // Añadir lógica para SELLER si es necesario cargar datos específicos

    } else {
      // No hay usuario (logout o estado inicial sin sesión)
      setOrders([]);
      setSales([]);
      setProductRequests([]);
      setAllUsers([]);
      setCustomerOrders([]);
      // Si no hay usuario y no estamos en una vista pública, redirigir a CUSTOMER
      if (currentView !== View.CUSTOMER && currentView !== View.LOGIN && currentView !== View.REGISTER) {
        setCurrentView(View.CUSTOMER);
      }
    }
  }, [currentUser, fetchAdminData, fetchCustomerOrders, setCurrentView, currentView, intendedView]);


  const checkAuthStatus = useCallback(async () => {
    setIsLoadingAuth(true);
    try {
      const user = await apiService.checkAuth();
      console.log('[App.checkAuthStatus] User from apiService.checkAuth:', user);
      setCurrentUser(user);
    } catch (error) {
      console.error('[App.checkAuthStatus] Error in checkAuthStatus or no user returned:', error);
      setCurrentUser(null);
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const handleLogin = useCallback(async (credential: string, passwordInput: string, roleToLoginAs: Role): Promise<string | null> => {
    setLoginError(null);
    setIsLoadingAuth(true);
    try {
      // Para el backend real, siempre espera el campo 'email'.
      // Si es admin o seller, el usuario debe ingresar su username, que mandamos como 'email'.
      // Si es customer, se manda el email real.
      let loginEmail;
      if (roleToLoginAs === Role.CUSTOMER) {
        loginEmail = credential;
      } else {
        loginEmail = credential; // username, pero el backend espera 'email'
      }
      await apiService.login(loginEmail, passwordInput); // Token is set within this call
      // Fetch the full user profile like checkAuthStatus does to ensure all data is present.
      const fullUser = await apiService.checkAuth();
      setCurrentUser(fullUser);
      
      // Now use fullUser for redirection logic if needed, or rely on currentUser state
      if (intendedView && intendedView !== View.LOGIN && intendedView !== View.REGISTER) {
        setCurrentView(intendedView);
      } else {
        // Default redirection after login
        // Use the freshly fetched fullUser (now in currentUser state) for role-based redirection
        if (fullUser.role === Role.ADMIN) setCurrentView(View.ADMIN);
        else if (fullUser.role === Role.SELLER) setCurrentView(View.SELLER);
        else if (fullUser.role === Role.CUSTOMER) setCurrentView(View.CUSTOMER); // Or View.PROFILE
        else setCurrentView(View.CUSTOMER);
      }
      setIntendedView(null);
      setIntendedRoleForLogin(null);
      setIsLoadingAuth(false);
      return null;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : t('loginFailedError');
      setLoginError(errorMsg);
      setIsLoadingAuth(false);
      return errorMsg;
    }
  }, [t, intendedView]);

  const handleRegister = useCallback(async (displayName: string, email: string, passwordInput: string): Promise<string | null> => {
    setRegistrationError(null);
    setIsLoadingAuth(true);
    try {
      const customerData = { name: displayName, email, password: passwordInput };
      const registrationResponse = await apiService.registerCustomer(customerData);

      if (registrationResponse && registrationResponse.user) {
        setCurrentUser(registrationResponse.user);
        showNotification('registrationSuccess' as TranslationKey, 'success', { displayName: registrationResponse.user.name });

        const loginError = await handleLogin(email, passwordInput, Role.CUSTOMER);

        if (loginError) {
          setRegistrationError(t('registrationSuccessButLoginFailed', { loginError }));
          // setCurrentView(View.LOGIN); // Opcional: forzar login manual si el autologin falla
          setIsLoadingAuth(false);
          return t('registrationSuccessButLoginFailed', { loginError });
        }

        setCurrentView(intendedView === View.LOGIN || intendedView === View.REGISTER || !intendedView ? View.CUSTOMER : intendedView);
        setIntendedView(null);
        setIntendedRoleForLogin(null);
        setIsLoadingAuth(false);
        return null;
      } else {
        throw new Error(t('errorRegistrationResponse'));
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : t('errorRegistration', {error: 'Unknown error'});
      setRegistrationError(errorMsg);
      setIsLoadingAuth(false);
      return errorMsg;
    }
  }, [t, showNotification, intendedView, handleLogin]);


  const handleLogout = useCallback(async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error("Error during API logout:", error);
    }
    setCurrentUser(null);
    setCurrentView(View.CUSTOMER);
    setIntendedView(null);
    setIntendedRoleForLogin(null);
    setCart([]);
  }, []);

  const handleViewChange = useCallback((targetView: View, role?: Role) => {
    setLoginError(null);
    setRegistrationError(null);

    const publicViews = [View.CUSTOMER, View.LOGIN, View.REGISTER];
    const authRequiredViews: Partial<Record<View, Role>> = {
      [View.SELLER]: Role.SELLER,
      [View.ADMIN]: Role.ADMIN,
      [View.PROFILE]: Role.CUSTOMER,
      // CHECKOUT_PROCESS is handled implicitly by redirecting from CustomerView if not logged in
    };

    if (publicViews.includes(targetView)) {
      setCurrentView(targetView);
      setIntendedView(null); // Clear intended view if navigating to a public page
      setIntendedRoleForLogin(role || null); // Set role if specified for login/register
    } else if (authRequiredViews[targetView]) {
      const requiredRole = authRequiredViews[targetView];
      if (currentUser?.role === requiredRole) {
        setCurrentView(targetView);
        setIntendedView(null);
        setIntendedRoleForLogin(null);
      } else {
        // Not logged in or wrong role
        setIntendedView(targetView); // Store where they wanted to go
        setIntendedRoleForLogin(requiredRole || null); // Store the role needed for that view
        setCurrentView(View.LOGIN); // Redirect to login
      }
    } else {
      // Fallback or unknown view, default to customer
      setCurrentView(View.CUSTOMER);
      setIntendedView(null);
      setIntendedRoleForLogin(null);
    }
  }, [currentUser]);

  const addToCart = useCallback((productToAdd: Product) => {
    if (productToAdd.stock <= 0) {
      showNotification('productXOutOfStock', 'error', { productName: productToAdd.name });
      return;
    }
    setCart((prevCart) => {
      const existingItem = prevCart.find(item => item.id === productToAdd.id);
      if (existingItem) {
        if (existingItem.quantity < productToAdd.stock) {
          showNotification('productXAddedToCart', 'success', { productName: productToAdd.name });
          return prevCart.map(item =>
            item.id === productToAdd.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        } else {
          showNotification('maxStockReached', 'error', { productName: productToAdd.name });
          return prevCart;
        }
      }
      showNotification('productXAddedToCart', 'success', { productName: productToAdd.name });
      return [...prevCart, { ...productToAdd, quantity: 1 }];
    });
  }, [showNotification]); 

  const removeFromCart = useCallback((productId: string) => {
    const product = products.find(p => p.id === productId); 
    showNotification('itemRemovedFromCart', 'success', {productName: product ? product.name : t('itemGeneric')});
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  }, [showNotification, products, t]); 

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId); 
    if (!product) return;
    const newQuantity = Math.max(1, Math.min(quantity, product.stock));
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  }, [products]);

  const clearCart = useCallback(() => {
    setCart([]); // Update React state

    // Explicitly clear localStorage for the current context
    if (currentUser && currentUser.id) {
      localStorage.removeItem(`${LOCAL_STORAGE_USER_CART_KEY_PREFIX}${currentUser.id}`);
    }
    // Always try to clear the guest cart as well, as items might have been there
    // before a user logged in or created an account during checkout.
    localStorage.removeItem(LOCAL_STORAGE_GUEST_CART_KEY);

    showNotification('cartCleared' as TranslationKey, 'success');
  }, [currentUser, showNotification, t]); // Added currentUser and t dependencies

  const placeOrder = useCallback(async (orderData: OrderPlacementPayload) => {
    try {
      // Add current user's ID to orderData if logged in as customer
      const fullOrderData = currentUser?.role === Role.CUSTOMER 
        ? { ...orderData, userId: currentUser.id } 
        : orderData;

      const responsePayload = await apiService.placeOrder(fullOrderData);
      
      const actualOrder = responsePayload.order;

      // If a new user was created and token returned, set them as current user
      if (responsePayload.user && responsePayload.token) {
        setCurrentUser(responsePayload.user);
        apiService.setAuthToken(responsePayload.token); // Ensure token is set
        // Fetch customer orders for the newly created and logged-in user
        // This is important if they navigate to their profile or orders page immediately.
        fetchCustomerOrders(); 
      }
      
      // Update orders list based on who placed it (or if it's a new user)
      if (currentUser?.role === Role.ADMIN) { // If admin placed it
        setOrders(prevOrders => [...prevOrders, actualOrder]);
      } else { // Covers existing customer, or newly created customer
        // For a newly created user, currentUser might not be updated yet in this exact render cycle,
        // but the order should still be associated with them in the backend.
        // We add to customerOrders if it's not an admin placing it.
        setCustomerOrders(prevCustOrders => [...prevCustOrders, actualOrder]);
      }

      await fetchProducts(); 
      clearCart(); 
      setLastOrderConfirmationDetails({ order: actualOrder, bankInstructions: t('bankTransferInstructions') });

      if (ADMIN_WHATSAPP_NUMBER && ADMIN_WHATSAPP_NUMBER.replace(/\D/g, '').length > 0) {
        const itemsSummary = actualOrder.items.map((item: OrderItem) => `${item.productName} (x${item.quantity})`).join(',\n  - ');
        
        let adminMessage = t('whatsappOrderReceivedAdmin', {
          orderId: actualOrder.id,
          customerName: actualOrder.customerName,
          customerEmail: actualOrder.customerEmail,
          itemsSummary: itemsSummary,
          totalAmount: actualOrder.totalAmount.toFixed(2)
        });

        if (actualOrder.billingRequested && actualOrder.billingDetails) {
          const bd = actualOrder.billingDetails;
          const fa = bd.fiscalAddress;
          let billingDetailsText = `\n\n${t('whatsappInvoiceRequestedLabel')} ${t('yes')}`;
          billingDetailsText += `\n${t('whatsappBillingDetailsLabel')}`;
          billingDetailsText += `\n  - ${t('whatsappRfcLabel')} ${bd.rfc}`;
          billingDetailsText += `\n  - ${t('whatsappRazonSocialLabel')} ${bd.razonSocial}`;
          billingDetailsText += `\n  - ${t('whatsappCfdiUseLabel')} ${bd.cfdiUse} - ${t(`cfdi${bd.cfdiUse}` as TranslationKey, {defaultValue: bd.cfdiUse})}`;
          billingDetailsText += `\n  - ${t('whatsappFiscalAddressLabel')} ${fa.street}, ${fa.city}, ${fa.state}, C.P. ${fa.zip}, ${fa.country}`;
          if (bd.email) {
            billingDetailsText += `\n  - ${t('whatsappBillingEmailLabel')} ${bd.email}`;
          }
          adminMessage += billingDetailsText;
        }
        
        const encodedAdminMessage = encodeURIComponent(adminMessage);
        const whatsappNumber = ADMIN_WHATSAPP_NUMBER.replace(/\D/g, '');
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedAdminMessage}`;
        
        const whatsappWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        if (whatsappWindow) {
          showNotification('orderConfirmedAdminWhatsApp', 'success');
        } else {
          console.warn("Failed to open WhatsApp window. URL:", whatsappUrl);
          showNotification('errorOpeningWhatsApp' as TranslationKey, 'error');
        }
      } else {
        console.warn("Admin WhatsApp number not configured. Order ID:", actualOrder.id);
        // Notification logic needs to consider if a new user was just created.
        // The `currentUser` state might not be updated in this exact render cycle if a new user was created.
        // Rely on `responsePayload.user` to determine if a new account was made.

        if (responsePayload.user && responsePayload.token) {
          // New user was created and logged in
          showNotification('orderAndAccountSuccess' as TranslationKey, 'success');
        } else if (currentUser && currentUser.role === Role.CUSTOMER) {
          // Existing logged-in customer
          showNotification('orderConfirmedCustomer' as TranslationKey, 'success');
        } else if (!currentUser) {
          // Guest user, no account created
          showNotification('orderConfirmedGuest' as TranslationKey, 'success');
        } else {
          // Default/Admin or other cases
          showNotification('orderConfirmedAdminNoWhatsApp', 'success'); // Re-using this, or create a more generic one
        }

      }
    } catch (error: any) {
      console.error("Error placing order:", error);
      const errorMessage = error instanceof Error ? error.message : t('errorPlacingOrder');
      showNotification('errorPlacingOrder', 'error', { error: errorMessage });
    }
  }, [clearCart, t, showNotification, fetchProducts, currentUser]);


  const addSaleRecord = useCallback(async (saleData: SaleCreationPayload) => {
    if(!currentUser || currentUser.role !== Role.SELLER) {
      showNotification('accessDenied' as TranslationKey, 'error');
      return;
    }
    try {
      const transformedItems = saleData.items.map(item => ({
        productId: item.productId, // Already a number from SaleCreationItem
        quantity: item.quantity,
        unitPrice: item.unitPrice, // Use unitPrice from SaleCreationItem
      }));

      const payloadForApi = {
        ...saleData,
        items: transformedItems,
        sellerId: currentUser.id, // Backend uses sellerId from authenticated token, but good to have for other contexts if needed
      };

      const newSale = await apiService.addSaleRecord(payloadForApi);
      setSales(prevSales => [...prevSales, newSale]);
      await fetchProducts();
      showNotification('saleLoggedSuccessID', 'success', { saleId: newSale.id });
    } catch (error) {
      console.error("Error logging sale:", error);
      showNotification('errorLoggingSale' as TranslationKey, 'error'); 
    }
  }, [showNotification, fetchProducts, currentUser]); 

  const addProductRequest = useCallback(async (
    requestData: Pick<ProductRequest, 'productId' | 'quantityRequested' | 'notes'>
  ) => {
     if(!currentUser || currentUser.role !== Role.SELLER) {
      showNotification('accessDenied' as TranslationKey, 'error');
      return;
    }
    try {
      const newRequest = await apiService.addProductRequest(requestData);
      setProductRequests(prevRequests => [...prevRequests, newRequest]);
      showNotification('productRequestSubmittedID', 'success', { requestId: newRequest.id });
    } catch (error) {
      console.error("Error submitting product request:", error);
      showNotification('errorSubmittingRequest' as TranslationKey, 'error'); 
    }
  }, [showNotification, currentUser]); 

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    try {
      const updatedOrder = await apiService.updateOrderStatus(orderId, status);
      setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? updatedOrder : o));
      // Also update customerOrders if the order belongs to the current customer
      if (currentUser?.role === Role.CUSTOMER && customerOrders.find(co => co.id === orderId)) {
        setCustomerOrders(prevCustOrders => prevCustOrders.map(o => o.id === orderId ? updatedOrder : o));
      }
      showNotification('orderStatusUpdated', 'success', { orderId, status: t(status.toLowerCase() as TranslationKey, {defaultValue: status}) });
    } catch (error) {
      console.error("Error updating order status:", error);
      showNotification('errorUpdatingStatus' as TranslationKey, 'error'); 
    }
  }, [showNotification, t, currentUser, customerOrders]); 

  const handleUpdateOrderPaymentStatus = useCallback(async (orderId: string, paymentStatus: PaymentStatus) => {
    try {
      const updatedOrder = await apiService.updateOrderPaymentStatus(orderId, paymentStatus);
      setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? updatedOrder : o));
      if (currentUser?.role === Role.CUSTOMER && customerOrders.find(co => co.id === orderId)) {
        setCustomerOrders(prevCustOrders => prevCustOrders.map(o => o.id === orderId ? updatedOrder : o));
      }
      showNotification('orderPaymentStatusUpdated' as TranslationKey, 'success', { orderId, status: t(paymentStatus.toLowerCase() as TranslationKey, { defaultValue: paymentStatus }) });
    } catch (error) {
      console.error("Error updating order payment status:", error);
      showNotification('errorUpdatingStatus' as TranslationKey, 'error');
    }
  }, [showNotification, t, currentUser, customerOrders]);

  const updateRequestStatus = useCallback(async (requestId: string, status: RequestStatus, adminNotes: string) => {
    try {
      const updatedRequest = await apiService.updateRequestStatus(requestId, status, adminNotes);
      setProductRequests(prevRequests => prevRequests.map(req => (req.id === requestId ? updatedRequest : req)));
      if (status === RequestStatus.COMPLETED) {
        await fetchProducts(); 
        showNotification('productRequestFulfilled', 'success', { requestId, productName: updatedRequest.product?.name || 'N/A' });
      } else {
        showNotification('productRequestStatusUpdated', 'success', { requestId, status: t(status.toLowerCase() as TranslationKey, {defaultValue: status}) });
      }
    } catch (error) {
      console.error("Error updating request status:", error);
      showNotification('errorUpdatingStatus' as TranslationKey, 'error');
    }
  }, [showNotification, t, fetchProducts]); 
  
  const handleAddProduct = useCallback(async (productData: Omit<Product, 'id'>) => {
    setIsLoadingAddProduct(true);
    try {
      const newProduct = await apiService.addProduct(productData);
      await fetchProducts();
      showNotification('productAddedSuccess', 'success', { productName: newProduct.name });
    } catch (error) {
      console.error("Error adding product:", error);
      const errorMessage = error instanceof Error ? error.message : t('errorAddingProduct', {error: 'Unknown error'});
      showNotification('errorAddingProduct' as TranslationKey, 'error', { error: errorMessage });
    } finally {
      setIsLoadingAddProduct(false);
    }
  }, [fetchProducts, showNotification, t]);

  const handleUpdateProduct = useCallback(async (productId: string, productData: Partial<Omit<Product, 'id'>>) => {
    setIsLoadingUpdateProduct(true);
    try {
      const updatedProduct = await apiService.updateProduct(productId, productData);
      await fetchProducts();
      showNotification('productUpdatedSuccess', 'success', { productName: updatedProduct.name });
    } catch (error) {
      console.error("Error updating product:", error);
      const errorMessage = error instanceof Error ? error.message : t('errorUpdatingProduct', {error: 'Unknown error'});
      showNotification('errorUpdatingProduct' as TranslationKey, 'error', { error: errorMessage });
    } finally {
      setIsLoadingUpdateProduct(false);
    }
  }, [fetchProducts, showNotification, t]);

  const handleDeleteProduct = useCallback(async (productId: string) => {
    setIsLoadingDeleteProduct(true);
    const productToDelete = products.find(p => p.id === productId);
    const productName = productToDelete ? productToDelete.name : t('itemGeneric'); 
    try {
      await apiService.deleteProduct(productId);
      await fetchProducts();
      showNotification('productDeletedSuccess', 'success', { productName: productName });
    } catch (error) {
      console.error("Error deleting product:", error);
      const errorMessage = error instanceof Error ? error.message : t('errorDeletingProduct', {error: 'Unknown error'});
      showNotification('errorDeletingProduct' as TranslationKey, 'error', { error: errorMessage });
    } finally {
      setIsLoadingDeleteProduct(false);
    }
  }, [fetchProducts, showNotification, t, products]);

  const handleAddSeller = useCallback(async (sellerData: Omit<User, 'id' | 'role'>) => {
    setIsLoadingAddSeller(true);
    try {
      const newSeller = await apiService.addSeller(sellerData);
      await fetchAdminData(); // Re-fetch all users for admin
      showNotification('sellerAddedSuccess', 'success', { sellerName: newSeller.name });
    } catch (error) {
      console.error("Error adding seller:", error);
      const errorMessage = error instanceof Error ? error.message : t('errorAddingSeller', {error: 'Unknown error'});
      showNotification('errorAddingSeller' as TranslationKey, 'error', { error: errorMessage });
    } finally {
      setIsLoadingAddSeller(false);
    }
  }, [fetchAdminData, showNotification, t]);

  const handleDeleteSeller = useCallback(async (sellerId: string) => {
    setIsLoadingDeleteSeller(true);
    const sellerToDelete = allUsers.find(u => String(u.id) === sellerId);
    const sellerName = sellerToDelete ? sellerToDelete.name : t('itemGeneric');
    try {
      await apiService.deleteSeller(sellerId);
      await fetchAdminData(); 
      showNotification('sellerDeletedSuccess', 'success', { sellerName: sellerName });
    } catch (error) {
      console.error("Error deleting seller:", error);
      const errorMessage = error instanceof Error ? error.message : t('errorDeletingSeller', {error: 'Unknown error'});
      showNotification('errorDeletingSeller' as TranslationKey, 'error', { error: errorMessage });
    } finally {
      setIsLoadingDeleteSeller(false);
    }
  }, [fetchAdminData, showNotification, t, allUsers]);

  const handleUpdateUserProfile = useCallback(async (updatedData: Partial<User> & { currentPassword?: string }) => {
    if (!currentUser) return;
    setIsLoadingProfileUpdate(true);
    try {
      const updatedUser = await apiService.updateUserProfile(updatedData);
      console.log('Updated user data from API:', updatedUser);
      setCurrentUser({ ...updatedUser }); // Update current user in state, spread to ensure new reference
      showNotification('profileUpdateSuccess', 'success');
      setCurrentView(View.CUSTOMER); // Redirect to customer view
    } catch (error) {
      console.error("Error updating profile:", error);
      const errorMessage = error instanceof Error ? error.message : t('errorProfileUpdate', {error: 'Unknown error'});
      showNotification('errorProfileUpdate' as TranslationKey, 'error', { error: errorMessage });
    } finally {
      setIsLoadingProfileUpdate(false);
    }
  }, [currentUser, showNotification, t]);


  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);

  if (isLoadingAuth && !currentUser) { // Show full page loader only on initial auth check
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <p className="text-xl text-textPrimary font-serif">{t('loadingApp' as TranslationKey)}...</p> 
      </div>
    ); 
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case View.CUSTOMER:
        return (
          <CustomerView
            products={products}
            cart={cart}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
            updateCartQuantity={updateCartQuantity}
            placeOrder={placeOrder} 
            isCartOpen={isCartOpen}
            setIsCartOpen={setIsCartOpen}
            lastOrderConfirmationDetails={lastOrderConfirmationDetails}
            setLastOrderConfirmationDetails={setLastOrderConfirmationDetails}
            t={t}
            currentUser={currentUser}
            showNotification={showNotification}
          />
        );
      case View.SELLER:
        // SellerView expects currentUser to be a Seller. This is handled by handleViewChange.
        if (currentUser?.role === Role.SELLER) {
          return (
            <SellerView
              products={products}
              addSaleRecord={addSaleRecord}
              addProductRequest={addProductRequest}
              t={t}
              showNotification={showNotification}
              currentUser={currentUser} // Already checked role is SELLER
            />
          );
        }
        // Fallback if somehow view is SELLER but user is not (should be caught by handleViewChange)
        return <LoginView onLoginAttempt={handleLogin} intendedRole={Role.SELLER} loginError={loginError} t={t} onViewChange={handleViewChange} />;
      case View.ADMIN:
        // AdminView expects currentUser to be an Admin.
        if (currentUser?.role === Role.ADMIN) {
          return (
            <AdminView
              orders={orders}
              sales={sales}
              productRequests={productRequests}
              products={products}
              allUsers={allUsers}
              updateOrderStatus={updateOrderStatus}
              updateOrderPaymentStatus={handleUpdateOrderPaymentStatus}
              updateRequestStatus={updateRequestStatus}
              onAddProduct={handleAddProduct}
              isLoadingAddProduct={isLoadingAddProduct}
              onUpdateProduct={handleUpdateProduct}
              isLoadingUpdateProduct={isLoadingUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              isLoadingDeleteProduct={isLoadingDeleteProduct}
              onAddSeller={handleAddSeller}
              isLoadingAddSeller={isLoadingAddSeller}
              onDeleteSeller={handleDeleteSeller}
              isLoadingDeleteSeller={isLoadingDeleteSeller}
              t={t}
              currentUser={currentUser} // Already checked role is ADMIN
            />
          );
        }
        return <LoginView onLoginAttempt={handleLogin} intendedRole={Role.ADMIN} loginError={loginError} t={t} onViewChange={handleViewChange} />;
      case View.LOGIN:
        return <LoginView 
                  onLoginAttempt={handleLogin} 
                  intendedRole={intendedRoleForLogin} 
                  loginError={loginError} 
                  t={t} 
                  onViewChange={handleViewChange} 
                />;
      case View.REGISTER:
        return <RegisterView 
                  onRegisterAttempt={handleRegister} 
                  registrationError={registrationError} 
                  t={t} 
                  onViewChange={handleViewChange}
                />;
      case View.PROFILE:
        if (currentUser?.role === Role.CUSTOMER) {
          return <ProfileView 
                    currentUser={currentUser}
                    onUpdateProfile={handleUpdateUserProfile}
                    isLoadingProfileUpdate={isLoadingProfileUpdate}
                    customerOrders={customerOrders}
                    isLoadingOrders={isLoadingCustomerOrders}
                    t={t}
                    showNotification={showNotification}
                 />;
        }
        // If not a customer, redirect to login or customer view
        handleViewChange(View.CUSTOMER); 
        return null;
      default:
        return <p>Vista no encontrada</p>;
    }
  };


  return (
    <div className="min-h-screen bg-background text-textPrimary font-sans flex flex-col">
      <Header 
        currentView={currentView} 
        onViewChange={handleViewChange}
        cartItemCount={cartItemCount}
        onCartClick={() => setIsCartOpen(true)}
        t={t}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      {notification && (
        <div 
          role="alert"
          aria-live="assertive"
          className={`fixed top-20 right-4 p-4 rounded-md shadow-lg z-[1000] text-white transition-opacity duration-300 ease-in-out
          ${notification.type === 'success' ? 'bg-secondary text-textOnSecondary' : 'bg-red-600 text-white'}
          ${notification ? 'opacity-100' : 'opacity-0'}`}
        >
          {notification.message}
        </div>
      )}
      <main className="flex-grow">
        {/* Global loading states for entire views - more specific loaders can be inside views */}
        {(currentView === View.CUSTOMER && isLoadingProducts && products.length === 0) && <p className="text-center py-10">{t('loadingProducts' as TranslationKey)}...</p>}
        {(currentView === View.ADMIN && isLoadingAdminData && !orders.length && !sales.length && !productRequests.length) && <p className="text-center py-10">{t('loadingAdminData' as TranslationKey)}...</p>}
        {(currentView === View.PROFILE && isLoadingCustomerOrders && !customerOrders.length && currentUser?.role === Role.CUSTOMER) && <p className="text-center py-10">{t('loadingAdminData' as TranslationKey)}...</p>} {/* Re-use loading message */}
        
        {renderCurrentView()}
      </main>
      <footer className="bg-primary-dark text-textOnPrimary/90 text-center p-6 text-sm">
        &copy; {new Date().getFullYear()} <span className="font-serif">{t('appName')}</span>. {t('footerAllRightsReserved')}
      </footer>
    </div>
  );
};

export default App;