import React, { useState } from 'react';
import { Role, View, TranslationKey } from '../types';

interface RegisterViewProps {
  onRegisterAttempt: (displayName: string, email: string, password_input: string) => Promise<string | null>;
  registrationError: string | null;
  onViewChange: (view: View, role?: Role) => void;
  t: (key: TranslationKey, replacements?: Record<string, string | number>) => string;
}

const RegisterView: React.FC<RegisterViewProps> = ({ onRegisterAttempt, registrationError, onViewChange, t }) => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailVerificationMessage, setEmailVerificationMessage] = useState<string | null>(null);
  const [emailVerificationStatus, setEmailVerificationStatus] = useState<'idle' | 'verifying' | 'verified' | 'exists' | 'error' | 'invalid_format'>('idle');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const isValidEmail = (emailToTest: string): boolean => {
    return /^\S+@\S+\.\S+$/.test(emailToTest);
  };

  const checkEmailAvailability = async () => {
    if (!email) {
      setEmailVerificationStatus('idle');
      setEmailVerificationMessage(null);
      return;
    }
    if (!isValidEmail(email)) {
      setEmailVerificationStatus('invalid_format');
      setEmailVerificationMessage(t('invalidEmailFormatError' as TranslationKey, { defaultValue: 'Formato de correo inválido.' }));
      return;
    }

    setEmailVerificationStatus('verifying');
    setEmailVerificationMessage(null); // Clear previous messages
    try {
      const response = await fetch(`/api/users/check-email?email=${encodeURIComponent(email)}`);
      if (!response.ok) {
        if (response.status === 304) {
          // This case should ideally not happen if backend caching is well managed
          // For now, assume it means the previous state is still valid or treat as error
          console.warn('Received 304 Not Modified for email check, treating as error or re-evaluating.');
          setEmailVerificationStatus('error');
          setEmailVerificationMessage(t('errorCheckingEmail' as TranslationKey, { defaultValue: 'Error al verificar el correo (304).' })); 
          // Potentially add 'errorCheckingEmail' to localization.ts if needed
          return;
        }
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.exists) {
        setEmailVerificationStatus('exists');
        setEmailVerificationMessage(t('emailAlreadyRegisteredError' as TranslationKey, { defaultValue: 'Este correo electrónico ya está registrado.' }));
      } else {
        setEmailVerificationStatus('verified');
        setEmailVerificationMessage(null); // Or a success message like 'Correo disponible'
      }
    } catch (error: any) {
      console.error('Error checking email availability:', error);
      setEmailVerificationStatus('error');
      // Use a generic error message, or one from the error object if appropriate
      const specificApiError = error.message && error.message.includes('Network response was not ok') ? 
                               t('errorNetworkResponse' as TranslationKey, { defaultValue: 'Error de red al verificar.' }) : // Add 'errorNetworkResponse' to localization.ts
                               t('errorCheckingEmail' as TranslationKey, { defaultValue: 'Error al verificar el correo.' }); // Add 'errorCheckingEmail' to localization.ts
      setEmailVerificationMessage(error.message || specificApiError);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (emailVerificationStatus === 'exists' || emailVerificationStatus === 'invalid_format' || emailVerificationStatus === 'error') {
      setLocalError(emailVerificationMessage || t('correctEmailErrorPrompt' as TranslationKey, { defaultValue: 'Por favor, corrige los errores en el correo electrónico.'})); // Add 'correctEmailErrorPrompt' to localization.ts
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Las contraseñas no coinciden.');
      return;
    }
    if (!displayName.trim() || !email.trim() || !password.trim()){
        setLocalError('Todos los campos son obligatorios.');
        return;
    }

    const currentPasswordErrors = validatePassword(password);
    if (currentPasswordErrors.length > 0) {
      setLocalError('La contraseña no cumple los requisitos: ' + currentPasswordErrors.join(' '));
      setPasswordErrors(currentPasswordErrors); // Ensure errors are displayed
      return;
    }

    setIsLoading(true);
    const apiError = await onRegisterAttempt(displayName, email, password);
    if (apiError) { // Error message will be set in App.tsx via registrationError prop
      // setLocalError(apiError); // Or rely on registrationError prop
    } else {
      // Success, App.tsx will handle redirection
    }
    setIsLoading(false);
  };

  const inputClasses = "mt-1 block w-full px-4 py-3 border border-borderLight rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary sm:text-base transition-colors bg-white text-textPrimary";
  const labelClasses = "block text-sm font-medium text-textSecondary";
  const primaryButtonClasses = "w-full px-6 py-3 bg-secondary hover:bg-secondary-dark text-textOnSecondary font-semibold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-secondary-light focus:ring-opacity-75 disabled:bg-slate-400 disabled:cursor-not-allowed";
  const linkClasses = "font-medium text-secondary hover:text-secondary-dark transition-colors";

  return (
    <div className="container mx-auto p-4 sm:p-6 flex justify-center items-center min-h-[calc(100vh-200px)]">
      <div className="w-full max-w-md bg-surface p-8 sm:p-10 rounded-xl shadow-2xl border border-borderLight">
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-textPrimary mb-3 text-center">
          {t('registerTitle' as TranslationKey, { defaultValue: 'Crear Cuenta de Cliente' })}
        </h2>
        <p className="text-textSecondary mb-8 text-center text-sm sm:text-base">{t('registerPrompt' as TranslationKey, { defaultValue: 'Completa tus datos para crear una cuenta nueva.' })}</p>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {(localError || registrationError) && (
            <div role="alert" className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
              {localError || registrationError}
            </div>
          )}
          <div>
            <label htmlFor="displayName" className={labelClasses}>{t('fullNameLabel' as TranslationKey, { defaultValue: 'Nombre Completo*' })}</label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className={inputClasses}
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor="email" className={labelClasses}>{t('emailLabel' as TranslationKey, { defaultValue: 'Correo Electrónico*' })}</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClasses}
              autoComplete="email"
              onBlur={checkEmailAvailability} // Call validation on blur
            />
            {emailVerificationMessage && (
              <div className={`mt-1 text-xs ${emailVerificationStatus === 'exists' || emailVerificationStatus === 'invalid_format' || emailVerificationStatus === 'error' ? 'text-red-500' : 'text-green-600'}`}>
                {emailVerificationMessage}
              </div>
            )}
          </div>
          <div>
            <label htmlFor="password" className={labelClasses}>{t('passwordLabel' as TranslationKey, { defaultValue: 'Contraseña*' })}</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (e.target.value) {
                  const errors = validatePassword(e.target.value);
                  setPasswordErrors(errors);
                  if (errors.length > 0) {
                    setLocalError(null); // Clear general error if specific password errors are shown
                  }
                } else {
                  setPasswordErrors([]);
                }
              }}
              required
              className={inputClasses}
              autoComplete="new-password"
            />
            {passwordErrors.length > 0 && (
              <div className="mt-1 text-xs text-red-500">
                {passwordErrors.map(err => <div key={err}>{err}</div>)}
              </div>
            )}
            {!password && displayName && email && !passwordErrors.length && !localError && !registrationError && (
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
            <label htmlFor="confirmPassword" className={labelClasses}>{t('confirmPasswordLabel' as TranslationKey, { defaultValue: 'Confirmar Contraseña*' })}</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={inputClasses}
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            className={`${primaryButtonClasses} mt-3`}
            disabled={isLoading}
          >
            {isLoading ? t('registering' as TranslationKey, { defaultValue: 'Registrando...' }) : t('registerButton' as TranslationKey, { defaultValue: 'Registrarme' })}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-textSecondary">
          {t('alreadyHaveAccount' as TranslationKey, { defaultValue: '¿Ya tienes una cuenta?' })}{' '}
          <button onClick={() => onViewChange(View.LOGIN, Role.CUSTOMER)} className={linkClasses}>
            {t('loginHere' as TranslationKey, { defaultValue: 'Inicia sesión aquí' })}
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterView;