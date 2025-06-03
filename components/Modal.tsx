import React from 'react';
import { TranslationKey } from '../types';

/**
 * Props for the Modal component.
 */
interface ModalProps {
  /** Whether the modal is currently open and visible. */
  isOpen: boolean;
  /** Callback function triggered when the modal is requested to close (e.g., by clicking the backdrop or close button). */
  onClose: () => void;
  /** The title of the modal. Expected to be an already translated string. */
  title: string; 
  /** The content to be displayed within the modal. */
  children: React.ReactNode;
  /** Optional size for the modal width. Defaults to 'md'. */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Translation function, primarily used here for ARIA attributes like the close button label. */
  t: (key: TranslationKey, replacements?: Record<string, string | number>) => string; 
}

/**
 * A generic Modal component.
 * Provides a reusable dialog interface with customizable title, content, and size.
 * Handles accessibility attributes and animations.
 */
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md', t }) => {
  if (!isOpen) return null; // Don't render if not open

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  const closeButtonAriaLabel = t('ariaCloseModal');

  return (
    <div 
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4 transition-opacity duration-300 ease-in-out"
      onClick={onClose} // Allow closing by clicking the backdrop
      role="dialog" //ARIA: Marks this div as a dialog container
      aria-modal="true" //ARIA: Indicates that content outside the dialog is inert
      aria-labelledby="modal-title" //ARIA: Associates the dialog with its title
    >
      <div 
        className={`bg-surface rounded-xl shadow-2xl w-full ${sizeClasses[size]} flex flex-col max-h-[90vh] overflow-hidden transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalShow`}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal content
        // No role needed here as the parent div is the dialog
      >
        <div className="flex justify-between items-center p-5 border-b border-borderLight">
          <h3 id="modal-title" className="font-serif text-2xl font-semibold text-textPrimary">{title}</h3>
          <button
            onClick={onClose}
            className="text-textSecondary hover:text-textPrimary transition-colors p-1 rounded-full hover:bg-slate-200"
            aria-label={closeButtonAriaLabel} // ARIA: Accessible label for the close button
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto"> {/* Scrollable content area */}
          {children}
        </div>
      </div>
      {/* Simple CSS animation for modal appearance */}
      <style>
        {`
          @keyframes modalShow {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          .animate-modalShow {
            animation: modalShow 0.3s forwards cubic-bezier(0.165, 0.84, 0.44, 1);
          }
        `}
      </style>
    </div>
  );
};

export default Modal;
