import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('http://howwasyourdayhoney.vercel.app'),
  title: 'How was your day honey?',
  description: 'Convert videos to ASCII frames and play them with a lightweight JS player',
  keywords: ['ASCII art', 'video conversion', 'frames', 'terminal art'],
  authors: [{ name: 'Ojus G' }],
  icons: {
    icon: '/scene-logo.png',
    apple: '/scene-logo.png',
  },
  openGraph: {
    title: 'How was your day honey?',
    description: 'Convert videos to ASCII frames and play them with a lightweight JS player',
    type: 'website',
    images: [
      {
        url: '/opengraph-image.webp',
        width: 1200,
        height: 630,
        alt: 'How was your day honey?',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How was your day honey?',
    description: 'Convert videos to ASCII frames and play them with a lightweight JS player',
    images: ['/opengraph-image.webp'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-white font-sans">
        {children}
      </body>
    </html>
  )
}