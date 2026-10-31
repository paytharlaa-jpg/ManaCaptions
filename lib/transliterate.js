/**
 * Telugu Transliteration Engine (Bidirectional Telugu ⇄ Romanized English)
 * Allows creators to effortlessly toggle between Native Telugu script and Romanized Telugish.
 */

// Comprehensive phonetic dictionary for common conversational Telugu creator phrases
const COMMON_DICTIONARY = [
  { te: "నమస్కారం", en: "namaskaram" },
  { te: "హలో", en: "hello" },
  { te: "హాయ్", en: "hi" },
  { te: "మీరు", en: "meeru" },
  { te: "ఈ", en: "ee" },
  { te: "రీల్", en: "reel" },
  { te: "రీల్స్", en: "reels" },
  { te: "వీడియో", en: "video" },
  { te: "వీడియోలు", en: "videos" },
  { te: "ఫ్రెండ్స్", en: "friends" },
  { te: "ఫ్రెండ్", en: "friend" },
  { te: "చూశారా", en: "chusara" },
  { te: "చూద్దాం", en: "chuddam" },
  { te: "చూడండి", en: "chudandi" },
  { te: "మనం", en: "manam" },
  { te: "మన", en: "mana" },
  { te: "ఒక", en: "oka" },
  { te: "ముఖ్యమైన", en: "mukhyamaina" },
  { te: "విషయం", en: "vishayam" },
  { te: "తెలుసుకుందాం", en: "thelusukundam" },
  { te: "కచ్చితంగా", en: "kachithamga" },
  { te: "సేవ్", en: "save" },
  { te: "చేసుకోండి", en: "chesukondi" },
  { te: "షేర్", en: "share" },
  { te: "చేయండి", en: "cheyandi" },
  { te: "ఫాలో", en: "follow" },
  { te: "అవ్వండి", en: "avvandi" },
  { te: "ఎందుకు", en: "endhuku" },
  { te: "అంటే", en: "ante" },
  { te: "చాలా", en: "chala" },
  { te: "బాగుంది", en: "bagundhi" },
  { te: "బాగుంటుంది", en: "baguntundhi" },
  { te: "ఇది", en: "idhi" },
  { te: "అవును", en: "avunu" },
  { te: "కాదు", en: "kaadhu" },
  { te: "ఇప్పుడు", en: "ippudu" },
  { te: "ఈరోజు", en: "ee roju" },
  { te: "ఈరోజు", en: "eeroju" },
  { te: "రోజు", en: "roju" },
  { te: "కొత్త", en: "kotha" },
  { te: "ట్రిక్", en: "trick" },
  { te: "ట్రిక్స్", en: "tricks" },
  { te: "టిప్", en: "tip" },
  { te: "టిప్స్", en: "tips" },
  { te: "లైక్", en: "like" },
  { te: "లైక్స్", en: "likes" },
  { te: "కామెంట్", en: "comment" },
  { te: "కామెంట్స్", en: "comments" },
  { te: "సబ్‌స్క్రైబ్", en: "subscribe" },
  { te: "సబ్‌స్క్రైబర్స్", en: "subscribers" },
  { te: "ఛానల్", en: "channel" },
  { te: "ఛానల్‌కి", en: "channel ki" },
  { te: "అప్‌డేట్", en: "update" },
  { te: "అప్‌డేట్స్", en: "updates" },
  { te: "కంటెంట్", en: "content" },
  { te: "క్రియేటర్", en: "creator" },
  { te: "క్రియేటర్స్", en: "creators" },
  { te: "పోస్ట్", en: "post" },
  { te: "పోస్ట్స్", en: "posts" },
  { te: "లింక్", en: "link" },
  { te: "బయో", en: "bio" },
  { te: "బయోలో", en: "bio lo" },
  { te: "స్టోరీ", en: "story" },
  { te: "స్టోరీస్", en: "stories" },
  { te: "వైరల్", en: "viral" },
  { te: "ట్రెండింగ్", en: "trending" },
  { te: "క్రేజీ", en: "crazy" },
  { te: "సూపర్", en: "super" },
  { te: "ఈజీ", en: "easy" },
  { te: "ఈజీగా", en: "easy ga" },
  { te: "ఫ్రీ", en: "free" },
  { te: "ఫ్రీగా", en: "free ga" },
  { te: "టూల్", en: "tool" },
  { te: "టూల్స్", en: "tools" },
  { te: "క్యాప్షన్స్", en: "captions" },
  { te: "క్యాప్షన్", en: "caption" },
  { te: "ఎడిటింగ్", en: "editing" },
  { te: "ఎడిట్", en: "edit" },
  { te: "ఆడియో", en: "audio" },
  { te: "గాయ్స్", en: "guys" },
  { te: "బ్రో", en: "bro" },
  { te: "వెబ్‌సైట్", en: "website" },
  { te: "ఆన్‌లైన్", en: "online" },
  { te: "టెక్", en: "tech" },
  { te: "మనీ", en: "money" },
  { te: "క్లిక్", en: "click" },
  { te: "టాప్", en: "tap" },
  { te: "చెక్", en: "check" },
  { te: "ట్రై", en: "try" },
  { te: "వినియోగించండి", en: "use cheyandi" }
];

