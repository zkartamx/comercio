 /**
 * Central repository for all user-facing translatable strings in the application.
 * Currently, all translations are in Spanish (es-MX).
 * To add another language, you would typically create a similar object for that language
 * and implement a language selection mechanism.
 * The keys of this object are used as `TranslationKey` throughout the application.
 */
export const translations = {
  // General
  appName: 'Canal de Ventas Pro',
  close: 'Cerrar',
  cancel: 'Cancelar',
  total: 'Total:',
  notesOptional: 'Notas (Opcional)',
  quantity: 'Cantidad',
  status: 'Estado',
  dateLabel: 'Fecha', // Changed from 'date' to avoid conflict with date objects/functions
  idLabel: 'ID', // Changed from 'id'
  items: 'Artículos:',
  priceEach: 'c/u',
  error: 'Error:',
  selectPlaceholder: 'Seleccionar...',
  footerAllRightsReserved: 'Todos los derechos reservados.',
  units: 'unidades',
  itemGeneric: 'Artículo', // For generic item removal notification
  loadingApp: 'Cargando aplicación',
  loadingProducts: 'Cargando productos',
  loadingAdminData: 'Cargando datos de administración',
  fieldRequired: 'Este campo es obligatorio.',
  allFieldsRequired: 'Todos los campos marcados con * son obligatorios.',
  save: 'Guardar',
  saving: 'Guardando...',
  optional: 'Opcional',
  back: 'Volver',
  submit: 'Enviar',
  submitting: 'Enviando...',
  confirm: 'Confirmar',
  yes: 'Sí',

  // Header
  customerPortal: 'Portal de Cliente', // Will be less used, "My Account" takes precedence for logged in customers
  sellerPortal: 'Portal de Vendedor',
  adminPanel: 'Panel de Admin',
  cart: 'Carrito',
  logoutButton: 'Cerrar Sesión',
  loginRegisterButton: 'Iniciar Sesión / Registrarse',
  myAccountButton: 'Mi Cuenta',
  helloUser: 'Hola, {displayName}',

  // Product Card
  inStock: 'en stock',
  outOfStock: 'Agotado',
  addToCart: 'Agregar al Carrito',

  // Customer View
  storeName: 'Nombre de la Tienda',
  viewCart: 'Ver Carrito',
  searchProductsPlaceholder: 'Buscar productos...',
  searchProductRequestsPlaceholder: 'Buscar solicitudes por ID, vendedor, producto...',
  shoppingCartTitle: 'Carrito de Compras',
  cartEmpty: 'Tu carrito está vacío.',
  decreaseQuantity: 'Disminuir cantidad',
  increaseQuantity: 'Aumentar cantidad',
  removeItem: 'Eliminar artículo',
  continueShopping: 'Seguir Comprando',
  proceedToCheckout: 'Proceder al Pago',
  checkoutTitle: 'Finalizar Compra',
  customerInformation: 'Información del Cliente',
  // Checkout Form Labels
  streetAddressLabel: 'Dirección',
  fullNameLabel: 'Nombre Completo',
  emailLabel: 'Correo Electrónico',
  streetAndNumberLabel: 'Calle y Número',
  cityLabel: 'Ciudad',
  stateLabel: 'Estado/Provincia',
  zipCodeLabel: 'Código Postal',
  countryLabel: 'País',
  phoneLabel: 'Teléfono',
  requestInvoiceLabel: 'Requiero factura',
  rfcLabel: 'RFC',
  razonSocialLabel: 'Razón Social',
  cfdiUseLabel: 'Uso de CFDI',
  billingEmailLabel: 'Correo para Factura',
  phoneNumberLabel: 'Número de teléfono',
  noProductsFoundSearch: 'No se encontraron productos que coincidan con tu búsqueda.',
  noProductsAvailable: 'No hay productos disponibles en este momento.',
  clearCart: 'Vaciar Carrito',
  placeOrder: 'Realizar Pedido',
  orderConfirmed: '¡Pedido Confirmado!',
  thankYouForYourOrder: '¡Gracias por tu pedido!',
  orderIdLabel: 'ID de Pedido:', // Changed from 'orderId'
  orderSummary: 'Resumen del Pedido:',
  paymentInstructions: 'Instrucciones de Pago:',
  bankTransferInstructions: `Por favor, transfiere el monto total a la siguiente cuenta bancaria:
Nombre del Banco: Banco Ejemplo
Titular de la Cuenta: Canal de Ventas Pro
Número de Cuenta: 123-456-7890
Referencia: Por favor, usa tu ID de Pedido como referencia de pago.

Tu pedido será procesado una vez que se confirme el pago.`,
  alertFullNameAndEmailRequired: 'El Nombre Completo y el Correo Electrónico son obligatorios.',
  alertInvalidEmail: 'Por favor, ingresa una dirección de correo electrónico válida.',
  loginToCheckout: 'Por favor, inicia sesión o regístrate para continuar con tu compra.',
  shippingAddress: 'Dirección de Envío',
  billingInformation: 'Información de Facturación',

  // Seller View
  sellerPortalTitle: 'Portal de Vendedor',
  sellerPortalDescription: 'Registra tus ventas y solicita nuevo stock de productos.',
  sellerWelcome: 'Bienvenido, {sellerName}',
  logSale: 'Registrar Venta',
  requestProducts: 'Solicitar Productos',
  logNewSale: 'Registrar Nueva Venta',
  sellerIdLabel: 'ID de Vendedor', // Changed
  selectSeller: 'Seleccionar Vendedor', // Will be removed mostly
  product: 'Producto',
  selectProduct: 'Seleccionar Producto',
  quantitySold: 'Cantidad Vendida',
  requestProductStock: 'Solicitar Stock de Producto',
  quantityRequested: 'Cantidad Solicitada',
  reasonNotesOptional: 'Motivo/Notas (Opcional)',
  submitRequest: 'Enviar Solicitud',
  alertSellerProductQuantity: 'Por favor, selecciona un producto e ingresa una cantidad válida.', // Seller ID is now from logged in user
  notEnoughStockToSell: 'No hay suficiente stock para {productName}. Disponible: {stock}.',
  finalizeSale: 'Finalizar Venta',
  addProductToSale: 'Agregar Producto a la Venta',
  currentSaleItemsTitle: 'Artículos en Venta Actual',
  removeItemName: 'Eliminar {itemName}', // Used for aria-label, {itemName} will be interpolated
  totalAmount: 'Total:', // As per SellerView TODO
  alertSellerProductSelection: 'Por favor, selecciona un producto.',
  alertSaleNoItems: 'No se puede registrar una venta vacía. Por favor, agrega artículos.',

  // Admin View
  adminDashboard: 'Panel de Administración',
  adminWelcome: 'Bienvenido, {adminName}',
  customerOrders: 'Pedidos de Clientes',
  sellerSales: 'Ventas de Vendedores',
  searchOrdersPlaceholder: 'Buscar pedidos...',
  searchSalesPlaceholder: 'Buscar ventas...',
  productRequests: 'Solicitudes de Productos',
  salesSummaryAI: 'Resumen de Ventas (IA)',
  noCustomerOrders: 'Aún no hay pedidos de clientes.',
  customerLabel: 'Cliente:', // Changed
  noSalesRecords: 'Aún no hay registros de ventas.',
  noResultsFound: 'No se encontraron resultados.',
  saleIdLabel: 'ID de Venta:', // Changed
  sourceLabel: 'Fuente:', // Changed
  itemsSold: 'Artículos Vendidos:',
  noProductRequests: 'Aún no hay solicitudes de productos.',
  requestIdLabel: 'ID de Solicitud:', // Changed
  aiSalesSummary: 'Resumen de Ventas con IA',
  generating: 'Generando...',
  generateNewSummary: 'Generar Nuevo Resumen',
  generatingSummaryWait: 'Generando resumen, por favor espera...',
  geminiAiAnalysis: 'Análisis con IA de Gemini:',
  clickGenerateSummary: 'Haz clic en "Generar Nuevo Resumen" para obtener información sobre tendencias de ventas impulsada por IA.',
  paymentStatusLabel: 'Estado de Pago',


  // Manage Products (Admin)
  manageProductsTab: 'Gestionar Productos',
  addNewProductTitle: 'Agregar Nuevo Producto',
  productNameLabel: 'Nombre del Producto',
  productDescriptionLabel: 'Descripción del Producto',
  productPriceLabel: 'Precio del Producto',
  productStockLabel: 'Stock Inicial',
  productImageUrlLabel: 'URL de la Imagen del Producto',
  productImagePreviewAlt: 'Vista previa de la imagen del producto',
  addProductButton: 'Agregar Producto',
  existingProductsTitle: 'Productos Existentes',
  noProductsInSystem: 'No hay productos registrados en el sistema.',
  price: 'Precio', // Column header
  stock: 'Stock', // Column header
  actions: 'Acciones', // Column header (for future edit/delete)
  editProductButton: 'Editar', 
  deleteProductButton: 'Eliminar', 
  editingProductTitle: 'Editar Producto', 
  confirmDeleteProductTitle: 'Confirmar Eliminación', 
  confirmDeleteProductMessage: '¿Estás seguro de que quieres eliminar el producto "{productName}"? Esta acción no se puede deshacer.', 
  confirmButton: 'Confirmar',


  editProduct: 'Editar Producto', 
  productName: 'Nombre del Producto', 
  productDescription: 'Descripción', 
  productPrice: 'Precio', 
  productStock: 'Stock', 
  productImageUrl: 'URL de Imagen', 
  saveChanges: 'Guardar Cambios',

  // Manage Sellers (Admin) - NEW
  manageSellersTab: 'Gestionar Vendedores',
  addSellerTitle: 'Agregar Nuevo Vendedor',
  sellerUsernameLabel: 'Nombre de Usuario del Vendedor',
  sellerPasswordLabel: 'Contraseña del Vendedor',
  sellerNameLabel: 'Nombre del Vendedor',
  sellerEmailLabel: 'Correo Electrónico del Vendedor',
  sellerDisplayNameLabel: 'Nombre para Mostrar del Vendedor',
  addSellerButton: 'Agregar Vendedor',
  existingSellersTitle: 'Vendedores Existentes',
  usernameColumn: 'Usuario',
  displayNameColumn: 'Nombre',
  noSellersInSystem: 'No hay vendedores registrados en el sistema.',
  confirmDeleteSellerTitle: 'Confirmar Eliminación de Vendedor',
  confirmDeleteSellerMessage: '¿Estás seguro de que deseas eliminar al vendedor "{sellerName}" ({sellerUsername})? Esta acción no se puede deshacer.',
  sellerAddedSuccess: 'Vendedor "{sellerName}" agregado con éxito.',
  errorAddingSeller: 'Error al agregar el vendedor: {error}',
  sellerDeletedSuccess: 'Vendedor "{sellerName}" eliminado con éxito.',
  errorDeletingSeller: 'Error al eliminar el vendedor: {error}',
  
  // Statuses (Order & Request) - keys are lowercase, values are Spanish
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  approved: 'Aprobado',
  fulfilled: 'Surtido', // For product requests
  rejected: 'Rechazado',
  
  // Payment Statuses - keys are lowercase
  unpaid: 'No Pagado',
  paid: 'Pagado',
  refunded: 'Reembolsado',

  // Sale Sources - keys are lowercase and no spaces, values are Spanish
  online: 'En Línea',
  sellerdirect: 'Vendedor Directo',


  // Notifications
  productXAddedToCart: '{productName} agregado al carrito.',
  productXOutOfStock: '{productName} está agotado.',
  maxStockReached: 'Stock máximo para {productName} alcanzado en el carrito.',
  itemRemovedFromCart: '{productName} eliminado del carrito.',
  cartCleared: 'Carrito vaciado.',
  orderConfirmedAdminWhatsApp: '¡Pedido confirmado! Se notificará al administrador por WhatsApp.',
  orderConfirmedAdminNoWhatsApp: 'Pedido del cliente confirmado. Notifícale manualmente ya que WhatsApp no está configurado.',
  orderConfirmedGuestWithTempAccount: 'Tu pedido {{orderId}} está confirmado! Se ha creado una cuenta temporal con {{customerEmail}}. Recibirás un correo en breve.',
  orderConfirmedRegisteredUser: '¡Tu pedido {{orderId}} ha sido confirmado!',
  saleLoggedSuccessID: '¡Venta registrada con éxito! ID de Venta: {saleId}',
  productRequestSubmittedID: '¡Solicitud de producto enviada! ID de Solicitud: {requestId}',
  orderStatusUpdated: 'Estado del pedido {orderId} actualizado a {status}.',
  orderPaymentStatusUpdated: 'Estado de pago del pedido {orderId} actualizado a {status}.',
  productRequestFulfilled: 'Solicitud de producto {requestId} para {productName} surtida. Stock actualizado.',
  productRequestStatusUpdated: 'Estado de la solicitud de producto {requestId} actualizado a {status}.',
  productUpdatedSuccess: 'Producto "{productName}" actualizado con éxito.',
  productAddedSuccess: 'Producto "{productName}" agregado con éxito.',
  productDeletedSuccess: 'Producto "{productName}" eliminado con éxito.', 
  whatsappOrderReceivedAdmin: `📢 ¡Nuevo Pedido Recibido! 📢

📝 ID de Pedido: {orderId}
👤 Cliente: {customerName} ({customerEmail})

🛍️ Artículos:
  - {itemsSummary}

💰 Monto Total: ${"{totalAmount}"} MXN

🏦 Por favor, verifica el pago y actualiza el estado del pedido en el panel de administración.`,
  whatsappInvoiceRequestedLabel: '🧾 Factura Solicitada:',
  whatsappBillingDetailsLabel: '📋 Datos de Facturación:',
  whatsappRfcLabel: 'RFC:',
  whatsappRazonSocialLabel: 'Razón Social:',
  whatsappCfdiUseLabel: 'Uso CFDI:',
  whatsappFiscalAddressLabel: 'Domicilio Fiscal:',
  whatsappBillingEmailLabel: 'Email Factura:',
  errorPlacingOrder: 'Ocurrió un error al procesar tu pedido. Por favor, inténtalo de nuevo.',
  errorFetchingProducts: 'Error al cargar los productos. Intenta recargar la página.',
  errorFetchingAdminData: 'Error al cargar los datos de administración. Intenta recargar la página.',
  errorLoggingSale: 'Error al registrar la venta. Por favor, inténtalo de nuevo.',
  errorSubmittingRequest: 'Error al enviar la solicitud. Por favor, inténtalo de nuevo.',
  errorUpdatingStatus: 'Error al actualizar el estado. Por favor, inténtalo de nuevo.',
  errorGeneratingSummary: 'Error al generar el resumen de ventas. Por favor, inténtalo de nuevo.',
  errorOpeningWhatsApp: 'Error al abrir WhatsApp. Es posible que haya sido bloqueado por tu navegador. Por favor, revisa la configuración de bloqueo de elementos emergentes.',
  errorAddingProduct: 'Error al agregar el producto: {error}', 
  errorUpdatingProduct: 'Error al actualizar el producto: {error}', 
  errorDeletingProduct: 'Error al eliminar el producto: {error}', 
  registrationSuccess: '¡Registro exitoso! Bienvenido, {displayName}.',
  errorRegistration: 'Error en el registro: {error}',
  registrationSuccessButLoginFailed: '¡Registro exitoso! Sin embargo, el inicio de sesión automático falló: {loginError}. Por favor, intenta iniciar sesión manualmente.',
  errorRegistrationResponse: 'La respuesta del servidor de registro no fue la esperada.',
  profileUpdateSuccess: 'Perfil actualizado con éxito.',
  errorProfileUpdate: 'Error al actualizar el perfil: {error}',
  passwordChangeSuccess: 'Contraseña cambiada con éxito.',
  errorPasswordChange: 'Error al cambiar la contraseña: {error}',
  passwordMismatch: 'Las contraseñas no coinciden.',
  emailAlreadyExists: 'Este correo electrónico ya está registrado.',

  // Gemini Service Specific
  geminiNoSalesData: "No hay datos de ventas disponibles para generar un resumen.",
  geminiNoRecentSales: "No se registraron ventas en los últimos 7 días para generar un resumen.",
  geminiErrorNoText: "El modelo de IA no devolvió ningún texto. Por favor, inténtalo de nuevo.",
  geminiErrorInvalidApiKey: "Error de API Gemini: La clave API no es válida. Por favor, revisa tu configuración.",
  geminiErrorGeneral: "Error de API Gemini:",
    
  // Aria Labels
  ariaCloseModal: 'Cerrar modal',
  ariaQuantityFor: 'Cantidad para {productName}',
  ariaRemoveItem: 'Eliminar {productName} del carrito',

  // Login View
  loginTitle: 'Iniciar Sesión', // Generic login title
  loginTitleSeller: 'Acceso Vendedor',
  loginTitleAdmin: 'Acceso Administrador',
  loginTitleCustomer: 'Acceso Cliente',
  usernameLabel: 'Nombre de Usuario', // For Admin/Seller
  passwordLabel: 'Contraseña',
  loginButton: 'Iniciar Sesión',
  loginFailedError: 'Credenciales incorrectas o rol no válido.',
  accessDenied: 'Acceso Denegado. No tienes permiso para ver esta página.',
  loginPromptSeller: 'Por favor, inicia sesión para acceder al Portal de Vendedor.',
  loginPromptAdmin: 'Por favor, inicia sesión para acceder al Panel de Administración.',
  loginPromptCustomer: 'Inicia sesión para continuar.',
  loggingIn: 'Iniciando sesión...',
  dontHaveAccount: '¿No tienes una cuenta?',
  registerNow: 'Regístrate aquí',
  alreadyHaveAccount: '¿Ya tienes una cuenta?',
  loginHere: 'Inicia sesión aquí',
  loginAsRole: 'Iniciar sesión como:', // Prompt for role selection if needed

  // Registration View
  registerTitle: 'Crear Cuenta de Cliente',
  registerPrompt: 'Completa tus datos para crear una cuenta nueva.',
  displayNameLabel: 'Nombre Completo (Visible)',
  confirmPasswordLabel: 'Confirmar Contraseña',
  registerButton: 'Registrarme',
  registering: 'Registrando...', 
  emailAlreadyRegisteredError: 'Este correo electrónico ya está registrado. Por favor, inicia sesión o utiliza otro.',
  invalidEmailFormatError: 'Formato de correo inválido.',
  errorCheckingEmail: 'Error al verificar el correo electrónico. Intenta de nuevo.',
  errorNetworkResponse: 'Error de red al verificar el correo. Verifica tu conexión.',
  correctEmailErrorPrompt: 'Por favor, corrige los errores indicados en el campo de correo electrónico antes de continuar.',

  // Profile View
  profileTitle: 'Mi Perfil',
  editProfileTab: 'Editar Perfil',
  manageAddressesTab: 'Mis Direcciones',
  manageBillingInfoTab: 'Datos de Facturación',
  orderHistoryTab: 'Historial de Pedidos',
  updateProfileButton: 'Actualizar Perfil',
  changePasswordButton: 'Cambiar Contraseña',
  currentPasswordLabel: 'Contraseña Actual',
  newPasswordLabel: 'Nueva Contraseña',
  confirmNewPasswordLabel: 'Confirmar Nueva Contraseña',
  noAddressesSaved: 'No tienes direcciones guardadas.',
  addAddressButton: 'Agregar Nueva Dirección',
  editAddressButton: 'Editar Dirección',
  deleteAddressButton: 'Eliminar Dirección',
  confirmDeleteAddressTitle: 'Confirmar Eliminación de Dirección',
  confirmDeleteAddressMessage: '¿Estás seguro de que quieres eliminar esta dirección?',
  noBillingInfoSaved: 'No tienes información de facturación guardada.',
  addBillingInfoButton: 'Agregar Datos de Facturación',
  editBillingInfoButton: 'Editar Datos de Facturación',
  noOrdersFound: 'Aún no has realizado ningún pedido.',
  viewOrderDetails: 'Ver Detalles',
  orderDate: 'Fecha del Pedido',
  orderTotal: 'Total del Pedido',
  orderStatus: 'Estado del Pedido',
  
  // Address Form Fields
  
  // Billing Form Fields
  selectCfdiUse: 'Seleccionar Uso de CFDI',
  fiscalAddressLabel: 'Domicilio Fiscal',

  // CFDI Uses (Example values for Mexico)
  cfdiG01: 'G01 - Adquisición de mercancías',
  cfdiG02: 'G02 - Devoluciones, descuentos o bonificaciones',
  cfdiG03: 'G03 - Gastos en general',
  cfdiI01: 'I01 - Construcciones',
  cfdiI02: 'I02 - Mobilario y equipo de oficina por inversiones',
  cfdiI03: 'I03 - Equipo de transporte',
  cfdiI04: 'I04 - Equipo de computo y accesorios',
  cfdiI05: 'I05 - Dados, troqueles, moldes, matrices y herramental',
  cfdiI06: 'I06 - Comunicaciones telefónicas',
  cfdiI07: 'I07 - Comunicaciones satelitales',
  cfdiI08: 'I08 - Otra maquinaria y equipo',
  cfdiD01: 'D01 - Honorarios médicos, dentales y gastos hospitalarios.',
  cfdiD02: 'D02 - Gastos médicos por incapacidad o discapacidad',
  cfdiD03: 'D03 - Gastos funerales.',
  cfdiD04: 'D04 - Donativos.',
  cfdiD05: 'D05 - Intereses reales efectivamente pagados por créditos hipotecarios (casa habitación).',
  cfdiD06: 'D06 - Aportaciones voluntarias al SAR.',
  cfdiD07: 'D07 - Primas por seguros de gastos médicos.',
  cfdiD08: 'D08 - Gastos de transportación escolar obligatoria.',
  cfdiD09: 'D09 - Depósitos en cuentas para el ahorro, primas que tengan como base planes de pensiones.',
  cfdiD10: 'D10 - Pagos por servicios educativos (colegiaturas)',
  cfdiP01: 'P01 - Por definir',

};