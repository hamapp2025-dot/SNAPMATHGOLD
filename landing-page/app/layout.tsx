import type { Metadata } from "next";
import { Cairo, Playfair_Display } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  weight: ["400", "500", "600", "700", "800"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "SnapMath Academy | تطبيق رياضيات توجيهي",
  description:
    "SnapMath Academy is a premium Tawjihi math app with Arabic 3D lessons, AI tutoring, visual explanations, and exam-focused practice.",
  keywords: [
    "تطبيق رياضيات توجيهي",
    "توجيهي",
    "رياضيات التوجيهي",
    "Tawjihi math app",
    "Arabic math app",
    "Jordan math app",
    "SnapMath Academy",
  ],
  openGraph: {
    title: "SnapMath Academy | تطبيق رياضيات توجيهي",
    description:
      "3Blue1Brown-style math animations in Arabic, built for Tawjihi students.",
    siteName: "SnapMath Academy",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SnapMath Academy | تطبيق رياضيات توجيهي",
    description:
      "3Blue1Brown-style math animations in Arabic, built for Tawjihi students.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${cairo.variable} ${playfair.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
