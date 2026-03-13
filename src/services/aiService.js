import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

console.info('[SafarAI AI] VITE_OPENAI_API_KEY loaded:', {
  exists: Boolean(apiKey),
  length: apiKey ? apiKey.length : 0,
  preview: apiKey ? `${apiKey.slice(0, 7)}...` : 'missing',
});

if (!apiKey) {
  console.error(
    '[SafarAI AI] Missing VITE_OPENAI_API_KEY. Add it to your .env file and restart Vite.'
  );
}

const client = new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true,
});

export async function generateAITravelResponse(message) {
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are SafarAI, an intelligent travel assistant that helps users plan trips, discover destinations, suggest safe travel routes, and estimate travel budgets.',
        },
        {
          role: 'user',
          content: message,
        },
      ],
      temperature: 0.7,
    });

    return response.choices?.[0]?.message?.content?.trim() || '';
  } catch (error) {
    console.error('OpenAI API Error:', error);

    if (error?.status) {
      console.error('Status:', error.status);
    }

    if (error?.message) {
      console.error('Message:', error.message);
    }

    if (error?.error) {
      console.error('Details:', error.error);
    }

    if (error?.stack) {
      console.error('Stack:', error.stack);
    }

    return "Sorry, I couldn't process your request right now. Please try again.";
  }
}
