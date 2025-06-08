
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppProviders } from '@/components/layout/AppProviders';
// import { fontPairings } from '@/lib/fonts'; // Commented out
// Import new defaults for currency and font
import { DEFAULT_THEME, DEFAULT_DISPLAY_CURRENCY, DEFAULT_LOCAL_CURRENCY } from '@/lib/types'; // DEFAULT_FONT_THEME_ID_CONST removed

const APP_NAME = 'PennyPincher AI';
const APP_DESCRIPTION = 'Effortlessly manage your expenses, budgets, and savings goals with PennyPincher AI. AI-powered expense tracking from text & receipts, multi-currency support, and intelligent financial insights.';

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json", // Assuming you might add a manifest later
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  keywords: ['expense tracker', 'budgeting app', 'personal finance', 'ai finance', 'savings goals', 'multi-currency', 'financial management'],
  authors: [{ name: 'Stallone Musigah', url: 'https://musigahstallone.tech' }],
  creator: 'Stallone Musigah',
  publisher: 'PennyPincher AI',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'), // Replace with your actual domain in .env
  openGraph: {
    type: 'website',
    siteName: APP_NAME,
    title: {
        default: APP_NAME,
        template: `%s | ${APP_NAME}`,
    },
    description: APP_DESCRIPTION,
    url: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'), // Replace with your actual domain
    images: [
      {
        url: 'https://placehold.co/1200x630.png?text=PennyPincher+AI', // Replace with your actual OG image
        width: 1200,
        height: 630,
        alt: `${APP_NAME} - Smart Financial Management`,
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
    images: ['https://placehold.co/1200x630.png?text=PennyPincher+AI'], // Replace with your actual Twitter image
    // creator: '@yourtwitterhandle', // Optional: if you have a Twitter handle
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
        {/*
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {fontPairings.map(fp => (
          fp.googleFontLink && <link key={fp.id} href={fp.googleFontLink} rel="stylesheet" />
        ))}
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || '${DEFAULT_THEME}';
                  if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }

                  // var fontTheme = localStorage.getItem('fontTheme') || 'default-font-placeholder'; // Commented out: DEFAULT_FONT_THEME_ID_CONST was here
                  // var fontThemeClass = 'font-theme-' + fontTheme; // Commented out
                  
                  // var allFontThemeClasses = []; // Commented out: fontPairings.map was here
                  // allFontThemeClasses.forEach(cls => document.documentElement.classList.remove(cls)); // Commented out
                  
                  // document.documentElement.classList.add(fontThemeClass); // Commented out
                  
                } catch (e) { console.error('Error applying initial settings:', e); }
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased bg-background text-foreground"> {/* Changed to font-sans for default */}
        <AppProviders>
          {children}
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}
