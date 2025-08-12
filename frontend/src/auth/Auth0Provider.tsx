import { Auth0Provider } from '@auth0/auth0-react'
import { ReactNode } from 'react'

interface AuthProviderProps {
  children: ReactNode
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const domain = import.meta.env.VITE_AUTH0_DOMAIN
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID
  const audience = import.meta.env.VITE_AUTH0_AUDIENCE
  const redirectUri = import.meta.env.VITE_AUTH0_REDIRECT_URI || window.location.origin

  if (!domain || !clientId) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center', 
        background: '#ff4444', 
        color: 'white',
        fontSize: '18px' 
      }}>
        ⚠️ Auth0 configuration missing. Please check your environment variables.
        <br />
        <small>Domain: {domain || 'MISSING'} | Client ID: {clientId || 'MISSING'}</small>
      </div>
    )
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
        audience: audience,
        scope: "read:current_user update:current_user_metadata"
      }}
      useRefreshTokens={true}
      cacheLocation="localstorage"
    >
      {children}
    </Auth0Provider>
  )
}
