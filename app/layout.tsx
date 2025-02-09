import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Exam Quiz Admin",
  description: "Admin panel for managing exam questions",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Disable Grammarly */}
        <meta name="grammarly-disable-extension" content="true" />
        {/* Disable other extensions that might modify the DOM */}
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
      </head>
      <body
        className={inter.className}
        suppressHydrationWarning
        data-gr-ext-installed="ignore"
      >
        <AuthProvider>
          <div className="flex min-h-screen">
            <main className="flex-1 p-8">
              {children}
            </main>
            <Sidebar />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
