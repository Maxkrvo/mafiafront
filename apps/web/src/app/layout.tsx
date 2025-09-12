import type { Metadata } from "next";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "MafiaFront",
  description: "A Sopranos-inspired web experience",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
