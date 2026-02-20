import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://kvmtfngxkeodkqrxbjwo.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2bXRmbmd4a2VvZGtxcnhiandvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyOTE3NDIsImV4cCI6MjA4Njg2Nzc0Mn0.T4c9OtAp7m7kTWznzGZNWHKyuwQMJp2sgqTco6MHtQw";

export const supabase = createClient(supabaseUrl, supabaseKey);
