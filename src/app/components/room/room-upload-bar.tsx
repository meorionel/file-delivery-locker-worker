"use client";

import { type FormEvent, useRef, useState } from "react";
import { useI18n } from "@/app/i18n";
import { readApiJson } from "@/app/components/api-json";
import { PrimaryButton } from "@/app/components/ui/button";
import type { DeliveryKind, UploadFileResult } from "./room-types";

type Props = {
  roomCode: string;
  joinToken: string;
  onUploaded: () => void;
};

const MAX_TEXT_SIZE = 256 * 1024;
const textFilePattern = /\.(txt|md|csv|json|log|xml|yml|yaml)$/i;

export function RoomUploadBar({ roomCode, joinToken, onUploaded }: Props) {
  const { t } = useI18n();
  const [kind, setKind] = useState<DeliveryKind>("file");
  const [textContent, setTextContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(event: FormEvent) {
    event.preventDefault();
    setError("");

    let body: BodyInit;
    let contentType: string;
    let fileName: string;

    if (kind === "text") {
      if (!textContent.trim()) {
        setError(t("message.enterText"));
        return;
      }
      const textBytes = new TextEncoder().encode(textContent);
      if (textBytes.length > MAX_TEXT_SIZE) {
        setError(t("message.textTooLarge"));
        return;
      }
      body = new Blob([textContent], { type: "text/plain;charset=utf-8" });
      contentType = "text/plain;charset=utf-8";
      fileName = "stored-text.txt";
    } else {
      if (!selectedFile) {
        setError(t("message.chooseFile"));
        return;
      }
      if (selectedFile.size > 100 * 1024 * 1024) {
        setError(t("message.fileTooLarge"));
        return;
      }
      body = selectedFile;
      contentType = selectedFile.type || "application/octet-stream";
      fileName = selectedFile.name;
    }

    setUploading(true);
    try {
      const response = await fetch(`/api/rooms/${encodeURIComponent(roomCode)}/files`, {
        method: "POST",
        headers: {
          "content-type": contentType,
          "x-content-type": contentType,
          "x-delivery-kind": kind,
          "x-file-name": encodeURIComponent(fileName),
          "x-join-token": joinToken,
        },
        body,
      });
      const data = await readApiJson<{ error?: string } & UploadFileResult>(
        response,
        t("message.roomUploadFailed")
      );
      if (!response.ok) {
        throw new Error(data.error ?? t("message.roomUploadFailed"));
      }
      setTextContent("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("message.roomUploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setKind("file");
    }
  }

  return (
    <form className="room-upload-bar" onSubmit={handleUpload}>
      <div className="room-upload-kind-toggle">
        <button
          type="button"
          className={`room-upload-kind-btn ${kind === "text" ? "room-upload-kind-active" : ""}`}
          onClick={() => setKind("text")}
        >
          {t("upload.modeText")}
        </button>
        <button
          type="button"
          className={`room-upload-kind-btn ${kind === "file" ? "room-upload-kind-active" : ""}`}
          onClick={() => setKind("file")}
        >
          {t("upload.modeFile")}
        </button>
      </div>

      {kind === "text" ? (
        <textarea
          className="field room-upload-textarea"
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          placeholder={t("upload.textPlaceholder")}
          rows={3}
        />
      ) : (
        <div className="room-upload-file-row">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="room-upload-file-input"
          />
          {selectedFile && <span className="room-upload-filename">{selectedFile.name}</span>}
        </div>
      )}

      <PrimaryButton type="submit" disabled={uploading}>
        {uploading ? t("upload.uploading") : kind === "text" ? t("room.uploadText") : t("room.uploadFile")}
      </PrimaryButton>

      {error && <p className="room-upload-error">{error}</p>}
    </form>
  );
}
