
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppProviders } from '@/components/layout/AppProviders';
import { fontPairings } from '@/lib/fonts';
// Import new defaults for currency and font
import { DEFAULT_THEME, DEFAULT_DISPLAY_CURRENCY, DEFAULT_LOCAL_CURRENCY, DEFAULT_FONT_THEME_ID_CONST } from '@/lib/types';

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {fontPairings.map(fp => (
          fp.googleFontLink && <link key={fp.id} href={fp.googleFontLink} rel="stylesheet" />
        ))}
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

                  var fontTheme = localStorage.getItem('fontTheme') || '${DEFAULT_FONT_THEME_ID_CONST}';
                  var fontThemeClass = 'font-theme-' + fontTheme;
                  
                  var allFontThemeClasses = [${fontPairings.map(fp => `'font-theme-${fp.id}'`).join(', ')}];
                  allFontThemeClasses.forEach(cls => document.documentElement.classList.remove(cls));
                  
                  document.documentElement.classList.add(fontThemeClass);
                  
                  // Display and Local currency are handled by context reading from localStorage, no direct class needed on <html>
                  // They default to DEFAULT_DISPLAY_CURRENCY and DEFAULT_LOCAL_CURRENCY respectively if not in localStorage.
                } catch (e) { console.error('Error applying initial settings:', e); }
              })();
            `,
          }}
        />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <AppProviders>
          {children}
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}
