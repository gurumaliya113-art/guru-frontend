import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hsevchffduyxfrcrxakc.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzZXZjaGZmZHV5eGZyY3J4YWtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMyNTgsImV4cCI6MjA5NDM4OTI1OH0.ZMOQ1pfiwprbsnebya52lrwVvdL2dIoYB2hz1orzEYU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)