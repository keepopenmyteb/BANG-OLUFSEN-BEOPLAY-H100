import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "BANG & OLUFSEN BEOPLAY-H100 – Silence Perfected",
  description: "Experience BANG & OLUFSEN’s flagship noise cancelling headphones through an immersive interactive product story.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
