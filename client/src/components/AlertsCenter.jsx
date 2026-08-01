import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";

const PANEL_POSITION_CLASSES = {
  "top-right": "right-4 top-16",
  "bottom-left": "left-4 bottom-4",
};

const AlertsCenter = ({ alerts, panelPosition = "top-right" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label={`Central de alertas${alerts.length > 0 ? ` (${alerts.length} pendente${alerts.length > 1 ? "s" : ""})` : ""}`}
        aria-expanded={isOpen}
        className="relative flex items-center justify-center w-9 h-9 rounded-full transition-colors"
        style={{ color: "var(--text-tertiary)" }}
      >
        <Bell size={18} />
        {alerts.length > 0 ? (
          <span
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px] font-semibold"
            style={{
              background: "var(--danger-700)",
              color: "var(--text-on-accent)",
            }}
          >
            {alerts.length}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div
          className={`fixed z-50 w-[min(320px,calc(100vw-2rem))] rounded-2xl border overflow-hidden ${PANEL_POSITION_CLASSES[panelPosition]}`}
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border-default)",
            boxShadow: "var(--shadow-modal)",
          }}
        >
          <div
            className="px-4 py-3 text-sm font-semibold"
            style={{
              color: "var(--text-primary)",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            Alertas
          </div>
          <div className="max-h-80 overflow-y-auto">
            {alerts.length === 0 ? (
              <p
                className="px-4 py-6 text-sm text-center"
                style={{ color: "var(--text-tertiary)" }}
              >
                Nenhum alerta no momento.
              </p>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="px-4 py-3 flex items-start gap-2"
                  style={{ borderBottom: "1px solid var(--border-subtle)" }}
                >
                  <span
                    className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{
                      background:
                        alert.severity === "critico"
                          ? "var(--danger-700)"
                          : "var(--warning-700)",
                    }}
                  />
                  <div className="min-w-0">
                    <p
                      className="text-xs font-semibold truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {alert.label}
                    </p>
                    <p
                      className="text-[11px]"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {alert.description}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AlertsCenter;
