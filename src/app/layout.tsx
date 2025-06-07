
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppProviders } from '@/components/layout/AppProviders';
import { DEFAULT_FONT_THEME_ID, fontPairings } from '@/lib/fonts';

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
        {/* Include all font links needed for the selectable themes */}
        {fontPairings.map(fp => (
          fp.googleFontLink && <link key={fp.id} href={fp.googleFontLink} rel="stylesheet" />
        ))}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }

                  var fontTheme = localStorage.getItem('fontTheme') || '${DEFAULT_FONT_THEME_ID}';
                  var fontThemeClass = 'font-theme-' + fontTheme;
                  document.documentElement.classList.add(fontThemeClass);
                  
                  // Remove any other font theme classes
                  ${fontPairings
                    .map(fp => fp.id)
                    .filter(id => id !== DEFAULT_FONT_THEME_ID) // Don't try to remove the default if it's the one being set
                    .map(id => `document.documentElement.classList.remove('font-theme-${id}');`)
                    .join('\n')}
                  if (fontTheme !== '${DEFAULT_FONT_THEME_ID}') { // Ensure the currently applied one is added
                     document.documentElement.classList.add('font-theme-' + fontTheme);
                  }


                } catch (e) { console.error('Error applying initial theme/font:', e); }
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
