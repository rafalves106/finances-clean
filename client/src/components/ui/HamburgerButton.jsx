import { List } from "@phosphor-icons/react";

// Botão que abre o NavDrawer. Extraído do NavDrawer pra poder ser
// renderizado tanto flutuando (fixed, padrão em mobile e nas telas sem
// barra de ações própria) quanto inline (dentro da linha de ações da Home
// desktop, lado a lado com o seletor de mês e os outros botões).
const HamburgerButton = ({ onClick, className = "" }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="Abrir menu"
    className={`ui-panel ui-panel-interactive flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full ${className}`}
  >
    <List size={20} weight="bold" style={{ color: "var(--text-primary)" }} />
  </button>
);

export default HamburgerButton;
