import { NextResponse } from "next/server";

const TELUGU_VOCABULARY = [
  { word: "నమస్కారం", romanized: "namaskaram", category: "greeting" },
  { word: "హలో", romanized: "hello", category: "greeting" },
  { word: "హాయ్", romanized: "hi", category: "greeting" },
  { word: "చూశారా", romanized: "chusara", category: "creator hook" },
  { word: "చూద్దాం", romanized: "chuddam", category: "creator hook" },
  { word: "తెలుసుకుందాం", romanized: "thelusukundam", category: "hook" },
  { word: "కచ్చితంగా", romanized: "kachithamga", category: "emphasis" },
  { word: "ముఖ్యమైన", romanized: "mukhyamaina", category: "adjective" },
  { word: "షేర్ చేయండి", romanized: "share cheyandi", category: "call to action" },
  { word: "సేవ్ చేసుకోండి", romanized: "save chesukondi", category: "call to action" },
  { word: "ఫాలో అవ్వండి", romanized: "follow avvandi", category: "call to action" },
  { word: "లైక్ చేయండి", romanized: "like cheyandi", category: "call to action" },
  { word: "కామెంట్ చేయండి", romanized: "comment cheyandi", category: "call to action" },
  { word: "సబ్‌స్క్రైబ్ చేయండి", romanized: "subscribe cheyandi", category: "call to action" },
  { word: "వీడియో", romanized: "video", category: "creator term" },
  { word: "వీడియోలు", romanized: "videos", category: "creator term" },
  { word: "రీల్స్", romanized: "reels", category: "creator term" },
  { word: "రీల్", romanized: "reel", category: "creator term" },
  { word: "ఫ్రెండ్స్", romanized: "friends", category: "creator term" },
  { word: "ఛానల్", romanized: "channel", category: "creator term" },
  { word: "కంటెంట్", romanized: "content", category: "creator term" },
  { word: "క్రియేటర్", romanized: "creator", category: "creator term" },
  { word: "టిప్స్", romanized: "tips", category: "creator term" },
  { word: "ట్రిక్స్", romanized: "tricks", category: "creator term" },
  { word: "అప్‌డేట్", romanized: "update", category: "creator term" },
  { word: "వైరల్", romanized: "viral", category: "creator term" },
  { word: "ట్రెండింగ్", romanized: "trending", category: "creator term" },
  { word: "క్రేజీ", romanized: "crazy", category: "creator term" },
  { word: "సూపర్", romanized: "super", category: "creator term" },
  { word: "ఈజీ", romanized: "easy", category: "creator term" },
  { word: "ఫ్రీ", romanized: "free", category: "creator term" },
  { word: "టూల్", romanized: "tool", category: "creator term" },
  { word: "ఎడిటింగ్", romanized: "editing", category: "creator term" },
  { word: "క్యాప్షన్స్", romanized: "captions", category: "creator term" },
  { word: "లింక్ బయోలో ఉంది", romanized: "link in bio", category: "call to action" },
  { word: "ఎంగేజ్‌మెంట్", romanized: "engagement", category: "metric" },
  { word: "వైరల్ రీల్స్", romanized: "viral reels", category: "content" }
];

export async function POST(request) {
  try {
    const { query } = await request.json();
    if (!query) {
      return NextResponse.json({ suggestions: [] });
    }

    const q = query.trim().toLowerCase();
    const suggestions = TELUGU_VOCABULARY.filter(item =>
      item.word.includes(q) || item.romanized.includes(q)
    ).slice(0, 8);

    return NextResponse.json({ ok: true, suggestions });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
