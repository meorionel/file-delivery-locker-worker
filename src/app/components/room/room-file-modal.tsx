"use client";

import { Modal } from "@/app/components/ui/modal";
import type { RoomFile } from "./room-types";

type Props = {
	file: RoomFile;
	text: string;
	onClose: () => void;
};

export function RoomFileModal({ file, text, onClose }: Props) {
	return (
		<Modal open={true} title={file.fileName} onClose={onClose}>
			<pre className="text-preview">{text}</pre>
		</Modal>
	);
}
