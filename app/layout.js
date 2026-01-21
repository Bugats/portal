import "./globals.css";

export const metadata = {
  title: "Tarot three-card draw",
  description: "Three-card tarot draw using external hosting.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
