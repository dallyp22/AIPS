import { Box, CircularProgress, Typography } from '@mui/material'

export default function AuthLoadingScreen() {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        color: '#01D1D1'
      }}
    >
      <Box sx={{ mb: 3 }}>
        <CircularProgress 
          size={60} 
          sx={{ 
            color: '#01D1D1',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            }
          }} 
        />
      </Box>
      
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
        AIPS
      </Typography>
      
      <Typography variant="body1" sx={{ opacity: 0.8 }}>
        AI-Powered Production Scheduler
      </Typography>
      
      <Typography variant="body2" sx={{ opacity: 0.6, mt: 2 }}>
        Authenticating...
      </Typography>
    </Box>
  )
}
