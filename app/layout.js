import "./globals.css";

export const metadata = {
  title: "Tarot trīs kāršu izlikums",
  description: "Trīs kāršu tarot izlikums ar ārēju bilžu hostingu.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
