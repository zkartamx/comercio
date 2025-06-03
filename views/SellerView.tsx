import React, { useState, useEffect } from 'react';
import { Product, SaleSource, ProductRequest, SaleCreationPayload, TranslationKey, User } from '../types'; 

/**
 * Props for the SellerView component.
 */
export interface SellerViewProps {
  products: Product[]; 
  addSaleRecord: (saleData: SaleCreationPayload) => void;
  addProductRequest: (requestDetails: Pick<ProductRequest, 'productId' | 'quantityRequested' | 'notes'>) => void;
  t: (key: TranslationKey, replacements?: Record<string, string | number>) => string;
  showNotification: (messageKey: TranslationKey, type: 'success' | 'error', replacements?: Record<string, string | number>) => void;
  currentUser: User; 
}

/**
 * SellerView component.
 * Allows authenticated sellers to log direct sales and request product stock.
 */

interface CurrentSaleItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface CurrentRequestItem {
  productId: string; // Keep as string to match selectedRequestProductId
  productName: string;
  quantityRequested: number;
  // Notes will be part of the overall request for now
}



const SellerView: React.FC<SellerViewProps> = ({ products, addSaleRecord, addProductRequest, t, showNotification, currentUser }) => {
  // State for "Log Sale" form - now for adding individual items
  const [selectedSaleProductId, setSelectedSaleProductId] = useState<string>('');
  const [saleQuantity, setSaleQuantity] = useState<number>(1);
  const [saleNotes, setSaleNotes] = useState<string>('');
  const [currentSaleItems, setCurrentSaleItems] = useState<CurrentSaleItem[]>([]);

  // State for "Request Product" form
  const [selectedRequestProductId, setSelectedRequestProductId] = useState<string>('');
  const [requestQuantity, setRequestQuantity] = useState<number>(1);
  const [requestNotes, setRequestNotes] = useState<string>('');
  const [currentRequestItems, setCurrentRequestItems] = useState<CurrentRequestItem[]>([]);
  
  const [activeForm, setActiveForm] = useState<'sale' | 'request'>('sale');
  
  useEffect(() => {
    if (products.length > 0 && products[0] !== undefined) { // Check products[0] exists
      const defaultProductIdAsString = String(products[0].id);

      // For sale product selection
      // If no product is selected OR the selected product ID is no longer in the list
      if (!selectedSaleProductId || !products.some(p => String(p.id) === selectedSaleProductId)) {
        setSelectedSaleProductId(defaultProductIdAsString);
      }

      // For request product selection
      // If no product is selected OR the selected product ID is no longer in the list
      if (!selectedRequestProductId || !products.some(p => String(p.id) === selectedRequestProductId)) {
        setSelectedRequestProductId(defaultProductIdAsString);
      }
    } else {
      // If no products, clear selections
      setSelectedSaleProductId('');
      setSelectedRequestProductId('');
    }
  }, [products]); // Only re-run if products array changes

  const handleAddProductToCurrentSale = () => {
    if (!selectedSaleProductId) {
      showNotification('alertSellerProductSelection' as TranslationKey, 'error'); // TODO: Add translation key 'alertSellerProductSelection', e.g., "Please select a product." 
      return;
    }
    const product = products.find(p => String(p.id) === selectedSaleProductId);
    if (!product || saleQuantity <= 0) {
      showNotification('alertSellerProductQuantity', 'error');
      return;
    }

    const existingItem = currentSaleItems.find(item => item.productId === parseInt(product.id, 10));
    const quantityAlreadyInCart = existingItem ? existingItem.quantity : 0;

    if ((saleQuantity + quantityAlreadyInCart) > product.stock) {
      showNotification('notEnoughStockToSell', 'error', { productName: product.name, stock: product.stock });
      return;
    }

    setCurrentSaleItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.productId === parseInt(product.id, 10));
      if (existingItemIndex > -1) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + saleQuantity
        };
        return updatedItems;
      } else {
        const newItem: CurrentSaleItem = {
          productId: parseInt(product.id, 10),
          productName: product.name,
          quantity: saleQuantity,
          unitPrice: product.price,
        };
        return [...prevItems, newItem];
      }
    });
    setSaleQuantity(1); // Reset quantity for next item addition
    setSelectedSaleProductId(products.length > 0 && products[0] !== undefined ? String(products[0].id) : ''); // Optionally reset product selection
  };

  const handleRemoveItemFromSale = (productIdToRemove: number) => {
    setCurrentSaleItems(prevItems => prevItems.filter(item => item.productId !== productIdToRemove));
  };

  const handleFinalizeSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentSaleItems.length === 0) {
      showNotification('alertSaleNoItems' as TranslationKey, 'error'); // TODO: Add translation key 'alertSaleNoItems', e.g., "Cannot log an empty sale. Please add items." 
      return;
    }

    const finalTotalAmount = currentSaleItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    const newSale: SaleCreationPayload = {
      sellerId: currentUser.id.toString(),
      items: currentSaleItems.map(item => ({ productId: item.productId, quantity: item.quantity, unitPrice: item.unitPrice })), // Ensure unitPrice is included for SaleCreationItem type
      totalAmount: finalTotalAmount,
      source: SaleSource.SELLER,
      notes: saleNotes,
    };
    addSaleRecord(newSale);

    setCurrentSaleItems([]);
    setSelectedSaleProductId(products[0]?.id || '');
    setSaleQuantity(1);
    setSaleNotes('');
    setCurrentSaleItems([]); // Clear items after finalizing
  };

  // --- New handlers for Product Request List ---
  const handleAddProductToCurrentRequest = () => {
    if (!selectedRequestProductId) {
      showNotification('Por favor, seleccione un producto.' as TranslationKey, 'error');
      return;
    }
    const product = products.find(p => String(p.id) === selectedRequestProductId);
    if (!product || requestQuantity <= 0) {
      showNotification('Por favor, ingrese una cantidad válida y asegúrese de que el producto esté seleccionado.' as TranslationKey, 'error');
      return;
    }

    // For requests, we might not need to check stock, as it's a request.
    // We can allow adding the same product multiple times as separate line items if desired,
    // or update quantity if already present. For simplicity, let's add as a new item or update.

    setCurrentRequestItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.productId === selectedRequestProductId);
      if (existingItemIndex > -1) {
        // Option 1: Update quantity of existing item
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantityRequested: updatedItems[existingItemIndex].quantityRequested + requestQuantity
        };
        // showNotification('productQuantityUpdatedInRequest' as TranslationKey, 'success', { productName: product.name }); // TODO: Add translation
        return updatedItems;
        // Option 2: Add as a new line item (simpler if preferred)
        // const newItem: CurrentRequestItem = {
        //   productId: selectedRequestProductId,
        //   productName: product.name,
        //   quantityRequested: requestQuantity,
        // };
        // return [...prevItems, newItem];
      } else {
        const newItem: CurrentRequestItem = {
          productId: selectedRequestProductId,
          productName: product.name,
          quantityRequested: requestQuantity,
        };
        return [...prevItems, newItem];
      }
    });
    setRequestQuantity(1); // Reset quantity for next item addition
    // Optionally reset product selection or keep it: setSelectedRequestProductId(products.length > 0 && products[0] !== undefined ? String(products[0].id) : '');
    showNotification(`Producto "${product.name}" agregado a la solicitud.` as TranslationKey, 'success');
  };

  const handleRemoveItemFromRequest = (productIdToRemove: string) => {
    setCurrentRequestItems(prevItems => prevItems.filter(item => item.productId !== productIdToRemove));
    showNotification('Producto eliminado de la solicitud.' as TranslationKey, 'success');
  };

  const handleRequestProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentRequestItems.length === 0) {
      showNotification('Por favor, agregue al menos un producto a la solicitud.' as TranslationKey, 'error');
      return;
    }

    let allSucceeded = true;
    // Use a traditional for loop to allow await inside
    for (let i = 0; i < currentRequestItems.length; i++) {
      const item = currentRequestItems[i];
      try {
        await addProductRequest({
          productId: item.productId,
          quantityRequested: item.quantityRequested,
          notes: requestNotes, // Global notes for all items in this batch
        });
      } catch (error) {
        allSucceeded = false;
        // Assuming addProductRequest or its caller (e.g., in App.tsx via api service) handles showing error notifications for individual failures.
        console.error(`Failed to request product ${item.productName}:`, error);
        // Optionally, collect all errors and display a summary, or break on first error.
      }
    }

    if (allSucceeded) {
      showNotification('Solicitud enviada con éxito.' as TranslationKey, 'success');
      setCurrentRequestItems([]);
      setRequestNotes('');
      // Reset product selection and quantity for adding new items to a *new* request
      setSelectedRequestProductId(products.length > 0 && products[0] !== undefined ? String(products[0].id) : '');
      setRequestQuantity(1);
    } else {
      showNotification('Algunos productos no pudieron ser solicitados. Por favor, revise la consola o intente de nuevo.' as TranslationKey, 'error');
      // Decide on behavior: clear successfully submitted items from currentRequestItems or leave all for user to retry/adjust.
      // For now, items are not cleared from UI on partial failure to allow user to see what failed.
    }
  };

  // Common Tailwind classes for styling
  const baseInputClasses = "mt-1 block w-full py-3 border border-borderLight rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary text-base transition-colors bg-white";
  const textInputClasses = `${baseInputClasses} px-4 text-textPrimary`;
  // SVG for custom dropdown arrow, URL-encoded
  const customArrowSvg = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="%234b5563"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.27a.75.75 0 01.02-1.06z" clip-rule="evenodd" /></svg>')`;
  const selectClasses = `${baseInputClasses} pl-4 pr-10 appearance-none bg-no-repeat ${customArrowSvg} bg-[right_0.75rem_center] bg-[length:1.25em_1.25em]`;
  
  const labelClasses = "block text-sm font-medium text-textSecondary mb-1";
  const primaryButtonClasses = "w-full px-6 py-3 bg-secondary hover:bg-secondary-dark text-textOnSecondary font-semibold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-secondary-light focus:ring-opacity-75";

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="mb-8 text-center">
        <h2 className="font-serif text-4xl font-bold text-textPrimary">{t('sellerPortalTitle')}</h2>
        <p className="text-textPrimary mt-2 text-lg">{t('sellerWelcome', { sellerName: currentUser.name })}</p>
        <p className="text-textSecondary mt-1 text-md">{t('sellerPortalDescription')}</p>
      </div>

      {/* Tab-like buttons to switch between Log Sale and Request Product forms */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex rounded-lg shadow-md" role="group">
          <button
            type="button"
            onClick={() => setActiveForm('sale')}
            className={`px-8 py-3 text-sm font-medium border border-r-0 transition-colors duration-200
                        ${activeForm === 'sale' ? 'bg-secondary text-textOnSecondary border-secondary' : 'bg-surface text-secondary hover:bg-secondary/10 border-borderLight'}
                        rounded-l-lg`}
            aria-pressed={activeForm === 'sale'}
          >
            {t('logSale')}
          </button>
          <button
            type="button"
            onClick={() => setActiveForm('request')}
            className={`px-8 py-3 text-sm font-medium border transition-colors duration-200
                        ${activeForm === 'request' ? 'bg-secondary text-textOnSecondary border-secondary' : 'bg-surface text-secondary hover:bg-secondary/10 border-borderLight'}
                        rounded-r-lg`}
            aria-pressed={activeForm === 'request'}
          >
            {t('requestProducts')}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto bg-surface p-6 sm:p-8 rounded-xl shadow-xl border border-borderLight">
        {/* Log Sale Form */}
        {activeForm === 'sale' && (
          <form onSubmit={handleFinalizeSale} className="space-y-6">
            <h3 className="font-serif text-2xl font-semibold text-textPrimary mb-6 text-center">{t('logNewSale')}</h3>
            {/* Seller ID is now derived from currentUser, so no selection field */}
            <div>
              <label htmlFor="saleProductId" className={labelClasses}>{t('product')}</label>
              <select 
                id="saleProductId" 
                value={selectedSaleProductId} 
                onChange={(e) => setSelectedSaleProductId(e.target.value)} 
                className={`${selectClasses} ${selectedSaleProductId === '' ? 'text-textSecondary' : 'text-textPrimary'} mb-2`} 
                required 
                disabled={products.length === 0}
                aria-required="true"
              >
                {products.length === 0 ? <option value="">{t('noProductsAvailable')}</option> : <option value="">{t('selectProduct')}</option>}
                {products.map(p => <option key={p.id} value={p.id} className="text-textPrimary">{p.name} - ${p.price.toFixed(2)} ({p.stock} {t('inStock')})</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="saleQuantity" className={labelClasses}>{t('quantitySold')}</label>
              <input type="number" id="saleQuantity" value={saleQuantity} onChange={(e) => { const val = parseInt(e.target.value, 10); setSaleQuantity(isNaN(val) ? 1 : Math.max(1, val)); }} min="1" className={`${textInputClasses} mb-2`} required aria-required="true" />
              <button type="button" onClick={handleAddProductToCurrentSale} className="w-full mb-4 px-6 py-3 border border-secondary text-secondary hover:bg-secondary hover:text-textOnSecondary font-semibold rounded-lg shadow-sm transition-colors">
                {t('addProductToSale' as TranslationKey)} {/* TODO: Add translation key 'addProductToSale', e.g., "Add Product to Sale" */}
              </button>
            </div>
                        {/* Display current sale items */}
            {currentSaleItems.length > 0 && (
              <div className="mt-4 p-4 border border-borderLight rounded-lg bg-backgroundLight">
                <h3 className="text-lg font-semibold text-textPrimary mb-2">{t('currentSaleItemsTitle' as TranslationKey)}</h3> {/* TODO: Add translation key 'currentSaleItemsTitle', e.g., "Current Sale Items" */}
                <ul className="space-y-2 mb-2">
                  {currentSaleItems.map((item) => (
                    <li key={item.productId} className="flex justify-between items-center py-2 border-b border-borderLight">
                      <span>{item.productName} (x{item.quantity}) - ${item.unitPrice.toFixed(2)}</span>
                      <button onClick={() => handleRemoveItemFromSale(item.productId)} className="text-red-500 hover:text-red-700 transition-colors" aria-label={t('removeItemName', { itemName: item.productName }) as string}> {/* TODO: Add translation key 'removeItemName', e.g., "Remove {itemName}" */}
                        X
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="text-right font-semibold text-textPrimary mt-2">
                  {t('totalAmount' as TranslationKey)}: ${currentSaleItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toFixed(2)} {/* TODO: Add translation key 'totalAmount', e.g., "Total" */}
                </div>
              </div>
            )}
            <div>
              <label htmlFor="saleNotes" className={labelClasses}>{t('notesOptional')}</label>
              <textarea id="saleNotes" value={saleNotes} onChange={(e) => setSaleNotes(e.target.value)} rows={3} className={`${textInputClasses} resize-none`}></textarea>
            </div>
            <button type="submit" className={primaryButtonClasses + " mt-4 w-full"} disabled={currentSaleItems.length === 0}>
              {t('finalizeSale' as TranslationKey)} {/* TODO: Add translation key 'finalizeSale', e.g., "Finalize Sale" */}
            </button>
          </form>
        )}

        {/* Request Product Form */}
        {activeForm === 'request' && (
          <form onSubmit={handleRequestProduct} className="space-y-6">
            <h3 className="font-serif text-2xl font-semibold text-textPrimary mb-6 text-center">{t('requestProductStock')}</h3>
            {/* Product Selection and Quantity for current item to add */}
            <div>
              <label htmlFor="requestProductId" className={labelClasses}>{t('product')}</label>
              <select 
                id="requestProductId" 
                value={selectedRequestProductId} 
                onChange={(e) => setSelectedRequestProductId(e.target.value)} 
                className={`${selectClasses} ${selectedRequestProductId === '' ? 'text-textSecondary' : 'text-textPrimary'}`} 
                disabled={products.length === 0}
              >
                {products.length === 0 ? <option value="">{t('noProductsAvailable')}</option> : <option value="">{t('selectProduct')}</option>}
                {products.map(p => <option key={p.id} value={String(p.id)} className="text-textPrimary">{p.name}</option>)} 
              </select>
            </div>
            <div>
              <label htmlFor="requestQuantity" className={labelClasses}>{t('quantity')}</label> {/* TODO: Consider new translation key 'quantity' or reuse 'quantityRequested' if appropriate */}
              <input type="number" id="requestQuantity" value={requestQuantity} onChange={(e) => { const val = parseInt(e.target.value, 10); setRequestQuantity(isNaN(val) ? 1 : Math.max(1, val)); }} min="1" className={textInputClasses} />
            </div>
            <button type="button" onClick={handleAddProductToCurrentRequest} className={primaryButtonClasses + " mt-2 w-full"} disabled={!selectedRequestProductId || requestQuantity <= 0}>
              Solicitar Producto
            </button>

            {/* Display Current Request Items */}
            {currentRequestItems.length > 0 && (
              <div className="mt-6 border-t border-borderLight pt-4">
                <h3 className="text-lg font-semibold text-textPrimary mb-2">{t('currentRequestItemsTitle' as TranslationKey)}</h3> {/* TODO: Add translation key 'currentRequestItemsTitle' */}
                <ul className="space-y-2 mb-2">
                  {currentRequestItems.map((item, index) => (
                    <li key={`${item.productId}-${index}`} className="flex justify-between items-center py-2 border-b border-borderLight">
                      <span>{item.productName} (x{item.quantityRequested})</span>
                      <button onClick={() => handleRemoveItemFromRequest(item.productId)} className="text-red-500 hover:text-red-700 transition-colors" aria-label={t('removeItemFromRequestName' as TranslationKey, { itemName: item.productName }) as string}> {/* TODO: Add translation key 'removeItemFromRequestName' */}
                        X
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Overall Notes for the Request */}
            <div>
              <label htmlFor="requestNotes" className={labelClasses}>{t('reasonNotesOptional')}</label>
              <textarea id="requestNotes" value={requestNotes} onChange={(e) => setRequestNotes(e.target.value)} rows={3} className={`${textInputClasses} resize-none`}></textarea>
            </div>

            {/* Submit Button for the entire request list */}
            <button type="submit" className={primaryButtonClasses + " mt-4 w-full"} disabled={currentRequestItems.length === 0}>
              {t('submitRequest')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SellerView;