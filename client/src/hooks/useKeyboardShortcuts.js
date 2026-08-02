import { useEffect } from "react";

const isTypingTarget = (target) => {
  const tag = target?.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    Boolean(target?.isContentEditable)
  );
};

const isModalOpen = () => Boolean(document.querySelector('[role="dialog"]'));

export const useKeyboardShortcuts = ({
  onNewTransaction,
  onPreviousMonth,
  onNextMonth,
}) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (isTypingTarget(event.target) || isModalOpen()) {
        return;
      }

      if (event.key === "n" || event.key === "N") {
        onNewTransaction?.();
        return;
      }

      if (event.key === "ArrowLeft") {
        onPreviousMonth?.();
        return;
      }

      if (event.key === "ArrowRight") {
        onNextMonth?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNewTransaction, onPreviousMonth, onNextMonth]);
};
