import { useCallback, useRef, useState } from "react";
import { API_URL } from "../services/api";
import { getAuthHeaders } from "../services/auth";

// Importa o mesmo CSV que o exportador gera (Data;Titulo;Tipo;Categoria;Valor;Veiculo).
// Segue o mesmo padrão de useCsvExport: sem modal próprio, resultado via alert.
export const useCsvImport = (onImported) => {
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback(
    async (event) => {
      const arquivo = event.target.files?.[0];
      event.target.value = "";
      if (!arquivo) return;

      setIsImporting(true);
      try {
        const formData = new FormData();
        formData.append("arquivo", arquivo);

        const response = await fetch(`${API_URL}/importar-csv`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Não foi possível importar o arquivo.");
        }

        const resultado = await response.json();
        const resumo = `Importação concluída: ${resultado.importadas} de ${resultado.totalLinhas} movimentações importadas.`;
        const detalheErros =
          resultado.erros?.length > 0
            ? `\n\n${resultado.erros.length} linha(s) com erro:\n` +
              resultado.erros.map((e) => `- Linha ${e.linha}: ${e.motivo}`).join("\n")
            : "";

        alert(resumo + detalheErros);

        if (resultado.importadas > 0) {
          onImported?.();
        }
      } catch (error) {
        console.error("Erro ao importar CSV:", error);
        alert(error.message || "Erro ao importar CSV.");
      } finally {
        setIsImporting(false);
      }
    },
    [onImported],
  );

  return { isImporting, fileInputRef, openFilePicker, handleFileSelected };
};
