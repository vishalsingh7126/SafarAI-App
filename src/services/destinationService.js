import { supabase } from './supabase';
import { generateAITravelResponse } from './aiService';

// Get city data — checks DB first, uses AI if not found
export async function getCityData(cityName) {
  // Step 1: Check database first
  const { data: existing } = await supabase
    .from('cities')
    .select('*')
    .ilike('name', cityName)
    .single();

  if (existing) {
    console.log('Found in database:', cityName);
    return { success: true, data: existing, source: 'database' };
  }

  // Step 2: Not found — ask AI
  console.log('Not in database, asking AI:', cityName);
  const aiPrompt = `Give me travel information about ${cityName} in this exact JSON format, no extra text:
  {
    "name": "${cityName}",
    "country": "country name",
    "famous_foods": "food1, food2, food3, food4",
    "cultural_tips": "key cultural tips for visitors",
    "best_time": "best months to visit",
    "travel_tips": "top 3 practical travel tips"
  }`;

  const aiResponse = await generateAITravelResponse(aiPrompt);

  try {
    const cityData = JSON.parse(aiResponse);

    // Step 3: Save to database for future searches
    const { data: saved, error } = await supabase
      .from('cities')
      .insert([cityData])
      .select()
      .single();

    if (error) {
      console.error('Error saving city:', error);
      return { success: true, data: cityData, source: 'ai' };
    }

    return { success: true, data: saved, source: 'ai' };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    return { success: false, error };
  }
}

// Get travel costs for a destination
export async function getTravelCosts(destination) {
  const { data, error } = await supabase
    .from('travel_costs')
    .select('*')
    .ilike('destination', destination)
    .single();

  if (error) {
    console.error('Error fetching travel costs:', error);
    return { success: false, error };
  }

  return { success: true, data };
}

// Get all countries
export async function getAllCountries() {
  const { data, error } = await supabase
    .from('countries')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching countries:', error);
    return { success: false, error };
  }

  return { success: true, data };
}