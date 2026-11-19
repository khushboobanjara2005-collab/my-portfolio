const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
let clientPromise

function isValidSupabaseUrl(value) {
  try {
    const url = new URL(value)
    const isLocalhost = ['localhost', '127.0.0.1'].includes(url.hostname)

    return (
      (url.protocol === 'https:' || (isLocalhost && url.protocol === 'http:'))
      && !url.username
      && !url.password
      && url.pathname === '/'
      && !url.search
      && !url.hash
    )
  } catch {
    return false
  }
}

function isPublishableKey(value) {
  if (value?.startsWith('sb_publishable_') && value.length > 'sb_publishable_'.length) {
    return true
  }

  try {
    const payload = value.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const decoded = JSON.parse(atob(payload))
    return decoded.role === 'anon'
  } catch {
    return false
  }
}

export const isSupabaseConfigured = Boolean(
  isValidSupabaseUrl(supabaseUrl) && isPublishableKey(supabasePublishableKey),
)

export function getSupabaseClient() {
  if (!isSupabaseConfigured) {
    return Promise.resolve(null)
  }

  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) => (
      createClient(supabaseUrl, supabasePublishableKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    ))
  }

  return clientPromise
}

export function getSupabaseUploadConfig() {
  if (!isSupabaseConfigured) {
    return null
  }

  return { url: supabaseUrl.replace(/\/+$/, ''), publishableKey: supabasePublishableKey }
}
