import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import Link from 'next/link';
import HeaderAuth from "./components/HeaderAuth";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smart Stock",
  description: "smart stock manager",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={montserrat.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 text-gray-900">
        {/* Auth header with user icon/name and logout */}
        <HeaderAuth/>
        <main className="w-full bg-gray-50 py-24 text-gray-900 mx-auto ">{children}</main>
        <footer className="w-full py-6 text-center text-sm text-gray-600 border-t border-gray-200">
          Developed by
          {' '}
          <a
            href="https://www.linkedin.com/in/ashikur-ovi/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-600 hover:underline"
          >
            Ashikur Rahman Ovi
          </a>
        </footer>
      </body>
    </html>
  );
}
