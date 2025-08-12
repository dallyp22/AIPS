import { ThemeProvider, CssBaseline } from '@mui/material'
import { theme } from './theme'
import AuthProvider from './auth/Auth0Provider'
import AuthenticatedApp from './AuthenticatedApp'
import './styles/global.css'

export default function App(){
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </ThemeProvider>
  )
}
