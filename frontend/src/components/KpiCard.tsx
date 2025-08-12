import { Box, Typography } from '@mui/material'
import GlassCard from './GlassCard'

export default function KpiCard({ label, value, sub }: { label: string, value: string | number, sub?: string }){
  return (
    <GlassCard sx={{ minWidth: 220 }}>
      <Box sx={{ fontSize: 12, opacity: 0.7 }}>{label}</Box>
      <Typography variant="h4" sx={{ mt: 0.5 }}>{value}</Typography>
      {sub && <Box sx={{ fontSize: 12, opacity: 0.6, mt: .5 }}>{sub}</Box>}
    </GlassCard>
  )
}
