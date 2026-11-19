import { useEffect, useMemo, useState } from 'react'
import { signOut, verifyAdministrator } from './authService'
import { getSupabaseClient, isSupabaseConfigured } from '../../lib/supabaseClient'
import { AuthContext } from './authContext'

function stateForSession(session, currentState) {
  const user = session?.user ?? null

  if (!user) {
    if (currentState.status === 'rejecting-admin') {
      return { status: 'forbidden', user: currentState.user, error: null }
    }

    return currentState.status === 'signed-out'
      ? currentState
      : { status: 'signed-out', user: null, error: null }
  }

  if (currentState.user?.id === user.id && currentState.status !== 'loading') {
    return { ...currentState, user }
  }

  return { status: 'checking-admin', user, error: null }
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(() => ({
    status: isSupabaseConfigured ? 'loading' : 'unconfigured',
    user: null,
    error: null,
  }))
  const [verificationAttempt, setVerificationAttempt] = useState(0)
  const [sessionAttempt, setSessionAttempt] = useState(0)
  const userId = authState.user?.id ?? null

  useEffect(() => {
    let active = true
    let receivedAuthEvent = false
    let subscription

    getSupabaseClient()
      .then((supabase) => {
        if (!active || !supabase) {
          return
        }

        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          receivedAuthEvent = true
          setAuthState((currentState) => stateForSession(session, currentState))
        })
        subscription = authSubscription
        return supabase.auth.getSession()
      })
      .then((result) => {
        if (!active || receivedAuthEvent || !result) {
          return
        }

        const { data, error } = result
        if (error) {
          setAuthState({ status: 'session-error', user: null, error })
          return
        }

        setAuthState((currentState) => stateForSession(data.session, currentState))
      })
      .catch((error) => {
        if (active && !receivedAuthEvent) {
          setAuthState({ status: 'session-error', user: null, error })
        }
      })

    return () => {
      active = false
      subscription?.unsubscribe()
    }
  }, [sessionAttempt])

  useEffect(() => {
    if (!isSupabaseConfigured || !userId) {
      return undefined
    }

    let active = true

    verifyAdministrator()
      .then(async (isAdministrator) => {
        if (!active) {
          return
        }

        if (isAdministrator) {
          setAuthState((currentState) => (
            currentState.user?.id === userId
              ? { status: 'admin', user: currentState.user, error: null }
              : currentState
          ))
          return
        }

        setAuthState((currentState) => (
          currentState.user?.id === userId
            ? { status: 'rejecting-admin', user: currentState.user, error: null }
            : currentState
        ))

        try {
          await signOut()
          if (active) {
            setAuthState((currentState) => (
              currentState.user?.id === userId
                || currentState.status === 'forbidden'
                ? { status: 'forbidden', user: currentState.user, error: null }
                : currentState
            ))
          }
        } catch (error) {
          if (active) {
            setAuthState((currentState) => (
              currentState.user?.id === userId
                ? { status: 'forbidden-signout-error', user: currentState.user, error }
                : currentState
            ))
          }
        }
      })
      .catch((error) => {
        if (active) {
          setAuthState((currentState) => (
            currentState.user?.id === userId
              ? { status: 'authorization-error', user: currentState.user, error }
              : currentState
          ))
        }
      })

    return () => {
      active = false
    }
  }, [userId, verificationAttempt])

  const value = useMemo(() => ({
    ...authState,
    signOut,
    retryAuthorization: () => setVerificationAttempt((attempt) => attempt + 1),
    retrySession: () => setSessionAttempt((attempt) => attempt + 1),
  }), [authState])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

