import React, { useCallback, useEffect, useState } from "react";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaQuestionCircle,
} from "react-icons/fa";
import "./Dialog.css";

const VARIANTS = {
  success: { icon: <FaCheckCircle />, title: "Success" },
  error: { icon: <FaExclamationTriangle />, title: "Something went wrong" },
  confirm: { icon: <FaQuestionCircle />, title: "Are you sure?" },
};

/**
 * Themed replacement for window.alert / window.confirm.
 * `variant` is one of "success" | "error" | "confirm".
 */
const Dialog = ({
  open,
  variant = "success",
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onClose,
}) => {
  const isConfirm = variant === "confirm";

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const preset = VARIANTS[variant] || VARIANTS.success;

  return (
    <div className="dialog-overlay" onClick={onClose} role="presentation">
      <div
        className={`dialog dialog-${variant}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-message"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-icon">{preset.icon}</div>
        <h3 id="dialog-title">{title || preset.title}</h3>
        <p id="dialog-message">{message}</p>
        <div className="dialog-actions">
          {isConfirm && (
            <button className="btn btn-outline" onClick={onClose}>
              {cancelLabel}
            </button>
          )}
          <button
            className={`btn ${isConfirm ? "btn-danger" : "btn-primary"}`}
            onClick={isConfirm ? onConfirm : onClose}
            autoFocus
          >
            {confirmLabel || (isConfirm ? "Confirm" : "Got it")}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Drives a single <Dialog /> per page.
 *
 *   const { dialog, showSuccess, showError, showConfirm, closeDialog } = useDialog();
 *   ...
 *   <Dialog {...dialog} onClose={closeDialog} />
 */
export const useDialog = () => {
  const [dialog, setDialog] = useState({ open: false });

  const closeDialog = useCallback(() => {
    setDialog((prev) => ({ ...prev, open: false }));
  }, []);

  const showSuccess = useCallback((message, title) => {
    setDialog({ open: true, variant: "success", message, title });
  }, []);

  const showError = useCallback((message, title) => {
    setDialog({ open: true, variant: "error", message, title });
  }, []);

  const showConfirm = useCallback(
    ({ message, title, confirmLabel, cancelLabel, onConfirm }) => {
      setDialog({
        open: true,
        variant: "confirm",
        message,
        title,
        confirmLabel,
        cancelLabel,
        onConfirm: () => {
          setDialog((prev) => ({ ...prev, open: false }));
          onConfirm();
        },
      });
    },
    [],
  );

  return { dialog, showSuccess, showError, showConfirm, closeDialog };
};

export default Dialog;
