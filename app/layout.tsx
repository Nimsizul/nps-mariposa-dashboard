import './globals.css'

export const metadata = {
  title: 'NPS Mariposa',
  description: 'Dashboard de análisis Net Promoter Score',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
