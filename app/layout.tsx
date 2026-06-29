import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "DraftDeal — Draft proposal + ROI dalam menit",
  description:
    "Dari catatan discovery ke draft proposal dan hitungan ROI yang bisa diaudit. Angka dihitung di kode, prosanya ditulis AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${inter.variable} ${spaceGrotesk.variable}`}>{children}</body>
    </html>
  );
}
