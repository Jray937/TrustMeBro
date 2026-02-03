import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Trust Me Bro Capital",
  description: "Secure. Anonymous. Profitable.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#00ff00",
          colorText: "#00ff00",
          colorBackground: "#000000",
          colorInputBackground: "#111111",
          colorInputText: "#00ff00",
          fontFamily: '"Courier New", Courier, monospace',
        },
        elements: {
          card: {
            border: "1px solid #00ff00",
            boxShadow: "0 0 10px #00ff00",
          },
          formButtonPrimary: {
            backgroundColor: "#00ff00",
            color: "#000000",
            "&:hover": {
              backgroundColor: "#00cc00",
            },
          },
        },
      }}
    >
      <html lang="en">
        <body
          style={{
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
          className="antialiased"
        >
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
