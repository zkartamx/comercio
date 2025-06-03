import React, { useState, useEffect } from 'react';
import { Role, TranslationKey, View } from '../types';

/**
 * Props for the LoginView component.
 */
interface LoginViewProps {
  onLoginAttempt: (username: string, password_input: string, role: Role) => Promise<string | null>;
  intendedRole: Role | null; // Can be null if user clicks generic "Login/Register"
  loginError: string | null;
  t: (key: TranslationKey, replacements?: Record<string, string | number>) => string;
  onViewChange: (view: View, role?: Role) => void; // To navigate to RegisterView
}

/**
 * LoginView component.
 * Provides a form for users to log in.
 */
const LoginView: React.FC<LoginViewProps> = ({ onLoginAttempt, intendedRole, loginError, t, onViewChange }) => {
  // For Admin/Seller, this is username; for Customer, this is email
  const [credentialInput, setCredentialInput] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>(Role.CUSTOMER); // Default to customer, or use intendedRole
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If a specific role is intended (e.g., clicking "Seller Portal"), set it.
    // Otherwise, default to Customer or allow selection.
    if (intendedRole) {
      setSelectedRole(intendedRole);
    }
  }, [intendedRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Pass credentialInput (username for admin/seller, email for customer)
    await onLoginAttempt(credentialInput, password, selectedRole);
    setIsLoading(false);
  };
  
  const isCustomerLogin = selectedRole === Role.CUSTOMER;
  const titleKey = 
    selectedRole === Role.ADMIN ? 'loginTitleAdmin' :
    selectedRole === Role.SELLER ? 'loginTitleSeller' :
    'loginTitleCustomer';
  
  const promptKey = 
    selectedRole === Role.ADMIN ? 'loginPromptAdmin' :
    selectedRole === Role.SELLER ? 'loginPromptSeller' :
    'loginPromptCustomer';

  const inputClasses = "mt-1 block w-full px-4 py-3 border border-borderLight rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary sm:text-base transition-colors bg-white text-textPrimary";
  const labelClasses = "block text-sm font-medium text-textSecondary";
  const primaryButtonClasses = "w-full px-6 py-3 bg-secondary hover:bg-secondary-dark text-textOnSecondary font-semibold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-secondary-light focus:ring-opacity-75 disabled:bg-slate-400 disabled:cursor-not-allowed";
  const linkClasses = "font-medium text-secondary hover:text-secondary-dark transition-colors";

  return (
    <div className="container mx-auto p-4 sm:p-6 flex justify-center items-center min-h-[calc(100vh-200px)]">
      <div className="w-full max-w-md bg-surface p-8 sm:p-10 rounded-xl shadow-2xl border border-borderLight">
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-textPrimary mb-3 text-center">
          {t(titleKey)}
        </h2>
        <p className="text-textSecondary mb-6 text-center text-sm sm:text-base">{t(promptKey)}</p>
        
        {/* Always show role selector so user can pick Admin, Seller, or Customer */}
        <div className="mb-6">
            <label htmlFor="roleSelect" className={labelClasses}>{t('loginAsRole')}</label>
            <select 
                id="roleSelect" 
                value={selectedRole} 
                onChange={(e) => setSelectedRole(e.target.value as Role)}
                className={`${inputClasses} appearance-none`}
            >
                <option value={Role.CUSTOMER}>{t('loginTitleCustomer')}</option>
                <option value={Role.SELLER}>{t('loginTitleSeller')}</option>
                <option value={Role.ADMIN}>{t('loginTitleAdmin')}</option>
            </select>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {loginError && (
            <div role="alert" className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
              {loginError}
            </div>
          )}
          <div>
            <label htmlFor="loginCredential" className={labelClasses}>
              {isCustomerLogin ? t('emailLabel') : t('usernameLabel')}
            </label>
            <input
              type={isCustomerLogin ? "email" : "text"}
              id="loginCredential"
              value={credentialInput}
              onChange={(e) => setCredentialInput(e.target.value)}
              required
              className={inputClasses}
              autoComplete={isCustomerLogin ? "email" : "username"}
              aria-required="true"
            />
          </div>
          <div>
            <label htmlFor="password" className={labelClasses}>{t('passwordLabel')}</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={inputClasses}
              autoComplete="current-password"
              aria-required="true"
            />
          </div>
          <button
            type="submit"
            className={`${primaryButtonClasses} mt-2`}
            disabled={isLoading}
          >
            {isLoading ? t('loggingIn') : t('loginButton')}
          </button>
        </form>
        {selectedRole === Role.CUSTOMER && (
          <p className="mt-6 text-center text-sm text-textSecondary">
            {t('dontHaveAccount')}{' '}
            <button onClick={() => onViewChange(View.REGISTER)} className={linkClasses}>
              {t('registerNow')}
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default LoginView;