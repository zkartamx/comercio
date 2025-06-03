import React, { useState, useEffect } from 'react';
import { User, Order, Address, BillingInfo, TranslationKey, OrderStatus } from '../types';


// Helper to create an empty address
const createEmptyAddress = (): Address => ({ street: '', city: '', state: '', zip: '', country: 'México', phone: '' });
// Helper to create empty billing info
const createEmptyBillingInfo = (): BillingInfo => ({
  rfc: '', razonSocial: '', cfdiUse: 'P01', fiscalAddress: createEmptyAddress(), email: ''
});


interface ProfileViewProps {
  currentUser: User;
  onUpdateProfile: (updatedData: Partial<User> & { currentPassword?: string }) => Promise<void>;
  isLoadingProfileUpdate: boolean;
  customerOrders: Order[];
  isLoadingOrders: boolean;
  t: (key: TranslationKey, replacements?: Record<string, string | number>) => string;
  showNotification: (messageKey: TranslationKey, type: 'success' | 'error', replacements?: Record<string, string | number>) => void;
}

type ProfileSection = 'editProfile' | 'manageAddresses' | 'manageBilling' | 'orderHistory';

const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  onUpdateProfile,
  isLoadingProfileUpdate,
  customerOrders,
  isLoadingOrders,
  t,
  showNotification,
}) => {
  const [activeSection, setActiveSection] = useState<ProfileSection>('editProfile');
  
  // Edit Profile State
  const [displayName, setDisplayName] = useState(currentUser.name);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordFormError, setPasswordFormError] = useState<string | null>(null);

  // Manage Address State (simplified to one address for now)
  const [address, setAddress] = useState<Address>(currentUser.defaultShippingAddress || createEmptyAddress());

  // Manage Billing Info State
  const [billingInfo, setBillingInfo] = useState<BillingInfo>(currentUser.defaultBillingDetails || createEmptyBillingInfo());
  
  useEffect(() => { // Keep form state in sync if currentUser prop changes (e.g., after an update)
    setDisplayName(currentUser.name);
    setAddress(currentUser.defaultShippingAddress || createEmptyAddress());
    setBillingInfo(currentUser.defaultBillingDetails || createEmptyBillingInfo());
  }, [currentUser, t]);


  const handleUpdateDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
        showNotification('fieldRequired' as TranslationKey, 'error', { fieldName: t('displayNameLabel') });
        return;
    }
    await onUpdateProfile({ name: displayName });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFormError(null);
    if (!currentPassword || !newPassword || !confirmNewPassword) {
        setPasswordFormError(t('allFieldsRequired'));
        return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordFormError(t('passwordMismatch'));
      return;
    }
    try {
        // API service should handle currentPassword verification
        await onUpdateProfile({ password: newPassword, currentPassword: currentPassword }); 
        setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword(''); // Clear form
        showNotification('passwordChangeSuccess', 'success');
    } catch (error) { // Error should be thrown by onUpdateProfile/apiService if current pass is wrong
        const errorMsg = error instanceof Error ? error.message : t('errorPasswordChange');
        setPasswordFormError(errorMsg);
        showNotification('errorPasswordChange' as TranslationKey, 'error', { error: errorMsg });
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, field: keyof Address) => {
    setAddress(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.street.trim() || !address.city.trim() || !address.state.trim() || !address.zip.trim() || !address.country.trim()) {
        showNotification('allFieldsRequired' as TranslationKey, 'error');
        return;
    }
    await onUpdateProfile({ defaultShippingAddress: address });
  };
  
  const handleBillingInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, field: keyof BillingInfo | `fiscalAddress.${keyof Address}`) => {
    const { value } = e.target;
    setBillingInfo(prev => {
        if (field.startsWith('fiscalAddress.')) {
            const subField = field.split('.')[1] as keyof Address;
            return { ...prev, fiscalAddress: { ...prev.fiscalAddress, [subField]: value } };
        }
        return { ...prev, [field as keyof BillingInfo]: value };
    });
  };
  
  const handleSaveBillingInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billingInfo.rfc.trim() || !billingInfo.razonSocial.trim() || !billingInfo.cfdiUse.trim() ||
        !billingInfo.fiscalAddress.street.trim() || !billingInfo.fiscalAddress.city.trim() || 
        !billingInfo.fiscalAddress.state.trim() || !billingInfo.fiscalAddress.zip.trim() || 
        !billingInfo.fiscalAddress.country.trim()
    ) {
        showNotification('allFieldsRequired' as TranslationKey, 'error');
        return;
    }
    await onUpdateProfile({ defaultBillingDetails: billingInfo });
  };

  const inputClasses = "mt-1 block w-full px-4 py-3 border border-borderLight rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary sm:text-sm transition-colors bg-white text-textPrimary";
  const labelClasses = "block text-sm font-medium text-textSecondary";
  const primaryButtonClasses = "px-6 py-3 bg-secondary hover:bg-secondary-dark text-textOnSecondary font-semibold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-secondary-light focus:ring-opacity-75 disabled:bg-slate-400 disabled:cursor-not-allowed";
  
  const cfdiOptions = [
    'P01', 'G01', 'G02', 'G03', 'I01', 'I02', 'I03', 'I04', 'I05', 'I06', 'I07', 'I08', 
    'D01', 'D02', 'D03', 'D04', 'D05', 'D06', 'D07', 'D08', 'D09', 'D10'
  ];

  const TabButton: React.FC<{ section: ProfileSection; labelKey: TranslationKey; }> = ({ section, labelKey }) => (
    <button
      onClick={() => setActiveSection(section)}
      className={`px-5 py-3 font-medium rounded-t-lg transition-all duration-200 border-b-2
        ${activeSection === section 
          ? 'bg-surface text-secondary border-secondary shadow-sm' 
          : 'text-textSecondary hover:bg-slate-100 hover:text-textPrimary border-transparent hover:border-slate-300'}`}
      aria-pressed={activeSection === section}
    >
      {t(labelKey)}
    </button>
  );

  const getStatusPillClasses = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case OrderStatus.CONFIRMED: return 'bg-blue-100 text-blue-700 border-blue-300';
      case OrderStatus.SHIPPED: return 'bg-indigo-100 text-indigo-700 border-indigo-300';
      case OrderStatus.DELIVERED: return 'bg-green-100 text-green-700 border-green-300';
      case OrderStatus.CANCELLED: return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };


  return (
    <div className="container mx-auto p-4 sm:p-6">
      <h2 className="font-serif text-3xl sm:text-4xl font-bold text-textPrimary mb-8 text-center">{t('profileTitle')}</h2>
      
      <div className="flex border-b border-borderLight mb-6" role="tablist">
        <TabButton section="editProfile" labelKey="editProfileTab" />
        <TabButton section="manageAddresses" labelKey="manageAddressesTab" />
        <TabButton section="manageBilling" labelKey="manageBillingInfoTab" />
        <TabButton section="orderHistory" labelKey="orderHistoryTab" />
      </div>

      <div className="bg-surface p-6 sm:p-8 rounded-b-lg shadow-lg border border-borderLight border-t-0">
        {activeSection === 'editProfile' && (
          <div className="space-y-8 max-w-lg mx-auto">
            <form onSubmit={handleUpdateDisplayName} className="space-y-4">
              <h3 className="font-serif text-xl font-semibold text-textPrimary">{t('displayNameLabel')}</h3>
              <div>
                <label htmlFor="displayName" className={labelClasses}>{t('displayNameLabel')}</label>
                <input type="text" id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputClasses} required/>
              </div>
              <button type="submit" className={primaryButtonClasses} disabled={isLoadingProfileUpdate}>
                {isLoadingProfileUpdate ? t('saving') : t('updateProfileButton')}
              </button>
            </form>
            <hr className="border-borderLight"/>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <h3 className="font-serif text-xl font-semibold text-textPrimary">{t('changePasswordButton')}</h3>
              {passwordFormError && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm" role="alert">{passwordFormError}</div>}
              <div>
                <label htmlFor="currentPassword" className={labelClasses}>{t('currentPasswordLabel')}*</label>
                <input type="password" id="currentPassword" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClasses} required/>
              </div>
              <div>
                <label htmlFor="newPassword" className={labelClasses}>{t('newPasswordLabel')}*</label>
                <input type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClasses} required/>
              </div>
              <div>
                <label htmlFor="confirmNewPassword" className={labelClasses}>{t('confirmNewPasswordLabel')}*</label>
                <input type="password" id="confirmNewPassword" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className={inputClasses} required/>
              </div>
              <button type="submit" className={primaryButtonClasses} disabled={isLoadingProfileUpdate}>
                {isLoadingProfileUpdate ? t('saving') : t('changePasswordButton')}
              </button>
            </form>
          </div>
        )}

        {activeSection === 'manageAddresses' && (
          <form onSubmit={handleSaveAddress} className="space-y-4 max-w-lg mx-auto">
             <h3 className="font-serif text-xl font-semibold text-textPrimary">{t('shippingAddress')}</h3>
             <div>
                <label htmlFor="addrStreet" className={labelClasses}>{t('streetAddressLabel')}*</label>
                <input type="text" id="addrStreet" value={address.street} onChange={(e) => handleAddressChange(e, 'street')} required className={inputClasses}/>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="addrCity" className={labelClasses}>{t('cityLabel')}*</label>
                  <input type="text" id="addrCity" value={address.city} onChange={(e) => handleAddressChange(e, 'city')} required className={inputClasses}/>
                </div>
                <div>
                  <label htmlFor="addrState" className={labelClasses}>{t('stateLabel')}*</label>
                  <input type="text" id="addrState" value={address.state} onChange={(e) => handleAddressChange(e, 'state')} required className={inputClasses}/>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="addrZip" className={labelClasses}>{t('zipCodeLabel')}*</label>
                  <input type="text" id="addrZip" value={address.zip} onChange={(e) => handleAddressChange(e, 'zip')} required className={inputClasses}/>
                </div>
                <div>
                  <label htmlFor="addrCountry" className={labelClasses}>{t('countryLabel')}*</label>
                  <input type="text" id="addrCountry" value={address.country} onChange={(e) => handleAddressChange(e, 'country')} required className={inputClasses}/>
                </div>
              </div>
              <div>
                <label htmlFor="addrPhone" className={labelClasses}>{t('phoneNumberLabel')} ({t('optional')})</label>
                <input type="tel" id="addrPhone" value={address.phone || ''} onChange={(e) => handleAddressChange(e, 'phone')} className={inputClasses}/>
              </div>
            <button type="submit" className={primaryButtonClasses} disabled={isLoadingProfileUpdate}>
              {isLoadingProfileUpdate ? t('saving') : t('saveChanges')}
            </button>
          </form>
        )}

        {activeSection === 'manageBilling' && (
          <form onSubmit={handleSaveBillingInfo} className="space-y-4 max-w-xl mx-auto">
            <h3 className="font-serif text-xl font-semibold text-textPrimary">{t('billingInformation')}</h3>
             <div>
                <label htmlFor="billRfc" className={labelClasses}>{t('rfcLabel')}*</label>
                <input type="text" id="billRfc" value={billingInfo.rfc} onChange={(e) => handleBillingInfoChange(e, 'rfc')} required className={inputClasses}/>
              </div>
              <div>
                <label htmlFor="billRazonSocial" className={labelClasses}>{t('razonSocialLabel')}*</label>
                <input type="text" id="billRazonSocial" value={billingInfo.razonSocial} onChange={(e) => handleBillingInfoChange(e, 'razonSocial')} required className={inputClasses}/>
              </div>
              <div>
                <label htmlFor="billCfdiUse" className={labelClasses}>{t('cfdiUseLabel')}*</label>
                <select id="billCfdiUse" value={billingInfo.cfdiUse} onChange={(e) => handleBillingInfoChange(e, 'cfdiUse')} required className={inputClasses}>
                    {cfdiOptions.map(code => (
                        <option key={code} value={code}>{code} - {t(`cfdi${code}` as TranslationKey, {defaultValue: code})}</option>
                    ))}
                </select>
              </div>
              <h4 className="font-serif text-lg font-medium text-textPrimary pt-2">{t('fiscalAddressLabel')}</h4>
              <div>
                <label htmlFor="billFiscalStreet" className={labelClasses}>{t('streetAddressLabel')}*</label>
                <input type="text" id="billFiscalStreet" value={billingInfo.fiscalAddress.street} onChange={(e) => handleBillingInfoChange(e, 'fiscalAddress.street')} required className={inputClasses}/>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label htmlFor="billFiscalCity" className={labelClasses}>{t('cityLabel')}*</label><input type="text" id="billFiscalCity" value={billingInfo.fiscalAddress.city} onChange={(e) => handleBillingInfoChange(e, 'fiscalAddress.city')} required className={inputClasses}/></div>
                <div><label htmlFor="billFiscalState" className={labelClasses}>{t('stateLabel')}*</label><input type="text" id="billFiscalState" value={billingInfo.fiscalAddress.state} onChange={(e) => handleBillingInfoChange(e, 'fiscalAddress.state')} required className={inputClasses}/></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label htmlFor="billFiscalZip" className={labelClasses}>{t('zipCodeLabel')}*</label><input type="text" id="billFiscalZip" value={billingInfo.fiscalAddress.zip} onChange={(e) => handleBillingInfoChange(e, 'fiscalAddress.zip')} required className={inputClasses}/></div>
                <div><label htmlFor="billFiscalCountry" className={labelClasses}>{t('countryLabel')}*</label><input type="text" id="billFiscalCountry" value={billingInfo.fiscalAddress.country} onChange={(e) => handleBillingInfoChange(e, 'fiscalAddress.country')} required className={inputClasses}/></div>
              </div>
               <div>
                <label htmlFor="billEmail" className={labelClasses}>{t('billingEmailLabel')} ({t('optional')})</label>
                <input type="email" id="billEmail" value={billingInfo.email || ''} onChange={(e) => handleBillingInfoChange(e, 'email')} className={inputClasses}/>
              </div>
            <button type="submit" className={primaryButtonClasses} disabled={isLoadingProfileUpdate}>
              {isLoadingProfileUpdate ? t('saving') : t('saveChanges')}
            </button>
          </form>
        )}

        {activeSection === 'orderHistory' && (
          <div>
            <h3 className="font-serif text-xl font-semibold text-textPrimary mb-4">{t('orderHistoryTab')}</h3>
            {isLoadingOrders && <p>{t('loadingAdminData')}</p>} {/* Re-use loading text */}
            {!isLoadingOrders && customerOrders.length === 0 && <p className="text-textSecondary">{t('noOrdersFound')}</p>}
            {!isLoadingOrders && customerOrders.length > 0 && (
              <div className="space-y-4">
                {customerOrders.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(order => (
                  <div key={order.id} className="p-4 border border-borderLight rounded-lg bg-white shadow">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                        <div>
                            <p className="text-sm text-textSecondary">{t('orderIdLabel')} <span className="font-medium text-secondary">{order.id}</span></p>
                            <p className="text-sm text-textSecondary">{t('orderDate')}: {new Date(order.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                        <div className="flex items-center mt-2 sm:mt-0">
                             <span className={`px-3 py-1 text-xs font-semibold rounded-full border mr-3 ${getStatusPillClasses(order.status)}`}>
                                {t(order.status.toLowerCase() as TranslationKey, {defaultValue: order.status})}
                            </span>
                            <p className="text-lg font-semibold text-textPrimary">{t('orderTotal')}: ${order.totalAmount.toFixed(2)}</p>
                        </div>
                    </div>
                    <details className="text-sm">
                        <summary className="cursor-pointer text-secondary hover:text-secondary-dark font-medium">{t('viewOrderDetails')}</summary>
                        <div className="mt-2 pt-2 border-t border-borderLight space-y-1">
                            {order.items.map(item => (
                                <p key={item.productId} className="text-textSecondary">{item.productName} (x{item.quantity}) - ${item.priceAtOrder.toFixed(2)} {t('priceEach')}</p>
                            ))}
                            <p className="font-medium mt-1">{t('shippingAddress')}: {order.shippingAddress.street}, {order.shippingAddress.city}</p>
                            {order.billingRequested && order.billingDetails && (
                                <p className="font-medium mt-1">{t('billingInformation')}: RFC {order.billingDetails.rfc}</p>
                            )}
                        </div>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileView;