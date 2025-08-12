import { Box, Grid } from '@mui/material'
import KpiCard from '../components/KpiCard'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'

const data = [
  { line: 'Line 1', planned: 1200, produced: 1140 },
  { line: 'Line 2', planned: 1000, produced: 960 },
  { line: 'Line 3', planned: 1100, produced: 1045 }
]

export default function Reports(){
  return (
    <Box>
      <Grid container spacing={2} sx={{ mb:2 }}>
        <Grid item><KpiCard label="Units Planned" value={5200}/></Grid>
        <Grid item><KpiCard label="Units Produced" value={4950}/></Grid>
        <Grid item><KpiCard label="% to Plan" value="95.2%"/></Grid>
        <Grid item><KpiCard label="OEE (A×P×Q)" value="86%"/></Grid>
        <Grid item><KpiCard label="Week Projection" value={26000}/></Grid>
        <Grid item><KpiCard label="Status" value="At‑Risk"/></Grid>
      </Grid>
      <Box sx={{ height: 280, bgcolor:'rgba(255,255,255,0.02)', border:'1px solid rgba(1,209,209,0.2)', borderRadius: 2 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="line" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="planned" />
            <Bar dataKey="produced" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  )
}
