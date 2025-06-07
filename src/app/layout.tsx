
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppProviders } from '@/components/layout/AppProviders';
// import { fontPairings } from '@/lib/fonts'; // Commented out
// Import new defaults for currency and font
import { DEFAULT_THEME, DEFAULT_DISPLAY_CURRENCY, DEFAULT_LOCAL_CURRENCY } from '@/lib/types'; // DEFAULT_FONT_THEME_ID_CONST removed

export const metadata: Metadata = {
  title: 'PennyPincher AI',
  description: 'Track your expenses with AI-powered categorization.',
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
