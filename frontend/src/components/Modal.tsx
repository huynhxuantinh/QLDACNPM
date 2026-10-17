import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export function Modal({ title, open, onClose, children }: { title: string; open: boolean; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (open) ref.current?.focus(); }, [open]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal-card" ref={ref} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} onKeyDown={(event) => event.key === "Escape" && onClose()}>
        <header><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Đóng"><X size={20} /></button></header>{children}
      </div>
    </div>
  );
}
