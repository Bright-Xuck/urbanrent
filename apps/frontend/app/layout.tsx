import { Fraunces, Inter } from "next/font/google";
import type { ReactNode } from "react";
import { AuthBootstrap } from "../components/auth/AuthBootstrap";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "UrbanRent | Find a home in Cameroon",
  description: "Discover trusted rental homes in Buea, Douala, and Yaoundé.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="font-sans antialiased">
        <AuthBootstrap>{children}</AuthBootstrap>
      </body>
    </html>
  );
}
