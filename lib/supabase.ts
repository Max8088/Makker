import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://cabsrxleafmowciqttmb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhYnNyeGxlYWZtb3djaXF0dG1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMDY3NjksImV4cCI6MjA5MTU4Mjc2OX0.wcHcExXLVuwwXKEe9KBpz9VhyRqzkBdDet90DH1Gu3c';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});