import { Box, Button, Typography, Paper, Container } from '@mui/material'
import { LoginRounded, BusinessRounded, SecurityRounded } from '@mui/icons-material'
import { useAuth } from './useAuth'

export default function LoginPage() {
  const { login } = useAuth()

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2
      }}
    >
      <Container maxWidth="sm">
        <Paper 
          elevation={24}
          sx={{ 
            padding: 6,
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(1, 209, 209, 0.2)',
            borderRadius: 3,
            textAlign: 'center'
          }}
        >
          {/* Logo/Header */}
          <Box sx={{ mb: 4 }}>
            <BusinessRounded sx={{ fontSize: 60, color: '#01D1D1', mb: 2 }} />
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#01D1D1', mb: 1 }}>
              AIPS
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
              AI-Powered Production Scheduler
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              Secure access required
            </Typography>
          </Box>

          {/* Features */}
          <Box sx={{ mb: 4, textAlign: 'left' }}>
            <Typography variant="h6" sx={{ color: '#01D1D1', mb: 2, textAlign: 'center' }}>
              Production Management Platform
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <SecurityRounded sx={{ color: '#01D1D1', mr: 2, fontSize: 20 }} />
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Secure role-based access control
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <BusinessRounded sx={{ color: '#01D1D1', mr: 2, fontSize: 20 }} />
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Real-time production scheduling
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <BusinessRounded sx={{ color: '#01D1D1', mr: 2, fontSize: 20 }} />
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Operator competency management
              </Typography>
            </Box>
          </Box>

          {/* Login Button */}
          <Button
            variant="contained"
            size="large"
            startIcon={<LoginRounded />}
            onClick={login}
            sx={{
              backgroundColor: '#01D1D1',
              color: '#000',
              fontWeight: 600,
              fontSize: '1.1rem',
              padding: '12px 32px',
              borderRadius: 2,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#00B8B8',
                boxShadow: '0 8px 25px rgba(1, 209, 209, 0.3)',
              },
              '&:active': {
                transform: 'translateY(1px)',
              }
            }}
          >
            Sign In to AIPS
          </Button>

          <Typography variant="caption" sx={{ display: 'block', mt: 3, color: 'rgba(255,255,255,0.5)' }}>
            Powered by Auth0 • Enterprise-grade security
          </Typography>
        </Paper>
      </Container>
    </Box>
  )
}
