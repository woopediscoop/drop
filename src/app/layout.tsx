import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Drop — Ephemeral File Transfer",
  description: "Transfer files between devices with short room codes. Files auto-expire after 30 minutes.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Drop",
  },
};

export const viewport: Viewport = {
  themeColor: "#030712",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="bg-gray-950 text-gray-100 min-h-dvh antialiased">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `if("serviceWorker"in navigator)navigator.serviceWorker.register("/sw.js")`,
          }}
        />
      </body>
    </html>
  );
}
