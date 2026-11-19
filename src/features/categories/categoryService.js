import { getSupabaseClient } from '../../lib/supabaseClient'

export async function listCategories() {
  const supabase = await getSupabaseClient()

  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, is_active, display_order')
    .order('display_order')
    .order('name')

  if (error) {
    throw error
  }

  return data
}
