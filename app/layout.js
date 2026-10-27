import "./globals.css";
import { AuthProvider } from "@/lib/authContext";

export const metadata = {
  title: "ManaCaption — Futuristic AI Auto-Captions for Telugu Creators",
  description: "Create viral dual-script Telugu subtitles, sync song lyrics with Google Gemini 2.5 Flash, and export post-ready reels with ManaCaption.",
  keywords: "ManaCaption, Telugu captions, Telugu subtitles, Reels captions, Telugu AI, video subtitle editor",
  authors: [{ name: "ManaCaption AI" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#060919"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark h-full" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700;800&family=Montserrat:wght@400;600;700;800;900&family=NTR&family=Outfit:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-[#060919] text-[#F8F3F0] antialiased font-sans selection:bg-[#20309A] selection:text-[#F8F3F0] flex flex-col" suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
