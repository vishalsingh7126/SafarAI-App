import Groq from "groq-sdk";

const apiKey = import.meta.env.VITE_GROQ_API_KEY;

console.info("[SafarAI AI] VITE_GROQ_API_KEY loaded:", {
  exists: Boolean(apiKey),
  length: apiKey ? apiKey.length : 0,
  preview: apiKey ? `${apiKey.slice(0, 7)}...` : "missing",
});

if (!apiKey) {
  console.error(
    "[SafarAI AI] Missing VITE_GROQ_API_KEY. Add it to your .env.local file and restart Vite.",
  );
}

const client = new Groq({
  apiKey,
  dangerouslyAllowBrowser: true,
});

export async function generateAITravelResponse(message) {
  try {
    const response = await client.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: `You are SafarAI, an expert AI travel assistant built by TravelCore. You help users plan detailed trip itineraries, discover destinations, explore local food and culture, suggest safe travel routes, and estimate travel budgets. Always be friendly, specific, and practical in your advice.`,
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.7,
    });

    return response.choices?.[0]?.message?.content?.trim() || "";
  } catch (error) {
    console.error("Groq API Error:", error);
    return "Sorry, I couldn't process your request right now. Please try again.";
  }
}
