import React, { useState, useMemo, useEffect } from 'react';
import { Product, CartItem, Order, OrderItem, Address, BillingInfo, TranslationKey, User, OrderPlacementPayload } from '../types';
import ProductCard from '../components/ProductCard';
import Modal from '../components/Modal';

// Helper to create an empty address
const createEmptyAddress = (): Address => ({
  street: '', city: '', state: '', zip: '', country: 'México' // Default country
});

// Helper to create empty billing info
const createEmptyBillingInfo = (defaultAddress?: Address): BillingInfo => ({
  rfc: '',
  razonSocial: '',
  cfdiUse: 'P01', // Default to "Por definir"
  fiscalAddress: defaultAddress || createEmptyAddress(),
  email: ''
});

/**
 * Props for the CustomerView component.
 */
interface CustomerViewProps {
  products: Product[];
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  placeOrder: (orderData: OrderPlacementPayload) => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  lastOrderConfirmationDetails: { order: Order; bankInstructions: string } | null;
  setLastOrderConfirmationDetails: (details: null) => void;
  t: (key: TranslationKey, replacements?: Record<string, string | number>) => string;
  currentUser: User | null;
  showNotification: (messageKey: TranslationKey, type: 'success' | 'error', replacements?: Record<string, string | number>) => void;
}

/**
 * CustomerView component.
 * Displays products, manages the shopping cart, and handles the checkout process for customers.
 */
