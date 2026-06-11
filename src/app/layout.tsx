import type { Metadata } from "next";
import { LanguageProvider } from "./i18n";
import { ModeNavSwitch } from "./components/mode-nav-switch";
import { SiteLogo } from "./components/site-logo";
import { SiteFooter } from "./components/site-footer";
import "./globals.css";
import "./public.css";
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
					<div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-5 pt-6 max-sm:pt-4 min-[960px]:px-10 sm:px-8">
						<SiteLogo />
						<ModeNavSwitch />
					</div>
					{children}
					<SiteFooter />
				</LanguageProvider>
			</body>
		</html>
	);
}
