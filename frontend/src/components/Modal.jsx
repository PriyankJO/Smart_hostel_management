import { X } from "lucide-react";

export default function Modal({ open, onClose, title, children, wide = false, z = "z-50" }) {
  if (!open) return null;
  return (
    <div className={`fixed inset-0 ${z} flex items-center justify-center p-4`}>
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-xl shadow-2xl w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-line sticky top-0 bg-white">
          <h3 className="font-display font-bold text-ink text-base">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink/50 hover:bg-parchment hover:text-ink">
            <X size={16} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block mb-4">
      <span className="block text-xs font-semibold text-ink/60 uppercase tracking-wide mb-1.5">{label}</span>
      {children}
    </label>
  );
}

export function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-line last:border-0">
      <span className="text-xs font-semibold text-ink/50 uppercase tracking-wide shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-ink text-right">{value ?? "—"}</span>
    </div>
  );
}

export function DetailModal({ open, onClose, title, subtitle, rows, z, extraAction }) {
  return (
    <Modal open={open} onClose={onClose} title={title} z={z}>
      {subtitle && <p className="text-xs text-ink/45 -mt-2 mb-4">{subtitle}</p>}
      <div>
        {rows.map((r) => (
          <DetailRow key={r.label} label={r.label} value={r.value} />
        ))}
      </div>
      <div className="flex items-center justify-between pt-4">
        <div>
          {extraAction && (
            <button
              type="button"
              onClick={extraAction.onClick}
              className="px-4 py-2 text-sm font-medium text-navy bg-navy/8 hover:bg-navy/15 rounded-lg"
            >
              {extraAction.label}
            </button>
          )}
        </div>
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-ink/60 hover:text-ink rounded-lg">
          Close
        </button>
      </div>
    </Modal>
  );
}

const inputCls =
  "w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-navy/40 bg-white";

export function Input(props) {
  return <input {...props} className={inputCls + " " + (props.className || "")} />;
}

export function Select({ options = [], ...props }) {
  return (
    <select {...props} className={inputCls + " " + (props.className || "")}>
      {options.map((o, idx) => {
        const val = typeof o === "object" && o !== null ? o.value : o;
        const lbl = typeof o === "object" && o !== null ? o.label : o;
        return (
          <option key={val !== undefined && val !== "" ? val : idx} value={val}>{lbl}</option>
        );
      })}
    </select>
  );
}

export function TextArea(props) {
  return <textarea {...props} rows={3} className={inputCls + " " + (props.className || "")} />;
}

export function FormActions({ onCancel, submitLabel = "Save" }) {
  return (
    <div className="flex justify-end gap-2 pt-2 border-t border-line mt-2">
      <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-ink/60 hover:text-ink rounded-lg">
        Cancel
      </button>
      <button type="submit" className="px-4 py-2 text-sm font-medium bg-navy text-white rounded-lg hover:bg-navy-light">
        {submitLabel}
      </button>
    </div>
  );
}
