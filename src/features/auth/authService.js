import { getSupabaseClient } from '../../lib/supabaseClient'

async function requireSupabase() {
  const supabase = await getSupabaseClient()

  if (!supabase) {
    throw new Error('Supabase is not configured with a valid project URL and publishable key.')
  }

  return supabase
}

export async function signInWithPassword(email, password) {
  const supabase = await requireSupabase()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })

  if (error) {
    throw error
  }

  return data
}

export async function signOut() {
  const supabase = await requireSupabase()

  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }
}

export async function verifyAdministrator() {
  const supabase = await requireSupabase()

  const { data, error } = await supabase.rpc('is_admin')

  if (error) {
    throw error
  }

  return data === true
}
