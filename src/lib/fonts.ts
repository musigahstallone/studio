
// src/lib/fonts.ts

export interface FontPairing {
  id: string;
  name: string;
  headlineFont: string; // Google Font name for headline
  bodyFont: string;     // Google Font name for body
  headlineStack: string; // CSS font-family stack for headline
  bodyStack: string;     // CSS font-family stack for body
  googleFontLink?: string; // Optional: if a single link covers both, or for specific weights/styles
  description: string;
}

export const fontPairings: FontPairing[] = [
  {
    id: 'manrope-lora',
    name: 'Manrope + Lora',
    headlineFont: 'Manrope',
    bodyFont: 'Lora',
    headlineStack: "'Manrope', sans-serif",
    bodyStack: "'Lora', serif",
    googleFontLink: "https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&family=Lora:ital,wght@0,400..700;1,400..700&display=swap",
    description: 'Combines modern finance UI with traditional trust. Manrope for UI, Lora for titles.',
  },
  {
    id: 'inter-merriweather',
    name: 'Inter + Merriweather',
    headlineFont: 'Merriweather',
    bodyFont: 'Inter',
    headlineStack: "'Merriweather', serif",
    bodyStack: "'Inter', sans-serif",
    googleFontLink: "https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400;1,700;1,900&display=swap",
    description: 'Clean, professional feel with a hint of formality. Inter for UI, Merriweather for headings.',
  },
  {
    id: 'work-sans-dm-serif-display',
    name: 'Work Sans + DM Serif Display',
    headlineFont: 'DM Serif Display',
    bodyFont: 'Work Sans',
    headlineStack: "'DM Serif Display', serif",
    bodyStack: "'Work Sans', sans-serif",
    googleFontLink: "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Work+Sans:ital,wght@0,100..900;1,100..900&display=swap",
    description: 'Professional + premium feel for fintech brands. Work Sans for interfaces, DM Serif Display for headers.',
  },
  {
    id: 'poppins-source-serif-pro',
    name: 'Poppins + Source Serif Pro',
    headlineFont: 'Source Serif Pro', // Or Poppins, depending on which is headline
    bodyFont: 'Poppins', // Or Source Serif Pro
    headlineStack: "'Source Serif Pro', serif", // Assuming Source Serif Pro is for headlines
    bodyStack: "'Poppins', sans-serif",       // Assuming Poppins is for body/UI
    googleFontLink: "https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&display=swap",
    description: 'High readability + elegance, great for dashboards. Poppins for UI, Source Serif Pro for titles.',
  },
  {
    id: 'space-grotesk-eb-garamond',
    name: 'Space Grotesk + EB Garamond',
    headlineFont: 'EB Garamond',
    bodyFont: 'Space Grotesk',
    headlineStack: "'EB Garamond', serif",
    bodyStack: "'Space Grotesk', sans-serif",
    googleFontLink: "https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..800;1,400..800&family=Space+Grotesk:wght@300..700&display=swap",
    description: 'Appeals to trust and precision — perfect for fintech/legal-financial documents. Space Grotesk for UI, EB Garamond for classical appearance.',
  },
];

export const DEFAULT_FONT_THEME_ID = 'space-grotesk-eb-garamond';
