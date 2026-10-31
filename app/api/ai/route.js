import { NextResponse } from "next/server";
import { teluguToRomanized, romanizedToTelugu } from "@/lib/transliterate";
import { getAuthenticatedUser } from "@/lib/authServer";
import { PRICING_RULES } from "@/config/pricing";
import { createJob, updateJobStatus, deductCreditsAtomically, refundCreditsAtomically } from "@/lib/db";

// Comprehensive Telugu & English viral keyword to emoji dictionary
const EMOJI_DICTIONARY = [
  // Viral & Energy
  { keywords: ["వైరల్", "viral", "fire", "trending"], emoji: "🔥" },
  { keywords: ["క్రేజీ", "crazy", "pichi", "insane"], emoji: "🤯" },
  { keywords: ["షాకింగ్", "shocking", "surprise"], emoji: "😱" },
  { keywords: ["సూపర్", "super", "awesome", "adbhutam"], emoji: "⚡" },
  { keywords: ["మ్యాజిక్", "magic", "miracle"], emoji: "✨" },

  // Secrets & Tricks
  { keywords: ["సీక్రెట్", "secret", "rahasyam"], emoji: "🤫" },
  { keywords: ["ట్రిక్", "trick", "hacks", "hack"], emoji: "💡" },
  { keywords: ["తప్పు", "mistake", "danger", "warning", "vaddu"], emoji: "⚠️" },
  { keywords: ["సత్యం", "truth", "nijam"], emoji: "🎯" },

  // Money & Wealth
  { keywords: ["లక్షలు", "lakhs", "dabbu", "money", "income", "crores", "kotlu"], emoji: "💰" },
  { keywords: ["లాభం", "profit", "earnings"], emoji: "📈" },
  { keywords: ["ఉచితం", "free", "offer"], emoji: "🎁" },

  // Tech & AI
  { keywords: ["ai", "robot", "artificial"], emoji: "🤖" },
  { keywords: ["రీల్స్", "reels", "video", "shorts"], emoji: "📱" },
  { keywords: ["కెమెరా", "camera", "shooting"], emoji: "🎬" },

  // Speed & Time
  { keywords: ["నిమిషాల్లో", "minutes", "seconds", "fast", "speed", "ventane"], emoji: "⏱️" },
  { keywords: ["రాకెట్", "rocket", "growth", "boost"], emoji: "🚀" },

  // Call to action
  { keywords: ["సేవ్", "save", "save chesukondi"], emoji: "📥" },
  { keywords: ["షేర్", "share", "pampandi"], emoji: "↗️" },
  { keywords: ["ఫాలో", "follow", "subscribe"], emoji: "🔔" },
  { keywords: ["కామెంట్", "comment"], emoji: "💬" }
];

// Fallback Rule-based Emoji Injector
function injectEmojisLocal(text) {
  if (!text) return text;
  let modified = text;

  for (const item of EMOJI_DICTIONARY) {
    for (const kw of item.keywords) {
      if (modified.includes(item.emoji)) continue;

      const regex = new RegExp(`(^|\\s)(${kw})(\\b|\\s|$)`, "i");
      if (regex.test(modified)) {
        modified = modified.replace(regex, `$1$2 ${item.emoji} `).trim();
        break;
      }
    }
  }
  return modified.replace(/\s+/g, " ").trim();
}

// Fallback Rule-based Grammar / Polish
function polishTextLocal(text) {
  if (!text) return text;
  let clean = text.trim();
  if (/^[a-zA-Z]/.test(clean)) {
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
  }
  clean = clean.replace(/\s+([?,.!])/g, "$1");
  return clean;
}

