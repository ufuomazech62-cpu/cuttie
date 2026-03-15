
import * as React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md', footer }) => {
  if (!isOpen) return null;
  
  const sizeClasses = {
    sm: 'md:max-w-md',
    md: 'md:max-w-2xl',
    lg: 'md:max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-cuttie-charcoal/80 backdrop-blur-sm transition-all duration-300 p-0 md:p-6">
      <div 
        className={`
            bg-white w-full ${sizeClasses[size]} 
            shadow-2xl animate-fade-up relative flex flex-col 
            rounded-t-[2rem] md:rounded-3xl overflow-hidden 
            border border-cuttie-charcoal/5 
            h-[90vh] md:h-auto md:max-h-[90vh]
        `}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 md:py-5 bg-white border-b border-gray-100 flex-shrink-0 z-10">
          <h2 className="text-lg md:text-xl font-display font-bold text-cuttie-charcoal tracking-tight">{title}</h2>
          <button onClick={onClose} className="p-2 -mr-2 bg-gray-100 hover:bg-gray-200 transition-colors rounded-full text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white p-0">
          {children}
        </div>

        {/* Footer - Fixed */}
        {footer && (
            <div className="p-4 md:p-6 bg-white border-t border-gray-100 flex-shrink-0 safe-pb">
                {footer}
            </div>
        )}

      </div>
    </div>
  );
};

export default Modal;
