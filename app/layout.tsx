import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Trust Me Bro Capital",
  description: "Secure. Anonymous. Profitable.",
};

// Force dynamic rendering for authentication
export const dynamic = 'force-dynamic';

// Use Edge Runtime for Cloudflare Pages compatibility
export const runtime = 'edge';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