// Fallback Rule-based Hook & Caption Generator
function generateHooksLocal(segments) {
  return {
    hooks: [
      "🔥 ఈ ఒక్క సీక్రెట్ ట్రిక్ మీ రీల్స్‌ని వైరల్ చేస్తుంది!",
      "🤫 99% మంది క్రియేటర్స్‌కి ఈ AI ట్రిక్ తెలీదు!",
      "⚡ కేవలం 2 నిమిషాల్లో ఈ రిజల్ట్ ఎలా సాధ్యం?"
    ],
    postCaption: `🚀 మీ రీల్స్ ఎంగేజ్‌మెంట్‌ని 10X పెంచుకోవాలనుకుంటున్నారా?\n\nఈ సీక్రెట్ ట్రిక్ ని ఇప్పుడే ట్రై చేయండి! Save this reel for later 📥\n\n📌 Tag a friend who needs to see this!\n\n#TeluguReels #TeluguCreators #ViralTelugu #TeluguAI #ContentCreatorHyderabad #ReelsTips`,
    hashtags: ["#TeluguReels", "#TeluguCreators", "#ViralTelugu", "#TeluguAI", "#ReelsTips"]
  };
}

// Fallback Local Telugu Converter
function translateTeluguLocal(segments) {
  return segments.map(seg => {
    const raw = seg.text || seg.romanizedText || "";
    if (/[\u0C00-\u0C7F]/.test(raw)) {
      return seg;
    }
    const teText = romanizedToTelugu(raw);
    const teWords = teText.trim().split(/\s+/).filter(Boolean);
    const dur = Math.max(0.1, (seg.end || 2.5) - (seg.start || 0));
    const wDur = dur / Math.max(1, teWords.length);
    const newWords = teWords.map((w, i) => ({
      word: w,
      romanized: w,
      start: Number(((seg.start || 0) + i * wDur).toFixed(2)),
      end: Number(((seg.start || 0) + (i + 1) * wDur).toFixed(2))
    }));
    return {
      ...seg,
      text: teText,
      romanizedText: raw,
      words: newWords
    };
  });
}

/**
 * Robust Gemini model caller with automatic model fallback
 */
async function callGemini(geminiKey, prompt, timeoutMs = 8000) {
  const models = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-flash-lite-latest"];
  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          signal: AbortSignal.timeout(timeoutMs),
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        }
      );
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }
    } catch {
      // try next model
    }
  }
  return null;
}

/**
 * Fast Groq LLM-powered Telugu subtitle translator (completes in ~1.2s)
 */
async function translateWithGroq(segments) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey || !segments || segments.length === 0) return null;

  try {
    const inputLines = segments.map(s => ({ id: s.id, text: s.text || s.romanizedText }));
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(7000),
      headers: {
        Authorization: "Bearer " + groqKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: 'You are an expert Telugu subtitle converter for video reels. Convert English or Telugish lines into authentic Native Telugu script (తెలుగు లిపి) with zero spelling mistakes and keep verbatim spoken line in romanizedText. Keep standard creator terms in standard Telugu spelling: "వీడియో", "రీల్స్", "ఫ్రెండ్స్", "షేర్", "ఫాలో", "లైక్", "సబ్‌స్క్రైబ్", "ఛానల్", "టిప్స్", "కామెంట్". CRITICAL: DO NOT analyze the speaker meaning, do not rephrase or summarize. Return valid JSON schema: {"segments": [{"id": "...", "text": "తెలుగు లిపి", "romanizedText": "verbatim spoken words"}]}'
          },
          {
            role: "user",
            content: JSON.stringify(inputLines)
          }
        ]
      })
    });

    if (res.ok) {
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        const translatedList = parsed.segments || parsed.translations || [];
        if (Array.isArray(translatedList) && translatedList.length > 0) {
          const map = new Map(translatedList.map(t => [t.id, t]));
          return segments.map(seg => {
            const match = map.get(seg.id);
            if (match && match.text) {
              const words = match.text.trim().split(/\s+/).filter(Boolean);
              const duration = Math.max(0.1, (seg.end || 2.5) - (seg.start || 0));
              const wordDur = duration / Math.max(1, words.length);
              const updatedWords = words.map((w, idx) => ({
                word: w,
                romanized: teluguToRomanized(w),
                start: Number(((seg.start || 0) + idx * wordDur).toFixed(2)),
                end: Number(((seg.start || 0) + (idx + 1) * wordDur).toFixed(2))
              }));

              return {
                ...seg,
                text: match.text,
                romanizedText: match.romanizedText || seg.romanizedText || seg.text,
                words: updatedWords
              };
            }
            return seg;
          });
        }
      }
    }
  } catch (err) {
    console.warn("Groq translate_telugu failed:", err.message);
  }
  return null;
}

