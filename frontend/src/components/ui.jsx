export function Card({ children, className = "" }) {
  return (
    <div className={`bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 ${className}`}>
      {children}
    </div>
  );
}

export function KeyTag({ children }) {
  return <span className="key-tag">{children}</span>;
}

// A room pill that gracefully shows "Vacated" instead of a blank/empty tag
// when a student has no room assigned (e.g. their old room was removed, or
// they haven't been placed in a room yet). Used everywhere a room number
// is displayed so this looks the same across every page.
export function RoomTag({ room }) {
  if (!room) {
    return <span className="text-xs font-semibold text-warn bg-warn/10 px-2.5 py-1 rounded-tag">Vacated</span>;
  }
  return <KeyTag>{room}</KeyTag>;
}

const statusColors = {
  Paid: "bg-ok/10 text-ok",
  Approved: "bg-ok/10 text-ok",
  Resolved: "bg-ok/10 text-ok",
  Present: "bg-ok/10 text-ok",
  Income: "bg-ok/10 text-ok",
  Due: "bg-tag/15 text-tag-dark",
  Pending: "bg-tag/15 text-tag-dark",
  "In Progress": "bg-tag/15 text-tag-dark",
  Overdue: "bg-warn/10 text-warn",
  Rejected: "bg-warn/10 text-warn",
  Open: "bg-warn/10 text-warn",
  Absent: "bg-warn/10 text-warn",
  Expense: "bg-warn/10 text-warn",
};

export function StatusPill({ status }) {
  const cls = statusColors[status] || "bg-ink/10 text-ink/60";
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${cls}`}>
      {status}
    </span>
  );
}

export function StatCard({ label, value, sub, icon: Icon, accent = "navy", className = "" }) {
  const accentBg = accent === "tag" ? "bg-tag/20 text-tag-dark" : "bg-navy/10 text-navy";
  return (
    <div className={`bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 p-5 flex items-start justify-between ${className}`}>
      <div>
        <p className="text-xs font-medium text-ink/50 uppercase tracking-wide">{label}</p>
        <p className="font-display font-bold text-2xl text-ink mt-1.5">{value}</p>
        {sub && <p className="text-xs text-ink/45 mt-1">{sub}</p>}
      </div>
      {Icon && (
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accentBg}`}>
          <Icon size={18} />
        </div>
      )}
    </div>
  );
}

export function SectionHeader({ eyebrow, title, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        {eyebrow && <p className="text-xs font-semibold text-tag-dark uppercase tracking-wide mb-0.5">{eyebrow}</p>}
        <h2 className="font-display font-bold text-base text-ink">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function RowActions({ onView, onEdit, onDelete }) {
  return (
    <div className="flex gap-1.5 justify-end">
      {onView && (
        <button
          onClick={onView}
          className="text-xs font-medium text-ink/60 bg-ink/5 hover:bg-ink/10 px-2.5 py-1.5 rounded-md transition-colors"
        >
          View
        </button>
      )}
      {onEdit && (
        <button
          onClick={onEdit}
          className="text-xs font-medium text-navy bg-navy/8 hover:bg-navy/15 px-2.5 py-1.5 rounded-md transition-colors"
        >
          Edit
        </button>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          className="text-xs font-medium text-warn bg-warn/10 hover:bg-warn/20 px-2.5 py-1.5 rounded-md transition-colors"
        >
          Delete
        </button>
      )}
    </div>
  );
}

export function Table({ headers, children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            {headers.map((h) => (
              <th key={h} className="py-3 px-4 font-semibold text-ink/50 text-xs uppercase tracking-wide whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}
