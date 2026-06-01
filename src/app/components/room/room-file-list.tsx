"use client";

import { useI18n } from "@/app/i18n";
import type { RoomFile } from "./room-types";
import { RoomFileItem } from "./room-file-item";

type Props = {
  files: RoomFile[];
  onDownload: (file: RoomFile) => void;
  onPreview: (file: RoomFile) => void;
};

export function RoomFileList({ files, onDownload, onPreview }: Props) {
  const { t } = useI18n();

  if (files.length === 0) {
    return <p className="room-empty">{t("room.noFiles")}</p>;
  }

  return (
    <div className="room-file-list">
      <div className="room-file-header">
        <span className="room-file-name">{t("room.fileName")}</span>
        <span className="room-file-kind">{t("room.fileType")}</span>
        <span className="room-file-size">{t("admin.headerSize")}</span>
        <span className="room-file-time">{t("room.uploadTime")}</span>
      </div>
      {files.map((f) => (
        <RoomFileItem key={f.id} file={f} onDownload={onDownload} onPreview={onPreview} />
      ))}
    </div>
  );
}
