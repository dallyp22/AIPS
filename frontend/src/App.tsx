import { ThemeProvider, CssBaseline, Container } from '@mui/material'
import { theme } from './theme'
import AppShell from './shell/AppShell'
import { Routes, Route, Navigate } from 'react-router-dom'
import ScheduleSummary from './pages/ScheduleSummary'
import ScheduleBoard from './pages/ScheduleBoard'
import Orders from './pages/Orders'
import Resources from './pages/Resources'
import Changeovers from './pages/Changeovers'
import Closeout from './pages/Closeout'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import './styles/global.css'

export default function App(){
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppShell>
        <Container maxWidth="xl">
          <Routes>
            <Route path="/" element={<Navigate to="/schedule/summary" />} />
            <Route path="/schedule/summary" element={<ScheduleSummary/>} />
            <Route path="/schedule/board" element={<ScheduleBoard/>} />
            <Route path="/orders" element={<Orders/>} />
            <Route path="/resources" element={<Resources/>} />
            <Route path="/changeovers" element={<Changeovers/>} />
            <Route path="/closeout" element={<Closeout/>} />
            <Route path="/reports" element={<Reports/>} />
            <Route path="/settings" element={<Settings/>} />
          </Routes>
        </Container>
      </AppShell>
    </ThemeProvider>
  )
}
