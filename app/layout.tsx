import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://examquiz.co.za'),
  title: {
    default: "Dimpo Learning App",
    template: "%s | Dimpo Learning App"
  },
  description: "A comprehensive learning platform for students to practice and prepare for exams. Access thousands of practice questions and improve your academic performance.",
  keywords: ["Dimpo Learning App", "education", "exam preparation", "online quiz", "learning platform", "student practice", "academic success", "past paper exam questions", "mathematics grade 12", "Matric live", "Grade 11 study", "grade 10 guide South Africa", "ieb", "nsc", "caps"],
  authors: [{ name: "Dimpo Learning App Team" }],
  creator: "Dimpo Learning App Team",
  publisher: "Dimpo Learning App",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://examquiz.co.za",
    siteName: "Dimpo Learning App",
    title: "Dimpo Learning App - Past Paper Exam Questions",
    description: "A comprehensive learning platform for students to practice and prepare for exams. Access thousands of practice questions and improve your academic performance.",
    images: [
      {
        url: "https://examquiz.dedicated.co.za/public/learn/learner/get-image?image=og-image.png",
        width: 1200,
        height: 630,
        alt: "Dimpo Learning App Learning Platform",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dimpo Learning App - Past Paper Exam Questions",
    description: "A comprehensive learning platform for students to practice and prepare for exams. Access thousands of practice questions and improve your academic performance. For grade 10, 11, and 12 learners. mathematics grade 12,Matric live,Grade 11 study,grade 10 guide South Africa,ieb,nsc,caps",
    images: [{
      url: "https://examquiz.dedicated.co.za/public/learn/learner/get-image?image=og-image.png",
      width: 1200,
      height: 630,
      alt: "Dimpo Learning App Learning Platform",
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
        <meta property="og:site_name" content="Dimpo Learning App" />
        <meta property="og:title" content="Dimpo Learning App - Past Paper Exam Questions" />
        <meta property="og:description" content="A comprehensive learning platform for students to practice and prepare for exams. Access thousands of practice questions and improve your academic performance." />
        <meta property="og:image" content="https://examquiz.dedicated.co.za/public/learn/learner/get-image?image=og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Dimpo Learning App Learning Platform" />
      </head>
      <body
        className={inter.className}
        suppressHydrationWarning
        data-gr-ext-installed="ignore"
      >
        <ThemeProvider>
          <AuthProvider>
            <div className="flex min-h-screen">
              <main className="flex-1">
                {children}
              </main>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
