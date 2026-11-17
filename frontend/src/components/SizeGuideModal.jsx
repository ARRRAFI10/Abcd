import { useEffect, useRef } from "react";

export default function SizeGuideModal({ open, onClose, imageUrl }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="size-guide-modal"
      aria-labelledby="size-guide-modal-title"
      onClose={onClose}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="size-guide-modal-content">
        <div className="size-guide-modal-header">
          <div><p className="eyebrow">Ages 1–12</p><h2 id="size-guide-modal-title">Size guide</h2></div>
          <button type="button" className="size-guide-close" onClick={onClose} aria-label="Close size guide">×</button>
        </div>
        <p>Measurements are in inches. Compare your child's measurements with the chart before selecting a size.</p>
        <div className="size-guide-modal-chart"><img src={imageUrl} alt="Moon Shop BD blazer and trouser size chart for sizes 16 through 32, with measurements in inches" /></div>
        <a href={imageUrl} target="_blank" rel="noreferrer" className="text-link">Open full-size chart ↗</a>
      </div>
    </dialog>
  );
}
