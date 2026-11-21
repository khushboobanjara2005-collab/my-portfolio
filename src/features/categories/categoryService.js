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

export async function listCategoriesWithProjectCounts() {
  const supabase = await getSupabaseClient()

  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const [categoryResult, projectResult] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, slug, description, is_active, display_order')
      .order('display_order')
      .order('name'),
    supabase
      .from('projects')
      .select('category_id'),
  ])

  if (categoryResult.error) {
    throw categoryResult.error
  }
  if (projectResult.error) {
    throw projectResult.error
  }

  const counts = new Map()
  projectResult.data.forEach(({ category_id: categoryId }) => {
    if (categoryId) {
      counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1)
    }
  })

  return categoryResult.data.map((category) => ({
    ...category,
    projectCount: counts.get(category.id) ?? 0,
  }))
}

export function createCategorySlug(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 160)
    .replace(/-+$/g, '')
}

export function cleanCategoryName(value) {
  return value.trim().replace(/\s+/g, ' ')
}

export function normalizeCategoryName(value) {
  return cleanCategoryName(value).toLowerCase()
}

export async function saveCategory(category, values) {
  const supabase = await getSupabaseClient()

  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const name = cleanCategoryName(values.name)
  if (!name) {
    throw new Error('Category name cannot be empty.')
  }
  if (name.length > 100) {
    throw new Error('Category name must be 100 characters or fewer.')
  }

  const existingCategories = await listCategories()
  const duplicate = existingCategories.find((item) => (
    item.id !== category?.id
    && normalizeCategoryName(item.name) === normalizeCategoryName(name)
  ))
  if (duplicate) {
    throw new Error(`“${duplicate.name}” already exists. Choose the existing category instead.`)
  }

  const payload = {
    name,
    slug: values.slug.trim(),
    description: values.description.trim(),
    is_active: values.isActive,
    display_order: Number(values.displayOrder),
  }

  const query = category
    ? supabase.from('categories').update(payload).eq('id', category.id)
    : supabase.from('categories').insert(payload)
  const { data, error } = await query.select('id').single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('A category with this name or URL slug already exists.')
    }
    throw error
  }

  return data.id
}

export async function deleteCategory(category) {
  const supabase = await getSupabaseClient()

  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { count, error: countError } = await supabase
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', category.id)

  if (countError) {
    throw countError
  }
  if (count > 0) {
    throw new Error(`This category is used by ${count} project${count === 1 ? '' : 's'}. Reassign those projects before deleting it.`)
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', category.id)

  if (error) {
    if (error.code === '23503') {
      throw new Error('This category is assigned to a project. Reassign those projects before deleting it.')
    }
    throw error
  }
}
