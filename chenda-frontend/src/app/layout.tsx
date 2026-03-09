import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ErrorBoundary } from "@/components/providers/error-boundary";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chenda — Fresh Market",
  description:
    "Proximity & freshness marketplace for perishable goods. Find the freshest products near you.",
  icons: { icon: "/chenda.png" },
  // Security: prevent browsers from MIME-sniffing responses
  other: {
    "X-Content-Type-Options": "nosniff",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="overflow-x-hidden max-w-[100vw]">
      <head>
        {/* Content-Security-Policy: restricts resource origins to prevent XSS */}
        <meta
          httpEquiv="Content-Security-Policy"
          content={[
            "default-src 'self'",
            // Scripts: self + Next.js inline scripts
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            // Styles: self + inline (shadcn/ui uses inline styles)
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
            // Fonts
            "font-src 'self' https://fonts.gstatic.com",
            // Images: self + data URIs (Next.js image optimization) + OSM tile servers
            "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://nominatim.openstreetmap.org",
            // API connections: self + backend + OSM APIs
            "connect-src 'self' http://localhost:3001 https://nominatim.openstreetmap.org",
            // Map tiles from unpkg (Leaflet)
            "worker-src blob:",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
          ].join("; ")}
        />
        {/* Prevent clickjacking */}
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        {/* Disable MIME type sniffing */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden max-w-[100vw] w-full`}
      >
        <AuthProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <Toaster position="top-center" richColors closeButton />
        </AuthProvider>
      </body>
    </html>
  );
}
