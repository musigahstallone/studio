
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppProviders } from '@/components/layout/AppProviders';
import { fontPairings, DEFAULT_FONT_THEME_ID } from '@/lib/fonts'; // DEFAULT_FONT_THEME_ID from fonts.ts
import { DEFAULT_THEME, DEFAULT_CURRENCY } from '@/lib/types'; // Import defaults for theme and currency

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

                  var fontTheme = localStorage.getItem('fontTheme') || '${DEFAULT_FONT_THEME_ID}';
                  var fontThemeClass = 'font-theme-' + fontTheme;
                  
                  ${fontPairings
                    .map(fp => `'font-theme-${fp.id}'`)
                    .join(', ')}.forEach(cls => document.documentElement.classList.remove(cls));
                  
                  document.documentElement.classList.add(fontThemeClass);
                  
                  // Currency is handled by context reading from localStorage, no direct class needed on <html>
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
