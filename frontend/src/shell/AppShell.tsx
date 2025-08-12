import { AppBar, Toolbar, Typography, Box, Drawer, List, ListItemButton, ListItemText } from '@mui/material'
import { Link, useLocation } from 'react-router-dom'
import StatusPulse from './StatusPulse'
import UserProfile from '../auth/UserProfile'

const drawerWidth = 280

const nav = [
  { to:'/schedule/summary', label:'Schedule' },
  { to:'/schedule/board', label:'Board' },
  { to:'/orders', label:'Orders' },
  { to:'/resources', label:'Resources' },
  { to:'/changeovers', label:'Changeovers' },
  { to:'/closeout', label:'Shift Closeout' },
  { to:'/reports', label:'Reports' },
  { to:'/settings', label:'Settings' }
]

export default function AppShell({ children }: { children: React.ReactNode }){
  const loc = useLocation()
  return (
    <Box sx={{ display:'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (t)=> t.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flex: 1, fontFamily: 'Montserrat, Inter, sans-serif' }}>AIPS Command Center</Typography>
          <StatusPulse/>
          <UserProfile />
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" sx={{ width: drawerWidth, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing:'border-box' } }}>
        <Toolbar/>
        <Box sx={{ p:2 }}>
          <Box sx={{ fontWeight: 700, fontFamily: 'Montserrat, Inter, sans-serif' }}>AIPS</Box>
          <Box sx={{ fontSize: 12, opacity: .7 }}>AI‑Enhanced Packaging Scheduler</Box>
        </Box>
        <List>
          {nav.map(n => (
            <ListItemButton key={n.to} component={Link as any} to={n.to} selected={loc.pathname === n.to}>
              <ListItemText primary={n.label}/>
            </ListItemButton>
          ))}
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow:1, p: 3, mt: 8 }}>
        {children}
      </Box>
    </Box>
  )
}
