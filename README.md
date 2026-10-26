# ManaCaptions Studio 🎬✨

> **AI Captions & Subtitles for Telugu Creators, Reels & Shorts**

ManaCaptions Studio is a high-performance web platform designed specifically for Telugu content creators. It automates speech recognition, dual-script captioning (Native Telugu లిపి & Romanized Telugu), viral style animation presets (Karaoke, Negative, Bold, Minimal), Instagram safe-zone checking, and burned-in MP4 export.

---

## 🚀 Key Features

- **Dual-Script Telugu Subtitles**: Generate both Native Telugu script (తెలుగు లిపి) and Romanized phonetic Telugu (*"Meeru ee reel ni chusara"*) simultaneously.
- **Multimodal AI Transcription**: Integrated with Google Gemini 2.5 Flash, Groq Whisper, and Indic ASR engines.
- **Viral Caption Presets**: 
  - 🎤 **Karaoke Active Word Fill**: Word-by-word synced glowing highlights.
  - ⚡ **Negative Impact**: Dynamic inverted background boxes.
  - 💥 **Bold Creator Pop**: Chunky text with drop shadow for short-form retention.
  - 🎨 **Minimal / Editorial**: Clean typography for interviews and podcasts.
- **Social Safe-Zone Overlay**: Interactive 9:16 Instagram Reels / YouTube Shorts safe zone overlay so captions are never blocked by UI elements.
- **Burned-in MP4 & Subtitle Export**: Client-side canvas/video pipeline for burned-in video rendering plus instant SRT / VTT subtitle downloads.
- **Creator Dashboard & Auth**: Google OAuth 2.0 login and credit-based processing workflow.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Turbopack)
- **UI & Icons**: [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
- **Typography**: NTR (Telugu), Anton, Montserrat, Inter, Outfit
- **AI / Speech**: Google Gemini API, Groq Whisper

---

## 🏁 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/paytharlaa-jpg/ManaCaptions.git
cd ManaCaptions
npm install
```

### 2. Configure Environment

Copy the example environment configuration:

```bash
cp .env.example .env.local
```

Add your API keys in `.env.local`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
# Optional alternatives:
GROQ_API_KEY=your_groq_api_key_here
SARVAM_API_KEY=your_sarvam_key_here
```

### 3. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the studio.

---

## 📄 License

MIT © 2026 ManaCaptions
