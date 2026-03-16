import { supabase } from './supabase';

// Save a new memory
export async function saveMemory(memoryData) {
  const { data, error } = await supabase
    .from('memories')
    .insert([
      {
        user_id: memoryData.userId,
        location: memoryData.location,
        notes: memoryData.notes,
        photo_url: memoryData.photoUrl,
        date: memoryData.date,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error saving memory:', error);
    return { success: false, error };
  }

  return { success: true, data };
}

// Get all memories for a user
export async function getUserMemories(userId) {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching memories:', error);
    return { success: false, error };
  }

  return { success: true, data };
}

// Upload a photo to Supabase Storage
export async function uploadMemoryPhoto(file, userId) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('memory-photos')
    .upload(fileName, file);

  if (error) {
    console.error('Error uploading photo:', error);
    return { success: false, error };
  }

  // Get public URL of uploaded photo
  const { data: urlData } = supabase.storage
    .from('memory-photos')
    .getPublicUrl(fileName);

  return { success: true, url: urlData.publicUrl };
}

// Delete a memory
export async function deleteMemory(memoryId) {
  const { error } = await supabase
    .from('memories')
    .delete()
    .eq('id', memoryId);

  if (error) {
    console.error('Error deleting memory:', error);
    return { success: false, error };
  }

  return { success: true };
}