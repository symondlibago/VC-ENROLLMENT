import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Confirms an action that is awkward to take back.
 *
 * Every default here is the delete wording it has always had, so the call
 * sites that only pass a title and a message are untouched. The props exist
 * for actions in the same family that are not deletions — archiving, which is
 * reversible and destroys nothing — rather than having a second copy of this
 * file with one colour changed.
 */
const TONES = {
  danger: {
    chip: 'bg-red-100',
    icon: 'text-red-600',
    box: 'bg-red-50 border-red-200',
    boxText: 'text-red-800',
    button: 'bg-red-600 hover:bg-red-700',
  },
  warning: {
    chip: 'bg-amber-100',
    icon: 'text-amber-600',
    box: 'bg-amber-50 border-amber-200',
    boxText: 'text-amber-900',
    button: 'bg-amber-600 hover:bg-amber-700',
  },
};

const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Item",
  message = "Are you sure you want to delete this item? This action cannot be undone.",
  itemName = "",
  isLoading = false,
  tone = "danger",
  confirmLabel = "Delete",
  loadingLabel = "Deleting...",
  confirmIcon: ConfirmIcon = Trash2,
  itemLabel = "Item to be deleted:",
  warning = (
    <>
      <strong>Warning:</strong> This action cannot be undone. All data associated with this item will be permanently removed.
    </>
  )
}) => {
  const palette = TONES[tone] ?? TONES.danger;

  const modalVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.95,
      y: 20
    },
    visible: { 
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8
      }
    },
    exit: { 
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          variants={overlayVariants}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className={`p-2 ${palette.chip} rounded-full`}>
                  <AlertTriangle className={`w-5 h-5 ${palette.icon}`} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {title}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                disabled={isLoading}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                {message}
              </p>
              {itemName && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-500 mb-1">{itemLabel}</p>
                  <p className="font-medium text-gray-900">{itemName}</p>
                </div>
              )}
              {warning && (
                <div className={`${palette.box} border rounded-lg p-3`}>
                  <p className={`text-sm ${palette.boxText}`}>
                    {warning}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="liquid-button"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={isLoading}
                className={`${palette.button} text-white liquid-button min-w-[100px]`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {loadingLabel}
                  </>
                ) : (
                  <>
                    <ConfirmIcon className="w-4 h-4 mr-2" />
                    {confirmLabel}
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeleteConfirmationModal;

