"use client";

import { useI18n } from "@/app/i18n";
import type { RoomFile } from "./room-types";

type Props = {
  file: RoomFile;
  text: string;
  onClose: () => void;
};

export function RoomFileModal({ file, text, onClose }: Props) {
  const { t } = useI18n();

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal room-file-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h2 className="admin-modal-title">{file.fileName}</h2>
          <button type="button" className="admin-modal-close" onClick={onClose} aria-label={t("common.close")}>
            &times;
          </button>
        </div>
        <div className="admin-modal-body">
          <pre className="text-preview">{text}</pre>
        </div>
      </div>
    </div>
  );
}
