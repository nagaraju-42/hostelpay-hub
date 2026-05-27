import type { Metadata, Viewport } from 'next'
import { EB_Garamond, Manrope } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

// ── Sahara Typography ─────────────────────────────────────────────────
// EB Garamond: editorial serif for headings (h1–h6, .font-heading)
const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-garamond',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
})

// Manrope: geometric sans-serif for body, labels, and data
const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope',
  weight: ['300', '400', '500', '600', '700'],
})

// ── Metadata (used by browsers + search engines + social sharing) ─────────
export const metadata: Metadata = {
  title: {
    default:  'HostelPayHub',
    template: '%s | HostelPayHub',
  },
  description: 'Hostel rent and payment management for hostel owners in India',
  keywords:    ['hostel', 'rent management', 'PG', 'payment', 'Hyderabad'],
  authors:     [{ name: 'HostelPayHub' }],
  manifest:    '/manifest.json',

  // Open Graph (WhatsApp / LinkedIn preview)
  openGraph: {
    type:        'website',
    title:       'HostelPayHub',
    description: 'Manage hostel rent payments from your phone',
    siteName:    'HostelPayHub',
  },

  // Apple PWA meta tags (iOS Safari ignores manifest.json)
  appleWebApp: {
    capable:        true,
    statusBarStyle: 'default',
    title:          'HostelPay',
  },

  // Favicons
  icons: {
    icon:   [
      { url: '/icons/icon-96x96.png',  sizes: '96x96',  type: 'image/png' },
      { url: '/icons/icon-192x192.png',sizes: '192x192',type: 'image/png' },
    ],
    apple:  [
      { url: '/icons/icon-152x152.png',sizes: '152x152',type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
}

// ── Viewport (mobile-first, no zoom on input focus) ──────────────────────
export const viewport: Viewport = {
  width:              'device-width',
  initialScale:       1,
  maximumScale:       1,   // prevents zoom on input focus (better UX on mobile)
  userScalable:       false,
  themeColor:         '#c2652a',  // Sahara sienna — matches brand primary
  colorScheme:        'light',
  viewportFit:        'cover',   // full-bleed on iPhone notch/Dynamic Island
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en-IN' className={`${ebGaramond.variable} ${manrope.variable}`}>
      <head>
        {/* iOS Safari: splash screen */}
        <meta name='apple-mobile-web-app-capable' content='yes' />
        <meta name='apple-mobile-web-app-status-bar-style' content='default' />
        <meta name='apple-mobile-web-app-title' content='HostelPay' />
        <link rel='apple-touch-icon' href='/icons/icon-152x152.png' />
        {/* Microsoft Tiles */}
        <meta name='msapplication-TileColor' content='#c2652a' />
        <meta name='msapplication-TileImage' content='/icons/icon-144x144.png' />
      </head>
      <body className='antialiased font-sans'>
        {children}
        <Toaster
          richColors
          position='top-center'
          duration={3000}
          toastOptions={{
            style: {
              fontFamily: 'var(--font-manrope), system-ui, sans-serif',
              background: '#fffcf8',
              border: '1px solid #d8d0c8',
              color: '#2c1f14',
            },
          }}
        />
      </body>
    </html>
  )
}