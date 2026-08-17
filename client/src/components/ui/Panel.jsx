import { createElement } from "react";

// Bloco visual base do redesign "do zero" (2026-08-17): substitui os
// <article> com inline style repetido + classes .uiux-card-* do layout
// anterior. Um único componente, testado uma vez, reaproveitado em toda
// a Home nova em vez de cada card reinventar padding/radius/shadow.
// Usa createElement (em vez de <Component>) porque o eslint desse projeto
// não reconhece uso de tag JSX dinâmica vinda de destructuring/rename como
// "uso" da variável e acusa falso-positivo de no-unused-vars.
const Panel = (props) => {
  const {
    as = "div",
    interactive = false,
    className = "",
    children,
    animationClassName = "",
    ...rest
  } = props;

  return createElement(
    as,
    {
      className: `ui-panel rounded-2xl ${interactive ? "ui-panel-interactive cursor-pointer" : ""} ${animationClassName} ${className}`,
      ...rest,
    },
    children,
  );
};

export default Panel;
