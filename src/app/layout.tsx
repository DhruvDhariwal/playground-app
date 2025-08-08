import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { DemoAuth } from "@/components/demo-auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Playground - Try AI Skills",
  description: "A playground app for trying AI skills like conversation analysis, image analysis, and document summarization",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <DemoAuth>
            {children}
          </DemoAuth>
        </AuthProvider>
      </body>
    </html>
  );
}
