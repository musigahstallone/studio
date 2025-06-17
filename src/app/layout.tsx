
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppProviders } from '@/components/layout/AppProviders';
import { DEFAULT_THEME, DEFAULT_DISPLAY_CURRENCY, DEFAULT_LOCAL_CURRENCY } from '@/lib/types';

const APP_NAME = 'SM Cash';
const APP_DESCRIPTION = 'Effortlessly manage your expenses, budgets, and savings goals with SM Cash. AI-powered expense tracking from text & receipts, multi-currency support, and intelligent financial insights.';

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  keywords: ['expense tracker', 'budgeting app', 'personal finance', 'ai finance', 'savings goals', 'multi-currency', 'financial management', 'kenya finance', 'm-pesa tracking', 'budget app kenya'],
  authors: [{ name: 'Stallone Musigah', url: 'https://musigahstallone.tech' }],
  creator: 'Stallone Musigah',
  publisher: 'SM Cash',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'),
  openGraph: {
    type: 'website',
    siteName: APP_NAME,
    title: {
      default: APP_NAME,
      template: `%s | ${APP_NAME}`,
    },
    description: APP_DESCRIPTION,
    url: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'),
    images: [
      {
        url: 'https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&dpr=1', 
        width: 1200,
        height: 630,
        alt: `${APP_NAME} - Smart Financial Management`,
        'data-ai-hint': 'finance abstract purple',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: {
      default: APP_NAME,
      template: `%s | ${APP_NAME}`,
    },
    description: APP_DESCRIPTION,
    images: ['https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&dpr=1'], 
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var storedTheme = localStorage.getItem('theme');
                  if (storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) { console.error('Error applying initial theme:', e); }
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased bg-background text-foreground"> {/* Removed font-sans as it's now applied via CSS var */}
        <AppProviders>
          {children}
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}
