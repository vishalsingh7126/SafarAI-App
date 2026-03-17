import { supabase } from './supabase';
import { generateAITravelResponse } from './aiService';

// ─── Helpers ───────────────────────────────────────────────────────────────

// Normalize city name for storage — always lowercase, trimmed
function normalizeCityName(name) {
  return name.trim().toLowerCase();
}

// Display city name nicely — capitalize each word
function displayCityName(name) {
  return name
    .trim()
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ─── City Data ─────────────────────────────────────────────────────────────

export async function getCityData(cityName) {
  const normalized = normalizeCityName(cityName);
  const display = displayCityName(cityName);

  // Step 1: Check database first (case-insensitive search)
  const { data: existing, error: fetchError } = await supabase
    .from('cities')
    .select('*')
    .ilike('name', normalized)
    .maybeSingle();

  if (existing) {
    console.log(`[SafarAI] "${display}" found in database — no AI call needed`);
    return { success: true, data: existing, source: 'database' };
  }

  // Step 2: Not found — ask Groq AI
  console.log(`[SafarAI] "${display}" not in database — asking Groq AI`);

  const aiPrompt = `Give me travel information about ${display} in this exact JSON format only, no extra text, no markdown:
{
  "name": "${normalized}",
  "display_name": "${display}",
  "country": "country name",
  "famous_foods": "food1, food2, food3, food4",
  "cultural_tips": "key cultural tips for visitors in 1-2 sentences",
  "best_time": "best months or season to visit",
  "travel_tips": "top 3 practical travel tips separated by commas",
  "language": "local language spoken",
  "currency": "local currency name and code"
}`;

  const aiResponse = await generateAITravelResponse(aiPrompt);

  let cityData;
  try {
    // Clean response in case AI adds markdown backticks
    const cleaned = aiResponse
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    cityData = JSON.parse(cleaned);

    // Force normalized name regardless of what AI returned
    cityData.name = normalized;
    cityData.display_name = display;

  } catch (parseError) {
    console.error('[SafarAI] Failed to parse AI response:', parseError);
    return { success: false, error: 'Could not parse city data from AI' };
  }

  // Step 3: Save to database so next search is instant
  const { data: saved, error: saveError } = await supabase
    .from('cities')
    .insert([cityData])
    .select()
    .single();

  if (saveError) {
    console.error('[SafarAI] Error saving city to database:', saveError);
    // Still return the data even if save failed
    return { success: true, data: cityData, source: 'ai' };
  }

  console.log(`[SafarAI] "${display}" saved to database for future searches`);
  return { success: true, data: saved, source: 'ai' };
}

// ─── Travel Costs ──────────────────────────────────────────────────────────

export async function getTravelCosts(cityName) {
  const normalized = normalizeCityName(cityName);

  const { data, error } = await supabase
    .from('travel_costs')
    .select('*')
    .ilike('destination', normalized)
    .maybeSingle();

  if (error) {
    console.error('[SafarAI] Error fetching travel costs:', error);
    return { success: false, error };
  }

  if (!data) {
    return { success: false, error: 'No cost data found for this city' };
  }

  return { success: true, data };
}

// ─── Countries ─────────────────────────────────────────────────────────────

export async function getAllCountries() {
  const { data, error } = await supabase
    .from('countries')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('[SafarAI] Error fetching countries:', error);
    return { success: false, error };
  }

  return { success: true, data };
}

// ─── Search cities (for autocomplete) ─────────────────────────────────────

export async function searchCities(query) {
  if (!query || query.trim().length < 2) return { success: true, data: [] };

  const normalized = normalizeCityName(query);

  const { data, error } = await supabase
    .from('cities')
    .select('name, country_id')
    .ilike('name', `${normalized}%`)
    .limit(5);

  if (error) {
    console.error('[SafarAI] Error searching cities:', error);
    return { success: false, error };
  }

  // Format data to work with our autocomplete
  const formatted = data.map(city => ({
    name: city.name,
    display_name: city.name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
  }));

  return { success: true, data: formatted };
}