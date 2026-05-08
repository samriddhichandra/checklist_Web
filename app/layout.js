import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";

const uiSans = Plus_Jakarta_Sans({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata = {
  title: "Trial SOP Checklist",
  description: "RailwayMitra POC2 trial SOP checklist",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${uiSans.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}
