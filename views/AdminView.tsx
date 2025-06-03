import React, { useState } from 'react';
import { Order, SaleRecord, ProductRequest, Product, OrderStatus, RequestStatus, SaleSource, TranslationKey, User, Role, PaymentStatus } from '../types';
import Modal from '../components/Modal';

/**
 * Props for the AdminView component.
 */
interface AdminViewProps {
  orders: Order[];
  sales: SaleRecord[];
  productRequests: ProductRequest[];
  products: Product[];
  allUsers: User[]; // For managing sellers AND seeing customers if needed in future
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateOrderPaymentStatus: (orderId: string, paymentStatus: PaymentStatus) => void; // New prop
  updateRequestStatus: (requestId: string, status: RequestStatus, adminNotes: string) => void;
  onAddProduct: (productData: Omit<Product, 'id'>) => Promise<void>;
  isLoadingAddProduct: boolean;
  onUpdateProduct: (productId: string, productData: Partial<Omit<Product, 'id'>>) => Promise<void>;
  isLoadingUpdateProduct: boolean;
  onDeleteProduct: (productId: string) => Promise<void>;
  isLoadingDeleteProduct: boolean;
  onAddSeller: (sellerData: Omit<User, 'id' | 'role'>) => Promise<void>; // For adding sellers
  isLoadingAddSeller: boolean;
  onDeleteSeller: (sellerId: string) => Promise<void>; // For deleting sellers
  isLoadingDeleteSeller: boolean;
  t: (key: TranslationKey, replacements?: Record<string, string | number>) => string;
  currentUser: User;

}

/**
 * Defines the available sections within the AdminView.
 */
type AdminSection = 'orders' | 'sales' | 'requests' | 'manageProducts' | 'manageSellers';

/**
 * Initial state for the new product form.
 */
const initialNewProductState: Omit<Product, 'id'> = {
  name: '',
  description: '',
  price: 0,
  stock: 0,
  imageUrl: '',
};

/**
 * Initial state for the new seller form.
 */
const initialNewSellerState: Omit<User, 'id' | 'role' | 'defaultShippingAddress' | 'defaultBillingDetails' | 'createdAt' | 'updatedAt' | 'password'> & { password?: string } = {
  username: '',
  name: '', // Changed from displayName
  email: '', // Added email as it's mandatory in User type
  // password will be set by the form, making it optional here if needed or handled by API
};
// Note: 'address' and 'billingInfo' were old names, replaced by defaultShippingAddress/defaultBillingDetails in User type


/**
 * AdminView component.
 * Provides an interface for administrators to manage orders, sales, product requests,
 * products (CRUD), sellers (CRUD), and generate AI-powered sales summaries.
 */
const getRequestStatusSpanish = (status: RequestStatus): string => {
  switch (status) {
    case RequestStatus.PENDING: return 'PENDIENTE';
    case RequestStatus.APPROVED: return 'APROBADO';
    case RequestStatus.REJECTED: return 'RECHAZADO';
    case RequestStatus.PROCESSING: return 'PROCESANDO';
    case RequestStatus.COMPLETED: return 'COMPLETADO';
    case RequestStatus.CANCELLED: return 'CANCELADO';
    default: 
      // Attempt to handle potential lowercase or mixed-case inputs gracefully for display
      const upperStatus = String(status).toUpperCase() as RequestStatus;
      if (upperStatus !== status && Object.values(RequestStatus).includes(upperStatus)) {
         // If a valid uppercase version exists and it's different, recurse once.
         // This handles cases where 'completed' might be passed for display before normalization.
         return getRequestStatusSpanish(upperStatus);
      }
      return String(status); // Fallback to the original string if no match
  }
};

