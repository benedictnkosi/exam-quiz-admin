import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://examquiz.co.za'),
  title: {
    default: "Exam Quiz",
    template: "%s | Exam Quiz"
  },
  description: "A comprehensive learning platform for students to practice and prepare for exams. Access thousands of practice questions and improve your academic performance.",
  keywords: ["exam quiz", "education", "exam preparation", "online quiz", "learning platform", "student practice", "academic success"],
  authors: [{ name: "Exam Quiz Team" }],
  creator: "Exam Quiz Team",
  publisher: "Exam Quiz",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://examquiz.co.za",
    siteName: "Exam Quiz",
    title: "Exam Quiz - Your Path to Academic Success",
    description: "A comprehensive learning platform for students to practice and prepare for exams. Access thousands of practice questions and improve your academic performance.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Exam Quiz Learning Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Exam Quiz - Your Path to Academic Success",
    description: "A comprehensive learning platform for students to practice and prepare for exams. Access thousands of practice questions and improve your academic performance.",
    images: ["/og-image.png"],
    creator: "@examquiz",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-site-verification',
  },
  other: {
    'google-site-verification': 'yfhZrnvqHP_FjjF34b1TKGn9-3fUGY5kOe0f-Ls_0QY'
  },
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
            <main className="flex-1">
              {children}
            </main>


          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
