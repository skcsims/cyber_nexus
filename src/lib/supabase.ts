import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Improved check: ignore placeholders
const isValidConfig = 
  supabaseUrl && 
  supabaseKey && 
  supabaseUrl !== 'your_supabase_project_url' && 
  supabaseKey !== 'your_supabase_anon_key';

export const supabase = isValidConfig 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;
