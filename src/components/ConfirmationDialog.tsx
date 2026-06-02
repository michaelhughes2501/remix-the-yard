import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, HelpCircle, X } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmationDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info'
}: ConfirmationDialogProps) {
  
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <Trash2 className="text-red-600" size={32} />;
      case 'warning':
        return <AlertTriangle className="text-amber-500" size={32} />;
      default:
        return <HelpCircle className="text-[#141414]" size={32} />;
    }
  };

  const getConfirmButtonStyles = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 border border-red-600';
      case 'warning':
        return 'bg-amber-500 text-[#141414] hover:bg-amber-600 active:bg-amber-700 border border-amber-500';
      default:
        return 'bg-[#141414] text-[#E4E3E0] hover:bg-[#141414]/90 active:bg-black border border-[#141414]';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay Background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
          />

          {/* Dialog Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
            className="relative bg-white border-2 border-[#141414] w-full max-w-md p-6 md:p-8 flex flex-col gap-6 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] hover:shadow-[12px_12px_0px_0px_rgba(20,20,20,1)] transition-shadow duration-300"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            aria-describedby="dialog-desc"
          >
            {/* Close Cross */}
            <button
              onClick={onCancel}
              className="absolute right-4 top-4 text-[#141414]/40 hover:text-[#141414] transition-colors"
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>

            {/* Icon + Title */}
            <div className="flex items-center gap-4 mt-2">
              <div className="p-2.5 bg-[#E4E3E0] rounded-sm shrink-0">
                {getIcon()}
              </div>
              <h3 
                id="dialog-title" 
                className="text-2xl font-serif italic font-bold tracking-tight text-[#141414]"
              >
                {title}
              </h3>
            </div>

            {/* Description */}
            <p 
              id="dialog-desc" 
              className="text-sm md:text-base text-[#141414]/75 leading-relaxed font-sans"
            >
              {message}
            </p>

            {/* Buttons Row */}
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end mt-4">
              <button
                type="button"
                onClick={onCancel}
                className="order-2 sm:order-1 px-5 py-3 border border-[#141414] text-[#141414] font-bold text-xs uppercase tracking-widest hover:bg-[#141414]/5 transition-colors cursor-pointer"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`order-1 sm:order-2 px-5 py-3 font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer ${getConfirmButtonStyles()}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
