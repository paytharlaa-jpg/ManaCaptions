export const FONT_REGISTRY = [
  { family: "Noto Sans Telugu", weights: [400, 600, 800], telugu: true },
  { family: "Noto Serif Telugu", weights: [400, 600, 800], telugu: true },
  { family: "Hind Guntur", weights: [400, 600, 700], telugu: true },
  { family: "Mandali", weights: [400], telugu: true },
  { family: "Outfit", weights: [400, 600, 800], telugu: false },
  { family: "Poppins", weights: [400, 600, 800], telugu: false },
  { family: "Montserrat", weights: [400, 600, 800], telugu: false },
  { family: "Inter", weights: [400, 600, 800], telugu: false },
] as const;
export function fontStack(family: string) {
  return `"${family}", "Noto Sans Telugu", sans-serif`;
}
export const EDITOR_FONT_URL = "https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu:wght@400;600;800&family=Noto+Serif+Telugu:wght@400;600;800&family=Hind+Guntur:wght@400;600;700&family=Mandali&family=Outfit:wght@400;600;800&family=Poppins:wght@400;600;800&family=Montserrat:wght@400;600;800&family=Inter:wght@400;600;800&display=swap";