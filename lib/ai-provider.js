import { GoogleGenAI } from "@google/genai";

/**
 * Universal AI Generation helper that supports MISTRAL_API_KEY, GEMINI_API_KEY, and OPENAI_API_KEY.
 * Automatically picks the available provider key in environment variables.
 */
export async function generateTextWithAI({ systemPrompt, userPrompt = "", temperature = 0.85 }) {
  const groqKey = process.env.GROQ_API_KEY;
  const mistralKey = process.env.MISTRAL_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const actualUserPrompt = userPrompt && userPrompt.trim() 
    ? userPrompt 
    : `Please generate a unique, fresh, and creative response according to the detailed system prompt instructions. [Ref Seed: ${Date.now()}_${Math.random().toString(36).substring(7)}]`;

  // 1. Try Groq AI (with automatic model fallback) if GROQ_API_KEY is configured
  if (groqKey) {
    const groqModels = [
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "llama-3.1-70b-versatile",
      "llama3-70b-8192",
      "llama3-8b-8192",
      "mixtral-8x7b-32768",
      "gemma2-9b-it",
    ];

    for (const model of groqModels) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey.trim()}`,
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: actualUserPrompt },
            ],
            temperature: temperature,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.warn(`Groq API (${model}) returned status ${response.status}: ${errText}`);
          // If model not found (404), continue to next model in loop
          if (response.status === 404) continue;
        } else {
          const data = await response.json();
          const text = data?.choices?.[0]?.message?.content?.trim();
          if (text) {
            console.log(`✅ Groq AI (${model}) successfully generated dynamic response!`);
            return { text, provider: `groq:${model}` };
          }
        }
      } catch (err) {
        console.warn(`Groq API (${model}) call error:`, err);
      }
    }
  }

  // 2. Try Mistral AI if MISTRAL_API_KEY is configured
  if (mistralKey) {
    try {
      const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mistralKey.trim()}`,
        },
        body: JSON.stringify({
          model: "mistral-small-latest",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: actualUserPrompt },
          ],
          temperature: temperature,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`Mistral API returned status ${response.status}: ${errText}`);
      } else {
        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (text) {
          console.log("✅ Mistral AI successfully generated dynamic response!");
          return { text, provider: "mistral" };
        }
      }
    } catch (err) {
      console.warn("Mistral API call error:", err);
    }
  }

  // 3. Try Google Gemini if GEMINI_API_KEY is configured
  if (geminiKey) {
    try {
      const genai = new GoogleGenAI(geminiKey.trim());
      const fullPrompt = `${systemPrompt}\n\n${actualUserPrompt}`;
      const result = await genai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: fullPrompt,
      });

      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) {
        console.log("✅ Gemini AI successfully generated response!");
        return { text, provider: "gemini" };
      }
    } catch (err) {
      console.warn("Gemini API call error:", err);
    }
  }

  // 4. Try OpenAI if OPENAI_API_KEY is configured
  if (openaiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey.trim()}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: actualUserPrompt },
          ],
          temperature: temperature,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (text) {
          console.log("✅ OpenAI successfully generated response!");
          return { text, provider: "openai" };
        }
      }
    } catch (err) {
      console.warn("OpenAI API call error:", err);
    }
  }

  return { text: null, provider: "none" };
}
