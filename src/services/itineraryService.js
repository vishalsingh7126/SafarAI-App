import { supabase } from './supabase';
import { generateAITravelResponse } from './aiService';

// Generate and save an AI itinerary
export async function generateAndSaveItinerary(userId, tripDetails) {
  // Step 1: Generate with AI
  const prompt = `Create a detailed ${tripDetails.days}-day travel itinerary for ${tripDetails.destination}.
  Travel style: ${tripDetails.travelStyle}
  Interests: ${tripDetails.interests}
  Budget: ${tripDetails.budget} ${tripDetails.currency}
  
  Format it clearly with Day 1, Day 2 etc. 
  Include morning, afternoon and evening activities.
  Include food recommendations and estimated costs.`;

  const content = await generateAITravelResponse(prompt);

  // Step 2: Save to database
  const { data, error } = await supabase
    .from('itineraries')
    .insert([
      {
        user_id: userId,
        destination: tripDetails.destination,
        days: tripDetails.days,
        travel_style: tripDetails.travelStyle,
        interests: tripDetails.interests,
        content: content,
        estimated_budget: tripDetails.budget,
        currency: tripDetails.currency,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error saving itinerary:', error);
    return { success: false, error };
  }

  return { success: true, data };
}

// Get all itineraries for a user
export async function getUserItineraries(userId) {
  const { data, error } = await supabase
    .from('itineraries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching itineraries:', error);
    return { success: false, error };
  }

  return { success: true, data };
}

// Delete an itinerary
export async function deleteItinerary(itineraryId) {
  const { error } = await supabase
    .from('itineraries')
    .delete()
    .eq('id', itineraryId);

  if (error) {
    console.error('Error deleting itinerary:', error);
    return { success: false, error };
  }

  return { success: true };
}   