// Telugu vowels and consonants mapping
const VOWELS = {
  'అ': 'a', 'ఆ': 'aa', 'ఇ': 'i', 'ఈ': 'ee', 'ఉ': 'u', 'ఊ': 'oo',
  'ఋ': 'ru', 'ఎ': 'e', 'ఏ': 'e', 'ఐ': 'ai', 'ఒ': 'o', 'ఓ': 'o', 'ఔ': 'au',
  'ం': 'm', 'ః': 'h'
};

const MATRAS = {
  'ా': 'aa', 'ి': 'i', 'ీ': 'ee', 'ు': 'u', 'ూ': 'oo', 'ృ': 'ru',
  'ె': 'e', 'ే': 'e', 'ై': 'ai', 'ొ': 'o', 'ో': 'o', 'ౌ': 'au',
  'ం': 'm', '్': ''
};

const CONSONANTS = {
  'క': 'k', 'ఖ': 'kh', 'గ': 'g', 'ఘ': 'gh', 'ఙ': 'ng',
  'చ': 'ch', 'ఛ': 'chh', 'జ': 'j', 'ఝ': 'jh', 'ఞ': 'ny',
  'ట': 't', 'ఠ': 'th', 'డ': 'd', 'ఢ': 'dh', 'ణ': 'n',
  'త': 'th', 'థ': 'th', 'ద': 'd', 'ధ': 'dh', 'న': 'n',
  'ప': 'p', 'ఫ': 'f', 'బ': 'b', 'భ': 'bh', 'మ': 'm',
  'య': 'y', 'ర': 'r', 'ల': 'l', 'వ': 'v', 'శ': 'sh',
  'ష': 'sh', 'స': 's', 'హ': 'h', 'ళ': 'l', 'క్ష': 'ksh', 'ఱ': 'r'
};

/**
 * Convert Telugu unicode script to Romanized English
 */
export function teluguToRomanized(text) {
  if (!text) return "";
  let words = text.split(/(\s+)/);
  return words.map(w => {
    // Preserve leading/trailing punctuation
    const punctMatch = w.match(/^([^\u0C00-\u0C7Fa-zA-Z0-9]*)([\u0C00-\u0C7Fa-zA-Z0-9\s]+?)([^\u0C00-\u0C7Fa-zA-Z0-9]*)$/);
    const prefix = punctMatch ? punctMatch[1] : "";
    const clean = punctMatch ? punctMatch[2].trim() : w.trim();
    const suffix = punctMatch ? punctMatch[3] : "";

    if (!clean) return w;

    // Check dictionary first
    let dict = COMMON_DICTIONARY.find(d => d.te === clean);
    if (dict) return prefix + dict.en + suffix;

    // Fallback phonetic transliteration
    let result = "";
    let i = 0;
    while (i < clean.length) {
      let char = clean[i];
      let nextChar = clean[i + 1];

      if (VOWELS[char]) {
        result += VOWELS[char];
        i++;
      } else if (CONSONANTS[char]) {
        let cons = CONSONANTS[char];
        if (nextChar && MATRAS[nextChar] !== undefined) {
          result += cons + MATRAS[nextChar];
          i += 2;
        } else if (nextChar === '్') {
          result += cons;
          i += 2;
        } else {
          result += cons + 'a';
          i++;
        }
      } else {
        result += char;
        i++;
      }
    }
    return prefix + (result || clean) + suffix;
  }).join("");
}

/**
 * Convert Romanized English to Telugu script
 */
export function romanizedToTelugu(text) {
  if (!text) return "";
  let words = text.split(/(\s+)/);
  return words.map(w => {
    // Preserve leading/trailing punctuation
    const punctMatch = w.match(/^([^a-zA-Z0-9\u0C00-\u0C7F]*)([a-zA-Z0-9\u0C00-\u0C7F]+?)([^a-zA-Z0-9\u0C00-\u0C7F]*)$/);
    const prefix = punctMatch ? punctMatch[1] : "";
    const clean = punctMatch ? punctMatch[2].trim().toLowerCase() : w.trim().toLowerCase();
    const suffix = punctMatch ? punctMatch[3] : "";

    if (!clean) return w;

    let dict = COMMON_DICTIONARY.find(d => d.en.toLowerCase() === clean);
    if (dict) return prefix + dict.te + suffix;
    return w;
  }).join("");
}

/**
 * Check if string contains Telugu unicode characters
 */
export function isTeluguScript(text) {
  return /[\u0C00-\u0C7F]/.test(text);
}
