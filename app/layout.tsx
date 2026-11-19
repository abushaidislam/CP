import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vercel / 21st Studio - Component Studio & Design Sandbox",
  description:
    "An implementation of Vercel's Geist design language. Author React & Tailwind components in real-time with AST analysis and publish directly to 21st.dev.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/brand/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/app-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/brand/app-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Vercel / 21st Studio - Component Studio & Design Sandbox",
    description:
      "An implementation of Vercel's Geist design language. Author React & Tailwind components in real-time with AST analysis and publish directly to 21st.dev.",
    images: [
      {
        url: "/brand/og-card.png",
        width: 1200,
        height: 630,
        alt: "Component Studio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vercel / 21st Studio - Component Studio & Design Sandbox",
    description:
      "An implementation of Vercel's Geist design language. Author React & Tailwind components in real-time with AST analysis and publish directly to 21st.dev.",
    images: ["/brand/og-card.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} dark min-h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://cdn.tailwindcss.com" crossOrigin="" />
        <link rel="preconnect" href="https://esm.sh" crossOrigin="" />
        <link rel="dns-prefetch" href="https://cdn.tailwindcss.com" />
        <link rel="dns-prefetch" href="https://esm.sh" />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-full bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 selection:text-foreground"
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:font-sans focus:text-xs focus:font-medium focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Skip to main content
        </a>
        <TooltipProvider delayDuration={80}>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
