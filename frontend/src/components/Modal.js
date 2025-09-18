// src/components/Modal.js
import React, { useEffect } from "react";
import ReactDOM from "react-dom";

export default function Modal({ show, onClose, children, title }) {
  useEffect(() => {
    if (!show) return;

    // prevent body scroll while modal open
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [show, onClose]);

  if (!show) return null;

  return ReactDOM.createPortal(
    <div
      aria-modal="true"
      role="dialog"
      className="d-flex align-items-center justify-content-center"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        pointerEvents: "auto",
      }}
    >
      {/* Backdrop - clicking closes */}
      <div onClick={onClose} className="modal-portal-backdrop" />

      {/* Dialog container - stop propagation to avoid closing when clicking inside */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-dialog"
        style={{
          position: "relative",
          zIndex: 2001,
          width: "100%",
          maxWidth: 720,
        }}
      >
        <div className="modal-content">{children}</div>
      </div>
    </div>,
    document.body
  );
}
