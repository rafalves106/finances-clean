import { X } from "lucide-react";
import { parseReleaseNotes, setLastSeenVersion } from "../util/releaseNotes";

const ReleaseNotesModal = ({ isOpen, version, releaseNotes, onClose }) => {
  if (!isOpen || !releaseNotes) {
    return null;
  }

  const blocks = parseReleaseNotes(releaseNotes);

  const handleClose = () => {
    setLastSeenVersion(version);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="release-notes-modal-title"
        className="bg-white rounded-2xl max-w-xl w-full mx-4 p-6 shadow-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            id="release-notes-modal-title"
            className="text-xl font-bold text-slate-800"
          >
            Novidades da versão v{version}
          </h2>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Fechar modal de release notes"
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 max-h-80 overflow-auto space-y-2">
          {blocks.map((block, index) => {
            if (block.type === "heading") {
              return (
                <h3
                  key={index}
                  className="text-sm font-semibold text-slate-800 mt-3 first:mt-0"
                >
                  {block.text}
                </h3>
              );
            }

            if (block.type === "list") {
              return (
                <ul
                  key={index}
                  className="list-disc pl-5 text-sm text-slate-700 leading-relaxed space-y-1"
                >
                  {block.items.map((item, itemIndex) => (
                    <li key={itemIndex}>{item}</li>
                  ))}
                </ul>
              );
            }

            return (
              <p key={index} className="text-sm text-slate-700 leading-relaxed">
                {block.text}
              </p>
            );
          })}
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReleaseNotesModal;
