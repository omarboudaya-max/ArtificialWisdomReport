import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Chatbot from "@/components/Chatbot";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Artificial Wisdom Certification",
  description: "The global standard for AI governance, trust, and certification.",
  metadataBase: new URL("https://www.auditingartificialwisdom.com"),
  openGraph: {
    title: "Artificial Wisdom Certification",
    description: "The global standard for AI governance, trust, and certification.",
    url: "https://www.auditingartificialwisdom.com",
    siteName: "Artificial Wisdom",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Artificial Wisdom Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Artificial Wisdom Certification",
    description: "The global standard for AI governance, trust, and certification.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        {children}
        <Chatbot />
      </body>
    </html>
  );
}
