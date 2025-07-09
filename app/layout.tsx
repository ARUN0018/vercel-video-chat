import type { Metadata } from "next";
import type { Viewport } from "next";
import { Inter } from "next/font/google";

export const viewport: Viewport = {
  initialScale: 1.0,
  width: "device-width",
};
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zoom VideoSDK",
  description: "Zoom x Next.js",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
