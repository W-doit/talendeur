import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Testing to see if supabase is connected 
const checkConnection = async () => {
  try {
    const { _data, error } = await supabase.auth.getSession()
    if (error) {
      console.error('Connection error:', error)
    } else {
      console.log('Supabase is connected successfully!')
    }
  } catch (err) {
    console.error('Failed to connect to Supabase:', err)
  }
}


checkConnection()