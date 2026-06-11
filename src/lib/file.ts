export function getDownloadFileName(contentDisposition: string | null, fallback: string) {
	const utf8Match = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i);
	if (utf8Match?.[1]) {
		try {
			return decodeURIComponent(utf8Match[1]);
		} catch {
			return fallback;
		}
	}

	const asciiMatch = contentDisposition?.match(/filename="([^"]+)"/i);
	return asciiMatch?.[1] || fallback;
}
