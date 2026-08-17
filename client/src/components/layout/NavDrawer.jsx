import {
  X,
  SquaresFour,
  Target,
  Car,
  MagnifyingGlass,
  SignOut,
} from "@phosphor-icons/react";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import AlertsCenter from "../AlertsCenter";
import IconTile from "../ui/IconTile";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: SquaresFour },
  { id: "wishlist", label: "Conquistas", icon: Target },
  { id: "vehicle", label: "Veículos", icon: Car },
];

// "Rafael Alves" -> "RA". Sem foto de perfil no app ainda - iniciais
// evitam ter que construir upload/storage de avatar só pra mostrar quem
// está logado.
const getInitials = (name) => {
  const partes = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
};

// Menu lateral sob demanda (hambúrguer), não fixo na tela - pedido explícito
// do usuário pra abrir mais espaço útil pro conteúdo e reduzir "caixas"
// sempre visíveis. Reaproveita useFocusTrap (mesmo hook do modal de
// edição de cartão) em vez de reescrever navegação por teclado do zero.
// Controlado de fora (isOpen/onClose) porque o botão que abre precisa
// aparecer em lugares diferentes: flutuando (mobile, telas sem barra de
// ações própria) ou inline na linha de ações da Home desktop - ver
// ui/HamburgerButton.jsx.
const NavDrawer = ({
  isOpen,
  onClose,
  activeTab,
  onNavigate,
  alerts = [],
  onOpenSearch,
  onLogout,
  version,
  userName = "",
}) => {
  const { dialogRef, handleDialogKeyDown } = useFocusTrap(isOpen, onClose);

  return (
    <>
      {isOpen ? (
        <div className="fixed inset-0 z-40 flex">
          <button
            type="button"
            aria-label="Fechar menu clicando fora"
            onClick={onClose}
            className="nav-drawer-backdrop absolute inset-0"
          />

          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
            onKeyDown={handleDialogKeyDown}
            className="nav-drawer-panel relative flex h-full w-[280px] flex-col gap-1 rounded-r-3xl p-4"
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <span
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Finanças
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar menu"
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                style={{ color: "var(--text-tertiary)" }}
              >
                <X size={16} />
              </button>
            </div>

            <nav className="flex flex-col gap-1" aria-label="Navegação principal">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onNavigate(item.id);
                    onClose();
                  }}
                  aria-current={activeTab === item.id ? "page" : undefined}
                  className="nav-drawer-item flex items-center gap-3 rounded-xl px-2 py-2 text-left text-sm font-medium"
                  style={
                    activeTab === item.id
                      ? { background: "var(--accent-50)", color: "var(--accent-600)" }
                      : { color: "var(--text-secondary)" }
                  }
                >
                  <IconTile
                    icon={item.icon}
                    size={34}
                    tone={activeTab === item.id ? "accent" : "neutral"}
                  />
                  {item.label}
                </button>
              ))}
            </nav>

            <div
              className="mt-auto flex flex-col gap-1 pt-3"
              style={{ borderTop: "1px solid var(--border-subtle)" }}
            >
              {userName ? (
                <div className="mb-1 flex items-center gap-3 rounded-xl px-2 py-2">
                  <span
                    className="icon-tile flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      background: "linear-gradient(160deg, var(--accent-100) 0%, var(--accent-50) 100%)",
                      color: "var(--accent-600)",
                    }}
                  >
                    {getInitials(userName)}
                  </span>
                  <span
                    className="truncate text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {userName}
                  </span>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  onOpenSearch();
                  onClose();
                }}
                className="nav-drawer-item flex items-center gap-3 rounded-xl px-2 py-2 text-left text-sm font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                <IconTile icon={MagnifyingGlass} size={34} tone="neutral" />
                Buscar
                <kbd
                  className="ml-auto rounded-md px-1.5 py-0.5 text-[10px]"
                  style={{ background: "var(--bg-surface-sunken)", color: "var(--text-tertiary)" }}
                >
                  ⌘K
                </kbd>
              </button>

              <div className="flex items-center gap-3 rounded-xl px-2 py-2">
                <IconTile icon={Target} size={34} tone="neutral" />
                <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                  Alertas
                </span>
                <span className="ml-auto">
                  <AlertsCenter alerts={alerts} panelPosition="bottom-left" />
                </span>
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="nav-drawer-item flex items-center gap-3 rounded-xl px-2 py-2 text-left text-sm font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                <IconTile icon={SignOut} size={34} tone="danger" />
                Sair
              </button>

              {version ? (
                <p
                  className="mt-1 text-center text-[11px]"
                  style={{ color: "var(--text-disabled)" }}
                >
                  v{version}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default NavDrawer;
