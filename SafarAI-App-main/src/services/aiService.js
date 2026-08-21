import { destinations, findDestination } from '../data/destinations';
import { hotelsDatabase } from '../data/hotelsDatabase';
import { foodCultureDatabase } from '../data/foodCultureDatabase';

/**
 * SafarAI assistant service.
 *
 * Primary path  : Groq (llama-3.3-70b-versatile), unchanged from before.
 * Fallback path : a deterministic, data-grounded answer built from the
 *                 in-app destination / hotel / food datasets so the
 *                 assistant stays genuinely useful when no API key is
 *                 configured or the network call fails.
 */

const apiKey = import.meta.env.VITE_GROQ_API_KEY;

export const aiStatus = {
  configured: Boolean(apiKey),
  model: 'llama-3.3-70b-versatile',
};

if (import.meta.env.DEV) {
  console.info('[SafarAI AI] Groq key detected:', aiStatus.configured);
}

/**
 * The Groq SDK is loaded on demand so it never lands in the initial bundle —
 * the assistant is opt-in, most sessions never call it.
 */
let clientPromise = null;

function getClient() {
  if (!apiKey) return Promise.resolve(null);
  if (!clientPromise) {
    clientPromise = import('groq-sdk')
      .then(({ default: Groq }) => new Groq({ apiKey, dangerouslyAllowBrowser: true }))
      .catch((error) => {
        console.error('[SafarAI AI] Failed to load the Groq SDK:', error);
        return null;
      });
  }
  return clientPromise;
}

const SYSTEM_PROMPT = `You are SafarAI, an expert AI travel assistant built by TravelCore. You help users plan detailed trip itineraries, discover destinations, explore local food and culture, suggest safe travel routes, and estimate travel budgets. Always be friendly, specific, and practical in your advice.

Formatting rules:
- Reply in short markdown sections with bold labels.
- Prefer bullet lists over long paragraphs.
- Include concrete numbers (₹ costs, durations, distances) when relevant.
- End with one short, useful follow-up suggestion.`;

/* ------------------------------------------------------------------ helpers */

function inr(value) {
  return `₹${Number(value).toLocaleString('en-IN')}`;
}

function offlineAnswer(message) {
  const text = String(message || '').toLowerCase();
  const destination = findDestination(
    destinations.find((item) => text.includes(item.name.toLowerCase()))?.name || ''
  );

  const wantsBudget = /budget|cost|price|cheap|expensive|money|₹/.test(text);
  const wantsFood = /food|eat|dish|restaurant|cuisine|breakfast|dinner/.test(text);
  const wantsStay = /hotel|stay|resort|hostel|accommodation/.test(text);
  const wantsSafety = /safe|safety|risk|solo|women|emergency/.test(text);

  if (destination) {
    const stays = hotelsDatabase.filter((hotel) => hotel.city.toLowerCase() === destination.name.toLowerCase());
    const food = foodCultureDatabase.filter((item) =>
      item.city.toLowerCase().includes(destination.name.toLowerCase())
    );

    const lines = [
      `### ${destination.name} — quick brief`,
      '',
      `${destination.description}`,
      '',
      `**Best time:** ${destination.bestTime}  `,
      `**Ideal length:** ${destination.duration}  `,
      `**Typical budget:** ${destination.budget} (about ${inr(destination.dailyCost)}/day)  `,
      `**Safety score:** ${destination.safetyScore}/100`,
      '',
      '**Do not miss**',
      ...destination.highlights.map((item) => `- ${item}`),
    ];

    if (wantsStay && stays.length) {
      lines.push('', '**Where to stay**', ...stays.map((hotel) => `- ${hotel.name} — ${inr(hotel.pricePerNight)}/night · ${hotel.rating}★ (${hotel.tier})`));
    }
    if (wantsFood && food.length) {
      lines.push('', '**What to eat**', ...food.slice(0, 4).map((item) => `- ${item.dish} at ${item.place}`));
    }
    if (wantsBudget) {
      lines.push(
        '',
        '**Budget snapshot (per person, 4 days)**',
        `- Stay: ${inr(destination.dailyCost * 0.45 * 4)}`,
        `- Food: ${inr(destination.dailyCost * 0.25 * 4)}`,
        `- Local transport: ${inr(destination.dailyCost * 0.15 * 4)}`,
        `- Activities: ${inr(destination.dailyCost * 0.15 * 4)}`
      );
    }
    if (wantsSafety) {
      lines.push(
        '',
        '**Safety notes**',
        `- Overall score ${destination.safetyScore}/100 based on traveller reports.`,
        '- Share your live location with one contact for late-night travel.',
        '- Use the in-app Safety page for emergency numbers and a saved SOS list.'
      );
    }

    lines.push('', `_Want a full day-by-day plan? Open the Trip Planner and pick ${destination.name}._`);
    return lines.join('\n');
  }

  if (wantsBudget) {
    const cheapest = [...destinations].sort((a, b) => a.dailyCost - b.dailyCost).slice(0, 4);
    return [
      '### Best value destinations right now',
      '',
      ...cheapest.map((item) => `- **${item.name}** — from ${inr(item.dailyCost)}/day · ${item.bestTime}`),
      '',
      'Open **Budget Calculator** to model exact cost by travel style, season and group size.',
    ].join('\n');
  }

  return [
    '### I can help you plan that',
    '',
    'Here is what I do best:',
    '- **Itineraries** — a realistic day-by-day plan for any Indian destination',
    '- **Budgets** — season-aware cost estimates by travel style',
    '- **Stays & food** — curated hotels and signature dishes per city',
    '- **Safety & transport** — risk notes, train options and route advice',
    '',
    '**Popular right now:** ' + destinations.slice(0, 4).map((item) => item.name).join(' · '),
    '',
    'Tell me a destination and how many days you have, and I will draft the plan.',
  ].join('\n');
}

/* --------------------------------------------------------------- public API */

/**
 * @param {string} message                 the user question
 * @param {object} [options]
 * @param {Array}  [options.history]       prior turns ({ role, text })
 * @param {string} [options.context]       extra grounding context
 */
export async function generateAITravelResponse(message, options = {}) {
  const { history = [], context = '' } = options;
  const client = await getClient();

  if (!client) {
    // Keep the product usable without a key — clearly grounded, local answer.
    await new Promise((resolve) => setTimeout(resolve, 420));
    return offlineAnswer(message);
  }

  try {
    const messages = [
      { role: 'system', content: context ? `${SYSTEM_PROMPT}\n\nTraveller context: ${context}` : SYSTEM_PROMPT },
      ...history.slice(-6).map((entry) => ({
        role: entry.role === 'user' ? 'user' : 'assistant',
        content: entry.text,
      })),
      { role: 'user', content: message },
    ];

    const response = await client.chat.completions.create({
      model: aiStatus.model,
      messages,
      temperature: 0.7,
    });

    return response.choices?.[0]?.message?.content?.trim() || offlineAnswer(message);
  } catch (error) {
    console.error('Groq API Error:', error);
    return offlineAnswer(message);
  }
}

export default generateAITravelResponse;