const CustomerView: React.FC<CustomerViewProps> = ({
  products,
  cart,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  placeOrder,
  isCartOpen,
  setIsCartOpen,
  lastOrderConfirmationDetails,
  setLastOrderConfirmationDetails,
  t,
  currentUser,
  showNotification,
}) => {
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  
  // Checkout form state
  const [customerName, setCustomerName] = useState(''); // For the order, could be displayName or guest name
  const [customerEmail, setCustomerEmail] = useState(''); // For the order, could be user's email or guest email
  const [shippingAddress, setShippingAddress] = useState<Address>(createEmptyAddress());
  const [billingRequested, setBillingRequested] = useState(false);
  const [billingInfo, setBillingInfo] = useState<BillingInfo>(() => createEmptyBillingInfo());

  const [searchTerm, setSearchTerm] = useState('');
  const [isOrderConfirmationModalOpen, setIsOrderConfirmationModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [emailVerificationStatus, setEmailVerificationStatus] = useState<'idle' | 'verifying' | 'verified'>('idle');
  const [emailVerificationMessage, setEmailVerificationMessage] = useState<string | null>(null);

  // Password validation function
  const validatePassword = (pass: string): string[] => {
    const errors: string[] = [];
    if (pass.length < 8) {
      errors.push('Debe tener al menos 8 caracteres.');
    }
    if (!/[A-Z]/.test(pass)) {
      errors.push('Debe contener al menos una letra mayúscula.');
    }
    if (!/[a-z]/.test(pass)) {
      errors.push('Debe contener al menos una letra minúscula.');
    }
    if (!/[0-9]/.test(pass)) {
      errors.push('Debe contener al menos un número.');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(pass)) {
      errors.push('Debe contener al menos un carácter especial (ej. !@#$%).');
    }
    return errors;
  };

  const isValidEmail = (email: string) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  };

  const checkEmailAvailability = async () => {
    if (currentUser) { // Don't check if user is logged in
      setEmailVerificationStatus('idle');
      setEmailVerificationMessage(null);
      return;
    }
    if (!customerEmail) { // Email is empty, clear message or set a specific one if desired
      setEmailVerificationStatus('idle');
      setEmailVerificationMessage(null); 
      return;
    }
    if (!isValidEmail(customerEmail)) { // Email has invalid format
      setEmailVerificationStatus('verified'); // Considered 'verified' as we've processed it
      // TODO: Replace with t('invalidEmailFormatError') once key is added
      setEmailVerificationMessage("Formato de correo inválido."); 
      return;
    }

    setEmailVerificationStatus('verifying');
    setEmailVerificationMessage(null); // Clear previous message
    try {
      console.log('[CustomerView] Attempting to check email:', customerEmail);
      const response = await fetch(`/api/users/check-email?email=${encodeURIComponent(customerEmail)}`);

      if (response.status === 304) {
        console.warn('[CustomerView] Received 304 Not Modified for check-email. This is unexpected. Treating as non-existent for now, but backend should be fixed.');
        setEmailVerificationMessage(null); // Or a specific message indicating cached/uncertain status
        setEmailVerificationStatus('verified');
        return; 
      }

      const data = await response.json(); // Parse JSON once
      console.log('[CustomerView] API Response Status:', response.status);
      console.log('[CustomerView] API Response Data (parsed):', data);

      if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}`);
      }

      if (data.exists) {
        setEmailVerificationMessage('Este correo electrónico ya está registrado. Por favor, inicia sesión o utiliza otro.');
      } else {
        // setEmailVerificationMessage(t('emailAvailableSuccess')); // Optional success message
        setEmailVerificationMessage(null); // Or clear message if available
      }
    } catch (error: any) {
      console.error('[CustomerView] Error caught in checkEmailAvailability. Message:', error.message);
      console.error('[CustomerView] Full error object during checkEmailAvailability:', error);
      // It's useful to check if the error object has more specific properties, e.g., from a failed fetch response
      // For instance, if 'error' itself is the 'data' from a !response.ok scenario where data.message was used.
      // If 'error' is an Error object thrown like new Error(data.message), then error.message is what we need.
      setEmailVerificationMessage(error.message || 'Error al verificar el correo. Intenta de nuevo.');
    }
    setEmailVerificationStatus('verified');
  };

  const handleCustomerEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerEmail(e.target.value);
    if (emailVerificationStatus !== 'idle') {
        setEmailVerificationStatus('idle');
        setEmailVerificationMessage(null);
    }
  };

  const closeOrderConfirmationModal = () => {
    setLastOrderConfirmationDetails(null);
    setIsOrderConfirmationModalOpen(false);
  };

  const closeCheckoutModal = () => {
    setIsCheckoutModalOpen(false);
    // States like password, formError, emailVerification are reset in handleOpenCheckout or useEffect for [currentUser, isCheckoutModalOpen]
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, fieldPath: keyof Address) => {
    const { value } = e.target;
    setShippingAddress(prev => ({ ...prev, [fieldPath]: value }));
  };

  // Pre-fill checkout form if user is logged in
  useEffect(() => {
    if (currentUser) {
      setCustomerName(currentUser.name || '');
      setCustomerEmail(currentUser.email || '');
      if (currentUser.defaultShippingAddress) {
        setShippingAddress({ ...currentUser.defaultShippingAddress });
      } else {
        setShippingAddress(createEmptyAddress());
      }
      if (currentUser.defaultBillingDetails) {
        setBillingInfo({ 
          ...currentUser.defaultBillingDetails, 
          // Ensure fiscalAddress is an object, even if defaultBillingDetails has it as null/undefined
          fiscalAddress: currentUser.defaultBillingDetails.fiscalAddress || createEmptyAddress() 
        });
        // Optionally, default billingRequested to true if they have billing info
        // if (Object.keys(currentUser.defaultBillingDetails).length > 0) setBillingRequested(true);
      } else {
        // If no default billing, create empty but use default shipping for fiscal address part if available
        setBillingInfo(createEmptyBillingInfo(currentUser.defaultShippingAddress || createEmptyAddress()));
      }
    } else {
      // Reset form if user logs out or is not logged in
      setCustomerName('');
      setCustomerEmail('');
      setShippingAddress(createEmptyAddress());
      setBillingRequested(false);
      setBillingInfo(createEmptyBillingInfo());
    }
  }, [currentUser, t, isCheckoutModalOpen]); // Re-run if checkout modal opens to ensure fresh data

  useEffect(() => {
    if (lastOrderConfirmationDetails) {
      setIsOrderConfirmationModalOpen(true);
    } else {
      setIsOrderConfirmationModalOpen(false);
    }
  }, [lastOrderConfirmationDetails]);

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const term = searchTerm.toLowerCase();
      return (
        product.name.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term)
      );
    });
  }, [products, searchTerm]);

  const handleOpenCheckout = () => {
    if (cart.length === 0) {
      showNotification('yourCartIsEmpty' as TranslationKey, 'error');
      return;
    }
    setIsCartOpen(false);
    setPassword('');
    setConfirmPassword('');
    setIsCheckoutModalOpen(true);
    setFormError(null);
  };
  
  const handleCheckout = () => {
    setFormError(null);
    if (!currentUser && (!password || !confirmPassword)) {
      setFormError('Por favor, introduce y confirma tu contraseña para crear una cuenta.');
      return;
    }
    if (!currentUser && password !== confirmPassword) {
      setFormError('Las contraseñas no coinciden.');
      return;
    }
    if (!currentUser && password) {
      const currentPasswordErrors = validatePassword(password);
      if (currentPasswordErrors.length > 0) {
        setFormError('La contraseña no cumple los requisitos: ' + currentPasswordErrors.join(' '));
        setPasswordErrors(currentPasswordErrors); // Ensure errors are displayed
        return;
      }
    }
    // Validate shipping address
    if (!shippingAddress.street.trim() || !shippingAddress.city.trim() || !shippingAddress.state.trim() || !shippingAddress.zip.trim() || !shippingAddress.country.trim()) {
      setFormError(t('allFieldsRequired') + " (Dirección de Envío)");
      return;
    }

    if (billingRequested) {
      if (!billingInfo.rfc.trim() || !billingInfo.razonSocial.trim() || !billingInfo.cfdiUse.trim() ||
          !billingInfo.fiscalAddress.street.trim() || !billingInfo.fiscalAddress.city.trim() ||
          !billingInfo.fiscalAddress.state.trim() || !billingInfo.fiscalAddress.zip.trim() ||
          !billingInfo.fiscalAddress.country.trim()
      ) {
        setFormError(t('allFieldsRequired') + " (Información de Facturación)");
        return;
      }
    }

    const orderItems: OrderItem[] = cart.map(item => ({
      productId: item.id,
      productName: item.name,
      quantity: item.quantity,
      priceAtOrder: item.price,
    }));

    const orderDataForApi: OrderPlacementPayload = {
      userId: currentUser?.id, // Add userId if customer is logged in
      customerName,
      customerEmail,
      items: orderItems,
      totalAmount: cartTotal,
      shippingAddress: { ...shippingAddress }, // Snapshot of shipping address
      billingRequested,
      billingDetails: billingRequested ? billingInfo : undefined,
      password: (!currentUser && password) ? password : undefined,
    };
    
    placeOrder(orderDataForApi);

    setIsCheckoutModalOpen(false);
    // Customer name/email might persist if user is logged in and these fields are from profile
    // but address/billing fields in modal should clear or reset to profile defaults on next open.
    // This is handled by useEffect on currentUser and isCheckoutModalOpen.
  };
  
  const handleBillingInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, fieldPath: string) => {
    const { value, type } = e.target;
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setBillingInfo(prev => {
      const keys = fieldPath.split('.');
      if (keys.length === 1) {
        const field = keys[0] as Exclude<keyof BillingInfo, 'fiscalAddress'>;
        return { ...prev, [field]: finalValue };
      } else if (keys.length === 2 && keys[0] === 'fiscalAddress') {
        const fiscalAddressField = keys[1] as keyof Address;
        return {
          ...prev,
          fiscalAddress: {
            ...(prev.fiscalAddress || createEmptyAddress()), // Ensure fiscalAddress is initialized
            [fiscalAddressField]: finalValue,
          },
        };
      }
      return prev; 
    });
  };

  const cfdiOptions = [
    'P01', 'G01', 'G02', 'G03', 'I01', 'I02', 'I03', 'I04', 'I05', 'I06', 'I07', 'I08', 
    'D01', 'D02', 'D03', 'D04', 'D05', 'D06', 'D07', 'D08', 'D09', 'D10'
  ];


  const inputClasses = "mt-1 block w-full px-4 py-3 border border-borderLight rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary sm:text-sm transition-colors bg-white";
  const labelClasses = "block text-sm font-medium text-textSecondary";
  const primaryButtonClasses = "px-6 py-3 bg-secondary hover:bg-secondary-dark text-textOnSecondary font-semibold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-secondary-light focus:ring-opacity-75";
  const secondaryButtonClasses = "px-4 py-2 text-sm font-medium text-textPrimary bg-slate-100 hover:bg-slate-200 rounded-lg border border-borderLight shadow-sm hover:shadow-md transition-colors";

  return (
    <div className="container mx-auto p-4 pt-8 font-sans relative">
      {/* Header with cart button */}
      <header className="flex justify-between items-center mb-8 pb-4 border-b border-borderLight">
        <h1 className="font-serif text-5xl font-bold text-primary">{t('storeName')}</h1>
      </header>

      {/* Search Bar - Minimal for now */}
      <div className="mb-8">
        <input 
          type="text"
          placeholder={t('searchProductsPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 border border-borderLight rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow shadow-sm"
        />
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {filteredProducts.map(product => (
          <ProductCard 
            key={product.id} 
            product={product} 
            onAddToCart={addToCart} 
            t={t} 
          />
        ))}
      </div>

      {/* Shopping Cart Modal */}
      <Modal 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        title={t('shoppingCartTitle')}
        size="lg"
        t={t}
      >
        {cart.length === 0 ? (
          <p className="text-center text-textSecondary py-8">{t('cartEmpty')}</p>
        ) : (
          <div className="space-y-4">
            {cart.map(item => (
              <div key={item.id} className="flex items-center justify-between p-4 border border-borderLight rounded-lg bg-background shadow-sm">
                <div className="flex items-center space-x-4">
                  <img src={item.imageUrl || '/placeholder-image.png'} alt={item.name} className="w-16 h-16 object-cover rounded-md"/>
                  <div>
                    <h4 className="font-semibold text-textPrimary text-lg">{item.name}</h4>
                    <p className="text-sm text-textSecondary">${item.price.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center border border-borderLight rounded-md">
                    <button 
                      onClick={() => updateCartQuantity(item.id, item.quantity - 1)} 
                      disabled={item.quantity <= 1}
                      className="px-3 py-1 text-lg text-primary hover:bg-primary/10 disabled:text-textDisabled disabled:hover:bg-transparent transition-colors rounded-l-md"
                      aria-label={t('decreaseQuantity')}
                    >–</button>
                    <span className="px-4 py-1 text-textPrimary font-medium tabular-nums">{item.quantity}</span>
                    <button 
                      onClick={() => updateCartQuantity(item.id, item.quantity + 1)} 
                      className="px-3 py-1 text-lg text-primary hover:bg-primary/10 transition-colors rounded-r-md"
                      aria-label={t('increaseQuantity')}
                    >+</button>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.id)} 
                    className="text-red-500 hover:text-red-700 transition-colors p-1 rounded-full hover:bg-red-500/10"
                    aria-label={t('removeItem')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            <div className="pt-6 border-t border-borderLight">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xl font-semibold text-textPrimary">{t('total')}</h4>
                <p className="text-2xl font-bold text-secondary">${cartTotal.toFixed(2)}</p>
              </div>
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                <button 
                  onClick={() => setIsCartOpen(false)} 
                  className={secondaryButtonClasses + " order-2 sm:order-1"}
                >
                  {t('continueShopping')}
                </button>
                <button 
                  onClick={handleOpenCheckout} 
                  className={primaryButtonClasses + " order-1 sm:order-2"}
                >
                  {t('proceedToCheckout')}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Checkout Modal */}
      <Modal 
        isOpen={isCheckoutModalOpen} 
        onClose={closeCheckoutModal} 
        title={t('checkoutTitle')}
        size="2xl" 
        t={t}
      >
        <form onSubmit={handleCheckout} className="space-y-6" noValidate>
          {formError && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
              {formError}
            </div>
          )}

          {/* Customer Information Section */}
          <div className="p-6 border border-borderLight rounded-lg bg-background shadow-sm">
            <h3 className="font-serif text-2xl font-semibold text-textPrimary mb-5 pb-3 border-b border-borderLight">{t('customerInformation')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <label htmlFor="customerName" className={labelClasses}>{t('fullNameLabel')}*</label>
                <input type="text" id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required className={inputClasses} aria-required="true"/>
              </div>
              <div>
                <label htmlFor="customerEmail" className={labelClasses}>{t('emailLabel')}*</label>
                <input type="email" id="customerEmail" value={customerEmail} onChange={handleCustomerEmailChange} onBlur={checkEmailAvailability} required className={inputClasses} />
                        {emailVerificationStatus === 'verifying' && <p className="text-xs text-textSecondary mt-1">Verificando correo...</p>}
                        {emailVerificationMessage && <p className={`text-xs mt-1 ${emailVerificationMessage === 'Este correo electrónico ya está registrado. Por favor, inicia sesión o utiliza otro.' || emailVerificationMessage === 'Formato de correo inválido.' ? 'text-red-500' : 'text-textSecondary'}`}>{emailVerificationMessage}</p>}
              </div>
              {!currentUser && (
                <>
                  <div className="mt-3">
                    <label htmlFor="password" className={labelClasses}>Password (optional)</label>
                    <input type="password" id="password" value={password} onChange={(e) => {
                    setPassword(e.target.value);
                    if (e.target.value) { // Only validate if there's a password
                      setPasswordErrors(validatePassword(e.target.value));
                    } else {
                      setPasswordErrors([]); // Clear errors if password field is emptied
                    }
                  }} className={inputClasses} />
                  {password && passwordErrors.length > 0 && (
                    <div className="mt-1 text-xs text-red-500">
                      {passwordErrors.map(err => <div key={err}>{err}</div>)}
                    </div>
                  )}
                  {!password && (
                    <div className="mt-1 text-xs text-gray-500">
                      <div>La contraseña debe cumplir con lo siguiente:</div>
                      <ul className="list-disc list-inside ml-2">
                        <li>Al menos 8 caracteres</li>
                        <li>Al menos una letra mayúscula</li>
                        <li>Al menos una letra minúscula</li>
                        <li>Al menos un número</li>
                        <li>Al menos un carácter especial (ej. !@#$%)</li>
                      </ul>
                    </div>
                  )}
                </div>
                <div>
                  <label htmlFor="confirmPassword" className={labelClasses}>Confirmar Contraseña</label>
                  <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClasses} />
                </div>
              </>
              )}
            </div>
          </div>

          {/* Shipping Address Section */}
          <div className="p-6 border border-borderLight rounded-lg bg-background shadow-sm">
            <h3 className="font-serif text-2xl font-semibold text-textPrimary mb-5 pb-3 border-b border-borderLight">{t('shippingAddress')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <label htmlFor="shippingStreet" className={labelClasses}>{t('streetAndNumberLabel')}*</label>
                <input type="text" id="shippingStreet" value={shippingAddress.street} onChange={(e) => handleAddressChange(e, 'street')} required className={inputClasses} aria-required="true"/>
              </div>
              <div>
                <label htmlFor="shippingCity" className={labelClasses}>{t('cityLabel')}*</label>
                <input type="text" id="shippingCity" value={shippingAddress.city} onChange={(e) => handleAddressChange(e, 'city')} required className={inputClasses} aria-required="true"/>
              </div>
              <div>
                <label htmlFor="shippingState" className={labelClasses}>{t('stateLabel')}*</label>
                <input type="text" id="shippingState" value={shippingAddress.state} onChange={(e) => handleAddressChange(e, 'state')} required className={inputClasses} aria-required="true"/>
              </div>
              <div>
                <label htmlFor="shippingZip" className={labelClasses}>{t('zipCodeLabel')}*</label>
                <input type="text" id="shippingZip" value={shippingAddress.zip} onChange={(e) => handleAddressChange(e, 'zip')} required className={inputClasses} aria-required="true"/>
              </div>
              <div>
                <label htmlFor="shippingCountry" className={labelClasses}>{t('countryLabel')}*</label>
                <input type="text" id="shippingCountry" value={shippingAddress.country} onChange={(e) => handleAddressChange(e, 'country')} required className={inputClasses} aria-required="true"/>
              </div>
              <div>
                <label htmlFor="shippingPhone" className={labelClasses}>{t('phoneLabel')} ({t('optional')})</label>
                <input type="tel" id="shippingPhone" value={shippingAddress.phone || ''} onChange={(e) => handleAddressChange(e, 'phone')} className={inputClasses}/>
              </div>
            </div>
          </div>

          {/* Billing Information Section */}
          <div className="p-6 border border-borderLight rounded-lg bg-background shadow-sm">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-borderLight">
                <h3 className="font-serif text-2xl font-semibold text-textPrimary">{t('billingInformation')}</h3>
                <div className="flex items-center">
                    <label htmlFor="billingRequested" className="text-sm text-textSecondary mr-2">{t('requestInvoiceLabel')}</label>
                    <input 
                        type="checkbox" 
                        id="billingRequested" 
                        checked={billingRequested} 
                        onChange={(e) => setBillingRequested(e.target.checked)} 
                        className="h-5 w-5 text-primary rounded border-gray-300 focus:ring-primary"
                    />
                </div>
            </div>

            <div style={{ display: billingRequested ? 'block' : 'none' }} className="space-y-5">
              {billingRequested && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                    <div>
                        <label htmlFor="billingRfc" className={labelClasses}>{t('rfcLabel')}*</label>
                        <input type="text" id="billingRfc" value={billingInfo.rfc} onChange={(e) => handleBillingInfoChange(e, 'rfc')} required={billingRequested} className={inputClasses} aria-required={billingRequested}/>
                    </div>
                    <div>
                        <label htmlFor="billingRazonSocial" className={labelClasses}>{t('razonSocialLabel')}*</label>
                        <input type="text" id="billingRazonSocial" value={billingInfo.razonSocial} onChange={(e) => handleBillingInfoChange(e, 'razonSocial')} required={billingRequested} className={inputClasses} aria-required={billingRequested}/>
                    </div>
                    <div>
                        <label htmlFor="billingCfdiUse" className={labelClasses}>{t('cfdiUseLabel')}*</label>
                        <select id="billingCfdiUse" value={billingInfo.cfdiUse} onChange={(e) => handleBillingInfoChange(e, 'cfdiUse')} required={billingRequested} className={inputClasses} aria-required={billingRequested}>
                          {cfdiOptions.map(code => (
                              <option key={code} value={code}>{code} - {t(`cfdi${code}` as TranslationKey, {defaultValue: code})}</option>
                          ))}
                        </select>
                    </div>
                  </div>
                  
                  <h4 className="font-serif text-xl font-semibold text-textPrimary pt-4 mt-2 border-t border-borderLight">{t('fiscalAddressLabel')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        <div>
                            <label htmlFor="billingFiscalStreet" className={labelClasses}>{t('streetAndNumberLabel')}*</label>
                            <input type="text" id="billingFiscalStreet" value={billingInfo.fiscalAddress.street} onChange={(e) => handleBillingInfoChange(e, 'fiscalAddress.street')} required={billingRequested} className={inputClasses} aria-required={billingRequested}/>
                        </div>
                        <div>
                            <label htmlFor="billingFiscalCity" className={labelClasses}>{t('cityLabel')}*</label>
                            <input type="text" id="billingFiscalCity" value={billingInfo.fiscalAddress.city} onChange={(e) => handleBillingInfoChange(e, 'fiscalAddress.city')} required={billingRequested} className={inputClasses} aria-required={billingRequested}/>
                        </div>
                        <div>
                            <label htmlFor="billingFiscalState" className={labelClasses}>{t('stateLabel')}*</label>
                            <input type="text" id="billingFiscalState" value={billingInfo.fiscalAddress.state} onChange={(e) => handleBillingInfoChange(e, 'fiscalAddress.state')} required={billingRequested} className={inputClasses} aria-required={billingRequested}/>
                        </div>
                        <div>
                            <label htmlFor="billingFiscalZip" className={labelClasses}>{t('zipCodeLabel')}*</label>
                            <input type="text" id="billingFiscalZip" value={billingInfo.fiscalAddress.zip} onChange={(e) => handleBillingInfoChange(e, 'fiscalAddress.zip')} required={billingRequested} className={inputClasses} aria-required={billingRequested}/>
                        </div>
                        <div>
                            <label htmlFor="billingFiscalCountry" className={labelClasses}>{t('countryLabel')}*</label>
                            <input type="text" id="billingFiscalCountry" value={billingInfo.fiscalAddress.country} onChange={(e) => handleBillingInfoChange(e, 'fiscalAddress.country')} required={billingRequested} className={inputClasses} aria-required={billingRequested}/>
                        </div>
                   </div>
                  <div>
                    <label htmlFor="billingEmail" className={labelClasses}>{t('billingEmailLabel')} ({t('optional')})</label>
                    <input type="email" id="billingEmail" value={billingInfo.email || ''} onChange={(e) => handleBillingInfoChange(e, 'email')} className={inputClasses}/>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end pt-4 space-y-3 sm:space-y-0 sm:space-x-3">
            <button type="button" onClick={closeCheckoutModal} className={secondaryButtonClasses + " order-2 sm:order-1"}>
              {t('cancel')}
            </button>
            <button type="submit" className={primaryButtonClasses + " order-1 sm:order-2"}>
              {t('placeOrder')} (${cartTotal.toFixed(2)})
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isOrderConfirmationModalOpen && !!lastOrderConfirmationDetails}
        onClose={closeOrderConfirmationModal}
        title={t('orderConfirmed')}
        size="lg"
        t={t}
      >
        {lastOrderConfirmationDetails && (
          <div className="text-center py-4">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-secondary/20 mb-5">
              <svg className="h-12 w-12 text-secondary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 className="font-serif text-3xl font-semibold text-textPrimary mt-2">{t('thankYouForYourOrder')}</h3>
            <p className="text-textSecondary mt-2 text-sm">{t('orderIdLabel')} <span className="font-medium text-secondary">{lastOrderConfirmationDetails.order.id}</span></p>
            
            <div className="my-8 p-6 bg-background rounded-lg text-left shadow-inner border border-borderLight">
              <h4 className="font-serif font-semibold text-textPrimary mb-3 text-xl">{t('orderSummary')}</h4>
              <ul className="space-y-2">
                {lastOrderConfirmationDetails.order.items.map(item => (
                  <li key={item.productId} className="text-sm text-textSecondary flex justify-between">
                    <span>{item.productName} (x{item.quantity})</span>
                    <span className="font-medium">${(item.priceAtOrder * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <p className="text-right font-bold text-2xl text-secondary mt-5 pt-4 border-t border-borderLight">
                {t('total')} ${lastOrderConfirmationDetails.order.totalAmount.toFixed(2)}
              </p>
            </div>

            <div className="my-8 p-6 bg-secondary/10 border border-secondary/30 rounded-lg text-left shadow">
              <h4 className="font-serif font-semibold text-secondary-dark mb-3 text-xl">{t('paymentInstructions')}</h4>
              <p className="text-sm text-secondary-dark whitespace-pre-wrap leading-relaxed">
                {lastOrderConfirmationDetails.bankInstructions}
              </p>
            </div>

            <button
              onClick={closeOrderConfirmationModal}
              className={`${primaryButtonClasses} mt-8 w-full sm:w-auto`}
            >
              {t('close')}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CustomerView;