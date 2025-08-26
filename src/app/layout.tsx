import type { Metadata } from "next";
import "@/style/globals.css";
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TodoConstructor - Sistema de Gestión de Ferretería",
  description: "Sistema integral de administración para gestión de ferretería y construcción",
  themeColor: "#0B3555",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-[#FF7A00]/5`}
      >
        {children}
      </body>
    </html>
  );
}
