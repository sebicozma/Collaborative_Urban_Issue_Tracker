import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Urban Issues Admin",
  description: "Administrative dashboard for the Urban Issues platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
