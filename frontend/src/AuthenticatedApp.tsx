import { useEffect } from 'react'
import { Container } from '@mui/material'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './auth/useAuth'
import { setAccessTokenGetter } from './api/client'
import AuthLoadingScreen from './auth/AuthLoadingScreen'
import LoginPage from './auth/LoginPage'
import AppShell from './shell/AppShell'
import ScheduleSummary from './pages/ScheduleSummary'
import ScheduleBoard from './pages/ScheduleBoard'
import Orders from './pages/Orders'
import Resources from './pages/Resources'
import Changeovers from './pages/Changeovers'
import Closeout from './pages/Closeout'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

export default function AuthenticatedApp() {
  const { isAuthenticated, isLoading, getAccessToken } = useAuth()

  // Setup API client with token getter
  useEffect(() => {
    if (isAuthenticated) {
      setAccessTokenGetter(getAccessToken)
    }
  }, [isAuthenticated, getAccessToken])

  // Show loading screen while Auth0 is initializing
  if (isLoading) {
    return <AuthLoadingScreen />
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />
  }

  // Show authenticated app
  return (
    <AppShell>
      <Container maxWidth="xl">
        <Routes>
          <Route path="/" element={<Navigate to="/schedule/summary" />} />
          <Route path="/schedule/summary" element={<ScheduleSummary />} />
          <Route path="/schedule/board" element={<ScheduleBoard />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/changeovers" element={<Changeovers />} />
          <Route path="/closeout" element={<Closeout />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Container>
    </AppShell>
  )
}
