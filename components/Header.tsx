import React from 'react';
import { View, TranslationKey, User, Role } from '../types';

/**
 * Props for the Header component.
 */
interface HeaderProps {
  /** The current active view of the application. */
  currentView: View;
  /** Callback function to change the current view. */
  onViewChange: (view: View, role?: Role) => void; // Allow passing role for login
  /** The number of items in the shopping cart. */
  cartItemCount: number;
  /** Callback function triggered when the cart icon/button is clicked. */
  onCartClick: () => void;
  /** Translation function. */
  t: (key: TranslationKey, replacements?: Record<string, string | number>) => string;
  /** The currently logged-in user, or null if no user is logged in. */
  currentUser: User | null;
  /** Callback function to handle user logout. */
  onLogout: () => void;
}

/**
 * Header component for the application.
 * Displays the application name, navigation links, cart access, and user actions.
 */
const Header: React.FC<HeaderProps> = ({ 
  currentView, 
  onViewChange, 
  cartItemCount, 
  onCartClick, 
  t,
  currentUser,
  onLogout
}) => {
  const baseNavItems = [
    // Customer view is default, accessible by clicking title or if no specific portal is chosen by logged-out user
    { view: View.SELLER, labelKey: 'sellerPortal' as TranslationKey, requiredRole: Role.SELLER },
    { view: View.ADMIN, labelKey: 'adminPanel' as TranslationKey, requiredRole: Role.ADMIN },
  ];

  // Filter nav items based on whether a user is logged in and their role
  // Or if the item doesn't require a specific role (like a generic "Products" link if we had one)
  const navItems = baseNavItems.filter(item => {
    // Show public links (if any were defined in baseNavItems without a requiredRole)
    if (!item.requiredRole) return true;
    // Show role-specific links only if a user is logged in and has the matching role
    if (currentUser && currentUser.role === item.requiredRole) return true;
    // Otherwise, do not show the item (e.g., if not logged in, or logged in with a different role)
    return false;
  });


  return (
    <header className="bg-primary text-textOnPrimary shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center">
        <h1 
          className="font-serif text-3xl sm:text-4xl font-bold tracking-tight mb-3 sm:mb-0 cursor-pointer" 
          onClick={() => onViewChange(View.CUSTOMER)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onViewChange(View.CUSTOMER)}
        >
          {t('appName')}
        </h1>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <nav className="flex flex-wrap justify-center space-x-1 sm:space-x-2" aria-label={t('appName' as TranslationKey) + " navigation"}>
            {/* Standard Nav Items for Seller/Admin Portals */}
            {navItems.map((item) => (
              <button
                key={item.view}
                onClick={() => onViewChange(item.view, item.requiredRole)} // Pass role if item requires one
                className={`px-3 py-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 ease-in-out transform hover:scale-105
                  ${currentView === item.view && currentUser?.role === item.requiredRole
                    ? 'bg-secondary text-textOnSecondary shadow-md ring-2 ring-secondary-light' 
                    : 'text-textOnPrimary/80 hover:bg-primary-light hover:text-textOnPrimary'
                  }`}
                aria-current={currentView === item.view && currentUser?.role === item.requiredRole ? 'page' : undefined}
              >
                {t(item.labelKey)}
              </button>
            ))}

            {/* Cart button, always shown for Customer view context */}
            {(currentView === View.CUSTOMER || currentView === View.PROFILE || currentUser?.role === Role.CUSTOMER) && (
              <button
                onClick={onCartClick}
                className="relative ml-2 sm:ml-3 px-3 py-2 rounded-md text-xs sm:text-sm font-medium bg-secondary hover:bg-secondary-dark text-textOnSecondary transition-colors shadow hover:shadow-md transform hover:scale-105"
                aria-label={t('cart') + (cartItemCount > 0 ? `, ${cartItemCount} ${t('items' as TranslationKey)}` : '')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 inline-block mr-1" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
                {t('cart')}
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-accent text-primary-dark text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow" aria-hidden="true">
                    {cartItemCount}
                  </span>
                )}
              </button>
            )}
          </nav>

          {/* User Account Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {currentUser ? (
              <>
                <span className="text-sm text-textOnPrimary/90 hidden sm:inline" aria-label={t('helloUser', {displayName: currentUser.name})}>
                  {t('helloUser', {displayName: currentUser.name})}
                </span>
                {currentUser.role === Role.CUSTOMER && (
                  <button
                    onClick={() => onViewChange(View.PROFILE)}
                    className={`px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 ease-in-out transform hover:scale-105
                      ${currentView === View.PROFILE 
                        ? 'bg-secondary text-textOnSecondary shadow-md ring-2 ring-secondary-light' 
                        : 'bg-primary-light hover:bg-secondary text-textOnPrimary hover:text-textOnSecondary'
                      }`}
                  >
                    {t('myAccountButton')}
                  </button>
                )}
                <button
                  onClick={onLogout}
                  className="px-3 py-2 rounded-md text-xs sm:text-sm font-medium bg-primary-light hover:bg-secondary text-textOnPrimary hover:text-textOnSecondary transition-colors shadow-sm hover:shadow-md transform hover:scale-105"
                >
                  {t('logoutButton')}
                </button>
              </>
            ) : (
              <button
                onClick={() => onViewChange(View.LOGIN, Role.CUSTOMER)} // Default to customer login/register flow
                className="px-3 py-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium bg-secondary hover:bg-secondary-dark text-textOnSecondary transition-colors shadow hover:shadow-md transform hover:scale-105"
              >
                {t('loginRegisterButton')}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;