export async function POST(request) {
  try {
    const { action, segments, scriptMode } = await request.json();

    if (!segments || !Array.isArray(segments)) {
      return NextResponse.json({ ok: false, error: "Segments array required" }, { status: 400 });
    }

    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    // 1. FAST TRANSLATION TO TELUGU SCRIPT
    if (action === "translate_telugu") {
      const { authenticated, user } = getAuthenticatedUser(request);
      if (!authenticated || !user) {
        return NextResponse.json(
          { ok: false, error: "Please sign in to translate captions.", code: "AUTH_REQUIRED" },
          { status: 401 }
        );
      }

      const maxEnd = segments.reduce((max, s) => Math.max(max, s.end || 0), 0);
      const cost = PRICING_RULES.calculateTranslationCost(maxEnd, 1);

      let jobId = null;
      let deduction = null;
      try {
        jobId = createJob({
          userId: user.id,
          jobType: "translate",
          videoDurationSec: maxEnd,
          creditsCost: cost
        });
        deduction = deductCreditsAtomically(user.id, cost, "job", jobId);
      } catch (creditErr) {
        return NextResponse.json(
          {
            ok: false,
            error: creditErr.message || "Insufficient credits",
            code: "INSUFFICIENT_CREDITS",
            cost,
            currentBalance: user.credits_balance
          },
          { status: 402 }
        );
      }

      try {
        let resultSegments = null;
        let source = "local_engine";

        // Try Groq first (~1.2s response time)
        if (groqKey) {
          const groqResult = await translateWithGroq(segments);
          if (groqResult) {
            resultSegments = groqResult;
            source = "groq";
          }
        }

        // Try Gemini next if Groq was not available or failed
        if (!resultSegments && geminiKey) {
          try {
            const prompt = `You are an expert Telugu subtitle translator for Instagram Reels.
Convert or translate each line into natural, engaging Telugu script (తెలుగు లిపి) with strict, pristine Telugu spelling and grammar (సరైన గుణింతాలు, ఒత్తులు, దీర్ఘాలు). Zero spelling mistakes.
Keep conversational creator terms in standard Telugu spelling: "వీడియో", "రీల్స్", "ఫ్రెండ్స్", "షేర్", "ఫాలో", "లైక్", "సబ్‌స్క్రైబ్", "ఛానల్", "టిప్స్", "కామెంట్".
Lines:
${JSON.stringify(segments.map(s => ({ id: s.id, text: s.text || s.romanizedText })))}

Return ONLY valid JSON:
{
  "segments": [
    { "id": "...", "text": "తెలుగు వాక్యం ఇక్కడ", "romanizedText": "Romanized English" }
  ]
}`;
            const responseText = await callGemini(geminiKey, prompt, 8000);
            if (responseText) {
              const parsed = JSON.parse(responseText);
              if (parsed.segments && Array.isArray(parsed.segments)) {
                resultSegments = segments.map(seg => {
                  const match = parsed.segments.find(p => p.id === seg.id);
                  if (match && match.text) {
                    const teWords = match.text.trim().split(/\s+/).filter(Boolean);
                    const dur = Math.max(0.1, (seg.end || 2.5) - (seg.start || 0));
                    const wDur = dur / Math.max(1, teWords.length);
                    const newWords = teWords.map((w, i) => ({
                      word: w,
                      romanized: w,
                      start: Number(((seg.start || 0) + i * wDur).toFixed(2)),
                      end: Number(((seg.start || 0) + (i + 1) * wDur).toFixed(2))
                    }));
                    return {
                      ...seg,
                      text: match.text,
                      romanizedText: match.romanizedText || seg.romanizedText,
                      words: newWords
                    };
                  }
                  return seg;
                });
                source = "gemini";
              }
            }
          } catch (geminiErr) {
            console.warn("Gemini translate_telugu failed:", geminiErr.message);
          }
        }

        // Local fallback
        if (!resultSegments) {
          resultSegments = translateTeluguLocal(segments);
        }

        updateJobStatus(jobId, "completed");
        return NextResponse.json({
          ok: true,
          segments: resultSegments,
          source,
          creditsUsed: cost,
          creditsRemaining: deduction.newBalance
        });
      } catch (err) {
        console.warn("Translation failed, refunding credits:", err.message);
        refundCreditsAtomically(user.id, cost, "refund", jobId);
        updateJobStatus(jobId, "failed", err.message);
        return NextResponse.json(
          { ok: false, error: err.message || "Translation failed. Credits refunded." },
          { status: 500 }
        );
      }
    }

    // 2. AUTO EMOJI
    if (action === "auto_emoji") {
      if (geminiKey) {
        try {
          const prompt = `You are a viral social media video editor for Telugu Reels/Shorts.
Given this JSON array of subtitle segments, enhance each segment by adding 1-2 high-impact viral emojis next to trigger words (like fire 🔥 for viral, 💰 for money, 🤯 for crazy, 🤫 for secret, 💡 for trick, 📥 for save).
Maintain the exact segment IDs and timings.
Return ONLY valid JSON matching this schema:
{"segments": [{"id": "...", "text": "...", "romanizedText": "..."}]}

Input Segments:
${JSON.stringify(segments.map(s => ({ id: s.id, text: s.text, romanizedText: s.romanizedText })))}`;

          const responseText = await callGemini(geminiKey, prompt, 8000);
          if (responseText) {
            const parsed = JSON.parse(responseText);
            if (parsed.segments) {
              const updated = segments.map(seg => {
                const match = parsed.segments.find(p => p.id === seg.id);
                return match ? { ...seg, text: match.text, romanizedText: match.romanizedText } : seg;
              });
              return NextResponse.json({ ok: true, segments: updated, source: "gemini" });
            }
          }
        } catch (geminiErr) {
          console.warn("Gemini auto_emoji failed, falling back to local:", geminiErr.message);
        }
      }

      // Local rule-based fallback
      const updated = segments.map(seg => ({
        ...seg,
        text: injectEmojisLocal(seg.text),
        romanizedText: injectEmojisLocal(seg.romanizedText)
      }));
      return NextResponse.json({ ok: true, segments: updated, source: "local_engine" });
    }

    // 3. GRAMMAR POLISH & SPELLCHECK
    if (action === "grammar_polish") {
      if (geminiKey) {
        try {
          const prompt = `You are an expert Telugu & English subtitle proofreader for short-form video reels.
Examine each caption segment and fix all spelling mistakes, typographical errors, incorrect Telugu guninthalu/vothulu (ఒత్తులు, దీర్ఘాలు), and English spelling errors.

STRICT INSTRUCTIONS:
1. Fix spelling mistakes and typos in BOTH "text" (Telugu script) and "romanizedText" (translucent spoken line).
2. Standard Telugu creator spellings: "వీడియో", "రీల్స్", "ఫ్రెండ్స్", "షేర్", "ఫాలో", "లైక్", "సబ్‌స్క్రైబ్", "ఛానల్", "టిప్స్", "కామెంట్", "అప్‌డేట్".
3. DO NOT rewrite, paraphrase, or change the spoken words! Keep the exact words verbatim as uttered by the speaker, only correcting misspelled letters, typos, and punctuation.
4. Preserve the exact segment IDs.

Input Segments:
${JSON.stringify(segments.map(s => ({ id: s.id, text: s.text, romanizedText: s.romanizedText })))}

Return ONLY valid JSON matching this schema:
{
  "segments": [
    {
      "id": "...",
      "text": "Corrected Telugu script without typos",
      "romanizedText": "Corrected English/translucent line without typos"
    }
  ]
}`;

          const responseText = await callGemini(geminiKey, prompt, 10000);
          if (responseText) {
            const parsed = JSON.parse(responseText);
            if (parsed.segments && Array.isArray(parsed.segments)) {
              const updated = segments.map(seg => {
                const match = parsed.segments.find(p => p.id === seg.id);
                if (match) {
                  const nextText = match.text || seg.text;
                  const nextRomanized = match.romanizedText || seg.romanizedText;
                  return {
                    ...seg,
                    text: nextText,
                    romanizedText: nextRomanized
                  };
                }
                return seg;
              });
              return NextResponse.json({ ok: true, segments: updated, source: "gemini" });
            }
          }
        } catch (geminiErr) {
          console.warn("Gemini grammar_polish failed:", geminiErr.message);
        }
      }

      // Groq fallback for ultra-fast spellchecking
      if (groqKey) {
        try {
          const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            signal: AbortSignal.timeout(8000),
            headers: {
              Authorization: "Bearer " + groqKey,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "openai/gpt-oss-20b",
              response_format: { type: "json_object" },
              messages: [
                {
                  role: "system",
                  content: 'You are a Telugu & English subtitle proofreader. Fix spelling mistakes and typos in both text (Telugu script) and romanizedText (English/translucent) without changing the words or meaning. Ensure standard Telugu spellings: "వీడియో", "రీల్స్", "ఫ్రెండ్స్", "షేర్", "ఫాలో", "లైక్", "సబ్‌స్క్రైబ్", "ఛానల్", "టిప్స్", "కామెంట్". Return JSON schema: {"segments": [{"id": "...", "text": "...", "romanizedText": "..."}]}'
                },
                {
                  role: "user",
                  content: JSON.stringify(segments.map(s => ({ id: s.id, text: s.text, romanizedText: s.romanizedText })))
                }
              ]
            })
          });
          if (res.ok) {
            const data = await res.json();
            const content = data?.choices?.[0]?.message?.content;
            if (content) {
              const parsed = JSON.parse(content);
              if (parsed.segments && Array.isArray(parsed.segments)) {
                const updated = segments.map(seg => {
                  const match = parsed.segments.find(p => p.id === seg.id);
                  return match ? { ...seg, text: match.text || seg.text, romanizedText: match.romanizedText || seg.romanizedText } : seg;
                });
                return NextResponse.json({ ok: true, segments: updated, source: "groq" });
              }
            }
          }
        } catch (groqErr) {
          console.warn("Groq grammar_polish failed:", groqErr.message);
        }
      }

      const updated = segments.map(seg => ({
        ...seg,
        text: polishTextLocal(seg.text),
        romanizedText: polishTextLocal(seg.romanizedText)
      }));
      return NextResponse.json({ ok: true, segments: updated, source: "local_engine" });
    }

    // 4. GENERATE HOOKS
    if (action === "generate_hooks") {
      if (geminiKey) {
        try {
          const fullText = segments.map(s => s.text || s.romanizedText || "").join(" ");
          const prompt = `You are a viral Instagram Reels strategist. Based on this Telugu video transcript:
"${fullText}"

Generate:
1. Three 3-second opening hook lines (in Telugu with emojis).
2. A viral Instagram post caption with engaging emojis and call to actions.
3. 5 trending Telugu hashtags.

Return ONLY valid JSON:
{
  "hooks": ["hook 1", "hook 2", "hook 3"],
  "postCaption": "Full formatted caption...",
  "hashtags": ["#tag1", "#tag2", ...]
}`;

          const responseText = await callGemini(geminiKey, prompt, 8000);
          if (responseText) {
            const parsed = JSON.parse(responseText);
            return NextResponse.json({ ok: true, ...parsed, source: "gemini" });
          }
        } catch (geminiErr) {
          console.warn("Gemini generate_hooks failed, falling back to local:", geminiErr.message);
        }
      }

      const result = generateHooksLocal(segments);
      return NextResponse.json({ ok: true, ...result, source: "local_engine" });
    }

    return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
