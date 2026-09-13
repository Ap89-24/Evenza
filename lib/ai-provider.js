import { GoogleGenAI } from "@google/genai";

/**
 * Universal AI Generation helper that supports MISTRAL_API_KEY, GEMINI_API_KEY, and OPENAI_API_KEY.
 * Automatically picks the available provider key in environment variables.
 */
export async function generateTextWithAI({ systemPrompt, userPrompt = "" }) {
  const mistralKey = process.env.MISTRAL_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  // 1. Try Mistral AI if MISTRAL_API_KEY is configured
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
            ...(userPrompt ? [{ role: "user", content: userPrompt }] : []),
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`Mistral API returned status ${response.status}: ${errText}`);
      } else {
        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (text) {
          return { text, provider: "mistral" };
        }
      }
    } catch (err) {
      console.warn("Mistral API call error:", err);
    }
  }

  // 2. Try Google Gemini if GEMINI_API_KEY is configured
  if (geminiKey) {
    try {
      const genai = new GoogleGenAI(geminiKey.trim());
      const fullPrompt = `${systemPrompt}\n\n${userPrompt ? `USER INPUT:\n${userPrompt}` : ""}`;
      const result = await genai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: fullPrompt,
      });

      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) {
        return { text, provider: "gemini" };
      }
    } catch (err) {
      console.warn("Gemini API call error:", err);
    }
  }

  // 3. Try OpenAI if OPENAI_API_KEY is configured
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
            ...(userPrompt ? [{ role: "user", content: userPrompt }] : []),
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (text) {
          return { text, provider: "openai" };
        }
      }
    } catch (err) {
      console.warn("OpenAI API call error:", err);
    }
  }

  return { text: null, provider: "none" };
}