const AdminView: React.FC<AdminViewProps> = ({
  orders,
  sales,
  productRequests,
  products,
  allUsers,
  updateOrderStatus,
  updateOrderPaymentStatus,
  updateRequestStatus,
  onAddProduct,
  isLoadingAddProduct,
  onUpdateProduct,
  isLoadingUpdateProduct,
  onDeleteProduct,
  isLoadingDeleteProduct,
  onAddSeller,
  isLoadingAddSeller,
  onDeleteSeller,
  isLoadingDeleteSeller,
  t,
  currentUser
}) => {
  const [activeSection, setActiveSection] = useState<AdminSection>('orders'); // Default to orders

  const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>(initialNewProductState);
  const [productFormError, setProductFormError] = useState<string>('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProductFormError, setEditProductFormError] = useState<string>('');
  const [editImagePreviewUrl, setEditImagePreviewUrl] = useState<string>('');
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [deletingProductInfo, setDeletingProductInfo] = useState<{ id: string, name: string } | null>(null);
  const [newSellerData, setNewSellerData] = useState<Omit<User, 'id' | 'role' | 'defaultShippingAddress' | 'defaultBillingDetails' | 'createdAt' | 'updatedAt' | 'password'> & { password?: string }>(initialNewSellerState);
  const [sellerFormError, setSellerFormError] = useState<string>('');
  const [isDeleteSellerConfirmModalOpen, setIsDeleteSellerConfirmModalOpen] = useState(false);
  const [deletingSellerInfo, setDeletingSellerInfo] = useState<{ id: string, name: string, username: string } | null>(null);


  const handleNewProductInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' ? parseFloat(value) || 0 : value,
    }));
    if (name === 'imageUrl') {
      setImagePreviewUrl(value);
    }
  };

  const handleAddNewProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductFormError('');
    if (!newProduct.name.trim() || !newProduct.description.trim() || newProduct.price <= 0 || newProduct.stock < 0 || !newProduct.imageUrl.trim()) {
      setProductFormError(t('allFieldsRequired') + ' (Nombre, descripción, precio, stock, URL de imagen).');
      return;
    }
    try {
        new URL(newProduct.imageUrl); 
    } catch (_) {
        setProductFormError(t('fieldRequired') + ' (La URL de la imagen no es válida).');
        return;
    }
    await onAddProduct(newProduct);
    setNewProduct(initialNewProductState);
    setImagePreviewUrl('');
  };

  const openEditModal = (product: Product) => {
    setEditingProduct({...product});
    setEditImagePreviewUrl(product.imageUrl);
    setEditProductFormError('');
    setIsEditModalOpen(true);
  };

  const handleEditProductInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editingProduct) return;
    const { name, value } = e.target;
    setEditingProduct(prev => prev ? ({
      ...prev,
      [name]: name === 'price' || name === 'stock' ? parseFloat(value) || 0 : value,
    }) : null);
    if (name === 'imageUrl') {
      setEditImagePreviewUrl(value);
    }
  };

  const handleEditProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setEditProductFormError('');

    const { id, name, description, price, stock, imageUrl } = editingProduct;
    if (!name.trim() || !description.trim() || price <= 0 || stock < 0 || !imageUrl.trim()) {
      setEditProductFormError(t('allFieldsRequired') + ' (Nombre, descripción, precio, stock, URL de imagen).');
      return;
    }
     try {
        new URL(imageUrl);
    } catch (_) {
        setEditProductFormError(t('fieldRequired') + ' (La URL de la imagen no es válida).');
        return;
    }
    
    const updatedData: Partial<Omit<Product, 'id'>> = { name, description, price, stock, imageUrl };
    
    await onUpdateProduct(id, updatedData);
    setIsEditModalOpen(false);
    setEditingProduct(null);
  };
  
  const openDeleteConfirmModal = (product: Product) => {
    setDeletingProductInfo({ id: product.id, name: product.name });
    setIsDeleteConfirmModalOpen(true);
  };

  const handleConfirmDeleteProduct = async () => {
    if (!deletingProductInfo) return;
    await onDeleteProduct(deletingProductInfo.id);
    setIsDeleteConfirmModalOpen(false);
    setDeletingProductInfo(null);
  };

  const handleNewSellerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewSellerData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddNewSellerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSellerFormError('');
    if (!newSellerData.username.trim() || !newSellerData.password?.trim() || !newSellerData.name.trim() || !newSellerData.email.trim()) {
      setSellerFormError(t('allFieldsRequired') + ' (Nombre de usuario, contraseña, nombre y correo electrónico).');
      return;
    }
    // Ensure password is not undefined before passing
    const sellerDataForApi: Omit<User, 'id' | 'role'> = {
      username: newSellerData.username,
      password: newSellerData.password || '', // Should always be present due to check, but satisfy TS
      name: newSellerData.name, // Changed from displayName
      email: newSellerData.email, // Added email
      // defaultShippingAddress, defaultBillingDetails, etc., are not part of this form's concern for adding a seller
    };
    await onAddSeller(sellerDataForApi);
    setNewSellerData(initialNewSellerState);
  };

  const openDeleteSellerConfirmModal = (seller: User) => {
    setDeletingSellerInfo({ id: String(seller.id), name: seller.name, username: seller.username });
    setIsDeleteSellerConfirmModalOpen(true);
  };

  const handleConfirmDeleteSeller = async () => {
    if (!deletingSellerInfo) return;
    await onDeleteSeller(deletingSellerInfo.id);
    setIsDeleteSellerConfirmModalOpen(false);
    setDeletingSellerInfo(null);
  };


  const getStatusPillClasses = (status: OrderStatus | RequestStatus | PaymentStatus) => {
  switch (status) {
    // Order & Request Statuses
    case OrderStatus.PENDING:
    case RequestStatus.PENDING:
      return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    case OrderStatus.CONFIRMED:
    case RequestStatus.APPROVED:
      return 'bg-blue-100 text-blue-700 border-blue-300';
    case OrderStatus.SHIPPED: // Mantener para órdenes
    case RequestStatus.PROCESSING: // Añadir para solicitudes
      return 'bg-indigo-100 text-indigo-700 border-indigo-300';
    case OrderStatus.DELIVERED:
    case RequestStatus.COMPLETED:
      return 'bg-green-100 text-green-700 border-green-300';
    case OrderStatus.CANCELLED: // Agrupar todos los cancelados/rechazados
    case RequestStatus.REJECTED:
    case RequestStatus.CANCELLED: // Añadir explícitamente
      return 'bg-red-100 text-red-700 border-red-300';
    
    // Payment Statuses
    case PaymentStatus.UNPAID:
      return 'bg-orange-100 text-orange-700 border-orange-300';
    case PaymentStatus.PAID:
      return 'bg-green-100 text-green-700 border-green-300';
    case PaymentStatus.REFUNDED:
      return 'bg-slate-100 text-slate-700 border-slate-300';

    default:
      return 'bg-slate-100 text-slate-700 border-slate-300';
  }
};
  
  const cardBaseClasses = "p-5 bg-surface rounded-xl shadow-lg border border-borderLight";
  const selectClasses = "p-2 border border-borderLight rounded-lg text-sm focus:ring-2 focus:ring-secondary focus:border-secondary text-textPrimary bg-white";
  const inputClasses = "mt-1 block w-full px-3 py-2 border border-borderLight rounded-md shadow-sm focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm bg-white text-textPrimary placeholder-textSecondary";
  const labelClasses = "block text-sm font-medium text-textSecondary";
  const primaryButtonClasses = "px-6 py-3 bg-secondary hover:bg-secondary-dark text-textOnSecondary font-semibold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-secondary-light focus:ring-opacity-75 disabled:bg-slate-400 disabled:shadow-none disabled:scale-100 disabled:cursor-not-allowed";
  const secondaryButtonClasses = "px-4 py-2 text-sm font-medium text-textPrimary bg-slate-100 hover:bg-slate-200 rounded-lg border border-borderLight shadow-sm hover:shadow-md transition-colors disabled:bg-slate-300";
  const dangerButtonClasses = "px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm hover:shadow-md transition-colors disabled:bg-red-400 disabled:cursor-not-allowed";

  const renderOrders = () => (
    <div className="space-y-6">
      {orders.length === 0 && <p className="text-textSecondary text-center py-5">{t('noCustomerOrders')}</p>}
      {orders.map(order => (
        <div key={order.id} className={cardBaseClasses}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h4 className="font-serif font-semibold text-xl text-secondary">{t('orderIdLabel')} {order.id}</h4>
              <p className="text-sm text-textSecondary mt-1">{t('customerLabel')} <span className="font-medium text-textPrimary">{order.customerName} ({order.customerEmail})</span> {order.userId ? `(ID Usuario: ${order.userId})` : '(Invitado)'}</p>
              <p className="text-sm text-textSecondary">{t('dateLabel')} {new Date(order.createdAt).toLocaleString('es-MX')}</p>
              <p className="text-sm text-textSecondary">{t('total')} <span className="font-semibold text-lg text-textPrimary">${order.totalAmount.toFixed(2)}</span></p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mt-3 sm:mt-0">
                {/* Order Status */}
                <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusPillClasses(order.status)}`}>
                        {t(order.status.toLowerCase() as TranslationKey, {defaultValue: order.status})}
                    </span>
                    <select 
                        value={order.status} 
                        onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                        className={selectClasses}
                        aria-label={t('status')}
                    >
                        {Object.values(OrderStatus).map(statusVal => (
                            <option key={statusVal} value={statusVal}>{t(statusVal.toLowerCase() as TranslationKey, {defaultValue: statusVal})}</option>
                        ))}
                    </select>
                </div>
                 {/* Payment Status */}
                <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusPillClasses(order.paymentStatus)}`}>
                        {t(order.paymentStatus.toLowerCase() as TranslationKey, {defaultValue: order.paymentStatus})}
                    </span>
                    <select 
                        value={order.paymentStatus} 
                        onChange={(e) => updateOrderPaymentStatus(order.id, e.target.value as PaymentStatus)}
                        className={selectClasses}
                        aria-label={t('paymentStatusLabel')}
                    >
                        {Object.values(PaymentStatus).map(statusVal => (
                            <option key={statusVal} value={statusVal}>{t(statusVal.toLowerCase() as TranslationKey, {defaultValue: statusVal})}</option>
                        ))}
                    </select>
                </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-borderLight">
            <h5 className="text-sm font-medium text-textSecondary mb-1">{t('items')}</h5>
            <ul className="list-disc list-inside pl-4 text-sm text-textSecondary space-y-1">
              {order.items.map(item => (
                <li key={item.productId} className="flex justify-between items-center py-1">
                    <span>
                      <span className="text-textPrimary font-medium">{item.productName || 'Producto Desconocido'}</span>
                      <span className="text-xs text-textSecondary ml-1">(Precio Unit.: ${item.priceAtOrder.toFixed(2)})</span>
                    </span>
                    <span className="text-textPrimary font-semibold">
                      Cant.: {item.quantity}
                    </span>
                  </li>
              ))}
            </ul>
             <div className="mt-2">
                <h5 className="text-sm font-medium text-textSecondary mb-1">{t('shippingAddress')}:</h5>
                <p className="text-xs text-textPrimary">{order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state}, {order.shippingAddress.zip}, {order.shippingAddress.country}</p>
            </div>
            {order.billingRequested && order.billingDetails && (
                 <div className="mt-2">
                    <h5 className="text-sm font-medium text-textSecondary mb-1">{t('billingInformation')}:</h5>
                    <p className="text-xs text-textPrimary">RFC: {order.billingDetails.rfc}, Razón Social: {order.billingDetails.razonSocial}, Uso CFDI: {order.billingDetails.cfdiUse}</p>
                    <p className="text-xs text-textPrimary">Dirección Fiscal: {order.billingDetails.fiscalAddress.street}, {order.billingDetails.fiscalAddress.city}, {order.billingDetails.fiscalAddress.state}, {order.billingDetails.fiscalAddress.zip}, {order.billingDetails.fiscalAddress.country}</p>
                </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderSales = () => {
    console.log('AdminView sales data:', JSON.stringify(sales, null, 2));
    return (
      <div className="space-y-6">
        {sales.length === 0 && <p className="text-textSecondary text-center py-5">{t('noSalesRecords')}</p>}
        {sales.map(sale => (
          <div key={sale.id} className={cardBaseClasses}>
            <h4 className="font-serif font-semibold text-xl text-secondary">{t('saleIdLabel')} {sale.id}</h4>
            <p className="text-sm text-textSecondary mt-1">{t('dateLabel')} {new Date(sale.saleDate).toLocaleString('es-MX')}</p>
            <p className="text-sm text-textSecondary">{t('total')} <span className="font-semibold text-lg text-textPrimary">${sale.totalAmount.toFixed(2)}</span></p>
            <p className="text-sm text-textSecondary">{t('sourceLabel')} <span className="text-textPrimary">{sale.source ? t(sale.source.toLowerCase().replace(/\s+/g, '') as TranslationKey, {defaultValue: sale.source}) : 'Fuente Desconocida'}</span>{sale.source === SaleSource.SELLER && sale.sellerId ? ` (${t('sellerIdLabel')}: ${sale.sellerId})` : ''}{sale.source === SaleSource.ONLINE && sale.orderId ? ` (${t('orderIdLabel')}: ${sale.orderId})`: ''}</p>
            {sale.notes && <p className="text-sm text-textSecondary italic mt-1">{t('notesOptional')}: <span className="text-textPrimary">{sale.notes}</span></p>}
            <div className="mt-3 pt-3 border-t border-borderLight">
              <h5 className="text-sm font-medium text-textSecondary">{t('itemsSold')}</h5>
              <ul className="list-disc list-inside pl-4 text-sm text-textSecondary space-y-1 mt-1">
                {sale.items.map(item => (
                  <li key={item.productId} className="flex justify-between items-center py-1">
                    <span>
                      <span className="text-textPrimary font-medium">{item.product?.name || 'Producto Desconocido'}</span>
                      <span className="text-xs text-textSecondary ml-1">(Precio Unit.: ${item.unitPrice.toFixed(2)})</span>
                    </span>
                    <span className="text-textPrimary font-semibold">
                      Cant.: {item.quantity}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const renderProductRequests = () => {
    console.log('Product requests data in AdminView:', productRequests);
    if (!productRequests || productRequests.length === 0) {
      return <p className="text-textSecondary text-center py-5">{t('noProductRequests')}</p>;
    }
    return (
      <div className="space-y-6">
        {productRequests.map((req) => {
          // Ensure req.status is treated as a string, default to PENDING if null/undefined, then uppercase.
          const incomingStatusUpper = String(req.status ?? RequestStatus.PENDING).toUpperCase();
          let normalizedStatus: RequestStatus;

          const foundEnumValue = (Object.values(RequestStatus) as RequestStatus[]).find(
            value => value.toUpperCase() === incomingStatusUpper
          );

          if (foundEnumValue) {
            normalizedStatus = foundEnumValue;
          } else {
            normalizedStatus = RequestStatus.PENDING; // Default
            console.warn(`AdminView: Invalid or unhandled status '${req.status}' (processed as '${incomingStatusUpper}') for request ID ${req.id}. Defaulting to PENDING for display logic.`);
          }
          return (
            <div key={req.id} className={cardBaseClasses}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                  <h3 className="text-lg font-semibold text-primary">ID de Solicitud: {req.id}</h3>
                  <p className="text-sm text-textSecondary mt-1">ID Vendedor: <span className="text-textPrimary">{req.requestedBy?.id || 'ID no disponible'}</span></p>
                  <p className="text-sm text-textSecondary">Nombre Vendedor: <span className="text-textPrimary">{req.requestedBy?.name || 'Nombre no disponible'}</span></p>
                  <p className="text-sm text-textSecondary">{t('product')}: <span className="text-textPrimary">{req.product?.name || 'Producto Desconocido'}</span></p>
                  <p className="text-sm text-textSecondary">{t('quantity')}: <span className="font-semibold text-textPrimary">{req.quantityRequested}</span></p>
                  <p className="text-sm text-textSecondary">{t('dateLabel')}: {
                    req.createdAt && !isNaN(new Date(req.createdAt).getTime())
                      ? new Date(req.createdAt).toLocaleString('es-MX')
                      : (req.createdAt ? 'Fecha inválida' : 'Fecha no disponible')
                  }</p>
                  {req.notes && <p className="text-sm text-textSecondary italic mt-1">{t('notesOptional')}: <span className="text-textPrimary">{req.notes}</span></p>}
                </div>
                <div className="flex items-center space-x-3 mt-3 sm:mt-0">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusPillClasses(normalizedStatus)}`}>
                    {getRequestStatusSpanish(normalizedStatus)}
                  </span>
                  <select 
                    value={normalizedStatus}
                    onChange={(e) => updateRequestStatus(req.id, e.target.value as RequestStatus, "")} 
                    disabled={normalizedStatus === RequestStatus.COMPLETED || normalizedStatus === RequestStatus.CANCELLED}
                    className="form-select block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
                  >
                    {Object.values(RequestStatus).map(statusValue => (
                      <option key={statusValue} value={statusValue}>
                        {getRequestStatusSpanish(statusValue)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderManageProductsSection = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className={`${cardBaseClasses} p-6 lg:col-span-1`}>
        <h3 className="font-serif text-2xl font-semibold text-textPrimary mb-6">{t('addNewProductTitle')}</h3>
        <form onSubmit={handleAddNewProductSubmit} className="space-y-4">
          {productFormError && (
            <div role="alert" className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
              {productFormError}
            </div>
          )}
          <div>
            <label htmlFor="name" className={labelClasses}>{t('productNameLabel')}*</label>
            <input type="text" name="name" id="name" value={newProduct.name} onChange={handleNewProductInputChange} className={inputClasses} required />
          </div>
          <div>
            <label htmlFor="description" className={labelClasses}>{t('productDescriptionLabel')}*</label>
            <textarea name="description" id="description" value={newProduct.description} onChange={handleNewProductInputChange} rows={3} className={`${inputClasses} resize-none`} required />
          </div>
          <div>
            <label htmlFor="price" className={labelClasses}>{t('productPriceLabel')}*</label>
            <input type="number" name="price" id="price" value={newProduct.price} onChange={handleNewProductInputChange} className={inputClasses} step="0.01" min="0.01" required />
          </div>
          <div>
            <label htmlFor="stock" className={labelClasses}>{t('productStockLabel')}*</label>
            <input type="number" name="stock" id="stock" value={newProduct.stock} onChange={handleNewProductInputChange} className={inputClasses} step="1" min="0" required />
          </div>
          <div>
            <label htmlFor="imageUrl" className={labelClasses}>{t('productImageUrlLabel')}*</label>
            <input type="url" name="imageUrl" id="imageUrl" value={newProduct.imageUrl} onChange={handleNewProductInputChange} className={inputClasses} required placeholder="https://example.com/image.jpg" />
          </div>
          {imagePreviewUrl && (
            <div className="mt-3">
              <p className="text-xs text-textSecondary mb-1">{t('productImagePreviewAlt')}:</p>
              <img 
                src={imagePreviewUrl} 
                alt={t('productImagePreviewAlt')} 
                className="w-full h-40 object-contain rounded border border-borderLight bg-slate-50" 
                onError={(e) => (e.currentTarget.style.display = 'none')}
                onLoad={(e) => (e.currentTarget.style.display = 'block')}
              />
            </div>
          )}
          <button type="submit" className={`${primaryButtonClasses} w-full mt-6`} disabled={isLoadingAddProduct}>
            {isLoadingAddProduct ? t('generating') : t('addProductButton')}
          </button>
        </form>
      </div>
      <div className={`${cardBaseClasses} p-6 lg:col-span-2`}>
        <h3 className="font-serif text-2xl font-semibold text-textPrimary mb-6">{t('existingProductsTitle')}</h3>
        {products.length === 0 ? (
          <p className="text-textSecondary text-center py-5">{t('noProductsInSystem')}</p>
        ) : (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {products.map(product => (
              <div key={product.id} className="flex flex-col sm:flex-row items-start p-4 bg-white rounded-lg shadow-sm border border-borderLight hover:shadow-md transition-shadow">
                <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-md border border-borderLight mr-0 sm:mr-4 mb-3 sm:mb-0 flex-shrink-0"
                    onError={(e) => (e.currentTarget.src = 'https://picsum.photos/100/100?grayscale&blur=1')}
                />
                <div className="flex-grow">
                  <h4 className="font-serif font-semibold text-lg text-secondary">{product.name}</h4>
                  <p className="text-xs text-textSecondary mb-1 max-h-12 overflow-hidden text-ellipsis leading-tight">{product.description}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm my-2">
                    <p className="text-textPrimary">{t('price')}: <span className="font-medium">${product.price.toFixed(2)}</span></p>
                    <p className="text-textPrimary">{t('stock')}: <span className="font-medium">{product.stock} {t('units')}</span></p>
                  </div>
                   <div className="mt-2 sm:mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => openEditModal(product)}
                        className={`${secondaryButtonClasses} text-xs py-1 px-3`}
                        aria-label={t('editProductButton' as TranslationKey) + ' ' + product.name}
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1 inline-block">
                           <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                         </svg>
                        {t('editProductButton' as TranslationKey)}
                      </button>
                      <button
                        onClick={() => openDeleteConfirmModal(product)}
                        className={`${dangerButtonClasses} text-xs py-1 px-3`}
                        aria-label={t('deleteProductButton' as TranslationKey) + ' ' + product.name}
                        disabled={isLoadingDeleteProduct && deletingProductInfo?.id === product.id}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1 inline-block">
                           <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c.342.052.682.107 1.022.166m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                         </svg>
                        {isLoadingDeleteProduct && deletingProductInfo?.id === product.id ? t('generating') : t('deleteProductButton' as TranslationKey)}
                      </button>
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isEditModalOpen && !!editingProduct} onClose={() => setIsEditModalOpen(false)} title={t('editingProductTitle' as TranslationKey)} size="lg" t={t}>
        {editingProduct && (
          <form onSubmit={handleEditProductSubmit} className="space-y-5">
            {editProductFormError && (
              <div role="alert" className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
                {editProductFormError}
              </div>
            )}
            <div>
              <label htmlFor="editProductName" className={labelClasses}>{t('productNameLabel')}*</label>
              <input type="text" name="name" id="editProductName" value={editingProduct.name} onChange={handleEditProductInputChange} className={inputClasses} required />
            </div>
            <div>
              <label htmlFor="editProductDescription" className={labelClasses}>{t('productDescriptionLabel')}*</label>
              <textarea name="description" id="editProductDescription" value={editingProduct.description} onChange={handleEditProductInputChange} rows={4} className={`${inputClasses} resize-none`} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="editProductPrice" className={labelClasses}>{t('productPriceLabel')}*</label>
                <input type="number" name="price" id="editProductPrice" value={editingProduct.price} onChange={handleEditProductInputChange} className={inputClasses} step="0.01" min="0.01" required />
              </div>
              <div>
                <label htmlFor="editProductStock" className={labelClasses}>{t('productStockLabel')}*</label>
                <input type="number" name="stock" id="editProductStock" value={editingProduct.stock} onChange={handleEditProductInputChange} className={inputClasses} step="1" min="0" required />
              </div>
            </div>
            <div>
              <label htmlFor="editProductImageUrl" className={labelClasses}>{t('productImageUrlLabel')}*</label>
              <input type="url" name="imageUrl" id="editProductImageUrl" value={editingProduct.imageUrl} onChange={handleEditProductInputChange} className={inputClasses} required placeholder="https://example.com/image.jpg" />
            </div>
            {editImagePreviewUrl && (
              <div className="mt-3">
                <p className="text-xs text-textSecondary mb-1">{t('productImagePreviewAlt')}:</p>
                <img 
                  src={editImagePreviewUrl} 
                  alt={t('productImagePreviewAlt')} 
                  className="w-full h-48 object-contain rounded border border-borderLight bg-slate-50" 
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  onLoad={(e) => { e.currentTarget.style.display = 'block'; }}
                />
              </div>
            )}
            <div className="pt-4 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className={secondaryButtonClasses + " order-2 sm:order-1"}>
                {t('cancel')}
              </button>
              <button type="submit" className={`${primaryButtonClasses} order-1 sm:order-2`} disabled={isLoadingUpdateProduct}>
                {isLoadingUpdateProduct ? t('generating') : t('saveChanges')}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={isDeleteConfirmModalOpen && !!deletingProductInfo} onClose={() => setIsDeleteConfirmModalOpen(false)} title={t('confirmDeleteProductTitle' as TranslationKey)} size="md" t={t}>
          {deletingProductInfo && (
              <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                      <svg className="h-10 w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                      </svg>
                  </div>
                  <p className="text-lg text-textPrimary mb-4">
                      {t('confirmDeleteProductMessage' as TranslationKey, { productName: deletingProductInfo.name })}
                  </p>
                  <div className="flex justify-center space-x-4 mt-8">
                      <button
                          onClick={() => setIsDeleteConfirmModalOpen(false)}
                          className={secondaryButtonClasses}
                          disabled={isLoadingDeleteProduct}
                      >
                          {t('cancel')}
                      </button>
                      <button
                          onClick={handleConfirmDeleteProduct}
                          className={dangerButtonClasses}
                          disabled={isLoadingDeleteProduct}
                      >
                          {isLoadingDeleteProduct ? t('generating') : t('confirmButton' as TranslationKey)}
                      </button>
                  </div>
              </div>
          )}
      </Modal>
    </div>
  );

  const renderManageSellersSection = () => {
    const sellers = allUsers.filter(user => user.role === Role.SELLER);
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className={`${cardBaseClasses} p-6 lg:col-span-1`}>
          <h3 className="font-serif text-2xl font-semibold text-textPrimary mb-6">{t('addSellerTitle')}</h3>
          <form onSubmit={handleAddNewSellerSubmit} className="space-y-4">
            {sellerFormError && (
              <div role="alert" className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
                {sellerFormError}
              </div>
            )}
            <div>
              <label htmlFor="sellerUsername" className={labelClasses}>{t('sellerUsernameLabel')}*</label>
              <input type="text" name="username" id="sellerUsername" value={newSellerData.username} onChange={handleNewSellerInputChange} className={inputClasses} required />
            </div>
            <div>
              <label htmlFor="sellerPassword" className={labelClasses}>{t('sellerPasswordLabel')}*</label>
              <input type="password" name="password" id="sellerPassword" value={newSellerData.password || ''} onChange={handleNewSellerInputChange} className={inputClasses} required />
            </div>
            <div>
              <label htmlFor="sellerName" className={labelClasses}>{t('sellerNameLabel', { defaultValue: 'Nombre del Vendedor*' })}</label>
              <input type="text" name="name" id="sellerName" value={newSellerData.name} onChange={handleNewSellerInputChange} className={inputClasses} required />
            </div>
            <div>
              <label htmlFor="sellerEmail" className={labelClasses}>{t('sellerEmailLabel', { defaultValue: 'Correo Electrónico del Vendedor*' })}</label>
              <input type="email" name="email" id="sellerEmail" value={newSellerData.email} onChange={handleNewSellerInputChange} className={inputClasses} required />
            </div>
            <button type="submit" className={`${primaryButtonClasses} w-full mt-6`} disabled={isLoadingAddSeller}>
              {isLoadingAddSeller ? t('generating') : t('addSellerButton')}
            </button>
          </form>
        </div>

        <div className={`${cardBaseClasses} p-6 lg:col-span-2`}>
          <h3 className="font-serif text-2xl font-semibold text-textPrimary mb-6">{t('existingSellersTitle')}</h3>
          {sellers.length === 0 ? (
            <p className="text-textSecondary text-center py-5">{t('noSellersInSystem')}</p>
          ) : (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
              {sellers.map(seller => (
                <div key={seller.id} className="flex justify-between items-center p-4 bg-white rounded-lg shadow-sm border border-borderLight">
                  <div>
                    <p className="font-medium text-textPrimary">{seller.name}</p>
                    <p className="text-sm text-textSecondary">@{seller.username}</p>
                    <p className="text-sm text-textSecondary">{seller.email}</p>
                  </div>
                  <button
                    onClick={() => openDeleteSellerConfirmModal(seller)}
                    className={`${dangerButtonClasses} text-xs py-1 px-3`}
                    aria-label={t('deleteButton' as TranslationKey) + ' ' + seller.name} 
                    disabled={isLoadingDeleteSeller && deletingSellerInfo?.id === String(seller.id)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1 inline-block">
                       <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c.342.052.682.107 1.022.166m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                     </svg>
                    {isLoadingDeleteSeller && deletingSellerInfo?.id === String(seller.id) ? t('generating') : t('deleteButton' as TranslationKey)}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Modal isOpen={isDeleteSellerConfirmModalOpen && !!deletingSellerInfo} onClose={() => setIsDeleteSellerConfirmModalOpen(false)} title={t('confirmDeleteSellerTitle')} size="md" t={t}>
          {deletingSellerInfo && (
              <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                      <svg className="h-10 w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                      </svg>
                  </div>
                  <p className="text-lg text-textPrimary mb-4">
                      {t('confirmDeleteSellerMessage', { sellerName: deletingSellerInfo.name, sellerUsername: deletingSellerInfo.username })}
                  </p>
                  <div className="flex justify-center space-x-4 mt-8">
                      <button
                          onClick={() => setIsDeleteSellerConfirmModalOpen(false)}
                          className={secondaryButtonClasses}
                          disabled={isLoadingDeleteSeller}
                      >
                          {t('cancel')}
                      </button>
                      <button
                          onClick={handleConfirmDeleteSeller}
                          className={dangerButtonClasses}
                          disabled={isLoadingDeleteSeller}
                      >
                          {isLoadingDeleteSeller ? t('generating') : t('confirmButton')}
                      </button>
                  </div>
              </div>
          )}
        </Modal>
      </div>
    );
  };


  const TabButton: React.FC<{ section: AdminSection; labelKey: TranslationKey; }> = ({ section, labelKey }) => (
    <button
      onClick={() => setActiveSection(section)}
      className={`px-5 py-3 font-medium rounded-lg transition-all duration-200 transform hover:scale-105
        ${activeSection === section ? 'bg-secondary text-textOnSecondary shadow-lg' : 'text-textSecondary hover:bg-gray-100 hover:text-textPrimary bg-surface shadow-sm'}`}
      aria-pressed={activeSection === section}
    >
      {t(labelKey)}
    </button>
  );

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="text-center mb-10">
        <h2 className="font-serif text-4xl font-bold text-textPrimary">{t('adminDashboard')}</h2>
        <p className="text-textPrimary mt-2 text-lg">{t('adminWelcome', { adminName: currentUser.name })}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-10 pb-6 border-b border-borderLight" role="tablist" aria-orientation="horizontal">
        <TabButton section="orders" labelKey="customerOrders" />
        <TabButton section="sales" labelKey="sellerSales" />
        <TabButton section="requests" labelKey="productRequests" />
        <TabButton section="manageProducts" labelKey="manageProductsTab" />
        <TabButton section="manageSellers" labelKey="manageSellersTab" />
      </div>

      <div role="tabpanel" aria-labelledby={`tab-${activeSection}`}>
        {activeSection === 'orders' && renderOrders()}
        {activeSection === 'sales' && renderSales()}
        {activeSection === 'requests' && renderProductRequests()}
        {activeSection === 'manageProducts' && renderManageProductsSection()}
        {activeSection === 'manageSellers' && renderManageSellersSection()}
      </div>
    </div>
  );
};

export default AdminView;