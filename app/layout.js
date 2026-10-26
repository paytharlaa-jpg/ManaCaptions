import "./globals.css";
import { AuthProvider } from "@/lib/authContext";

export const metadata = {
  title: "ManaCaptions Studio — AI Captions for Telugu Reels & Shorts",
  description: "Upload a Short, generate accurate Telugu & Romanized captions, customize viral styles (Karaoke, Bold, Negative), check Instagram safe zones, and export post-ready video with ManaCaptions Studio.",
  keywords: "ManaCaptions, Telugu captions, Telugu subtitles, Reels captions, Telugu AI, video subtitle editor, Telugu transcribe, Instagram safe zone",
  authors: [{ name: "ManaCaptions AI" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a0a"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Google Fonts: NTR for Telugu, Anton for Bold/Negative, Montserrat for Karaoke, Inter, Instrument Serif, Outfit */}
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700;800&family=Montserrat:wght@400;600;700;800;900&family=NTR&family=Outfit:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-neutral-950 text-neutral-100 antialiased font-sans selection:bg-orange-500 selection:text-white flex flex-col">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
