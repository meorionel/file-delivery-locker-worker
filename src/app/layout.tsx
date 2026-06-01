import type { Metadata } from "next";
import { LanguageProvider } from "./i18n";
import { ModeNavSwitch } from "./components/mode-nav-switch";
import { SiteFooter } from "./components/site-footer";
import "./globals.css";
import "./styles/layout.css";
import "./styles/panels.css";
import "./styles/stats.css";
import "./styles/forms.css";
import "./styles/buttons.css";
import "./styles/delivery.css";
import "./styles/room.css";
import "./goey-toast.css";

export const metadata: Metadata = {
	title: "文件快递柜",
	description: "基于 Cloudflare R2 和 D1 的匿名文件中转柜",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="zh-CN">
			<head>
				<link rel="icon" href="/favicon.ico" type="image/svg+xml"></link>
			</head>
			<body>
				<LanguageProvider>
					<div className="mx-auto w-full max-w-[1200px] px-5 pt-6 sm:px-8 min-[960px]:px-10 max-sm:pt-4">
						<ModeNavSwitch />
					</div>
					{children}
					<SiteFooter />
				</LanguageProvider>
			</body>
		</html>
	);
}
