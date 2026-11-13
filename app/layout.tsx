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
  openGraph: {
    title: "Vercel / 21st Studio - Component Studio & Design Sandbox",
    description:
      "An implementation of Vercel's Geist design language. Author React & Tailwind components in real-time with AST analysis and publish directly to 21st.dev.",
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
