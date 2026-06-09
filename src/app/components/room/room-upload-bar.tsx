"use client";

import { type FormEvent, useRef, useState } from "react";
import { Icon } from "@iconify/react";
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

export function RoomUploadBar({ roomCode, joinToken, onUploaded }: Props) {
  const { t } = useI18n();
  const [kind, setKind] = useState<DeliveryKind>("file");
  const [textContent, setTextContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function toggleKind() {
    setKind(kind === "file" ? "text" : "file");
  }

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
    }
  }

  return (
    <div className="room-chat-bar">
      <div className="mx-auto flex w-full max-w-[1200px] items-center gap-3 px-5 sm:px-8 min-[960px]:px-10">
        <button
          type="button"
          className="room-chat-toggle"
          onClick={toggleKind}
          title={kind === "file" ? t("room.uploadText") : t("room.uploadFile")}
        >
          {kind === "file" ? t("room.uploadFile").slice(0, 2) : t("room.uploadText").slice(0, 2)}
        </button>

        <form className="flex flex-1 items-center gap-3" onSubmit={handleUpload}>
          {kind === "text" ? (
            <input
              className="room-chat-input"
              type="text"
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder={t("upload.textPlaceholder")}
              disabled={uploading}
            />
          ) : (
            <label className="room-chat-file-label">
              <input
                ref={fileInputRef}
                type="file"
                className="sr-only"
                onChange={handleFileChange}
              />
              <span className={selectedFile ? "" : "room-chat-file-placeholder"}>
                {selectedFile ? selectedFile.name : t("upload.chooseFile")}
              </span>
            </label>
          )}

          <PrimaryButton type="submit" disabled={uploading}>
            {uploading ? t("upload.uploading") : <Icon icon="tabler:arrow-up" />}
          </PrimaryButton>
        </form>
      </div>

      {error && <p className="room-chat-error">{error}</p>}
    </div>
  );
}
