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
  keywords: ["exam quiz", "education", "exam preparation", "online quiz", "learning platform", "student practice", "academic success", "past paper exam questions", "mathematics grade 12", "Matric live", "Grade 11 study", "grade 10 guide South Africa", "ieb", "nsc", "caps"],
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
    title: "Exam Quiz - Past Paper Exam Questions",
    description: "A comprehensive learning platform for students to practice and prepare for exams. Access thousands of practice questions and improve your academic performance.",
    images: [
      {
        url: "https://examquiz.dedicated.co.za/public/learn/learner/get-image?image=og-image.png",
        width: 1200,
        height: 630,
        alt: "Exam Quiz Learning Platform",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Exam Quiz - Past Paper Exam Questions",
    description: "A comprehensive learning platform for students to practice and prepare for exams. Access thousands of practice questions and improve your academic performance. For grade 10, 11, and 12 learners. mathematics grade 12,Matric live,Grade 11 study,grade 10 guide South Africa,ieb,nsc,caps",
    images: [{
      url: "https://examquiz.dedicated.co.za/public/learn/learner/get-image?image=og-image.png",
      width: 1200,
      height: 630,
      alt: "Exam Quiz Learning Platform",
    }],
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
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
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
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:url" content="https://examquiz.co.za" />
        <meta property="og:site_name" content="Exam Quiz" />
        <meta property="og:title" content="Exam Quiz - Past Paper Exam Questions" />
        <meta property="og:description" content="A comprehensive learning platform for students to practice and prepare for exams. Access thousands of practice questions and improve your academic performance." />
        <meta property="og:image" content="https://examquiz.dedicated.co.za/public/learn/learner/get-image?image=og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Exam Quiz Learning Platform" />
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
