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
    <table className="room-file-table">
      <thead>
        <tr>
          <th className="room-file-th-name">{t("room.fileName")}</th>
          <th className="room-file-th-type">Type</th>
          <th className="room-file-th-size">{t("admin.headerSize")}</th>
          <th className="room-file-th-time">{t("room.uploadTime")}</th>
        </tr>
      </thead>
      <tbody>
        {files.map((f) => (
          <RoomFileItem key={f.id} file={f} onDownload={onDownload} onPreview={onPreview} />
        ))}
      </tbody>
    </table>
  );
}
