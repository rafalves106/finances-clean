import { ChevronLeft } from "lucide-react";
import { formatCurrency } from "../../util/formatCurrency";
import { formatDateLabel } from "../../util/dashboardFormatters";
import {
  getFrontLayerStyle,
  getThemePalette,
  normalizeCardTheme,
} from "../../util/cardTheme";

const formatCompetenciaShortLabel = (competencia) => {
  const ano = Math.floor(competencia / 100);
  const mes = competencia % 100;
  const data = new Date(ano, mes - 1, 1);
  return new Intl.DateTimeFormat("pt-BR", { month: "short" })
    .format(data)
    .replace(".", "");
};

const CardsSlide = ({
  slideGap,
  slideBottomSafeArea,
  onBack,
  cardSummaryError,
  sectionGap,
  slideContentHeight,
  cardColumns,
  cardTransactionsById,
  futureInvoicesByCardId,
  onOpenCreateCard,
  onOpenEditCard,
  onViewCardMovements,
}) => (
  <div
    className="h-full min-h-0 flex flex-col"
    style={{
      gap: `${slideGap}px`,
      paddingBottom: `${slideBottomSafeArea}px`,
    }}
  >
    <div className="flex items-center gap-3 flex-shrink-0">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          color: "var(--text-secondary)",
        }}
        aria-label="Voltar ao dashboard"
      >
        <ChevronLeft size={16} />
      </button>
      <h2
        className="text-sm font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        Gestão dos Cartões
      </h2>
    </div>

    {cardSummaryError ? (
      <p className="text-xs" style={{ color: "var(--danger-700)" }}>
        {cardSummaryError}
      </p>
    ) : null}

    <section
      className="grid min-h-0 items-stretch overflow-hidden"
      style={{
        gap: `${sectionGap}px`,
        height: `${slideContentHeight}px`,
        gridTemplateColumns: `repeat(${cardColumns.length}, minmax(0, 1fr))`,
      }}
    >
      {cardColumns.map((summary, index) => {
        if (!summary?.cartao?.id) {
          return (
            <article
              key={`empty-card-column-${index}`}
              className="rounded-xl border border-dashed p-4 min-h-0 max-h-full overflow-y-auto flex flex-col items-center justify-center gap-3"
              style={{
                borderColor: "var(--border-strong)",
                background: "var(--bg-surface-sunken)",
              }}
            >
              <p
                className="text-sm text-center"
                style={{ color: "var(--text-tertiary)" }}
              >
                Nenhum cartão cadastrado aqui ainda.
              </p>

              <button
                type="button"
                onClick={() => onOpenCreateCard(index)}
                className="text-xs font-semibold rounded-lg px-3 py-2 transition-colors"
                style={{
                  color: "var(--text-on-accent)",
                  background: "var(--accent-600)",
                }}
              >
                Criar novo cartão
              </button>
            </article>
          );
        }

        const card = summary.cartao;
        const cardId = String(card.id);
        const themeColor = normalizeCardTheme(card.corTema);
        const palette = getThemePalette(themeColor);
        const cardLimitTotal = Number(
          summary?.limite?.limiteTotal || card.limiteTotal || 0,
        );
        const cardLimitUsed = Number(
          summary?.limite?.limiteUtilizado ||
            summary?.limite?.utilizado ||
            summary?.limite?.Utilizado ||
            0,
        );
        const cardUsagePercent =
          cardLimitTotal > 0
            ? Math.min(100, Math.max(0, (cardLimitUsed / cardLimitTotal) * 100))
            : 0;

        const cardMovements = (cardTransactionsById.get(cardId) || []).slice(
          0,
          5,
        );

        return (
          <article
            key={cardId}
            className="rounded-xl p-3 min-h-0 max-h-full overflow-y-auto flex flex-col gap-3"
            style={{
              border: "1px solid var(--border-default)",
              background: "var(--bg-surface)",
              boxShadow: "var(--shadow-panel)",
            }}
          >
            <div
              className="rounded-xl border p-3"
              style={getFrontLayerStyle(themeColor)}
            >
              <div className="flex items-center justify-between gap-2">
                <p
                  className="text-sm font-semibold truncate"
                  style={{ color: palette.cardName }}
                >
                  {card.nome || "Cartão"}
                </p>
                <span
                  className="text-xs font-medium"
                  style={{ color: palette.usedText }}
                >
                  {Math.round(cardUsagePercent)}%
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span style={{ color: palette.usedText }}>
                  Utilizado {formatCurrency(cardLimitUsed)}
                </span>
                <span style={{ color: palette.usedText }}>
                  Limite {formatCurrency(cardLimitTotal)}
                </span>
              </div>
              <div
                className="mt-2 h-2 rounded-full border overflow-hidden"
                style={{ borderColor: palette.progressTrackBorder }}
              >
                <div
                  className="h-full"
                  style={{
                    width: `${cardUsagePercent}%`,
                    background: `linear-gradient(90deg, ${palette.progressFillStart} 0%, ${palette.progressFillEnd} 100%)`,
                  }}
                />
              </div>
              <div
                className="mt-2 flex items-center justify-between text-xs"
                style={{ color: palette.usedText }}
              >
                <span>
                  Fechamento {String(card.diaFechamento).padStart(2, "0")}
                </span>
                <span>
                  Vencimento {String(card.diaVencimento).padStart(2, "0")}
                </span>
              </div>
              {futureInvoicesByCardId?.[cardId]?.length > 0 ? (
                <div
                  className="mt-2 pt-2 flex items-center justify-between text-[11px]"
                  style={{ borderTop: `1px solid ${palette.progressTrackBorder}` }}
                >
                  {futureInvoicesByCardId[cardId].map((mes) => (
                    <div key={mes.competencia} className="text-center">
                      <p
                        className="uppercase"
                        style={{ color: palette.usedText, opacity: 0.75 }}
                      >
                        {formatCompetenciaShortLabel(mes.competencia)}
                      </p>
                      <p
                        className="font-semibold"
                        style={{ color: palette.usedText }}
                      >
                        {formatCurrency(mes.valor)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div
              className="rounded-xl p-3 min-h-0 flex-1 flex flex-col"
              style={{
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-surface-sunken)",
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3
                  className="text-xs font-semibold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Movimentações do Cartão
                </h3>
                <button
                  type="button"
                  onClick={() => onViewCardMovements(cardId)}
                  className="text-[11px] font-semibold"
                  style={{ color: "var(--accent-600)" }}
                >
                  Ver todas
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
                {cardMovements.length === 0 ? (
                  <p
                    className="text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Nenhuma movimentação vinculada.
                  </p>
                ) : (
                  cardMovements.map((item) => {
                    const isEntrada = (item.type || item.tipo) === "Entrada";
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p
                            className="text-xs truncate"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {item.name || item.titulo || "Movimentação"}
                          </p>
                          <p
                            className="text-[11px]"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            {item.date || item.data
                              ? formatDateLabel(item.date || item.data)
                              : "--/--"}
                          </p>
                        </div>
                        <span
                          className="text-xs font-semibold whitespace-nowrap"
                          style={{
                            color: isEntrada
                              ? "var(--success-700)"
                              : "var(--danger-700)",
                          }}
                        >
                          {isEntrada ? "+" : "-"}
                          {formatCurrency(item.value || item.valor || 0)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenEditCard(cardId)}
              className="w-full text-xs font-medium rounded-lg px-3 py-2 transition-colors"
              style={{
                color: "var(--text-secondary)",
                border: "1px solid var(--border-default)",
              }}
            >
              Editar Cartão
            </button>
          </article>
        );
      })}
    </section>
  </div>
);

export default CardsSlide;
