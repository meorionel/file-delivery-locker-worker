"use client";

import { formatBytes, formatTime } from "@/app/components/locker-format";
import { useI18n } from "@/app/i18n";
import { Badge } from "@/app/components/ui/badge";
import type { RoomFile } from "./room-types";

type Props = {
  file: RoomFile;
  onDownload: (file: RoomFile) => void;
  onPreview: (file: RoomFile) => void;
};

export function RoomFileItem({ file, onDownload, onPreview }: Props) {
  const { locale } = useI18n();

  function handleClick() {
    if (file.kind === "text") {
      onPreview(file);
    } else {
      onDownload(file);
    }
  }

  return (
    <button type="button" className="room-file-row" onClick={handleClick}>
      <span className="room-file-name">{file.fileName}</span>
      <span className="room-file-kind">
        <Badge variant="coral">
          {file.kind === "text" ? "TXT" : "FILE"}
        </Badge>
      </span>
      <span className="room-file-size">{formatBytes(file.size)}</span>
      <span className="room-file-time">{formatTime(file.createdAt, locale)}</span>
    </button>
  );
}
