import { supabase } from './supabase';

// Save a new trip
export async function saveTrip(tripData) {
  const { data, error } = await supabase
    .from('trips')
    .insert([
      {
        user_id: tripData.userId,
        destination: tripData.destination,
        start_date: tripData.startDate,
        end_date: tripData.endDate,
        budget: tripData.budget,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error saving trip:', error);
    return { success: false, error };
  }

  return { success: true, data };
}

// Get all trips for a user
export async function getUserTrips(userId) {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching trips:', error);
    return { success: false, error };
  }

  return { success: true, data };
}

// Get a single trip by ID
export async function getTripById(tripId) {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();

  if (error) {
    console.error('Error fetching trip:', error);
    return { success: false, error };
  }

  return { success: true, data };
}

// Update a trip
export async function updateTrip(tripId, updates) {
  const { data, error } = await supabase
    .from('trips')
    .update(updates)
    .eq('id', tripId)
    .select()
    .single();

  if (error) {
    console.error('Error updating trip:', error);
    return { success: false, error };
  }

  return { success: true, data };
}

// Delete a trip
export async function deleteTrip(tripId) {
  const { error } = await supabase
    .from('trips')
    .delete()
    .eq('id', tripId);

  if (error) {
    console.error('Error deleting trip:', error);
    return { success: false, error };
  }

  return { success: true };
}