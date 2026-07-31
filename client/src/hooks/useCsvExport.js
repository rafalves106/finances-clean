import { useCallback, useState } from "react";
import { API_URL } from "../services/api";

export const useCsvExport = () => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const handleExportCsv = useCallback(async ({ startDate, endDate }) => {
    try {
      const query = new URLSearchParams({
        dataInicio: startDate,
        dataFim: endDate,
      });

      const response = await fetch(
        `${API_URL}/exportar-csv?${query.toString()}`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          errorText || "Não foi possível exportar movimentações.",
        );
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition");
      const filenameMatch =
        contentDisposition?.match(/filename\*=UTF-8''([^;\r\n]+)/i) ||
        contentDisposition?.match(/filename="([^"]+)"/i) ||
        contentDisposition?.match(/filename=([^;\r\n"]+)/i);
      const fileName = filenameMatch
        ? decodeURIComponent(filenameMatch[1].trim())
        : `movimentacoes_${startDate.replaceAll("-", "")}_${endDate.replaceAll("-", "")}.csv`;

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Erro ao exportar CSV:", error);
      alert(error.message || "Erro ao exportar CSV.");
    }
  }, []);

  return { isExportModalOpen, setIsExportModalOpen, handleExportCsv };
};
