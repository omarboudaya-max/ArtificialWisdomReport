import type { Metadata, Viewport } from "next";
import { Inter, Outfit, Geist_Mono, IBM_Plex_Sans_Arabic, Noto_Kufi_Arabic } from "next/font/google";
import "./globals.css";
import Chatbot from "@/components/Chatbot";
import { I18nProvider } from "@/lib/i18n/client";
import { getT, getTheme } from "@/lib/i18n/server";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"], display: "swap" });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });
const arabic = IBM_Plex_Sans_Arabic({ variable: "--font-arabic", subsets: ["arabic"], weight: ["400", "500", "600", "700"], display: "swap" });
const arabicDisplay = Noto_Kufi_Arabic({ variable: "--font-arabic-display", subsets: ["arabic"], weight: ["500", "600", "700", "800"], display: "swap" });

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.auditingartificialwisdom.com";

export const metadata: Metadata = {
  title: { default: "Artificial Wisdom — 30 Seconds to AI Trust Intelligence", template: "%s · Artificial Wisdom" },
  description: "Global AI assurance, evaluation, governance and certification-readiness platform. Real security, safety, fairness, privacy and governance tests mapped to the EU AI Act, ISO/IEC 42001, NIST AI RMF and GDPR.",
  metadataBase: new URL(SITE),
  openGraph: {
    title: "Artificial Wisdom — 30 Seconds to AI Trust Intelligence",
    description: "Audit. Verify. Score. Benchmark. Improve.",
    url: SITE,
    siteName: "Artificial Wisdom",
    images: [{ url: "/logo.png", width: 1200, height: 630, alt: "Artificial Wisdom" }],
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Artificial Wisdom", description: "30 seconds to AI trust intelligence.", images: ["/logo.png"] },
  appleWebApp: { title: "Artificial Wisdom", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#05070f" },
  ],
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [{ locale, dir }, theme] = await Promise.all([getT(), getTheme()]);
  return (
    <html
      lang={locale}
      dir={dir}
      data-theme={theme === "system" ? undefined : theme}
      className={`${inter.variable} ${outfit.variable} ${mono.variable} ${arabic.variable} ${arabicDisplay.variable}`}
      suppressHydrationWarning
    >
      <body>
        <I18nProvider locale={locale}>
          {children}
          <Chatbot />
        </I18nProvider>
      </body>
    </html>
  );
}
