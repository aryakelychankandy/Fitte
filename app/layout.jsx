import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import SmoothScrollProvider from "@/lib/lenis";
import Preloader from "@/components/Preloader";
import { DriftProvider } from "@/lib/store";
import Toaster from "@/components/ui/Toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata = {
  title: "DRIFT — Your wardrobe, styled. Your fit, stitched.",
  description:
    "DRIFT is an AI-powered personal stylist, digital wardrobe and custom stitching platform. It learns your clothes, colours and fit, decides what you wear, and makes what is missing.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="bg-offwhite font-sans text-ink antialiased">
        <Preloader />
        <DriftProvider>
          <SmoothScrollProvider>{children}</SmoothScrollProvider>
          <Toaster />
        </DriftProvider>
      </body>
    </html>
  );
}
