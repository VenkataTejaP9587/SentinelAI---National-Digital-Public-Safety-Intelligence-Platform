import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "600"] });

export const metadata: Metadata = {
  title: "SentinelAI — National Digital Public Safety Intelligence Platform",
  description:
    "India's first AI-powered Digital Public Safety Intelligence Platform defeating counterfeiting, fraud & digital arrest scams. Smart India Hackathon 2024.",
  keywords: "cybercrime, fraud detection, digital arrest, counterfeit currency, AI safety, India, SIH 2024",
  openGraph: {
    title: "SentinelAI — National Digital Public Safety Intelligence Platform",
    description: "Defeating Counterfeiting, Fraud & Digital Arrest Scams with AI",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${mono.variable} font-sans antialiased bg-[#070b14] text-slate-100 w-full`}>
        {children}
      </body>
    </html>
  );
}
