import "./globals.css";

export const metadata = {
  title: "Beoplay H100",
  description: "Next.js Project Setup",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
