import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import {
  Box,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Divider,
  ListItemIcon,
  Chip
} from '@mui/material'
import {
  AccountCircle,
  ExitToApp,
  Person,
  Badge,
  Settings
} from '@mui/icons-material'
import { useAuth } from './useAuth'

export default function UserProfile() {
  const { user, logout, isAuthenticated, getUserRoles } = useAuth()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [userRoles, setUserRoles] = useState<string[]>([])
  const open = Boolean(anchorEl)

  // Fetch user roles
  useEffect(() => {
    if (isAuthenticated) {
      getUserRoles().then(setUserRoles)
    }
  }, [isAuthenticated, getUserRoles])

  // Fetch detailed user profile from backend
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await api.get('/auth/user')
      return response.data
    },
    enabled: isAuthenticated
  })

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    handleClose()
    logout()
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <Box>
      <IconButton
        onClick={handleClick}
        size="small"
        sx={{ 
          ml: 2,
          border: '1px solid rgba(1, 209, 209, 0.3)',
          '&:hover': {
            backgroundColor: 'rgba(1, 209, 209, 0.1)',
            borderColor: '#01D1D1'
          }
        }}
      >
        <Avatar 
          src={user.picture} 
          sx={{ 
            width: 32, 
            height: 32,
            backgroundColor: '#01D1D1',
            color: '#000',
            fontSize: '0.9rem',
            fontWeight: 600
          }}
        >
          {user.name.charAt(0).toUpperCase()}
        </Avatar>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 8,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            backgroundColor: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(1, 209, 209, 0.2)',
            borderRadius: 2,
            minWidth: 280,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              backgroundColor: 'rgba(30, 30, 30, 0.95)',
              border: '1px solid rgba(1, 209, 209, 0.2)',
              borderRight: 'none',
              borderBottom: 'none',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* User Info */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Avatar 
              src={user.picture}
              sx={{ 
                width: 40, 
                height: 40, 
                mr: 1.5,
                backgroundColor: '#01D1D1',
                color: '#000'
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#01D1D1' }}>
                {user.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                {user.email}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {(userProfile?.roles || userRoles || ['operator']).map((role: string) => (
              <Chip
                key={role}
                label={role.charAt(0).toUpperCase() + role.slice(1)}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  backgroundColor: 'rgba(1, 209, 209, 0.1)',
                  color: '#01D1D1',
                  border: '1px solid rgba(1, 209, 209, 0.3)'
                }}
              />
            ))}
          </Box>
        </Box>

        <Divider sx={{ borderColor: 'rgba(1, 209, 209, 0.2)' }} />

        {/* Menu Items */}
        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <Person sx={{ color: '#01D1D1' }} />
          </ListItemIcon>
          <Typography variant="body2">My Profile</Typography>
        </MenuItem>

        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <Badge sx={{ color: '#01D1D1' }} />
          </ListItemIcon>
          <Typography variant="body2">My Skills</Typography>
        </MenuItem>

        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <Settings sx={{ color: '#01D1D1' }} />
          </ListItemIcon>
          <Typography variant="body2">Settings</Typography>
        </MenuItem>

        <Divider sx={{ borderColor: 'rgba(1, 209, 209, 0.2)' }} />

        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <ExitToApp sx={{ color: '#ff6b6b' }} />
          </ListItemIcon>
          <Typography variant="body2" sx={{ color: '#ff6b6b' }}>
            Sign Out
          </Typography>
        </MenuItem>
      </Menu>
    </Box>
  )
}
