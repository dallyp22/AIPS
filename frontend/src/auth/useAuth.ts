import { useAuth0 } from '@auth0/auth0-react'
import { useCallback } from 'react'

export interface User {
  id: string
  email: string
  name: string
  picture?: string
  roles: string[]
}

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout,
    getAccessTokenSilently,
    getIdTokenClaims
  } = useAuth0()

  const login = useCallback(() => {
    loginWithRedirect({
      appState: {
        returnTo: window.location.pathname
      }
    })
  }, [loginWithRedirect])

  const logoutUser = useCallback(() => {
    logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    })
  }, [logout])

  const getAccessToken = useCallback(async () => {
    if (!isAuthenticated) return null
    
    try {
      return await getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
          scope: "read:current_user update:current_user_metadata"
        }
      })
    } catch (error) {
      console.error('Error getting access token:', error)
      return null
    }
  }, [isAuthenticated, getAccessTokenSilently])

  const getUserRoles = useCallback(async (): Promise<string[]> => {
    if (!isAuthenticated) return []
    
    try {
      const claims = await getIdTokenClaims()
      return claims?.['https://aips.app/roles'] || ['operator'] // Default role
    } catch (error) {
      console.error('Error getting user roles:', error)
      return ['operator']
    }
  }, [isAuthenticated, getIdTokenClaims])

  const currentUser: User | null = user ? {
    id: user.sub || '',
    email: user.email || '',
    name: user.name || user.email || 'Unknown User',
    picture: user.picture,
    roles: [] // Will be populated by getUserRoles()
  } : null

  return {
    user: currentUser,
    isAuthenticated,
    isLoading,
    login,
    logout: logoutUser,
    getAccessToken,
    getUserRoles
  }
}
