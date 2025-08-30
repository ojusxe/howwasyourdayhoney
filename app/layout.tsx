import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ASCII Frame Generator',
  description: 'Convert short videos into ASCII art frames with customizable settings',
  keywords: ['ASCII art', 'video conversion', 'frames', 'terminal art'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white">
        {children}
      </body>
    </html>
  )
}