import { Box } from '@mui/material'

export default function StatusPulse(){
  return (
    <Box sx={{ display:'inline-flex', alignItems:'center', gap:1 }}>
      <Box sx={{
        width: 10, height: 10, borderRadius:'50%',
        background: 'rgba(1,209,209,0.9)',
        boxShadow: '0 0 8px rgba(1,209,209,0.8)',
        position:'relative',
        '&::after': {
          content:'""', position:'absolute', inset:-6, borderRadius:'50%',
          border:'1px solid rgba(1,209,209,0.5)', animation:'pulse 1.6s infinite ease-out'
        },
        '@keyframes pulse': { '0%': { opacity:1, transform:'scale(0.8)' }, '100%': { opacity:0, transform:'scale(1.6)' } }
      }}/>
      <Box sx={{ fontSize: 12, opacity: 0.8 }}>System Online</Box>
    </Box>
  )
}
