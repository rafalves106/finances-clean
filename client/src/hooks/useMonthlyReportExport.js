import { useCallback, useState } from "react";
import { API_URL } from "../services/api";

export const useMonthlyReportExport = () => {
  const [isExportingReport, setIsExportingReport] = useState(false);

  const handleExportRelatorioMensal = useCallback(async (mes, ano) => {
    setIsExportingReport(true);

    try {
      const query = new URLSearchParams({ mes, ano });
      const response = await fetch(
        `${API_URL}/relatorio-mensal?${query.toString()}`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Não foi possível gerar o relatório mensal.");
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition");
      const filenameMatch =
        contentDisposition?.match(/filename\*=UTF-8''([^;\r\n]+)/i) ||
        contentDisposition?.match(/filename="([^"]+)"/i) ||
        contentDisposition?.match(/filename=([^;\r\n"]+)/i);
      const fileName = filenameMatch
        ? decodeURIComponent(filenameMatch[1].trim())
        : `relatorio_${ano}_${String(mes).padStart(2, "0")}.html`;

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Erro ao gerar relatório mensal:", error);
      alert(error.message || "Erro ao gerar relatório mensal.");
    } finally {
      setIsExportingReport(false);
    }
  }, []);

  return { isExportingReport, handleExportRelatorioMensal };
};
