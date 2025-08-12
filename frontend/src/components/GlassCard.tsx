import { Paper, PaperProps, Box } from '@mui/material'

export default function GlassCard({ children, ...props }: PaperProps){
  return (
    <Paper elevation={0} {...props}>
      <Box sx={{
        position:'absolute', top:0, left:0, right:0, height:2,
        background: 'linear-gradient(90deg, rgba(1,209,209,0.0), rgba(1,209,209,0.8), rgba(1,209,209,0.0))',
        animation: 'glint 3s linear infinite'
      }}/>
      <Box sx={{ p: 2 }}>
        {children}
      </Box>
      <style>{`@keyframes glint { 0% { transform: translateX(-50%) } 100% { transform: translateX(50%) } }`}</style>
    </Paper>
  )
}
